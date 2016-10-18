/* global document */
import d3 from 'd3';

import style from 'PVWStyle/InfoVizNative/InformationDiagram.mcss';

import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';
import htmlContent from './body.html';
import iconImage from './InfoDiagramIconSmall.png';
// import multiClicker from '../../Core/D3MultiClick';
import SelectionBuilder from '../../../Common/Misc/SelectionBuilder';
import AnnotationBuilder from '../../../Common/Misc/AnnotationBuilder';

import {
  calculateAngleAndRadius,
  downsample,
  freqToProb,
  topBinPmi,
  topPmi,
} from './utils';

const PMI_CHORD_MODE_NONE = 0;
const PMI_CHORD_MODE_ONE_BIN_ALL_VARS = 1;
const PMI_CHORD_MODE_ALL_BINS_TWO_VARS = 2;

let miCount = 0;

/* eslint-disable no-use-before-define */

// ----------------------------------------------------------------------------
// Information Diagram
// ----------------------------------------------------------------------------

function informationDiagram(publicAPI, model) {
  let lastAnnotationPushed = null;

  if (!model.provider
    || !model.provider.isA('MutualInformationProvider')
    || !model.provider.isA('Histogram1DProvider')
    || !model.provider.isA('FieldProvider')) {
    console.log('Invalid provider:', model.provider);
    return;
  }

  model.renderState = {
    pmiAllBinsTwoVars: null,
    pmiOneBinAllVars: null,
    pmiHighlight: null,
  };

  model.clientRect = null;

  miCount += 1;
  // unique id, based on count
  model.instanceID = `pvwInformationDiagram-${miCount}`;

  // Handle style for status bar
  function updateStatusBarVisibility() {
    const cntnr = d3.select(model.container);
    if (model.statusBarVisible) {
      cntnr.select('.status-bar-container')
        .style('width', function updateWidth() { return this.dataset.width; });
      cntnr.select('.show-button').classed(style.hidden, true);
      cntnr.select('.hide-button').classed(style.hidden, false);
      cntnr.select('.status-bar-text').classed(style.hidden, false);
    } else {
      cntnr.select('.status-bar-container').style('width', '20px');
      cntnr.select('.show-button').classed(style.hidden, false);
      cntnr.select('.hide-button').classed(style.hidden, true);
      cntnr.select('.status-bar-text').classed(style.hidden, true);
    }
  }

  publicAPI.propagateAnnotationInsteadOfSelection = (useAnnotation = true, defaultScore = 0, defaultWeight = 0) => {
    model.useAnnotation = useAnnotation;
    model.defaultScore = defaultScore;
    model.defaultWeight = defaultWeight;
  };

  publicAPI.resize = () => {
    if (!model.container) {
      return; // no shirt, no shoes, no service.
    }

    model.clientRect = model.container.getBoundingClientRect();

    d3.select(model.container)
      .select('div.status-bar-container')
      .attr('data-width', `${model.clientRect.width - 20}px`);

    publicAPI.render();
  };

  publicAPI.setContainer = (el) => {
    if (model.container) {
      while (model.container.firstChild) {
        model.container.removeChild(model.container.firstChild);
      }
    }

    model.container = el;

    if (model.container) {
      // Create placeholder
      model.container.innerHTML = htmlContent;

      // Apply style
      const d3Container = d3
        .select(model.container)
        .select('.info-diagram-container')
        .classed(style.infoDiagramContainer, true);

      d3Container
        .select('.status-bar-container')
        .classed(style.statusBarContainer, true);

      d3Container
        .select('.status-bar-text')
        .classed(style.statusBarText, true);

      d3Container
        .select('.show-button')
        .classed(style.showButton, true);

      d3Container
        .select('.hide-button')
        .classed(style.hideButton, true);

      d3Container
        .select('.info-diagram-placeholder')
        .classed(style.infoDiagramPlaceholder, true)
        .select('img')
        .attr('src', iconImage);

      // Attach listener for show/hide status bar
      d3Container.selectAll('.show-button, .hide-button').on('click', () => {
        model.statusBarVisible = !model.statusBarVisible;
        updateStatusBarVisibility();
        d3.event.preventDefault();
        d3.event.stopPropagation();
      });

      updateStatusBarVisibility();
    }
  };

  publicAPI.updateStatusBarText = msg => d3.select(model.container).select('input.status-bar-text').attr('value', msg);

  publicAPI.selectStatusBarText = () => {
    // select text so user can press ctrl-c if desired.
    if (model.statusBarVisible) {
      // https://www.sitepoint.com/javascript-copy-to-clipboard/
      d3.select(model.container).select('input.status-bar-text').node().select();
      // Copy-to-clipboard works because status bar text is an 'input':
      try {
        document.execCommand('copy');
      } catch (err) {
        console.log('Copy to clipboard failed. Press Ctrl-C to copy');
      }
    }
  };

  // need a unique groupID whenever a group is added.
  let groupID = 0;

  publicAPI.render = () => {
    // Extract provider data for local access
    const getLegend = model.provider.isA('LegendProvider') ? model.provider.getLegend : null;
    const histogram1DnumberOfBins = model.numberOfBins;
    const variableList = model.provider.getActiveFieldNames();

    if (variableList.length < 2 || !model.container) {
      // Select the main circle and hide it and unhide placeholder
      d3.select(model.container).select('svg.information-diagram')
        .classed(style.informationDiagramSvgShow, false)
        .classed(style.informationDiagramSvgHide, true);
      d3.select(model.container).select('div.info-diagram-placeholder').classed(style.hidden, false);
      publicAPI.updateStatusBarText('');
      return;
    }

    // Guard against rendering if container is non-null but has no size (as
    // in the case when workbench layout doesn't include our container)
    if (model.clientRect === null || model.clientRect.width === 0 || model.clientRect.height === 0) {
      return;
    }

    const width = model.clientRect.width;
    const height = model.clientRect.height;

    // Make sure we have all the data we need
    if (!model.mutualInformationData || !model.histogramData) {
      return;
    }

    // Update
    updateStatusBarVisibility();

    d3.select(model.container).select('div.info-diagram-placeholder').classed(style.hidden, true);
    d3.select(model.container).select('svg.information-diagram')
      .classed(style.informationDiagramSvgHide, false)
      .classed(style.informationDiagramSvgShow, true);

    const pmiChordMode = {
      mode: PMI_CHORD_MODE_NONE,
      srcParam: null,
      srcBin: null,
      miIndex: -1,
    };

    const outerHistoRadius = Math.min(width, height) / 2;
    const veryOutermostRadius = outerHistoRadius + 80;
    const histoRadius = outerHistoRadius - 20;
    const outerRadius = histoRadius - 50;
    const innerRadius = outerRadius - 24;
    const deltaRadius = outerRadius - innerRadius;

    const formatPercent = d3.format('.1%');
    const formatMI = d3.format('.2f');
    const formatVal = d3.format('.2s');

    const arc = d3.svg.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    const histoArc = d3.svg.arc().innerRadius(outerRadius + 10);

    const layout = d3
      .layout
      .chord()
      .padding(0.04)
      .sortSubgroups(d3.descending)
      .sortChords(d3.ascending);

    const path = d3.svg.chord().radius(innerRadius);

    // Remove previous SVG
    let svgParent = d3.select(model.container).select('svg');
    let svg = svgParent.select('.main-circle');
    if (svgParent.empty()) {
      svgParent = d3.select(model.container).append('svg')
      .style('float', 'left')
      .attr('class', style.informationDiagramSvgShow)
      .classed('information-diagram', true);
      svg = svgParent.append('g')
      .classed('main-circle', true)
      .classed(style.mainCircle, true);
    }

    svgParent
      .attr('width', width)
      .attr('height', height);
    svg
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    function findGroupAndBin(relCoords) {
      const result = {
        found: false,
        group: null,
        bin: -1,
        radius: 0,
      };
      const [angle, radius] = calculateAngleAndRadius(relCoords, [width, height]);
      result.radius = radius;
      for (let groupIdx = 0; groupIdx < layout.groups().length; ++groupIdx) {
        const groupData = layout.groups()[groupIdx];
        const groupName = model.mutualInformationData.vmap[groupData.index].name;
        if (angle > groupData.startAngle && angle <= groupData.endAngle) {
          const binSizeRadians = (groupData.endAngle - groupData.startAngle) / model.numberOfBins;
          const binIndex = Math.floor((angle - groupData.startAngle) / binSizeRadians);
          result.found = true;
          result.group = groupName;
          result.bin = binIndex;
          break;
        }
      }
      return result;
    }

    function unHoverBin(param) {
      if (model.provider.isA('HistogramBinHoverProvider')) {
        const state = {};
        state[param] = [-1];
        model.provider.setHoverState({
          source: 'MutualInformationDiagram',
          state,
        });
      }
    }

    function hoverBins(binMap) {
      if (model.provider.isA('HistogramBinHoverProvider')) {
        model.provider.setHoverState({
          source: 'MutualInformationDiagram',
          state: binMap,
        });
      }
    }

    function updateActiveSelection(binMap) {
      if (!model.provider.isA('SelectionProvider') || !model.provider.isA('FieldProvider')) {
        return;
      }

      const vars = {};
      let proceed = false;

      Object.keys(binMap).forEach((pName) => {
        const paramRange = model.provider.getField(pName).range;
        const binList = binMap[pName];
        const rangeList = [];
        for (let i = 0; i < binList.length; ++i) {
          if (binList[i] !== -1) {
            rangeList.push({
              interval: getBinRange(binList[i], histogram1DnumberOfBins, [paramRange[0], paramRange[1], paramRange[1] - paramRange[0]]),
            });
          }
        }
        if (rangeList.length > 0) {
          proceed = true;
          vars[pName] = rangeList;
        }
      });

      if (proceed) {
        const selection = SelectionBuilder.range(vars);
        if (model.useAnnotation) {
          lastAnnotationPushed = model.provider.getAnnotation();
          if (!lastAnnotationPushed || model.provider.shouldCreateNewAnnotation() || lastAnnotationPushed.selection.type !== 'range') {
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
          model.provider.setSelection(selection);
        }
      }
    }

    // function findPmiChordsToHighlight(param, bin, highlight = true, oneBinAllVarsMode = false) {
    function findPmiChordsToHighlight() {
      const { group: param, bin, highlight, mode: oneBinAllVarsMode } = model.renderState.pmiHighlight;
      if (highlight) {
        svg.select('g.pmiChords')
          .selectAll('path.pmiChord')
          .classed('highlight-pmi', false);
      }

      const binMap = {};

      function addBin(pName, bIdx) {
        if (!binMap[pName]) {
          binMap[pName] = [];
        }
        if (binMap[pName].indexOf(bIdx) === -1) {
          binMap[pName].push(bIdx);
        }
      }

      if (oneBinAllVarsMode) {
        svg.select('g.pmiChords').selectAll(`path[data-source-name="${param}"]:not(.fade)`)
          .classed('highlight-pmi', highlight)
          .each(function highlightPMI(d, i) {
            const elt = d3.select(this);
            addBin(param, bin);
            addBin(elt.attr('data-target-name'), Number.parseInt(elt.attr('data-target-bin'), 10));
          });

        svg.select('g.pmiChords')
          .selectAll(`path[data-target-name="${param}"]:not(.fade)`)
          .each(function inner(d, i) {
            const elt = d3.select(this);
            addBin(param, Number.parseInt(elt.attr('data-target-bin'), 10));
            addBin(elt.attr('data-source-name'), Number.parseInt(elt.attr('data-source-bin'), 10));
          });

        if (binMap[param] && binMap[param].indexOf(bin) >= 0) {
          binMap[param] = [bin];
        }

        svg.select('g.pmiChords').selectAll(`path[data-target-name="${param}"]:not(.fade)`)
          .classed('highlight-pmi', function inner(d, i) {
            const elt = d3.select(this);
            return binMap[param].indexOf(Number.parseInt(elt.attr('data-target-bin'), 10)) >= 0;
          });
      } else {
        svg.select('g.pmiChords').selectAll(`path[data-source-name="${param}"][data-source-bin="${bin}"]:not(.fade)`)
        .classed('highlight-pmi', highlight)
        .each(function highlightPMI(d, i) {
          const elt = d3.select(this);
          addBin(param, bin);
          addBin(elt.attr('data-target-name'), Number.parseInt(elt.attr('data-target-bin'), 10));
        });

        svg.select('g.pmiChords').selectAll(`path[data-target-name="${param}"][data-target-bin="${bin}"]:not(.fade)`)
          .classed('highlight-pmi', highlight)
          .each(function highlightPMI(d, i) {
            const elt = d3.select(this);
            addBin(param, bin);
            addBin(elt.attr('data-source-name'), Number.parseInt(elt.attr('data-source-bin'), 10));
          });
      }

      return binMap;
    }

    // Chord handling ---------------------------------------------------------

    function updateChordVisibility(options) {
      if (options.mi && options.mi.show === true) {
        if (options.mi.index !== undefined) {
          chord.classed('fade', p => p.source.index !== options.mi.index && p.target.index !== options.mi.index);
        } else {
          chord.classed('fade', false);
        }
        svg.selectAll('g.pmiChords path.pmiChord').classed('fade', true);
      } else if (options.pmi && options.pmi.show === true) {
        // Currently drawing pmi chords fades all mi chords, so we
        // don't have to do anything here to keep things consistent.
      }
    }

    function drawPMIAllBinsTwoVars() {
      const d = model.renderState.pmiAllBinsTwoVars.d;
      if (d.source.index === d.target.index) {
        console.log('Cannot render self-PMI', model.mutualInformationData.vmap[d.source.index].name);
        return;
      }

      pmiChordMode.mode = PMI_CHORD_MODE_ALL_BINS_TWO_VARS;
      pmiChordMode.srcParam = null;
      pmiChordMode.srcBin = null;

      // Turn off MI rendering
      chord.classed('fade', true);
      // Turn on PMI rendering
      let va = model.mutualInformationData.vmap[d.source.index].name;
      let vb = model.mutualInformationData.vmap[d.target.index].name;
      let swap = false;
      if (vb < va) {
        const tmp = vb;
        vb = va;
        va = tmp;
        swap = true;
      }

      const cAB = downsample(model.mutualInformationData.joint[va][vb], histogram1DnumberOfBins, swap);
      const probDict = freqToProb(cAB);
      const linksToDraw = topPmi(probDict, 0.95);

      // Make mutual info chords invisible.
      svg.selectAll('g.group path.chord')
        .classed('fade', true);

      const linkData = svg.select('g.pmiChords')
        .selectAll('path.pmiChord')
        .data(d3.zip(linksToDraw.idx, linksToDraw.pmi,
          new Array(linksToDraw.idx.length).fill([va, vb])));

      linkData
        .enter()
        .append('path')
        .classed('pmiChord', true)
        .classed(style.pmiChord, true);
      linkData.exit().remove();

      const vaGroup = layout.groups()[d.source.index];
      const vbGroup = layout.groups()[d.target.index];
      const vaRange = [vaGroup.startAngle, (vaGroup.endAngle - vaGroup.startAngle), (vaGroup.endAngle - vaGroup.startAngle) / histogram1DnumberOfBins];
      const vbRange = [vbGroup.startAngle, (vbGroup.endAngle - vbGroup.startAngle), (vbGroup.endAngle - vbGroup.startAngle) / histogram1DnumberOfBins];

      linkData
        .classed('fade', false)
        .attr('d', (data, index) =>
          path({
            source: {
              startAngle: (vaRange[0] + (data[0][0] * vaRange[2])),
              endAngle: (vaRange[0] + ((data[0][0] + 1) * vaRange[2])),
            },
            target: {
              startAngle: (vbRange[0] + (data[0][1] * vbRange[2])),
              endAngle: (vbRange[0] + ((data[0][1] + 1) * vbRange[2])),
            },
          })
        )
        .attr('data-source-name', swap ? vb : va)
        .attr('data-source-bin', (data, index) => `${data[0][0]}`)
        .attr('data-target-name', swap ? va : vb)
        .attr('data-target-bin', (data, iindex) => `${data[0][1]}`)
        .classed('highlight-pmi', false)
        .classed('positive', (data, index) => data[1] >= 0.0)
        .classed('negative', (data, index) => data[1] < 0.0)
        .attr('data-details', (data, index) => {
          var sIdx = swap ? 1 : 0;
          var tIdx = swap ? 0 : 1;
          const sourceBinRange = getParamBinRange(data[0][sIdx], histogram1DnumberOfBins, data[2][0]);
          const targetBinRange = getParamBinRange(data[0][tIdx], histogram1DnumberOfBins, data[2][1]);
          return 'PMI: '
            + `${data[2][0]} ∈ [ ${formatVal(sourceBinRange[0])}, ${formatVal(sourceBinRange[1])}] ↔︎ `
            + `${data[2][1]} ∈ [ ${formatVal(targetBinRange[0])}, ${formatVal(targetBinRange[1])}] ${formatMI(data[1])}`;
        })
        .on('mouseover', function mouseOver() {
          publicAPI.updateStatusBarText(d3.select(this).attr('data-details'));
        })
        .on('mouseout', () => {
          publicAPI.updateStatusBarText('');
        })
        .on('click', () => { publicAPI.selectStatusBarText(); });
    }

    // Mouse move handling ----------------------------------------------------

    svgParent
      /* eslint-disable prefer-arrow-callback */
      // need d3 provided 'this', below.
      .on('mousemove', function mouseMove(d, i) {
        /* xxeslint-enable prefer-arrow-callback */
        const overCoords = d3.mouse(model.container);
        const info = findGroupAndBin(overCoords);
        let clearStatusBar = false;
        let groupHoverName = null;
        let highlightAllGroups = false;

        for (let idx = 0; idx < variableList.length; ++idx) {
          unHoverBin(variableList[idx]);
        }

        if (info.radius > veryOutermostRadius) {
          highlightAllGroups = true;
          clearStatusBar = true;
        } else if (info.found) {
          if (info.radius > innerRadius && info.radius <= outerRadius) groupHoverName = info.group;

          let binMap = {};
          if (!(info.radius <= innerRadius && pmiChordMode.mode === PMI_CHORD_MODE_NONE)) {
            const oneBinAllVarsMode = info.radius <= innerRadius && pmiChordMode.mode === PMI_CHORD_MODE_ONE_BIN_ALL_VARS;
            model.renderState.pmiHighlight = { group: info.group, bin: info.bin, highlight: true, mode: oneBinAllVarsMode };
            const pmiBinMap = findPmiChordsToHighlight();
            if (info.radius <= innerRadius) {
              binMap = pmiBinMap;
            } else {
              svg.select(`g.group[param-name='${info.group}'`)
                .selectAll('path.htile')
                .each(function hTileInner(data, index) {
                  if (index === info.bin) {
                    publicAPI.updateStatusBarText(d3.select(this).attr('data-details'));
                  }
                });
            }
            if (!oneBinAllVarsMode) {
              binMap[info.group] = [info.bin];
            }
          }
          hoverBins(binMap);
        } else {
          clearStatusBar = true;
        }
        // show a clickable variable legend arc, if hovered, or
        // highlight all groups if a click will reset to default view (veryOutermostRadius)
        svg
          .selectAll(`g.group path[id^=\'${model.instanceID}-group\']`)
          .classed(style.hoverOutline, (data, idx) => highlightAllGroups || model.mutualInformationData.vmap[idx].name === groupHoverName);

        if (clearStatusBar === true) {
          publicAPI.updateStatusBarText('');
        }
      })
      .on('mouseout', (d, i) => {
        for (let idx = 0; idx < variableList.length; ++idx) {
          unHoverBin(variableList[idx]);
        }
      })
      .on('click', // multiClicker([
        function singleClick(d, i) { // single click handler
          const overCoords = d3.mouse(model.container);
          const info = findGroupAndBin(overCoords);
          if (info.radius > veryOutermostRadius) {
            showAllChords();
          } else if (info.radius > outerRadius ||
              (info.radius <= innerRadius &&
              pmiChordMode.mode === PMI_CHORD_MODE_ONE_BIN_ALL_VARS &&
              info.group === pmiChordMode.srcParam)) {
            if (info.found) {
              model.renderState.pmiAllBinsTwoVars = null;
              model.renderState.pmiOneBinAllVars = { group: info.group, bin: info.bin, d, i };
              drawPMIOneBinAllVars()(d, i);
              publicAPI.selectStatusBarText();
            }
          }
        // },
        })
      .on('dblclick',
        function doubleClick(d, i) { // double click handler
          const overCoords = d3.mouse(model.container);
          const info = findGroupAndBin(overCoords);

          if (info.found) {
            let binMap = {};
            const oneBinAllVarsMode = info.radius <= innerRadius && pmiChordMode.mode === PMI_CHORD_MODE_ONE_BIN_ALL_VARS;
            if (info.radius <= innerRadius) {
              model.renderState.pmiHighlight = { group: info.group, bin: info.bin, highlight: true, mode: oneBinAllVarsMode };
              binMap = findPmiChordsToHighlight();
            }
            if (!oneBinAllVarsMode) {
              binMap[info.group] = [info.bin];
            }
            updateActiveSelection(binMap);
          }

          d3.event.stopPropagation();
      //   },
      // ])
        });
    let miChordsG = svg.select('g.mutualInfoChords');
    if (miChordsG.empty()) {
      svg.append('circle').attr('r', outerRadius);
      miChordsG = svg.append('g').classed('mutualInfoChords', true);
      svg.append('g').classed('pmiChords', true);

      // add a straight path so IE/Edge can measure text lengths usefully.
      // Otherwise, along a curved path, they return the horizontal space covered.
      svg.append('defs').append('path')
        .attr('id', 'straight-text-path')
        .attr('d', `M0,0L${width},0`);
    }
    // Compute the chord layout.
    layout.matrix(model.mutualInformationData.matrix);

    // Get lookups for pmi chords
    model.mutualInformationData.lkup = {};
    Object.keys(model.mutualInformationData.vmap).forEach((i) => {
      model.mutualInformationData.lkup[model.mutualInformationData.vmap[i].name] = i;
    });

    // Only used when there is no legend service
    const cmap = d3.scale.category20();

    // Add a group per neighborhood.
    const group = svg
      .selectAll('.group')
      .data(layout.groups, () => { groupID += 1; return groupID; });
    const groupEnter = group
      .enter()
      .append('g')
      .classed('group', true)
      .classed(style.group, true);


    // Add the group arc.
    groupEnter
      .append('path')
      .attr('id', (d, i) => `${model.instanceID}-group${i}`);

    // Add a text label.
    const groupText = groupEnter
      .append('text')
      // .attr('x', 6) // prevents ie11 from seeing text-anchor and startOffset.
      .attr('dy', 15);

    if (!model.textLengthMap) model.textLengthMap = {};
    // pull a stunt to measure text length - use a straight path, then switch to the real curved one.
    const textPath = groupText
      .append('textPath')
      .attr('xlink:href', '#straight-text-path')
      .attr('startOffset', '25%')
      .text((d, i) => model.mutualInformationData.vmap[i].name)
      .each(function textLen(d, i) {
        model.textLengthMap[model.mutualInformationData.vmap[i].name] = this.getComputedTextLength();
      });

    textPath
      .attr('xlink:href', (d, i) => `#${model.instanceID}-group${i}`);

    // enter + update items.
    const groupPath = group.select('path')
      .attr('d', arc);
    // Remove the labels that don't fit, or shorten label, using ...
    group
      .select('text').select('textPath')
      .each(function truncate(d, i) {
        d.textShown = true;
        const availLength = ((groupPath[0][d.index].getTotalLength() / 2) - deltaRadius - model.glyphSize);
        // shorten text based on string length vs initial total length.
        const fullText = model.mutualInformationData.vmap[d.index].name;
        const textLength = model.textLengthMap[fullText];
        const strLength = fullText.length;
        // we fit! done.
        if (textLength <= availLength) {
          d.textLength = textLength;
          return;
        }
        // if we don't have 15 pixels left, or short string, don't show label.
        if (availLength < 15 || strLength < 9) {
          d.textShown = false;
          return;
        }
        // drop the middle 50%.
        let testStrLen = Math.floor(strLength * 0.25);
        // estimate new length, +2 to account for adding '...'
        d.textLength = (((testStrLen * 2) + 2) / strLength) * textLength;
        if (d.textLength < availLength) {
          d3.select(this).text(`${fullText.slice(0, testStrLen)}...${fullText.slice(-testStrLen)}`);
          return;
        }
        // start at 1/3 of the string, go down to 3 chars plus ...
        testStrLen = Math.floor(strLength / 2.99);
        while (testStrLen >= 3) {
          d.textLength = ((testStrLen + 2) / strLength) * textLength;
          if (d.textLength < availLength) {
            d3.select(this).text(`${fullText.slice(0, testStrLen)}...`);
            return;
          }
          testStrLen -= 1;
        }
        // small string doesn't fit - hide.
        d.textShown = false;
      })
      .attr('display', (d, i) => (d.textShown ? null : 'none'));
      // .remove(); ie11 throws errors if we use .remove() - hide instead.


    // Add group for glyph
    if (getLegend) {
      group.each(function addLegend(glyphData) {
        let glyph = d3.select(this).select('g.glyph');
        if (glyph.empty()) {
          glyph = d3.select(this)
            .append('g')
            .classed('glyph', true)
            .classed(style.glyph, true);
          glyph
            .append('svg')
            .append('use');
        }

        const legend = getLegend(model.mutualInformationData.vmap[glyphData.index].name);
        // Add the glyph to the group
        const textLength = glyphData.textShown ? glyphData.textLength : 0;
        const pathLength = groupPath[0][glyphData.index].getTotalLength();
        const avgRadius = (innerRadius + outerRadius) / 2;
        // Start at edge of arc, move to text anchor, back up half of text length and glyph size
        const glyphAngle = (glyphData.startAngle + (pathLength * 0.25 / outerRadius) - ((textLength + model.glyphSize) * 0.5 / avgRadius));
        // console.log(model.mutualInformationData.vmap[glyphData.index].name, textLength, pathLength, glyphAngle);

        glyph
          .attr('transform', `translate(
            ${(avgRadius * Math.sin(glyphAngle)) - (model.glyphSize / 2)},
            ${(-avgRadius * Math.cos(glyphAngle)) - (model.glyphSize / 2)})`)
          .select('svg')
          .attr('width', model.glyphSize)
          .attr('height', model.glyphSize)
          .attr('stroke', 'black')
          .attr('fill', legend.color)
          .select('use')
          .attr('xlink:href', legend.shape);

        model.mutualInformationData.vmap[glyphData.index].color = legend.color;

        // Remove the glyphs that don't fit
        if ((groupPath[0][glyphData.index].getTotalLength() / 2) - deltaRadius < model.glyphSize) {
          // glyph.remove(); ie11 objects, hide instead.
          glyph.attr('display', 'none');
        }
      });
    }

    function getParamBinRange(index, numberOfBins, paramName) {
      const paramRange = model.provider.getField(paramName).range;
      return getBinRange(index, numberOfBins,
        [paramRange[0], paramRange[1], paramRange[1] - paramRange[0]]);
    }

    function getBinRange(index, numberOfBins, paramRange) {
      return [
        (index / numberOfBins * paramRange[2]) + paramRange[0],
        ((index + 1) / numberOfBins * paramRange[2]) + paramRange[0],
      ];
    }

    // Zip histogram info into layout.groups() (which we initially have no control over as it is
    // generated for us).
    group
      .each(function buildHistogram(groupData) {
        const gname = model.mutualInformationData.vmap[groupData.index].name;
        const gvar = model.histogramData[gname];

        if (!gvar) return;

        // Set the color if it hasn't already been set
        if (!getLegend) {
          model.mutualInformationData.vmap[groupData.index].color = cmap(groupData.index);
        }

        // Add the color to the group arc
        d3.select(this)
          .select('path')
          .style('fill', model.mutualInformationData.vmap[groupData.index].color || 'red');

        groupData.range = [gvar.min, gvar.max, gvar.max - gvar.min];

        const delta = (groupData.endAngle - groupData.startAngle) / gvar.counts.length;
        const total = Number(gvar.counts.reduce((a, b) => a + b));
        const maxcnt = Number(gvar.counts.reduce((a, b) => (a > b ? a : b)));

        /* eslint-disable arrow-body-style */
        groupData.histo = gvar.counts.map((d, i) => {
          return {
            startAngle: ((i * delta) + groupData.startAngle),
            endAngle: (((i + 1) * delta) + groupData.startAngle),
            innerRadius: (outerRadius + 10),
            outerRadius: (outerRadius + 10 + (d / maxcnt * (histoRadius - outerRadius))),
            index: i,
            value: (d / total),
          };
        });

        const htile = d3.select(this)
          .attr('param-name', gname)
          .selectAll('path.htile')
          .data(groupData.histo);
        htile
          .enter()
          .append('path')
          .classed('htile', true);
        htile
          .attr('d', (d, i) => histoArc.outerRadius(d.outerRadius)(d))
          .attr('data-details', (d, i) => {
            const binRange = getBinRange(i, histogram1DnumberOfBins, groupData.range);
            return `p(${gname} ∈ [${formatVal(binRange[0])}, ${formatVal(binRange[1])}]) = ${formatPercent(d.value)}`;
          })
          .attr('fill', (d, i) => (i % 2 ? '#bebebe' : '#a9a9a9'));
      });

    function showAllChords() {
      pmiChordMode.mode = PMI_CHORD_MODE_NONE;
      pmiChordMode.srcParam = null;
      pmiChordMode.srcBin = null;
      pmiChordMode.miIndex = -1;
      updateChordVisibility({ mi: { show: true } });
    }
    // do we need to reset?
    const groupExit = group.exit();
    const needReset = (!groupEnter.empty() || !groupExit.empty());
    groupExit.remove();

    // Add the chords. Color only chords that show self-mutual-information.
    const chord = miChordsG
      .selectAll('.chord')
      .data(layout.chords);
    chord
      .enter()
      .append('path')
      .classed('chord', true)
      .classed(style.chord, true);

    chord.exit().remove();

    chord
      .classed('selfchord', d => (d.source.index === d.target.index))
      .attr('d', path)
      .style('fill', null)
      .on('click', (d, i) => {
        model.renderState.pmiOneBinAllVars = null;
        model.renderState.pmiAllBinsTwoVars = { d, i };
        drawPMIAllBinsTwoVars();
        publicAPI.selectStatusBarText();
      })
      .on('mouseover', function inner(d, i) {
        publicAPI.updateStatusBarText(d3.select(this).attr('data-details'));
      })
      .on('mouseout', () => {
        publicAPI.updateStatusBarText('');
      });

    miChordsG
      .selectAll('.selfchord')
      .style('fill', d => model.mutualInformationData.vmap[d.source.index].color);

    chord
      .attr('data-details', (d, i) =>
        `Mutual information: ${model.mutualInformationData.vmap[d.source.index].name} ↔︎ ${model.mutualInformationData.vmap[d.target.index].name} `
        + `${formatMI(model.mutualInformationData.matrix[d.source.index][d.target.index])}`);
    // The lines below are for the case when the MI matrix has been row-normalized:
    // model.mutualInformationData.matrix[d.source.index][d.target.index] *
    // model.mutualInformationData.vmap[d.source.index].autoInfo/model.mutualInformationData.matrix[d.source.index][d.source.index]);

    // after chord is defined.
    if (needReset) {
      showAllChords();
      publicAPI.updateStatusBarText('');
    }

    svg
      .selectAll(`g.group path[id^=\'${model.instanceID}-group\']`)
      .on('click', (d, i) => {
        if (pmiChordMode.mode !== PMI_CHORD_MODE_NONE || pmiChordMode.miIndex !== i) {
          pmiChordMode.mode = PMI_CHORD_MODE_NONE;
          pmiChordMode.srcParam = null;
          pmiChordMode.srcBin = null;
          pmiChordMode.miIndex = i;
          updateChordVisibility({ mi: { show: true, index: i } });
        } else {
          showAllChords();
        }
      });

    if (model.renderState.pmiAllBinsTwoVars !== null) {
      drawPMIAllBinsTwoVars();
    } else if (model.renderState.pmiOneBinAllVars !== null) {
      const { group: g, bin: b, d, i } = model.renderState.pmiOneBinAllVars;
      drawPMIOneBinAllVars(g, b)(d, i);
    }

    if (model.renderState.pmiHighlight !== null) {
      findPmiChordsToHighlight();
    }

    function drawPMIOneBinAllVars() {
      var binVar = model.renderState.pmiOneBinAllVars.group; // Hold on to the name of the variable whose bin we should draw.
      var binIdx = model.renderState.pmiOneBinAllVars.bin;

      pmiChordMode.mode = PMI_CHORD_MODE_ONE_BIN_ALL_VARS;
      pmiChordMode.srcParam = binVar;
      pmiChordMode.srcBin = binIdx;

      // Return a function that, given a bin datum, renders the highest PMI (or probability)
      // links from that bin to any/all other bins in other variables it co-occurs with.
      return (d, i) => {
        // Turn off MI rendering
        chord.classed('fade', true);

        // Turn on PMI rendering
        let linkAccum = [];
        Object.keys(model.mutualInformationData.vmap).forEach((iother) => {
          var other = model.mutualInformationData.vmap[iother];
          let va = binVar;
          let vb = other.name;
          if (!vb || vb === va) {
            return; // Can't draw links to self...
          }
          let swap = false;
          if (vb < va) {
            const tmp = vb;
            vb = va;
            va = tmp;
            swap = true;
          }

          const cAB = downsample(model.mutualInformationData.joint[va][vb], histogram1DnumberOfBins, swap);
          const probDict = freqToProb(cAB);
          const linksToDraw = topBinPmi(probDict, true, binIdx, 0.8);
          linkAccum = linkAccum.concat(
            d3.zip(
              linksToDraw.idx, linksToDraw.pmi, linksToDraw.pAB,
              new Array(linksToDraw.idx.length).fill([binVar, other.name])
            )
          );
        });

        // Make mutual info chords invisible.
        svg.selectAll('g.group path.chord')
          .classed('fade', true);

        const linkData = svg
          .select('g.pmiChords')
          .selectAll('path.pmiChord')
          .data(linkAccum);

        linkData.enter().append('path')
          .classed('pmiChord', true)
          .classed(style.pmiChord, true);
        linkData.exit().remove();

        linkData
          .classed('fade', false)
          .attr('d', (data, index) => {
            var vaGrp = layout.groups()[model.mutualInformationData.lkup[data[3][0]]];
            var vbGrp = layout.groups()[model.mutualInformationData.lkup[data[3][1]]];
            var vaRange = [vaGrp.startAngle, (vaGrp.endAngle - vaGrp.startAngle), (vaGrp.endAngle - vaGrp.startAngle) / histogram1DnumberOfBins];
            var vbRange = [vbGrp.startAngle, (vbGrp.endAngle - vbGrp.startAngle), (vbGrp.endAngle - vbGrp.startAngle) / histogram1DnumberOfBins];
            return path({
              source: {
                startAngle: (vaRange[0] + (data[0][0] * vaRange[2])),
                endAngle: (vaRange[0] + ((data[0][0] + 1) * vaRange[2])),
              },
              target: {
                startAngle: (vbRange[0] + (data[0][1] * vbRange[2])),
                endAngle: (vbRange[0] + ((data[0][1] + 1) * vbRange[2])),
              },
            });
          })
          .attr('data-source-name', data => data[3][0])
          .attr('data-source-bin', data => data[0][0])
          .attr('data-target-name', data => data[3][1])
          .attr('data-target-bin', data => data[0][1])
          .classed('highlight-pmi', false)
          .classed('positive', data => data[1] >= 0.0)
          .classed('negative', data => data[1] < 0.0)
          .attr('data-details', (data) => {
            const sourceBinRange = getParamBinRange(data[0][0], histogram1DnumberOfBins, data[3][0]);
            const targetBinRange = getParamBinRange(data[0][1], histogram1DnumberOfBins, data[3][1]);
            return 'PMI: '
              + `${data[3][0]} ∈ [ ${formatVal(sourceBinRange[0])}, ${formatVal(sourceBinRange[1])}] ↔︎ `
              + `${data[3][1]} ∈ [ ${formatVal(targetBinRange[0])}, ${formatVal(targetBinRange[1])}] ${formatMI(data[1])}`;
          })
          .on('mouseover', function mouseOver() {
            publicAPI.updateStatusBarText(d3.select(this).attr('data-details'));
          })
          .on('mouseout', () => {
            publicAPI.updateStatusBarText('');
          })
          .on('click', () => { publicAPI.selectStatusBarText(); });
      };
    }
  };

  function handleHoverUpdate(data) {
    const svg = d3.select(model.container);
    Object.keys(data.state).forEach((pName) => {
      const binList = data.state[pName];
      svg.selectAll(`g.group[param-name='${pName}'] > path.htile`)
        .classed('hilite', (d, i) =>
          binList.indexOf(-1) === -1 && binList.indexOf(i) >= 0
        );
    });
  }

  // Make sure default values get applied
  publicAPI.setContainer(model.container);

  model.subscriptions.push({ unsubscribe: publicAPI.setContainer });
  model.subscriptions.push(model.provider.onFieldChange(() => {
    model.renderState = {
      pmiAllBinsTwoVars: null,
      pmiOneBinAllVars: null,
      pmiHighlight: null,
    };
    if (model.provider.setMutualInformationParameterNames) {
      model.provider.setMutualInformationParameterNames(model.provider.getActiveFieldNames());
    }
  }));

  if (model.provider.isA('Histogram1DProvider')) {
    model.histogram1DDataSubscription = model.provider.subscribeToHistogram1D(
      (data) => {
        model.histogramData = data;
        publicAPI.render();
      },
      model.provider.getFieldNames(),
      {
        numberOfBins: model.numberOfBins,
        partial: false,
      }
    );

    model.subscriptions.push(model.histogram1DDataSubscription);
  }

  if (model.provider.isA('MutualInformationProvider')) {
    model.mutualInformationDataSubscription = model.provider.onMutualInformationReady(
      (data) => {
        model.mutualInformationData = data;
        publicAPI.render();
      });

    model.subscriptions.push(model.mutualInformationDataSubscription);
    model.provider.setMutualInformationParameterNames(model.provider.getActiveFieldNames());
  }

  if (model.provider.isA('HistogramBinHoverProvider')) {
    model.subscriptions.push(model.provider.onHoverBinChange(handleHoverUpdate));
  }

  if (model.provider.isA('SelectionProvider')) {
    model.subscriptions.push(model.provider.onAnnotationChange((annotation) => {
      if (lastAnnotationPushed
        && annotation.selection.type === 'range'
        && annotation.id === lastAnnotationPushed.id
        && annotation.generation === lastAnnotationPushed.generation + 1) {
        // Assume that it is still ours but edited by someone else
        lastAnnotationPushed = annotation;
        // Capture the score and update our default
        model.defaultScore = lastAnnotationPushed.score[0];
      }
    }));
  }
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  container: null,
  provider: null,

  needData: true,

  glyphSize: 15,

  statusBarVisible: false,

  useAnnotation: false,
  defaultScore: 0,
  defaultWeight: 1,

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

  informationDiagram(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
