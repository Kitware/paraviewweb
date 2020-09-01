import React from 'react';
import PropTypes from 'prop-types';
import Monologue from 'monologue.js';

import layoutFunctions from './Layouts';
import sizeHelper from '../../../Common/Misc/SizeHelper';
import MouseHandler from '../../../Interaction/Core/MouseHandler';

const layoutNames = Object.keys(layoutFunctions);
const ACTIVE_VIEWPORT_CHANGE = 'multiview-viewport-active-change';
const LAYOUT_CHANGE = 'multiview-layout-change';

function getLayouts() {
  return layoutNames;
}

/**
 * This React component expect the following input properties:
 */
export default class MultiViewRenderer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      width: 200,
      height: 200,
    };

    // static
    this.getLayouts = getLayouts;

    // Bind callback
    this.onActiveViewportChange = this.onActiveViewportChange.bind(this);
    this.onLayoutChange = this.onLayoutChange.bind(this);
    this.getActiveLayout = this.getActiveLayout.bind(this);
    this.setLayout = this.setLayout.bind(this);
    this.setRenderMethod = this.setRenderMethod.bind(this);
    this.getRenderMethods = this.getRenderMethods.bind(this);
    this.getActiveRenderMethod = this.getActiveRenderMethod.bind(this);
    this.getViewPort = this.getViewPort.bind(this);
    this.updateDimensions = this.updateDimensions.bind(this);
    this.dragCallback = this.dragCallback.bind(this);
    this.clickCallback = this.clickCallback.bind(this);
    this.zoomCallback = this.zoomCallback.bind(this);
    this.drawViewport = this.drawViewport.bind(this);
    this.drawViewportByName = this.drawViewportByName.bind(this);
    this.drawLayout = this.drawLayout.bind(this);
  }

  componentWillMount() {
    const drawViewportByName = this.drawViewportByName;

    this.dragCenter = false;
    this.dragInViewport = null;
    this.center = [0.5, 0.5];
    this.layout = this.props.layout || '3xT';
    this.viewports = [];

    function drawCallback(data, envelope) {
      this.dataToDraw = data;
      drawViewportByName(this.name);
    }

    // Init viewports from props
    Object.keys(this.props.renderers).forEach((name) => {
      const item = this.props.renderers[name];
      const imageBuilder = item.builder;
      const painter = item.painter;

      // Renderer is an ImageBuilder
      if (imageBuilder) {
        imageBuilder.onImageReady(drawCallback).context(item);
      }
      // Renderer is a Painter
      if (painter) {
        painter.onPainterReady(drawCallback).context(item);
      }

      this.viewports.push({
        name,
        active: false,
      });
    });
  }

  componentDidMount() {
    // Listen to window resize
    this.sizeSubscription = sizeHelper.onSizeChangeForElement(
      this.canvasRenderer.parentNode,
      this.updateDimensions
    );

    // Make sure we monitor window size if it is not already the case
    sizeHelper.startListening();
    this.updateDimensions();

    // Attach mouse listener
    this.mouseHandler = new MouseHandler(this.canvasRenderer);

    this.mouseHandler.attach({
      drag: this.dragCallback,
      click: this.clickCallback,
      zoom: this.zoomCallback,
    });
  }

  componentDidUpdate(nextProps, nextState) {
    this.drawLayout();
  }

  componentWillUnmount() {
    this.off();

    // Free mouseHandler
    if (this.mouseHandler) {
      this.mouseHandler.destroy();
      this.mouseHandler = null;
    }

    // Remove window listener
    if (this.sizeSubscription) {
      this.sizeSubscription.unsubscribe();
      this.sizeSubscription = null;
    }
  }

  onActiveViewportChange(callback) {
    return this.on(ACTIVE_VIEWPORT_CHANGE, callback);
  }

  onLayoutChange(callback) {
    return this.on(LAYOUT_CHANGE, callback);
  }

  getActiveLayout() {
    return this.layout;
  }

  setLayout(name) {
    this.layout = name;
    this.drawLayout();
    this.emit(LAYOUT_CHANGE, name);
  }

  setRenderMethod(name) {
    this.viewports.forEach((viewport) => {
      if (viewport.active) {
        viewport.name = name;
        this.emit(ACTIVE_VIEWPORT_CHANGE, viewport);
      }
    });
    this.drawViewportByName(null);
  }

  getRenderMethods() {
    return Object.keys(this.props.renderers);
  }

  getActiveRenderMethod() {
    let name = 'No render method';
    this.viewports.forEach((viewport) => {
      if (viewport.active) {
        name = viewport.name;
      }
    });
    return name;
  }

  getViewPort(event) {
    let count = this.viewports.length;
    const x = event.relative.x;
    const y = event.relative.y;

    while (count) {
      count -= 1;
      const area =
        this.viewports[count].activeArea || this.viewports[count].region;
      if (
        x >= area[0] &&
        y >= area[1] &&
        x <= area[0] + area[2] &&
        y <= area[1] + area[3]
      ) {
        return this.viewports[count];
      }
    }

    return null;
  }

  updateDimensions() {
    const el = this.canvasRenderer.parentNode;
    const elSize = sizeHelper.getSize(el);

    if (
      el &&
      (this.state.width !== elSize.clientWidth ||
        this.state.height !== elSize.clientHeight)
    ) {
      this.setState({
        width: elSize.clientWidth,
        height: elSize.clientHeight,
      });
      return true;
    }
    return false;
  }

  dragCallback(event, envelope) {
    const viewport = this.getViewPort(event);

    if ((viewport || this.dragInViewport) && !this.dragCenter) {
      this.dragInViewport = this.dragInViewport || viewport;

      // Forward event to viewport event handler
      const renderer = this.props.renderers[this.dragInViewport.name];
      const imageBuilder = renderer.builder;
      const listeners = imageBuilder ? imageBuilder.getListeners() : null; // FIXME ?

      if (listeners && listeners.drag) {
        // Update relative information
        event.activeArea = this.dragInViewport.activeArea;

        // Forward event
        listeners.drag(event, envelope);
      }
    } else {
      this.dragCenter = true;

      // Update center and redraw
      this.center[0] = event.relative.x / this.state.width;
      this.center[1] = event.relative.y / this.state.height;
      this.drawLayout();
    }

    if (event.isFinal) {
      this.dragCenter = false;
      this.dragInViewport = null;
    }
  }

  clickCallback(event, envelope) {
    // Reset any previous drag state
    this.dragCenter = false;
    this.dragInViewport = null;

    const viewport = this.getViewPort(event);

    if (viewport) {
      this.viewports.forEach((item) => {
        item.active = false;
      });
      viewport.active = true;

      // Forward event to viewport event handler
      const renderer = this.props.renderers[viewport.name];
      const imageBuilder = renderer.builder;
      const listeners = imageBuilder ? imageBuilder.getListeners() : null; // FIXME ?

      if (listeners && listeners.click) {
        // Update relative information
        event.activeArea = viewport.activeArea;

        // Forward event
        listeners.click(event, envelope);
      }

      // Let's other know that the active viewport has changed
      this.emit(ACTIVE_VIEWPORT_CHANGE, viewport);
    }

    // Redraw the outline with the appropriate color for active
    this.drawLayout();
  }

  zoomCallback(event, envelope) {
    const viewport = this.getViewPort(event);

    if (viewport) {
      // Forward event to viewport event handler
      const renderer = this.props.renderers[viewport.name];
      const imageBuilder = renderer.builder;
      const listeners = imageBuilder ? imageBuilder.getListeners() : null;

      if (listeners && listeners.zoom) {
        // Update relative information
        event.activeArea = viewport.activeArea;

        // Forward event
        listeners.zoom(event, envelope);
      }
    }
  }

  drawViewport(viewport) {
    const renderer = this.props.renderers[viewport.name];
    const region = viewport.region;
    const ctx = this.canvasRenderer
      ? this.canvasRenderer.getContext('2d')
      : null;

    if (
      !ctx ||
      !renderer ||
      (renderer.builder && !renderer.dataToDraw) ||
      (renderer.painter && !renderer.painter.isReady())
    ) {
      return;
    }

    if (renderer.painter) {
      const location = {
        x: region[0] + 2,
        y: region[1] + 2,
        width: region[2] - 4,
        height: region[3] - 4,
      };
      viewport.activeArea = [].concat(viewport.region);
      renderer.painter.paint(ctx, location);
    } else {
      // Assume Image builder
      const dataToDraw = this.props.renderers[viewport.name].dataToDraw;
      const w = region[2] - 2;
      const h = region[3] - 2;
      const iw = dataToDraw.outputSize[0];
      const ih = dataToDraw.outputSize[1];
      const zoomLevel = Math.min(w / iw, h / ih);

      ctx.clearRect(region[0] + 1, region[1] + 1, region[2] - 2, region[3] - 2);

      const tw = Math.floor(iw * zoomLevel) - 2;
      const th = Math.floor(ih * zoomLevel) - 2;
      const tx = 1 + region[0] + (w * 0.5 - tw / 2);
      const ty = 1 + region[1] + (h * 0.5 - th / 2);

      try {
        ctx.drawImage(
          dataToDraw.canvas,
          dataToDraw.area[0],
          dataToDraw.area[1],
          dataToDraw.area[2],
          dataToDraw.area[3], // Source image   [Location,Size]
          tx,
          ty,
          tw,
          th
        ); // Target drawing [Location,Size]

        // Draw cross hair if any
        if (dataToDraw.crosshair) {
          const scale = [tw / dataToDraw.area[2], th / dataToDraw.area[3]];
          const translate = [tx, ty];

          ctx.beginPath();

          ctx.moveTo(translate[0] + scale[0] * dataToDraw.crosshair[0], ty);
          ctx.lineTo(
            translate[0] + scale[0] * dataToDraw.crosshair[0],
            ty + th
          );

          ctx.moveTo(tx, translate[1] + scale[1] * dataToDraw.crosshair[1]);
          ctx.lineTo(
            tx + tw,
            translate[1] + scale[1] * dataToDraw.crosshair[1]
          );

          ctx.strokeStyle = this.props.crosshairColor;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        viewport.activeArea = [tx, ty, tw, th];
      } catch (err) {
        console.log('Error in MultiLayoutRenderer::drawViewport', err);
      }
    }
  }

  drawViewportByName(name) {
    const renderer = name ? this.props.renderers[name] : null;

    // Update image builder if any
    if (renderer && renderer.builder && !renderer.dataToDraw) {
      renderer.builder.update();
      return;
    }

    this.viewports.forEach((viewport) => {
      if (viewport.name === name || name === null) {
        this.drawViewport(viewport);
      }
    });
  }

  drawLayout() {
    const ctx = this.canvasRenderer.getContext('2d');
    const width = this.state.width;
    const height = this.state.height;
    const centerPx = [this.center[0] * width, this.center[1] * height];
    const spacing = this.props.spacing;
    const regions = layoutFunctions[this.layout](
      centerPx,
      spacing,
      width,
      height
    );
    const viewports = this.viewports;
    const numberOfRegions = regions.length;

    ctx.canvas.width = width;
    ctx.canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < numberOfRegions; ++i) {
      const region = regions.shift();
      if (i < viewports.length) {
        viewports[i].region = region;
      } else {
        viewports.push({
          name: this.getRenderMethods()[0],
          region,
          active: false,
        });
      }
      ctx.beginPath();
      ctx.strokeStyle = viewports[i].active
        ? this.props.activeColor
        : this.props.borderColor;
      ctx.rect(...region);
      ctx.stroke();
    }

    // Remove the unused viewports
    while (viewports.length > numberOfRegions) {
      viewports.pop();
    }

    this.drawViewportByName(null);
  }

  render() {
    return (
      <canvas
        className="CanvasMultiImageRenderer"
        ref={(c) => {
          this.canvasRenderer = c;
        }}
        width={this.state.width}
        height={this.state.height}
      />
    );
  }
}

MultiViewRenderer.propTypes = {
  activeColor: PropTypes.string,
  borderColor: PropTypes.string,
  crosshairColor: PropTypes.string,
  layout: PropTypes.string,
  renderers: PropTypes.object,
  spacing: PropTypes.number,
};

MultiViewRenderer.defaultProps = {
  spacing: 10,
  borderColor: '#000000',
  activeColor: '#0000FF',
  crosshairColor: '#000000',
  renderers: {},
  layout: '3xT',
};

// Add Observer pattern to the class using Monologue.js
Monologue.mixInto(MultiViewRenderer);
