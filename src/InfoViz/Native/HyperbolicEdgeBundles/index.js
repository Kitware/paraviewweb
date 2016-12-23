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
        { idx:  0, p0: [334.18762488572924, 358.13452292263090], p1: [312.72348495611050, 387.88299104668560] },
        { idx:  1, p0: [334.18762488572924, 358.13452292263090], p1: [353.90429994195296, 319.41352650362420] },
        { idx:  2, p0: [253.15452023990338, 168.20016610150236], p1: [278.53741891587500, 193.50474848244320] },
        { idx:  3, p0: [380.61471694769847, 264.58933353902040], p1: [417.48583350629195, 260.61963708034210] },
        { idx:  4, p0: [380.61471694769847, 264.58933353902040], p1: [341.96783106088634, 264.72268514753340] },
        { idx:  5, p0: [326.54360452297306, 322.94680128722155], p1: [353.90429994195296, 319.41352650362420] },
        { idx:  6, p0: [364.24649860818110, 225.86363986467606], p1: [341.96783106088634, 264.72268514753340] },
        { idx:  7, p0: [364.24649860818110, 225.86363986467606], p1: [389.54050702058120, 193.26583277340492] },
        { idx:  8, p0: [420.81098775460663, 362.44843078875480], p1: [384.90567631119114, 354.81036757015187] },
        { idx:  9, p0: [317.38810462926050, 194.53583132489254], p1: [309.41841065363536, 226.10316106037124] },
        { idx: 10, p0: [309.41841065363536, 226.10316106037124], p1: [341.96783106088634, 264.72268514753340] },
        { idx: 11, p0: [309.41841065363536, 226.10316106037124], p1: [278.53741891587500, 193.50474848244320] },
        { idx: 12, p0: [309.41841065363536, 226.10316106037124], p1: [277.18402873004840, 232.16835229042620] },
        { idx: 13, p0: [341.96783106088634, 264.72268514753340], p1: [353.90429994195296, 319.41352650362420] },
        { idx: 14, p0: [341.96783106088634, 264.72268514753340], p1: [305.58830280627257, 278.53238498678960] },
        { idx: 15, p0: [389.54050702058120, 193.26583277340492], p1: [412.21111372773570, 166.32929457453255] },
        { idx: 16, p0: [353.90429994195296, 319.41352650362420], p1: [384.90567631119114, 354.81036757015187] },
        { idx: 17, p0: [353.90429994195296, 319.41352650362420], p1: [380.88020608315810, 312.03672828584430] },
        { idx: 18, p0: [305.58830280627257, 278.53238498678960], p1: [270.54451200408226, 292.77934091175390] },
        { idx: 19, p0: [384.90567631119114, 354.81036757015187], p1: [392.16231669382640, 390.86222345739990] },
      ];
      model.hyperbolicBounds = [[253.15, 166.33], [420.81, 390.86]];
      model.transitionTime = 500;
      model.focus = vectorScale(0.5, vectorMAdd(model.hyperbolicBounds[0], model.hyperbolicBounds[1], 1.0));
      model.diskScale = vectorDiff(model.hyperbolicBounds[0], model.hyperbolicBounds[1]).reduce((a, b) => ((a > b) ? a : b)) / 2.0;
      publicAPI.modelUpdated();
    }
  };

  publicAPI.coordsChanged = (deltaT) => {
    model.nodeGroup.selectAll('.node').data(model.diskCoords, dd => dd.idx);
    model.nodeGroup.selectAll('.node').transition().duration(deltaT)
      .attr('cx', d => d.x[0])
      .attr('cy', d => d.x[1]);
    if (deltaT > 0) {
      let interpFocus = null;
      if ('prevFocus' in model) {
        interpFocus = d3.interpolate(model.prevFocus, model.focus);
      }
      const updateArcs = dd => {
        if ('previous' in dd && 'prevFocus' in model) {
          const interpP0 = d3.interpolate(dd.previous.p0, dd.p0);
          const interpP1 = d3.interpolate(dd.previous.p1, dd.p1);
          return t => hyperbolicPlaneGeodesicOnPoincareDisk(
            [interpP0(t)], [interpP1(t)], interpFocus(t), model.diskScale)[0].path;
        } else {
          return () => hyperbolicPlaneGeodesicOnPoincareDisk([dd.p0], [dd.p1], model.focus, model.diskScale)[0].path;
        }
      };
      model.treeEdgeGroup.selectAll('.link').data(model.treeEdges, ee => ee.idx);
      model.treeEdgeGroup.selectAll('.link').transition().duration(deltaT)
        .attrTween('d', updateArcs);
    } else {
      model.treeEdgeGroup.selectAll('.link').data(model.treeEdges, ee => ee.idx);
      model.treeEdgeGroup.selectAll('.link')
        .attr('d', pp => hyperbolicPlaneGeodesicOnPoincareDisk([pp.p0], [pp.p1], model.focus, model.diskScale)[0].path);
    }
  };

  publicAPI.focusChanged = () => {
    model.treeEdges = model.treeEdges.map((dd) => ({ idx: dd.idx, p0: dd.p0, p1: dd.p1, previous: { p0: [dd.p0[0], dd.p0[1]], p1: [dd.p1[0], dd.p1[1]] }, }));
    model.diskCoords = hyperbolicPlanePointsToPoincareDisk(
      model.nodes, model.focus, model.diskScale);
    /*
    model.treePaths = hyperbolicPlaneGeodesicOnPoincareDisk(
      model.treeEdges.map(mm => mm.filter((dd, ii) => ii < 2)),
      model.treeEdges.map(mm => mm.filter((dd, ii) => ii > 1)),
      model.focus, model.diskScale);
    */
    publicAPI.coordsChanged(model.transitionTime);
  };

  publicAPI.modelUpdated = () => {
    model.diskCoords = hyperbolicPlanePointsToPoincareDisk(
      model.nodes, model.focus, model.diskScale);
    /*
    model.treePaths = hyperbolicPlaneGeodesicOnPoincareDisk(
      model.treeEdges.map(mm => mm.filter((dd, ii) => ii < 2)),
      model.treeEdges.map(mm => mm.filter((dd, ii) => ii > 1)),
      model.focus, model.diskScale);
    */
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
