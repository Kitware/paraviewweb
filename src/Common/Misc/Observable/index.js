import Monologue from 'monologue.js';

export default class Observable {
  destroy() {
    this.off();
  }
}

// Add Observer pattern using Monologue.js
Monologue.mixInto(Observable);
