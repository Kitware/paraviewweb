import Hammer from 'hammerjs';
import Monologue from 'monologue.js';

// Module dependencies and constants
const Modifier = {
  NONE: 0,
  ALT: 1,
  META: 2,
  SHIFT: 4,
  CTRL: 8,
};
const eventTypeMapping = {
  mousemove: 'zoom',
  mouseup: 'zoom',
  mousewheel: 'zoom',
  DOMMouseScroll: 'zoom',
};
const TIMEOUT_BETWEEN_ZOOM = 300;

// If the value is N, one mouse-wheel click is equivalent to dragging the cursor
// (120 * N) th of the screen. The magic constant 120 corresponds to one wheel
// click in most browsers.
const MOUSE_WHEEL_SCALE_FACTOR = 1.0 / (120 * 200);

let handlerCount = 0;

function getModifier(e) {
  let modifier = 0;
  if (e.srcEvent) {
    modifier += e.srcEvent.altKey ? Modifier.ALT : 0;
    modifier += e.srcEvent.ctrlKey ? Modifier.CTRL : 0;
    modifier += e.srcEvent.metaKey ? Modifier.META : 0;
    modifier += e.srcEvent.shiftKey ? Modifier.SHIFT : 0;
  }

  return modifier;
}

function getRelative(el, event) {
  return {
    x:
      event.center.x -
      (el.getClientRects()[0].x || el.getClientRects()[0].left),
    y:
      event.center.y - (el.getClientRects()[0].y || el.getClientRects()[0].top),
  };
}

function broadcast(ctx, topic, event, preventDefault = true) {
  if (!ctx.mouseEnabled) {
    return;
  }

  if (preventDefault) {
    event.preventDefault();
  }

  event.button = 0;
  event.topic = topic;
  event.modifier = ctx.modifier ? ctx.modifier : getModifier(event);
  event.relative = getRelative(ctx.el, event);

  ctx.emit(topic, event);
}

export default class MouseHandler {
  constructor(domElement, options) {
    const defaultOptions = {
      preventDefault: true,
      pan: {
        threshold: 0,
      },
      pinch: {
        threshold: 0,
      },
    };
    const optionsWithDefault = Object.assign(defaultOptions, options);

    this.Modifier = Modifier;

    handlerCount += 1;
    this.id = `mouse_handler_${handlerCount}`;
    this.mouseEnabled = true;
    this.el = domElement;
    this.modifier = 0;
    this.toggleModifiers = [0];
    this.toggleModifierIdx = 0;
    this.toggleModifierEnable = false;
    this.hammer = new Hammer(domElement);
    this.scrollInternal = {
      ts: +new Date(),
      deltaX: 0,
      deltaY: 0,
    };
    this.finalZoomEvent = null;
    this.finalZoomTimerId = 0;
    this.triggerFinalZoomEvent = () => {
      if (this.finalZoomEvent) {
        this.finalZoomEvent.isFirst = false;
        this.finalZoomEvent.isFinal = true;
      }
      this.emit(this.finalZoomEvent.topic, this.finalZoomEvent);
    };

    this.domEventHandler = (e) => {
      if (!this.mouseEnabled) {
        return true;
      }

      if (
        !this.inRightClickHandling &&
        ['mousemove', 'mouseup'].indexOf(e.type) !== -1
      ) {
        return true;
      } else if (e.type === 'contextmenu') {
        this.inRightClickHandling = true;
      }

      if (optionsWithDefault.preventDefault) {
        e.preventDefault();
      }

      const event = {
        srcEvent: e,
        button: this.inRightClickHandling ? 2 : 0,
        topic: eventTypeMapping[e.type] || 'zoom',

        center: {
          x: e.clientX,
          y: e.clientY,
        },
        relative: {
          x:
            e.clientX -
            (this.el.getClientRects()[0].x || this.el.getClientRects()[0].left),
          y:
            e.clientY -
            (this.el.getClientRects()[0].y || this.el.getClientRects()[0].top),
        },

        scale: 1,

        deltaX: 0,
        deltaY: 0,
        delta: 0,
        deltaTime: 0,

        velocityX: 0,
        velocityY: 0,
        velocity: 0,

        isFirst: false,
        isFinal: false,
      };
      event.modifier = this.modifier ? this.modifier : getModifier(event);

      // Handle scroll/zoom if any
      if (event.topic === 'zoom') {
        // Register final zoom
        clearTimeout(this.finalZoomTimerId);
        this.finalZoomTimerId = setTimeout(
          this.triggerFinalZoomEvent,
          TIMEOUT_BETWEEN_ZOOM
        );

        const currentTime = +new Date();
        if (currentTime - this.scrollInternal.ts > TIMEOUT_BETWEEN_ZOOM) {
          this.scrollInternal.deltaX = 0;
          this.scrollInternal.deltaY = 0;
          event.isFirst = true;
          event.isFinal = false;
        } else {
          event.isFinal = false;
        }

        const clientWidth = this.el.getClientRects()[0].width;
        const clientHeight = this.el.getClientRects()[0].height;
        if (e.wheelDeltaX === undefined) {
          event.zoom = this.lastScrollZoomFactor;
          this.scrollInternal.deltaY -= e.detail * 2.0;
        } else {
          event.zoom = this.lastScrollZoomFactor;
          this.scrollInternal.deltaX += e.wheelDeltaX * clientWidth * MOUSE_WHEEL_SCALE_FACTOR;
          this.scrollInternal.deltaY += e.wheelDeltaY * clientHeight * MOUSE_WHEEL_SCALE_FACTOR;
        }

        event.deltaX = this.scrollInternal.deltaX;
        event.deltaY = this.scrollInternal.deltaY;
        event.scale = 1.0 + event.deltaY / clientHeight;
        event.scale = event.scale < 0.1 ? 0.1 : event.scale;
        this.scrollInternal.ts = currentTime;
        this.finalZoomEvent = event;
      }

      this.emit(event.topic, event);

      if (e.type === 'mouseup') {
        this.inRightClickHandling = false;
      }

      return false;
    };

    // set hammer options
    this.hammer.get('pan').set(optionsWithDefault.pan);
    this.hammer.get('pinch').set(optionsWithDefault.pinch);

    // Listen to hammer events
    this.hammer.on('tap', (e) => {
      broadcast(this, 'click', e, optionsWithDefault.preventDefault);
    });

    this.hammer.on('doubletap', (e) => {
      broadcast(this, 'dblclick', e, optionsWithDefault.preventDefault);
    });

    this.hammer.on('pan', (e) => {
      broadcast(this, 'drag', e, optionsWithDefault.preventDefault);
    });

    this.hammer.on('panstart', (e) => {
      e.isFirst = true;
      broadcast(this, 'drag', e, optionsWithDefault.preventDefault);
    });

    this.hammer.on('panend', (e) => {
      e.isFinal = true;
      broadcast(this, 'drag', e, optionsWithDefault.preventDefault);
    });

    this.hammer.on('pinch', (e) => {
      broadcast(this, 'zoom', e, optionsWithDefault.preventDefault);
    });

    this.hammer.on('pinchstart', (e) => {
      console.log('zoom start');
      e.isFirst = true;
      broadcast(this, 'zoom', e, optionsWithDefault.preventDefault);
    });

    this.hammer.on('pinchend', (e) => {
      e.isFinal = true;
      console.log('zoom end');
      broadcast(this, 'zoom', e, optionsWithDefault.preventDefault);
    });

    this.hammer.get('pinch').set({
      enable: true,
    });

    this.hammer.on('press', (e) => {
      if (this.toggleModifierEnable) {
        this.toggleModifierIdx =
          (this.toggleModifierIdx + 1) % this.toggleModifiers.length;
        this.modifier = this.toggleModifiers[this.toggleModifierIdx];

        e.relative = getRelative(this.el, e);

        this.emit('modifier.change', {
          value: this.modifier,
          list: Modifier,
          event: e,
        });
      }
    });

    // Manage events that are not captured by hammer
    this.el.addEventListener('contextmenu', this.domEventHandler);
    this.el.addEventListener('mousemove', this.domEventHandler);
    this.el.addEventListener('mouseup', this.domEventHandler);
    this.el.addEventListener('mousewheel', this.domEventHandler);
    this.el.addEventListener('DOMMouseScroll', this.domEventHandler);
  }

  enablePinch(enable) {
    this.hammer.get('pinch').set({
      enable,
    });
  }

  setModifier(modifier) {
    this.modifier = modifier;
  }

  toggleModifierOnPress(enable, modifiers) {
    this.toggleModifiers = modifiers;
    this.toggleModifierEnable = enable;
  }

  setEnable(enableMouse = true) {
    this.mouseEnabled = !!enableMouse;
  }

  attach(listeners) {
    const subscriptions = {};
    Object.keys(listeners).forEach((key) => {
      subscriptions[key] = this.on(key, listeners[key]);
    });
    return subscriptions;
  }

  destroy() {
    // Remove all listeners is any
    this.off();

    // Release hammer
    this.hammer.destroy();

    // Remove events that are not captured by hammer
    this.el.removeEventListener('contextmenu', this.domEventHandler);
    this.el.removeEventListener('mousemove', this.domEventHandler);
    this.el.removeEventListener('mouseup', this.domEventHandler);
    this.el.removeEventListener('mousewheel', this.domEventHandler);
    this.el.removeEventListener('DOMMouseScroll', this.domEventHandler);
  }
}

// Add Observer pattern using Monologue.js
Monologue.mixInto(MouseHandler);
