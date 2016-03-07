import Monologue from 'monologue.js';

const modifier = {
    NONE: 0,
    ALT: 1,
    META: 2,
    SHIFT: 4,
    CTRL: 8,
  },
  INTERATION_TOPIC = 'vtk.web.interaction';

export default class VtkMouseListener {

  constructor(vtkWebClient, width = 100, height = 100) {
    this.client = vtkWebClient;
    this.ready = true;
    this.width = width;
    this.height = height;
    this.listeners = {
      drag: (event) => {
        const vtkEvent = {
          view: -1,
          buttonLeft: !event.isFinal,
          buttonMiddle: false,
          buttonRight: false,
          shiftKey: event.modifier & modifier.SHIFT,
          ctrlKey: event.modifier & modifier.CTRL,
          altKey: event.modifier & modifier.ALT,
          metaKey: event.modifier & modifier.META,
          x: event.relative.x / this.width,
          y: 1.0 - (event.relative.y / this.height),
        };
        if (event.isFirst) {
          // Down
          vtkEvent.action = 'down';
        } else if (event.isFinal) {
          // Up
          vtkEvent.action = 'up';
        } else {
          // Move
          vtkEvent.action = 'move';
        }
        this.emit(INTERATION_TOPIC, vtkEvent.action !== 'up');
        if (this.client) {
          if (this.ready || vtkEvent.action !== 'move') {
            this.ready = false;
            this.client.MouseHandler.interaction(vtkEvent)
              .then(resp => {
                this.ready = true;
              });
          }
        }
      },
      zoom: (event) => {
        const vtkEvent = {
          view: -1,
          buttonLeft: false,
          buttonMiddle: false,
          buttonRight: !event.isFinal,
          shiftKey: false,
          ctrlKey: false,
          altKey: false,
          metaKey: false,
          x: event.relative.x / this.width,
          y: 1.0 - ((event.relative.y + event.deltaY) / this.height),
        };
        if (event.isFirst) {
          // Down
          vtkEvent.action = 'down';
        } else if (event.isFinal) {
          // Up
          vtkEvent.action = 'up';
        } else {
          // Move
          vtkEvent.action = 'move';
        }
        this.emit(INTERATION_TOPIC, vtkEvent.action !== 'up');
        if (this.client) {
          this.client.MouseHandler.interaction(vtkEvent);
        }
      },
    };
  }

  getListeners() {
    return this.listeners;
  }

  updateSize(w, h) {
    this.width = w;
    this.height = h;
  }

  onInteraction(callback) {
    return this.on(INTERATION_TOPIC, callback);
  }

  destroy() {
    this.client = null;
    this.listeners = null;
  }
}

// Add Observer pattern using Monologue.js
Monologue.mixInto(VtkMouseListener);
