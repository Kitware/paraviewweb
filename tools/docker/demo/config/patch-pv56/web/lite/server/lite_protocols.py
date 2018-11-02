import os, time

from wslink import register as exportRpc

from paraview import simple, servermanager
from paraview.web import protocols as pv_protocols

from vtkmodules.vtkCommonCore import vtkUnsignedCharArray, vtkCollection
from vtkmodules.vtkCommonDataModel import vtkImageData
from vtkmodules.vtkPVClientServerCoreRendering import vtkPVRenderView
from vtkmodules.vtkPVServerManagerRendering import vtkSMPVRepresentationProxy, vtkSMTransferFunctionProxy, vtkSMTransferFunctionManager
from vtkmodules.vtkWebCore import vtkDataEncoder

class ParaViewLite(pv_protocols.ParaViewWebProtocol):
    def __init__(self, **kwargs):
      super(pv_protocols.ParaViewWebProtocol, self).__init__()
      self.lineContext = None

    @exportRpc("paraview.lite.proxy.name")
    def getProxyName(self, pid):
      proxy = self.mapIdToProxy(pid)
      return {
        'id': pid,
        'group': proxy.GetXMLGroup(),
        'name': proxy.GetXMLName(),
        'label': proxy.GetXMLLabel(),
      }

    @exportRpc("paraview.lite.camera.get")
    def getCamera(self, viewId):
      view = self.getView(viewId)
      bounds = [-1, 1, -1, 1, -1, 1]

      if view and view.GetClientSideView().GetClassName() == 'vtkPVRenderView':
        rr = view.GetClientSideView().GetRenderer()
        bounds = rr.ComputeVisiblePropBounds()

      return {
        'id': viewId,
        'bounds': bounds,
        'position': tuple(view.CameraPosition),
        'viewUp': tuple(view.CameraViewUp),
        'focalPoint': tuple(view.CameraFocalPoint),
        'centerOfRotation': tuple(view.CenterOfRotation),
      }

    @exportRpc("paraview.lite.lut.get")
    def getLookupTableForArrayName(self, name, numSamples = 255):
      lutProxy = simple.GetColorTransferFunction(name)
      lut = lutProxy.GetClientSideObject()
      dataRange = lut.GetRange()
      delta = (dataRange[1] - dataRange[0]) / float(numSamples)

      colorArray = vtkUnsignedCharArray()
      colorArray.SetNumberOfComponents(3)
      colorArray.SetNumberOfTuples(numSamples)

      rgb = [ 0, 0, 0 ]
      for i in range(numSamples):
          lut.GetColor(dataRange[0] + float(i) * delta, rgb)
          r = int(round(rgb[0] * 255))
          g = int(round(rgb[1] * 255))
          b = int(round(rgb[2] * 255))
          colorArray.SetTuple3(i, r, g, b)

      # Add the color array to an image data
      imgData = vtkImageData()
      imgData.SetDimensions(numSamples, 1, 1)
      aIdx = imgData.GetPointData().SetScalars(colorArray)

      # Use the vtk data encoder to base-64 encode the image as png, using no compression
      encoder = vtkDataEncoder()
      # two calls in a row crash on Windows - bald timing hack to avoid the crash.
      time.sleep(0.01);
      b64Str = encoder.EncodeAsBase64Jpg(imgData, 100)

      return { 'image': 'data:image/jpg;base64,' + b64Str, 'range': dataRange, 'name': name }


    @exportRpc("paraview.lite.lut.range.update")
    def updateLookupTableRange(self, arrayName, dataRange):
      lutProxy = simple.GetColorTransferFunction(arrayName)
      vtkSMTransferFunctionProxy.RescaleTransferFunction(lutProxy.SMProxy, dataRange[0], dataRange[1], False)
      self.getApplication().InvokeEvent('UpdateEvent')


    @exportRpc("paraview.lite.lut.preset")
    def getLookupTablePreset(self, presetName, numSamples = 512):
      lutProxy = simple.GetColorTransferFunction('__PRESET__')
      lutProxy.ApplyPreset(presetName, True)
      lut = lutProxy.GetClientSideObject()
      dataRange = lut.GetRange()
      delta = (dataRange[1] - dataRange[0]) / float(numSamples)

      colorArray = vtkUnsignedCharArray()
      colorArray.SetNumberOfComponents(3)
      colorArray.SetNumberOfTuples(numSamples)

      rgb = [ 0, 0, 0 ]
      for i in range(numSamples):
          lut.GetColor(dataRange[0] + float(i) * delta, rgb)
          r = int(round(rgb[0] * 255))
          g = int(round(rgb[1] * 255))
          b = int(round(rgb[2] * 255))
          colorArray.SetTuple3(i, r, g, b)

      # Add the color array to an image data
      imgData = vtkImageData()
      imgData.SetDimensions(numSamples, 1, 1)
      aIdx = imgData.GetPointData().SetScalars(colorArray)

      # Use the vtk data encoder to base-64 encode the image as png, using no compression
      encoder = vtkDataEncoder()
      # two calls in a row crash on Windows - bald timing hack to avoid the crash.
      time.sleep(0.01);
      b64Str = encoder.EncodeAsBase64Jpg(imgData, 100)

      return { 'name': presetName, 'image': 'data:image/jpg;base64,' + b64Str }


    @exportRpc("paraview.lite.lut.set.preset")
    def applyPreset(self, arrayName, presetName):
      lutProxy = simple.GetColorTransferFunction(arrayName)
      lutProxy.ApplyPreset(presetName, True)
      self.getApplication().InvokeEvent('UpdateEvent')


    @exportRpc("paraview.lite.context.line.set")
    def updateLineContext(self, visible = False, p1 = [0, 0, 0], p2 = [1, 1, 1]):
      if not self.lineContext:
        self.lineContext = servermanager.extended_sources.HighResolutionLineSource(Resolution=2, Point1=p1, Point2=p2)
        self.lineRepresentation = simple.Show(self.lineContext)

      self.lineRepresentation.Visibility = 1 if visible else 0
      self.lineContext.Point1 = p1
      self.lineContext.Point2 = p2

      self.getApplication().InvokeEvent('UpdateEvent')

      return self.lineContext.GetGlobalIDAsString()


