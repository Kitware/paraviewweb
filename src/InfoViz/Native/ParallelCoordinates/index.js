import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

import d3 from 'd3';
import style from 'PVWStyle/InfoVizNative/ParallelCoordinates.mcss';
import axisControlSvg from './AxisControl-svg.html';
import iconImage from './ParallelCoordsIconSmall.png';
import htmlContent from './body.html';
import AxesManager from './AxesManager';

// ----------------------------------------------------------------------------
// Global
// ----------------------------------------------------------------------------

export function affine(inMin, val, inMax, outMin, outMax) {
  return (((val - inMin) / (inMax - inMin)) * (outMax - outMin)) + outMin;
}

export function perfRound(val) {
  return (0.5 + val) | 0;
}

export function dataToScreen(model, dataY, axis) {
  return perfRound(axis.isUpsideDown()
    ? affine(
        axis.range[0],
        dataY,
        axis.range[1],
        model.canvasArea.height - model.borderOffsetBottom,
        model.borderOffsetTop)
    : affine(
        axis.range[0],
        dataY,
        axis.range[1],
        model.borderOffsetTop,
        model.canvasArea.height - model.borderOffsetBottom));
}

export function screenToData(model, screenY, axis) {
  return axis.isUpsideDown()
    ? affine(
        model.canvasArea.height - model.borderOffsetBottom,
        screenY,
        model.borderOffsetTop,
        axis.range[0],
        axis.range[1])
    : affine(
        model.borderOffsetTop,
        screenY,
        model.canvasArea.height - model.borderOffsetBottom,
        axis.range[0],
        axis.range[1]);
}

// ----------------------------------------------------------------------------
// Parallel Coordinate
// ----------------------------------------------------------------------------

function parallelCoordinate(publicAPI, model) {
  function updateSizeInformation() {
    if (!model.canvas) {
      return;
    }
    model.canvasArea = {
      width: model.canvas.width,
      height: model.canvas.height,
    };
    model.drawableArea = {
      width: model.canvasArea.width - (model.borderOffsetLeft + model.borderOffsetRight),
      height: model.canvasArea.height - (model.borderOffsetTop + model.borderOffsetBottom),
    };
  }

  // -======================================================
  model.canvas = document.createElement('canvas');
  model.canvas.style.position = 'absolute';
  model.canvas.style.top = 0;
  model.canvas.style.right = 0;
  model.canvas.style.bottom = 0;
  model.canvas.style.left = 0;
  model.ctx = model.canvas.getContext('2d');

  model.fgCanvas = document.createElement('canvas');
  model.fgCtx = model.fgCanvas.getContext('2d');
  model.bgCanvas = document.createElement('canvas');
  model.bgCtx = model.bgCanvas.getContext('2d');

  model.axes = new AxesManager();
  model.histogramList = [];
  model.hoverBinData = [];

  function fetchSelectionData() {
    model.provider.resetSelectionHistogram2D();
    const fieldNames = model.axes.getAxesNames();
    for (let i = 1; i < fieldNames.length; i++) {
      model.provider.loadSelectionHistogram2D(fieldNames[i - 1], fieldNames[i]);
    }
    model.provider.applySelection(model.axes.getSelections());
  }

  function fetchData() {
    model.needData = true;

    if (model.provider) {
      let dataToLoadCount = 0;

      // Initialize axes
      if (model.provider.isA('FieldProvider')) {
        /* eslint-disable arrow-body-style */
        model.axes.updateAxes(model.provider.getActiveFields().map(name => {
          return {
            name,
            range: model.provider.getFieldRange(name),
          };
        }));
      }

      // Get the axes names
      const fieldNames = model.axes.getAxesNames();

      // Fetch 2D Histogram
      if (model.provider.isA('Histogram2DProvider')) {
        dataToLoadCount += fieldNames.length - 1;
        for (let i = 1; i < fieldNames.length; i++) {
          // Return true if the data is already loaded
          dataToLoadCount -= model.provider.loadHistogram2D(fieldNames[i - 1], fieldNames[i])
            ? 1 : 0;
        }
      }

      // Fetch Selection
      if (model.provider.isA('SelectionProvider')) {
        fetchSelectionData();
      }

      // Check if we can render or not
      model.needData = !!dataToLoadCount;

      if (!model.needData) {
        publicAPI.render();
      }
    }
  }

  function drawSelectionBars(selectionBarModel) {
    const svg = d3.select(model.container).select('svg');
    const selBarGroup = svg.select('g.selection-bars');

    // Make the selection bars
    const selectionBarNodes = selBarGroup
      .selectAll('rect.selection-bars')
      .data(selectionBarModel);

    selectionBarNodes
      .enter()
      .append('rect')
      .classed('selection-bars', true)
      .classed(style.selectionBars, true);

    selectionBarNodes.exit().remove();

    selBarGroup
      .selectAll('rect.selection-bars')
      .classed(style.controlItem, true)
      .attr('width', model.selectionBarWidth)
      .attr('height', (d, i) => {
        let barHeight = d.screenRangeY[1] - d.screenRangeY[0];
        if (barHeight < 0) {
          barHeight = d.screenRangeY[0] - d.screenRangeY[1];
        }
        return barHeight;
      })
      .attr('transform', (d, i) => {
        const startPoint = d.screenRangeY[0] > d.screenRangeY[1] ? d.screenRangeY[1] : d.screenRangeY[0];
        return `translate(${d.screenX - (model.selectionBarWidth / 2)}, ${startPoint})`;
      })
      .on('mousedown', function inner(d, i) {
        d3.event.preventDefault();
        const downCoords = d3.mouse(model.container);

        svg.on('mousemove', (md, mi) => {
          const moveCoords = d3.mouse(model.container);
          const deltaYScreen = moveCoords[1] - downCoords[1];
          const startPoint = d.screenRangeY[0] > d.screenRangeY[1] ? d.screenRangeY[1] : d.screenRangeY[0];
          d3.select(this).attr('transform', `translate(${d.screenX - (model.selectionBarWidth / 2)}, ${startPoint + deltaYScreen})`);
        });

        svg.on('mouseup', (md, mi) => {
          const upCoords = d3.mouse(model.container);
          const deltaYScreen = upCoords[1] - downCoords[1];
          const startPoint = d.screenRangeY[0] > d.screenRangeY[1] ? d.screenRangeY[1] : d.screenRangeY[0];
          let barHeight = d.screenRangeY[1] - d.screenRangeY[0];
          if (barHeight < 0) {
            barHeight = d.screenRangeY[0] - d.screenRangeY[1];
          }
          const newStart = startPoint + deltaYScreen;
          const newEnd = newStart + barHeight;
          svg.on('mousemove', null);
          svg.on('mouseup', null);

          const axis = model.axes.getAxis(d.index);
          model.axes.updateSelection(d.index, d.selectionIndex, screenToData(model, newStart, axis), screenToData(model, newEnd, axis));
        });
      });
  }

  function drawAxisControls(controlsDataModel) {
    // Manipulate the control widgets svg DOM
    const svg = d3
      .select(model.container)
      .select('svg')
      .select('g.axis-control-elements');

    const axisControlNodes = svg
      .selectAll('g.axis-control-elements')
      .data(controlsDataModel);

    axisControlNodes.enter()
      .append('g')
      .classed('axis-control-elements', true)
      .classed(style.axisControlElements, true)
      .html(axisControlSvg);

    axisControlNodes.exit().remove();

    const scale = 0.5;
    svg.selectAll('g.axis-control-elements')
      .classed(style.upsideDown, (d, i) => !d.orient)
      .classed(style.rightsideUp, (d, i) => d.orient)
      .attr('transform', function inner(d, i) {
        const elt = d3.select(this).select('g.axis-controls-group-container');
        const tx = d.centerX - ((elt.attr('width') * scale) / 2);
        const ty = d.centerY - ((elt.attr('height') * scale) / 2);
        return `translate(${tx}, ${ty}) scale(${scale})`;
      })
      .on('click', function inner(d, i) {
        const cc = d3.mouse(this);
        const elt = d3.select(this).select('g.axis-controls-group-container');
        const ratio = cc[0] / elt.attr('width');
        if (ratio < 0.28) {
          // left arrow click
          model.axes.swapAxes(i - 1, i);
          fetchData();
        } else if (ratio < 0.73) {
          // up/down click
          model.axes.toggleOrientation(i);
          publicAPI.render();
        } else {
          // right arrow click
          model.axes.swapAxes(i, i + 1);
          fetchData();
        }
      })
      .selectAll('.axis-controls-group-container')
      .classed(style.axisControlsGroupContainer, true);
  }

  function drawAxisLabels(labelDataModel) {
    const ypos = 15;
    const glyphPadding = 10;
    const svg = d3.select(model.container).select('svg');

    if (model.provider && model.provider.isA('LegendProvider')) {
      // Add legend key
      labelDataModel.forEach(entry => {
        entry.legend = model.provider.getLegend(entry.name);
      });
      let glyphSize = model.borderOffsetTop - glyphPadding - glyphPadding;
      if (glyphSize % 2 !== 0) {
        glyphSize++;
      }

      const glyphGroup = svg
        .selectAll('g.glyphs')
        .data(labelDataModel);

      glyphGroup.exit().remove();

      glyphGroup
        .enter()
        .append('g')
        .classed('glyphs', true);

      // Create nested structure
      const svgGroup = glyphGroup.selectAll('svg').data([0]);
      svgGroup.enter().append('svg');
      const useGroup = svgGroup.selectAll('use').data([0]);
      useGroup.enter().append('use');

      glyphGroup
        .attr('transform', (d, i) => `translate(${d.centerX - (glyphSize * 0.5)}, ${glyphPadding})`);

      glyphGroup
        .select('svg')
        .attr('fill', (d, i) => d.legend.color)
        .attr('width', glyphSize)
        .attr('height', glyphSize)
        .select('use')
        .data(labelDataModel)
        .attr('xlink:href', (d, i) => d.legend.shape);

      glyphGroup
        .on('click', (d, i) => {
          model.axes.clearSelection(i);
        });

      // Augment the legend glyphs with extra DOM for annotated axes
      const indicatorGroup = svg.select('g.axis-annotation-indicators');
      const indicatorNodes = indicatorGroup
        .selectAll('rect.axis-annotation-indicators')
        .data(labelDataModel);

      indicatorNodes
        .enter()
        .append('rect')
        .classed('axis-annotation-indicators', true)
        .classed(style.axisAnnotationIndicators, true);

      indicatorNodes.exit().remove();

      indicatorGroup
        .selectAll('rect.axis-annotation-indicators')
        .attr('width', glyphSize + 3)
        .attr('height', glyphSize + 3)
        .attr('transform', (d, i) => `translate(${d.centerX - (glyphSize * 0.5 + 1)}, ${glyphPadding - 1.5})`)
        .classed(style.axisAnnotated, (d, i) => d.annotated);
    } else {
      // Now manage the svg dom for the axis labels
      const axisLabelNodes = svg
        .selectAll('text.axis-labels')
        .data(labelDataModel);

      axisLabelNodes
        .enter()
        .append('text')
        .classed('axis-labels', true)
        .classed(style.axisLabels, true);

      axisLabelNodes
        .exit()
        .remove();

      svg
        .selectAll('text.axis-labels')
        .text((d, i) => d.name)
        .classed(style.annotatedAxisText, (d, i) => d.annotated)
        .on('click', (d, i) => {
          model.axes.clearSelection(i);
        }).
        attr('text-anchor', (d, i) => d.align).
        attr('transform', (d, i) => `translate(${d.centerX}, ${ypos})`);
    }

    // Update axis tick data model
    // --- is it used / needed ????
    //   const tickModel = [];
    //   for (let i = 0; i < axisList.length; ++i) {
    //     tickModel.push({
    //       value: orientationList[i] ? axesDataRanges[i][1] : axesDataRanges[i][0],
    //       xpos: axesCenters[i],
    //       ypos: borderOffset.top - 5,
    //       align: 'middle',
    //     });
    //     tickModel.push({
    //       value: orientationList[i] ? axesDataRanges[i][0] : axesDataRanges[i][1],
    //       xpos: axesCenters[i],
    //       ypos: borderOffset.top + drawableArea.height + 13,
    //       align: 'middle',
    //     });
    //   }
    //   tickModel[0].align = 'start';
    //   tickModel[1].align = 'start';
    //   tickModel[(axisList.length * 2) - 1].align = 'end';
    //   tickModel[(axisList.length * 2) - 2].align = 'end';

    //   // Manage the svg dom for the axis ticks
    //   const ticksGroup = svg.select('g.axis-ticks');
    //   const axisTickNodes = ticksGroup.selectAll('text.axis-ticks').
    //     data(tickModel);

    //   axisTickNodes.enter().append('text').
    //     classed('axis-ticks', true);

    //   axisTickNodes.exit().remove();

    //   ticksGroup.selectAll('text.axis-ticks').
    //     text((d, i) => d.value).
    //     attr('text-anchor', (d, i) => d.align).
    //     attr('transform', (d, i) => `translate(${d.xpos}, ${d.ypos})`);
  }

  function axisMouseDragHandler(data, index) {
    const svg = d3.select(model.container).select('svg');
    const coords = d3.mouse(model.container);
    const pendingSelection = svg.select('rect.axis-selection-pending');
    if (pendingSelection) {
      const rectHeight = coords[1] - pendingSelection.attr('data-initial-y');
      if (rectHeight >= 0) {
        pendingSelection.attr('height', rectHeight);
      } else {
        pendingSelection.attr('transform', `translate(${pendingSelection.attr('data-initial-x')}, ${coords[1]})`).
          attr('height', -rectHeight);
      }
    }
  }

  function drawAxes(axesCenters) {
    if (axesCenters.length <= 1) {
      // let's not do anything if we don't have enough axes for rendering.
      return;
    }

    const svg = d3.select(model.container).select('svg');
    const axisLineGroup = svg.select('g.axis-lines');

    // Now manage the svg dom
    const axisLineNodes = axisLineGroup.selectAll('rect.axis-lines').
      data(axesCenters);

    axisLineNodes
      .enter()
      .append('rect')
      .classed('axis-lines', true)
      .classed(style.axisLines, true);

    axisLineNodes.exit().remove();

    axisLineGroup
      .selectAll('rect.axis-lines')
      .classed(style.controlItem, true)
      .attr('height', (model.canvasArea.height - model.borderOffsetBottom) - model.borderOffsetTop)
      .attr('width', model.axisWidth)
      .attr('transform', (d, i) => `translate(${d - (model.axisWidth / 2)}, ${model.borderOffsetTop})`)
      .on('mousedown', (d, i) => {
        d3.event.preventDefault();
        const coords = d3.mouse(model.container);
        const initialY = coords[1];
        const initialX = d - (model.selectionBarWidth / 2);
        const prect = svg.append('rect');
        prect
          .classed('axis-selection-pending', true)
          .classed(style.selectionBars, true)
          .attr('height', 0.5)
          .attr('width', model.selectionBarWidth)
          .attr('transform', `translate(${initialX}, ${initialY})`)
          .attr('data-initial-x', initialX)
          .attr('data-initial-y', initialY)
          .attr('data-index', i);

        svg.on('mousemove', axisMouseDragHandler);
        svg.on('mouseup', (data, index) => {
          const finalY = d3.mouse(model.container)[1];
          svg.select('rect.axis-selection-pending').remove();
          svg.on('mousemove', null);
          svg.on('mouseup', null);

          const axis = model.axes.getAxis(i);
          model.axes.addSelection(i, screenToData(model, initialY, axis), screenToData(model, finalY, axis));
        });
      });
  }

  function drawPolygons(axesCenters, gCtx, idxOne, idxTwo, histogram, colors) {
    const axisOne = model.axes.getAxis(idxOne);
    const axisTwo = model.axes.getAxis(idxTwo);
    const deltaOne = histogram.x.delta;
    const deltaTwo = histogram.y.delta;
    const xleft = axesCenters[idxOne];
    const xright = axesCenters[idxTwo];
    let bin = null;
    let opacity = 0.0;
    let yleft1 = 0.0;
    let yleft2 = 0.0;
    let yright1 = 0.0;
    let yright2 = 0.0;
    let yLeftMin = 0;
    let yLeftMax = 0;
    let yRightMin = 0;
    let yRightMax = 0;

    for (let i = 0; i < histogram.bins.length; ++i) {
      bin = histogram.bins[i];
      opacity = affine(0, bin.count, model.maxBinCountForOpacityCalculation, 0.0, 1.0);
      yleft1 = dataToScreen(model, bin.x, axisOne);
      yleft2 = dataToScreen(model, bin.x + deltaOne, axisOne);
      yright1 = dataToScreen(model, bin.y, axisTwo);
      yright2 = dataToScreen(model, bin.y + deltaTwo, axisTwo);
      yLeftMin = 0;
      yLeftMax = 0;
      yRightMin = 0;
      yRightMax = 0;

      if (yleft1 <= yleft2) {
        yLeftMin = yleft1;
        yLeftMax = yleft2;
      } else {
        yLeftMin = yleft2;
        yLeftMax = yleft1;
      }

      if (yright1 <= yright2) {
        yRightMin = yright1;
        yRightMax = yright2;
      } else {
        yRightMin = yright2;
        yRightMax = yright1;
      }

      gCtx.beginPath();
      gCtx.moveTo(xleft, yLeftMin);
      gCtx.lineTo(xleft, yLeftMax);
      gCtx.lineTo(xright, yRightMax);
      gCtx.lineTo(xright, yRightMin);
      gCtx.closePath();
      gCtx.fillStyle = `rgba(${colors[0]},${colors[1]},${colors[2]},${opacity})`;
      gCtx.fill();
    }
  }

  publicAPI.render = () => {
    if (model.needData) {
      fetchData();
      return;
    }

    if (!model.axes.canRender() || model.container === null || model.containerHidden === true) {
      d3.select(model.container).select('svg.parallel-coords-overlay').classed(style.hidden, true);
      d3.select(model.container).select('canvas').classed(style.hidden, true);
      d3.select(model.container).select('div.parallel-coords-placeholder').classed(style.hidden, false);
      return;
    }

    d3.select(model.container).select('svg.parallel-coords-overlay').classed(style.hidden, false);
    d3.select(model.container).select('canvas').classed(style.hidden, false);
    d3.select(model.container).select('div.parallel-coords-placeholder').classed(style.hidden, true);

    model.ctx.globalAlpha = 1.0;

    model.canvasArea.width = model.canvas.width;
    model.canvasArea.height = model.canvas.height;

    model.fgCanvas.width = model.canvas.width;
    model.fgCanvas.height = model.canvas.height;
    model.bgCanvas.width = model.canvas.width;
    model.bgCanvas.height = model.canvas.height;

    model.drawableArea.width = model.canvasArea.width - (model.borderOffsetLeft + model.borderOffsetRight);
    model.drawableArea.height = model.canvasArea.height - (model.borderOffsetTop + model.borderOffsetBottom);

    const svg = d3.select(model.container).select('svg');
    svg
      .attr('width', model.canvas.width)
      .attr('height', model.canvas.height)
      .classed('parallel-coords-overlay', true)
      .classed(style.parallelCoordsOverlay, true);

    if (d3.select(model.container).selectAll('g').empty()) {
      // Have not added groups yet, do so now.  Order matters.
      svg.append('g').classed('axis-lines', true);
      svg.append('g').classed('selection-bars', true);
      svg.append('g').classed('hover-bins', true);
      svg.append('g').classed('axis-annotation-indicators', true);
      svg.append('g').classed('axis-control-elements', true);
      svg.append('g').classed('axis-ticks', true);
      svg.append('g').classed('glyphs', true);
    }

    model.hoverIndicatorHeight = model.drawableArea.height / model.provider.getHistogram2DNumberOfBins();

    model.ctx.clearRect(0, 0, model.canvasArea.width, model.canvasArea.height);
    model.fgCtx.clearRect(0, 0, model.canvasArea.width, model.canvasArea.height);
    model.bgCtx.clearRect(0, 0, model.canvasArea.width, model.canvasArea.height);


    // First lay down the "context" polygons
    model.maxBinCountForOpacityCalculation = model.provider.getParallelCoordinateMaxCount(model.axes.getAxesNames());

    const nbPolyDraw = model.axes.getNumberOf2DHistogram();
    const axesCenters = model.axes.extractAxesCenters(model);
    for (let j = 0; j < nbPolyDraw; ++j) {
      drawPolygons(
        axesCenters,
        model.bgCtx,
        j, j + 1,
        model.provider.getHistogram2D(model.axes.getAxis(j).name, model.axes.getAxis(j + 1).name),
        model.polygonColors);
    }

    model.ctx.globalAlpha = model.polygonOpacityAdjustment;
    model.ctx.drawImage(model.bgCanvas,
      0, 0, model.canvasArea.width, model.canvasArea.height,
      0, 0, model.canvasArea.width, model.canvasArea.height);

    // If there is a selection, draw that (the "focus") on top of the polygons
    if (model.axes.hasSelection() && model.provider.isA('SelectionProvider')) {
      model.maxBinCountForOpacityCalculation = model.provider.getSelectionParallelCoordinateMaxCount(model.axes.getAxesNames());
      for (let k = 0; k < nbPolyDraw; ++k) {
        drawPolygons(
          axesCenters,
          model.fgCtx,
          k, k + 1,
          model.provider.getSelection2DHistogram(model.axes.getAxis(k).name, model.axes.getAxis(k + 1).name),
          model.selectionColors);
      }

      model.ctx.globalAlpha = model.selectionOpacityAdjustment;
      model.ctx.drawImage(model.fgCanvas,
        0, 0, model.canvasArea.width, model.canvasArea.height,
        0, 0, model.canvasArea.width, model.canvasArea.height);
    }

    model.ctx.globalAlpha = 1.0;

    // Now draw all the decorations and controls
    drawAxes(axesCenters);
    drawSelectionBars(model.axes.extractSelections(model));
    drawAxisLabels(model.axes.extractLabels(model));
    drawAxisControls(model.axes.extractAxesControl(model));
  };

  // -------------- Is needed? ----------------
  // function fastRender() {
  //   model.ctx.clearRect(0, 0, model.canvasArea.width, model.canvasArea.height);

  //   model.ctx.globalAlpha = model.polygonOpacityAdjustment;
  //   model.ctx.drawImage(model.bgCanvas,
  //     0, 0, model.canvasArea.width, model.canvasArea.height,
  //     0, 0, model.canvasArea.width, model.canvasArea.height);

  //   model.ctx.globalAlpha = model.selectionOpacityAdjustment;
  //   model.ctx.drawImage(model.fgCanvas,
  //     0, 0, model.canvasArea.width, model.canvasArea.height,
  //     0, 0, model.canvasArea.width, model.canvasArea.height);

  //   model.ctx.globalAlpha = 1.0;

  //   const axesCenters = model.axes.extractAxesCenters(model);

  //   drawAxes(axesCenters);
  //   drawSelectionBars(model.axes.extractSelections(model));
  //   drawAxisLabels(model.axes.extractLabels(model));
  //   drawAxisControls(model.axes.extractAxesControl(model));
  // }

  // function receivedHistogram(histIdx, histogram) {
  //   histogramCount += 1;
  //   histogramList[histIdx] = histogram;

  //   if (histogram.y.delta === 0) {
  //     histogram.y.delta = 1;
  //     histogram.y.extent[1] = histogram.y.extent[0] + 1;
  //   }

  //   if (histogram.x.delta === 0) {
  //     histogram.x.delta = 1;
  //     histogram.x.extent[1] = histogram.x.extent[0] + 1;
  //   }

  //   axesDataRanges[histIdx] = histogram.y.extent.slice();

  //   if (histIdx === axisList.length - 2) {
  //     axesDataRanges[histIdx + 1] = histogram.x.extent.slice();
  //   }

  //   if (histogramCount === axisList.length - 1) { // We have received all histograms
  //     maxBinCountOverAllHistograms = getMaxHistogramBinCount(histogramList);
  //     render();
  //   }
  // }

  // function retrieve2DHistogram(idx1, idx2) {
  //   dataProvider.fetchHistogram2d(axisList[idx2], axisList[idx1], hist => {
  //     receivedHistogram(idx1, hist);
  //   }, numberOfBins);
  // }

  // function fetchHistograms() {
  //   histogramList = [];
  //   axesDataRanges = [];
  //   histogramCount = 0;
  //   maxBinCountOverAllHistograms = 0;

  //   // Now fetch all the histograms
  //   for (let k = 0; k < axisList.length - 1; ++k) {
  //     retrieve2DHistogram(k, k + 1);
  //   }
  // }

  // function fetchSelection() {
  //   const histograms = [];

  //   if (currentSelection !== null && dataProvider && dataProvider.querySelection) {
  //     selectionResult = null;
  //     maxBinCountOverAllSelections = 0;

  //     for (let j = 0; j < axisList.length - 1; ++j) {
  //       histograms.push([axisList[j + 1], axisList[j]]);
  //     }
  //     const query = {
  //       ranges: currentSelection,
  //       histograms,
  //     };
  //     dataProvider.querySelection(query, queryResult => {
  //       maxBinCountOverAllSelections = getMaxHistogramBinCount(queryResult.counts[0]);
  //       selectionResult = queryResult;
  //       render();
  //     });
  //   }
  // }

  // function fetchData() {
  //   fetchHistograms();
  //   fetchSelection();
  // }


  publicAPI.resize = () => {
    const clientRect = model.canvas.parentElement.getBoundingClientRect();
    model.canvas.setAttribute('width', clientRect.width);
    model.canvas.setAttribute('height', clientRect.height);
    model.hoverBinData = [];
    d3.select(model.container)
      .select('svg')
      .selectAll('rect.hover-bin-indicator')
      .remove();
    if (clientRect.width !== 0 && clientRect.height !== 0) {
      model.containerHidden = false;
      publicAPI.render();
    } else {
      model.containerHidden = true;
    }
  };

  publicAPI.setContainer = (element) => {
    if (model.container) {
      while (model.container.firstChild) {
        model.container.removeChild(model.container.firstChild);
      }
      model.container = null;
    }

    model.container = element;

    if (model.container !== null) {
      model.container.innerHTML = htmlContent;
      d3.select(model.container).
        select('div.parallel-coords-placeholder').
        select('img').
        attr('src', iconImage);
      model.container.appendChild(model.canvas);
      d3.select(model.container).append('svg');
      publicAPI.resize();
    }
  };

  // function handleHoverBinUpdate(data) {
  //   if (!model.axes.canRender() || model.containerHidden === true) {
  //     // let's not do anything if we don't have enough axes for rendering.
  //     return;
  //   }

  //   // First update our internal data model
  //   model.hoverBinData = [];
  //   Object.keys(data.state).forEach(pName => {
  //     const binList = data.state[pName];
  //     if (binList.indexOf(-1) === -1) {
  //       for (let i = 0; i < binList.length; ++i) {
  //         model.hoverBinData.push({
  //           name: pName,
  //           bin: binList[i],
  //         });
  //       }
  //     }
  //   });

  //   // Now manage the svg dom
  //   const hoverBinNodes = d3
  //     .select(model.container)
  //     .select('svg')
  //     .select('g.hover-bins')
  //     .selectAll('rect.hover-bin-indicator')
  //     .data(model.hoverBinData);

  //   hoverBinNodes
  //     .enter()
  //     .append('rect')
  //     .classed('hover-bin-indicator', true);

  //   hoverBinNodes.exit().remove();

  //   const axesCenters = model.axes.extractAxesCenters(model);
  //   d3.select(model.container)
  //     .select('svg')
  //     .select('g.hover-bins')
  //     .selectAll('rect.hover-bin-indicator')
  //     .attr('height', model.hoverIndicatorHeight)
  //     .attr('width', model.hoverIndicatorWidth)
  //     .attr('transform', (d, i) => {
  //       const axis = model.axes.getAxisByName(d.name);
  //       const screenOffset = binNumberToScreenOffset(d.bin, axis.isUpsideDown());
  //       return `translate(${axesCenters[axis.idx] - (model.hoverIndicatorWidth / 2)}, ${screenOffset})`;
  //     });
  // }

  // function handleSelectionChanged(sel) {
  //   if (sel.type === 'range') {
  //     const rangeMap = sel.ranges;
  //     setSelection(rangeMap);
  //     replaceAxisAnnotations(rangeMap);
  //     fetchSelection();
  //   } else if (sel.type === 'empty') {
  //     clearSelection();
  //   }
  // }

  // function addSubscriptions() {
  //   topicSubscriptions.push(dataProvider.onParameterValueChanged(event => {
  //     const aidx = axisList.indexOf(event.value.name);
  //     if (aidx >= 0 && !event.value.selected) {
  //       updateAxisList(axisList.slice(0, aidx).concat(axisList.slice(aidx + 1, axisList.length)));
  //       render();
  //     } else if (aidx === -1 && event.value.selected) {
  //       updateAxisList(axisList.concat([
  //         event.value.name,
  //       ]));
  //       if (annotationService) {
  //         const rangeSel = selection('empty');
  //         selnGen = rangeSel.gen;
  //         annotationService.setActiveSelection(rangeSel);
  //       }
  //       render();
  //     }
  //   }));

  //   if (annotationService) {
  //     topicSubscriptions.push(annotationService.onSelectionChanged((data, envelope) => {
  //       handleSelectionChanged(data);
  //     }));
  //     topicSubscriptions.push(annotationService.onCurrentHoverChanged((data, envelope) => {
  //       handleHoverBinUpdate(data);
  //     }));
  //   }
  // }

  // Attach listener to provider
  model.subscriptions.push({ unsubscribe: publicAPI.setContainer });
  ['onHistogram2DDataReady', 'onHistogram2DSelectionDataReady'].forEach(method => {
    if (model.provider[method]) {
      model.subscriptions.push(model.provider[method](publicAPI.render));
    }
  });
  ['onFieldsChange'].forEach(method => {
    if (model.provider[method]) {
      model.subscriptions.push(model.provider[method](fetchData));
    }
  });

  if (model.provider.isA('SelectionProvider')) {
    model.subscriptions.push(model.axes.onSelectionChange(() => {
      fetchSelectionData();
      publicAPI.render();
    }));
  }

  publicAPI.setContainer(model.container);
  updateSizeInformation();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  container: null,
  provider: null,
  needData: true,

  containerHidden: false,

  histogramCount: 0,

  borderOffsetTop: 35,
  borderOffsetRight: 10,
  borderOffsetBottom: 45,
  borderOffsetLeft: 10,

  axisWidth: 6,
  selectionBarWidth: 8,

  polygonColors: [0, 0, 0],
  selectionColors: [70, 130, 180],

  hoverIndicatorHeight: 10,
  hoverIndicatorWidth: 7,
  hoverBinData: [],

  maxBinCountOverAllHistograms: 0,
  maxBinCountOverAllSelections: 0,
  maxBinCountForOpacityCalculation: 0,

  selectionOpacityAdjustment: 1,
  polygonOpacityAdjustment: 1,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'VizComponent');
  CompositeClosureHelper.get(publicAPI, model, ['provider', 'container']);

  parallelCoordinate(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
