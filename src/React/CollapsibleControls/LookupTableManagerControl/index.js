import React from 'react';
import PropTypes from 'prop-types';

import CollapsibleWidget from '../../Widgets/CollapsibleWidget';
import LookupTableWidget from '../../Widgets/LookupTableWidget';
import DropDownWidget from '../../Widgets/DropDownWidget';

export default class LookupTableManagerControl extends React.Component {
  constructor(props) {
    super(props);

    const luts = props.lookupTableManager.luts;
    const fields = Object.keys(luts);
    const field = props.field || fields[0];

    this.state = {
      field,
      fields,
    };

    // Bind callback
    this.onFieldsChange = this.onFieldsChange.bind(this);
  }

  componentWillMount() {
    this.changeSubscription = this.props.lookupTableManager.onFieldsChange(
      (data, enevelope) => {
        var fields = Object.keys(this.props.lookupTableManager.luts);
        this.setState({
          fields,
        });
      }
    );
  }

  componentWillUnmount() {
    if (this.changeSubscription) {
      this.changeSubscription.unsubscribe();
      this.changeSubscription = null;
    }
  }

  onFieldsChange(newVal) {
    this.props.lookupTableManager.updateActiveLookupTable(newVal);
    this.setState({
      field: newVal,
    });
  }

  render() {
    var lutManager = this.props.lookupTableManager,
      lut = lutManager.getLookupTable(this.state.field),
      originalRange = lut.getScalarRange();

    return (
      <CollapsibleWidget
        title="Lookup Table"
        activeSubTitle
        subtitle={
          <DropDownWidget
            field={this.state.field}
            fields={this.state.fields}
            onChange={this.onFieldsChange}
          />
        }
      >
        <LookupTableWidget
          lookupTableManager={lutManager}
          lookupTable={lut}
          originalRange={originalRange}
        />
      </CollapsibleWidget>
    );
  }
}

LookupTableManagerControl.propTypes = {
  field: PropTypes.string,
  lookupTableManager: PropTypes.object.isRequired,
};
