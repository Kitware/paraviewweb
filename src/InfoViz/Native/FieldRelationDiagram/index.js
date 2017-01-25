import d3 from 'd3';

import style from 'PVWStyle/InfoVizNative/FieldRelationDiagram.mcss';
import htmlContent from './body.html';
// import FieldInformationProvider from '../../../InfoViz/Core/FieldInformationProvider';
import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

function fieldRelationEdgeBundle(publicAPI, model) {
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
    d3.select(model.container).select('svg')
      .attr('width', rect.width)
      .attr('height', rect.height);
    if (smaller > 0.0) {
      model.transformGroup.attr('transform',
        `scale(${smaller / 2.0}, ${smaller / 2.0}) translate(${tx}, ${(2 * ty) - (padding / smaller)})`);
    }
    // TODO: Now transition the point size and arc width to maintain
    //       the diagram's sense of proportion.
  };

  publicAPI.setContainer = (el) => {
    if (model.container) {
      while (model.container.firstChild) {
        model.container.removeChild(model.container.firstChild);
        delete model.unselectedBundleGroup;
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
      const viewdiv = d3.select(model.container).select('.field-relation-container');
      viewdiv.classed(style.fieldRelationContainer, true);
      const svg = viewdiv.append('svg').classed('field-relation-svg', true);
      model.transformGroup = svg.append('g').classed('disk-transform', true);
      model.transformGroup.append('path')
        .classed(style.boundary, true)
        .attr('d', 'M -1,0 L 1,0 A 1,1 0 1 0 -1,0');
      model.unselectedBundleGroup = model.transformGroup.append('g').classed('unselected-bundles', true);
      model.selectedBundleGroup = model.transformGroup.append('g').classed('selected-bundles', true);
      model.nodeGroup = model.transformGroup.append('g').classed('nodes', true);

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
        model.subscriptions.push(
          model.provider.onHoverFieldChange((hover) => {
            // console.log(hover);
            function updateDrawOrder(d, i) {
              if (model.nodes[d.id].name in hover.state.highlight) {
                this.parentNode.appendChild(this);
                d3.select(this)
                  .on('click', (dd, idx) => {
                    if (model.provider.isA('FieldHoverProvider')) {
                      const fhover = model.provider.getFieldHoverState();
                      fhover.state.subject = model.nodes[dd.id].name;
                      fhover.state.highlight[fhover.state.subject] = { weight: 1 };
                      model.provider.setFieldHoverState(fhover);
                    } else {
                      publicAPI.placeNodesByRelationTo(d.id);
                    }
                  });
              }
            }
            model.nodeGroup
              .selectAll('.node')
              .classed(style.highlightedNode, d => (model.nodes[d.id].name in hover.state.highlight))
              .classed(style.emphasizedNode, (d) => {
                const nodeName = model.nodes[d.id].name;
                if (nodeName in hover.state.highlight) {
                  const hv = hover.state.highlight[nodeName];
                  // console.log(`${nodeName} ${hv.weight}`);
                  return (typeof hv === 'object' && hv.weight > 0);
                }
                return false;
              })
              .each(updateDrawOrder);
            if ('subject' in hover.state && hover.state.subject !== null) {
              const subjectId = model.nodes.reduce((result, entry) =>
                (entry.name === hover.state.subject ? entry.id : result),
                -1);
              publicAPI.placeNodesByRelationTo(subjectId);
            }
          }));
      }
    }
  };

  function interpolateTheta(node, t) {
    if (model.prevFocus < 0) {
      return node.th * Math.PI / 180.0;
    }
    const prevTheta = model.theta[model.prevFocus][node.id];
    const nextTheta = model.theta[model.focus][node.id];
    return ((t * nextTheta) + ((1.0 - t) * prevTheta)) * Math.PI / 180.0;
  }

  function fixedRadiusTweenX(node) {
    return t => node.r * Math.cos(interpolateTheta(node, t));
  }

  function fixedRadiusTweenY(node) {
    return t => -node.r * Math.sin(interpolateTheta(node, t));
  }

  publicAPI.coordsChanged = (deltaT) => {
    // console.log(' coords changed ', model);
    model.nodeGroup.selectAll('.node').data(model.nodes, dd => dd.id);
    if (deltaT > 0) {
      model.nodeGroup.selectAll('.node').transition().duration(deltaT)
        .attrTween('cx', fixedRadiusTweenX)
        .attrTween('cy', fixedRadiusTweenY);
    } else {
      model.nodeGroup.selectAll('.node')
        .attr('cx', d => fixedRadiusTweenX(1.0))
        .attr('cy', d => fixedRadiusTweenY(1.0));
    }
  };

  publicAPI.updateDiagram = () => {
    const ngdata = model.nodeGroup.selectAll('.node').data(model.nodes, dd => dd.id);
    ngdata.enter().append('circle')
      .classed('node', true)
      .classed(style.fieldRelationNode, true)
      .attr('r', '0.02px')
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
    ngdata.exit().remove();
    if (model.provider.isA('FieldHoverProvider')) {
      model.nodeGroup.selectAll('.node')
        .on('mouseenter', (d, i) => {
          const state = { highlight: {}, subject: null, disposition: 'preliminary' };
          state.highlight[model.nodes[d.id].name] = { weight: 1 };
          model.provider.setFieldHoverState({ state });
        })
        .on('mouseleave', () => {
          const state = { highlight: {}, subject: null, disposition: 'preliminary' };
          model.provider.setFieldHoverState({ state });
        });
    }
    publicAPI.coordsChanged(model.transitionTime);
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
  transitionTime: 500,
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
