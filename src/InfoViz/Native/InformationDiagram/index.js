import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';
import d3 from 'd3';
import htmlContent from './body.html';
import iconImage from './InfoDiagramIconSmall.png';
import multiClicker from '../../Core/D3MultiClick';
import style from 'PVWStyle/InfoVizNative/InformationDiagram.mcss';

const PMI_CHORD_MODE_NONE = 0;
const PMI_CHORD_MODE_ONE_BIN_ALL_VARS = 1;
const PMI_CHORD_MODE_ALL_BINS_TWO_VARS = 2;

// ----------------------------------------------------------------------------
// Information Diagram
// ----------------------------------------------------------------------------

function informationDiagram(publicAPI, model) {
  // init data containers if undefined/null
  ['histogramData', 'mutualInformationData'].forEach(field => {
    if (!model[field]) {
      model[field] = {};
    }
  });

  // Make sure default values get applied
  publicAPI.setContainer(model.container);

  model.subscriptions.push({ unsubscribe: publicAPI.setContainer });
  model.subscriptions.push(model.provider.onFieldsChange(publicAPI.render));
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  container: null,
  provider: null,
  mutualInformationData: null,
  histogramData: null,
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

// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------

class InformationDiagram {
    constructor(el, dataProvider, legendService = null, annotationService = null) {
        this.dataProvider = dataProvider;
        this.legendService = legendService;
        this.annotationService = annotationService;
        this.selnGen = -1;
        this.componentId = 'InformationDiagram';
        this.subscriptions = [];
        this.variableList = [];
        this.histData = {};
        this.mutualInfoData = {};
        this.nbins = 32;  // Hardcode the number of histogram bins for now
        this.setContainer(el);
        this.clientRect = null;
        this.statusBarVisible = false;
        this.statusBarRightHide = 0;
    }

    fetchDiagramDataForVariables() {
        // Refresh histogram and mutual information
        this.histData = {};
        this.mutualInfoData = {};

        this.dataProvider.fetchHistograms1d(this.variableList, hist => {
            this.dataProvider.fetchMutualInformation(this.variableList, mutualInfo => {
                this.histData = hist;
                this.mutualInfoData = mutualInfo;

                this.resize();
            });
        }, this.nbins);
    }

    fetchVariables() {
        this.variableList = [];
        this.dataProvider.getParameterList(plist => {
            this.variableList = plist.filter(p => p.selected).map(p => p.name);
            this.fetchDiagramDataForVariables();
        });
    }

    addSubscriptions() {
      this.subscriptions.push(this.dataProvider.onParameterValueChanged((data, envelope) => {
        const aidx = this.variableList.indexOf(data.value.name);
        if (aidx >= 0 && !data.value.selected) {
          this.variableList = this.variableList.slice(0,aidx).concat(this.variableList.slice(aidx+1,this.variableList.length));
        } else if (aidx === -1 && data.value.selected) {
          this.variableList = this.variableList.concat([data.value.name,]);
        }

        this.fetchDiagramDataForVariables();
      }));
      this.subscriptions.push(this.dataProvider.onParameterSetChanged((data, envelope) => {
        // Re-run the render method which will re-fetch all data from the provider:
        this.fetchVariables();
      }));
      if (this.annotationService) {
        this.subscriptions.push(this.annotationService.onCurrentHoverChanged((data, envelope) => {
          const svg = d3.select(this.container);
          Object.keys(data.state).forEach(pName => {
            const binList = data.state[pName];
            svg.selectAll(`g.group[param-name='${pName}'] > path.htile`).
              classed('hilite', function(d, i) {
                return binList.indexOf(-1) === -1 && binList.indexOf(i) >= 0;
              });
          });
        }));
      }
    }

    clearSubscriptions() {
        while (this.subscriptions.length > 0) {
            this.subscriptions.shift().unsubscribe();
        }
    }

    destroy() {
        this.setContainer(null);
        // which calls this.clearSubscriptions();
    }

    updateStatusBarText(msg) {
      d3.select(this.container).select('span.status-bar-text').text(msg);
    }

    updateStatusBarVisibility() {
      const cntnr = d3.select(this.container);
      if (this.statusBarVisible) {
        cntnr.select('div.status-bar-container').style('right', '9px');
        cntnr.select('.show-button').classed('hidden', true);
        cntnr.select('.hide-button').classed('hidden', false);
      } else {
        cntnr.select('div.status-bar-container').style('right', this.statusBarRightHide);
        cntnr.select('.show-button').classed('hidden', false);
        cntnr.select('.hide-button').classed('hidden', true);
      }
    }

    resize() {
        if (!this.container) {
            return; // no shirt, no shoes, no service.
        }

        this.clientRect = this.container.getBoundingClientRect();
        d3.select(this.container).select('div.status-bar-container').
          style('width', `${this.clientRect.width - 20}px`);
        this.statusBarRightHide = `${-(this.clientRect.width - 38)}px`;
        if (this.statusBarVisible === false) {
          d3.select(this.container).select('div.status-bar-container').style('right', this.statusBarRightHide);
        }
        this.render(this.clientRect.width, this.clientRect.height);
    }

    setContainer(el) {
        if (this.container) {
            while (this.container.firstChild) {
                this.container.removeChild(this.container.firstChild);
            }
        }

        this.container = el;

        if (this.container) {
            const svgdoc = d3.select(this.container);
            this.addSubscriptions();
            this.fetchVariables();

            // Create placeholder
            this.container.innerHTML = htmlContent;
            svgdoc.select('div.info-diagram-placeholder').select('img').
              attr('src', iconImage);

            // Attach listener for show/hide status bar
            svgdoc.selectAll('.panel-visibility').on('click', () => {
              this.statusBarVisible = !this.statusBarVisible;
              this.updateStatusBarVisibility();
              d3.event.preventDefault();
              d3.event.stopPropagation();
            });

            this.updateStatusBarVisibility();
        } else {
            this.clearSubscriptions();
        }
    }

    // Clears out the svg group but maintains internal variables, subsciptions, etc.
    clear() {
      let old = d3.select(this.container).select('svg');
      if (!old.empty()) {
        old.remove();
      }
    }

    /// Method to build visualization; called by this.resize()
    render(width, height) {
        var self = this; // used by child functions invoked by d3 with "this" redefined.
        if (this.variableList.length < 2 || this.container === null) {
          // Select the main circle and hide it and unhide placeholder
          d3.select(this.container).select('svg.information-diagram').classed('hidden', true);
          d3.select(this.container).select('div.info-diagram-placeholder').
            classed('hidden', false);

          return;
        }

        // Guard against rendering if container is non-null but has no size (as
        // in the case when workbench layout doesn't include our container)
        if (width === 0 || height === 0) {
          return;
        }

        d3.select(this.container).select('div.info-diagram-placeholder').classed('hidden', true);

        const pmiChordMode = {
          mode: PMI_CHORD_MODE_NONE,
          srcParam: null,
          srcBin: null,
        };

        const glyphSize = 15; // Create an assessor from legend service for this?

        const outerHistoRadius = Math.min(width, height) / 2,
            veryOutermostRadius = outerHistoRadius + 80,
            histoRadius = outerHistoRadius - 20,
            outerRadius = histoRadius - 50,
            innerRadius = outerRadius - 24,
            deltaRadius = outerRadius - innerRadius;

        const formatPercent = d3.format('.1%'),
            formatMI = d3.format('.2f'),
            formatVal = d3.format('.2s');

        const arc = d3.svg.arc().
            innerRadius(innerRadius).
            outerRadius(outerRadius);

        const histoArc = d3.svg.arc().innerRadius(outerRadius + 10);

        const layout = d3.layout.chord().
                padding(.04).
                sortSubgroups(d3.descending).
                sortChords(d3.ascending);

        let hdata = null,
            idata = null;

        let path = d3.svg.chord().radius(innerRadius);

        let old = d3.select(this.container).select('svg');
        if (!old.empty()) {
          old.remove();
        }
        let svg = d3.select(this.container).append('svg').
            attr('width', width).
            attr('height', height).
            style('float', 'left').
            classed('information-diagram', true).
            classed('no-interact', true).
          append('g').
            classed('main-circle', true).
            attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

        function findGroupAndBin(relCoords) {
          const result = {
            found: false,
            group: null,
            bin: -1,
            radius: 0,
          };
          const [angle, radius] = calculate_angle_and_radius(relCoords, [width, height]);
          result.radius = radius;
          for (let groupIdx = 0; groupIdx < layout.groups().length; ++groupIdx) {
            const groupData = layout.groups()[groupIdx];
            const groupName = self.mutualInfoData.vmap[groupData.index].name;
            if (angle > groupData.startAngle && angle <= groupData.endAngle) {
              const binSizeRadians = (groupData.endAngle - groupData.startAngle) / self.nbins;
              const binIndex = Math.floor((angle - groupData.startAngle) / binSizeRadians);
              result.found = true;
              result.group = groupName;
              result.bin = binIndex;
              break;
            }
          }
          return result;
        }

        d3.select(this.container).select('svg').
          on('mousemove', function inner(d, i) {
            const overCoords = d3.mouse(self.container);
            const info = findGroupAndBin(overCoords);
            let clearStatusBar = false;

            for (let idx = 0; idx < self.variableList.length; ++idx) {
              unHoverBin(self.variableList[idx]);
            }

            if (info.radius > veryOutermostRadius) {
              d3.select(this).classed('no-interact', true);
              clearStatusBar = true;
            } else {
              d3.select(this).classed('no-interact', false);
              if (info.found) {
                let binMap = {};
                const oneBinAllVarsMode = info.radius <= innerRadius && pmiChordMode.mode === PMI_CHORD_MODE_ONE_BIN_ALL_VARS;
                const pmiBinMap = findPmiChordsToHighlight(info.group, info.bin, true, oneBinAllVarsMode);
                if (info.radius <= innerRadius) {
                  binMap = pmiBinMap;
                } else {
                  d3.select(`g.group[param-name='${info.group}'`).selectAll('path.htile').
                    each(function inner(d, i) {
                      if (i === info.bin) {
                        self.updateStatusBarText(d3.select(this).attr('data-details'));
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
              self.updateStatusBarText('');
            }
          }).
          on('mouseout', (d, i) => {
            for (let idx = 0; idx < self.variableList.length; ++idx) {
              unHoverBin(self.variableList[idx]);
            }
          }).
          on('click', multiClicker([
            function(d, i) { // single click handler
              const overCoords = d3.mouse(self.container);
              const info = findGroupAndBin(overCoords);
              if (info.radius > veryOutermostRadius) {
                pmiChordMode.mode = PMI_CHORD_MODE_NONE;
                pmiChordMode.srcParam = null;
                pmiChordMode.srcBin = null;
                updateChordVisibility({ mi: { show: true }});
              } else if (info.radius > outerRadius ||
                  (info.radius <= innerRadius &&
                  pmiChordMode.mode === PMI_CHORD_MODE_ONE_BIN_ALL_VARS &&
                  info.group === pmiChordMode.srcParam)) {
                if (info.found) {
                  drawPMIOneBinAllVars(info.group, info.bin)(d, i);
                }
              }
            },
            function(d, i) { // double click handler
              const overCoords = d3.mouse(self.container);
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

        svg.append('circle').
            attr('r', outerRadius);

        svg.append('g').classed('mutualInfoChords', true);
        svg.append('g').classed('pmiChords', true);

        // Compute the chord layout.
        layout.matrix(this.mutualInfoData.matrix);

        // Add a group per neighborhood.
        let group = svg.selectAll('.group').
            data(layout.groups).
          enter().append('g').
            classed('group', true);

        // Add glyph container
        // group.

        // Get lookups for pmi chords
        hdata = this.histData;
        idata = this.mutualInfoData;
        this.mutualInfoData.lkup = {};
        for (const i in this.mutualInfoData.vmap) {
          this.mutualInfoData.lkup[this.mutualInfoData.vmap[i].name] = i;
        }

        // Only used when there is no legend service
        let cmap = d3.scale.category20();

        // Add the group arc.
        var groupPath = group.append('path').
            attr('id', function(d, i) { return 'group' + i; }).
            attr('d', arc);

        // Add a text label.
        var groupText = group.append('text').
            attr('x', 6).
            attr('dy', 15);

        groupText.append('textPath').
            attr('xlink:href', function(d, i) { return '#group' + i; }).
            attr('startOffset', '25%').
            text(function(d, i) {
              return self.mutualInfoData.vmap[i].name;
            });

        // Remove the labels that don't fit. :(
        groupText.filter(function(d, i) { return groupPath[0][i].getTotalLength() / 2 - deltaRadius < (this.getComputedTextLength() + glyphSize); }).
            remove();

        // Add group for glyph
        if (self.legendService) {
          group.each(function() {
          self.legendService.createGlyph(d3.select(this));
          });
          let groupGlyph = group.selectAll('g.glyph');

          groupGlyph.each(function(glyphData) {
            // Add the glyph to the group
            let textLength = groupText[0][glyphData.index].firstChild.getComputedTextLength();
            let pathLength = groupPath[0][glyphData.index].getTotalLength();
            let avgRadius = (innerRadius + outerRadius) / 2;
            // Start at edge of arc, move to text anchor, back up half of text length and glyph size
            let glyphAngle = glyphData.startAngle + (pathLength / 4 / outerRadius) - (textLength + glyphSize) / 2 / avgRadius;

            let currGlyph = d3.select(this);
            currGlyph.
              attr('transform', 'translate(' +
                avgRadius*Math.sin(glyphAngle) + ',' +
                (-avgRadius*Math.cos(glyphAngle)) + ')');
            let color = self.legendService.updateGlyph(self.mutualInfoData.vmap[glyphData.index].name, currGlyph);
            self.mutualInfoData.vmap[glyphData.index].color = color;
          });

          // Remove the glyphs that don't fit
          groupGlyph.filter(function(d, i) { return groupPath[0][i].getTotalLength() / 2 - deltaRadius <  glyphSize; }).
            remove();
        }

        function getParamBinRange(index, numberOfBins, paramName) {
          let paramRange = self.dataProvider.getParameterRange(paramName)[0];
          return getBinRange(index, numberOfBins,
            [paramRange[0], paramRange[1], paramRange[1] - paramRange[0]]);
        }

        function getBinRange(index, numberOfBins, paramRange) {
          return [
            index / numberOfBins * paramRange[2] + paramRange[0],
            (index + 1) / numberOfBins * paramRange[2] + paramRange[0]
          ];
        }

        // Zip histogram info into layout.groups() (which we initially have no control over as it is
        // generated for us).
        svg.selectAll('g.group').each(function(groupData) {
          var gname = self.mutualInfoData.vmap[groupData.index].name;
          var gvar = self.histData[gname];

          // Set the color if it hasn't already been set
          if (!self.legendService) {
            self.mutualInfoData.vmap[groupData.index].color = cmap(groupData.index);
          }

          // Add the color to the group arc
          d3.select(this).select('path').
            style('fill', self.mutualInfoData.vmap[groupData.index].color);

          groupData.range = [gvar.min, gvar.max, gvar.max - gvar.min];
          var delta = (groupData.endAngle - groupData.startAngle) / gvar.counts.length;
          var total = Number(gvar.counts.reduce(function(a,b) { return a+b; }));
          var maxcnt = Number(gvar.counts.reduce(function(a,b) { return a > b ? a : b; }));
          groupData.histo = gvar.counts.map( function(d, i) {
            return {
              'startAngle':(i * delta + groupData.startAngle),
              'endAngle':((i+1) * delta + groupData.startAngle),
              'innerRadius': (outerRadius + 10),
              'outerRadius': (outerRadius + 10 + d/maxcnt * (histoRadius - outerRadius)),
              'index':i,
              'value':(d/total)
            };
          });

          d3.select(this).attr('param-name', gname).
            selectAll('path.htile').data(groupData.histo).enter().append('path').classed('htile', true).
            attr('d', function(d, i) { return histoArc.outerRadius(d.outerRadius)(d); }).
            attr('data-details', function(d, i) {
              const binRange = getBinRange(i, self.nbins, groupData.range);
              return 'p(' + gname +
              ' ∈ [' + formatVal(binRange[0]) +
              ', ' + formatVal(binRange[1]) +
              ']) = ' + formatPercent(d.value);
            }).
            attr('fill', function(d, i) { return i % 2 ? '#bebebe' : '#a9a9a9'; });
        });

        // Add the chords. Color only chords that show self-mutual-information.
        var chord = svg.select('g.mutualInfoChords').selectAll('.chord').
            data(layout.chords).
          enter().append('path').
            classed('chord', true).
            classed('selfchord', function(d) { return d.source.index === d.target.index; }).
            attr('d', path).
            on('click', drawPMIAllBinsTwoVars).
            on('mouseover', function inner(d, i) {
              self.updateStatusBarText(d3.select(this).attr('data-details'));
            }).
            on('mouseout', function inner(d, i) {
              self.updateStatusBarText('');
            });

        svg.select('g.mutualInfoChords').selectAll('.selfchord').
          style('fill', function(d) { return self.mutualInfoData.vmap[d.source.index].color; });

        chord.attr('data-details', function inner(d, i) {
          return 'Mutual information: ' +
              self.mutualInfoData.vmap[d.source.index].name +' ↔︎ ' +
              self.mutualInfoData.vmap[d.target.index].name + ' ' +
              formatMI(
                  self.mutualInfoData.matrix[d.source.index][d.target.index] );
                  // The lines below are for the case when the MI matrix has been row-normalized:
                  //self.mutualInfoData.matrix[d.source.index][d.target.index] *
                  //self.mutualInfoData.vmap[d.source.index].autoInfo/self.mutualInfoData.matrix[d.source.index][d.source.index]);
        });

        svg.selectAll('g.group path[id^=\'group\']').on('click', function(d, i) {
          pmiChordMode.mode = PMI_CHORD_MODE_NONE;
          pmiChordMode.srcParam = null;
          pmiChordMode.srcBin = null;
          updateChordVisibility({ mi: { show: true, index: i }});
        });

        function updateChordVisibility(options) {
          if (options.mi && options.mi.show === true) {
            if (options.mi.index !== undefined) {
              chord.classed('fade', function(p) {
                return p.source.index != options.mi.index
                    && p.target.index != options.mi.index;
              });
            } else {
              chord.classed('fade', false);
            }
            svg.selectAll('g.pmiChords path.pmiChord').classed('fade', true);
          } else if (options.pmi && options.pmi.show === true) {
            // Currently drawing pmi chords fades all mi chords, so we
            // don't have to do anything here to keep things consistent.
          }
        }

        function findPmiChordsToHighlight(param, bin, highlight=true, oneBinAllVarsMode=false) {
          if (highlight) {
            d3.select('g.pmiChords').selectAll('path.pmiChord').classed('highlight-pmi', false);
          }

          const binMap = {}

          function addBin(pName, bIdx) {
            if (!binMap.hasOwnProperty(pName)) {
              binMap[pName] = [];
            }
            if (binMap[pName].indexOf(bIdx) === -1) {
              binMap[pName].push(bIdx);
            }
          }

          if (oneBinAllVarsMode) {
            d3.select('g.pmiChords').selectAll(`path[data-source-name="${param}"]:not(.fade)`).
              classed('highlight-pmi', highlight).
              each(function inner(d, i) {
                const elt = d3.select(this);
                addBin(param, bin);
                addBin(elt.attr('data-target-name'), parseInt(elt.attr('data-target-bin')));
              });

            d3.select('g.pmiChords').selectAll(`path[data-target-name="${param}"]:not(.fade)`).
              each(function inner(d, i) {
                const elt = d3.select(this);
                addBin(param, parseInt(elt.attr('data-target-bin')));
                addBin(elt.attr('data-source-name'), parseInt(elt.attr('data-source-bin')));
              });

            if (binMap[param].indexOf(bin) >= 0) {
              binMap[param] = [bin];
            }

            d3.select('g.pmiChords').selectAll(`path[data-target-name="${param}"]:not(.fade)`).
              classed('highlight-pmi', function inner(d, i) {
                const elt = d3.select(this);
                return binMap[param].indexOf(parseInt(elt.attr('data-target-bin'))) >= 0;
              });
          } else {
            d3.select('g.pmiChords').selectAll(`path[data-source-name="${param}"][data-source-bin="${bin}"]:not(.fade)`).
              classed('highlight-pmi', highlight).
              each(function inner(d, i) {
                const elt = d3.select(this);
                addBin(param, bin);
                addBin(elt.attr('data-target-name'), parseInt(elt.attr('data-target-bin')));
              });

            d3.select('g.pmiChords').selectAll(`path[data-target-name="${param}"][data-target-bin="${bin}"]:not(.fade)`).
              classed('highlight-pmi', highlight).
              each(function inner(d, i) {
                const elt = d3.select(this);
                addBin(param, bin);
                addBin(elt.attr('data-source-name'), parseInt(elt.attr('data-source-bin')));
              });
          }

          return binMap;
        }

        function hoverBins(binMap) {
          if (self.annotationService) {
                self.annotationService.setCurrentHover({
                    source: self.componentId,
                    state: binMap,
                });
            }
        }

        function hoverBin(param, bin) {
            if (self.annotationService) {
              const state = {};
              state[param] = [ bin ];
              self.annotationService.setCurrentHover({
                  source: self.componentId,
                  state,
              });
            }
        }

        function unHoverBin(param) {
            if (self.annotationService) {
              const state = {};
              state[param] = [ -1 ];
              self.annotationService.setCurrentHover({
                source: self.componentId,
                state,
              });
            }
        }

        function updateActiveSelection(binMap) {
          if (!self.annotationService) {
            return;
          }

          const ranges = {};
          let proceed = false;

          Object.keys(binMap).forEach(pName => {
            const paramRange = self.dataProvider.getParameterRange(pName)[0];
            const binList = binMap[pName];
            const rangeList = [];
            for (let i = 0; i < binList.length; ++i) {
              if (binList[i] !== -1) {
                rangeList.push(getBinRange(binList[i], self.nbins, [paramRange[0], paramRange[1], paramRange[1] - paramRange[0]]));
              }
            }
            if (rangeList.length > 0) {
              proceed = true;
              ranges[pName] = rangeList;
            }
          });

          if (proceed) {
            const rangeSel = selection().fromRanges(ranges);
            self.selnGen = rangeSel.gen;
            self.annotationService.setActiveSelection(rangeSel);
          }
        }

        function drawPMIOneBinAllVars(gname, binIndex) {
          var binVar = gname; // Hold on to the name of the variable whose bin we should draw.
          var binIdx = binIndex;

          pmiChordMode.mode = PMI_CHORD_MODE_ONE_BIN_ALL_VARS;
          pmiChordMode.srcParam = gname;
          pmiChordMode.srcBin = binIndex;

          // Return a function that, given a bin datum, renders the highest PMI (or probability)
          // links from that bin to any/all other bins in other variables it co-occurs with.
          return function(d, i) {
            // Turn off MI rendering
            chord.classed('fade', function(p) { return true; });
            // Turn on PMI rendering
            var va;
            var vb;
            var linkAccum = [];
            for (var iother in self.mutualInfoData.vmap) {
              var other = self.mutualInfoData.vmap[iother];
              va = binVar;
              vb = other.name;
              if (!vb || vb === va) continue; // Can't draw links to self...
              var swap = false;
              if (vb < va) {
                var tmp = vb;
                vb = va;
                va = tmp;
                swap = true;
              }

              var cAB = downsample(self.mutualInfoData.joint[va][vb], self.nbins, swap);
              var probDict = freqToProb(cAB);
              var linksToDraw = top_bin_pmi(probDict, true, binIdx, 0.8);
              linkAccum = linkAccum.concat(
                d3.zip(
                  linksToDraw.idx, linksToDraw.pmi, linksToDraw.pAB,
                  new Array(linksToDraw.idx.length).fill([binVar,other.name])
                )
              );
            }

            d3.selectAll('g.group path.chord').classed('fade', true); // Make mutual info chords invisible.
            var linkData = d3.select('g.pmiChords').selectAll('path.pmiChord').data(linkAccum);
            linkData.enter().append('path').classed('pmiChord', true);
            linkData.exit().remove();
            d3.select('g.pmiChords').selectAll('path.pmiChord').
              classed('fade', false).
              attr('d', function(d, i) {
                var vaGrp = layout.groups()[self.mutualInfoData.lkup[d[3][0]]];
                var vbGrp = layout.groups()[self.mutualInfoData.lkup[d[3][1]]];
                var vaRange = [vaGrp.startAngle, (vaGrp.endAngle - vaGrp.startAngle), (vaGrp.endAngle - vaGrp.startAngle) / self.nbins];
                var vbRange = [vbGrp.startAngle, (vbGrp.endAngle - vbGrp.startAngle), (vbGrp.endAngle - vbGrp.startAngle) / self.nbins];
                return path({
                  'source':{'startAngle':(vaRange[0] + d[0][0] * vaRange[2]), 'endAngle':(vaRange[0] + (d[0][0] + 1) * vaRange[2])},
                  'target':{'startAngle':(vbRange[0] + d[0][1] * vbRange[2]), 'endAngle':(vbRange[0] + (d[0][1] + 1) * vbRange[2])}
                });
              }).
              attr('data-source-name', (d, i) => d[3][0]).
              attr('data-source-bin', (d, i) => d[0][0]).
              attr('data-target-name', (d, i) => d[3][1]).
              attr('data-target-bin', (d, i) => d[0][1]).
              classed('highlight-pmi', false).
              classed('positive', (d, i) => d[1] >= 0.0).
              classed('negative', (d, i) => d[1] < 0.0).
              attr('data-details', (d, i) => {
                const sourceBinRange = getParamBinRange(d[0][0], self.nbins, d[3][0]);
                const targetBinRange = getParamBinRange(d[0][1], self.nbins, d[3][1]);
                return 'PMI: '
                  + d[3][0] + ' ∈ [' + formatVal(sourceBinRange[0]) + ', ' + formatVal(sourceBinRange[1]) +
                  '] ↔︎ '
                  + d[3][1] + ' ∈ [' + formatVal(targetBinRange[0]) + ', ' + formatVal(targetBinRange[1]) +
                  '] ' + formatMI(d[1]);
              }).
              on('mouseover', function inner(d, i) {
                self.updateStatusBarText(d3.select(this).attr('data-details'));
              }).
              on('mouseout', function inner(d, i) {
                self.updateStatusBarText('');
              });
          };
        }

        function drawPMIAllBinsTwoVars(d, i) {
          if (d.source.index === d.target.index) {
            console.log('Cannot render self-PMI ' + self.mutualInfoData.vmap[d.source.index].name);
            return;
          }

          pmiChordMode.mode = PMI_CHORD_MODE_ALL_BINS_TWO_VARS;
          pmiChordMode.srcParam = null;
          pmiChordMode.srcBin = null;

          // Turn off MI rendering
          chord.classed('fade', function(p) { return true; });
          // Turn on PMI rendering
          var va = self.mutualInfoData.vmap[d.source.index].name;
          var vb = self.mutualInfoData.vmap[d.target.index].name;
          var swap = false;
          if (vb < va) {
            var tmp = vb;
            vb = va;
            va = tmp;
            swap = true;
          }

          var cAB = downsample(self.mutualInfoData.joint[va][vb], self.nbins, swap);
          var probDict = freqToProb(cAB);
          var linksToDraw = top_pmi(probDict, 0.95);
          d3.selectAll('g.group path.chord').classed('fade', true); // Make mutual info chords invisible.
          var linkData = d3.select('g.pmiChords').selectAll('path.pmiChord').
            data(d3.zip(linksToDraw.idx, linksToDraw.pmi,
              new Array(linksToDraw.idx.length).fill([va,vb])));
          linkData.enter().append('path').classed('pmiChord', true);
          linkData.exit().remove();
          var vaGroup = layout.groups()[d.source.index];
          var vbGroup = layout.groups()[d.target.index];
          var vaRange = [vaGroup.startAngle, (vaGroup.endAngle - vaGroup.startAngle), (vaGroup.endAngle - vaGroup.startAngle) / self.nbins];
          var vbRange = [vbGroup.startAngle, (vbGroup.endAngle - vbGroup.startAngle), (vbGroup.endAngle - vbGroup.startAngle) / self.nbins];
          d3.select('g.pmiChords').selectAll('path.pmiChord').
            classed('fade', false).
            attr('d', function(d, i) {
            return path({
              'source':{'startAngle':(vaRange[0] + d[0][0] * vaRange[2]), 'endAngle':(vaRange[0] + (d[0][0] + 1) * vaRange[2])},
              'target':{'startAngle':(vbRange[0] + d[0][1] * vbRange[2]), 'endAngle':(vbRange[0] + (d[0][1] + 1) * vbRange[2])}
              });
            }).
            attr('data-source-name', swap ? vb : va).
            attr('data-source-bin', function(d, i) {
              return `${d[0][0]}`;
            }).
            attr('data-target-name', swap ? va : vb).
            attr('data-target-bin', function(d, i) {
              return `${d[0][1]}`;
            }).
            classed('highlight-pmi', false).
            classed('positive', (d, i) => d[1] >= 0.0).
            classed('negative', (d, i) => d[1] < 0.0).
            attr('data-details', (d, i) => {
              var sIdx = swap ? 1 : 0;
              var tIdx = swap ? 0 : 1;
              const sourceBinRange = getParamBinRange(d[0][sIdx], self.nbins, d[2][0]);
              const targetBinRange = getParamBinRange(d[0][tIdx], self.nbins, d[2][1]);
              return 'PMI: '
                + d[2][0] + ' ∈ [' + formatVal(sourceBinRange[0]) + ', ' + formatVal(sourceBinRange[1]) +
                '] ↔︎ '
                + d[2][1] + ' ∈ [' + formatVal(targetBinRange[0]) + ', ' + formatVal(targetBinRange[1]) +
                '] ' + formatMI(d[1]);
            }).
            on('mouseover', function inner(d, i) {
              self.updateStatusBarText(d3.select(this).attr('data-details'));
            }).
            on('mouseout', function inner(d, i) {
              self.updateStatusBarText('');
            });
        }
    }
}
