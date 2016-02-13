import Monologue from 'monologue.js';

const
    CHANGE_TOPIC = 'toggle.change';

export default class ToggleState {

    // ------------------------------------------------------------------------

    constructor(initialState = true) {
        this.state = initialState;

        // Make a closure so that function can be passed around
        this.toggleState = () => {
            this.state = !this.state;
            this.emit(CHANGE_TOPIC, this.state);
        }
    }

    // ------------------------------------------------------------------------

    setState(value) {
        if((!!value) !== this.state) {
            this.state = !!value;
            this.emit(CHANGE_TOPIC, this.state);
        }
    }

    // ------------------------------------------------------------------------

    getState() {
        return this.state;
    }

    // ------------------------------------------------------------------------

    onChange(callback) {
        return this.on(CHANGE_TOPIC, callback);
    }

    // ------------------------------------------------------------------------

    destroy() {
        this.off();
    }
}

// Add Observer pattern using Monologue.js
Monologue.mixInto(ToggleState);
