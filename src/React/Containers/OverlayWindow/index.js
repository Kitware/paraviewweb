import React     from 'react';
import style     from 'PVWStyle/ReactContainers/OverlayWindow.mcss';

/* eslint-disable react/no-unused-prop-types */

// Clamp, but also let us know how much we cut off
function diffClamp(value, min, max) {
  if (value > max) {
    return { value: max, diff: value - max };
  } else if (value < min) {
    return { value: min, diff: value - min };
  }
  return { value, diff: 0 };
}

// Return extra information about the target element bounds
function getMouseEventInfo(event, divElt) {
  const clientRect = divElt.getBoundingClientRect();
  return {
    relX: event.clientX - clientRect.left,
    relY: event.clientY - clientRect.top,
    eltBounds: clientRect,
  };
}

function createDragHandlers(thisObj) {
  function computeMouseDelta(event, container) {
    const eventInfo = getMouseEventInfo(event, container);
    const delX = event.screenX - thisObj.getLastScreenX();
    const delY = event.screenY - thisObj.getLastScreenY();
    return {
      delX,
      delY,
      eltBounds: eventInfo.eltBounds,
    };
  }
  return {
    topLeft: (event) => {
      const { delX, delY } = computeMouseDelta(event, thisObj.eventContainerDiv);
      const maxX = (thisObj.state.x + thisObj.state.width) - (2 * thisObj.props.marginSize) - thisObj.props.minContentWidth;
      const maxY = (thisObj.state.y + thisObj.state.height) - ((2 * thisObj.props.marginSize) + thisObj.props.titleBarHeight) - thisObj.props.minContentHeight;
      const dx = diffClamp(thisObj.state.x + delX, 0, maxX);
      const dy = diffClamp(thisObj.state.y + delY, 0, maxY);
      thisObj.setState({
        x: dx.value,
        y: dy.value,
        width: thisObj.state.width - (delX - dx.diff),
        height: thisObj.state.height - (delY - dy.diff),
      });
      thisObj.setLastScreenX(event.screenX);
      thisObj.setLastScreenY(event.screenY);
    },
    topRight: (event) => {
      const { delX, delY, eltBounds } = computeMouseDelta(event, thisObj.eventContainerDiv);
      const minWidth = (2 * thisObj.props.marginSize) + thisObj.props.minContentWidth;
      const maxWidth = eltBounds.width - thisObj.state.x;
      const maxY = (thisObj.state.y + thisObj.state.height) - ((2 * thisObj.props.marginSize) + thisObj.props.titleBarHeight) - thisObj.props.minContentHeight;
      const dw = diffClamp(thisObj.state.width + delX, minWidth, maxWidth);
      const dy = diffClamp(thisObj.state.y + delY, 0, maxY);
      thisObj.setState({
        y: dy.value,
        width: dw.value,
        height: thisObj.state.height - (delY - dy.diff),
      });
      thisObj.setLastScreenX(event.screenX);
      thisObj.setLastScreenY(event.screenY);
    },
    bottomLeft: (event) => {
      const { delX, delY, eltBounds } = computeMouseDelta(event, thisObj.eventContainerDiv);
      const maxX = (thisObj.state.x + thisObj.state.width) - (2 * thisObj.props.marginSize) - thisObj.props.minContentWidth;
      const minHeight = (2 * thisObj.props.marginSize) + thisObj.props.titleBarHeight + thisObj.props.minContentHeight;
      const maxHeight = eltBounds.height - thisObj.state.y;
      const dx = diffClamp(thisObj.state.x + delX, 0, maxX);
      const dh = diffClamp(thisObj.state.height + delY, minHeight, maxHeight);
      thisObj.setState({
        x: dx.value,
        width: thisObj.state.width - (delX - dx.diff),
        height: dh.value,
      });
      thisObj.setLastScreenX(event.screenX);
      thisObj.setLastScreenY(event.screenY);
    },
    bottomRight: (event) => {
      const { delX, delY, eltBounds } = computeMouseDelta(event, thisObj.eventContainerDiv);
      const minWidth = (2 * thisObj.props.marginSize) + thisObj.props.minContentWidth;
      const maxWidth = eltBounds.width - thisObj.state.x;
      const minHeight = (2 * thisObj.props.marginSize) + thisObj.props.titleBarHeight + thisObj.props.minContentHeight;
      const maxHeight = eltBounds.height - thisObj.state.y;
      const dw = diffClamp(thisObj.state.width + delX, minWidth, maxWidth);
      const dh = diffClamp(thisObj.state.height + delY, minHeight, maxHeight);
      thisObj.setState({
        width: dw.value,
        height: dh.value,
      });
      thisObj.setLastScreenX(event.screenX);
      thisObj.setLastScreenY(event.screenY);
    },
    top: (event) => {
      const { delY } = computeMouseDelta(event, thisObj.eventContainerDiv);
      const maxY = (thisObj.state.y + thisObj.state.height) - ((2 * thisObj.props.marginSize) + thisObj.props.titleBarHeight) - thisObj.props.minContentHeight;
      const dy = diffClamp(thisObj.state.y + delY, 0, maxY);
      thisObj.setState({
        y: dy.value,
        height: thisObj.state.height - (delY - dy.diff),
      });
      thisObj.setLastScreenX(event.screenX);
      thisObj.setLastScreenY(event.screenY);
    },
    right: (event) => {
      const { delX, eltBounds } = computeMouseDelta(event, thisObj.eventContainerDiv);
      const minWidth = (2 * thisObj.props.marginSize) + thisObj.props.minContentWidth;
      const maxWidth = eltBounds.width - thisObj.state.x;
      const dw = diffClamp(thisObj.state.width + delX, minWidth, maxWidth);
      thisObj.setState({
        width: dw.value,
      });
      thisObj.setLastScreenX(event.screenX);
      thisObj.setLastScreenY(event.screenY);
    },
    bottom: (event) => {
      const { delY, eltBounds } = computeMouseDelta(event, thisObj.eventContainerDiv);
      const minHeight = (2 * thisObj.props.marginSize) + thisObj.props.titleBarHeight + thisObj.props.minContentHeight;
      const maxHeight = eltBounds.height - thisObj.state.y;
      const dh = diffClamp(thisObj.state.height + delY, minHeight, maxHeight);
      thisObj.setState({
        height: dh.value,
      });
      thisObj.setLastScreenX(event.screenX);
      thisObj.setLastScreenY(event.screenY);
    },
    left: (event) => {
      const { delX } = computeMouseDelta(event, thisObj.eventContainerDiv);
      const maxX = (thisObj.state.x + thisObj.state.width) - (2 * thisObj.props.marginSize) - thisObj.props.minContentWidth;
      const dx = diffClamp(thisObj.state.x + delX, 0, maxX);
      thisObj.setState({
        x: dx.value,
        width: thisObj.state.width - (delX - dx.diff),
      });
      thisObj.setLastScreenX(event.screenX);
      thisObj.setLastScreenY(event.screenY);
    },
    move: (event) => {
      const { eltBounds } = computeMouseDelta(event, thisObj.eventContainerDiv);
      const maxX = eltBounds.width - thisObj.state.width;
      const maxY = eltBounds.height - thisObj.state.height;
      const dx = diffClamp(thisObj.state.x + (event.screenX - thisObj.getLastScreenX()), 0, maxX);
      const dy = diffClamp(thisObj.state.y + (event.screenY - thisObj.getLastScreenY()), 0, maxY);
      thisObj.setState({
        x: dx.value,
        y: dy.value,
      });
      thisObj.setLastScreenX(event.screenX);
      thisObj.setLastScreenY(event.screenY);
    },
  };
}

export default React.createClass({

  displayName: 'OverlayWindow',

  propTypes: {
    children: React.PropTypes.oneOfType([React.PropTypes.element, React.PropTypes.array]),
    cloneChildren: React.PropTypes.bool,
    height: React.PropTypes.number,
    hotCornerExtra: React.PropTypes.number,  // FIXME: Constrain to (positive) integer?
    marginSize: React.PropTypes.number,
    minContentHeight: React.PropTypes.number,
    minContentWidth: React.PropTypes.number,
    onResize: React.PropTypes.func,
    onActive: React.PropTypes.func,
    title: React.PropTypes.oneOfType([React.PropTypes.string, React.PropTypes.element, React.PropTypes.array, React.PropTypes.object]),
    titleBarHeight: React.PropTypes.number,
    front: React.PropTypes.bool,
    visible: React.PropTypes.bool,
    width: React.PropTypes.number,
    x: React.PropTypes.number,
    y: React.PropTypes.number,
  },

  getDefaultProps() {
    return {
      cloneChildren: false,
      height: 100,
      hotCornerExtra: 2,
      marginSize: 5,
      minContentHeight: 2,
      minContentWidth: 2,
      resizable: true,
      title: null,
      titleBarHeight: 25,
      visible: true,
      width: 200,
      front: false,
      onActive: () => {},
      x: 10,
      y: 10,
    };
  },

  getInitialState() {
    return {
      x: this.props.x,
      y: this.props.y,
      height: this.props.height,
      width: this.props.width,
      cursor: null,
      dragging: false,
    };
  },

  componentWillMount() {
    this.lastScreenY = 0;
    this.lastScreenX = 0;
    this.getLastScreenX = () => this.lastScreenX;
    this.getLastScreenY = () => this.lastScreenY;
    this.setLastScreenX = (x) => { this.lastScreenX = x; };
    this.setLastScreenY = (y) => { this.lastScreenY = y; };
    this.handlerMap = createDragHandlers(this);
    this.dragHandler = this.mouseMove;
  },

  componentDidMount() {
    if (this.props.onResize) {
      this.props.onResize(this.state.width, this.state.height, this);
    }
  },

  componentDidUpdate(prevProps, prevState) {
    if (this.state.width !== prevState.width || this.state.height !== prevState.height) {
      if (this.props.onResize) {
        this.props.onResize(this.state.width, this.state.height, this);
      }
    }
  },

  computeActionRegion(evt) {
    const { relX: x, relY: y } = getMouseEventInfo(evt, this.mainContainerDiv);
    this.setLastScreenX(evt.screenX);
    this.setLastScreenY(evt.screenY);

    const contentWidth = this.state.width - (2 * this.props.marginSize);
    const contentHeight = this.state.height - ((2 * this.props.marginSize) + this.props.titleBarHeight);

    const actionStruct = {
      cursor: null,
      dragAction: null,
    };

    if (evt.target.nodeName === 'OPTION') {
      return actionStruct;
    }

    if (x < this.props.marginSize) {
      actionStruct.cursor = 'ew-resize';
      actionStruct.dragAction = this.handlerMap.left;
    } else if (x > (this.props.marginSize + contentWidth)) {
      actionStruct.cursor = 'ew-resize';
      actionStruct.dragAction = this.handlerMap.right;
    }

    if (y < this.props.marginSize) {
      actionStruct.cursor = 'ns-resize';
      actionStruct.dragAction = this.handlerMap.top;
    } else if (y < (this.props.marginSize + this.props.titleBarHeight)) {
      actionStruct.cursor = 'move';
      actionStruct.dragAction = this.handlerMap.move;
    } else if (y >= (this.props.marginSize + this.props.titleBarHeight + contentHeight)
      && y <= ((2 * this.props.marginSize) + this.props.titleBarHeight + contentHeight)) {
      actionStruct.cursor = 'ns-resize';
      actionStruct.dragAction = this.handlerMap.bottom;
    }

    return actionStruct;
  },

  hotCornerDown(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    switch (evt.currentTarget.className) {
      case 'ulCorner':
        this.dragHandler = this.handlerMap.topLeft;
        this.setState({ cursor: 'nwse-resize', dragging: true });
        break;
      case 'urCorner':
        this.dragHandler = this.handlerMap.topRight;
        this.setState({ cursor: 'nesw-resize', dragging: true });
        break;
      case 'llCorner':
        this.dragHandler = this.handlerMap.bottomLeft;
        this.setState({ cursor: 'nesw-resize', dragging: true });
        break;
      case 'lrCorner':
        this.dragHandler = this.handlerMap.bottomRight;
        this.setState({ cursor: 'nwse-resize', dragging: true });
        break;
      default:
        break;
    }
  },

  mouseMove(evt) {
    const actionStruct = this.computeActionRegion(evt);
    this.setState({ cursor: actionStruct.cursor });
  },

  mouseDown(evt) {
    const actionStruct = this.computeActionRegion(evt);
    if (actionStruct.dragAction !== null) {
      evt.preventDefault();
      this.dragHandler = actionStruct.dragAction;
      this.setState({ cursor: actionStruct.cursor, dragging: true });
      this.props.onActive(true, this);
    }
  },

  mouseUp(evt) {
    const actionStruct = this.computeActionRegion(evt);
    this.dragHandler = this.mouseMove;
    this.setState({ cursor: actionStruct.cursor, dragging: false });
    setImmediate(() => this.props.onActive(false, this));
  },

  render() {
    if (!this.props.visible) {
      return null;
    }

    // Configure the initial event container props and style overrides
    const eventDivProps = {
      className: this.props.front ? style.frontEventContainer : style.backEventContainer,
      ref: c => (this.eventContainerDiv = c),
      style: {},
    };

    // Configure the initial main container props and style overrides
    const mainDivProps = {
      className: style.mainContainer,
      ref: c => (this.mainContainerDiv = c),
      style: {
        width: this.state.width,
        height: this.state.height,
        top: this.state.y,
        left: this.state.x,
      },
    };

    // Make adjustments based on whether or not we're currently dragging
    if (this.state.dragging === true) {
      eventDivProps.onMouseUp = this.mouseUp;
      eventDivProps.onMouseMove = this.dragHandler;
      mainDivProps.style.pointerEvents = 'none';
      eventDivProps.style.pointerEvents = 'auto';
      if (this.state.cursor !== null) {
        eventDivProps.style.cursor = this.state.cursor;
      }
    } else {
      mainDivProps.onMouseDown = this.mouseDown;
      mainDivProps.onMouseUp = this.mouseUp;
      mainDivProps.onMouseMove = this.dragHandler;
      mainDivProps.style.pointerEvents = 'auto';
      eventDivProps.style.pointerEvents = 'none';
      if (this.state.cursor !== null) {
        mainDivProps.style.cursor = this.state.cursor;
      }
    }

    // Configure the content container props and style overrides
    const contentDivProps = {
      className: style.content,
      style: {
        top: this.props.marginSize + this.props.titleBarHeight,
        right: this.props.marginSize,
        bottom: this.props.marginSize,
        left: this.props.marginSize,
      },
    };

    if (this.state.dragging === true) {
      contentDivProps.style.opacity = 0.5;
      contentDivProps.style.pointerEvents = 'none';
    }

    // Configure the title bar props and style overrides
    const titleBarProps = {
      className: style.titleBar,
      style: {
        top: this.props.marginSize,
        right: this.props.marginSize,
        left: this.props.marginSize,
        height: this.props.titleBarHeight,
        lineHeight: `${this.props.titleBarHeight}px`,
      },
    };

    // Configure the hot corner divs
    const offset = this.props.hotCornerExtra;
    const w = (2 * offset) + this.props.marginSize;

    // Clone children in order to add a prop which could force redraw of children
    const overlayContentSize = `${this.state.width}x${this.state.height}`;
    const children = this.props.cloneChildren ? React.Children.map(this.props.children, (child, idx) =>
      React.cloneElement(child, { overlayContentSize })
    ) : this.props.children;

    return (
      <div {...eventDivProps}>
        <div {...mainDivProps}>
          <div
            className="ulCorner" key={0} onMouseDown={this.hotCornerDown}
            style={{ position: 'absolute', width: w, height: w, top: -offset, left: -offset, cursor: 'nwse-resize', pointerEvents: 'auto' }}
          />
          <div
            className="urCorner" key={1} onMouseDown={this.hotCornerDown}
            style={{ position: 'absolute', width: w, height: w, top: -offset, right: -offset, cursor: 'nesw-resize', pointerEvents: 'auto' }}
          />
          <div
            className="llCorner" key={2} onMouseDown={this.hotCornerDown}
            style={{ position: 'absolute', width: w, height: w, bottom: -offset, left: -offset, cursor: 'nesw-resize', pointerEvents: 'auto' }}
          />
          <div
            className="lrCorner" key={3} onMouseDown={this.hotCornerDown}
            style={{ position: 'absolute', width: w, height: w, bottom: -offset, right: -offset, cursor: 'nwse-resize', pointerEvents: 'auto' }}
          />
          <div {...titleBarProps}>
            {this.props.title}
          </div>
          <div {...contentDivProps}>
            {children}
          </div>
        </div>
      </div>);
  },
});
