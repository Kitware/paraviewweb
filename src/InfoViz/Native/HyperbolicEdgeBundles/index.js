import d3 from 'd3';
import { force, forceSimulation, forceManyBody, forceLink, forceX, forceY } from 'd3-force';

import style from 'PVWStyle/InfoVizNative/HyperbolicEdgeBundles.mcss';
import htmlContent from './body.html';
import FieldInformationProvider from '../../../InfoViz/Core/FieldInformationProvider';
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

      let mouseWheelMoving = false;
      svg.node().addEventListener('wheel', (event) => {
        if ('hyperbolicBounds' in model) {
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
        }
      }, { passive: true });

      publicAPI.resize(); // Apply a transform to the transformGroup based on the size of the SVG.

      // Auto unmount on destroy
      model.subscriptions.push({ unsubscribe: publicAPI.setContainer });

      // Fetch the mutual information matrix and mapping from row/column index to field name.
      if (model.provider.isA('FieldInformationProvider')) {
        model.fieldInformationSubscription =
          model.provider.subscribeToFieldInformation(
            (data) => {
              if (data && 'fieldMapping' in data && 'mutualInformation' in data) {
                publicAPI.setMutualInformation(
                  data.fieldMapping, data.mutualInformation);
              }
            });
        model.subscriptions.push(model.fieldInformationSubscription);
      }
      // Listen for hover events
      if (model.provider.isA('FieldHoverProvider')) {
        model.subscriptions.push(
          model.provider.onHoverFieldChange(change => {
            model.nodeGroup
              .selectAll('.node')
              .classed(style.highlightedNode, d => model.nodes[d.id].name in change.state.fields);
          }));
      }
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
      .attr('r', '0.02px')
      .on('click', (d, i) => {
        model.prevFocus = model.focus;
        model.focus = coordsOf(model.nodes[i]);
        publicAPI.focusChanged();
      });
    ngdata.exit().remove();
    if (model.provider.isA('FieldHoverProvider')) {
      model.nodeGroup.selectAll('.node')
        .on('mouseenter', (d, i) => {
          const state = { fields: {} };
          state.fields[model.nodes[d.id].name] = true;
          model.provider.setFieldHoverState({ state });
        })
        .on('mouseleave', () => {
          const state = { fields: {} };
          model.provider.setFieldHoverState({ state });
        });
    }
    const tgdata = model.treeEdgeGroup.selectAll('.link').data(model.treeEdges, dd => dd.id);
    tgdata.enter().append('path')
      .classed('link', true)
      .classed(style.hyperbolicTreeEdge, true);
    tgdata.exit().remove();
    publicAPI.coordsChanged(model.transitionTime);
  };

  publicAPI.layoutSpanningTree = () => {
    // NB: Some of this code relies on the order of model.treeEdges to start
    //     with the root node; to list parents as source, children as targets;
    //     and to list links from the top down.
    model.nodes.forEach((nn, ii) => { model.nodes[ii].children=[]; });
    model.treeEdges.forEach(ee => { ee.target.parent = ee.source; ee.source.children.push(ee.target); });
    const rootNode = model.treeEdges[0].source;
    //console.log('hierarchy ', d3.layout.hierarchy()(rootNode), rootNode);
    const maxDepth = model.nodes.reduce((depth, entry) => (entry.depth > depth ? entry.depth : depth), 1);
    const tidyTree = d3.layout.tree()
      .separation((a, b)  => (a.parent == b.parent ? 1 : 2) / a.depth)
      .size([360, maxDepth * 10]);
    tidyTree(rootNode); // Assign x, y coordinates to each node.
    model.nodes.forEach((nn, ii) => {
      const tx = nn.x;
      const ty = nn.y;
      model.nodes[ii].x = ty * Math.cos(tx*Math.PI/180.0);
      model.nodes[ii].y = ty * Math.sin(tx*Math.PI/180.0);
    });

    // Relax the sparse tidy tree with force-directed layout:
    model.sim = forceSimulation(model.nodes)
      .force('charge', forceManyBody())
      .force('link', forceLink(model.treeEdges).distance(10).strength(1))
      .force('x', forceX())
      .force('y', forceY());
    model.sim.tick();
    model.sim.tick();
    model.sim.tick();
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
      const selfInfo = mi[ii][ii];
      model.nodes[ii].value = selfInfo;
      if (selfInfo > ri) {
        ri = selfInfo;
        rr = ii;
      }
    }
    console.log('Root ', rr);

    // II. Find descendants.
    model.treeEdges = [];
    const nodes = new Set([rr]);
    const nextNode = mi[rr].map((vv) => ({ vmax: vv, vnod: rr}));
    delete nextNode[rr];
    while (nodes.size < nv) {
      // Find the largest entry:
      const linkToAdd =
        nextNode.reduce((result, entry, ii) =>
          (entry.vmax > result.vmax && !nodes.has(ii) ? Object.assign({ vlnk: ii }, entry) : result),
          { vmax: -1, vnod: -1, vlnk: -1 });
      if (linkToAdd.vlnk >= 0) {
        nodes.add(linkToAdd.vlnk);
        //missing.delete(linkToAdd.vlnk);
        model.treeEdges.push({ id: model.treeEdges.length, source: vars[linkToAdd.vnod], target: vars[linkToAdd.vlnk] });
        // Now update nextNode:
        delete nextNode[linkToAdd.vlnk];
        const miRow = mi[linkToAdd.vlnk];
        nextNode.forEach((vv, ii) => {
          if (vv.vmax < miRow[ii]) {
            nextNode[ii].vmax = miRow[ii];
            nextNode[ii].vnod = linkToAdd.vlnk;
          }
        });
      } else {
        console.log('Error: not done adding links but no more entries available.');
        break;
      }
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
