import d3 from 'd3';

import style from 'PVWStyle/InfoVizNative/FieldRelationDiagram.mcss';
import htmlContent from './body.html';
// import FieldInformationProvider from '../../../InfoViz/Core/FieldInformationProvider';
import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

function fieldRelationEdgeBundle(publicAPI, model) {
  function interpolateTheta(node, t) {
    const nextTheta = model.theta[model.focus][node.id];
    const prevTheta = model.prevFocus >= 0 ? model.theta[model.prevFocus][node.id] : nextTheta;
    const th = ((t * nextTheta) + ((1.0 - t) * prevTheta)) * Math.PI / 180.0;
    const scale = (model.provider.getField(model.nodes[node.id].name).active ? model.nodeScale * 1.67 : model.nodeScale);
    return `translate(${node.r * Math.cos(th)}, ${-node.r * Math.sin(th)}) scale(${scale}, ${scale})`;
  }

  function fixedRadiusTween(deltaT) {
    if (deltaT > 0) {
      return node => (t => interpolateTheta(node, t));
    }
    return node => interpolateTheta(node, 1.0);
  }

  publicAPI.resize = () => {
    if (!model.container) {
      return;
    }

    const rect = model.container.getBoundingClientRect();
    const padding = 20;
    const upw = rect.width - (2 * padding);
    const uph = rect.height - (2 * padding);
    const smaller = upw < 2.0 * uph ? upw : 2 * uph;
    const tx = rect.width / smaller;
    const ty = rect.height / smaller;
    model.scale = smaller / 2.0;
    model.tx = tx;
    model.ty = (2 * ty) - (padding / smaller);
    d3.select(model.container).select('svg')
      .attr('width', rect.width)
      .attr('height', rect.height);
    if (smaller > 0.0) {
      model.transformGroup.attr('transform',
        `scale(${smaller / 2.0}, ${smaller / 2.0}) translate(${tx}, ${(2 * ty) - (padding / smaller)})`);
    }
    // let nodes get smaller for small diagram, but not too big.
    model.nodeScale = 1.0 / Math.max(200, model.scale);

    // TODO: Now transition arc width to maintain
    //       the diagram's sense of proportion.
    if (model.nodeGroup) {
      model.nodeGroup.selectAll('.node')
        .attr('transform', fixedRadiusTween(0));
    }
  };

  publicAPI.setContainer = (el) => {
    if (model.container) {
      while (model.container.firstChild) {
        model.container.removeChild(model.container.firstChild);
        delete model.unselectedBundleGroup;
        delete model.selectedBundleGroup;
        delete model.nodeGroup;
        delete model.axesGroup;
        delete model.transformGroup;
        // TODO: When el is null/undefined and API is provider, unsubscribe.
      }
    }

    model.container = el;

    if (model.container) {
      // Create placeholder
      model.container.innerHTML = htmlContent;

      // Apply style and create SVG for rendering
      const viewdiv = d3.select(model.container).select('.field-relation-container');
      viewdiv.classed(style.fieldRelationContainer, true);
      const svg = viewdiv.append('svg').classed('field-relation-svg', true);
      model.transformGroup = svg.append('g').classed('disk-transform', true);
      model.axesGroup = model.transformGroup.append('g');
      model.axesGroup.append('path')
        .classed(style.boundary, true)
        .attr('d', 'M -1,0 L 1,0 A 1,1 0 1 0 -1,0');
      // draw some polar axes grid
      for (let r = 0.2; r < 0.99; r += 0.2) {
        model.axesGroup.append('path')
          .classed(style.ticks, true)
          .attr('d', `M ${r},0 A ${r},${r} 0 1 0 -${r},0`);
      }
      // every 15 degrees
      for (let t = Math.PI / 12; t < Math.PI * 0.99; t += Math.PI / 12) {
        model.axesGroup.append('path')
          .classed(style.ticks, true)
          .attr('d', `M 0,0 L ${Math.cos(t)},-${Math.sin(t)}`);
      }
      // show an arc through the focus node - repositioned as soon as focus is set
      model.axesGroup.append('path')
        .classed(style.focusArc, true)
        .attr('d', 'M 0.5,0 A 0.5,0.5 0 1 0 -0.5,0');

      model.unselectedBundleGroup = model.transformGroup.append('g').classed('unselected-bundles', true);
      model.selectedBundleGroup = model.transformGroup.append('g').classed('selected-bundles', true);
      model.nodeGroup = model.transformGroup.append('g').classed('nodes', true);

      // add mouse handlers for targeting lines
      svg
        .on('mousemove', (d, i) => {
          const coord = d3.mouse(svg.node());
          let line = model.axesGroup.selectAll(`line.${style.crossHairs}`);
          let path = model.axesGroup.selectAll(`path.${style.crossHairs}`);
          if (line.empty()) {
            line = model.axesGroup.append('line').classed(style.crossHairs, true)
              .attr('x1', 0).attr('y1', 0);
          }
          if (path.empty()) {
            path = model.axesGroup.append('path').classed(style.crossHairs, true);
          }
          // apply the diagram transform manually.
          coord[0] = (coord[0] / model.scale) - model.tx;
          coord[1] = (coord[1] / model.scale) - model.ty;
          const arcR = Math.sqrt((coord[0] * coord[0]) + (coord[1] * coord[1]));
          if (arcR <= 1.1 && coord[1] <= 0.0) {
            // draw radial line all the way to r === 1.0
            line
              .attr('x2', coord[0] / arcR)
              .attr('y2', coord[1] / arcR);
            if (arcR <= 1.0) {
              path.attr('d', `M ${arcR},0 A ${arcR},${arcR} 0 1 0 -${arcR},0`);
            } else {
              path.remove();
            }
          } else {
            model.axesGroup.selectAll(`.${style.crossHairs}`).remove();
          }
        })
        .on('mouseleave', () => {
          model.axesGroup.selectAll(`.${style.crossHairs}`).remove();
        });

      publicAPI.resize(); // Apply a transform to the transformGroup based on the size of the SVG.

      // Auto unmount on destroy
      model.subscriptions.push({ unsubscribe: publicAPI.setContainer });

      // Fetch the mutual information matrix and mapping from row/column index to field name.
      if (model.provider.isA('FieldInformationProvider')) {
        model.fieldInformationSubscription =
          model.provider.subscribeToFieldInformation(
            (data) => {
              if (data && 'fieldMapping' in data && 'mutualInformation' in data) {
                // console.log('data ', data);
                const treeKey = `${model.diagramType.toLowerCase() === 'taylor' ? 'taylorPearson' : 'mutualInformation'}`;
                const thetaKey = `${model.diagramType.toLowerCase()}Theta`;
                const radKey = `${model.diagramType.toLowerCase() === 'taylor' ? 'taylorR' : 'mutualInformation'}`;
                let radData = data[radKey];
                if (model.diagramType.toLowerCase() !== 'taylor') {
                  radData = radData.map((xx, ii) => xx[ii]);
                }
                // We make a copy of the fieldMapping here because we modify it
                // in a way that prevents serialization (object references to children),
                // and the provider uses serialization to track differences. Grrr.
                publicAPI.setRelationData(
                  JSON.parse(JSON.stringify(data.fieldMapping)),
                  data[treeKey], radData, data[thetaKey]);
              }
            });
        model.subscriptions.push(model.fieldInformationSubscription);
      }

      // Listen for hover events
      if (model.provider.isA('FieldHoverProvider')) {
        const hoverWeight = (d, highlight) => {
          const nodeName = model.nodes[d.id].name;
          const hv = highlight[nodeName];
          if (hv && hv.weight !== undefined) {
            if (hv.weight >= 0) return hv.weight;
          }
          return -1;
        };
        model.subscriptions.push(
          model.provider.onHoverFieldChange((hover) => {
            // console.log(hover);
            function updateDrawOrder(d, i) {
              if (model.nodes[d.id].name in hover.state.highlight) {
                this.parentNode.appendChild(this);
              }
            }
            const grp = model.nodeGroup.selectAll('.node');
            grp.select('svg')
              .classed(style.highlightedGlyph, d => (hoverWeight(d, hover.state.highlight) === 0))
              .classed(style.emphasizedGlyph, d => (hoverWeight(d, hover.state.highlight) > 0));
            grp.each(updateDrawOrder);
            if (hover.state.subject) {
              const subjectId = model.nodes.reduce((result, entry) =>
                (entry.name === hover.state.subject ? entry.id : result),
                -1);
              publicAPI.placeNodesByRelationTo(subjectId);
            }
          }));
      }
    }
  };

  const coordsChanged = (deltaT, nodeselect) => {
    // console.log(' coords changed ', model);
    if (deltaT > 0) {
      nodeselect.transition().duration(deltaT)
        .attrTween('transform', fixedRadiusTween(deltaT));
    } else {
      nodeselect
        .attr('transform', fixedRadiusTween(0));
    }
  };

  publicAPI.updateDiagram = () => {
    // NB: The ensureLegendForNode function **relies** on having d3 define "this"
    //     to be the currently-selected element, so the "=>" syntax cannot be used.
    function ensureLegendForNode(d, i) {
      const self = d3.select(this);
      if (self.select(`svg.${style.legendShape}`).empty()) {
        const { color, shape } = model.provider.getLegend(d.name);
        self.append('svg')
          .classed(style.legendShape, true)
          .attr('width', model.legendSize)
          .attr('height', model.legendSize)
          .attr('x', -0.5 * model.legendSize)
          .attr('y', -0.5 * model.legendSize)
          .attr('fill', color)
          .append('use')
          .attr('xlink:href', shape);
      }
    }
    const ngdata = model.nodeGroup.selectAll('.node').data(model.nodes, dd => dd.id);
    ngdata.enter().append('g')
      .classed('node', true)
      .classed(style.fieldRelationNode, true)
        .on('click', (d, i) => {
          if (model.provider.isA('FieldHoverProvider')) {
            const hover = model.provider.getFieldHoverState();
            hover.state.subject = model.nodes[d.id].name;
            hover.state.highlight[hover.state.subject] = { weight: 1 };
            model.provider.setFieldHoverState(hover);
          } else {
            publicAPI.placeNodesByRelationTo(d.id);
          }
        });
    if (model.provider.isA('LegendProvider')) {
      // FIXME: This will not change the legend glyph for any pre-existing nodes!
      ngdata.each(ensureLegendForNode);
    }
    ngdata.exit().remove();
    if (model.provider.isA('FieldHoverProvider')) {
      model.nodeGroup.selectAll('.node')
        .on('mouseenter', (d, i) => {
          const state = { highlight: {}, subject: '', disposition: 'preliminary' };
          state.highlight[model.nodes[d.id].name] = { weight: 1 };
          model.provider.setFieldHoverState({ state });
        })
        .on('mouseleave', () => {
          const state = { highlight: {}, subject: '', disposition: 'preliminary' };
          model.provider.setFieldHoverState({ state });
        });
    }
    // draw arc at focus radius
    const arcR = model.nodes[model.focus].r;
    model.transformGroup.select(`.${style.focusArc}`)
      .attr('d', `M ${arcR},0 A ${arcR},${arcR} 0 1 0 -${arcR},0`);

    // move nodes
    coordsChanged(model.transitionTime, ngdata);
  };

  publicAPI.placeNodesByRelationTo = (subject) => {
    if (typeof subject !== 'number' || subject < 0) {
      console.log(`Bad subject ${subject} for ${model.diagramType}`);
      return; // Ignore invalid request.
    }
    model.prevFocus = model.focus;
    model.focus = subject;
    model.nodes.forEach((nn, ii) => {
      model.nodes[ii].th = model.theta[subject][ii];
    });
    publicAPI.updateDiagram();
  };

  publicAPI.setRelationData = (vars, treeData, radius, theta) => {
    model.nodes = vars;
    const rmax = radius.reduce((rmx, entry) => (rmx < entry ? entry : rmx));
    model.theta = theta;
    theta[0].forEach((th, ii) => {
      model.nodes[ii].r = radius[ii] / rmax;
      model.nodes[ii].th = th;
    });

    publicAPI.placeNodesByRelationTo(0);
  };

  publicAPI.getState = () => model;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  container: null,
  color: 'inherit',
  diagramType: 'smi',
  focus: -1,
  prevFocus: -1,
  legendSize: 12,
  transitionTime: 750,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'VizComponent');
  CompositeClosureHelper.get(publicAPI, model, ['color', 'container', 'diagramType', 'transitionTime']);
  CompositeClosureHelper.set(publicAPI, model, ['diagramType', 'transitionTime']);

  fieldRelationEdgeBundle(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
