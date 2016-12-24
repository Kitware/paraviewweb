import d3 from 'd3';
import { force, forceSimulation, forceManyBody, forceLink, forceX, forceY } from 'd3-force';

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
  // Return an array containing a point's coordinates:
  const coordsOf = (nn => [nn.x, nn.y]);

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
        { x: 253.15452023990338, y: 168.20016610150236, id:  0 },
        { x: 270.54451200408226, y: 292.77934091175390, id:  1 },
        { x: 277.18402873004840, y: 232.16835229042620, id:  2 },
        { x: 278.53741891587500, y: 193.50474848244320, id:  3 },
        { x: 305.58830280627257, y: 278.53238498678960, id:  4 },
        { x: 309.41841065363536, y: 226.10316106037124, id:  5 },
        { x: 312.72348495611050, y: 387.88299104668560, id:  6 },
        { x: 317.38810462926050, y: 194.53583132489254, id:  7 },
        { x: 326.54360452297306, y: 322.94680128722155, id:  8 },
        { x: 334.18762488572924, y: 358.13452292263090, id:  9 },
        { x: 341.96783106088634, y: 264.72268514753340, id: 10 },
        { x: 353.90429994195296, y: 319.41352650362420, id: 11 },
        { x: 364.24649860818110, y: 225.86363986467606, id: 12 },
        { x: 380.61471694769847, y: 264.58933353902040, id: 13 },
        { x: 380.88020608315810, y: 312.03672828584430, id: 14 },
        { x: 384.90567631119114, y: 354.81036757015187, id: 15 },
        { x: 389.54050702058120, y: 193.26583277340492, id: 16 },
        { x: 392.16231669382640, y: 390.86222345739990, id: 17 },
        { x: 412.21111372773570, y: 166.32929457453255, id: 18 },
        { x: 417.48583350629195, y: 260.61963708034210, id: 19 },
        { x: 420.81098775460663, y: 362.44843078875480, id: 20 },
      ];
      model.treeEdges = [
        { idx:  0, source:  9, target:  6 },
        { idx:  1, source:  9, target: 11 },
        { idx:  2, source:  0, target:  3 },
        { idx:  3, source: 13, target: 19 },
        { idx:  4, source: 13, target: 10 },
        { idx:  5, source:  8, target: 11 },
        { idx:  6, source: 12, target: 10 },
        { idx:  7, source: 12, target: 16 },
        { idx:  8, source: 20, target: 15 },
        { idx:  9, source:  7, target:  5 },
        { idx: 10, source:  5, target: 10 },
        { idx: 11, source:  5, target:  3 },
        { idx: 12, source:  5, target:  2 },
        { idx: 13, source: 10, target: 11 },
        { idx: 14, source: 10, target:  4 },
        { idx: 15, source: 16, target: 18 },
        { idx: 16, source: 11, target: 15 },
        { idx: 17, source: 11, target: 14 },
        { idx: 18, source:  4, target:  1 },
        { idx: 19, source: 15, target: 17 },
      ];
      // Finish initializing treeEdges:
      model.treeEdges.forEach(dd => {
        dd.p0 = model.nodes[dd.source],
        dd.p1 = model.nodes[dd.target],
        dd.previous = {
          p0: Object.assign({}, dd.p0),
          p1: Object.assign({}, dd.p1),
        };
      });
      model.sim = forceSimulation(model.nodes)
        .force('charge', forceManyBody())
        .force('link', forceLink(model.treeEdges).distance(20).strength(1))
        .force('x', forceX())
        .force('y', forceY());
      model.sim.tick();
      model.sim.tick();
      model.sim.tick();
      model.sim.tick();
      model.sim.on('tick', () => publicAPI.coordsChanged(0));

      // Compute bounds and scaling
      model.hyperbolicBounds =
        model.nodes.reduce((result, value) => [
          [Math.min(result[0][0], value.x), Math.min(result[0][1], value.y)],
          [Math.max(result[1][0], value.x), Math.max(result[1][1], value.y)]],
          [[model.nodes[0].x, model.nodes[0].y], [model.nodes[0].x, model.nodes[0].y]]);
      model.focus = vectorScale(0.5, vectorMAdd(model.hyperbolicBounds[0], model.hyperbolicBounds[1], 1.0));
      model.diskScale = vectorDiff(model.hyperbolicBounds[0], model.hyperbolicBounds[1]).reduce(
        (a, b) => ((a > b) ? a : b)) / 2.0;
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
            coordsOf(interpP0(t)), coordsOf(interpP1(t)), interpFocus(t), model.diskScale);
        } else {
          return t => hyperbolicPlaneGeodesicOnPoincareDisk(
            coordsOf(dd.p0), coordsOf(dd.p1), interpFocus(t), model.diskScale);
        }
      };
      model.treeEdgeGroup.selectAll('.link').data(model.treeEdges, ee => ee.idx);
      model.treeEdgeGroup.selectAll('.link').transition().duration(deltaT)
        .attrTween('d', updateArcs);
    } else {
      model.treeEdgeGroup.selectAll('.link').data(model.treeEdges, ee => ee.idx);
      model.treeEdgeGroup.selectAll('.link')
        .attr('d', pp => hyperbolicPlaneGeodesicOnPoincareDisk(
          [pp.p0.x, pp.p0.y], [pp.p1.x, pp.p1.y], model.focus, model.diskScale));
    }
  };

  publicAPI.focusChanged = () => {
    model.diskCoords = hyperbolicPlanePointsToPoincareDisk(
      model.nodes.map(coordsOf), model.focus, model.diskScale);
    publicAPI.coordsChanged(model.transitionTime);
  };

  publicAPI.modelUpdated = () => {
    // Remember old coordinates in "previous" before computing new ones:
    model.treeEdges = model.treeEdges.map((dd) => ({
      idx: dd.idx,
      p0: dd.source,
      p1: dd.target,
      previous: {
        p0: Object.assign({}, dd.p0),
        p1: Object.assign({}, dd.p1),
      },
    }));
    model.diskCoords = hyperbolicPlanePointsToPoincareDisk(
      model.nodes.map(coordsOf), model.focus, model.diskScale);
    const ngdata = model.nodeGroup.selectAll('.node').data(model.diskCoords);
    ngdata.enter().append('circle')
      .classed('node', true)
      .classed(style.hyperbolicNode, true)
      .attr('r', '0.03px')
      .on('click', (d, i) => {
        model.prevFocus = model.focus;
        model.focus = coordsOf(model.nodes[i]);
        publicAPI.focusChanged();
      });
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
  transitionTime: 500,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'VizComponent');
  CompositeClosureHelper.get(publicAPI, model, ['color', 'container', 'transitionTime']);
  CompositeClosureHelper.set(publicAPI, model, ['transitionTime']);

  hyperbolicEdgeBundle(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
