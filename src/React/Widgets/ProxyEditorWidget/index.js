import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/ProxyEditorWidget.mcss';
import PropertyGroup from '../ProxyPropertyGroupWidget';

// --------------------------------------------------------------------------
// Helper methods to update the proxy jsons with the appropriate collapsed
// state of any groups they contain, as it is the reponsibility of the user
// of the the ProxyEditorWidget to provide the complete proxy state.
// --------------------------------------------------------------------------

function checkPropertyList(propList, uiList, nameToToggle) {
  propList.forEach((prop, idx) => {
    const ui = uiList[idx];
    const id = [prop.id, prop.name].join(':');
    if (id === nameToToggle) {
      prop.value = !prop.value;
    }

    if (prop.children) {
      checkPropertyList(prop.children, ui.children, nameToToggle);
    }
  });
}

// --------------------------------------------------------------------------

function updateCollapsibleGroups(proxy, nameToToggle) {
  checkPropertyList(proxy.properties, proxy.ui, nameToToggle);
}

// --------------------------------------------------------------------------

export default class ProxyEditorWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      advanced: props.advanced,
      changeSet: {},
      filter: null,
    };

    // Callback binding
    this.toggleAdvanced = this.toggleAdvanced.bind(this);
    this.updateFilter = this.updateFilter.bind(this);
    this.updateChangeSet = this.updateChangeSet.bind(this);
    this.applyChanges = this.applyChanges.bind(this);
    this.onCollapseChange = this.onCollapseChange.bind(this);
  }

  onCollapseChange(name, isOpen, collapseType) {
    if (this.props.onCollapseChange) {
      this.props.onCollapseChange(name, isOpen, collapseType);
      this.setState({ sections: null });
      return;
    }
    const newSections = [];
    const sections = this.state.sections || this.props.sections;
    for (let i = 0; i < sections.length; i += 1) {
      updateCollapsibleGroups(sections[i], name);
      newSections[i] = Object.assign({}, sections[i]);
    }
    this.setState({ sections: newSections });
  }

  toggleAdvanced() {
    const advanced = !this.state.advanced;
    this.setState({ advanced });
  }

  updateFilter(event) {
    const filter = event.target.value;
    this.setState({ filter });
  }

  updateChangeSet(change) {
    const changeSet = Object.assign({}, this.state.changeSet, change);
    if (this.props.autoApply) {
      if (this.props.onApply) {
        this.props.onApply(changeSet);
      }
      this.setState({ changeSet: {} });
    } else {
      this.setState({ changeSet });
    }
  }

  applyChanges() {
    if (this.props.onApply) {
      this.props.onApply(this.state.changeSet);
    }
    // Reset changeSet
    this.setState({ changeSet: {} });
  }

  render() {
    const changeCount = Object.keys(this.state.changeSet).length;
    return (
      <div className={style.container}>
        <div className={style.toolbar}>
          <i
            className={
              this.state.advanced
                ? style.activeAdvancedButton
                : style.advancedButton
            }
            onClick={this.toggleAdvanced}
          />
          <input
            type="text"
            placeholder="filter properties..."
            onChange={this.updateFilter}
            className={style.filter}
          />
          {this.props.autoApply ? null : (
            <i
              className={
                changeCount ? style.validateButtonOn : style.validateButton
              }
              onClick={this.applyChanges}
            />
          )}
        </div>
        <div className={style.contentContainer}>
          {this.props.children}
          {(this.state.sections || this.props.sections).map((section) => (
            <PropertyGroup
              key={section.name}
              proxy={section}
              filter={this.state.filter}
              collapsed={section.collapsed}
              advanced={this.state.advanced}
              onChange={this.updateChangeSet}
              onCollapseChange={this.onCollapseChange}
            />
          ))}
        </div>
      </div>
    );
  }
}

ProxyEditorWidget.propTypes = {
  advanced: PropTypes.bool,
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  onApply: PropTypes.func,
  sections: PropTypes.array,
  onCollapseChange: PropTypes.func,
  autoApply: PropTypes.bool,
};

ProxyEditorWidget.defaultProps = {
  advanced: false,
  autoApply: false,
  children: null,
  onApply: undefined,
  onCollapseChange: undefined,
  sections: [],
};
