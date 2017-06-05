import React            from 'react';
import equals           from 'mout/src/array/equals';

import style from 'PVWStyle/ReactWidgets/ProxyPropertyGroup.mcss';

import factory          from '../../Properties/PropertyFactory';
import { proxyToProps } from '../../../Common/Misc/ConvertProxyProperty';

function extractProperties(nestedPropsInput, flatPropsOutput) {
  nestedPropsInput.forEach((p) => {
    if (p.ui.propType === 'group') {
      extractProperties(p.children, flatPropsOutput);
    } else {
      flatPropsOutput[p.data.id] = p.data.value;
    }
  });
}

export default React.createClass({

  displayName: 'ProxyPropertyGroup',

  propTypes: {
    advanced: React.PropTypes.bool,
    collapsed: React.PropTypes.bool,
    filter: React.PropTypes.string,
    onChange: React.PropTypes.func,
    onCollapseChange: React.PropTypes.func,
    proxy: React.PropTypes.object,
  },

  getDefaultProps() {
    return {
      advanced: false,
      collapsed: false,
    };
  },

  getInitialState() {
    return {
      collapsed: this.props.collapsed,
      changeSet: {},
      properties: proxyToProps(this.props.proxy),
    };
  },

  componentWillReceiveProps(nextProps) {
    var previous = this.props.proxy,
      next = nextProps.proxy;

    if (!equals(previous, next)) {
      this.setState({
        properties: proxyToProps(next),
        changeSet: {},
      });
    }
  },

  toggleCollapsedMode() {
    const collapsed = !this.state.collapsed;
    if (this.props.onCollapseChange) {
      this.props.onCollapseChange(this.props.proxy.name, collapsed);
    }
    this.setState({ collapsed });
  },

  valueChange(change) {
    if (change.collapseType) {
      this.props.onCollapseChange(change.id, change.value, change.collapseType);
      return;
    }
    const changeSet = this.state.changeSet;
    changeSet[change.id] = (change.size === 1 && Array.isArray(change.value)) ? change.value[0] : change.value;
    this.setState({ changeSet });
    if (this.props.onChange) {
      this.props.onChange(changeSet);
    }
  },

  render() {
    const properties = {};
    const ctx = { advanced: this.props.advanced, filter: this.props.filter, properties };
    const changeSetCount = Object.keys(this.state.changeSet).length;

    extractProperties(this.state.properties, properties);

    return (
      <div className={style.container}>
        <div className={style.toolbar} onClick={this.toggleCollapsedMode}>
          <i className={this.state.collapsed ? style.collapedIcon : style.expandedIcon} />
          <span className={style.title}>{this.props.proxy.name}</span>
          <span className={changeSetCount ? style.tag : style.emptyTag}>
            <i className={style.tagBackground} />
            <strong className={style.tagCount}>{changeSetCount}</strong>
          </span>
        </div>
        <div className={this.state.collapsed ? style.hidden : style.content}>
          {this.state.properties.map(p => factory(p, ctx, this.valueChange))}
        </div>
      </div>);
  },
});
