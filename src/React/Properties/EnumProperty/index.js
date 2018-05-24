import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactProperties/CellProperty.mcss';
import enumStyle from 'PVWStyle/ReactProperties/EnumProperty.mcss';

import convert from '../../../Common/Misc/Convert';
import ToggleIconButton from '../../Widgets/ToggleIconButtonWidget';

function valueToString(obj) {
  if (typeof obj === 'string') {
    return `S${obj}`;
  }
  return `J${JSON.stringify(obj)}`;
}

function stringToValue(str) {
  if (!str || str.length === 0) {
    return str;
  }
  return str[0] === 'S' ? str.substring(1) : JSON.parse(str.substring(1));
}

/* eslint-disable react/no-danger */
/* eslint-disable react/no-unused-prop-types */

export default class EnumProperty extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: props.data,
      helpOpen: false,
    };

    // Bind callback
    this.valueChange = this.valueChange.bind(this);
    this.helpToggled = this.helpToggled.bind(this);
  }

  componentWillMount() {
    const newState = {};
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

  valueChange(e) {
    const newData = this.state.data;
    if (Array.isArray(this.state.data.value)) {
      const newVals = [];
      for (let i = 0; i < e.target.options.length; i++) {
        const el = e.target.options.item(i);
        if (el.selected) {
          [].concat(stringToValue(el.value)).forEach((v) => newVals.push(v));
        }
      }
      newData.value = newVals.map(convert[this.props.ui.type]);
    } else if (e.target.value === null) {
      newData.value = null;
    } else {
      newData.value = [
        convert[this.props.ui.type](stringToValue(e.target.value)),
      ];
    }

    this.setState({
      data: newData,
    });
    if (this.props.onChange) {
      this.props.onChange(newData);
    }
  }

  render() {
    let selectedValue = null;
    const multiple = this.props.ui.size === -1;
    const mapper = () => {
      const ret = [];
      if (!multiple && !this.props.ui.noEmpty) {
        ret.push(<option key="empty-value" value={null} />);
      }

      const keys = Object.keys(this.props.ui.domain);
      if (this.props.ui.sort) {
        keys.sort();
      }

      keys.forEach((key) => {
        ret.push(
          <option
            value={valueToString(this.props.ui.domain[key])}
            key={`${this.props.data.id}_${key}`}
          >
            {key}
          </option>
        );
      });

      return ret;
    };

    if (multiple) {
      selectedValue = this.props.data.value.map(valueToString);
    } else if (this.props.ui.size === 1) {
      if (
        this.props.ui.domain &&
        this.props.ui.domain[this.props.data.value[0]] !== undefined
      ) {
        selectedValue = valueToString(
          this.props.ui.domain[this.props.data.value[0]]
        );
      } else {
        selectedValue = valueToString(this.props.data.value[0]);
      }
    } else {
      selectedValue = valueToString(this.props.data.value);
    }

    const containerStyle =
      this.props.ui.label !== undefined
        ? style.container
        : enumStyle.soloContainer;
    return (
      <div
        className={
          this.props.show(this.props.viewData) ? containerStyle : style.hidden
        }
      >
        {this.props.ui.label !== undefined && (
          <div className={enumStyle.header}>
            <strong>{this.props.ui.label}</strong>
            {this.props.ui.help !== undefined && (
              <span>
                <ToggleIconButton
                  icon={style.helpIcon}
                  value={this.state.helpOpen}
                  toggle={!!this.props.ui.help}
                  onChange={this.helpToggled}
                />
              </span>
            )}
          </div>
        )}
        <div className={style.inputBlock}>
          <select
            className={multiple ? enumStyle.inputMultiSelect : enumStyle.input}
            value={selectedValue}
            onChange={this.valueChange}
            multiple={multiple}
          >
            {mapper()}
          </select>
        </div>
        {this.props.ui.help !== undefined && (
          <div
            className={this.state.helpOpen ? style.helpBox : style.hidden}
            dangerouslySetInnerHTML={{ __html: this.props.ui.help }}
          />
        )}
      </div>
    );
  }
}

EnumProperty.propTypes = {
  data: PropTypes.object.isRequired,
  help: PropTypes.string,
  name: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  show: PropTypes.func.isRequired,
  ui: PropTypes.object.isRequired,
  viewData: PropTypes.object.isRequired,
};

EnumProperty.defaultProps = {
  name: '',
  help: '',
};
