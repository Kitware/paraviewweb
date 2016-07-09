import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

import d3 from 'd3';
/* eslint-disable import/no-unresolved */
import style from 'PVWStyle/InfoVizNative/HistogramSelector.mcss';
/* eslint-enable import/no-unresolved */
import multiClicker from '../../Core/D3MultiClick';
// import template from './template.html';

// ----------------------------------------------------------------------------
// Histogram Selector
// ----------------------------------------------------------------------------
//
// This component is designed to display histograms in a grid and support
// user selection of histograms. The idea being to allow the user to view
// histograms for a large number of parameters and then select some of
// those parameters to use in further visualizations.
//
// Due to the large number of DOM elements a histogram can have, we modify
// the standard D3 graph approach to reuse DOM elements as the histograms
// scroll offscreen.  This way we can support thousands of histograms
// while only creating enough DOM elements to fill the screen.
//
// A Transform is used to reposition existing DOM elements as they
// are reused. Supposedly this is a fast operation. The idea comes from
// http://bl.ocks.org/gmaclennan/11130600 among other examples.
// Reuse happens at the row level.
//
// The maxBoxSize variable controls the largest width that a box
// (histogram) will use. This code will fill its container with the
// largest size histogram it can that does not exceed this limit and
// provides an integral number of histograms across the container's width.
//

function histogramSelector(publicAPI, model) {
  // in contact-sheet mode, specify the largest width a histogram can grow
  // to before more histograms are created to fill the container's width
  const maxBoxSize = 240;
  const legendSize = 15;
  const headerSize = 20;
  let displayOnlySelected = false;
  let displayOnlyScored = false;

  let lastNumFields = 0;

  // This function modifies the Transform property
  // of the rows of the grid. Instead of creating new
  // rows filled with DOM elements. Inside histogramSelector()
  // to make sure document.head/body exists.
  const transformCSSProp = (function tcssp(property) {
    const prefixes = ['webkit', 'ms', 'Moz', 'O'];
    let i = -1;
    const n = prefixes.length;
    const s = (document.head ? document.head.style : (document.body ? document.body.style : null));

    if (s === null || property.toLowerCase() in s) {
      return property.toLowerCase();
    }

    while (++i < n) {
      if (prefixes[i] + property in s) {
        return `-${prefixes[i].toLowerCase()}${property.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      }
    }

    return false;
  }('Transform'));

  // Apply our desired attributes to the grid rows
  function styleRows(selection, self) {
    selection
      .classed(style.row, true)
      .style('height', `${self.boxHeight}px`)
      .style(transformCSSProp, (d, i) =>
        `translate3d(0,${d.key * self.boxHeight}px,0)`
      );
  }

  // apply our desired attributes to the boxes of a row
  function styleBoxes(selection, self) {
    selection
      .style('width', `${self.boxWidth}px`)
      .style('height', `${self.boxHeight}px`)
      // .style('margin', `${self.boxMargin / 2}px`)
    ;
  }

  function svgWidth() {
    return model.histWidth + model.histMargin.left + model.histMargin.right;
  }
  function svgHeight() {
    return model.histHeight + model.histMargin.top + model.histMargin.bottom;
  }

  function fetchData() {
    model.needData = true;

    if (model.provider) {
      let dataToLoadCount = 0;

      let fieldNames = [];
      // Initialize fields
      if (model.provider.isA('FieldProvider')) {
        fieldNames = model.provider.getFieldNames();
      }

      // Fetch 1D Histogram
      if (model.provider.isA('Histogram1DProvider')) {
        dataToLoadCount += fieldNames.length;
        for (let i = 0; i < fieldNames.length; i++) {
          // Return true if the data is already loaded
          dataToLoadCount -= model.provider.loadHistogram1D(fieldNames[i])
            ? 1 : 0;
        }
      }

      // Fetch Selection
      if (model.provider.isA('SelectionProvider')) {
        // fetchSelectionData();
      }

      // Check if we can render or not
      model.needData = !!dataToLoadCount;

      if (!model.needData) {
        publicAPI.render();
      }
    }
  }

  function updateSizeInformation(singleMode) {
    let updateBoxPerRow = false;
    const clientRect = model.listContainer.getBoundingClientRect();

    // hard coded because I did not figure out how to
    // properly query this value from our container.
    const borderSize = 3;
    // 8? for linux/firefox, 10 for win10/chrome
    const scrollbarWidth = 10;
    const boxOutline = 2;

    // Get the client area size
    const dimensions = [clientRect.width - 2 * borderSize - scrollbarWidth,
                        clientRect.height - 2 * borderSize];

    // compute key values based on our new size
    const boxesPerRow = (singleMode ? 1 : Math.ceil(dimensions[0] / maxBoxSize));
    model.boxWidth = Math.floor(dimensions[0] / boxesPerRow);
    model.boxHeight = (singleMode ? Math.floor(model.boxWidth * 5 / 8) : model.boxWidth);
    model.rowsPerPage = Math.ceil(dimensions[1] / model.boxHeight);

    if (boxesPerRow !== model.boxesPerRow) {
      updateBoxPerRow = true;
      model.boxesPerRow = boxesPerRow;
    }

    model.histWidth = model.boxWidth - boxOutline * 2 -
                      model.histMargin.left - model.histMargin.right;
    // other row size, probably a way to query for this
    const otherRowHeight = 19;
    model.histHeight = model.boxHeight - boxOutline * 2 - otherRowHeight -
                       model.histMargin.top - model.histMargin.bottom;

    return updateBoxPerRow;
  }

  // which row of model.nest does this field name reside in?
  function getFieldRow(name) {
    if (model.nest === null) return 0;
    const foundRow = model.nest.reduce((prev, item, i) => {
      const val = item.value.filter((def) => (def.name === name));
      if (val.length > 0) {
        return item.key;
      }
      return prev;
    }, 0);
    return foundRow;
  }

  const fieldHeaderClick = (d) => {
    displayOnlySelected = !displayOnlySelected;
    publicAPI.render();
  };
  const scoredHeaderClick = (d) => {
    displayOnlyScored = !displayOnlyScored;
    publicAPI.render();
  };

  function createHeader(divSel) {
    const header = divSel.append('div')
      .classed(style.header, true)
      .style('height', `${headerSize}px`);
    header.append('span')
      .on('click', fieldHeaderClick)
      .append('i')
      .classed(style.jsFieldsIcon, true);
    header.append('span')
      .classed(style.jsHeaderLabel, true)
      .on('click', fieldHeaderClick);
    header.append('span')
      .on('click', scoredHeaderClick)
      .append('i')
      .classed(style.jsScoredIcon, true);
    header.append('span')
      .classed(style.jsScoredHeader, true)
      .text('Only Scored')
      .on('click', scoredHeaderClick);
  }

  function updateHeader(dataLength) {
    d3.select(`.${style.jsFieldsIcon}`)
      // apply class - 'false' should come first to not remove common base class.
      .classed(displayOnlySelected ? style.allFieldsIcon : style.selectedFieldsIcon, false)
      .classed(!displayOnlySelected ? style.allFieldsIcon : style.selectedFieldsIcon, true);
    d3.select(`.${style.jsHeaderLabel}`)
      .text(!displayOnlySelected ? `All Variables (${dataLength})` : `Selected Variables (${dataLength})`);
    d3.select(`.${style.jsScoredIcon}`)
      // apply class - 'false' should come first to not remove common base class.
      .classed(displayOnlyScored ? style.allScoredIcon : style.onlyScoredIcon, false)
      .classed(!displayOnlyScored ? style.allScoredIcon : style.onlyScoredIcon, true);
  }

  // --- scoring interface ---
  function createDefaultDivider(val, uncert) {
    return {
      value: val,
      uncertainty: uncert,
    };
  }

  function createDragDivider(hitIndex, val, def, hobj) {
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
  function moveDragDivider(val, def) {
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
      if (Math.abs(def.dividers[hitIndex].value - val) > margin) {
        // we weren't close enough...
        hitIndex = -1;
      }
    }
    return [val, index, hitIndex];
  }
  function scoreRegionPick(overCoords, def, hobj) {
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
          // console.log('del reg ', def.regions);
          // delete the divider.
          def.dividers.splice(def.dragDivider.index, 1);
          // console.log('del div ', def.dividers);
        }
      } else {
        // if we moved a divider, delete the old region
        if (def.dragDivider.index >= 0) {
          if (def.dividers[def.dragDivider.index].value === def.dragDivider.low) {
            def.regions.splice(def.dragDivider.index, 1);
          } else {
            def.regions.splice(def.dragDivider.index + 1, 1);
          }
          // console.log('del reg ', def.regions);
          // delete the old divider
          def.dividers.splice(def.dragDivider.index, 1);
          // console.log('del div ', def.dividers);
        }
        // add a new divider
        def.dragDivider.newDivider.value = Math.min(hobj.max, Math.max(hobj.min, val));
        // find the index based on dividers sorted by divider.value
        const index = bisectDividers(def.dividers, def.dragDivider.newDivider);
        def.dividers.splice(index, 0, def.dragDivider.newDivider);
        // console.log('add div ', index, def.dividers);
        // add a new region, copies the score of existing region.
        def.regions.splice(index, 0, def.regions[index]);
        // console.log('add reg ', index, def.regions);
      }
    } else {
      if (def.dragDivider.index >= 0) {
        def.dividers[def.dragDivider.index].uncertainty = def.dragDivider.newDivider.uncertainty;
      }
    }
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
    return !isNaN(parseFloat(n)) && isFinite(n);
  }
  function showDividerPopup(dividerPopupDiv, selectedDef, hobj, coord) {
    const topMargin = 4;
    const rowHeight = 13;
    // 's' SI unit label won't work for a number entry field.
    const formatter = d3.format('.4g');

    dividerPopupDiv
      .style('display', 'initial');
    positionPopup(dividerPopupDiv, coord[0] - topMargin - 0.5 * rowHeight,
                  coord[1] + headerSize - topMargin - 1.7 * rowHeight);

    const selDivider = selectedDef.dividers[selectedDef.dragDivider.index];
    let savedVal = selDivider.value;
    let savedUncert = selDivider.uncertainty;
    dividerPopupDiv
      .on('mouseleave', () => {
        if (selectedDef.dragDivider) {
          moveDragDivider(savedVal, selectedDef);
          finishDivider(selectedDef, hobj);
        }
        dividerPopupDiv
          .style('display', 'none');
        selectedDef.dragDivider = undefined;
        publicAPI.render();
      });
    dividerPopupDiv.select(`.${style.jsDividerValueInput}`)
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
        if (d3.event.key === 'Escape') {
          moveDragDivider(savedVal, selectedDef);
          dividerPopupDiv.on('mouseleave')();
        } else if (d3.event.key === 'Enter' || d3.event.key === 'Return') {
          dividerPopupDiv.on('mouseleave')();
        }
      })
      .node()
      .focus();

    dividerPopupDiv.select(`.${style.jsDividerUncertaintyInput}`)
      .attr('value', formatter(selDivider.uncertainty))
      .property('value', formatter(selDivider.uncertainty))
      .on('input', () => {
        // typing values, show feedback.
        let uncert = d3.event.target.value;
        if (!validateDividerVal(uncert)) uncert = savedUncert;
        selectedDef.dragDivider.newDivider.uncertainty = uncert;
        if (selectedDef.dragDivider.newDivider.value === undefined) selDivider.uncertainty = uncert;
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
        if (selectedDef.dragDivider.newDivider.value === undefined) selDivider.uncertainty = uncert;
        publicAPI.render(selectedDef.name);
      })
      .on('keyup', () => {
        if (d3.event.key === 'Escape') {
          selectedDef.dragDivider.newDivider.uncertainty = savedUncert;
          dividerPopupDiv.on('mouseleave')();
        } else if (d3.event.key === 'Enter' || d3.event.key === 'Return') {
          dividerPopupDiv.on('mouseleave')();
        }
      });
  }
  function createDividerPopup() {
    const dividerPopupDiv = d3.select(model.listContainer).append('div')
      .classed(style.dividerPopup, true)
      .style('display', 'none');
    const table = dividerPopupDiv.append('table');
    const tr1 = table.append('tr');
    tr1.append('td')
      .text('Value:');
    tr1.append('input')
      .classed(style.jsDividerValueInput, true)
      .attr('type', 'number')
      .attr('step', 'any')
      .style('width', '6em');
    const tr2 = table.append('tr');
    tr2.append('td')
      .text('Uncertainty:');
    tr2.append('input')
      .classed(style.jsDividerUncertaintyInput, true)
      .attr('type', 'number')
      .attr('step', 'any')
      .style('width', '6em');
    const tr3 = table.append('tr');
    tr3.append('input')
      .attr('type', 'button')
      .attr('value', 'Delete |')
      .on('click', () => {
        const hobj = model.provider.getHistogram1D(model.selectedDef.name);
        if (hobj !== null) finishDivider(model.selectedDef, hobj, true);
        dividerPopupDiv
          .style('display', 'none');
        publicAPI.render();
      });
  }

  function showScorePopup(scorePopupDiv, coord, selRow) {
    // it seemed like a good idea to use getBoundingClientRect() to determine row height
    // but it returns all zeros when the popup has been invisible...
    const topMargin = 4;
    const rowHeight = 13;

    scorePopupDiv
      .style('display', 'initial');
    positionPopup(scorePopupDiv, coord[0] - topMargin - 0.5 * rowHeight,
                  coord[1] + headerSize - topMargin - (0.7 + selRow) * rowHeight);

    scorePopupDiv.selectAll(`.${style.jsScoreLabel}`)
      .style('background-color', (d, i) => {
        // use mostly-solid for selected, mostly-transparent when not selected.
        const interp = d3.interpolateRgb('#fff', d.color);
        return interp((i === selRow) ? 0.7 : 0.2);
      });
  }

  function createScorePopup() {
    const scorePopupDiv = d3.select(model.listContainer).append('div')
      .classed(style.scorePopup, true)
      .style('display', 'none')
      .on('mouseleave', () => {
        scorePopupDiv
          .style('display', 'none');
        model.selectedDef.dragDivider = undefined;
      });
    // create radio-buttons that allow choosing the score for the selected region
    const scoreChoices = scorePopupDiv.selectAll(`.${style.jsScoreChoice}`)
      .data(model.scores);
    scoreChoices.enter()
      .append('label')
        .classed(style.scoreLabel, true)
        .text((d) => d.name)
      .append('input')
        .classed(style.scoreChoice, true)
        .attr('name', 'score_choice_rb')
        .attr('type', 'radio')
        .attr('value', (d) => (d.name))
        .property('checked', (d, i) => (i === model.defaultScore))
        .on('click', (d, i) => {
          // use click, not change, so we get notified even when current value is chosen.
          const def = model.selectedDef;
          def.regions[def.hitRegionIndex] = i;
          def.dragDivider = undefined;
          scorePopupDiv
            .style('display', 'none');
          publicAPI.render();
        });
    // create a button for creating a new divider, so we don't require
    // the invisible alt/ctrl click to create one.
    scorePopupDiv
      .append('input')
        .classed(style.scoreButton, true)
        .attr('type', 'button')
        .attr('value', 'New |')
        .on('click', () => {
          const hobj = model.provider.getHistogram1D(model.selectedDef.name);
          if (hobj !== null) finishDivider(model.selectedDef, hobj);
          scorePopupDiv
            .style('display', 'none');
          publicAPI.render();
        });
    return scorePopupDiv;
  }

  function showScore(def) {
    // show the regions when: editing, or when they are non-default. CSS rule makes visible on hover.
    return (def.editScore || (typeof def.regions !== 'undefined' &&
                              ((def.regions.length > 1) || (def.regions[0] !== model.defaultScore))));
  }

  publicAPI.resize = () => {
    if (model.container === null) return;

    const clientRect = model.container.getBoundingClientRect();
    if (clientRect.width !== 0 && clientRect.height !== 0) {
      model.containerHidden = false;
      d3.select(model.listContainer)
        .style('height', `${clientRect.height - headerSize}px`);
      publicAPI.render();
    } else {
      model.containerHidden = true;
    }
  };

  publicAPI.render = (onlyFieldName = null) => {
    if (model.needData) {
      fetchData();
      return;
    }
    if (model.container === null) return;

    const updateBoxPerRow = updateSizeInformation(model.singleMode);

    let fieldNames = [];
    // Initialize fields
    if (model.provider.isA('FieldProvider')) {
      fieldNames = (!displayOnlySelected ? model.provider.getFieldNames() :
         model.provider.getActiveFieldNames());
    }
    if (displayOnlyScored) {
      // filter for fields that have scores
      fieldNames = fieldNames.filter((name) => (showScore(model.provider.getField(name))));
    }
    updateHeader(fieldNames.length);
    if (updateBoxPerRow || fieldNames.length !== lastNumFields) {
      lastNumFields = fieldNames.length;

      // get the data and put it into the nest based on the
      // number of boxesPerRow
      const mungedData = fieldNames.map(name => {
        const d = model.provider.getField(name);
        if (typeof d.selectedGen === 'undefined') {
          d.selectedGen = 0;
        }
        return d;
      });

      model.nest = mungedData.reduce((prev, item, i) => {
        const group = Math.floor(i / model.boxesPerRow);
        if (prev[group]) {
          prev[group].value.push(item);
        } else {
          prev.push({
            key: group,
            value: [item],
          });
        }
        return prev;
      }, []);
    }

    // resize the div area to be tall enough to hold all our
    // boxes even though most are 'virtual' and lack DOM
    const newHeight = `${Math.ceil(model.nest.length * model.boxHeight)}px`;
    model.parameterList.style('height', newHeight);

    // if we went from less than a page to something that has to scroll
    // then resize again, no clue why
    // if (newHeight > clientHeight && model.lastHeight < clientHeight) {
    //   model.lastHeight = newHeight;
    //   publicAPI.render();
    //   return;
    // }

    if (!model.nest) return;

    // if we've changed view modes, single <==> contact sheet,
    // we need to re-scroll.
    if (model.scrollToName !== null) {
      const topRow = getFieldRow(model.scrollToName);
      model.listContainer.scrollTop = topRow * model.boxHeight;
      model.scrollToName = null;
    }

     // scroll distance, in pixels.
    const scrollY = model.listContainer.scrollTop;
    // convert scroll from pixels to rows, get one row above (-1)
    const offset = Math.max(0, Math.floor(scrollY / model.boxHeight) - 1);

    // extract the visible graphs from the data based on how many rows
    // we have scrolled down plus one above and one below (+2)
    const count = model.rowsPerPage + 2;
    const dataSlice = model.nest.slice(offset, offset + count);

    // attach our slice of data to the rows
    const rows = model.parameterList.selectAll('div')
      .data(dataSlice, (d) => d.key);

    // here is the code that reuses the exit nodes to fill entry
    // nodes. If there are not enough exit nodes then additional ones
    // will be created as needed. The boxes start off as hidden and
    // later have the class removed when their data is ready
    const exitNodes = rows.exit();
    rows.enter().append(() => {
      let reusableNode = 0;
      for (let i = 0; i < exitNodes[0].length; i++) {
        reusableNode = exitNodes[0][i];
        if (reusableNode) {
          exitNodes[0][i] = undefined;
          d3.select(reusableNode)
              .selectAll('table')
              .classed(style.hiddenBox, true);
          return reusableNode;
        }
      }
      return document.createElement('div');
    });
    rows.call(styleRows, model);

    // if there are exit rows remaining that we
    // do not need we can delete them
    rows.exit().remove();

    // now put the data into the boxes
    const boxes = rows.selectAll('table').data((d) => d.value);
    boxes.enter()
      .append('table')
      .classed(style.hiddenBox, true);

    // free up any extra boxes
    boxes.exit().remove();

    // create floating controls to set scores, values, when needed.
    let scorePopupDiv = null;
    let dividerPopupDiv = null;
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

    // for every item that has data, create all the sub-elements
    // and size them correctly based on our data
    function prepareItem(def, idx) {
      // updateData is called in response to UI events; it tells
      // the dataProvider to update the data to match the UI.
      //
      // updateData must be inside prepareItem() since it uses idx;
      // d3's listener method cannot guarantee the index passed to
      // updateData will be correct:
      function updateData(data) {
        // data.selected = this.checked;
        data.selectedGen++;
        // model.provider.updateField(data.name, { active: data.selected });
        model.provider.toggleFieldSelection(data.name);
      }

      // get existing sub elements
      const ttab = d3.select(this);
      let trow1 = ttab.select(`tr.${style.jsLegendRow}`);
      let trow2 = ttab.select(`tr.${style.jsTr2}`);
      let tdsl = trow2.select(`td.${style.jsSparkline}`);
      let legendCell = trow1.select(`.${style.jsLegend}`);
      let fieldCell = trow1.select(`.${style.jsFieldName}`);
      let svgGr = tdsl.select('svg').select(`.${style.jsGHist}`);
      let svgOverlay = svgGr.select(`.${style.jsOverlay}`);

      // if they are not created yet then create them
      if (trow1.empty()) {
        trow1 = ttab.append('tr').classed(style.legendRow, true)
          .on('click', multiClicker([
            function singleClick(d, i) { // single click handler
              // const overCoords = d3.mouse(model.listContainer);
              updateData(d);
            },
            function doubleClick(d, i) { // double click handler
              model.singleMode = !model.singleMode;
              model.scrollToName = d.name;
              publicAPI.render();

              d3.event.stopPropagation();
            },
          ])
          );
        trow2 = ttab.append('tr').classed(style.jsTr2, true);
        tdsl = trow2.append('td').classed(style.sparkline, true).attr('colspan', '2');
        legendCell = trow1
          .append('td')
          .classed(style.legend, true);

        fieldCell = trow1
          .append('td')
          .classed(style.fieldName, true);

        // Create SVG, and main group created inside the margins for use by axes, title, etc.
        svgGr = tdsl.append('svg').classed(style.sparklineSvg, true)
          .append('g')
            .classed(style.jsGHist, true)
            .attr('transform', `translate( ${model.histMargin.left}, ${model.histMargin.top} )`);
        // nested groups inside main group
        svgGr.append('g')
          .classed(style.jsScoreBackground, true);
        svgGr.append('g')
          .classed(style.axis, true);
        svgGr.append('g')
          .classed(style.jsGRect, true);
        // svgGr.append('g')
        //   .classed(style.brush, true);
        svgGr.append('g')
          .classed(style.score, true);
        svgOverlay = svgGr.append('rect')
          .classed(style.overlay, true)
          .style('cursor', 'default');
      }
      const dataActive = def.active;
      // Apply legend
      if (model.provider.isA('LegendProvider')) {
        const { color, shape } = model.provider.getLegend(def.name);
        legendCell
          .html(`<svg class='${style.legendSvg}' width='${legendSize}' height='${legendSize}'
                  fill='${color}' stroke='black'><use xlink:href='${shape}'/></svg>`);
      } else {
        legendCell
          .html('<i></i>')
          .select('i');
      }
      trow1
        .classed(!dataActive ? style.selectedLegendRow : style.unselectedLegendRow, false)
        .classed(dataActive ? style.selectedLegendRow : style.unselectedLegendRow, true);
      // selection outline
      ttab
        .classed(style.hiddenBox, false)
        .classed(!dataActive ? style.selectedBox : style.unselectedBox, false)
        .classed(dataActive ? style.selectedBox : style.unselectedBox, true);

      // Apply field name
      fieldCell.text(def.name);

      // adjust some settings based on current size
      tdsl.select('svg')
        .attr('width', svgWidth())
        .attr('height', svgHeight());

      // get the histogram data and rebuild the histogram based on the results
      const hobj = model.provider.getHistogram1D(def.name);
      if (hobj !== null) {
        const cmax = 1.0 * d3.max(hobj.counts);
        const hsize = hobj.counts.length;
        const hdata = svgGr.select(`.${style.jsGRect}`)
          .selectAll(`.${style.jsHistRect}`).data(hobj.counts);

        hdata.enter().append('rect');
        // changes apply to both enter and update data join:
        hdata
          .classed(style.histRect, true)
          .attr('pname', def.name)
          .attr('y', d => model.histHeight * (1.0 - d / cmax))
          .attr('x', (d, i) => (model.histWidth / hsize) * i)
          .attr('height', d => model.histHeight * d / cmax)
          .attr('width', model.histWidth / hsize);

        hdata.exit().remove();
        // svgGr.
        // on('mousemove', (d, i) => {
        //   // console.log('MouseMove!');
        //   if (model.annotationService) {
        //     const mCoords = d3.mouse(svgGr[0][0]);
        //     const binNum = Math.floor((mCoords[0] / model.histWidth) * hsize);
        //     const state = {};
        //     state[def.name] = [binNum];
        //     model.annotationService.setCurrentHover({
        //       source: model.componentId,
        //       state,
        //     });
        //   }
        // }).
        // on('mouseout', (d, i) => {
        //   if (model.annotationService) {
        //     const state = {};
        //     state[def.name] = [-1];
        //     model.annotationService.setCurrentHover({
        //       source: self.componentId,
        //       state,
        //     });
        //   }
        // });

        // Show an x-axis with just min/max displayed.
        // Attach scale, axis and brush objects to this box's
        // data (the 'def' object) to allow persistence when scrolled.
        if (typeof def.xScale === 'undefined') {
          def.xScale = d3.scale.linear();
        }
        def.xScale
          .rangeRound([0, model.histWidth])
          .domain([hobj.min, hobj.max]);

        if (typeof def.xAxis === 'undefined') {
          const formatter = d3.format('.3s');
          def.xAxis = d3.svg.axis()
          .tickFormat(formatter)
          .orient('bottom');
        }
        def.xAxis
          .scale(def.xScale);
        let numTicks = model.singleMode ? 5 : 2;
        if (model.singleMode) {
          // using .ticks() results in skipping min/max values,
          // if they aren't 'nice'. Make exactly 5 ticks.
          const myTicks = d3.range(numTicks).map((d) => (
            hobj.min + (d / (numTicks - 1)) * (hobj.max - hobj.min))
          );
          def.xAxis
            .tickValues(myTicks);
        } else {
          def.xAxis
            .tickValues(def.xScale.domain());
        }
        // nested group for the x-axis min/max display.
        const gAxis = svgGr.select(`.${style.jsAxis}`);
        gAxis
          .attr('transform', `translate(0, ${model.histHeight})`)
          .call(def.xAxis);
        const tickLabels = gAxis.selectAll('text')
            .classed(style.axisText, true);
        numTicks = tickLabels.size();
        tickLabels
            .style('text-anchor', (d, i) => (
              i === 0 ? 'start' : (i === numTicks - 1 ? 'end' : 'middle')
            ));
        gAxis.selectAll('line').classed(style.axisLine, true);
        gAxis.selectAll('path').classed(style.axisPath, true);

        const getMouseCoords = () => {
          // y-coordinate is not handled correctly for svg or svgGr or overlay inside scrolling container.
          const coord = d3.mouse(tdsl.node());
          return [coord[0] - model.histMargin.left, coord[1] - model.histMargin.top];
        };

        // scoring interface
        if (typeof model.scores !== 'undefined') {
          if (typeof def.dividers === 'undefined') {
            def.dividers = [];
            def.regions = [model.defaultScore];
            def.editScore = false;
          }

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
                const overCoords = getMouseCoords();
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
                    // console.log('drag start ', hitIndex, def.dragDivider.low, def.dragDivider.high);
                    publicAPI.render();
                  }
                }
              })
              .on('drag', () => {
                const overCoords = getMouseCoords();
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
          const regionBounds = [hobj.min].concat(def.dividers.map((div) => (div.value)), hobj.max);
          const scoreRegions = gScore.selectAll(`.${style.jsScoreRect}`)
            .data(def.regions);
          // duplicate background regions are opaque, for a solid bright color.
          const scoreBgRegions = svgGr.select(`.${style.jsScoreBackground}`).selectAll('rect')
            .data(def.regions);
          [{ sel: scoreRegions, opacity: 0.2, class: style.scoreRegionFg },
            { sel: scoreBgRegions, opacity: 1.0, class: style.scoreRegionBg }].forEach((reg) => {
              reg.sel.enter().append('rect')
                .classed(reg.class, true);
              reg.sel
                .attr('x', (d, i) => def.xScale(regionBounds[i]))
                .attr('y', def.editScore ? 0 : model.histHeight)
                // width might be zero if a divider is dragged all the way to min/max.
                .attr('width', (d, i) => def.xScale(regionBounds[i + 1]) - def.xScale(regionBounds[i]))
                .attr('height', def.editScore ? model.histHeight : model.histMargin.bottom)
                .attr('fill', (d) => (model.scores[d].color))
                .attr('opacity', showScore(def) ? reg.opacity : '0');
              reg.sel.exit().remove();
            });

          // invisible overlay to catch mouse events.
          svgOverlay
            .attr('width', model.histWidth)
            .attr('height', model.histHeight + model.histMargin.bottom) // allow clicks inside x-axis.
            .on('click', () => {
              // preventDefault() in dragstart didn't help, so watch for altKey or ctrlKey.
              if (d3.event.defaultPrevented || d3.event.altKey || d3.event.ctrlKey) return; // click suppressed (by drag handling)
              const overCoords = getMouseCoords();
              if (overCoords[1] > model.histHeight) {
                def.editScore = !def.editScore;
                svgOverlay.style('cursor', def.editScore ? 's-resize' : 'pointer');
                publicAPI.render();
                return;
              }
              if (def.editScore) {
                // if we didn't create or drag a divider, pick a region or divider
                const hitRegionIndex = scoreRegionPick(overCoords, def, hobj);
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
                    console.log('DBG unexpected existing divider');
                    def.dragDivider.newDivider.value = val;
                  }

                  const selRow = def.regions[def.hitRegionIndex];
                  showScorePopup(scorePopupDiv, coord, selRow);
                }
              }
            })
            .on('mousemove', () => {
              const overCoords = getMouseCoords();
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
      }
    }

    // make sure all the elements are created
    // and updated
    if (onlyFieldName === null) {
      boxes.each(prepareItem);
      boxes
        .call(styleBoxes, model);
    } else {
      boxes.filter((def) => (def.name === onlyFieldName)).each(prepareItem);
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
      const cSel = d3.select(model.container)
        .style('overflow-y', 'hidden');
      createHeader(cSel);
      // wrapper height is set insize resize()
      const wrapper = cSel.append('div')
        .style('overflow-y', 'auto')
        .style('overflow-x', 'hidden')
        .on('scroll', () => { publicAPI.render(); });

      model.listContainer = wrapper.node();
      model.parameterList = wrapper
        .append('div')
        .classed(style.histogramSelector, true);

      publicAPI.resize();
    }
  };

  model.subscriptions.push({ unsubscribe: publicAPI.setContainer });
  // event from the FieldProvider
  // TODO overkill if one field's 'active' flag changes.
  model.subscriptions.push(model.provider.onFieldChange(fetchData));
  // event from Histogram Provider
  model.subscriptions.push(model.provider.onHistogram1DReady(publicAPI.render));

  // Make sure default values get applied
  publicAPI.setContainer(model.container);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  container: null,
  provider: null,
  listContainer: null,
  needData: true,
  containerHidden: false,

  parameterList: null,
  nest: null, // nested aray of data nest[rows][boxes]
  boxesPerRow: 0,
  rowsPerPage: 0,
  boxWidth: 120,
  boxHeight: 120,
  // show 1 per row?
  singleMode: false,
  scrollToName: null,
  // margins inside the SVG element.
  histMargin: { top: 3, right: 3, bottom: 18, left: 3 },
  histWidth: 90,
  histHeight: 70,
  lastHeight: 0,
  lastOffset: -1,
  // scoring interface activated by passing in 'scores' array externally.
  // scores: [{ name: 'Yes', color: '#00C900' }, ... ],
  defaultScore: 0,
  dragMargin: 8,
  selectedDef: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'VizComponent');
  CompositeClosureHelper.get(publicAPI, model, ['provider', 'container']);

  histogramSelector(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
