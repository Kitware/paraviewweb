import React from 'react';

import Select from 'react-select';

import 'react-select/dist/react-select.css';

import style from '../../../../style/InfoVizReact/FieldSearch.mcss';

function getOptionData(provider, mtime = 0) {
  const fieldNames = provider.getFieldNames();
  const options = fieldNames.map(name => ({ label: name, value: provider.getField(name).id }));
  const selectedFields = ''; // Comma-separated list of currently-selected fields.
  return { true, options, selectedFields };
}

export default class FieldSearch extends React.Component {

  constructor(props) {
    super(props);

    const initialSettings = getOptionData(this.props.provider);

    this.state = {
      overlayVisible: false,
      exportName: '',
      exporting: false,
      selectedFields: initialSettings.selectedFields,
      options: initialSettings.options,
      needUpdate: false,
    };

    this.title = 'Field Search';

    // Autobinding
    this.updateFieldHover = this.updateFieldHover.bind(this);
  }

  /// One-time initialization.
  componentWillMount() {
    this.subscriptions = [
      this.props.provider.onFieldChange(field => {
        this.setState(getOptionData(this.props.provider));
      }),
    ];
  }

  componentWillUnmount() {
    while (this.subscriptions && this.subscriptions.length) {
      this.subscriptions.pop().unsubscribe();
    }
    this.subscriptions = null;
  }

  updateFieldHover(arg) {
    //console.log('Change! ', arg, typeof arg, this.state.options, this.state.selectedFields, this.props);
    if (this.props.provider.isA('FieldHoverProvider')) {
      const fieldId = Number(arg);
      const subject = this.state.options.reduce(
        (name, entry) => entry.value === fieldId ? entry.label : name,
        '');
      const state = {
        disposition: 'final',
        subject,
        highlight: {},
      };
      state.highlight[subject] = true;
      this.props.provider.setFieldHoverState({ state });
    }
  }

  render() {
    return (
      <div className={style.container}>
        <div title={this.title}>
          <Select
            multi
            simpleValue
            value={this.state.selectedFields}
            placeholder="Search for a field"
            options={this.state.options}
            onChange={this.updateFieldHover}
            resetValue={[]}
          />
        </div>
      </div>);
  }
}

FieldSearch.propTypes = {
  provider: React.PropTypes.object,
  size: React.PropTypes.string,
};

FieldSearch.defaultProps = {
  size: '35px',
};
