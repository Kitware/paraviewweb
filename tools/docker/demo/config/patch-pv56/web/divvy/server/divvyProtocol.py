r"""
    ParaViewWeb protocol to satisfy RPC and publish/subscribe requests from Divvy

"""
from __future__ import absolute_import, division, print_function

import os, math

# import paraview modules.
from paraview.web.protocols import ParaViewWebProtocol
from paraview import simple
# import RPC annotation
from wslink import register as exportRpc

# data, math
import vtk, vtk.util.numpy_support
from vtk.util.numpy_support import vtk_to_numpy, numpy_to_vtk

import numpy as np

NUMERIC_TYPES = {
  'char': True,
  'unsigned_char': True,
  'short': True,
  'unsigned_short': True,
  'int': True,
  'unsigned_int': True,
  'long': True,
  'unsigned_long': True,
  'float': True,
  'double': True,
  'id_type': True,
  'signed_char': True
}

scoreDefinitions = [
  { 'name': 'Examine', 'color': '#66c2a5', 'value': 1 },
  { 'name': 'Great', 'color': '#fc8d62', 'value': 2 },
  { 'name': 'Neutral', 'color': '#8da0cb', 'value': 3 },
  { 'name': 'Bland', 'color': '#e78ac3', 'value': 4 },
  { 'name': 'Other', 'color': '#a6d854', 'value': 5 }
  # { 'name': 'none', 'color': '#999999', 'value': 6}
]
# set 'index' key from list order.
for i in range(len(scoreDefinitions)):
    scoreDefinitions[i]['index'] = i

USER_SELECTION = "user selection"
UNSELECTED_INDEX = len(scoreDefinitions)


def fillTableWithDataSet(table, dataset):
  if not dataset:
    return
  nbRows = table.GetNumberOfRows()
  print('Table size', nbRows)
  if dataset.IsA('vtkMultiBlockDataSet') :
    nbBlocks = dataset.GetNumberOfBlocks()
    if nbBlocks:
      for bIdx in range(nbBlocks):
        fillTableWithDataSet(table, dataset.GetBlock(bIdx))
  elif dataset.IsA('vtkTable'):
    if nbRows == 0 or nbRows == dataset.GetNumberOfRows():
      nbColumns = dataset.GetNumberOfColumns()
      for cIdx in range(nbColumns):
        table.AddColumn(dataset.GetColumn(cIdx))
  elif dataset:
    if nbRows == 0 or nbRows == dataset.GetNumberOfPoints():
      pd = dataset.GetPointData()
      # Handle mesh xyz
      nbPoints = dataset.GetNumberOfPoints()
      coords = [0, 0, 0]
      xCoord = vtk.vtkFloatArray()
      xCoord.SetName('x Mesh')
      xCoord.SetNumberOfTuples(nbPoints)
      table.AddColumn(xCoord)
      yCoord = vtk.vtkFloatArray()
      yCoord.SetName('y Mesh')
      yCoord.SetNumberOfTuples(nbPoints)
      table.AddColumn(yCoord)
      zCoord = vtk.vtkFloatArray()
      zCoord.SetName('z Mesh')
      zCoord.SetNumberOfTuples(nbPoints)
      table.AddColumn(zCoord)
      for pIdx in range(nbPoints):
        dataset.GetPoints().GetPoint(pIdx, coords)
        xCoord.SetTuple1(pIdx, coords[0])
        yCoord.SetTuple1(pIdx, coords[1])
        zCoord.SetTuple1(pIdx, coords[2])

      # Handle point data
      for aIdx in range(pd.GetNumberOfArrays()):
        array = pd.GetArray(aIdx)
        if array.GetNumberOfComponents() == 1:
          table.AddColumn(pd.GetArray(aIdx))
        else:
          nbTuples = array.GetNumberOfTuples()
          magnitudeArray = array.NewInstance()
          magnitudeArray.SetName('Magnitude of %s' % array.GetName())
          magnitudeArray.SetNumberOfTuples(nbTuples)
          tupleHolder = list(range(array.GetNumberOfComponents()))
          for tIdx in range(nbTuples):
            array.GetTuple(tIdx, tupleHolder)
            mag = 0
            for el in tupleHolder:
              mag += el * el
            mag = math.sqrt(mag)
            magnitudeArray.SetTuple1(tIdx, mag)
          table.AddColumn(magnitudeArray)


# =============================================================================
# Respond to all RPC requests and publish data to a Divvy client
# =============================================================================
class DivvyProtocol(ParaViewWebProtocol):
  def __init__(self, inputFile):
    super(DivvyProtocol, self).__init__()
    self.inputFile = inputFile
    self.dataTable = None
    self.dataTableSelection = None
    self.dataMesh = None
    # if we calc a full histogram, cache it
    self.hist2DCache = {}
    self.hist1DCache = {}
    # the active annotation defined which rows are selected.
    self.activeAnnot = None
    self.selectedRows = None
    # which pairs need 2D histograms of the active annotation?
    self.lastHist2DList = None
    self.numBins = 32

  def getData(self):
    return self.dataTable

  def getDataWithSelection(self):
    return self.dataTableSelection

  def getMesh(self):
    return self.dataMesh

  def setScatterPlot(self, sp):
    self.scatterPlot = sp

  # return a dictionary of numeric column names and their ranges, plus other initialization info.
  @exportRpc('divvy.fields.get')
  def getFields(self):
    if not self.dataTable:
      # read a data file
      if '.csv' in self.inputFile:
        r = vtk.vtkDelimitedTextReader()
        r.DetectNumericColumnsOn()
        r.SetFileName(self.inputFile)
        r.SetHaveHeaders(True)
        r.Update()
        self.dataTable = r.GetOutput()
      else:
        reader = simple.OpenDataFile(self.inputFile)
        reader.UpdatePipeline()
        ds = reader.GetClientSideObject().GetOutputDataObject(0)
        self.dataMesh = ds
        if ds.IsA('vtkTable'):
          self.dataTable = ds
        else:
          self.dataTable = vtk.vtkTable()
          fillTableWithDataSet(self.dataTable, ds)


    self.fields = {}
    self.columnNames = []
    self.numRows = self.dataTable.GetNumberOfRows()
    for i in range(self.dataTable.GetNumberOfColumns()):
      # Add a range for any numeric fields
      self.columnNames.append(self.dataTable.GetColumnName(i))
      arr = self.dataTable.GetColumn(i)
      if arr.GetDataTypeAsString() in NUMERIC_TYPES:
        self.fields[self.columnNames[i]] = { 'range': list(arr.GetRange()) }

    self.initializeSelection()

    return {
      'fields': self.fields,
      'scores': scoreDefinitions,
      'numRows': self.numRows,
      'hasMesh': True if self.getMesh() else False
    }

  def initializeSelection(self):
    if not self.dataTableSelection:
      self.dataTableSelection = vtk.vtkTable()
      self.dataTableSelection.ShallowCopy(self.dataTable)
      self._userSelection = vtk.vtkUnsignedCharArray()
      self._userSelection.SetNumberOfTuples(self.numRows)
      self._userSelection.SetName(USER_SELECTION)
      self._userSelection.FillComponent(0, UNSELECTED_INDEX)
      self.dataTableSelection.AddColumn(self._userSelection)

  def SetSelection(self, selection):
    if (not selection) or (self._userSelection.GetNumberOfTuples() > 0 and selection.GetNumberOfTuples() != self._userSelection.GetNumberOfTuples()):
      self._userSelection.FillComponent(0, UNSELECTED_INDEX)
      return
    self._userSelection.DeepCopy(selection)
    self._userSelection.SetName(USER_SELECTION)


  @exportRpc('divvy.available.scores')
  def getAvailableScores(self):
      """Request the list of scores that can be applied to selections to create an annotation.

      The result is an array of dictionaries, each of which contains:
      + **name**: A text string naming the score,
      + **value**: A numeric value assigned to the score and used for objective functions,
      + **index**: The index of the score in this array (useful for reverse lookups), and
      + **color**: A color to use for the score expressed as a hexadecimal constant.
      """
      return scoreDefinitions

  def getScoreByIndex(self, index):
    return scoreDefinitions[index]

  def getScoreValue(self, index):
    return scoreDefinitions[index]['value']

  def calc1DHistogram(self, vtkX, xrng, numBins):
    result = np.zeros(numBins)
    px = vtk_to_numpy(vtkX)
    # ix = np.clip(np.floor((px - xrng[0]) * numBins / (xrng[1] - xrng[0])).astype(int), 0, numBins - 1)
    # indices, counts = np.unique(ix, return_counts = True)
    # for i in range(len(indices)):
    #   result[indices[i]] = counts[i]
    result = np.histogram(px, bins=numBins)[0]
    # make it json serializable
    return result.tolist()

  def get1DHistogram(self, key):
    numBins = self.numBins
    hist1D = None
    vtkX = self.dataTable.GetColumnByName(key)
    xrng = vtkX.GetRange()
    if xrng[0] == xrng[1]:
      xrng = (xrng[0], xrng[0] + 1)
    if key in self.hist1DCache:
      hist1D = self.hist1DCache[key]
    else:
      hist1D = self.calc1DHistogram(vtkX, xrng, numBins)
      self.hist1DCache[key] = hist1D
    result = {
      'name': key,
      'min': xrng[0],
      'max': xrng[1],
      'counts': hist1D,
    }

    return result


  def calc2DHistogram(self, key, numBins):
    result = np.zeros((numBins, numBins))
    # print(key[0], key[1])
    vtkX = self.dataTable.GetColumnByName(key[0])
    vtkY = self.dataTable.GetColumnByName(key[1])
    xrng = vtkX.GetRange()
    yrng = vtkY.GetRange()

    px = vtk_to_numpy(vtkX)
    py = vtk_to_numpy(vtkY)
    # clip puts maximum values into the last bin
    # ix = np.clip(np.floor((px - xrng[0]) * numBins / (xrng[1] - xrng[0])).astype(int), 0, numBins - 1)
    # iy = np.clip(np.floor((py - yrng[0]) * numBins / (yrng[1] - yrng[0])).astype(int), 0, numBins - 1)
    # for i, j in zip(ix, iy):
    #     result[i,j] += 1
    result = np.histogram2d(px, py, bins=numBins, range=[xrng, yrng])[0]
    return result

  def format2DHistogramResult(self, pair, hist2D, annot=None, inScore=None, inVtkX=None, inVtkY=None, inXrng=None, inYrng=None):
    numBins = self.numBins
    vtkX = inVtkX if inVtkX else self.dataTable.GetColumnByName(pair[0])
    vtkY = inVtkY if inVtkY else self.dataTable.GetColumnByName(pair[1])
    xrng = inXrng if inXrng else vtkX.GetRange()
    yrng = inYrng if inYrng else vtkY.GetRange()
    score = inScore if inScore else 0
    dx = float(xrng[1] - xrng[0]) / numBins
    dy = float(yrng[1] - yrng[0]) / numBins

    histIter = np.nditer(hist2D, flags=['multi_index'])
    result = {
      'x': {'name': pair[0], 'extent':xrng, 'delta':dx, 'mtime': vtkX.GetMTime() },
      'y': {'name': pair[1], 'extent':yrng, 'delta':dy, 'mtime': vtkY.GetMTime() },
      'numberOfBins': numBins,
      'bins': [ {
                  'x':xrng[0] + histIter.multi_index[0] * dx,
                  'y':yrng[0] + histIter.multi_index[1] * dy,
                  'count':int(bval)
              } for bval in histIter if bval > 0 ],
    }
    if annot:
      result['annotationInfo'] = {
        'annotation': annot['id'] if 'id' in annot else 'unknown',
        'annotationGeneration': annot['generation'],
        'selectionGeneration': annot['selection']['generation']
      }
      result['role'] = { 'type': 'selected', 'score': score }
    else:
      result['role'] = { 'type': 'complete', 'score': -1 }
    return result


  def get2DHistogram(self, pair):
    numBins = self.numBins
    swap = pair[1] < pair[0]
    key = (pair[1], pair[0]) if swap else (pair[0], pair[1])
    hist2D = None
    if key in self.hist2DCache:
      hist2D = self.hist2DCache[key]
    else:
      hist2D = self.calc2DHistogram(key, numBins)
      self.hist2DCache[key] = hist2D
    if swap:
      hist2D = hist2D.T
    # Client expects a sparse representation => hist2Ds
    result = self.format2DHistogramResult(pair, hist2D)
    return result

  # given a list of pairs of names from self.fields, calc and publish 2D histograms
  @exportRpc('divvy.histograms.request')
  def requestHistograms(self, request):
    # print(request)
    if 'hist2D' in request:
      for pair in request['hist2D']:
        result = self.get2DHistogram(pair)
        self.publish('divvy.histogram2D.push', { 'name': pair, 'data': result })
    if 'hist1D' in request:
      for field in request['hist1D']:
        result = self.get1DHistogram(field)
        self.publish('divvy.histogram1D.push', { 'name': field, 'data': result })

    return { 'success': True }

  # whenever the annotation changes, see if we can generate 2D histograms
  # for its selection from this list (for Parallel Coords)
  @exportRpc('divvy.histograms.annotation.request')
  def requestAnnotationHistograms(self, request):
    if 'hist2D' in request:
      self.lastHist2DList = request['hist2D']
    return { 'success': True }

  def pushCountsForActiveAnnotation(self, annot):
      """Return an array of counts for each score."""
      # get unique list of score indices from annot, and the unselected index.
      # can't use this easy way, because return_counts isn't in numpy 1.8, only 1.9+
      # counts = np.array(np.unique(selRows,return_counts=True)).T

      uniqueScores = np.unique(annot['score'])
      counts = np.zeros(len(uniqueScores) + 1)
      selRows = self.selectedRows['data']
      for i in range(len(uniqueScores)):
        counts[i] = np.sum(selRows == uniqueScores[i])
      # anything left is unselected.
      counts[-1] = self.numRows - np.sum(counts)

      seln = annot['selection']
      # annoInfo is information we tack onto the push notification so that
      # responders can avoid presenting stale or out-of-order results:
      annoInfo = [ {
          'annotation': annot['id'] if 'id' in annot else 'unknown',
          'annotationGeneration': annot['generation'],
          'selectionGeneration': annot['selection']['generation']
          } ]
      # numpy.int64 isn't json serializable on windows. Cast to int.
      for i in range(len(uniqueScores)):
        scoreIndex = int(uniqueScores[i])
        result = {
          'type': 'counts',
          'data': {
            'annotationInfo': annoInfo[0] if len(annoInfo) == 1 else annoInfo,
            'role': { 'selected': True, 'score': scoreIndex },
            'count': int(counts[i]),
            'total': self.numRows
            }
          }
        self.publish('divvy.selection.count.push', result)

  @exportRpc('divvy.annotation.update')
  def updateAnnotation(self, annot):
    numBins = self.numBins
    # print(annot)
    prevAnnot = self.activeAnnot
    self.activeAnnot = annot
    # {
    #   'id': '301fc0e7-80fe-4f3d-9d77-bcffa8f8f3bc', 'generation': 2,
    #   'selection': {
    #     'type': 'range', 'generation': 2, 'range': {
    #     'variables': {
    #       'CH4': [{
    #         'interval': [0.0003562899441340782, 0.0009054340782122905], 'endpoints': '**'
    #         }]
    #       }
    #     }
    #   },
    #   'score': [0], 'weight': 1, 'rationale': '', 'name': 'CH4 (range)', 'readOnly': False
    # }
    # {
    # 'id': 'cb1178c0-1932-4856-9d58-4ca042a2e6d3', 'generation': 19,
    # 'selection': {
    #   'type': 'partition', 'generation': 19,
    #   'partition': {
    #     'variable': 'CH4', 'dividers': [{
    #       'value': 0.00018690694444444442, 'uncertainty': 0, 'closeToLeft': False}, {
    #       'value': 0.0007313749999999999, 'uncertainty': 0, 'closeToLeft': False}, {
    #       'value': 0.0010320513888888887, 'uncertainty': 0, 'closeToLeft': False}
    #     ]}
    #   },
    # 'score': [3, 0, 1, 4], 'weight': 1, 'rationale': '', 'name': 'CH4 (partition)', 'readOnly': False
    # }
    selectionType = annot['selection']['type']
    if selectionType == 'range':
      myVars = annot['selection']['range']['variables']
      # get the annot's score, or the first score by default.
      annotScore = annot['score'][0] if len(annot['score']) > 0 else 0

      colResult = []
      for var in myVars:
        # retrieve the column
        vtkcol = self.dataTable.GetColumnByName(var);

        if not vtkcol:
          print('missing data column', vtkcol)
          continue
        col = vtk_to_numpy(vtkcol)
        insideInterval = []
        for region in myVars[var]:
          # data must be inside the interval. TODO: endpoint '*' is closed, 'o' is open.
          interval = region['interval'] if 'interval' in region else [0, 1]
          insideInterval.append(np.all([interval[0] <= col, col <= interval[1]], axis=0))
        # data can be inside any interval in this column
        colResult.append(np.any(insideInterval, axis=0))
      # Row must be inside all columns to be selected.
      labeledRows = np.all(colResult, axis=0)

      # convert true to the annotScore's index. convert false to the unselected index.
      labeledRows = np.array(list(map(lambda x: annotScore if x else UNSELECTED_INDEX, labeledRows))).astype(np.uint8)

      self.selectedRows = { 'score': [annotScore], 'data': labeledRows.astype(np.uint8) }
      # print('Selected row count:', np.sum(self.selectedRows['data'] == annotScore), 'scoreIndex', annotScore)
    elif selectionType == 'partition':
      # partitions label all the rows in a column with their scores.
      var = annot['selection']['partition']['variable']
      # retrieve the column
      vtkcol = self.dataTable.GetColumnByName(var);

      if not vtkcol:
        print('missing data column', vtkcol)
        return { 'success': False }

      col = vtk_to_numpy(vtkcol)
      dividers = annot['selection']['partition']['dividers']
      divVals = [d['value'] for d in dividers]

      # first determine which partition each row is in. For each divider, see if a row is underneath, and add to it's count
      # flip (via subtract) to label them inside partition 1, 2, 3 ...
      # TODO handle 'closeToLeft', which will use <=
      if len(divVals):
        labeledRows = np.uint8(len(divVals) + 1) - np.sum([col < val for val in divVals], axis=0).astype(np.uint8)
      else:
        labeledRows = np.ones(len(col)).astype(np.uint8)
      annotScores = annot['score']
      if len(annotScores) == len(divVals) + 1:
        # convert the region label to a score, via a map.
        scoreMap = { (i + 1): annotScores[i] for i in range(len(annotScores)) }
        labeledRows = np.array(list(map(lambda x: scoreMap[x] if x in scoreMap else 0, labeledRows))).astype(np.uint8)
      self.selectedRows = { 'score': np.unique(annotScores).tolist(), 'data': labeledRows }

    else:
      print('empty selection')
      self.selectedRows = { 'score': [UNSELECTED_INDEX], 'data': np.zeros(self.numRows) }

    # translate selection into VTK data, for use by scatterplot
    self.SetSelection(numpy_to_vtk(self.selectedRows['data']))
    self.scatterPlot.setActiveAnnotation(annot)
    # count selected rows, for count toolbar.
    self.pushCountsForActiveAnnotation(annot)

    # if someone is listening to hist2D selections....
    if self.lastHist2DList:
      # for range selections, this happens once. For partitions, several times.
      for score in self.selectedRows['score']:
        # find the indices of the selected rows (flagged with score)
        selIndices = np.where(np.in1d(self.selectedRows['data'], [score]))
        for pair in self.lastHist2DList:

          vtkX = self.dataTable.GetColumnByName(pair[0])
          vtkY = self.dataTable.GetColumnByName(pair[1])
          xrng = vtkX.GetRange()
          yrng = vtkY.GetRange()
          x = vtk_to_numpy(vtkX)
          y = vtk_to_numpy(vtkY)
          dx = float(xrng[1] - xrng[0]) / numBins
          dy = float(yrng[1] - yrng[0]) / numBins
          # sub-set the columns to the selected rows, then calc histogram.
          bins = np.histogram2d(x[selIndices], y[selIndices], bins=numBins, range=[xrng, yrng])[0]
          result = self.format2DHistogramResult(pair, bins, annot, score, vtkX, vtkY, xrng, yrng)
          self.publish('divvy.histogram2D.push', { 'type': 'histogram2d', 'data': result, 'selection': True, })

    return { 'success': True }
