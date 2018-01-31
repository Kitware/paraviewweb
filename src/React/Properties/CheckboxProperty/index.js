import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactProperties/CellProperty.mcss';

import Checkbox from './Checkbox';
import ToggleIconButton from '../../Widgets/ToggleIconButtonWidget';

/* eslint-disable react/no-danger */
/* eslint-disable react/no-unused-prop-types */

export default class CheckboxProperty extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: props.data,
      helpOpen: false,
      ui: props.ui,
    };

    // Callback binding
    this.helpToggled = this.helpToggled.bind(this);
    this.valueChange = this.valueChange.bind(this);
  }

  componentWillMount() {
    var newState = {};
    if (this.props.ui.default && !this.props.data.value) {
      newState.data = this.state.data;
      newState.data.value = this.props.ui.default;
    }

    if (Object.keys(newState).length > 0) {
      this.setState(newState);
    }
  }

  componentWillReceiveProps(nextProps) {
    const data = nextProps.data;

    if (this.state.data !== data) {
      this.setState({
        data,
      });
    }
  }

  helpToggled(open) {
    this.setState({
      helpOpen: open,
    });
  }

  valueChange(idx, newVal) {
    var newData = this.state.data;
    if (idx === null) {
      newData.value = newVal;
    } else {
      newData.value[idx] = newVal;
    }
    this.setState({
      data: newData,
    });
    if (this.props.onChange) {
      this.props.onChange(newData);
    }
  }

  render() {
    const mapper = () => {
      if (Array.isArray(this.props.data.value)) {
        const ret = [];
        for (let i = 0; i < this.props.data.value.length; i++) {
          ret.push(
            <Checkbox
              value={!!this.props.data.value[i]}
              label={this.props.ui.componentLabels[i]}
              key={`${this.props.data.id}_${i}`}
              onChange={this.valueChange}
              idx={i}
            />
          );
        }
        return ret;
      }

      return (
        <Checkbox
          value={!!this.props.data.value}
          label={this.props.ui.componentLabels[0]}
          onChange={this.valueChange}
        />
      );
    };

    return (
      <div
        className={
          this.props.show(this.props.viewData) ? style.container : style.hidden
        }
      >
        <div className={style.header}>
          <strong>{this.props.ui.label}</strong>
          <span>
            <ToggleIconButton
              icon={style.helpIcon}
              value={this.state.helpOpen}
              toggle={!!this.props.ui.help}
              onChange={this.helpToggled}
            />
          </span>
        </div>
        <div className={style.inputBlock}>{mapper()}</div>
        <div
          className={this.state.helpOpen ? style.helpBox : style.hidden}
          dangerouslySetInnerHTML={{ __html: this.props.ui.help }}
        />
      </div>
    );
  }
}

CheckboxProperty.propTypes = {
  data: PropTypes.object.isRequired,
  help: PropTypes.string,
  name: PropTypes.string,
  onChange: PropTypes.func,
  show: PropTypes.func,
  ui: PropTypes.object.isRequired,
  viewData: PropTypes.object,
};

CheckboxProperty.defaultProps = {
  name: '',
  help: '',
};
