import d3 from 'd3';

import style from 'PVWStyle/InfoVizNative/HistogramSelector.mcss';

import SelectionBuilder from '../../../Common/Misc/SelectionBuilder';
import AnnotationBuilder from '../../../Common/Misc/AnnotationBuilder';

import downArrowImage from './down_arrow.png';

export default function init(inPublicAPI, inModel) {
  const publicAPI = inPublicAPI;
  const model = inModel;
  let displayOnlyScored = false;
  let scorePopupDiv = null;
  let dividerPopupDiv = null;

  publicAPI.setScores = (scores, defaultScore) => {
    // TODO make sure model.scores has the right format?
    model.scores = scores;
    model.defaultScore = defaultScore;
    if (model.scores) {
      // setup a bgColor
      model.scores.forEach((score, i) => {
        const lightness = d3.hsl(score.color).l;
        // make bg darker for light colors.
        const blend = (lightness >= 0.45 ? 0.4 : 0.2);
        const interp = d3.interpolateRgb('#fff', score.color);
        score.bgColor = interp(blend);
      });
    }
  };

  if (model.provider.isA('ScoresProvider')) {
    publicAPI.setScores(model.provider.getScores(), model.provider.getDefaultScore());
  }

  function defaultFieldData() {
    return {
      scoreDirty: false,
      annotation: null,
    };
  }

  function createDefaultDivider(val, uncert) {
    return {
      value: val,
      uncertainty: uncert,
    };
  }

  // add implicit bounds for the histogram min/max to dividers list
  function getRegionBounds(dividers, hobj) {
    return [hobj.min].concat(dividers.map((div) => (div.value)), hobj.max);
  }

  // Translate our dividers and regions into an annotation
  // suitable for scoring this histogram.
  function dividersToPartition(def, scores) {
    if (!def.regions || !def.dividers || !scores) return null;
    if (def.regions.length !== def.dividers.length + 1) return null;
    const uncertScale = (def.hobj.max - def.hobj.min);

    const partitionSelection = SelectionBuilder.partition(def.name, def.dividers);
    partitionSelection.partition.dividers.forEach((div, index) => { div.uncertainty *= uncertScale; });
    // console.log('DBG partitionSelection', JSON.stringify(partitionSelection, 2));

    // Construct a partition annotation:
    let partitionAnnotation = null;
    if (def.annotation) {
      partitionAnnotation = AnnotationBuilder.update(def.annotation, { selection: partitionSelection, score: def.regions });
    } else {
      partitionAnnotation = AnnotationBuilder.annotation(partitionSelection, def.regions, 1, '');
    }
    return partitionAnnotation;
  }

  // retrieve annotation, and re-create dividers and regions
  function partitionToDividers(scoreData, def, hobj, scores) {
    // console.log('DBG return', JSON.stringify(scoreData, null, 2));
    const uncertScale = (hobj.max - hobj.min);
    const regions = scoreData.score;
    const dividers = JSON.parse(JSON.stringify(scoreData.selection.partition.dividers));
    dividers.forEach((div, index) => { div.uncertainty *= 1 / uncertScale; });

    // don't replace the default region with an empty region, so UI can display the default region.
    if (regions.length > 0 && !(regions.length === 1 && regions[0] === model.defaultScore)) {
      def.regions = regions;
      def.dividers = dividers;
    }
  }

  // communicate with the server which regions/dividers have changed.
  function sendScores(def, hobj) {
    const scoreData = dividersToPartition(def, model.scores);
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
    if (model.provider.isA('SelectionProvider')) {
      model.provider.setAnnotation(scoreData);
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

  function getDisplayOnlyScored() {
    return displayOnlyScored;
  }

  function createGroups(svgGr) {
    // scoring interface background group, must be behind.
    svgGr.insert('g', ':first-child')
      .classed(style.jsScoreBackground, true);
    svgGr.append('g')
      .classed(style.score, true);
  }

  function createHeader(header) {
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

  function updateHeader() {
    if (typeof model.scores !== 'undefined') {
      d3.select(model.container)
        .select(`.${style.jsScoredIcon}`)
        // apply class - 'false' should come first to not remove common base class.
        .classed(getDisplayOnlyScored() ? style.allScoredIcon : style.onlyScoredIcon, false)
        .classed(!getDisplayOnlyScored() ? style.allScoredIcon : style.onlyScoredIcon, true);
    }
  }

  function createDragDivider(hitIndex, val, def, hobj) {
    let dragD = null;
    if (hitIndex >= 0) {
      // start modifying existing divider
      // it becomes a temporary copy if we go outside our bounds
      dragD = { index: hitIndex,
                newDivider: createDefaultDivider(undefined, def.dividers[hitIndex].uncertainty),
                savedUncert: def.dividers[hitIndex].uncertainty,
                low: (hitIndex === 0 ? hobj.min : def.dividers[hitIndex - 1].value),
                high: (hitIndex === def.dividers.length - 1 ? hobj.max : def.dividers[hitIndex + 1].value),
              };
    } else {
      // create a temp divider to render.
      dragD = { index: -1,
                newDivider: createDefaultDivider(val, 0),
                savedUncert: 0,
                low: hobj.min,
                high: hobj.max,
              };
    }
    return dragD;
  }

  // enforce that divider uncertainties can't overlap.
  // Look at neighboring dividers for boundaries on this divider's uncertainty.
  function clampDividerUncertainty(val, def, hitIndex, currentUncertainty) {
    if (hitIndex < 0) return currentUncertainty;
    let maxUncertainty = 0.5;
    const uncertScale = (def.hobj.max - def.hobj.min);
    // Note comparison with low/high divider is signed. If val indicates divider has been
    // moved _past_ the neighboring divider, low/high will be negative.
    if (hitIndex > 0) {
      const low = def.dividers[hitIndex - 1].value + (def.dividers[hitIndex - 1].uncertainty * uncertScale);
      maxUncertainty = Math.min(maxUncertainty, (val - low) / uncertScale);
    }
    if (hitIndex < def.dividers.length - 1) {
      const high = def.dividers[hitIndex + 1].value - (def.dividers[hitIndex + 1].uncertainty * uncertScale);
      maxUncertainty = Math.min((high - val) / uncertScale, maxUncertainty);
    }
    // make sure uncertainty is zero when val has passed a neighbor.
    maxUncertainty = Math.max(maxUncertainty, 0);
    return Math.min(maxUncertainty, currentUncertainty);
  }

  // clamp the drag divider specifically
  function clampDragDividerUncertainty(val, def) {
    if (def.dragDivider.index < 0) return;

    def.dragDivider.newDivider.uncertainty = clampDividerUncertainty(val, def, def.dragDivider.index, def.dragDivider.savedUncert);
    def.dividers[def.dragDivider.index].uncertainty = def.dragDivider.newDivider.uncertainty;
  }

  function moveDragDivider(val, def) {
    if (def.dragDivider.index >= 0) {
      // if we drag outside our bounds, make this a 'temporary' extra divider.
      if (val < def.dragDivider.low) {
        def.dragDivider.newDivider.value = val;
        def.dividers[def.dragDivider.index].value = def.dragDivider.low;
        clampDragDividerUncertainty(val, def);
        def.dividers[def.dragDivider.index].uncertainty = 0;
      } else if (val > def.dragDivider.high) {
        def.dragDivider.newDivider.value = val;
        def.dividers[def.dragDivider.index].value = def.dragDivider.high;
        clampDragDividerUncertainty(val, def);
        def.dividers[def.dragDivider.index].uncertainty = 0;
      } else {
        def.dividers[def.dragDivider.index].value = val;
        clampDragDividerUncertainty(val, def);
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
  function dividerPick(overCoords, def, marginPx, minVal) {
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

  function regionPick(overCoords, def, hobj) {
    if (def.dividers.length === 0 || def.regions.length <= 1) return 0;
    const val = def.xScale.invert(overCoords[0]);
    const hitIndex = bisectDividers(def.dividers, createDefaultDivider(val));
    return hitIndex;
  }

  function finishDivider(def, hobj, forceDelete = false) {
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
    } else if (def.dragDivider.index >= 0
        && def.dividers[def.dragDivider.index].uncertainty !== def.dragDivider.newDivider.uncertainty) {
      def.dividers[def.dragDivider.index].uncertainty = def.dragDivider.newDivider.uncertainty;
    }
    // make sure uncertainties don't overlap.
    def.dividers.forEach((divider, index) => {
      divider.uncertainty = clampDividerUncertainty(divider.value, def, index, divider.uncertainty);
    });
    sendScores(def, hobj);
    def.dragDivider = undefined;
  }

  function positionPopup(popupDiv, left, top) {
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

  function validateDividerVal(n) {
    // is it a finite float number?
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  function showDividerPopup(dPopupDiv, selectedDef, hobj, coord) {
    const topMargin = 4;
    const rowHeight = 28;
    // 's' SI unit label won't work for a number entry field.
    const formatter = d3.format('.4g');

    dPopupDiv
      .style('display', 'initial');
    positionPopup(dPopupDiv, coord[0] - topMargin - (0.5 * rowHeight),
                  (coord[1] + model.headerSize) - (topMargin + (2 * rowHeight)));

    const selDivider = selectedDef.dividers[selectedDef.dragDivider.index];
    let savedVal = selDivider.value;
    selectedDef.dragDivider.savedUncert = selDivider.uncertainty;
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
    const uncertInput = dPopupDiv.select(`.${style.jsDividerUncertaintyInput}`);
    const valInput = dPopupDiv.select(`.${style.jsDividerValueInput}`)
      .attr('value', formatter(selDivider.value))
      .property('value', formatter(selDivider.value))
      .on('input', () => {
        // typing values, show feedback.
        let val = d3.event.target.value;
        if (!validateDividerVal(val)) val = savedVal;
        moveDragDivider(val, selectedDef);
        uncertInput.property('value', formatter(100 * selectedDef.dragDivider.newDivider.uncertainty));
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

    uncertInput
      .attr('value', formatter(100 * selDivider.uncertainty))
      .property('value', formatter(100 * selDivider.uncertainty))
      .on('input', () => {
        // typing values, show feedback.
        let uncert = d3.event.target.value;
        if (!validateDividerVal(uncert)) {
          uncert = selectedDef.dragDivider.savedUncert;
        } else {
          uncert *= 0.01;
        }
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
        if (!validateDividerVal(uncert)) uncert = selectedDef.dragDivider.savedUncert;
        else {
          // uncertainty is a % between 0 and 0.5
          uncert = Math.min(0.5, Math.max(0, 0.01 * uncert));
          d3.event.target.value = formatter(100 * uncert);
          selectedDef.dragDivider.savedUncert = uncert;
        }
        selectedDef.dragDivider.newDivider.uncertainty = uncert;
        if (selectedDef.dragDivider.newDivider.value === undefined) {
          selectedDef.dividers[selectedDef.dragDivider.index].uncertainty = uncert;
        }
        publicAPI.render(selectedDef.name);
      })
      .on('keyup', () => {
        if (d3.event.key === 'Escape') {
          selectedDef.dragDivider.newDivider.uncertainty = selectedDef.dragDivider.savedUncert;
          dPopupDiv.on('mouseleave')();
        } else if (d3.event.key === 'Enter' || d3.event.key === 'Return') {
          dPopupDiv.on('mouseleave')();
        }
      })
      .on('blur', () => {
        const val = (selectedDef.dragDivider.newDivider.value === undefined ?
                     selectedDef.dividers[selectedDef.dragDivider.index].value :
                     selectedDef.dragDivider.newDivider.value);
        clampDragDividerUncertainty(val, selectedDef);
        d3.event.target.value = formatter(100 * selectedDef.dragDivider.newDivider.uncertainty);
        publicAPI.render(selectedDef.name);
      });
  }
  // Divider editing popup allows changing its value or uncertainty, or deleting it.
  function createDividerPopup() {
    const dPopupDiv = d3.select(model.listContainer)
      .append('div')
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

  function showScorePopup(sPopupDiv, coord, selRow) {
    // it seemed like a good idea to use getBoundingClientRect() to determine row height
    // but it returns all zeros when the popup has been invisible...
    const topMargin = 4;
    const rowHeight = 26;

    sPopupDiv
      .style('display', 'initial');
    positionPopup(sPopupDiv, coord[0] - topMargin - (0.6 * rowHeight),
                  (coord[1] + model.headerSize) - (topMargin + ((0.6 + selRow) * rowHeight)));

    sPopupDiv.selectAll(`.${style.jsScoreLabel}`)
      .style('background-color', (d, i) => ((i === selRow) ? d.bgColor : '#fff'));
  }

  function createScorePopup() {
    const sPopupDiv = d3.select(model.listContainer)
      .append('div')
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

  function createPopups() {
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

  function showScore(def) {
    // show the regions when: editing, or when they are non-default. CSS rule makes visible on hover.
    return (def.editScore || (typeof def.regions !== 'undefined' &&
                              ((def.regions.length > 1) || (def.regions[0] !== model.defaultScore))));
  }

  function editingScore(def) {
    return def.editScore;
  }

  function filterFieldNames(fieldNames) {
    if (getDisplayOnlyScored()) {
      // filter for fields that have scores
      return fieldNames.filter((name) => (showScore(model.fieldData[name])));
    }
    return fieldNames;
  }

  function prepareItem(def, idx, svgGr, tdsl) {
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
        .attr('x', d => def.xScale(d.value - (d.uncertainty * (hobj.max - hobj.min))))
        .attr('y', 0)
        // to get a width, need to start from 'zero' of this scale, which is hobj.min
        .attr('width', (d, i) => def.xScale(hobj.min + (2 * d.uncertainty * (hobj.max - hobj.min))))
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
          const overCoords = publicAPI.getMouseCoords(tdsl);
          const [val, , hitIndex] = dividerPick(overCoords, def, model.dragMargin, hobj.min);
          if (d3.event.sourceEvent.altKey || d3.event.sourceEvent.ctrlKey) {
            // create a temp divider to render.
            def.dragDivider = createDragDivider(-1, val, def, hobj);
            publicAPI.render();
          } else if (hitIndex >= 0) {
            // start dragging existing divider
            // it becomes a temporary copy if we go outside our bounds
            def.dragDivider = createDragDivider(hitIndex, undefined, def, hobj);
            publicAPI.render();
          }
        })
        .on('drag', () => {
          const overCoords = publicAPI.getMouseCoords(tdsl);
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
          // extend over the x-axis when editing.
          .attr('height', def.editScore ? (model.histHeight + model.histMargin.bottom) - 3 : model.histMargin.bottom - 3)
          .attr('fill', (d) => (model.scores[d].color))
          .attr('opacity', showScore(def) ? reg.opacity : '0');
        reg.sel.exit().remove();
      });

    // invisible overlay to catch mouse events. Sized correctly in HistogramSelector
    const svgOverlay = svgGr.select(`.${style.jsOverlay}`);
    svgOverlay
      .on('click.score', () => {
        // preventDefault() in dragstart didn't help, so watch for altKey or ctrlKey.
        if (d3.event.defaultPrevented || d3.event.altKey || d3.event.ctrlKey) return; // click suppressed (by drag handling)
        const overCoords = publicAPI.getMouseCoords(tdsl);
        if (overCoords[1] > model.histHeight) {
          def.editScore = !def.editScore;
          svgOverlay.style('cursor', def.editScore ? `url(${downArrowImage}) 12 22, auto` : 'pointer');
          if (def.editScore && model.provider.isA('HistogramBinHoverProvider')) {
            const state = {};
            state[def.name] = [-1];
            model.provider.setHoverState({ state });
          }
          // set existing annotation as current if we activate for editing
          if (def.editScore && showScore(def) && def.annotation) {
            // TODO special 'active' method to call, instead of an edit?
            sendScores(def, def.hobj);
          }
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
      .on('mousemove.score', () => {
        const overCoords = publicAPI.getMouseCoords(tdsl);
        if (def.editScore) {
          const [, , hitIndex] = dividerPick(overCoords, def, model.dragMargin, hobj.min);
          let cursor = 'pointer';
          // if we're over the bottom, indicate a click will shrink regions
          if (overCoords[1] > model.histHeight) cursor = `url(${downArrowImage}) 12 22, auto`;
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

  function addSubscriptions() {
    if (model.provider.isA('PartitionProvider')) {
      model.subscriptions.push(model.provider.onPartitionReady((field) => {
        model.fieldData[field].scoreDirty = true;
        publicAPI.render(field);
      }));
    }
    if (model.provider.isA('SelectionProvider')) {
      model.subscriptions.push(model.provider.onAnnotationChange((annotation) => {
        if (annotation.selection.type === 'partition') {
          const field = annotation.selection.partition.variable;
          // respond to annotation.
          model.fieldData[field].annotation = annotation;
          partitionToDividers(annotation, model.fieldData[field], model.fieldData[field].hobj, model.scores);

          publicAPI.render(field);
        }
      }));
    }
  }

  // FIXME Aron (talk to Scott and Seb)
  function updateFieldAnnotations(fieldsData) {
    let fieldAnnotations = fieldsData;
    if (!fieldAnnotations && model.provider.getFieldPartitions) {
      fieldAnnotations = model.provider.getFieldPartitions();
    }
    if (fieldAnnotations) {
      Object.keys(fieldAnnotations).forEach(field => {
        const annotation = fieldAnnotations[field];
        if (model.fieldData[field] && model.fieldData[field].hobj) {
          model.fieldData[field].annotation = annotation;
          partitionToDividers(annotation, model.fieldData[field], model.fieldData[field].hobj, model.scores);
          publicAPI.render(field);
        }
      });
    }
  }

  return {
    addSubscriptions,
    createGroups,
    createHeader,
    createPopups,
    defaultFieldData,
    editingScore,
    filterFieldNames,
    init,
    prepareItem,
    updateHeader,
    updateFieldAnnotations,
  };
}
