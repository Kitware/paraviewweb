import d3 from 'd3';
/* eslint-disable import/no-unresolved */
import style from 'PVWStyle/InfoVizNative/HistogramSelector.mcss';
/* eslint-enable import/no-unresolved */

let publicAPI = null;
let model = null;
let displayOnlyScored = false;
let scorePopupDiv = null;
let dividerPopupDiv = null;

export function init(inPublicAPI, inModel) {
  publicAPI = inPublicAPI;
  model = inModel;
  // TODO make sure model.scores has the right format
  if (typeof model.scores !== 'undefined') {
    // setup a bgColor
    model.scores.forEach((score, i) => {
      if (typeof score.bgColor === 'undefined') {
        const lightness = d3.hsl(score.color).l;
        // make bg darker for light colors.
        const blend = (lightness >= 0.45 ? 0.4 : 0.2);
        const interp = d3.interpolateRgb('#fff', score.color);
        score.bgColor = interp(blend);
      }
    });
  }
}


export function createDefaultDivider(val, uncert) {
  return {
    value: val,
    uncertainty: uncert,
  };
}

// add implicit bounds for the histogram min/max to dividers list
function getRegionBounds(dividers, hobj) {
  return [hobj.min].concat(dividers.map((div) => (div.value)), hobj.max);
}

// Translate our dividers and regions into a piecewise-linear partition (2D array)
// suitable for scoring this histogram.
function dividersToPartition(dividers, regions, hobj, scores) {
  if (!regions || !dividers || !scores) return null;
  if (regions.length !== dividers.length + 1) return null;
  const regionBounds = getRegionBounds(dividers, hobj);
  const uncertScale = 0.005 * (hobj.max - hobj.min);
  const scoreData = [];
  for (let i = 0; i < regions.length; i++) {
    const x0 = (i !== 0 ? regionBounds[i] + dividers[i - 1].uncertainty * uncertScale : regionBounds[i]);
    const x1 = (i !== regions.length - 1 ? regionBounds[i + 1] - dividers[i].uncertainty * uncertScale : regionBounds[i + 1]);
    const yVal = scores[regions[i]].value;
    scoreData.push([x0, yVal], [x1, yVal]);
  }
  return scoreData;
}

// retrieve partition, and re-create dividers and regions
function partitionToDividers(scoreData, def, hobj, scores) {
  if (scoreData.length % 2 !== 0) console.error('partition expected paired points, length', scoreData.length);
  const regions = [];
  const dividers = [];
  for (let i = 0; i < scoreData.length; i += 2) {
    const lower = scoreData[i];
    const upper = scoreData[i + 1];
    if (lower[1] !== upper[1]) console.error('partition mismatch', lower[1], upper[1]);
    const regionVal = scores.findIndex((el) => (el.value === lower[1]));
    regions.push(regionVal);
    if (i < scoreData.length - 2) {
      const nextLower = scoreData[i + 2];
      const divVal = 0.5 * (upper[0] + nextLower[0]);
      const uncert = (upper[0] === nextLower[0] ? 0 : 100 * (nextLower[0] - upper[0]) / (hobj.max - hobj.min));
      dividers.push(createDefaultDivider(divVal, uncert));
    }
  }
  // don't replace the default region with an empty region, so UI can display the default region.
  if (regions.length > 0 && regions[0] !== model.defaultScore) {
    def.regions = regions;
    def.dividers = dividers;
  }
}

// communicate with the server which regions/dividers have changed.
function sendScores(def, hobj) {
  const scoreData = dividersToPartition(def.dividers, def.regions, def.hobj, model.scores);
  if (scoreData === null) {
    console.error('Cannot translate scores to send to provider');
    return;
  }
  if (model.provider.isA('PartitionProvider')) {
    model.provider.changePartition(def.name, scoreData);
    def.scoreDirty = true;
    // set def.scoreDirty, to trigger a load of data. We'll use the current data
    // until the server returns new data - see addSubscriptions() ..
    // model.provider.onPartitionReady() below, which sets scoreDirty again to
    // begin using the new data.
  }
}

// retrieve regions/dividers from the server.
function getScores(def) {
  if (def.scoreDirty && model.provider.isA('PartitionProvider')) {
    if (model.provider.loadPartition(def.name)) {
      const scoreData = model.provider.getPartition(def.name);
      partitionToDividers(scoreData, def, def.hobj, model.scores);
      def.scoreDirty = false;
    }
  }
}

const scoredHeaderClick = (d) => {
  displayOnlyScored = !displayOnlyScored;
  publicAPI.render();
};

export function getDisplayOnlyScored() {
  return displayOnlyScored;
}

export function createGroups(svgGr) {
  // scoring interface background group, must be behind.
  svgGr.insert('g', ':first-child')
    .classed(style.jsScoreBackground, true);
  svgGr.append('g')
    .classed(style.score, true);
  svgGr.append('rect')
    .classed(style.overlay, true)
    .style('cursor', 'default');
}

export function createHeader(header) {
  if (typeof model.scores !== 'undefined') {
    header.append('span')
      .on('click', scoredHeaderClick)
      .append('i')
      .classed(style.jsScoredIcon, true);
    header.append('span')
      .classed(style.jsScoredHeader, true)
      .text('Only Scored')
      .on('click', scoredHeaderClick);
  }
}

export function updateHeader() {
  if (typeof model.scores !== 'undefined') {
    d3.select(`.${style.jsScoredIcon}`)
      // apply class - 'false' should come first to not remove common base class.
      .classed(getDisplayOnlyScored() ? style.allScoredIcon : style.onlyScoredIcon, false)
      .classed(!getDisplayOnlyScored() ? style.allScoredIcon : style.onlyScoredIcon, true);
  }
}

export function createDragDivider(hitIndex, val, def, hobj) {
  let dragD = null;
  if (hitIndex >= 0) {
    // start modifying existing divider
    // it becomes a temporary copy if we go outside our bounds
    dragD = { index: hitIndex,
              newDivider: createDefaultDivider(undefined, def.dividers[hitIndex].uncertainty),
              low: (hitIndex === 0 ? hobj.min : def.dividers[hitIndex - 1].value),
              high: (hitIndex === def.dividers.length - 1 ? hobj.max : def.dividers[hitIndex + 1].value),
            };
  } else {
    // create a temp divider to render.
    dragD = { index: -1,
              newDivider: createDefaultDivider(val, 0),
              low: hobj.min,
              high: hobj.max,
            };
  }
  return dragD;
}

export function moveDragDivider(val, def) {
  if (def.dragDivider.index >= 0) {
    // if we drag outside our bounds, make this a 'temporary' extra divider.
    if (val < def.dragDivider.low) {
      def.dragDivider.newDivider.value = val;
      def.dividers[def.dragDivider.index].value = def.dragDivider.low;
      def.dividers[def.dragDivider.index].uncertainty = 0;
    } else if (val > def.dragDivider.high) {
      def.dragDivider.newDivider.value = val;
      def.dividers[def.dragDivider.index].value = def.dragDivider.high;
      def.dividers[def.dragDivider.index].uncertainty = 0;
    } else {
      def.dividers[def.dragDivider.index].value = val;
      def.dividers[def.dragDivider.index].uncertainty = def.dragDivider.newDivider.uncertainty;
      def.dragDivider.newDivider.value = undefined;
    }
  } else {
    def.dragDivider.newDivider.value = val;
  }
}

// create a sorting helper method, to sort dividers based on div.value
// D3 bug: just an accessor didn't work - must use comparator function
const bisectDividers = d3.bisector((a, b) => (a.value - b.value)).left;

// where are we (to the left of) in the divider list?
// Did we hit one?
export function dividerPick(overCoords, def, marginPx, minVal) {
  const val = def.xScale.invert(overCoords[0]);
  const index = bisectDividers(def.dividers, createDefaultDivider(val));
  let hitIndex = -1;
  if (def.dividers.length > 0) {
    if (index === 0) {
      hitIndex = 0;
    } else if (index === def.dividers.length) {
      hitIndex = index - 1;
    } else {
      hitIndex = (def.dividers[index].value - val < val - def.dividers[index - 1].value ? index : index - 1);
    }
    const margin = def.xScale.invert(marginPx) - minVal;
    // don't pick a divider outside the bounds of the histogram - pick the last region.
    if (Math.abs(def.dividers[hitIndex].value - val) > margin ||
        val < def.hobj.min || val > def.hobj.max) {
      // we weren't close enough...
      hitIndex = -1;
    }
  }
  return [val, index, hitIndex];
}

export function regionPick(overCoords, def, hobj) {
  if (def.dividers.length === 0 || def.regions.length <= 1) return 0;
  const val = def.xScale.invert(overCoords[0]);
  const hitIndex = bisectDividers(def.dividers, createDefaultDivider(val));
  return hitIndex;
}

export function finishDivider(def, hobj, forceDelete = false) {
  const val = def.dragDivider.newDivider.value;
  // if val is defined, we moved an existing divider inside
  // its region, and we just need to render. Otherwise...
  if (val !== undefined || forceDelete) {
    // drag 30 pixels out of the hist to delete.
    const dragOut = def.xScale.invert(30) - hobj.min;
    if (forceDelete || val < hobj.min - dragOut || val > hobj.max + dragOut) {
      if (def.dragDivider.index >= 0) {
        // delete a region.
        if (forceDelete || def.dividers[def.dragDivider.index].value === def.dragDivider.high) {
          def.regions.splice(def.dragDivider.index + 1, 1);
        } else {
          def.regions.splice(def.dragDivider.index, 1);
        }
        // delete the divider.
        def.dividers.splice(def.dragDivider.index, 1);
      }
    } else {
      // adding a divider, we make a new region.
      let replaceRegion = true;
      // if we moved a divider, delete the old region, unless it's one of the edge regions - those persist.
      if (def.dragDivider.index >= 0) {
        if (def.dividers[def.dragDivider.index].value === def.dragDivider.low &&
            def.dragDivider.low !== hobj.min) {
          def.regions.splice(def.dragDivider.index, 1);
        } else if (def.dividers[def.dragDivider.index].value === def.dragDivider.high &&
            def.dragDivider.high !== hobj.max) {
          def.regions.splice(def.dragDivider.index + 1, 1);
        } else {
          replaceRegion = false;
        }
        // delete the old divider
        def.dividers.splice(def.dragDivider.index, 1);
      }
      // add a new divider
      def.dragDivider.newDivider.value = Math.min(hobj.max, Math.max(hobj.min, val));
      // find the index based on dividers sorted by divider.value
      const index = bisectDividers(def.dividers, def.dragDivider.newDivider);
      def.dividers.splice(index, 0, def.dragDivider.newDivider);
      // add a new region if needed, copies the score of existing region.
      if (replaceRegion) {
        def.regions.splice(index, 0, def.regions[index]);
      }
    }
  } else {
    if (def.dragDivider.index >= 0 &&
        def.dividers[def.dragDivider.index].uncertainty !== def.dragDivider.newDivider.uncertainty) {
      def.dividers[def.dragDivider.index].uncertainty = def.dragDivider.newDivider.uncertainty;
    }
  }
  sendScores(def, hobj);
  def.dragDivider = undefined;
}

export function positionPopup(popupDiv, left, top) {
  const clientRect = model.listContainer.getBoundingClientRect();
  const popupRect = popupDiv.node().getBoundingClientRect();
  if (popupRect.width + left > clientRect.width) {
    popupDiv.style('left', 'auto');
    popupDiv.style('right', 0);
  } else {
    popupDiv.style('right', null);
    popupDiv.style('left', `${left}px`);
  }

  if (popupRect.height + top > clientRect.height) {
    popupDiv.style('top', 'auto');
    popupDiv.style('bottom', 0);
  } else {
    popupDiv.style('bottom', null);
    popupDiv.style('top', `${top}px`);
  }
}

export function validateDividerVal(n) {
  // is it a finite float number?
  return !isNaN(parseFloat(n)) && isFinite(n);
}

export function showDividerPopup(dPopupDiv, selectedDef, hobj, coord) {
  const topMargin = 4;
  const rowHeight = 28;
  // 's' SI unit label won't work for a number entry field.
  const formatter = d3.format('.4g');

  dPopupDiv
    .style('display', 'initial');
  positionPopup(dPopupDiv, coord[0] - topMargin - 0.5 * rowHeight,
                coord[1] + model.headerSize - topMargin - 2 * rowHeight);

  const selDivider = selectedDef.dividers[selectedDef.dragDivider.index];
  let savedVal = selDivider.value;
  let savedUncert = selDivider.uncertainty;
  dPopupDiv
    .on('mouseleave', () => {
      if (selectedDef.dragDivider) {
        moveDragDivider(savedVal, selectedDef);
        finishDivider(selectedDef, hobj);
      }
      dPopupDiv
        .style('display', 'none');
      selectedDef.dragDivider = undefined;
      publicAPI.render();
    });
  const valInput = dPopupDiv.select(`.${style.jsDividerValueInput}`)
    .attr('value', formatter(selDivider.value))
    .property('value', formatter(selDivider.value))
    .on('input', () => {
      // typing values, show feedback.
      let val = d3.event.target.value;
      if (!validateDividerVal(val)) val = savedVal;
      moveDragDivider(val, selectedDef);
      publicAPI.render(selectedDef.name);
    })
    .on('change', () => {
      // committed to a value, show feedback.
      let val = d3.event.target.value;
      if (!validateDividerVal(val)) val = savedVal;
      else {
        val = Math.min(hobj.max, Math.max(hobj.min, val));
        d3.event.target.value = val;
        savedVal = val;
      }
      moveDragDivider(val, selectedDef);
      publicAPI.render(selectedDef.name);
    })
    .on('keyup', () => {
      // revert to last committed value
      if (d3.event.key === 'Escape') {
        moveDragDivider(savedVal, selectedDef);
        dPopupDiv.on('mouseleave')();
      } else if (d3.event.key === 'Enter' || d3.event.key === 'Return') {
        // commit current value
        dPopupDiv.on('mouseleave')();
      }
    });
  // initial select/focus so use can immediately change the value.
  valInput.node().select();
  valInput.node().focus();

  dPopupDiv.select(`.${style.jsDividerUncertaintyInput}`)
    .attr('value', formatter(selDivider.uncertainty))
    .property('value', formatter(selDivider.uncertainty))
    .on('input', () => {
      // typing values, show feedback.
      let uncert = d3.event.target.value;
      if (!validateDividerVal(uncert)) uncert = savedUncert;
      selectedDef.dragDivider.newDivider.uncertainty = uncert;
      if (selectedDef.dragDivider.newDivider.value === undefined) {
        // don't use selDivider, might be out-of-date if the server sent us dividers.
        selectedDef.dividers[selectedDef.dragDivider.index].uncertainty = uncert;
      }
      publicAPI.render(selectedDef.name);
    })
    .on('change', () => {
      // committed to a value, show feedback.
      let uncert = d3.event.target.value;
      if (!validateDividerVal(uncert)) uncert = savedUncert;
      else {
        // uncertainty is a %
        uncert = Math.min(100, Math.max(0, uncert));
        d3.event.target.value = uncert;
        savedUncert = uncert;
      }
      selectedDef.dragDivider.newDivider.uncertainty = uncert;
      if (selectedDef.dragDivider.newDivider.value === undefined) {
        selectedDef.dividers[selectedDef.dragDivider.index].uncertainty = uncert;
      }
      publicAPI.render(selectedDef.name);
    })
    .on('keyup', () => {
      if (d3.event.key === 'Escape') {
        selectedDef.dragDivider.newDivider.uncertainty = savedUncert;
        dPopupDiv.on('mouseleave')();
      } else if (d3.event.key === 'Enter' || d3.event.key === 'Return') {
        dPopupDiv.on('mouseleave')();
      }
    });
}
// Divider editing popup allows changing its value or uncertainty, or deleting it.
export function createDividerPopup() {
  const dPopupDiv = d3.select(model.listContainer).append('div')
    .classed(style.dividerPopup, true)
    .style('display', 'none');
  const table = dPopupDiv.append('table');
  const tr1 = table.append('tr');
  tr1.append('td')
    .classed(style.popupCell, true)
    .text('Value:');
  tr1.append('td')
    .classed(style.popupCell, true)
    .append('input')
    .classed(style.jsDividerValueInput, true)
    .attr('type', 'number')
    .attr('step', 'any')
    .style('width', '6em');
  const tr2 = table.append('tr');
  tr2.append('td')
    .classed(style.popupCell, true)
    .text('% Uncertainty:');
  tr2.append('td')
    .classed(style.popupCell, true)
    .append('input')
    .classed(style.jsDividerUncertaintyInput, true)
    .attr('type', 'number')
    .attr('step', 'any')
    .style('width', '6em');
  dPopupDiv
    .append('div').classed(style.scoreDashSpacer, true);
  dPopupDiv
    .append('div')
      .style('text-align', 'center')
    .append('input')
      .classed(style.scoreButton, true)
      .style('align', 'center')
      .attr('type', 'button')
      .attr('value', 'Delete Divider')
      .on('click', () => {
        finishDivider(model.selectedDef, model.selectedDef.hobj, true);
        dPopupDiv
          .style('display', 'none');
        publicAPI.render();
      });
  return dPopupDiv;
}

export function showScorePopup(sPopupDiv, coord, selRow) {
  // it seemed like a good idea to use getBoundingClientRect() to determine row height
  // but it returns all zeros when the popup has been invisible...
  const topMargin = 4;
  const rowHeight = 26;

  sPopupDiv
    .style('display', 'initial');
  positionPopup(sPopupDiv, coord[0] - topMargin - 0.6 * rowHeight,
                coord[1] + model.headerSize - topMargin - (0.6 + selRow) * rowHeight);

  sPopupDiv.selectAll(`.${style.jsScoreLabel}`)
    .style('background-color', (d, i) => ((i === selRow) ? d.bgColor : '#fff'));
}

export function createScorePopup() {
  const sPopupDiv = d3.select(model.listContainer).append('div')
    .classed(style.scorePopup, true)
    .style('display', 'none')
    .on('mouseleave', () => {
      sPopupDiv
        .style('display', 'none');
      model.selectedDef.dragDivider = undefined;
    });
  // create radio-buttons that allow choosing the score for the selected region
  const scoreChoices = sPopupDiv.selectAll(`.${style.jsScoreChoice}`)
    .data(model.scores);
  scoreChoices.enter()
    .append('label')
      .classed(style.scoreLabel, true)
      .text((d) => d.name)
      .each(function myLabel(data, index) {
        // because we use 'each' and re-select the label, need to use parent 'index'
        // instead of 'i' in the (d, i) => functions below - i is always zero.
        const label = d3.select(this);
        label.append('span')
          .classed(style.scoreSwatch, true)
          .style('background-color', (d) => (d.color));
        label.append('input')
          .classed(style.scoreChoice, true)
          .attr('name', 'score_choice_rb')
          .attr('type', 'radio')
          .attr('value', (d) => (d.name))
          .property('checked', (d) => (index === model.defaultScore))
          .on('click', (d) => {
            // use click, not change, so we get notified even when current value is chosen.
            const def = model.selectedDef;
            def.regions[def.hitRegionIndex] = index;
            def.dragDivider = undefined;
            sPopupDiv
              .style('display', 'none');
            sendScores(def, def.hobj);
            publicAPI.render();
          });
      });
  sPopupDiv
    .append('div').classed(style.scoreDashSpacer, true);
  // create a button for creating a new divider, so we don't require
  // the invisible alt/ctrl click to create one.
  sPopupDiv
    .append('input')
      .classed(style.scoreButton, true)
      .attr('type', 'button')
      .attr('value', 'New Divider')
      .on('click', () => {
        finishDivider(model.selectedDef, model.selectedDef.hobj);
        sPopupDiv
          .style('display', 'none');
        publicAPI.render();
      });
  return sPopupDiv;
}

export function createPopups() {
  if (typeof model.scores !== 'undefined') {
    scorePopupDiv = d3.select(model.listContainer).select(`.${style.jsScorePopup}`);
    if (scorePopupDiv.empty()) {
      scorePopupDiv = createScorePopup();
    }
    dividerPopupDiv = d3.select(model.listContainer).select(`.${style.jsDividerPopup}`);
    if (dividerPopupDiv.empty()) {
      dividerPopupDiv = createDividerPopup();
    }
  }
}

export function showScore(def) {
  // show the regions when: editing, or when they are non-default. CSS rule makes visible on hover.
  return (def.editScore || (typeof def.regions !== 'undefined' &&
                            ((def.regions.length > 1) || (def.regions[0] !== model.defaultScore))));
}

export function filterFieldNames(fieldNames) {
  if (getDisplayOnlyScored()) {
    // filter for fields that have scores
    return fieldNames.filter((name) => (showScore(model.provider.getField(name))));
  }
  return fieldNames;
}

const getMouseCoords = (tdsl) => {
  // y-coordinate is not handled correctly for svg or svgGr or overlay inside scrolling container.
  const coord = d3.mouse(tdsl.node());
  return [coord[0] - model.histMargin.left, coord[1] - model.histMargin.top];
};

export function prepareItem(def, idx, svgGr, tdsl) {
  if (typeof model.scores === 'undefined') return;
  if (typeof def.dividers === 'undefined') {
    def.dividers = [];
    def.regions = [model.defaultScore];
    def.editScore = false;
    def.scoreDirty = true;
  }
  const hobj = def.hobj;

  // retrieve scores from the server, if available.
  getScores(def, hobj);

  const gScore = svgGr.select(`.${style.jsScore}`);
  let drag = null;
  if (def.editScore) {
    // add temp dragged divider, if needed.
    const dividerData = ((typeof def.dragDivider !== 'undefined') && def.dragDivider.newDivider.value !== undefined) ?
                          def.dividers.concat(def.dragDivider.newDivider) : def.dividers;
    const dividers = gScore.selectAll('line')
      .data(dividerData);
    dividers.enter().append('line');
    dividers
      .attr('x1', d => def.xScale(d.value))
      .attr('y1', 0)
      .attr('x2', d => def.xScale(d.value))
      .attr('y2', () => model.histHeight)
      .attr('stroke-width', 1)
      .attr('stroke', 'black');
    dividers.exit().remove();

    const uncertRegions = gScore.selectAll(`.${style.jsScoreUncertainty}`)
      .data(dividerData);
    uncertRegions.enter().append('rect')
      .classed(style.jsScoreUncertainty, true)
      .attr('rx', 8)
      .attr('ry', 8);
    uncertRegions
      .attr('x', d => def.xScale(d.value - 0.005 * d.uncertainty * (hobj.max - hobj.min)))
      .attr('y', 0)
      // to get a width, need to start from 'zero' of this scale, which is hobj.min
      .attr('width', (d, i) => def.xScale(hobj.min + 0.01 * d.uncertainty * (hobj.max - hobj.min)))
      .attr('height', () => model.histHeight)
      .attr('fill', '#000')
      .attr('opacity', (d) => (d.uncertainty > 0 ? '0.2' : '0'));
    uncertRegions.exit().remove();

    let dragDivLabel = gScore.select(`.${style.jsScoreDivLabel}`);
    if (typeof def.dragDivider !== 'undefined') {
      if (dragDivLabel.empty()) {
        dragDivLabel = gScore.append('text')
          .classed(style.jsScoreDivLabel, true)
          .attr('text-anchor', 'middle')
          .attr('stroke', 'none')
          .attr('background-color', '#fff')
          .attr('dy', '.71em');
      }
      const formatter = d3.format('.3s');
      const divVal = (def.dragDivider.newDivider.value !== undefined ?
                      def.dragDivider.newDivider.value :
                      def.dividers[def.dragDivider.index].value);
      dragDivLabel
        .text(formatter(divVal))
        .attr('x', `${def.xScale(divVal)}`)
        .attr('y', `${model.histHeight + 2}`);
    } else if (!dragDivLabel.empty()) {
      dragDivLabel.remove();
    }

    // divider interaction events.
    // Drag flow: drag a divider inside its current neighbors.
    // A divider outside its neighbors or a new divider is a temp divider,
    // added to the end of the list when rendering. Doesn't affect regions that way.
    drag = d3.behavior.drag()
      .on('dragstart', () => {
        const overCoords = getMouseCoords(tdsl);
        const [val, , hitIndex] = dividerPick(overCoords, def, model.dragMargin, hobj.min);
        if (d3.event.sourceEvent.altKey || d3.event.sourceEvent.ctrlKey) {
          // create a temp divider to render.
          def.dragDivider = createDragDivider(-1, val, def, hobj);
          publicAPI.render();
        } else {
          if (hitIndex >= 0) {
            // start dragging existing divider
            // it becomes a temporary copy if we go outside our bounds
            def.dragDivider = createDragDivider(hitIndex, undefined, def, hobj);
            publicAPI.render();
          }
        }
      })
      .on('drag', () => {
        const overCoords = getMouseCoords(tdsl);
        if (typeof def.dragDivider === 'undefined' ||
            scorePopupDiv.style('display') !== 'none' ||
            dividerPopupDiv.style('display') !== 'none') return;
        const val = def.xScale.invert(overCoords[0]);
        moveDragDivider(val, def);
        publicAPI.render(def.name);
      })
      .on('dragend', () => {
        if (typeof def.dragDivider === 'undefined' ||
            scorePopupDiv.style('display') !== 'none' ||
            dividerPopupDiv.style('display') !== 'none') return;
        finishDivider(def, hobj);
        publicAPI.render();
      });
  } else {
    gScore.selectAll('line').remove();
    gScore.selectAll(`.${style.jsScoreUncertainty}`).remove();
  }

  // score regions
  // there are implicit bounds at the min and max.
  const regionBounds = getRegionBounds(def.dividers, hobj);
  const scoreRegions = gScore.selectAll(`.${style.jsScoreRect}`)
    .data(def.regions);
  // duplicate background regions are opaque, for a solid bright color.
  const scoreBgRegions = svgGr.select(`.${style.jsScoreBackground}`).selectAll('rect')
    .data(def.regions);
  const numRegions = def.regions.length;
  [{ sel: scoreRegions, opacity: 0.2, class: style.scoreRegionFg },
    { sel: scoreBgRegions, opacity: 1.0, class: style.scoreRegionBg }].forEach((reg) => {
      reg.sel.enter().append('rect')
        .classed(reg.class, true);
      // first and last region should hang 6 pixels over the start/end of the axis.
      const overhang = 6;
      reg.sel
        .attr('x', (d, i) => (def.xScale(regionBounds[i]) - (i === 0 ? overhang : 0)))
        .attr('y', def.editScore ? 0 : model.histHeight)
        // width might be === overhang if a divider is dragged all the way to min/max.
        .attr('width', (d, i) => (def.xScale(regionBounds[i + 1]) - def.xScale(regionBounds[i])) +
                                  (i === 0 ? overhang : 0) + (i === numRegions - 1 ? overhang : 0))
        .attr('height', def.editScore ? model.histHeight : model.histMargin.bottom)
        .attr('fill', (d) => (model.scores[d].color))
        .attr('opacity', showScore(def) ? reg.opacity : '0');
      reg.sel.exit().remove();
    });

  // invisible overlay to catch mouse events.
  const svgOverlay = svgGr.select(`.${style.jsOverlay}`);
  svgOverlay
    .attr('x', -model.histMargin.left)
    .attr('y', -model.histMargin.top)
    .attr('width', publicAPI.svgWidth())
    .attr('height', publicAPI.svgHeight()) // allow clicks inside x-axis.
    .on('click', () => {
      // preventDefault() in dragstart didn't help, so watch for altKey or ctrlKey.
      if (d3.event.defaultPrevented || d3.event.altKey || d3.event.ctrlKey) return; // click suppressed (by drag handling)
      const overCoords = getMouseCoords(tdsl);
      if (overCoords[1] > model.histHeight) {
        def.editScore = !def.editScore;
        svgOverlay.style('cursor', def.editScore ? 's-resize' : 'pointer');
        publicAPI.render();
        return;
      }
      if (def.editScore) {
        // if we didn't create or drag a divider, pick a region or divider
        const hitRegionIndex = regionPick(overCoords, def, hobj);
        // select a def, show popup.
        def.hitRegionIndex = hitRegionIndex;
        // create a temp divider in case we choose 'new |' from the popup.
        const [val, , hitIndex] = dividerPick(overCoords, def, model.dragMargin, hobj.min);
        const coord = d3.mouse(model.listContainer);
        model.selectedDef = def;
        if (hitIndex >= 0) {
          // pick an existing divider, popup to edit value, uncertainty, or delete.
          def.dragDivider = createDragDivider(hitIndex, undefined, def, hobj);
          showDividerPopup(dividerPopupDiv, model.selectedDef, hobj, coord);
        } else {
          if (typeof def.dragDivider === 'undefined') {
            def.dragDivider = createDragDivider(-1, val, def, hobj);
          } else {
            console.log('Internal: unexpected existing divider');
            def.dragDivider.newDivider.value = val;
          }

          const selRow = def.regions[def.hitRegionIndex];
          showScorePopup(scorePopupDiv, coord, selRow);
        }
      }
    })
    .on('mousemove', () => {
      const overCoords = getMouseCoords(tdsl);
      if (def.editScore) {
        const [, , hitIndex] = dividerPick(overCoords, def, model.dragMargin, hobj.min);
        let cursor = 'pointer';
        // if we're over the bottom, indicate a click will shrink regions
        if (overCoords[1] > model.histHeight) cursor = 's-resize';
        // if we're over a divider, indicate drag-to-move
        else if ((def.dragIndex >= 0) || (hitIndex >= 0)) cursor = 'ew-resize';
        // if modifiers are held down, we'll create a divider
        else if (d3.event.altKey || d3.event.ctrlKey) cursor = 'crosshair';
        svgOverlay.style('cursor', cursor);
      } else {
        // over the bottom, indicate we can start editing regions
        const pickIt = overCoords[1] > model.histHeight;
        svgOverlay.style('cursor', pickIt ? 'pointer' : 'default');
      }
    });
  if (def.editScore) {
    svgOverlay.call(drag);
  } else {
    svgOverlay.on('.drag', null);
  }
}

export function addSubscriptions() {
  model.subscriptions.push(model.provider.onPartitionReady((field) => {
    model.provider.getField(field).scoreDirty = true;
    publicAPI.render(field);
  }));
}

export default {
  addSubscriptions,
  createGroups,
  createHeader,
  createPopups,
  filterFieldNames,
  init,
  prepareItem,
  updateHeader,
};
