/* global document */

import d3 from 'd3';
import style from 'PVWStyle/InfoVizNative/ParallelCoordinates.mcss';

import AnnotationBuilder from '../../../Common/Misc/AnnotationBuilder';
import AxesManager from './AxesManager';
// import axisControlSvg from './AxisControl-svg.html';
import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';
import htmlContent from './body.html';
import iconImage from './ParallelCoordsIconSmall.png';

// ----------------------------------------------------------------------------
// Global
// ----------------------------------------------------------------------------

export function affine(inMin, val, inMax, outMin, outMax) {
  return (((val - inMin) / (inMax - inMin)) * (outMax - outMin)) + outMin;
}

export function perfRound(val) {
  /* eslint-disable no-bitwise */
  return (0.5 + val) | 0;
  /* eslint-enable no-bitwise */
}

export function dataToScreen(model, dataY, axis) {
  return perfRound(!axis.isUpsideDown()
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
  return !axis.isUpsideDown()
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

export function toColorArray(colorString) {
  return [
    Number.parseInt(colorString.slice(1, 3), 16),
    Number.parseInt(colorString.slice(3, 5), 16),
    Number.parseInt(colorString.slice(5, 7), 16),
  ];
}

// ----------------------------------------------------------------------------
// Parallel Coordinate
// ----------------------------------------------------------------------------

function parallelCoordinate(publicAPI, model) {
  // Private internal
  const scoreToColor = [];
  let lastAnnotationPushed = null;

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

  // Local cache of the selection data
  model.selectionData = null;
  model.visibleScores = [0, 1, 2];

  function drawSelectionData(score) {
    if (model.axes.selection && model.visibleScores) {
      return model.visibleScores.indexOf(score) !== -1;
    }
    return true;
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
      .style('fill', (d, i) => d.color)
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
    const svgGr = d3
      .select(model.container)
      .select('svg')
      .select('g.axis-control-elements');

    const axisControlNodes = svgGr
      .selectAll('g.axis-control-element')
      .data(controlsDataModel);

    const axisControls = axisControlNodes.enter()
      .append('g')
      .classed('axis-control-element', true)
      .classed(style.axisControlElements, true)
      // Can't use .html on svg without polyfill: https://github.com/d3/d3-3.x-api-reference/blob/master/Selections.md#html
      // fails in IE11. Replace by explicit DOM manipulation.
      // .html(axisControlSvg);
      .append('g')
        .classed('axis-controls-group-container', true)
        .attr('width', 108)
        .attr('height', 50)
        .attr('viewBox', '0 0 108 50')
      .append('g')
        .classed('axis-controls-group', true);

    axisControls
      .append('rect')
        .classed('center-rect', true)
        .attr('x', 28)
        .attr('y', 1)
        .attr('width', 52)
        .attr('height', 48);
    axisControls
      .append('rect')
        .classed('right-rect', true)
        .attr('x', 82)
        .attr('y', 1)
        .attr('width', 25)
        .attr('height', 48);
    axisControls
      .append('rect')
        .classed('left-rect', true)
        .attr('x', 1)
        .attr('y', 1)
        .attr('width', 25)
        .attr('height', 48);
    axisControls
      .append('polygon')
        .classed('top', true)
        .attr('points', '54 1 78 23 30 23 ');
    axisControls
      .append('polygon')
        .classed('right', true)
        .attr('points', '94 14 118 36 70 36 ')
        .attr('transform', 'translate(94.0, 25.0) rotate(-270.0) translate(-94.0, -25.0) ');
    axisControls
      .append('polygon')
        .classed('left', true)
        .attr('points', '14 14 38 36 -10 36 ')
        .attr('transform', 'translate(14.0, 25.0) scale(-1, 1) rotate(-270.0) translate(-14.0, -25.0) ');
    axisControls
      .append('polygon')
        .classed('bottom', true)
        .attr('points', '54 27 78 49 30 49 ')
        .attr('transform', 'translate(54.0, 38.0) scale(1, -1) translate(-54.0, -38.0) ');

    axisControlNodes.exit().remove();

    const scale = 0.5;
    axisControlNodes
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
        } else if (ratio < 0.73) {
          // up/down click
          model.axes.toggleOrientation(i);
          publicAPI.render();
        } else {
          // right arrow click
          model.axes.swapAxes(i, i + 1);
        }
      })
      .selectAll('.axis-controls-group-container')
      .classed(style.axisControlsGroupContainer, true);
  }

  function drawAxisLabels(labelDataModel) {
    const ypos = 15;
    const glyphRegion = 22;
    const glyphPadding = 3;
    const svg = d3.select(model.container).select('svg');

    if (model.provider && model.provider.isA('LegendProvider')) {
      // Add legend key
      labelDataModel.forEach((entry) => {
        entry.legend = model.provider.getLegend(entry.name);
      });
      let glyphSize = glyphRegion - glyphPadding - glyphPadding;
      if (glyphSize % 2 !== 0) {
        glyphSize += 1;
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
        .attr('transform', (d, i) => `translate(${d.centerX - (glyphSize * 0.5)}, ${glyphPadding})`)
        .on('click', (d, i) => {
          if (d.annotated) {
            model.axes.clearSelection(i);
          }
        });

      glyphGroup.each(function applyLegendStyle(d, i) {
        d3.select(this)
          .select('svg')
          .attr('fill', d.legend.color)
          .attr('stroke', 'black')
          .attr('width', glyphSize)
          .attr('height', glyphSize)
          .style('color', d.legend.color) // Firefox SVG use color bug workaround fix
          .classed(style.clickable, d.annotated)
          .select('use')
          .classed(style.colorToFill, true) // Firefox SVG use color bug workaround fix
          .classed(style.blackStroke, true)
          .attr('xlink:href', d.legend.shape);
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
        .attr('transform', (d, i) => `translate(${d.centerX - ((glyphSize * 0.5) + 1)}, ${glyphPadding - 1.5})`)
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
        })
        .attr('text-anchor', (d, i) => d.align)
        .attr('transform', (d, i) => `translate(${d.centerX}, ${ypos})`);
    }
  }

  function drawAxisTicks(tickDataModel) {
    // Manage the svg dom for the axis ticks
    const svg = d3.select(model.container).select('svg');
    const ticksGroup = svg.select('g.axis-ticks');
    const axisTickNodes = ticksGroup.selectAll('text.axis-ticks')
      .data(tickDataModel);

    axisTickNodes.enter().append('text')
      .classed('axis-ticks', true)
      .classed(style.axisTicks, true);

    axisTickNodes.exit().remove();

    const formatter = d3.format('.3s');
    ticksGroup.selectAll('text.axis-ticks')
      .text((d, i) => formatter(d.value))
      .attr('text-anchor', (d, i) => d.align)
      .attr('transform', (d, i) => `translate(${d.xpos}, ${d.ypos})`);
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
        pendingSelection
          .attr('transform', `translate(${pendingSelection.attr('data-initial-x')}, ${coords[1]})`)
          .attr('height', -rectHeight);
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
    const axisLineNodes = axisLineGroup.selectAll('rect.axis-lines')
      .data(axesCenters);

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
    if (!histogram) {
      return;
    }
    const axisOne = model.axes.getAxis(idxOne);
    const axisTwo = model.axes.getAxis(idxTwo);
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

    // Ensure proper range for X
    const deltaOne = (axisOne.range[1] - axisOne.range[0]) / (histogram.numberOfBins || model.numberOfBins);
    const deltaTwo = (axisTwo.range[1] - axisTwo.range[0]) / (histogram.numberOfBins || model.numberOfBins);

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
    if (!model.allBgHistogram2dData || !model.axes.canRender() || !model.container || model.containerHidden === true) {
      d3.select(model.container).select('svg.parallel-coords-overlay').classed(style.hidden, true);
      d3.select(model.container).select('canvas').classed(style.hidden, true);
      d3.select(model.container).select('div.parallel-coords-placeholder').classed(style.hidden, false);
      return;
    }

    d3.select(model.container).select('svg.parallel-coords-overlay').classed(style.hidden, false);
    d3.select(model.container).select('canvas').classed(style.hidden, false);
    d3.select(model.container).select('div.parallel-coords-placeholder').classed(style.hidden, true);

    model.ctx.globalAlpha = 1.0;

    // Update canvas area and drawable info
    updateSizeInformation();

    model.hoverIndicatorHeight = model.drawableArea.height / model.numberOfBins;

    model.fgCanvas.width = model.canvas.width;
    model.fgCanvas.height = model.canvas.height;
    model.bgCanvas.width = model.canvas.width;
    model.bgCanvas.height = model.canvas.height;

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

    model.ctx.clearRect(0, 0, model.canvasArea.width, model.canvasArea.height);
    model.fgCtx.clearRect(0, 0, model.canvasArea.width, model.canvasArea.height);
    model.bgCtx.clearRect(0, 0, model.canvasArea.width, model.canvasArea.height);

    // First lay down the "context" polygons
    model.maxBinCountForOpacityCalculation = model.allBgHistogram2dData.maxCount;

    const nbPolyDraw = model.axes.getNumberOf2DHistogram();
    const axesCenters = model.axes.extractAxesCenters(model);
    if (!model.showOnlySelection) {
      for (let j = 0; j < nbPolyDraw; ++j) {
        const axisOne = model.axes.getAxis(j);
        const axisTwo = model.axes.getAxis(j + 1);
        const histo2D = model.allBgHistogram2dData[axisOne.name] ? model.allBgHistogram2dData[axisOne.name][axisTwo.name] : null;
        drawPolygons(
          axesCenters,
          model.bgCtx,
          j, j + 1,
          histo2D,
          model.polygonColors);
      }

      model.ctx.globalAlpha = model.polygonOpacityAdjustment;
      model.ctx.drawImage(model.bgCanvas,
        0, 0, model.canvasArea.width, model.canvasArea.height,
        0, 0, model.canvasArea.width, model.canvasArea.height);
    }

    // If there is a selection, draw that (the "focus") on top of the polygons
    if (model.selectionData) {
      // Extract selection histogram2d
      const polygonsQueue = [];
      let maxCount = 0;
      let missingData = false;

      const processHistogram = (h, k) => {
        if (drawSelectionData(h.role.score)) {
          maxCount = maxCount > h.maxCount ? maxCount : h.maxCount;
          // Add in queue
          polygonsQueue.push([
            axesCenters,
            model.fgCtx,
            k, k + 1,
            h,
            scoreToColor[h.role.score] || model.selectionColors,
          ]);
        }
      };

      for (let k = 0; k < nbPolyDraw && !missingData; ++k) {
        const histo = model.selectionData && model.selectionData[model.axes.getAxis(k).name]
          ? model.selectionData[model.axes.getAxis(k).name][model.axes.getAxis(k + 1).name]
          : null;
        missingData = !histo;

        if (histo) {
          histo.forEach(h => processHistogram(h, k));
        }
      }

      if (!missingData) {
        model.maxBinCountForOpacityCalculation = maxCount;
        polygonsQueue.forEach(req => drawPolygons(...req));
        model.ctx.globalAlpha = model.selectionOpacityAdjustment;
        model.ctx.drawImage(model.fgCanvas,
          0, 0, model.canvasArea.width, model.canvasArea.height,
          0, 0, model.canvasArea.width, model.canvasArea.height);
      }
    }

    model.ctx.globalAlpha = 1.0;

    // Now draw all the decorations and controls
    drawAxisLabels(model.axes.extractLabels(model));
    drawAxisTicks(model.axes.extractAxisTicks(model));
    drawAxes(axesCenters);
    drawSelectionBars(model.axes.extractSelections(model, drawSelectionData));
    drawAxisControls(model.axes.extractAxesControl(model));
  };

  // -------------- Used to speed up action of opacity sliders ----------------
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

  publicAPI.propagateAnnotationInsteadOfSelection = (useAnnotation = true, defaultScore = 0, defaultWeight = 0) => {
    model.useAnnotation = useAnnotation;
    model.defaultScore = defaultScore;
    model.defaultWeight = defaultWeight;
  };

  publicAPI.setVisibleScoresForSelection = (scoreList) => {
    model.visibleScores = scoreList;
    if (model.selectionDataSubscription && model.visibleScores && model.propagatePartitionScores) {
      model.selectionDataSubscription.update(model.axes.getAxesPairs(), model.visibleScores);
    }
  };

  publicAPI.setScores = (scores) => {
    model.scores = scores;
    if (!model.visibleScores && scores) {
      publicAPI.setVisibleScoresForSelection(scores.map((score, idx) => idx));
    }
    if (model.scores) {
      model.scores.forEach((score, idx) => {
        scoreToColor[idx] = toColorArray(score.color);
      });
    }
  };

  if (model.provider && model.provider.isA('ScoresProvider')) {
    publicAPI.setScores(model.provider.getScores());
    model.subscriptions.push(model.provider.onScoresChange(publicAPI.setScores));
  }

  publicAPI.resize = () => {
    if (!model.container) {
      return;
    }
    const clientRect = model.canvas.parentElement.getBoundingClientRect();
    model.canvas.setAttribute('width', clientRect.width);
    model.canvas.setAttribute('height', clientRect.height);
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

    if (model.container) {
      model.container.innerHTML = htmlContent;
      d3.select(model.container)
        .select('div.parallel-coords-placeholder')
        .select('img')
        .attr('src', iconImage);
      model.container.appendChild(model.canvas);
      d3.select(model.container).append('svg');
      publicAPI.resize();
    }
  };

  function binNumberToScreenOffset(binNumber, rightSideUp) {
    let screenY = affine(0, binNumber, model.numberOfBins, model.canvasArea.height - model.borderOffsetBottom, model.borderOffsetTop);
    screenY -= model.hoverIndicatorHeight;

    if (rightSideUp === false) {
      screenY = affine(0, binNumber, model.numberOfBins, model.borderOffsetTop, model.canvasArea.height - model.borderOffsetBottom);
    }

    return perfRound(screenY);
  }

  function handleHoverBinUpdate(data) {
    if (!model.axes.canRender() || model.containerHidden === true) {
      // let's not do anything if we don't have enough axes for rendering.
      return;
    }

    // First update our internal data model
    model.hoverBinData = [];
    Object.keys(data.state).forEach((pName) => {
      const binList = data.state[pName];
      if (model.axes.getAxisByName(pName) && binList.indexOf(-1) === -1) {
        for (let i = 0; i < binList.length; ++i) {
          model.hoverBinData.push({
            name: pName,
            bin: binList[i],
          });
        }
      }
    });

    // Now manage the svg dom
    const hoverBinNodes = d3
      .select(model.container)
      .select('svg')
      .select('g.hover-bins')
      .selectAll('rect.hover-bin-indicator')
      .data(model.hoverBinData);

    hoverBinNodes
      .enter()
      .append('rect')
      .classed(style.hoverBinIndicator, true)
      .classed('hover-bin-indicator', true);

    hoverBinNodes.exit().remove();

    const axesCenters = model.axes.extractAxesCenters(model);
    d3.select(model.container)
      .select('svg')
      .select('g.hover-bins')
      .selectAll('rect.hover-bin-indicator')
      .attr('height', model.hoverIndicatorHeight)
      .attr('width', model.hoverIndicatorWidth)
      .attr('transform', (d, i) => {
        const axis = model.axes.getAxisByName(d.name);
        const screenOffset = binNumberToScreenOffset(d.bin, !axis.isUpsideDown());
        return `translate(${axesCenters[axis.idx] - (model.hoverIndicatorWidth / 2)}, ${screenOffset})`;
      });
  }

  // Attach listener to provider
  model.subscriptions.push({ unsubscribe: publicAPI.setContainer });

  // Handle active field change, update axes
  if (model.provider.isA('FieldProvider')) {
    // Monitor any change
    model.subscriptions.push(model.provider.onFieldChange(() => {
      model.axes.updateAxes(model.provider.getActiveFieldNames().map(name =>
        ({ name, range: model.provider.getField(name).range })
      ));
    }));
    // Use initial state
    model.axes.updateAxes(model.provider.getActiveFieldNames().map(name =>
      ({ name, range: model.provider.getField(name).range })
    ));
  }

  // Handle bin hovering
  if (model.provider.onHoverBinChange) {
    model.subscriptions.push(model.provider.onHoverBinChange(handleHoverBinUpdate));
  }

  if (model.provider.isA('Histogram2DProvider')) {
    model.histogram2DDataSubscription = model.provider.subscribeToHistogram2D(
      (allBgHistogram2d) => {
        // Update axis range
        model.axes.getAxesPairs().forEach((pair, idx) => {
          const hist2d = allBgHistogram2d[pair[0]][pair[1]];
          if (hist2d) {
            model.axes.getAxis(idx).updateRange(hist2d.x.extent);
            model.axes.getAxis(idx + 1).updateRange(hist2d.y.extent);
          }
        });

        const topLevelList = Object.keys(allBgHistogram2d);
        // We always get a maxCount, anything additional must be histogram2d
        if (topLevelList.length > 1) {
          model.allBgHistogram2dData = allBgHistogram2d;
          publicAPI.render();
        } else {
          model.allBgHistogram2dData = null;
          publicAPI.render();
        }
      },
      model.axes.getAxesPairs(),
      {
        numberOfBins: model.numberOfBins,
        partial: false,
      }
    );

    model.subscriptions.push(model.axes.onAxisListChange((axisPairs) => {
      model.histogram2DDataSubscription.update(axisPairs);
    }));

    model.subscriptions.push(model.histogram2DDataSubscription);
  }

  if (model.provider.isA('SelectionProvider')) {
    model.selectionDataSubscription = model.provider.subscribeToDataSelection(
      'histogram2d',
      (data) => {
        model.selectionData = data;
        if (model.provider.getAnnotation()) {
          model.axes.resetSelections(model.provider.getAnnotation().selection, false, model.provider.getAnnotation().score, scoreToColor);
          if (data['##annotationGeneration##'] !== undefined) {
            if (model.provider.getAnnotation().generation === data['##annotationGeneration##']) {
              // render from selection data change (same generation)
              publicAPI.render();
            }
          } else {
            // render from selection data change (no generation)
            publicAPI.render();
          }
        } else {
          // render from selection data change (no annotation)
          publicAPI.render();
        }
      },
      model.axes.getAxesPairs(),
      {
        partitionScores: model.visibleScores,
        numberOfBins: model.numberOfBins,
      });

    model.subscriptions.push(model.selectionDataSubscription);

    model.subscriptions.push(model.provider.onSelectionChange((sel) => {
      if (!model.useAnnotation) {
        if (sel && sel.type === 'empty') {
          model.selectionData = null;
        }
        model.axes.resetSelections(sel, false);
        publicAPI.render();
      }
    }));
    model.subscriptions.push(model.provider.onAnnotationChange((annotation) => {
      if (annotation && annotation.selection.type === 'empty') {
        model.selectionData = null;
      }

      if (lastAnnotationPushed
        && annotation.selection.type === 'range'
        && annotation.id === lastAnnotationPushed.id
        && annotation.generation === lastAnnotationPushed.generation + 1) {
        // Assume that it is still ours but edited by someone else
        lastAnnotationPushed = annotation;

        // Capture the score and update our default
        model.defaultScore = lastAnnotationPushed.score[0];
      }
      model.axes.resetSelections(annotation.selection, false, annotation.score, scoreToColor);
    }));
    model.subscriptions.push(model.axes.onSelectionChange(() => {
      if (model.useAnnotation) {
        lastAnnotationPushed = model.provider.getAnnotation();

        // If parttion annotation special handle
        if (lastAnnotationPushed && lastAnnotationPushed.selection.type === 'partition') {
          const axisIdxToClear = model.axes.getAxesNames().indexOf(lastAnnotationPushed.selection.partition.variable);
          if (axisIdxToClear !== -1) {
            model.axes.getAxis(axisIdxToClear).clearSelection();
            model.axes.selection = null;
          }
        }

        const selection = model.axes.getSelection();
        if (selection.type === 'empty') {
          lastAnnotationPushed = AnnotationBuilder.EMPTY_ANNOTATION;
        } else if (!lastAnnotationPushed || model.provider.shouldCreateNewAnnotation() || lastAnnotationPushed.selection.type !== 'range') {
          lastAnnotationPushed = AnnotationBuilder.annotation(selection, [model.defaultScore], model.defaultWeight);
        } else {
          lastAnnotationPushed = AnnotationBuilder.update(lastAnnotationPushed, {
            selection,
            score: [model.defaultScore],
            weight: model.defaultWeight,
          });
        }
        AnnotationBuilder.updateReadOnlyFlag(lastAnnotationPushed, model.readOnlyFields);
        model.provider.setAnnotation(lastAnnotationPushed);
      } else {
        model.provider.setSelection(model.axes.getSelection());
      }
    }));
    model.subscriptions.push(model.axes.onAxisListChange((axisPairs) => {
      model.selectionDataSubscription.update(axisPairs);
    }));
  } else {
    model.subscriptions.push(model.axes.onSelectionChange(() => {
      publicAPI.render();
    }));
  }

  publicAPI.setContainer(model.container);
  updateSizeInformation();

  publicAPI.setNumberOfBins = (numberOfBins) => {
    model.numberOfBins = numberOfBins;
    if (model.selectionDataSubscription) {
      model.selectionDataSubscription.update(model.axes.getAxesPairs(), { numberOfBins });
    }
    if (model.histogram2DDataSubscription) {
      model.histogram2DDataSubscription.update(model.axes.getAxesPairs(), { numberOfBins });
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  container: null,
  provider: null,
  needData: true,

  containerHidden: false,

  borderOffsetTop: 35,
  borderOffsetRight: 12,
  borderOffsetBottom: 45,
  borderOffsetLeft: 12,

  axisWidth: 6,
  selectionBarWidth: 8,

  polygonColors: [0, 0, 0],
  selectionColors: [70, 130, 180],

  maxBinCountForOpacityCalculation: 0,

  selectionOpacityAdjustment: 1,
  polygonOpacityAdjustment: 1,

  hoverIndicatorHeight: 10,
  hoverIndicatorWidth: 7,

  numberOfBins: 32,

  useAnnotation: false,
  defaultScore: 0,
  defaultWeight: 1,

  showOnlySelection: false,

  visibleScores: [],
  propagatePartitionScores: false,
  // scores: [{ name: 'Yes', color: '#00C900', value: 1 }, ...]
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'VizComponent');
  CompositeClosureHelper.get(publicAPI, model, ['provider', 'container', 'showOnlySelection', 'visibleScores', 'propagatePartitionScores', 'numberOfBins']);
  CompositeClosureHelper.set(publicAPI, model, ['showOnlySelection', 'propagatePartitionScores']);
  CompositeClosureHelper.dynamicArray(publicAPI, model, 'readOnlyFields');

  parallelCoordinate(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
