import React from 'react';
import PropTypes from 'prop-types';
import Monologue from 'monologue.js';

import style from 'PVWStyle/ReactRenderers/ImageRenderer.mcss';

import ContentEditable from '../../Widgets/ContentEditableWidget';
import ImageExporter from '../../../Common/Misc/ImageExporter';
import sizeHelper from '../../../Common/Misc/SizeHelper';
import MouseHandler from '../../../Interaction/Core/MouseHandler';

const DRAW_DONE = 'ImageRenderer.draw.done';

function onImageLoaded() {
  const image = this;

  if (image.drawToCanvas) {
    if (image.firstRender) {
      image.firstRender = false;
      image.component.resetCamera();
    } else {
      image.drawToCanvas();
    }
  }
}

function drawToCanvasAsImage() {
  const image = this;
  const component = this.component;
  const canvas = component.canvasRenderer;
  const ctx = canvas.getContext('2d');
  const w = component.state.width;
  const h = component.state.height;
  const iw = image ? image.width : 500;
  const ih = image ? image.height : 500;
  const zoomLevel = component.zoom;
  const drawingCenter = component.center;

  if (!component.enableRendering) {
    return;
  }

  ctx.clearRect(0, 0, w, h);

  const tw = Math.floor(iw * zoomLevel);
  const th = Math.floor(ih * zoomLevel);
  const tx = w * drawingCenter[0] - tw / 2;
  const ty = h * drawingCenter[1] - th / 2;

  image.activeArea = [tx, ty, tw, th];

  try {
    ctx.drawImage(
      image,
      0,
      0,
      iw,
      ih, // Source image   [Location,Size]
      tx,
      ty,
      tw,
      th
    ); // Target drawing [Location,Size]

    component.drawDone();
  } catch (err) {
    console.log('Error in ImageRenderer::drawToCanvasAsImage', err);
  }
}

function drawToCanvasAsBuffer() {
  // canvas: this.bgCanvas.el,
  // area: [0, 0, width, height],
  // outputSize: [destWidth, destHeight],
  // crosshair: [lineX * scaleX, lineY * scaleY],
  // type: this.renderMethod

  const image = this;
  const data = this.data;
  const component = this.component;
  const destCanvas = component.canvasRenderer;
  const ctx = destCanvas.getContext('2d');
  const w = component.state.width;
  const h = component.state.height;
  const iw = data.outputSize[0];
  const ih = data.outputSize[1];
  const zoomLevel = component.zoom;
  const drawingCenter = component.center;

  if (!component.enableRendering) {
    return;
  }

  ctx.clearRect(0, 0, w, h);

  const tw = Math.floor(iw * zoomLevel);
  const th = Math.floor(ih * zoomLevel);
  const tx = w * drawingCenter[0] - tw / 2;
  const ty = h * drawingCenter[1] - th / 2;

  try {
    ctx.drawImage(
      data.canvas,
      data.area[0],
      data.area[1],
      data.area[2],
      data.area[3], // Source image   [Location,Size]
      tx,
      ty,
      tw,
      th
    ); // Target drawing [Location,Size]

    image.activeArea = [tx, ty, tw, th];

    const scale = [tw / data.area[2], th / data.area[3]];
    const translate = [tx, ty];

    if (data.crosshair) {
      ctx.beginPath();

      ctx.moveTo(translate[0] + scale[0] * data.crosshair[0], 0);
      ctx.lineTo(translate[0] + scale[0] * data.crosshair[0], h);

      ctx.moveTo(0, translate[1] + scale[1] * data.crosshair[1]);
      ctx.lineTo(w, translate[1] + scale[1] * data.crosshair[1]);

      ctx.strokeStyle = component.props.crosshairColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    component.drawDone();
  } catch (err) {
    console.log('Error in ImageRenderer::drawToCanvasAsBuffer', err);
  }
}

/**
 * This React component expect the following input properties:
 *   - minZoom:
 *       Default value is 0.1
 *   - maxZoom:
 *       Default value is 10
 *   - crosshairColor:
 *       Default value is '#000'
 *
 * Available methods:
 *   - renderImage({url: imageURL})
 *   - renderCanvas({ outputSize: [width, height], canvas: canvasDomElement, area: [x,y,width,height], crosshair: [x,y]})
 *   - resetCamera()
 */
export default class ImageRenderer extends React.Component {
  constructor(props) {
    super(props);

    const metadata = props.imageBuilder
      ? props.imageBuilder.queryDataModel.originalData.metadata
      : {} || {};
    const title = metadata.title || 'No title';
    const description = metadata.description || 'No description';

    this.state = {
      width: 200,
      height: 200,
      dialog: false,
      title,
      description,
    };

    // Bind callback
    this.onDrawDone = this.onDrawDone.bind(this);
    this.getRenderingCanvas = this.getRenderingCanvas.bind(this);
    this.enableLocalRendering = this.enableLocalRendering.bind(this);
    this.updateMetadata = this.updateMetadata.bind(this);
    this.updateTitle = this.updateTitle.bind(this);
    this.updateDescription = this.updateDescription.bind(this);
    this.toggleDialog = this.toggleDialog.bind(this);
    this.recordImages = this.recordImages.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.zoomCallback = this.zoomCallback.bind(this);
    this.dragCallback = this.dragCallback.bind(this);
    this.clickCallback = this.clickCallback.bind(this);
    this.updateDimensions = this.updateDimensions.bind(this);
    this.resetCamera = this.resetCamera.bind(this);
    this.drawDone = this.drawDone.bind(this);
    this.renderImage = this.renderImage.bind(this);
    this.renderCanvas = this.renderCanvas.bind(this);
  }

  componentWillMount() {
    this.enableLocalRendering();
    this.imageToDraw = new Image();

    // Monitor image builder
    if (this.props.imageBuilder) {
      this.imageBuilderSubscription = this.props.imageBuilder.onImageReady(
        (data, envelope) => {
          if (data.url) {
            this.renderImage(data);
          } else {
            this.renderCanvas(data);
          }
        }
      );
    }

    // Shared properties
    this.zoom = 1;
    this.baseZoom = 1;
    this.center = [0.5, 0.5];
    this.baseCenter = [0.5, 0.5];

    // Attach context to image
    this.imageToDraw.component = this;
    this.imageToDraw.onload = onImageLoaded;
    this.imageToDraw.firstRender = true;

    // Listen to keyDown
    document.addEventListener('keydown', this.handleKeyDown);

    // Add image exporter
    this.sendToServer = false;
    this.imageExporter = new ImageExporter();
  }

  componentDidMount() {
    // Listen to window resize
    this.sizeSubscription = sizeHelper.onSizeChange(
      this.rootContainer,
      this.updateDimensions
    );

    // Make sure we monitor window size if it is not already the case
    sizeHelper.startListening();

    this.updateDimensions();
    if (this.imageToDraw.drawToCanvas) {
      this.imageToDraw.drawToCanvas();
    }

    // Attach mouse listener
    this.mouseHandler = new MouseHandler(this.canvasRenderer);

    // Allow modifier via press action
    if (this.props.modifiers) {
      this.mouseHandler.toggleModifierOnPress(true, this.props.modifiers);
    }

    this.mouseHandler.attach({
      drag: this.dragCallback,
      zoom: this.zoomCallback,
      click: this.clickCallback,
    });

    this.mouseHandler.on('modifier.change', (change, envelope) => {
      const image = this.imageToDraw;
      const ctx = this.canvasRenderer.getContext('2d');

      ctx.beginPath();
      ctx.fillStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#000000';
      ctx.arc(
        change.event.relative.x,
        change.event.relative.y,
        this.props.pressRadius,
        0,
        2 * Math.PI,
        false
      );
      ctx.fill();
      ctx.stroke();

      setTimeout(() => {
        image.drawToCanvas();
      }, 300);
    });

    // Provide canvas to ImageBuilder if possible
    if (this.props.imageBuilder && this.props.imageBuilder.setRenderer) {
      this.props.imageBuilder.setRenderer(this);
    }
  }

  componentDidUpdate(nextProps, nextState) {
    this.mouseHandler.setEnable(!nextProps.userData.disableMouseListener);
    this.updateDimensions();
    if (this.imageToDraw.drawToCanvas) {
      this.imageToDraw.drawToCanvas();
    }
  }

  componentWillUnmount() {
    this.off();
    // Remove key listener
    document.removeEventListener('keydown', this.handleKeyDown);

    // Remove listener
    if (this.imageBuilderSubscription) {
      this.imageBuilderSubscription.unsubscribe();
      this.imageBuilderSubscription = null;
    }

    // Clean image
    this.imageToDraw.onload = null;
    this.imageToDraw.drawToCanvas = null;
    this.imageToDraw.component = null;
    this.imageToDraw.data = null;
    this.imageToDraw = null;

    // Free mouseHandler
    this.mouseHandler.destroy();
    this.mouseHandler = null;

    // Remove window listener
    if (this.sizeSubscription) {
      this.sizeSubscription.unsubscribe();
      this.sizeSubscription = null;
    }

    // Provide canvas to ImageBuilder if possible
    if (this.props.imageBuilder && this.props.imageBuilder.setRenderer) {
      this.props.imageBuilder.setRenderer(null);
    }
  }

  onDrawDone(callback) {
    return this.on(DRAW_DONE, callback);
  }

  getRenderingCanvas() {
    return this.canvasRenderer;
  }

  enableLocalRendering(enable = true) {
    this.enableRendering = enable;
  }

  updateMetadata() {
    this.setState({
      dialog: !this.state.dialog,
    });
    this.imageExporter.updateMetadata({
      title: this.state.title,
      description: this.state.description,
      image: this.thumbnail.src,
      path: this.props.imageBuilder.queryDataModel.basepath,
    });
  }

  updateTitle(event) {
    const title = event.target.value;
    this.setState({ title });
  }

  updateDescription(event) {
    const description = event.target.value;
    this.setState({ description });
  }

  toggleDialog() {
    this.setState({
      dialog: !this.state.dialog,
    });
  }

  handleKeyDown(event) {
    if (event.keyCode === 82) {
      // r => reset camera
      this.resetCamera();
    } else if (
      event.keyCode === 85 &&
      !this.state.dialog &&
      (event.altKey || event.ctrlKey || event.metaKey)
    ) {
      // u => Update dataset metadata
      const thumbnailImage = this.thumbnail;

      if (this.imageToDraw.data.canvas.nodeName === 'CANVAS') {
        if (
          this.imageToDraw.data.canvas.width ===
            this.imageToDraw.data.area[2] &&
          this.imageToDraw.data.canvas.height === this.imageToDraw.data.area[3]
        ) {
          thumbnailImage.src = this.imageToDraw.data.canvas.toDataURL(
            'image/png'
          );
        } else {
          // Need to extract region
          thumbnailImage.src = this.imageExporter.extractCanvasRegion(
            this.imageToDraw.data.canvas,
            this.imageToDraw.data.area,
            this.imageToDraw.data.outputSize
          );
        }
      } else {
        // Use image URL
        thumbnailImage.src = this.imageToDraw.data.canvas.src;
      }

      this.setState({
        dialog: !this.state.dialog,
      });
    }
  }

  recordImages(record) {
    this.sendToServer = record;
  }

  zoomCallback(event, envelope) {
    let eventManaged = false;

    // Extend event with active area
    event.activeArea = this.imageToDraw.activeArea;

    // Handle mouse listener if any
    if (this.props.listener && this.props.listener.zoom) {
      eventManaged = this.props.listener.zoom(event, envelope);
    }

    // Handle local zoom
    if (!eventManaged) {
      if (event.isFirst) {
        this.baseZoom = this.zoom;
      }
      let zoom = this.baseZoom * event.scale;

      if (zoom < this.props.minZoom) {
        zoom = this.props.minZoom;
      }
      if (zoom > this.props.maxZoom) {
        zoom = this.props.maxZoom;
      }

      if (this.zoom !== zoom) {
        // Update center to keep the location of the pointer the same
        const x = this.center[0];
        const y = this.center[1];
        const deltaZoom = zoom / this.zoom;
        const fixedX = event.relative.x / this.state.width;
        const fixedY = event.relative.y / this.state.height;

        this.zoom = zoom;
        this.center[0] = fixedX + deltaZoom * (x - fixedX);
        this.center[1] = fixedY + deltaZoom * (y - fixedY);

        if (this.imageToDraw.drawToCanvas) {
          this.imageToDraw.drawToCanvas();
        }
      }

      if (event.isFinal) {
        this.baseZoom = this.zoom;
      }
    }

    // Store center
    this.baseCenter = [this.center[0], this.center[1]];
  }

  dragCallback(event, envelope) {
    let eventManaged = false;

    // Extend event with active area
    event.activeArea = this.imageToDraw.activeArea;

    // Store zoom
    this.baseZoom = this.zoom;

    // Handle mouse listener if any
    if (this.props.listener && this.props.listener.drag) {
      eventManaged = this.props.listener.drag(event, envelope);
    }

    // Handle drag to pan
    if (!eventManaged) {
      if (event.isFirst) {
        this.baseCenter = [this.center[0], this.center[1]];
      }

      const deltaX = event.deltaX / this.state.width;
      const deltaY = event.deltaY / this.state.height;

      if (event.isFinal) {
        this.baseCenter = [this.center[0], this.center[1]];
      } else {
        this.center[0] = this.baseCenter[0] + deltaX;
        this.center[1] = this.baseCenter[1] + deltaY;
      }

      if (this.imageToDraw.drawToCanvas) {
        this.imageToDraw.drawToCanvas();
      }
    }
  }

  clickCallback(event, envelope) {
    // Extend event with active area
    event.activeArea = this.imageToDraw.activeArea;

    // Handle mouse listener if any
    if (this.props.listener && this.props.listener.click) {
      this.props.listener.click(event, envelope);
    }
  }

  updateDimensions() {
    if (!this.rootContainer) {
      return false;
    }
    const el = this.rootContainer.parentNode;
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

  resetCamera() {
    const w = this.state.width;
    const h = this.state.height;
    const image = this.imageToDraw;
    const iw = image ? image.width : 500;
    const ih = image ? image.height : 500;

    this.zoom = Math.min(w / iw, h / ih);
    this.baseZoom = Math.min(w / iw, h / ih);
    this.baseCenter = [0.5, 0.5];
    this.center = [0.5, 0.5];

    image.drawToCanvas();
  }

  drawDone() {
    this.emit(DRAW_DONE, this);
  }

  renderImage(data) {
    this.imageToDraw.drawToCanvas = drawToCanvasAsImage;
    this.imageToDraw.src = data.url;
  }

  renderCanvas(data) {
    this.imageToDraw.drawToCanvas = drawToCanvasAsBuffer;
    this.imageToDraw.data = data;
    this.imageToDraw.width = data.outputSize[0];
    this.imageToDraw.height = data.outputSize[1];

    // Send data to server for export
    if (this.sendToServer) {
      this.imageExporter.exportImage(data);
    }

    // No need to wait to render it
    if (this.imageToDraw.firstRender) {
      this.imageToDraw.firstRender = false;
      this.resetCamera();
    } else {
      this.imageToDraw.drawToCanvas();
    }
  }

  render() {
    return (
      <div
        className={style.container}
        ref={(c) => {
          this.rootContainer = c;
        }}
      >
        <canvas
          className={style.renderer}
          ref={(c) => {
            this.canvasRenderer = c;
          }}
          width={this.state.width}
          height={this.state.height}
        />
        <div className={this.state.dialog ? style.dialog : style.hidden}>
          <div className={style.inside}>
            <img
              ref={(c) => {
                this.thumbnail = c;
              }}
              className={style.thumbnail}
              height={Math.floor(this.state.height / 2)}
              alt="thumbnail"
            />
            <div
              className={style.metadata}
              style={{ height: `${Math.floor(this.state.height / 2)}px` }}
            >
              <strong className={style.title}>
                <ContentEditable
                  html={this.state.title}
                  onChange={this.updateTitle}
                />
              </strong>
              <div className={style.description}>
                <ContentEditable
                  html={this.state.description}
                  onChange={this.updateDescription}
                />
              </div>
            </div>
            <div className={style.buttons}>
              <button
                className={style.button}
                type="button"
                onClick={this.toggleDialog}
              >
                Cancel
              </button>
              <button
                className={style.button}
                type="button"
                onClick={this.updateMetadata}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

/* eslint-disable react/no-unused-prop-types */

ImageRenderer.propTypes = {
  crosshairColor: PropTypes.string,
  imageBuilder: PropTypes.object,
  listener: PropTypes.object,
  maxZoom: PropTypes.number,
  minZoom: PropTypes.number,
  modifiers: PropTypes.array,
  pressRadius: PropTypes.number,
  userData: PropTypes.object,
};

ImageRenderer.defaultProps = {
  minZoom: 0.1,
  maxZoom: 10,
  crosshairColor: '#000',
  modifiers: [0, 2],
  pressRadius: 50,
  userData: {},
  listener: null,
  imageBuilder: undefined,
};

Monologue.mixInto(ImageRenderer);
