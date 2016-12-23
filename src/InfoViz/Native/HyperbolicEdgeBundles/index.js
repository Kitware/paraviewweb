import d3 from 'd3';

import style from 'PVWStyle/InfoVizNative/HyperbolicEdgeBundles.mcss';
import htmlContent from './body.html';
import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';
import {
  // vectorMag,
  vectorDiff,
  vectorMAdd,
  // vectorDot,
  vectorScale,
  // pointsApproxCollinear,
  // lineLineIntersectFragile,
  // lineCircleIntersectFragile,
  hyperbolicPlanePointsToPoincareDisk,
  hyperbolicPlaneGeodesicOnPoincareDisk,
  // hyperbolicPlaneGeodesicsOnPoincareDisk,
  // interpolateOnPoincareDisk,
} from '../../../Common/Misc/HyperbolicGeometry';


function hyperbolicEdgeBundle(publicAPI, model) {
  publicAPI.resize = () => {
    if (!model.container) {
      return;
    }

    const rect = model.container.getBoundingClientRect();
    const smaller = rect.width < rect.height ? rect.width : rect.height;
    const tx = rect.width / smaller;
    const ty = rect.height / smaller;
    d3.select(model.container).select('svg')
      .attr('width', rect.width)
      .attr('height', rect.height);
    if (smaller > 0.0) {
      model.transformGroup.attr('transform',
        `scale(${smaller / 2.0}, ${smaller / 2.0}) translate(${tx}, ${ty})`);
    }
    // TODO: Now transition the point size and arc width to maintain
    //       the diagram's sense of proportion.
  };

  publicAPI.setContainer = (el) => {
    if (model.container) {
      while (model.container.firstChild) {
        model.container.removeChild(model.container.firstChild);
        delete model.unselectedBundleGroup;
        delete model.treeEdgeGroup;
        delete model.selectedBundleGroup;
        delete model.nodeGroup;
        delete model.transformGroup;
        // TODO: When el is null/undefined and API is provider, unsubscribe.
      }
    }

    model.container = el;

    if (model.container) {
      // Create placeholder
      model.container.innerHTML = htmlContent;

      // Apply style and create SVG for rendering
      const viewdiv = d3.select(model.container).select('.hyperbolic-geom-viewport');
      viewdiv.classed(style.hyperbolicGeomContainer, true);
      const svg = viewdiv.append('svg').classed('hyperbolic-geom-svg', true);
      model.transformGroup = svg.append('g').classed('disk-transform', true);
      model.transformGroup.append('circle')
        .classed('disk-boundary', true)
        .classed(style.hyperbolicDiskBoundary, true)
        .attr('r', 1);
      model.unselectedBundleGroup = model.transformGroup.append('g').classed('unselected-bundles', true);
      model.treeEdgeGroup = model.transformGroup.append('g').classed('tree-edges', true);
      model.selectedBundleGroup = model.transformGroup.append('g').classed('selected-bundles', true);
      model.nodeGroup = model.transformGroup.append('g').classed('nodes', true);

      publicAPI.resize(); // Apply a transform to the transformGroup based on the size of the SVG.

      // Instead of getting data from a provider:
      //   if (model.provider.isA('MutualInformationSummaryProvider')) ...
      // Hardcode it into the model for now:
      model.nodes = [
        [253.15452023990338, 168.20016610150236],
        [270.54451200408226, 292.77934091175390],
        [277.18402873004840, 232.16835229042620],
        [278.53741891587500, 193.50474848244320],
        [305.58830280627257, 278.53238498678960],
        [309.41841065363536, 226.10316106037124],
        [312.72348495611050, 387.88299104668560],
        [317.38810462926050, 194.53583132489254],
        [326.54360452297306, 322.94680128722155],
        [334.18762488572924, 358.13452292263090],
        [341.96783106088634, 264.72268514753340],
        [353.90429994195296, 319.41352650362420],
        [364.24649860818110, 225.86363986467606],
        [380.61471694769847, 264.58933353902040],
        [380.88020608315810, 312.03672828584430],
        [384.90567631119114, 354.81036757015187],
        [389.54050702058120, 193.26583277340492],
        [392.16231669382640, 390.86222345739990],
        [412.21111372773570, 166.32929457453255],
        [417.48583350629195, 260.61963708034210],
        [420.81098775460663, 362.44843078875480],
      ];
      model.treeEdges = [
        { idx:  0, i0:  9, i1:  6 },
        { idx:  1, i0:  9, i1: 11 },
        { idx:  2, i0:  0, i1:  3 },
        { idx:  3, i0: 13, i1: 19 },
        { idx:  4, i0: 13, i1: 10 },
        { idx:  5, i0:  8, i1: 11 },
        { idx:  6, i0: 12, i1: 10 },
        { idx:  7, i0: 12, i1: 16 },
        { idx:  8, i0: 20, i1: 15 },
        { idx:  9, i0:  7, i1:  5 },
        { idx: 10, i0:  5, i1: 10 },
        { idx: 11, i0:  5, i1:  3 },
        { idx: 12, i0:  5, i1:  2 },
        { idx: 13, i0: 10, i1: 11 },
        { idx: 14, i0: 10, i1:  4 },
        { idx: 15, i0: 16, i1: 18 },
        { idx: 16, i0: 11, i1: 15 },
        { idx: 17, i0: 11, i1: 14 },
        { idx: 18, i0:  4, i1:  1 },
        { idx: 19, i0: 15, i1: 17 },
      ];
      // Finish initializing treeEdges and compute bounds/scale:
      model.treeEdges.forEach(dd => {
        dd.p0 = model.nodes[dd.i0];
        dd.p1 = model.nodes[dd.i1];
        dd.previous = {
          p0: [dd.p0[0], dd.p0[1]],
          p1: [dd.p0[0], dd.p0[1]],
        };
      });
      model.hyperbolicBounds =
        model.nodes.reduce((result, value) => [
          [Math.min(result[0][0], value[0]), Math.min(result[0][1], value[1])],
          [Math.max(result[1][0], value[0]), Math.max(result[1][1], value[1])]],
          [Object.assign([], model.nodes[0]), Object.assign([], model.nodes[0])]);
      model.focus = vectorScale(0.5, vectorMAdd(model.hyperbolicBounds[0], model.hyperbolicBounds[1], 1.0));
      model.diskScale = vectorDiff(model.hyperbolicBounds[0], model.hyperbolicBounds[1]).reduce(
        (a, b) => ((a > b) ? a : b)) / 2.0;
      model.transitionTime = 500;
      publicAPI.modelUpdated();
    }
  };

  publicAPI.coordsChanged = (deltaT) => {
    model.nodeGroup.selectAll('.node').data(model.diskCoords, dd => dd.idx);
    model.nodeGroup.selectAll('.node').transition().duration(deltaT)
      .attr('cx', d => d.x[0])
      .attr('cy', d => d.x[1]);
    if (deltaT > 0) {
      const interpFocus = ('prevFocus' in model ?
        d3.interpolate(model.prevFocus, model.focus) :
        () => model.focus);
      const updateArcs = dd => {
        if ('previous' in dd) {
          const interpP0 = d3.interpolate(dd.previous.p0, dd.p0);
          const interpP1 = d3.interpolate(dd.previous.p1, dd.p1);
          return t => hyperbolicPlaneGeodesicOnPoincareDisk(
            interpP0(t), interpP1(t), interpFocus(t), model.diskScale);
        } else {
          return t => hyperbolicPlaneGeodesicOnPoincareDisk(
            dd.p0, dd.p1, interpFocus(t), model.diskScale);
        }
      };
      model.treeEdgeGroup.selectAll('.link').data(model.treeEdges, ee => ee.idx);
      model.treeEdgeGroup.selectAll('.link').transition().duration(deltaT)
        .attrTween('d', updateArcs);
    } else {
      model.treeEdgeGroup.selectAll('.link').data(model.treeEdges, ee => ee.idx);
      model.treeEdgeGroup.selectAll('.link')
        .attr('d', pp => hyperbolicPlaneGeodesicOnPoincareDisk(
          pp.p0, pp.p1, model.focus, model.diskScale));
    }
  };

  publicAPI.focusChanged = () => {
    model.diskCoords = hyperbolicPlanePointsToPoincareDisk(
      model.nodes, model.focus, model.diskScale);
    publicAPI.coordsChanged(model.transitionTime);
  };

  publicAPI.modelUpdated = () => {
    // Remember old coordinates in "previous" before computing new ones:
    model.treeEdges = model.treeEdges.map((dd) => ({
      idx: dd.idx,
      p0: dd.p0,
      p1: dd.p1,
      previous: {
        p0: [dd.p0[0], dd.p0[1]],
        p1: [dd.p1[0], dd.p1[1]]
      },
    }));
    model.diskCoords = hyperbolicPlanePointsToPoincareDisk(
      model.nodes, model.focus, model.diskScale);
    const ngdata = model.nodeGroup.selectAll('.node').data(model.diskCoords);
    ngdata.enter().append('circle')
      .classed('node', true)
      .classed(style.hyperbolicNode, true)
      .attr('r', '0.03px')
      .on('click', (d, i) => { model.prevFocus = model.focus; model.focus = model.nodes[i]; publicAPI.focusChanged(); });
    ngdata.exit().remove();
    const tgdata = model.treeEdgeGroup.selectAll('.link').data(model.treeEdges, dd => dd.idx);
    tgdata.enter().append('path')
      .classed('link', true)
      .classed(style.hyperbolicTreeEdge, true);
    tgdata.exit().remove();
    publicAPI.coordsChanged(model.transitionTime);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  container: null,
  color: 'inherit',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'VizComponent');
  CompositeClosureHelper.get(publicAPI, model, ['color', 'container']);

  hyperbolicEdgeBundle(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
