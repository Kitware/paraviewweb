

import React from 'react';

import   ComponentToReact from '../../../Component/React/ComponentToReact';
import        FieldSearch from '../FieldSearch';
import      FieldSelector from '../../Native/FieldSelector';
import              style from '../../../../style/InfoVizReact/FieldExplorer.mcss';


export default class FieldExplorer extends React.Component {

  constructor(props) {
    super(props);

    this.subscriptions = [];
    this.unselectedFields = null;
    this.selectedFields = null;

    this.sortByVar = null;

    // Autobinding
    this.fieldSearchUpdated = this.fieldSearchUpdated.bind(this);
  }

  // One-time initialization.
  componentWillMount() {
    this.unselectedFields = FieldSelector.newInstance({
      provider: this.props.provider,
      displaySearch: true,
      fieldShowHistogram: true,
      // showOnlyUnselected: true,
    });
    this.selectedFields = FieldSelector.newInstance({
      provider: this.props.provider,
      displaySearch: false,
      fieldShowHistogram: true,
      // showOnlySelected: true,
    });

    // this.subscriptions.push();
  }

  componentDidMount() {
    this.selectedFields.setFieldsToRender();
    this.selectedFields.render();

    this.unselectedFields.setFieldsToRender();
    this.unselectedFields.render();
  }

  componentWillUnmount() {
    // while (this.subscriptions && this.subscriptions.length) {
    //   this.subscriptions.pop().unsubscribe();
    // }
    // this.subscriptions = null;

    this.unselectedFields.destroy();
    this.unselectedFields = null;

    this.selectedFields.destroy();
    this.selectedFields = null;
  }

  fieldSearchUpdated(newVal) {
    this.selectedFields.setFieldsToRender();
    this.selectedFields.render();

    this.unselectedFields.setFieldsToRender();
    this.unselectedFields.render();
  }

  render() {
    console.log(`FieldExplorer.render() => subject; ${this.props.subject}, disposition: ${this.props.disposition}`);

    let sortOrder = null;
    if (this.props.subject) {
      console.log('Reorder by mutual information to ', this.props.subject);
      sortOrder = this.props.fieldInfo.fieldMapping.reduce(
              (varId, entry) => (entry.name === this.props.subject ? entry.id : varId),
              null);
    }
    if (this.sortByVar !== sortOrder && sortOrder !== null) {
      this.sortByVar = sortOrder;
      this.unselectedFields.setSortArray(this.sortByVar, this.props.fieldInfo.mutualInformation[this.sortByVar]);
    } else if (this.props.disposition === 'final' && sortOrder === null) {
      // reset to alphabetical, use 'up' to reverse
      this.unselectedFields.setSortArray(null, null, 'down');
      this.sortByVar = null;
    }

    return (
      <div className={style.container}>
        <div style={{ overflow: 'auto', position: 'absolute', top: 0, width: '100%', height: 'calc(50% - 30px)' }}>
          <ComponentToReact className={style.fullSize} component={this.selectedFields} />
        </div>
        <div style={{ position: 'absolute', top: 'calc(50% - 30px)', height: 30, width: '100%' }}>
          <FieldSearch provider={this.props.provider} onChosenOptionFinalized={this.fieldSearchUpdated} />
        </div>
        <div style={{ overflow: 'auto', position: 'absolute', bottom: 0, width: '100%', height: 'calc(50% - 30px)' }}>
          <ComponentToReact className={style.fullSize} component={this.unselectedFields} />
        </div>
      </div>);
  }
}

FieldExplorer.propTypes = {
  provider: React.PropTypes.object,
  sortDirection: React.PropTypes.string,
  subject: React.PropTypes.string,
  disposition: React.PropTypes.string,
  fieldInfo: React.PropTypes.object,

};

FieldExplorer.defaultProps = {
  provider: null,
  sortDirection: 'down',
  subject: null,
  disposition: null,
  fieldInfo: null,
};
