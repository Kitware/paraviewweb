import d3 from 'd3';

import style from 'PVWStyle/InfoVizNative/InformationDiagram.mcss';

import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';
import htmlContent from './body.html';
import iconImage from './InfoDiagramIconSmall.png';
import multiClicker from '../../Core/D3MultiClick';
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

  // Fetch needed data
  function fetchData() {
    let needDataCount = 0;
    const fieldNames = model.provider.getActiveFieldNames();
    model.needData = true;

    // Fetch Histogram 1D
    needDataCount += fieldNames.length;
    fieldNames.forEach(name => {
      if (model.provider.loadHistogram1D(name)) {
        needDataCount--;
      }
    });

    // Fetch mutual information
    needDataCount += 1;
    if (model.provider.loadMutualInformation(fieldNames)) {
      needDataCount--;
    }

    // Do we have all the data?
    model.needData = !!needDataCount;

    // Render if everything is available
    if (!model.needData) {
      // Will trigger render with proper size
      publicAPI.resize();
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

    const clientRect = model.container.getBoundingClientRect();

    d3.select(model.container)
      .select('div.status-bar-container')
      .attr('data-width', `${clientRect.width - 20}px`);

    publicAPI.render(clientRect.width, clientRect.height);
  };

  publicAPI.setContainer = el => {
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

      // Fetch data for rendering
      fetchData();
    }
  };

  publicAPI.updateStatusBarText = msg => d3.select(model.container).select('span.status-bar-text').text(msg);

  publicAPI.render = (width, height) => {
    // Extract provider data for local access
    const getLegend = model.provider.isA('LegendProvider') ? model.provider.getLegend : null;
    const histogram1DnumberOfBins = model.provider.getHistogram1DNumberOfBins();
    const variableList = model.provider.getActiveFieldNames();
    const mutualInformationData = model.provider.getMutualInformation();
    const histogramData = {};
    variableList.forEach(name => {
      histogramData[name] = model.provider.getHistogram1D(name);
    });

    if (variableList.length < 2 || model.container === null) {
      // Select the main circle and hide it and unhide placeholder
      d3.select(model.container).select('svg.information-diagram').classed(style.hidden, true);
      d3.select(model.container).select('div.info-diagram-placeholder').classed(style.hidden, false);
      return;
    }

    // Guard against rendering if container is non-null but has no size (as
    // in the case when workbench layout doesn't include our container)
    if (width === 0 || height === 0) {
      return;
    }

    // Make sure we have all the data we need
    if (model.needData) {
      fetchData();
      return;
    }

    // Update
    updateStatusBarVisibility();

    d3.select(model.container).select('div.info-diagram-placeholder').classed(style.hidden, true);

    const pmiChordMode = {
      mode: PMI_CHORD_MODE_NONE,
      srcParam: null,
      srcBin: null,
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
    const old = d3.select(model.container).select('svg');
    if (!old.empty()) {
      old.remove();
    }

    // Setup our SVG container
    const svg = d3.select(model.container).append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('float', 'left')
      .classed('information-diagram', true)
      .classed(style.informationDiagramSvg, true)
      .classed(style.noInteract, true)
      .append('g')
      .classed('main-circle', true)
      .classed(style.mainCircle, true)
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
        const groupName = mutualInformationData.vmap[groupData.index].name;
        if (angle > groupData.startAngle && angle <= groupData.endAngle) {
          const binSizeRadians = (groupData.endAngle - groupData.startAngle) / model.provider.getHistogram1DNumberOfBins();
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

      Object.keys(binMap).forEach(pName => {
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
          lastAnnotationPushed = AnnotationBuilder.annotation(selection, [model.defaultScore], model.defaultWeight);
          model.provider.setAnnotation(lastAnnotationPushed);
        } else {
          model.provider.setSelection(selection);
        }
      }
    }

    function findPmiChordsToHighlight(param, bin, highlight = true, oneBinAllVarsMode = false) {
      // const svg = d3.select(model.container).select('svg');
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

        if (binMap[param].indexOf(bin) >= 0) {
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

    function drawPMIAllBinsTwoVars(d, i) {
      if (d.source.index === d.target.index) {
        console.log('Cannot render self-PMI', mutualInformationData.vmap[d.source.index].name);
        return;
      }

      pmiChordMode.mode = PMI_CHORD_MODE_ALL_BINS_TWO_VARS;
      pmiChordMode.srcParam = null;
      pmiChordMode.srcBin = null;

      // Turn off MI rendering
      chord.classed('fade', true);
      // Turn on PMI rendering
      let va = mutualInformationData.vmap[d.source.index].name;
      let vb = mutualInformationData.vmap[d.target.index].name;
      let swap = false;
      if (vb < va) {
        const tmp = vb;
        vb = va;
        va = tmp;
        swap = true;
      }

      const cAB = downsample(mutualInformationData.joint[va][vb], histogram1DnumberOfBins, swap);
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

      svg.select('g.pmiChords')
        .selectAll('path.pmiChord')
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
        });
    }

    // Mouse move hanlding ----------------------------------------------------

    // d3.select(model.container).select('svg')
    svg
      .on('mousemove', function mouseMove(d, i) {
        const overCoords = d3.mouse(model.container);
        const info = findGroupAndBin(overCoords);
        let clearStatusBar = false;

        for (let idx = 0; idx < variableList.length; ++idx) {
          unHoverBin(variableList[idx]);
        }

        if (info.radius > veryOutermostRadius) {
          d3.select(this).classed(style.noInteract, true);
          clearStatusBar = true;
        } else {
          d3.select(this).classed(style.noInteract, false);
          if (info.found) {
            let binMap = {};
            const oneBinAllVarsMode = info.radius <= innerRadius && pmiChordMode.mode === PMI_CHORD_MODE_ONE_BIN_ALL_VARS;
            const pmiBinMap = findPmiChordsToHighlight(info.group, info.bin, true, oneBinAllVarsMode);
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
            hoverBins(binMap);
          } else {
            clearStatusBar = true;
          }
        }

        if (clearStatusBar === true) {
          publicAPI.updateStatusBarText('');
        }
      })
      .on('mouseout', (d, i) => {
        for (let idx = 0; idx < variableList.length; ++idx) {
          unHoverBin(variableList[idx]);
        }
      })
      .on('click', multiClicker([
        function singleClick(d, i) { // single click handler
          const overCoords = d3.mouse(model.container);
          const info = findGroupAndBin(overCoords);
          if (info.radius > veryOutermostRadius) {
            pmiChordMode.mode = PMI_CHORD_MODE_NONE;
            pmiChordMode.srcParam = null;
            pmiChordMode.srcBin = null;
            updateChordVisibility({ mi: { show: true } });
          } else if (info.radius > outerRadius ||
              (info.radius <= innerRadius &&
              pmiChordMode.mode === PMI_CHORD_MODE_ONE_BIN_ALL_VARS &&
              info.group === pmiChordMode.srcParam)) {
            if (info.found) {
              drawPMIOneBinAllVars(info.group, info.bin)(d, i);
            }
          }
        },
        function doubleClick(d, i) { // double click handler
          const overCoords = d3.mouse(model.container);
          const info = findGroupAndBin(overCoords);

          if (info.found) {
            let binMap = {};
            const oneBinAllVarsMode = info.radius <= innerRadius && pmiChordMode.mode === PMI_CHORD_MODE_ONE_BIN_ALL_VARS;
            if (info.radius <= innerRadius) {
              binMap = findPmiChordsToHighlight(info.group, info.bin, true, oneBinAllVarsMode);
            }
            if (!oneBinAllVarsMode) {
              binMap[info.group] = [info.bin];
            }
            updateActiveSelection(binMap);
          }

          d3.event.stopPropagation();
        },
      ]));

    svg.append('circle').attr('r', outerRadius);
    svg.append('g').classed('mutualInfoChords', true);
    svg.append('g').classed('pmiChords', true);

    // Compute the chord layout.
    layout.matrix(mutualInformationData.matrix);

    // Add a group per neighborhood.
    const group = svg
      .selectAll('.group')
      .data(layout.groups)
      .enter()
      .append('g')
      .classed('group', true)
      .classed(style.group, true);

    // Get lookups for pmi chords
    mutualInformationData.lkup = {};
    Object.keys(mutualInformationData.vmap).forEach(i => {
      mutualInformationData.lkup[mutualInformationData.vmap[i].name] = i;
    });

    // Only used when there is no legend service
    const cmap = d3.scale.category20();

    // Add the group arc.
    const groupPath = group
      .append('path')
      .attr('id', (d, i) => `group${i}`)
      .attr('d', arc);

    // Add a text label.
    const groupText = group
      .append('text')
      .attr('x', 6)
      .attr('dy', 15);

    groupText
      .append('textPath')
      .attr('xlink:href', (d, i) => `#group${i}`)
      .attr('startOffset', '25%')
      .text((d, i) => mutualInformationData.vmap[i].name);

    // Remove the labels that don't fit. :(
    groupText
      .filter(function removeLongLabel(d, i) {
        return ((groupPath[0][i].getTotalLength() / 2) - deltaRadius) < (this.getComputedTextLength() + model.glyphSize);
      })
      .remove();

    // Add group for glyph
    if (getLegend) {
      group.each(function addLegend() {
        const glyph = d3.select(this).select('g.glyph');
        if (glyph.empty()) {
          d3.select(this)
            .append('g')
            .classed('glyph', true)
            .classed(style.glyph, true)
            .append('svg')
            .append('use');
        }

        const groupGlyph = group.selectAll('g.glyph');
        groupGlyph.each(function updateColor(glyphData) {
          const legend = getLegend(mutualInformationData.vmap[glyphData.index].name);
          // Add the glyph to the group
          const textLength = groupText[0][glyphData.index].firstChild.getComputedTextLength();
          const pathLength = groupPath[0][glyphData.index].getTotalLength();
          const avgRadius = (innerRadius + outerRadius) / 2;
          // Start at edge of arc, move to text anchor, back up half of text length and glyph size
          const glyphAngle = (glyphData.startAngle + (pathLength / 4 / outerRadius) - ((textLength + model.glyphSize) / 2 / avgRadius));

          const currGlyph = d3.select(this);
          currGlyph
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

          mutualInformationData.vmap[glyphData.index].color = legend.color;
        });

        // Remove the glyphs that don't fit
        groupGlyph
          .filter((d, i) => (groupPath[0][i].getTotalLength() / 2) - deltaRadius < model.glyphSize)
          .remove();
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
    svg.selectAll('g.group')
      .each(function buildHistogram(groupData) {
        const gname = mutualInformationData.vmap[groupData.index].name;
        const gvar = histogramData[gname];

        // Set the color if it hasn't already been set
        if (!getLegend) {
          mutualInformationData.vmap[groupData.index].color = cmap(groupData.index);
        }

        // Add the color to the group arc
        d3.select(this)
          .select('path')
          .style('fill', mutualInformationData.vmap[groupData.index].color || 'red');

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

        d3.select(this)
          .attr('param-name', gname)
          .selectAll('path.htile')
          .data(groupData.histo)
          .enter()
          .append('path')
          .classed('htile', true)
          .attr('d', (d, i) => histoArc.outerRadius(d.outerRadius)(d))
          .attr('data-details', (d, i) => {
            const binRange = getBinRange(i, histogram1DnumberOfBins, groupData.range);
            return `p(${gname} ∈ [${formatVal(binRange[0])}, ${formatVal(binRange[1])}]) = ${formatPercent(d.value)}`;
          })
          .attr('fill', (d, i) => (i % 2 ? '#bebebe' : '#a9a9a9'));
      });

    // Add the chords. Color only chords that show self-mutual-information.
    const chord = svg.select('g.mutualInfoChords')
      .selectAll('.chord')
      .data(layout.chords)
      .enter()
      .append('path')
      .classed('chord', true)
      .classed(style.chord, true)
      .classed('selfchord', d => (d.source.index === d.target.index))
      .attr('d', path)
      .on('click', drawPMIAllBinsTwoVars)
      .on('mouseover', function inner(d, i) {
        publicAPI.updateStatusBarText(d3.select(this).attr('data-details'));
      })
      .on('mouseout', () => {
        publicAPI.updateStatusBarText('');
      });

    svg
      .select('g.mutualInfoChords')
      .selectAll('.selfchord')
      .style('fill', d => mutualInformationData.vmap[d.source.index].color);

    chord
      .attr('data-details', (d, i) =>
        `Mutual information: ${mutualInformationData.vmap[d.source.index].name} ↔︎ ${mutualInformationData.vmap[d.target.index].name} `
        + `${formatMI(mutualInformationData.matrix[d.source.index][d.target.index])}`);
    // The lines below are for the case when the MI matrix has been row-normalized:
    // mutualInformationData.matrix[d.source.index][d.target.index] *
    // mutualInformationData.vmap[d.source.index].autoInfo/mutualInformationData.matrix[d.source.index][d.source.index]);

    svg
      .selectAll('g.group path[id^=\'group\']')
      .on('click', (d, i) => {
        pmiChordMode.mode = PMI_CHORD_MODE_NONE;
        pmiChordMode.srcParam = null;
        pmiChordMode.srcBin = null;
        updateChordVisibility({ mi: { show: true, index: i } });
      });

    function drawPMIOneBinAllVars(gname, binIndex) {
      var binVar = gname; // Hold on to the name of the variable whose bin we should draw.
      var binIdx = binIndex;

      pmiChordMode.mode = PMI_CHORD_MODE_ONE_BIN_ALL_VARS;
      pmiChordMode.srcParam = gname;
      pmiChordMode.srcBin = binIndex;

      // Return a function that, given a bin datum, renders the highest PMI (or probability)
      // links from that bin to any/all other bins in other variables it co-occurs with.
      return (d, i) => {
        // Turn off MI rendering
        chord.classed('fade', true);

        // Turn on PMI rendering
        let linkAccum = [];
        Object.keys(mutualInformationData.vmap).forEach(iother => {
          var other = mutualInformationData.vmap[iother];
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

          const cAB = downsample(mutualInformationData.joint[va][vb], histogram1DnumberOfBins, swap);
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

        const linkData = d3
          .select('g.pmiChords')
          .selectAll('path.pmiChord')
          .data(linkAccum);

        linkData.enter().append('path')
          .classed('pmiChord', true)
          .classed(style.pmiChord, true);
        linkData.exit().remove();

        svg.select('g.pmiChords')
          .selectAll('path.pmiChord')
          .classed('fade', false)
          .attr('d', (data, index) => {
            var vaGrp = layout.groups()[mutualInformationData.lkup[data[3][0]]];
            var vbGrp = layout.groups()[mutualInformationData.lkup[data[3][1]]];
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
          .attr('data-details', data => {
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
          });
      };
    }
  };

  function handleHoverUpdate(data) {
    const svg = d3.select(model.container);
    Object.keys(data.state).forEach(pName => {
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
  model.subscriptions.push(model.provider.onFieldChange(fetchData));
  model.subscriptions.push(model.provider.onMutualInformationReady(publicAPI.render));

  if (model.provider.isA('HistogramBinHoverProvider')) {
    model.subscriptions.push(model.provider.onHoverBinChange(handleHoverUpdate));
  }

  if (model.provider.isA('SelectionProvider')) {
    model.subscriptions.push(model.provider.onAnnotationChange(annotation => {
      if (lastAnnotationPushed && annotation.selection.type === 'range' && annotation.generation === lastAnnotationPushed.generation + 1) {
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
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'VizComponent');
  CompositeClosureHelper.get(publicAPI, model, ['provider', 'container']);

  informationDiagram(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
