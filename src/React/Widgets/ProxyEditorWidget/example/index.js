import 'babel-polyfill';
import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import ProxyEditorWidget from '..';

import source from './source-proxy.json';
import representation from './representation-proxy.json';
import view from './view-proxy.json';

// Load CSS
require('normalize.css');

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

function updateCollapsibleGroups(proxy, nameToToggle) {
  checkPropertyList(proxy.properties, proxy.ui, nameToToggle);
}

// --------------------------------------------------------------------------
// Main proxy editor widget example
// --------------------------------------------------------------------------
const container = document.querySelector('.content');
const sections = [
  Object.assign({ name: 'source', collapsed: false }, source),
  Object.assign({ name: 'representation', collapsed: true }, representation),
  Object.assign({ name: 'view', collapsed: true }, view),
];

class ProxyEditorTestWidget extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      sections: props.sections,
    };

    this.onCollapseChange = this.onCollapseChange.bind(this);
  }

  onCollapseChange(name, isOpen, collapseType) {
    const newSections = [];
    for (let i = 0; i < this.state.sections.length; i += 1) {
      updateCollapsibleGroups(this.state.sections[i], name);
      newSections[i] = Object.assign({}, this.state.sections[i]);
    }
    this.setState({ sections: newSections });
  }

  render() {
    return (
      <ProxyEditorWidget
        sections={this.state.sections}
        onCollapseChange={this.onCollapseChange}
      />
    );
  }
}

ProxyEditorTestWidget.propTypes = {
  sections: PropTypes.array,
};

ReactDOM.render(
  React.createElement(ProxyEditorTestWidget, { sections }),
  container
);

document.body.style.margin = '10px';
