import React from 'react';
import Select from 'react-select';
import classNames from 'classnames';

import 'react-select/dist/react-select.css';

import style from '../../../../style/InfoVizReact/FieldSearch.mcss';

function getOptionData(provider, mtime = 0) {
  const fieldNames = provider.getFieldNames();
  const options = fieldNames.map(name => ({
    label: name,
    value: provider.getField(name).id,
  }));
  const selectedFields = ''; // Comma-separated list of currently-selected fields.
  return { options, selectedFields };
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
    this.filterOptions = this.filterOptions.bind(this);
    this.finalizeChosenOption = this.finalizeChosenOption.bind(this);
    this.renderMenuAndUpdateHover = this.renderMenuAndUpdateHover.bind(this);
  }

  // One-time initialization.
  componentWillMount() {
    this.subscriptions = [
      this.props.provider.onFieldChange((field) => {
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

  filterOptions(options, filter, currentValues, config) {
    // console.log(`Filter "${filter}" type ${typeof filter}`, currentValues, 'config', config);
    if (!filter) {
      return options;
    }
    const oldHover = this.props.provider.isA('FieldHoverProvider') ?
      this.props.provider.getFieldHoverState() : { state: { subject: null } };
    const hover = { state: { disposition: 'preliminary', subject: oldHover.state.subject, highlight: {} } };
    const downcasedFilter = filter.toLowerCase();

    // (i) Map the options to indicate matches, (ii) filter out mismatches,
    // and (iii) sort my where the match occurred -- giving priority to
    // fields that start with the given text:
    const filteredOpts = options
      .map((option, optidx) => {
        const downcasedOption = option.label.toLowerCase();
        const matchPos = downcasedOption.indexOf(downcasedFilter);
        if (matchPos >= 0) {
          hover.state.highlight[option.label] = { weight: 0 };
          return { match: matchPos, optidx, option };
        }
        return null;
      })
      .filter(entry => entry !== null)
      .sort((a, b) => (a.match === b.match ? a.optidx - b.optidx : a.match - b.match))
      .map(entry => entry.option);

    if (this.props.provider.isA('FieldHoverProvider')) {
      this.props.provider.setFieldHoverState(hover);
    }
    return filteredOpts;
  }

  finalizeChosenOption(optionValue) {
    // console.log('Add option ', optionValue, typeof optionValue, this.state.options, this.state.selectedFields, this.props);
    let subject = '';
    let subjectId = -1;
    if (this.props.provider.isA('FieldHoverProvider')) {
      if (optionValue !== '') {
        subjectId = Number(optionValue);
        subject = this.state.options.reduce(
          (name, entry) => (entry.value === subjectId ? entry.label : name),
          '');
      }
      const hover = {
        state: {
          disposition: 'final',
          subject,
          highlight: {},
        },
      };
      if (subject !== '') hover.state.highlight[subject] = { weight: 1 };
      this.props.provider.setFieldHoverState(hover);
    }
    this.setState({ selectedFields: subjectId });
    return optionValue;
  }

  renderMenuAndUpdateHover({
    focusedOption,
    instancePrefix,
    labelKey,
    onFocus,
    onSelect,
    optionClassName,
    optionComponent,
    optionRenderer,
    options,
    valueArray,
    valueKey,
    onOptionRef,
  }) {
    const Option = optionComponent;
    if (this.props.provider.isA('FieldHoverProvider')) {
      const oldHover = this.props.provider.getFieldHoverState();
      const hover = { state: { disposition: 'preliminary', highlight: {} } };
      if ('subject' in oldHover.state) {
        hover.state.subject = oldHover.state.subject;
      }
      Object.keys(oldHover.state.highlight).forEach((name) => {
        hover.state.highlight[name] = { weight: 0 };
      });
      hover.state.highlight[focusedOption.label] = { weight: 1 };
      this.props.provider.setFieldHoverState(hover);
    }

    return options.map((option, i) => {
      const isSelected = valueArray && valueArray.indexOf(option) > -1;
      const isFocused = option === focusedOption;
      const optionClass = classNames(optionClassName, {
        'Select-option': true,
        'is-selected': isSelected,
        'is-focused': isFocused,
        'is-disabled': option.disabled,
      });

      return (
        <Option
          className={optionClass}
          instancePrefix={instancePrefix}
          isDisabled={option.disabled}
          isFocused={isFocused}
          isSelected={isSelected}
          key={`option-${i}-${option[valueKey]}`}
          onFocus={onFocus}
          onSelect={onSelect}
          option={option}
          optionIndex={i}
          ref={(ref) => { onOptionRef(ref, isFocused); }}
        >
          {optionRenderer(option, i)}
        </Option>
      );
    });
  }

  render() {
    return (
      <div className={style.container}>
        <div title={this.title}>
          <Select
            simpleValue
            value={this.state.selectedFields}
            placeholder="Search for a field"
            filterOptions={this.filterOptions}
            menuRenderer={this.renderMenuAndUpdateHover}
            options={this.state.options}
            onChange={this.finalizeChosenOption}
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
