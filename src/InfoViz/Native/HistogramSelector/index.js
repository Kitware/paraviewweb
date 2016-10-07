/* global document */

import d3 from 'd3';
import style from 'PVWStyle/InfoVizNative/HistogramSelector.mcss';

import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';
import multiClicker from '../../Core/D3MultiClick';
import score from './score';

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
// The minBoxSize variable controls the smallest width that a box
// (histogram) will use. This code will fill its container with the
// smallest size histogram it can that does not exceed this limit and
// provides an integral number of histograms across the container's width.
//

function histogramSelector(publicAPI, model) {
  // in contact-sheet mode, specify the smallest width a histogram can shrink
  // to before fewer histograms are created to fill the container's width
  let minBoxSize = 200;
  // smallest we'll let it go. Limits boxesPerRow in header GUI.
  const minBoxSizeLimit = 115;
  const legendSize = 15;
  // hard coded because I did not figure out how to
  // properly query this value from our container.
  const borderSize = 6;
  // 8? for linux/firefox, 16 for win10/chrome (hi-res screen)
  const scrollbarWidth = 16;

  let displayOnlySelected = false;

  let lastNumFields = 0;

  const scoreHelper = score(publicAPI, model);

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

    /* eslint-disable no-plusplus */
    while (++i < n) {
      if (prefixes[i] + property in s) {
        return `-${prefixes[i].toLowerCase()}${property.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      }
    }
    /* eslint-enable no-plusplus */

    return false;
  }('Transform'));

  // Apply our desired attributes to the grid rows
  function styleRows(selection, self) {
    selection
      .classed(style.row, true)
      .style('height', `${self.rowHeight}px`)
      .style(transformCSSProp, (d, i) =>
        `translate3d(0,${d.key * self.rowHeight}px,0)`
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

  publicAPI.svgWidth = () => (model.histWidth + model.histMargin.left + model.histMargin.right);
  publicAPI.svgHeight = () => (model.histHeight + model.histMargin.top + model.histMargin.bottom);

  function getClientArea() {
    const clientRect = model.listContainer.getBoundingClientRect();
    return [clientRect.width - borderSize - scrollbarWidth,
                        clientRect.height - borderSize];
  }

  function updateSizeInformation(singleMode) {
    let updateBoxPerRow = false;

    const boxMargin = 3; // outside the box dimensions
    const boxBorder = 3; // included in the box dimensions, visible border

    // Get the client area size
    const dimensions = getClientArea();

    // compute key values based on our new size
    const boxesPerRow = (singleMode ? 1 : Math.max(1, Math.floor(dimensions[0] / minBoxSize)));
    model.boxWidth = Math.floor(dimensions[0] / boxesPerRow) - (2 * boxMargin);
    if (boxesPerRow === 1) {
      // use 3 / 4 to make a single hist wider than it is tall.
      model.boxHeight = Math.min(Math.floor(((model.boxWidth + (2 * boxMargin)) * (3 / 4)) - (2 * boxMargin)),
                                 Math.floor(dimensions[1] - (2 * boxMargin)));
    } else {
      model.boxHeight = model.boxWidth;
    }
    model.rowHeight = model.boxHeight + (2 * boxMargin);
    model.rowsPerPage = Math.ceil(dimensions[1] / model.rowHeight);

    if (boxesPerRow !== model.boxesPerRow) {
      updateBoxPerRow = true;
      model.boxesPerRow = boxesPerRow;
    }

    model.histWidth = model.boxWidth - (boxBorder * 2) -
                      model.histMargin.left - model.histMargin.right;
    // other row size, probably a way to query for this
    const otherRowHeight = 21;
    model.histHeight = model.boxHeight - (boxBorder * 2) - otherRowHeight -
                       model.histMargin.top - model.histMargin.bottom;

    return updateBoxPerRow;
  }

  // which row of model.nest does this field name reside in?
  function getFieldRow(name) {
    if (model.nest === null) return 0;
    const foundRow = model.nest.reduce((prev, item, i) => {
      const val = item.value.filter(def => (def.name === name));
      if (val.length > 0) {
        return item.key;
      }
      return prev;
    }, 0);
    return foundRow;
  }

  function getCurrentFieldNames() {
    let fieldNames = [];
    // Initialize fields
    if (model.provider.isA('FieldProvider')) {
      fieldNames = (!displayOnlySelected ? model.provider.getFieldNames() :
         model.provider.getActiveFieldNames());
    }
    fieldNames = scoreHelper.filterFieldNames(fieldNames);
    return fieldNames;
  }

  const fieldHeaderClick = (d) => {
    displayOnlySelected = !displayOnlySelected;
    publicAPI.render();
  };

  function incrNumBoxes(amount) {
    if (model.singleModeName !== null) return;
    // Get the client area size
    const dimensions = getClientArea();
    const maxNumBoxes = Math.floor(dimensions[0] / minBoxSizeLimit);
    const newBoxesPerRow = Math.min(maxNumBoxes, Math.max(1, model.boxesPerRow + amount));

    // if we actually changed, re-render, letting updateSizeInformation actually change dimensions.
    if (newBoxesPerRow !== model.boxesPerRow) {
      // compute a reasonable new minimum for box size based on the current container dimensions.
      // Midway between desired and next larger number of boxes, except at limit.
      const newMinBoxSize = (newBoxesPerRow === maxNumBoxes ? minBoxSizeLimit :
        Math.floor(0.5 * ((dimensions[0] / newBoxesPerRow) + (dimensions[0] / (newBoxesPerRow + 1)))));
      minBoxSize = newMinBoxSize;
      publicAPI.render();
    }
  }

  // let the caller set a specific number of boxes/row, within our normal size constraints.
  publicAPI.requestNumBoxesPerRow = (count) => {
    model.singleModeName = null;
    model.singleModeSticky = false;
    incrNumBoxes(count - model.boxesPerRow);
  };

  function changeSingleField(direction) {
    if (model.singleModeName === null) return;
    const fieldNames = getCurrentFieldNames();
    if (fieldNames.length === 0) return;

    let index = fieldNames.indexOf(model.singleModeName);
    if (index === -1) index = 0;
    else index = (index + direction) % fieldNames.length;
    if (index < 0) index = fieldNames.length - 1;

    model.singleModeName = fieldNames[index];
    lastNumFields = 0;
    publicAPI.render();
  }

  function createHeader(divSel) {
    const header = divSel.append('div')
      .classed(style.header, true)
      .style('height', `${model.headerSize}px`)
      .style('line-height', `${model.headerSize}px`);
    header.append('span')
      .on('click', fieldHeaderClick)
      .append('i')
      .classed(style.jsFieldsIcon, true);
    header.append('span')
      .classed(style.jsHeaderLabel, true)
      .text('Only Selected')
      .on('click', fieldHeaderClick);

    scoreHelper.createHeader(header);

    const numBoxesSpan = header.append('span')
      .classed(style.headerBoxes, true);
    numBoxesSpan.append('i')
      .classed(style.headerBoxesMinus, true)
      .on('click', () => incrNumBoxes(-1));
    numBoxesSpan.append('span')
      .classed(style.jsHeaderBoxesNum, true)
      .text(model.boxesPerRow);
    numBoxesSpan.append('i')
      .classed(style.headerBoxesPlus, true)
      .on('click', () => incrNumBoxes(1));

    const singleSpan = header.append('span')
      .classed(style.headerSingle, true);
    singleSpan.append('i')
      .classed(style.headerSinglePrev, true)
      .on('click', () => changeSingleField(-1));
    singleSpan.append('span')
      .classed(style.jsHeaderSingleField, true)
      .text('');
    singleSpan.append('i')
      .classed(style.headerSingleNext, true)
      .on('click', () => changeSingleField(1));
  }

  function updateHeader(dataLength) {
    if (model.singleModeSticky) {
      // header isn't useful for a single histogram.
      d3.select(model.container).select(`.${style.jsHeader}`)
        .style('display', 'none');
      return;
    }
    d3.select(model.container).select(`.${style.jsHeader}`)
      .style('display', null);
    d3.select(model.container)
      .select(`.${style.jsFieldsIcon}`)
      // apply class - 'false' should come first to not remove common base class.
      .classed(displayOnlySelected ? style.allFieldsIcon : style.selectedFieldsIcon, false)
      .classed(!displayOnlySelected ? style.allFieldsIcon : style.selectedFieldsIcon, true);
    scoreHelper.updateHeader();

    d3.select(model.container)
      .select(`.${style.jsHeaderBoxes}`)
      .style('display', model.singleModeName === null ? 'initial' : 'none');
    d3.select(model.container)
      .select(`.${style.jsHeaderBoxesNum}`)
      .text(`${model.boxesPerRow} /row`);

    d3.select(model.container)
      .select(`.${style.jsHeaderSingle}`)
      .style('display', model.singleModeName === null ? 'none' : 'initial');

    if (model.provider.isA('LegendProvider') && model.singleModeName) {
      const { color, shape } = model.provider.getLegend(model.singleModeName);
      d3.select(model.container)
        .select(`.${style.jsHeaderSingleField}`)
        .html(`<svg class='${style.legendSvg}' width='${legendSize}' height='${legendSize}'
                fill='${color}' stroke='black'><use xlink:href='${shape}'/></svg>`);
    } else {
      d3.select(model.container)
        .select(`.${style.jsHeaderSingleField}`)
        .text(() => {
          let name = model.singleModeName;
          if (!name) return '';
          if (name.length > 10) {
            name = `${name.slice(0, 9)}...`;
          }
          return name;
        });
    }
  }

  publicAPI.getMouseCoords = (tdsl) => {
    // y-coordinate is not handled correctly for svg or svgGr or overlay inside scrolling container.
    const coord = d3.mouse(tdsl.node());
    return [coord[0] - model.histMargin.left, coord[1] - model.histMargin.top];
  };

  publicAPI.resize = () => {
    if (!model.container) return;

    const clientRect = model.container.getBoundingClientRect();
    const deltaHeader = model.singleModeSticky ? 0 : model.headerSize;
    if (clientRect.width !== 0 && clientRect.height > deltaHeader) {
      model.containerHidden = false;
      d3.select(model.listContainer)
        .style('height', `${clientRect.height - deltaHeader}px`);
      // scrollbarWidth = model.listContainer.offsetWidth - clientRect.width;
      publicAPI.render();
    } else {
      model.containerHidden = true;
    }
  };

  function toggleSingleModeEvt(d) {
    if (!model.singleModeSticky) {
      if (model.singleModeName === null) {
        model.singleModeName = d.name;
      } else {
        model.singleModeName = null;
      }
      model.scrollToName = d.name;
      publicAPI.render();
    }
    if (d3.event) d3.event.stopPropagation();
  }

  // Display a single histogram. If disableSwitch is true, switching to
  // other histograms in the fields list is disabled.
  // Calling requestNumBoxesPerRow() re-enables switching.
  publicAPI.displaySingleHistogram = (fieldName, disableSwitch) => {
    model.singleModeName = null;
    model.singleModeSticky = false;
    if (model.fieldData[fieldName]) {
      toggleSingleModeEvt(model.fieldData[fieldName]);
    }
    if (model.singleModeName && disableSwitch) {
      model.singleModeSticky = true;
    } else {
      model.singleModeSticky = false;
    }
    publicAPI.resize();
  };

  publicAPI.disableFieldActions = (fieldName, actionNames) => {
    if (!model.disabledFieldsActions) {
      model.disabledFieldsActions = {};
    }
    if (!model.disabledFieldsActions[fieldName]) {
      model.disabledFieldsActions[fieldName] = [];
    }
    const disableActionList = model.disabledFieldsActions[fieldName];
    [].concat(actionNames).forEach((action) => {
      if (disableActionList.indexOf(action) === -1) {
        disableActionList.push(action);
      }
    });
  };

  publicAPI.enableFieldActions = (fieldName, actionNames) => {
    if (!model.disabledFieldsActions) {
      return;
    }
    if (!model.disabledFieldsActions[fieldName]) {
      return;
    }
    const disableActionList = model.disabledFieldsActions[fieldName];
    [].concat(actionNames).forEach((action) => {
      const idx = disableActionList.indexOf(action);
      if (idx !== -1) {
        disableActionList.splice(idx, 1);
      }
    });
  };

  publicAPI.isFieldActionDisabled = (fieldName, actionName) => {
    if (!model.disabledFieldsActions) {
      return false;
    }
    if (!model.disabledFieldsActions[fieldName]) {
      return false;
    }
    const disableActionList = model.disabledFieldsActions[fieldName];
    return (disableActionList.indexOf(actionName) !== -1);
  };

  publicAPI.render = (onlyFieldName = null) => {
    if (!model.fieldData ||
        (onlyFieldName !== null && !model.fieldData[onlyFieldName])) {
      return;
    }

    if (!model.container || model.container.offsetParent === null) return;
    if (!model.listContainer) return;
    if (model.containerHidden) {
      publicAPI.resize();
      return;
    }

    const updateBoxPerRow = updateSizeInformation(model.singleModeName !== null);

    let fieldNames = getCurrentFieldNames();

    updateHeader(fieldNames.length);
    if (model.singleModeName !== null) {
      // display only one histogram at a time.
      fieldNames = [model.singleModeName];
    }

    if (updateBoxPerRow || fieldNames.length !== lastNumFields) {
      lastNumFields = fieldNames.length;

      // get the data and put it into the nest based on the
      // number of boxesPerRow
      const mungedData = fieldNames.map((name) => {
        const d = model.fieldData[name];
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
    const newHeight = `${Math.ceil(model.nest.length * model.rowHeight)}px`;
    model.parameterList.style('height', newHeight);

    if (!model.nest) return;

    // if we've changed view modes, single <==> contact sheet,
    // we need to re-scroll.
    if (model.scrollToName !== null) {
      const topRow = getFieldRow(model.scrollToName);
      model.listContainer.scrollTop = topRow * model.rowHeight;
      model.scrollToName = null;
    }

     // scroll distance, in pixels.
    const scrollY = model.listContainer.scrollTop;
    // convert scroll from pixels to rows, get one row above (-1)
    const offset = Math.max(0, Math.floor(scrollY / model.rowHeight) - 1);

    // extract the visible graphs from the data based on how many rows
    // we have scrolled down plus one above and one below (+2)
    const count = model.rowsPerPage + 2;
    const dataSlice = model.nest.slice(offset, offset + count);

    // attach our slice of data to the rows
    const rows = model.parameterList.selectAll('div')
      .data(dataSlice, d => d.key);

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
    const boxes = rows.selectAll('table').data(d => d.value);
    boxes.enter()
      .append('table')
      .classed(style.hiddenBox, true);

    // free up any extra boxes
    boxes.exit().remove();

    // scoring interface - create floating controls to set scores, values, when needed.
    scoreHelper.createPopups();

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
        // data.selectedGen++;
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
      let iconCell = trow1.select(`.${style.jsLegendIcons}`);
      let iconCellViz = iconCell.select(`.${style.jsLegendIconsViz}`);
      let svgGr = tdsl.select('svg').select(`.${style.jsGHist}`);
      // let svgOverlay = svgGr.select(`.${style.jsOverlay}`);

      // if they are not created yet then create them
      if (trow1.empty()) {
        trow1 = ttab.append('tr').classed(style.legendRow, true)
          .on('click', multiClicker([
            function singleClick(d, i) { // single click handler
              // const overCoords = d3.mouse(model.listContainer);
              updateData(d);
            },
            // double click handler
            toggleSingleModeEvt,
          ])
          );
        trow2 = ttab.append('tr').classed(style.jsTr2, true);
        tdsl = trow2.append('td').classed(style.sparkline, true).attr('colspan', '3');
        legendCell = trow1
          .append('td')
          .classed(style.legend, true);

        fieldCell = trow1
          .append('td')
          .classed(style.fieldName, true);
        iconCell = trow1
          .append('td')
          .classed(style.legendIcons, true);
        iconCellViz = iconCell
          .append('span')
          .classed(style.legendIconsViz, true);
        scoreHelper.createScoreIcons(iconCellViz);
        iconCellViz
          .append('i')
            .classed(style.expandIcon, true)
            .on('click', toggleSingleModeEvt);

        // Create SVG, and main group created inside the margins for use by axes, title, etc.
        svgGr = tdsl.append('svg').classed(style.sparklineSvg, true)
          .append('g')
            .classed(style.jsGHist, true)
            .attr('transform', `translate( ${model.histMargin.left}, ${model.histMargin.top} )`);
        // nested groups inside main group
        svgGr.append('g')
          .classed(style.axis, true);
        svgGr.append('g')
          .classed(style.jsGRect, true);
        // scoring interface
        scoreHelper.createGroups(svgGr);
        svgGr.append('rect')
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

      // Change interaction icons based on state.
      // scoreHelper has save icon and score icon.
      const numIcons = (model.singleModeSticky ? 0 : 1) + scoreHelper.numScoreIcons(def);
      iconCell.style('width', `${(numIcons * 15) + 6}px`);
      scoreHelper.updateScoreIcons(iconCellViz, def);
      iconCellViz.select(`.${style.jsExpandIcon}`)
        .attr('class', model.singleModeName === null ? style.expandIcon : style.shrinkIcon)
        .style('display', model.singleModeSticky ? 'none' : null);
      // Apply field name
      fieldCell
        .style('width', `${model.histWidth - (numIcons * 19)}px`)
        .text(def.name);

      // adjust some settings based on current size
      tdsl.select('svg')
        .attr('width', publicAPI.svgWidth())
        .attr('height', publicAPI.svgHeight());

      // get the histogram data and rebuild the histogram based on the results
      const hobj = def.hobj;
      if (hobj) {
        const cmax = 1.0 * d3.max(hobj.counts);
        const hsize = hobj.counts.length;
        const hdata = svgGr.select(`.${style.jsGRect}`)
          .selectAll(`.${style.jsHistRect}`).data(hobj.counts);

        hdata.enter().append('rect');
        // changes apply to both enter and update data join:
        hdata
          .attr('class', (d, i) => (i % 2 === 0 ? style.histRectEven : style.histRectOdd))
          .attr('pname', def.name)
          .attr('y', d => model.histHeight * (1.0 - (d / cmax)))
          .attr('x', (d, i) => (model.histWidth / hsize) * i)
          .attr('height', d => model.histHeight * (d / cmax))
          .attr('width', Math.ceil(model.histWidth / hsize));

        hdata.exit().remove();

        const svgOverlay = svgGr.select(`.${style.jsOverlay}`);
        svgOverlay
          .attr('x', -model.histMargin.left)
          .attr('y', -model.histMargin.top)
          .attr('width', publicAPI.svgWidth())
          .attr('height', publicAPI.svgHeight()); // allow clicks inside x-axis.

        if (!scoreHelper.editingScore(def)) {
          if (model.provider.isA('HistogramBinHoverProvider')) {
            svgOverlay
              .on('mousemove.hs', (d, i) => {
                const mCoords = publicAPI.getMouseCoords(tdsl);
                const binNum = Math.floor((mCoords[0] / model.histWidth) * hsize);
                const state = {};
                state[def.name] = [binNum];
                model.provider.setHoverState({ state });
              })
              .on('mouseout.hs', (d, i) => {
                const state = {};
                state[def.name] = [-1];
                model.provider.setHoverState({ state });
              });
          }
          svgOverlay
            .on('click.hs', (d) => {
              const overCoords = publicAPI.getMouseCoords(tdsl);
              if (overCoords[1] <= model.histHeight) {
                updateData(d);
              }
            });
        } else {
          // disable when score editing is happening - it's distracting.
          // Note we still respond to hovers over other components.
          svgOverlay
            .on('.hs', null);
        }

        // Show an x-axis with just min/max displayed.
        // Attach scale, axis objects to this box's
        // data (the 'def' object) to allow persistence when scrolled.
        if (typeof def.xScale === 'undefined') {
          def.xScale = d3.scale.linear();
        }
        const [minRange, maxRange] = scoreHelper.getHistRange(def);
        def.xScale
          .rangeRound([0, model.histWidth])
          .domain([minRange, maxRange]);

        if (typeof def.xAxis === 'undefined') {
          const formatter = d3.format('.3s');
          def.xAxis = d3.svg.axis()
          .tickFormat(formatter)
          .orient('bottom');
        }
        def.xAxis
          .scale(def.xScale);
        let numTicks = 2;
        if (model.histWidth >= model.moreTicksSize) {
          numTicks = 5;
          // using .ticks() results in skipping min/max values,
          // if they aren't 'nice'. Make exactly 5 ticks.
          const myTicks = d3.range(numTicks).map(d => (
            minRange + ((d / (numTicks - 1)) * (maxRange - minRange)))
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

        scoreHelper.prepareItem(def, idx, svgGr, tdsl);
      }
    }

    // make sure all the elements are created
    // and updated
    if (onlyFieldName === null) {
      boxes.each(prepareItem);
      boxes
        .call(styleBoxes, model);
    } else {
      boxes.filter(def => (def.name === onlyFieldName)).each(prepareItem);
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
      const cSel = d3.select(model.container);
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

      setImmediate(scoreHelper.updateFieldAnnotations);
    }
  };

  function handleHoverUpdate(data) {
    const everything = d3.select(model.container);
    Object.keys(data.state).forEach((pName) => {
      const binList = data.state[pName];
      everything.selectAll(`rect[pname='${pName}']`)
        .classed(style.binHilite, (d, i) => binList.indexOf(i) >= 0);
    });
  }

  // Auto unmount on destroy
  model.subscriptions.push({ unsubscribe: publicAPI.setContainer });

  if (model.provider.isA('FieldProvider')) {
    const fieldNames = model.provider.getFieldNames();
    if (!model.fieldData) {
      model.fieldData = {};
    }

    fieldNames.forEach((name) => {
      model.fieldData[name] = Object.assign(
        model.fieldData[name] || {},
        model.provider.getField(name),
        scoreHelper.defaultFieldData());
    });

    model.subscriptions.push(model.provider.onFieldChange((field) => {
      Object.assign(model.fieldData[field.name], field);
      publicAPI.render();
    }));
  }

  if (model.provider.isA('HistogramBinHoverProvider')) {
    model.subscriptions.push(model.provider.onHoverBinChange(handleHoverUpdate));
  }

  if (model.provider.isA('Histogram1DProvider')) {
    model.histogram1DDataSubscription = model.provider.subscribeToHistogram1D(
      (data) => {
        // Below, we're asking for partial updates, so we just update our
        // cache with anything that came in.
        Object.keys(data).forEach((name) => {
          if (!model.fieldData[name]) model.fieldData[name] = {};
          if (model.fieldData[name].hobj) {
            const oldRangeMin = model.fieldData[name].hobj.min;
            const oldRangeMax = model.fieldData[name].hobj.max;
            model.fieldData[name].hobj = data[name];
            scoreHelper.rescaleDividers(name, oldRangeMin, oldRangeMax);
          } else {
            model.fieldData[name].hobj = data[name];
          }
        });

        publicAPI.render();
      },
      Object.keys(model.fieldData),
      {
        numberOfBins: model.numberOfBins,
        partial: true,
      }
    );

    model.subscriptions.push(model.histogram1DDataSubscription);
  }

  if (model.provider.isA('AnnotationStoreProvider')) {
    // Preload annotation from store
    const partitionSelectionToLoad = {};
    const annotations = model.provider.getStoredAnnotations();
    Object.keys(annotations).forEach((id) => {
      const annotation = annotations[id];
      if (annotation && annotation.selection.type === 'partition') {
        partitionSelectionToLoad[annotation.selection.partition.variable] = annotation;
      }
    });
    if (Object.keys(partitionSelectionToLoad).length) {
      scoreHelper.updateFieldAnnotations(partitionSelectionToLoad);
    }

    model.subscriptions.push(model.provider.onStoreAnnotationChange((event) => {
      if (event.action === 'delete' && event.annotation) {
        const annotation = event.annotation;
        if (annotation.selection.type === 'partition') {
          const fieldName = annotation.selection.partition.variable;
          if (model.fieldData[fieldName]) {
            model.fieldData[fieldName].annotation = null;
            model.fieldData[fieldName].dividers = undefined;
            model.fieldData[fieldName].editScore = false;
            publicAPI.render(fieldName);
          }
        }
      }
    }));
  }

  // scoring interface
  scoreHelper.addSubscriptions();

  // Make sure default values get applied
  publicAPI.setContainer(model.container);

  // Expose update fields partitions
  publicAPI.updateFieldAnnotations = scoreHelper.updateFieldAnnotations;

  publicAPI.getAnnotationForField = fieldName => model.fieldData[fieldName].annotation;
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
  singleModeName: null,
  singleModeSticky: false,
  scrollToName: null,
  // margins inside the SVG element.
  histMargin: { top: 6, right: 12, bottom: 23, left: 12 },
  histWidth: 90,
  histHeight: 70,
  // what's the smallest histogram size that shows 5 ticks, instead of min/max? in pixels
  moreTicksSize: 300,
  lastOffset: -1,
  headerSize: 25,
  // scoring interface activated by passing in 'scores' array externally.
  // scores: [{ name: 'Yes', color: '#00C900' }, ... ],
  defaultScore: 0,
  dragMargin: 8,
  selectedDef: null,

  numberOfBins: 32,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'VizComponent');
  CompositeClosureHelper.get(publicAPI, model, ['provider', 'container', 'numberOfBins']);
  CompositeClosureHelper.set(publicAPI, model, ['numberOfBins']);
  CompositeClosureHelper.dynamicArray(publicAPI, model, 'readOnlyFields');

  histogramSelector(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
