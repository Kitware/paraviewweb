function affine(inMin, val, inMax, outMin, outMax) {
  return (((val - inMin) / (inMax - inMin)) * (outMax - outMin)) + outMin;
}

export function createParallelCoordinates(canvasElement, fetchHistogramFunction, selectionQueryFunction, selectionClearedCallback) {
  var canvas = canvasElement,
    ctx = canvasElement.getContext('2d'),

    fgCanvas = document.createElement('canvas'),
    fgCtx = fgCanvas.getContext('2d'),
    bgCanvas = document.createElement('canvas'),
    bgCtx = bgCanvas.getContext('2d'),

    fetchHistogram = fetchHistogramFunction,
    querySelection = selectionQueryFunction,
    clearCallback = selectionClearedCallback,

    axisList = [],
    orientationList = [],

    axesCenters = [],
    axesAnnotations = [],
    axesDataRanges = [],
    axisSpacing = 0,

    histogramList = [],
    histogramCount = 0,

    selectionResult = null,

    borderOffset = {
      top: 72, // 47,
      right: 10,
      bottom: 20,
      left: 10,
    },
    axisWidth = 3,
    canvasArea = {
      width: canvas.width,
      height: canvas.height,
    },
    drawableArea = {
      width: canvasArea.width - (borderOffset.left + borderOffset.right),
      height: canvasArea.height - (borderOffset.top + borderOffset.bottom),
    },
    controlBoxSize = {
      width: 66,
      height: 13,
    },

    // Black on white color scheme
    axisStyle = 'rgba(128,128,128,1)',
    selectedAxisStyle = 'rgba(105, 195, 255, 1)',
    labelStyle = 'rgba(0,0,0,1)',
    controlStyle = 'rgba(128,128,128,1)',
    polygonColors = [0, 0, 0],
    selectionColors = [70, 130, 180],

    maxBinCountOverAllHistograms = 0,
    maxBinCountOverAllSelections = 0,
    maxBinCountForOpacityCalculation = 0,

    selectionOpacityAdjustment = 1,
    polygonOpacityAdjustment = 1,

    dragging = false,
    mouseDownCoords = {
      x: -1,
      y: -1,
    },
    clickThreshold = 1,
    axisSelectThreshold = 10,
    selectedAxisIndex = -1,

    doSanityTesting = false;


  function updateAxisList(newAxes) {
    var i;
    axisList = newAxes.slice();
    orientationList = [];
    axesAnnotations = [];
    axesDataRanges = [];
    histogramList = [];
    histogramCount = 0;
    selectionResult = null;
    for (i = 0; i < axisList.length; ++i) {
      orientationList.push(true);
      // axesAnnotations.push([{}]);
      axesAnnotations.push([]);
    }
  }

  function sumCheckHistograms(hLeft, hRight) {
    var leftBinMap = {},
      rightBinMap = {},
      bin = null,
      i;

    for (i = 0; i < hLeft.bins.length; ++i) {
      bin = hLeft.bins[i];
      if (!leftBinMap.hasOwnProperty(bin.x)) {
        leftBinMap[bin.x] = 0;
      }
      leftBinMap[bin.x] += bin.count;
    }

    for (i = 0; i < hRight.bins.length; ++i) {
      bin = hRight.bins[i];
      if (!rightBinMap.hasOwnProperty(bin.y)) {
        rightBinMap[bin.y] = 0;
      }
      rightBinMap[bin.y] += bin.count;
    }

    Object.keys(leftBinMap).forEach(leftKey => {
      if (leftBinMap[leftKey] !== rightBinMap[leftKey]) {
        console.error('Sanity check failed for bin:', leftKey);
      }
    });

    Object.keys(rightBinMap).forEach(rightKey => {
      if (rightBinMap[rightKey] !== leftBinMap[rightKey]) {
        console.error('Sanity check failed for bin:', rightKey);
      }
    });

    // console.log('Sanity check results:');
    // console.log(leftBinMap);
    // console.log(rightBinMap);
  }

  function getMaxHistogramBinCount(histoList) {
    var maxCount = 0,
      i,
      histogram,
      result;

    for (i = 0; i < histoList.length; ++i) {
      histogram = histoList[i];
      result = {
        max: 0,
      };

      histogram.bins.map((currentValue, index, array) => {
        if (currentValue.count > this.max) {
          this.max = currentValue.count;
          return true;
        }
        return false;
      }, result);

      if (result.max > maxCount) {
        maxCount = result.max;
      }
    }

    if (doSanityTesting) {
      for (i = 0; i < histoList.length - 1; ++i) {
        sumCheckHistograms(histoList[i], histoList[i + 1]);
      }
    }

    return maxCount;
  }

  function perfRound(val) {
    return (0.5 + val) | 0;
  }

  function screenToData(screenY, dataRange, rightSideUp) {
    var dataY = affine(canvasArea.height - borderOffset.bottom, screenY, borderOffset.top, dataRange[0], dataRange[1]);
    if (rightSideUp === false) {
      dataY = affine(borderOffset.top, screenY, canvasArea.height - borderOffset.bottom, dataRange[0], dataRange[1]);
    }
    return dataY;
  }

  function dataToScreen(dataY, dataRange, rightSideUp) {
    var screenY = affine(dataRange[0], dataY, dataRange[1], canvasArea.height - borderOffset.bottom, borderOffset.top);
    if (rightSideUp === false) {
      screenY = affine(dataRange[0], dataY, dataRange[1], borderOffset.top, canvasArea.height - borderOffset.bottom);
    }
    return perfRound(screenY);
  }

  function isAxisAnnotated(idx) {
    // return axesAnnotations[idx][0].hasOwnProperty('dataRange');
    return axesAnnotations[idx].length > 0 && axesAnnotations[idx][0].hasOwnProperty('dataRange');
  }

  function updateAxisAnnotation(idx, startY, endY) {
    var annList = axesAnnotations[idx],
      yRange = axesDataRanges[idx],
      y1 = screenToData(startY, yRange, orientationList[idx]),
      y2 = screenToData(endY, yRange, orientationList[idx]),
      tmp;

    var ymin = y1,
      ymax = y2;

    if (ymin > ymax) {
      tmp = ymin;
      ymin = ymax;
      ymax = tmp;
    }

    annList[annList.length - 1] = {
      dataRange: [ymin, ymax],
    };
  }

  function drawControlBox(top, right, bottom, left, orientUp, axisPos) {
    var controlSpacing = 1,
      vertMid = top + ((bottom - top) / 2),
      horizMid = left + ((right - left) / 2),
      boxWidth = right - left,
      boxHeight = bottom - top,
      controlWidth = (boxWidth - (controlSpacing * 4)) / 3,
      controlHeight = boxHeight - (controlSpacing * 2);

    ctx.fillStyle = controlStyle;

    // Draw left triangle
    if (axisPos >= 0) {
      ctx.beginPath();
      ctx.moveTo(left + controlSpacing, vertMid);
      ctx.lineTo(left + controlSpacing + controlWidth, top + controlSpacing);
      ctx.lineTo(left + controlSpacing + controlWidth, top + controlSpacing + controlHeight);
      ctx.closePath();
      ctx.fill();
    }

    // Draw center triangle
    ctx.beginPath();
    ctx.moveTo(left + controlWidth + (2 * controlSpacing), vertMid);
    if (orientUp) {
      ctx.lineTo(horizMid, top + controlSpacing);
    } else {
      ctx.lineTo(horizMid, bottom - controlSpacing);
    }
    ctx.lineTo(left + (2 * controlWidth) + (2 * controlSpacing), vertMid);
    ctx.closePath();
    ctx.fill();

    // Draw right triangle
    if (axisPos <= 0) {
      ctx.beginPath();
      ctx.moveTo(right - controlSpacing, vertMid);
      ctx.lineTo(right - controlSpacing - controlWidth, top + controlSpacing + controlHeight);
      ctx.lineTo(right - controlSpacing - controlWidth, top + controlSpacing);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawAnnotationIndicators() {
    var i;
    for (i = 0; i < axesCenters.length; ++i) {
      ctx.beginPath();
      if (isAxisAnnotated(i)) {
        ctx.arc(axesCenters[i], 10, 8, 0, 2 * Math.PI);
        ctx.fillStyle = selectedAxisStyle;
        ctx.fill();
      } else {
        ctx.arc(axesCenters[i], 10, 6, 0, 2 * Math.PI);
        ctx.strokeStyle = controlStyle;
        ctx.stroke();
      }
    }
  }

  function drawAxisControls() {
    var pos = 0,
      j;
    for (j = 0; j < axesCenters.length; ++j) {
      pos = 0;
      if (j === 0) {
        pos = -1;
      } else if (j === axesCenters.length - 1) {
        pos = 1;
      }
      drawControlBox(25, // top
        axesCenters[j] + (controlBoxSize.width / 2), // right
        25 + controlBoxSize.height, // bottom
        axesCenters[j] - (controlBoxSize.width / 2), // left
        orientationList[j], // orientation (up or down)
        pos); // which (if either) edge is this axis
    }
  }

  function drawAxisTicks(axisCenter, paramRange, orientUp) {
    ctx.font = '9px sans-serif';
    if (orientUp) {
      ctx.fillText(paramRange[0], axisCenter, borderOffset.top + drawableArea.height + 13);
      ctx.fillText(paramRange[1], axisCenter, borderOffset.top - 5);
    } else {
      ctx.fillText(paramRange[1], axisCenter, borderOffset.top + drawableArea.height + 13);
      ctx.fillText(paramRange[0], axisCenter, borderOffset.top - 5);
    }
  }

  function drawAxisLabels() {
    var ypos = 51,
      idxOfLast = axesCenters.length - 1,
      i;

    ctx.font = '12px sans-serif';
    ctx.fillStyle = labelStyle;
    ctx.textAlign = 'start';
    ctx.fillText(axisList[0], axesCenters[0], ypos);
    drawAxisTicks(axesCenters[0], axesDataRanges[0], orientationList[0]);

    for (i = 1; i < axisList.length - 1; ++i) {
      ctx.font = '12px sans-serif';
      ctx.fillStyle = labelStyle;
      ctx.textAlign = 'center';
      ctx.fillText(axisList[i], axesCenters[i], ypos);
      drawAxisTicks(axesCenters[i], axesDataRanges[i], orientationList[i]);
    }

    ctx.font = '12px sans-serif';
    ctx.fillStyle = labelStyle;
    ctx.textAlign = 'end';
    ctx.fillText(axisList[idxOfLast], axesCenters[idxOfLast], ypos);
    drawAxisTicks(axesCenters[idxOfLast], axesDataRanges[idxOfLast], orientationList[idxOfLast]);
  }

  function drawAxes() {
    var i,
      j,
      annList,
      dataRange,
      axisRightSideUp,
      ann;

    // Draw the axes themselves
    for (j = 0; j < axesCenters.length; ++j) {
      ctx.strokeStyle = axisStyle;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(axesCenters[j], borderOffset.top);
      ctx.lineTo(axesCenters[j], canvasArea.height - borderOffset.bottom);
      ctx.stroke();

      // Now draw any annotation regions on top of this axis
      annList = axesAnnotations[j];
      dataRange = axesDataRanges[j];
      axisRightSideUp = orientationList[j];

      ctx.strokeStyle = selectedAxisStyle;
      ctx.lineWidth = 5;

      for (i = 0; i < annList.length; ++i) {
        ann = annList[i];
        if (ann.dataRange) {
          ctx.beginPath();
          ctx.moveTo(axesCenters[j], dataToScreen(ann.dataRange[0], dataRange, axisRightSideUp));
          ctx.lineTo(axesCenters[j], dataToScreen(ann.dataRange[1], dataRange, axisRightSideUp));
          ctx.stroke();
        }
      }
    }
  }

  function drawPolygons(gCtx, idxOne, idxTwo, histogram, colors) {
    var rangeOne = histogram.y.extent,
      rangeTwo = histogram.x.extent,
      deltaOne = histogram.y.delta,
      deltaTwo = histogram.x.delta,
      xleft = axesCenters[idxOne],
      xright = axesCenters[idxTwo],
      bin = null,
      opacity = 0.0,
      yleft1 = 0.0,
      yleft2 = 0.0,
      yright1 = 0.0,
      yright2 = 0.0,
      yLeftMin = 0,
      yLeftMax = 0,
      yRightMin = 0,
      yRightMax = 0,
      i;

    for (i = 0; i < histogram.bins.length; ++i) {
      bin = histogram.bins[i];
      opacity = affine(0, bin.count, maxBinCountForOpacityCalculation, 0.0, 1.0);
      yleft1 = dataToScreen(bin.y, rangeOne, orientationList[idxOne]);
      yleft2 = dataToScreen(bin.y + deltaOne, rangeOne, orientationList[idxOne]);
      yright1 = dataToScreen(bin.x, rangeTwo, orientationList[idxTwo]);
      yright2 = dataToScreen(bin.x + deltaTwo, rangeTwo, orientationList[idxTwo]);
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
      gCtx.fillStyle = `rgba( ${colors.slice(0, 2).join(', ')}, ${opacity} )`;
      gCtx.fill();
    }
  }

  function render() {
    var i,
      j,
      k,
      selectionList;

    /* eslint-disable no-use-before-define */
    if (axisList === null || axisList.length <= 1) {
      console.error('Parallel coordinates cannot be rendered without at least two parameters selected.');
      return;
    } else if (!histogramList || histogramList.length !== axisList.length - 1) {
      fetchHistograms();
      return;
    }
    /* eslint-enable no-use-before-define */

    ctx.globalAlpha = 1.0;

    canvasArea.width = canvas.width;
    canvasArea.height = canvas.height;

    fgCanvas.width = canvas.width;
    fgCanvas.height = canvas.height;
    bgCanvas.width = canvas.width;
    bgCanvas.height = canvas.height;

    drawableArea.width = canvasArea.width - (borderOffset.left + borderOffset.right);
    drawableArea.height = canvasArea.height - (borderOffset.top + borderOffset.bottom);

    axisSpacing = (drawableArea.width - axisWidth) / (axisList.length - 1);

    axesCenters = [];
    axesCenters.push(borderOffset.left + (axisWidth / 2));

    for (i = 1; i < axisList.length; ++i) {
      // axesCenters.push(axesCenters[i-1] + axisSpacing);
      axesCenters.push(perfRound(axesCenters[i - 1] + axisSpacing));
    }

    ctx.clearRect(0, 0, canvasArea.width, canvasArea.height);
    fgCtx.clearRect(0, 0, canvasArea.width, canvasArea.height);
    bgCtx.clearRect(0, 0, canvasArea.width, canvasArea.height);

    // First lay down the 'context' polygons
    maxBinCountForOpacityCalculation = maxBinCountOverAllHistograms;
    for (j = 0; j < histogramList.length; ++j) {
      drawPolygons(bgCtx, j, j + 1, histogramList[j], polygonColors);
    }

    ctx.globalAlpha = polygonOpacityAdjustment;
    ctx.drawImage(bgCanvas, 0, 0, canvasArea.width, canvasArea.height, 0, 0, canvasArea.width, canvasArea.height);

    // If there is a selection, draw that (the 'focus') on top of the polygons
    if (selectionResult) {
      selectionList = selectionResult.counts[0];
      maxBinCountForOpacityCalculation = maxBinCountOverAllSelections;
      for (k = 0; k < selectionList.length; ++k) {
        drawPolygons(fgCtx, k, k + 1, selectionList[k], selectionColors);
      }

      ctx.globalAlpha = selectionOpacityAdjustment;
      ctx.drawImage(fgCanvas, 0, 0, canvasArea.width, canvasArea.height, 0, 0, canvasArea.width, canvasArea.height);
    }

    ctx.globalAlpha = 1.0;

    // Now draw all the decorations and controls
    drawAxes();
    drawAxisLabels();
    drawAxisControls();
    drawAnnotationIndicators();
  }

  function fastRender() {
    ctx.clearRect(0, 0, canvasArea.width, canvasArea.height);

    ctx.globalAlpha = polygonOpacityAdjustment;
    ctx.drawImage(bgCanvas, 0, 0, canvasArea.width, canvasArea.height, 0, 0, canvasArea.width, canvasArea.height);

    ctx.globalAlpha = selectionOpacityAdjustment;
    ctx.drawImage(fgCanvas, 0, 0, canvasArea.width, canvasArea.height, 0, 0, canvasArea.width, canvasArea.height);

    ctx.globalAlpha = 1.0;
    drawAxes();
    drawAxisLabels();
    drawAxisControls();
    drawAnnotationIndicators();
  }

  function receivedHistogram(histIdx, histogram) {
    histogramCount += 1;
    histogramList[histIdx] = histogram;

    if (histogram.y.delta === 0) {
      histogram.y.delta = 1;
      histogram.y.extent[1] = histogram.y.extent[0] + 1;
    }

    if (histogram.x.delta === 0) {
      histogram.x.delta = 1;
      histogram.x.extent[1] = histogram.x.extent[0] + 1;
    }

    axesDataRanges[histIdx] = histogram.y.extent.slice();

    if (histIdx === axisList.length - 2) {
      axesDataRanges[histIdx + 1] = histogram.x.extent.slice();
    }

    if (histogramCount === axisList.length - 1) { // We have received all histograms
      maxBinCountOverAllHistograms = getMaxHistogramBinCount(histogramList);
      render();
    }
  }

  function retrieve2DHistogram(idx1, idx2) {
    fetchHistogram(axisList[idx2], axisList[idx1], (hist) => {
      receivedHistogram(idx1, hist);
    });
  }

  function fetchHistograms() {
    var k;

    histogramList = [];
    axesDataRanges = [];
    histogramCount = 0;
    maxBinCountOverAllHistograms = 0;

    // Now fetch all the histograms
    for (k = 0; k < axisList.length - 1; ++k) {
      retrieve2DHistogram(k, k + 1);
    }
  }

  function fetchSelection() {
    var doQuery = false,
      query = {},
      ranges = {},
      histograms = [],
      i,
      j,
      paramName,
      annList,
      ann,
      rangeList;


    if (querySelection) {
      selectionResult = null;
      maxBinCountOverAllSelections = 0;


      for (i = 0; i < axesAnnotations.length; ++i) {
        annList = axesAnnotations[i];
        paramName = axisList[i];
        rangeList = [];
        for (j = 0; j < annList.length; ++j) {
          ann = annList[j];
          if (ann.dataRange) {
            rangeList.push(ann.dataRange);
          }
        }
        if (rangeList.length > 0) {
          ranges[paramName] = rangeList;
          doQuery = true;
        }
      }
      if (doQuery === true) {
        for (j = 0; j < axisList.length - 1; ++j) {
          histograms.push([axisList[j + 1], axisList[j]]);
        }
        query = {
          ranges,
          histograms,
        };
        querySelection(query, (queryResult) => {
          maxBinCountOverAllSelections = getMaxHistogramBinCount(queryResult.counts[0]);
          selectionResult = queryResult;
          render();
        });
      } else {
        maxBinCountOverAllSelections = 0;
        selectionResult = null;
        clearCallback();
        render();
      }
    }
  }

  function fetchData() {
    fetchHistograms();
    fetchSelection();
  }

  function clearSelection() {
    var i;

    selectionResult = null;
    maxBinCountOverAllSelections = 0;

    for (i = 0; i < axesAnnotations.length; ++i) {
      axesAnnotations[i] = [];
    }

    render();
  }

  function updateOpacityAdjustments(adjustments) {
    if (adjustments.hasOwnProperty('background')) {
      polygonOpacityAdjustment = adjustments.background;
    }
    if (adjustments.hasOwnProperty('selection')) {
      selectionOpacityAdjustment = adjustments.selection;
    }
    fastRender();
  }

  function swapParameters(idx1, idx2) {
    var tmpName = axisList[idx2],
      tmpOrient = orientationList[idx2],
      tmpAnn = axesAnnotations[idx2],
      tmpRange = axesDataRanges[idx2];

    axisList[idx2] = axisList[idx1];
    orientationList[idx2] = orientationList[idx1];
    axesAnnotations[idx2] = axesAnnotations[idx1];
    axesDataRanges[idx2] = axesDataRanges[idx1];

    axisList[idx1] = tmpName;
    orientationList[idx1] = tmpOrient;
    axesAnnotations[idx1] = tmpAnn;
    axesDataRanges[idx1] = tmpRange;
  }

  /* eslint-disable complexity */
  function mouseHandler(mouseEvent) {
    var x = mouseEvent.x,
      y = mouseEvent.y,
      action = mouseEvent.action,
      delX,
      delY,
      i,
      distToAxis,
      absDistToAxis;

    if (action === 'mouseup') {
      delX = Math.abs(x - mouseDownCoords.x);
      delY = Math.abs(y - mouseDownCoords.y);
      if (y <= controlBoxSize.height + 25 && delX <= clickThreshold && delY <= clickThreshold) {
        for (i = 0; i < axesCenters.length; ++i) {
          distToAxis = x - axesCenters[i];
          absDistToAxis = Math.abs(distToAxis);
          if (absDistToAxis <= (controlBoxSize.width / 2)) {
            if (y <= 25) {
              if (isAxisAnnotated(i)) {
                // axesAnnotations[i] = [{}];
                axesAnnotations[i] = [];
                fetchSelection();
              }
            } else {
              if (absDistToAxis < (controlBoxSize.width / 3 / 2)) {
                orientationList[i] = !orientationList[i];
                render();
              } else if (distToAxis > 0) {
                if (i < (axesCenters.length - 1)) {
                  swapParameters(i, i + 1);
                  fetchData();
                }
              } else {
                if (i > 0) {
                  swapParameters(i - 1, i);
                  fetchData();
                }
              }
            }
          }
        }
      } else if (dragging) {
        fetchSelection();
      }
      dragging = false;
      mouseDownCoords.x = -1;
      mouseDownCoords.y = -1;
    } else if (action === 'mousedown') {
      mouseDownCoords.x = x;
      mouseDownCoords.y = y;
      if (querySelection && y > borderOffset.top && y < (canvasArea.height - borderOffset.bottom)) {
        selectedAxisIndex = -1;
        for (i = 0; i < axesCenters.length; ++i) {
          absDistToAxis = Math.abs(x - axesCenters[i]);
          if (absDistToAxis <= axisSelectThreshold) {
            dragging = true;
            selectedAxisIndex = i;
            axesAnnotations[i].push({
              dataRange: [0, 0],
            });
            break;
          }
        }
      }
    } else { // must be a move event, ignore if not dragging...
      if (dragging) {
        updateAxisAnnotation(selectedAxisIndex, mouseDownCoords.y, y);
        drawAxes();
      }
    }
  }
  /* eslint-enable complexity */

  const externalAPI = {
    mouseHandler,
    render,
    updateAxisList,
    clearSelection,
    updateOpacityAdjustments,
  };

  return Object.freeze(externalAPI);
}
