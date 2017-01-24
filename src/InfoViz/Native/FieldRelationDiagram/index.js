import d3 from 'd3';

import style from 'PVWStyle/InfoVizNative/FieldRelationDiagram.mcss';
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


function fieldRelationEdgeBundle(publicAPI, model) {
  // Return an array containing a point's coordinates:
  const coordsOf = (nn => [nn.x, nn.y]);

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
        `scale(${smaller / 2.0}, ${smaller / 2.0}) translate(${tx}, ${2 * ty - padding / smaller})`);
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

      let mouseWheelMoving = false;
      svg.node().addEventListener('wheel', (event) => {
        if ('dataBounds' in model) {
          const maxScale = vectorDiff(model.dataBounds[0], model.dataBounds[1]).reduce(
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
                console.log('data ', data);
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
          model.provider.onHoverFieldChange(hover => {
            //console.log(hover);
            function updateDrawOrder(d, i) {
              if (model.nodes[d.id].name in hover.state.highlight) {
                this.parentNode.appendChild(this);
                d3.select(this)
                  .on('click', (d, i) => {
                    if (model.provider.isA('FieldHoverProvider')) {
                      const hover = model.provider.getFieldHoverState();
                      hover.state.subject = model.nodes[d.id].name;
                      hover.state.highlight[hover.state.subject] = { weight: 1 };
                      model.provider.setFieldHoverState(hover);
                    } else {
                      model.prevFocus = model.focus;
                      model.focus = coordsOf(model.nodes[i]);
                      publicAPI.focusChanged(i);
                    }
                  });
              }
            }
            model.nodeGroup
              .selectAll('.node')
              .classed(style.highlightedNode, d => model.nodes[d.id].name in hover.state.highlight)
              .classed(style.emphasizedNode, d => {
                const nodeName = model.nodes[d.id].name;
                if (nodeName in hover.state.highlight) {
                  const hv = hover.state.highlight[nodeName];
                  //console.log(`${nodeName} ${hv.weight}`);
                  return (typeof hv === 'object' && hv.weight > 0);
                }
                return false;
              })
              .each(updateDrawOrder);
            if ('subject' in hover.state && hover.state.subject !== null) {
              model.prevFocus = model.focus;
              const info = model.nodes.reduce((result, entry) =>
                entry.name === hover.state.subject ? { pt: coordsOf(entry), id: entry.id } : result,
                { pt: model.focus, id: -1 });
              model.focus = info.pt;
              publicAPI.focusChanged(info.id);
            }
          }));
      }
    }
  };

  publicAPI.coordsChanged = (deltaT) => {
    console.log(' coords changed ', model);
    model.nodeGroup.selectAll('.node').data(model.nodes, dd => dd.id);
    if (deltaT > 0) {
      model.nodeGroup.selectAll('.node').transition().duration(deltaT)
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    } else {
      model.nodeGroup.selectAll('.node')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    }
  };

  publicAPI.focusChanged = (subjectId) => {
    if (subjectId < 0) {
      console.log('bad subject');
      return;
    }
    model.nodes.forEach((nn, ii) => {
      const tx = nn.r;
      const ty = model.theta[subjectId][ii];
      model.nodes[ii].th = ty;
      model.nodes[ii].x = tx * Math.cos(ty*Math.PI/180.0);
      model.nodes[ii].y = - tx * Math.sin(ty*Math.PI/180.0);
    });
    publicAPI.coordsChanged(model.transitionTime);
  };

  publicAPI.spanningTreeUpdated = () => {
    // Remember old coordinates in "previous" before computing new ones:
    model.diskCoords = model.nodes.map(coordsOf);
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
          model.prevFocus = model.focus;
          model.focus = coordsOf(model.nodes[i]);
          publicAPI.focusChanged();
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
          const state = { highlight: {}, subject: null, disposition: 'final' };
          model.provider.setFieldHoverState({ state });
        });
    }
    publicAPI.coordsChanged(model.transitionTime);
  };

  publicAPI.placeNodesByRelation = (subject) => {
    model.nodes.forEach((nn, ii) => {
      const tx = nn.r;
      const ty = model.theta[subject][ii];
      model.nodes[ii].th = ty;
      model.nodes[ii].x = tx * Math.cos(ty*Math.PI/180.0);
      model.nodes[ii].y = - tx * Math.sin(ty*Math.PI/180.0);
    });

    // Compute bounds and scaling
    model.dataBounds = [[-1, 0], [+1, +1]];
    /*
      model.nodes.reduce((result, value) => [
        [Math.min(result[0][0], value.x), Math.min(result[0][1], value.y)],
        [Math.max(result[1][0], value.x), Math.max(result[1][1], value.y)]],
        [[model.nodes[0].x, model.nodes[0].y], [model.nodes[0].x, model.nodes[0].y]]);
    */
    model.focus = 1.0; // FIXME: Use normalized Pearson or SMI of subject.
    model.diskScale = vectorDiff(model.dataBounds[0], model.dataBounds[1]).reduce(
      (a, b) => ((a > b) ? a : b)) / 2.0;
    publicAPI.spanningTreeUpdated();
  };

  publicAPI.setRelationData = (vars, treeData, radius, theta) => {
    model.nodes = vars;
    const map = {};
    // Identify root of tree (largest self-information):
    const nv = treeData.length;
    let rr = 0;
    let ri = treeData[rr][rr];
    for (let ii = 1; ii < nv; ++ii) {
      const selfInfo = treeData[ii][ii];
      model.nodes[ii].value = selfInfo;
      if (selfInfo > ri) {
        ri = selfInfo;
        rr = ii;
      }
    }
    console.log('Root ', rr);
    const rmax = radius.reduce((rmx, entry) => rmx < entry ? entry : rmx);
    model.theta = theta;
    theta[rr].forEach((th, ii) => {
      model.nodes[ii].r = radius[ii] / rmax;
      model.nodes[ii].th = th;
      model.nodes[ii].x = model.nodes[ii].r * Math.cos(model.nodes[ii].th*Math.PI/180.0);
      model.nodes[ii].y = - model.nodes[ii].r * Math.sin(model.nodes[ii].th*Math.PI/180.0);
    });

    publicAPI.placeNodesByRelation(rr);
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
