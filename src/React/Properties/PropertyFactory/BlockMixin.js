// This DRYs up the code for Cell, Enum, Slider and Bool quite a bit.
/* eslint-disable babel/object-shorthand */
export default {
    getDefaultProps() {
        return { name: '', help: ''};
    },

    getInitialState() {
        return {
            data: this.props.data,
            helpOpen: false,
            ui: this.props.ui,
        };
    },
    
    componentWillMount() {
        var newState = {};
        if (this.props.ui.default && !this.props.data.value) {
            newState.data = this.state.data
            newState.data.value = this.props.ui.default;
        }

        if (Object.keys(newState).length > 0) {
            this.setState(newState);
        }
    },

    componentWillReceiveProps(nextProps) {
        const data = nextProps.data;

        if(this.state.data !== data) {
            this.setState({data});
        }
    },

    helpToggled(open) {
        this.setState({helpOpen: open});
    },
}
/* eslint-enable babel/object-shorthand */
