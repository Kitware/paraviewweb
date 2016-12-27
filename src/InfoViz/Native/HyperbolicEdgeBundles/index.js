import d3 from 'd3';
import { force, forceSimulation, forceManyBody, forceLink, forceX, forceY } from 'd3-force';

import style from 'PVWStyle/InfoVizNative/HyperbolicEdgeBundles.mcss';
import htmlContent from './body.html';
import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';
import DataManager from '../../../IO/Core/DataManager';
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

      let mouseWheelMoving = false;
      svg.node().addEventListener('wheel', (event) => {
        const maxScale = vectorDiff(model.hyperbolicBounds[0], model.hyperbolicBounds[1]).reduce(
          (a, b) => ((a > b) ? a : b)) * 2.0;
        model.diskScale = Math.min(Math.max(model.diskScale + event.deltaY * 0.1, 0.5), maxScale);
        //console.log('wheel', event.deltaY, model.diskScale);
        if (!mouseWheelMoving) {
          window.requestAnimationFrame(() => {
            //console.log('   wheel', model.diskScale, maxScale);
            model.diskCoords = hyperbolicPlanePointsToPoincareDisk(
              model.nodes.map(coordsOf), model.focus, model.diskScale);
            publicAPI.coordsChanged(0);
            mouseWheelMoving = false;
          });
        }
        mouseWheelMoving = true;
      }, { passive: true });

      publicAPI.resize(); // Apply a transform to the transformGroup based on the size of the SVG.

      // Instead of getting data from a provider:
      //   if (model.provider.isA('MutualInformationSummaryProvider')) ...
      // fetch using a DataManager for now:
      const dataManager = new DataManager();
      const url = '/paraviewweb/data/dummy/minfo.200.json';
      dataManager.on(url, (data, envelope) => {
        console.log('loaded data from ', url);
        const minfo = data.data.minfo;
        const vars = d3.range(minfo.length).map((nn) => ({ name: String(nn), id: nn }));
        publicAPI.setMutualInformation(vars, minfo);
      });
      dataManager.fetchURL(url, 'json');
    }
  };

  publicAPI.coordsChanged = (deltaT) => {
    model.diskCoords = hyperbolicPlanePointsToPoincareDisk(
      model.nodes.map(coordsOf), model.focus, model.diskScale);
    model.nodeGroup.selectAll('.node').data(model.diskCoords, dd => dd.id);
    if (deltaT > 0) {
      model.nodeGroup.selectAll('.node').transition().duration(deltaT)
        .attr('cx', d => d.x[0])
        .attr('cy', d => d.x[1]);
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
      model.treeEdgeGroup.selectAll('.link').data(model.treeEdges, ee => ee.id);
      model.treeEdgeGroup.selectAll('.link').transition().duration(deltaT)
        .attrTween('d', updateArcs);
    } else {
      model.nodeGroup.selectAll('.node')
        .attr('cx', d => d.x[0])
        .attr('cy', d => d.x[1]);
      model.treeEdgeGroup.selectAll('.link').data(model.treeEdges, ee => ee.id);
      model.treeEdgeGroup.selectAll('.link')
        .attr('d', pp => hyperbolicPlaneGeodesicOnPoincareDisk(
          [pp.p0.x, pp.p0.y], [pp.p1.x, pp.p1.y], model.focus, model.diskScale));
    }
  };

  publicAPI.focusChanged = () => {
    publicAPI.coordsChanged(model.transitionTime);
  };

  publicAPI.spanningTreeUpdated = () => {
    // Remember old coordinates in "previous" before computing new ones:
    model.treeEdges = model.treeEdges.map((dd) => ({
      id: dd.id,
      p0: dd.source,
      p1: dd.target,
      previous: {
        p0: Object.assign({}, dd.p0),
        p1: Object.assign({}, dd.p1),
      },
    }));
    model.diskCoords = hyperbolicPlanePointsToPoincareDisk(
      model.nodes.map(coordsOf), model.focus, model.diskScale);
    const ngdata = model.nodeGroup.selectAll('.node').data(model.diskCoords, dd => dd.id);
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
    const tgdata = model.treeEdgeGroup.selectAll('.link').data(model.treeEdges, dd => dd.id);
    tgdata.enter().append('path')
      .classed('link', true)
      .classed(style.hyperbolicTreeEdge, true);
    tgdata.exit().remove();
    publicAPI.coordsChanged(model.transitionTime);
  };

  publicAPI.layoutSpanningTree = () => {
      model.sim = forceSimulation(model.nodes)
        .force('charge', forceManyBody())
        .force('link', forceLink(model.treeEdges).distance(20).strength(1))
        .force('x', forceX())
        .force('y', forceY());
      model.sim.tick();
      model.sim.on('tick', () => publicAPI.coordsChanged(0));
      model.sim.restart();

      // Compute bounds and scaling
      model.hyperbolicBounds =
        model.nodes.reduce((result, value) => [
          [Math.min(result[0][0], value.x), Math.min(result[0][1], value.y)],
          [Math.max(result[1][0], value.x), Math.max(result[1][1], value.y)]],
          [[model.nodes[0].x, model.nodes[0].y], [model.nodes[0].x, model.nodes[0].y]]);
      model.focus = vectorScale(0.5, vectorMAdd(model.hyperbolicBounds[0], model.hyperbolicBounds[1], 1.0));
      model.diskScale = vectorDiff(model.hyperbolicBounds[0], model.hyperbolicBounds[1]).reduce(
        (a, b) => ((a > b) ? a : b)) / 2.0;
      publicAPI.spanningTreeUpdated();
  };

  publicAPI.setMutualInformation = (vars, mi) => {
    model.nodes = vars;
    const map = {};
    // Identify root of tree (largest self-information):
    const nv = mi.length;
    let rr = 0;
    let ri = mi[rr][rr];
    for (let ii = 1; ii < nv; ++ii) {
      if (mi[ii][ii] > ri) {
        ri = mi[ii][ii];
        rr = ii;
      }
    }
    console.log('Root ', rr);
    // II. Find descendants.
    const nodes = new Set([rr]);
    const missing = new Set();
    const root = { name: String(rr), key: rr, children: [], size: ri, parent: null };
    const leaf = { name: String(rr)+'r', key: vars[rr].name, children: [], size: ri, parent: root };
    root.children.push(leaf);
    const metaroot = { name: '-1', key: -1, children: [root], size: 0.0 };
    map[metaroot.name] = metaroot;
    map[root.name] = root;
    root.parent = metaroot;
    for (let ii = 0; ii < nv; ++ii) { if (ii != rr) { missing.add(ii); } }

    const mslinks = [];
    model.treeEdges = [];

    function addLink(ii, jj) {
      if (mslinks[ii] === undefined) {
        mslinks[ii] = new Set([jj]);
      } else {
        mslinks[ii].add(jj);
      }
      model.treeEdges.push({ id: model.treeEdges.length, source: vars[ii], target: vars[jj] });
    }

    while (nodes.size < nv) {
      let maxmi = -1;
      let mrow = -1;
      let mcol = -1;
      var _itDone = true;
      var _didIteratorError = false;
      var _itError = undefined;

      for (var _it = nodes.values()[Symbol.iterator](), _step; !(_itDone = (_step = _it.next()).done); _itDone = true) {
        var row = _step.value;

        var _itDone2 = true;
        var _didIteratorError2 = false;
        var _itError2 = undefined;
        const rowVals = mi[row];

        for (var _it2 = missing.values()[Symbol.iterator](), _step2; !(_itDone2 = (_step2 = _it2.next()).done); _itDone2 = true) {
          var col = _step2.value;

          const vv = rowVals[col];
          if (maxmi < vv) {
            mrow = row;
            mcol = col;
            maxmi = vv;
          }
        }
      }
      missing.delete(mcol);
      nodes.add(mcol);
      const treeNode = { parent: map[String(mrow)], children: [], key: mcol, name: String(mcol), size: maxmi };
      const treeLeaf = { parent: map[String(mcol)], children: [], key: vars[mcol].name, name: String(mcol) + 'r', size: maxmi };
      treeNode.children.push(treeLeaf);
      map[treeNode.name] = treeNode;
      map[treeLeaf.name] = treeLeaf;
      addLink(mrow < mcol ? mrow : mcol, mrow < mcol ? mcol : mrow);
      treeNode.parent.children.push(treeNode);
      console.log( mcol, ' is a child of ', mrow );
    }

    publicAPI.layoutSpanningTree();
  };

  publicAPI.getState = () => model;
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
