import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactProperties/PropertyPanel.mcss';
import factory from '../PropertyFactory';

export default class PropertyPanel extends React.Component {
  constructor(props) {
    super(props);

    // Bind callback
    this.valueChange = this.valueChange.bind(this);
  }

  valueChange(newVal) {
    if (this.props.onChange) {
      this.props.onChange(newVal);
    }
  }

  render() {
    const viewData = this.props.viewData;
    const uiContents = (content) =>
      factory(
        content,
        viewData,
        this.props.onChange ? this.valueChange : undefined
      );
    const uiContainer = (property) => (
      <div key={property.title}>
        <div className={style.propertyHeader}>
          <strong>{property.title}</strong>
        </div>
        {property.contents.map(uiContents)}
      </div>
    );

    return (
      <section
        className={[this.props.className, style.propertyPanel].join(' ')}
      >
        {this.props.input.map(uiContainer)}
      </section>
    );
  }
}

PropertyPanel.propTypes = {
  className: PropTypes.string,
  input: PropTypes.array,
  onChange: PropTypes.func,
  viewData: PropTypes.object,
};

PropertyPanel.defaultProps = {
  className: '',
  input: [],
  viewData: {},
  onChange: () => {},
};
