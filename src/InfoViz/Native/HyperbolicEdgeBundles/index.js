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
      /*
      model.nodes = [
        [326.68762207031250, 350.63452148437500],
        [245.65452575683594, 160.70016479492188],
        [373.11471557617190, 257.08932495117190],
        [409.98583984375000, 253.11964416503906],
        [319.04360961914060, 315.44680786132810],
        [356.74649047851560, 218.36364746093750],
        [413.31097412109375, 354.94842529296875],
        [305.22348022460940, 380.38299560546875],
        [309.88809204101560, 187.03582763671875],
        [301.91839599609375, 218.60316467285156],
        [334.46783447265625, 257.22268676757810],
        [382.04049682617190, 185.76583862304688],
        [346.40429687500000, 311.91351318359375],
        [298.08831787109375, 271.03237915039060],
        [377.40567016601560, 347.31036376953125],
        [373.38021850585940, 304.53674316406250],
        [384.66232299804690, 383.36221313476560],
        [271.03741455078125, 186.00474548339844],
        [269.68402099609375, 224.66835021972656],
        [263.04452514648440, 285.27932739257810],
        [404.71112060546875, 158.82929992675780],
      ];
      */
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
        [334.18762488572924, 358.13452292263090, 312.72348495611050, 387.88299104668560],
        [334.18762488572924, 358.13452292263090, 353.90429994195296, 319.41352650362420],
        [253.15452023990338, 168.20016610150236, 278.53741891587500, 193.50474848244320],
        [380.61471694769847, 264.58933353902040, 417.48583350629195, 260.61963708034210],
        [380.61471694769847, 264.58933353902040, 341.96783106088634, 264.72268514753340],
        [326.54360452297306, 322.94680128722155, 353.90429994195296, 319.41352650362420],
        [364.24649860818110, 225.86363986467606, 341.96783106088634, 264.72268514753340],
        [364.24649860818110, 225.86363986467606, 389.54050702058120, 193.26583277340492],
        [420.81098775460663, 362.44843078875480, 384.90567631119114, 354.81036757015187],
        [317.38810462926050, 194.53583132489254, 309.41841065363536, 226.10316106037124],
        [309.41841065363536, 226.10316106037124, 341.96783106088634, 264.72268514753340],
        [309.41841065363536, 226.10316106037124, 278.53741891587500, 193.50474848244320],
        [309.41841065363536, 226.10316106037124, 277.18402873004840, 232.16835229042620],
        [341.96783106088634, 264.72268514753340, 353.90429994195296, 319.41352650362420],
        [341.96783106088634, 264.72268514753340, 305.58830280627257, 278.53238498678960],
        [389.54050702058120, 193.26583277340492, 412.21111372773570, 166.32929457453255],
        [353.90429994195296, 319.41352650362420, 384.90567631119114, 354.81036757015187],
        [353.90429994195296, 319.41352650362420, 380.88020608315810, 312.03672828584430],
        [305.58830280627257, 278.53238498678960, 270.54451200408226, 292.77934091175390],
        [384.90567631119114, 354.81036757015187, 392.16231669382640, 390.86222345739990],
      ];
      model.hyperbolicBounds = [[253.15, 166.33], [420.81, 390.86]];
      model.transitionTime = 5000;
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
    model.treeEdgeGroup.selectAll('.link').data(model.treePaths, ee => ee.idx);
    model.treeEdgeGroup.selectAll('.link').transition().duration(deltaT)
        .attr('d', pp => pp.path);
  };

  publicAPI.focusChanged = () => {
    model.diskCoords = hyperbolicPlanePointsToPoincareDisk(
      model.nodes, model.focus, model.diskScale);
    model.treePaths = hyperbolicPlaneGeodesicOnPoincareDisk(
      model.treeEdges.map(mm => mm.filter((dd, ii) => ii < 2)),
      model.treeEdges.map(mm => mm.filter((dd, ii) => ii > 1)),
      model.focus, model.diskScale);
    publicAPI.coordsChanged(model.transitionTime);
  };

  publicAPI.modelUpdated = () => {
    model.diskCoords = hyperbolicPlanePointsToPoincareDisk(
      model.nodes, model.focus, model.diskScale);
    model.treePaths = hyperbolicPlaneGeodesicOnPoincareDisk(
      model.treeEdges.map(mm => mm.filter((dd, ii) => ii < 2)),
      model.treeEdges.map(mm => mm.filter((dd, ii) => ii > 1)),
      model.focus, model.diskScale);
    const ngdata = model.nodeGroup.selectAll('.node').data(model.diskCoords);
    ngdata.enter().append('circle')
      .classed('node', true)
      .classed(style.hyperbolicNode, true)
      .attr('r', '0.03px')
      .on('click', (d, i) => { model.focus = model.nodes[i]; publicAPI.focusChanged(); });
    ngdata.exit().remove();
    const tgdata = model.treeEdgeGroup.selectAll('.link').data(model.treePaths, dd => dd.idx);
    tgdata.enter().append('path')
      .classed('link', true)
      .classed(style.hyperbolicTreeEdge, true);
    tgdata.exit().remove();
    publicAPI.coordsChanged(model.transitionTime);
    //console.log(model.nodeGroup.selectAll('.node'));
    //console.log(model.treeEdgeGroup.selectAll('.link'));
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
