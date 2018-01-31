import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactProperties/CellProperty.mcss';

import layouts from './layouts';
import ToggleIconButton from '../../Widgets/ToggleIconButtonWidget';

/* eslint-disable react/no-danger */
export default class CellProperty extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: props.data,
      helpOpen: false,
      ui: props.ui,
    };

    // Callback binding
    this.valueChange = this.valueChange.bind(this);
    this.addValue = this.addValue.bind(this);
    this.helpToggled = this.helpToggled.bind(this);
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

  valueChange(idx, newVal) {
    var newData = this.state.data;
    if (newVal === null) {
      newData.value.splice(idx, 1);
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

  addValue() {
    var newData = this.state.data,
      values = newData.value;

    switch (values.length) {
      case 0: {
        values.push(0);
        break;
      }
      case 1: {
        values.push(values[0]);
        break;
      }
      default: {
        const last = Number(values[values.length - 1]);
        const beforeLast = Number(values[values.length - 2]);
        const newValue = last + (last - beforeLast);
        if (!Number.isNaN(newValue) && Number.isFinite(newValue)) {
          values.push(newValue);
        } else {
          values.push(values[values.length - 1]);
        }
      }
    }

    this.setState({
      data: newData,
    });
    if (this.props.onChange) {
      this.props.onChange(newData);
    }
  }

  helpToggled(open) {
    this.setState({
      helpOpen: open,
    });
  }

  render() {
    return (
      <div
        className={
          this.props.show(this.props.viewData) ? style.container : style.hidden
        }
      >
        <div className={style.header}>
          <strong>{this.props.ui.label}</strong>
          <span>
            <i
              className={
                this.props.ui.layout === '-1' ? style.plusIcon : style.hidden
              }
              onClick={this.addValue}
            />
            <ToggleIconButton
              icon={style.helpIcon}
              value={this.state.helpOpen}
              toggle={!!this.props.ui.help}
              onChange={this.helpToggled}
            />
          </span>
        </div>
        <div className={style.inputBlock}>
          <table className={style.inputTable}>
            {layouts(this.props.data, this.props.ui, this.valueChange)}
          </table>
        </div>
        <div
          className={this.state.helpOpen ? style.helpBox : style.hidden}
          dangerouslySetInnerHTML={{ __html: this.props.ui.help }}
        />
      </div>
    );
  }
}
/* eslint-enable react/no-danger */

CellProperty.propTypes = {
  data: PropTypes.object.isRequired,
  help: PropTypes.string,
  onChange: PropTypes.func,
  show: PropTypes.func,
  ui: PropTypes.object.isRequired,
  viewData: PropTypes.object,
};

CellProperty.defaultProps = {
  name: '',
  help: '',
};
