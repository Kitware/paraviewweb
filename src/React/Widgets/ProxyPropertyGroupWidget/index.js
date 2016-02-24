import React            from 'react';
import equals           from 'mout/src/array/equals';
import factory          from '../../Properties/PropertyFactory';
import { proxyToProps } from '../../../Common/Misc/ConvertProxyProperty';

import style from 'PVWStyle/ReactWidgets/ProxyPropertyGroup.mcss';

export default React.createClass({

  displayName: 'ProxyPropertyGroup',

  propTypes: {
    advanced: React.PropTypes.bool,
    collapsed: React.PropTypes.bool,
    filter: React.PropTypes.string,
    onChange: React.PropTypes.func,
    proxy: React.PropTypes.object,
  },

  getDefaultProps(){
    return {
        advanced: false,
        collapsed: false,
    };
  },

  getInitialState(){
    return {
      collapsed: this.props.collapsed,
      changeSet: {},
      properties: proxyToProps(this.props.proxy),
    };
  },

  componentWillReceiveProps(nextProps) {
      var previous = this.props.proxy,
          next = nextProps.proxy;

      if(!equals(previous, next)) {
          this.setState({
              properties: proxyToProps(next),
              changeSet: {},
          });
      }
  },

  toggleCollapsedMode() {
    const collapsed = !this.state.collapsed;
    this.setState({collapsed});
  },

  valueChange(change) {
    const changeSet = this.state.changeSet;
    changeSet[change.id] = change.value;
    this.setState({changeSet});
    if(this.props.onChange) {
      this.props.onChange(changeSet);
    }
  },

  render() {
    const ctx = { advanced: this.props.advanced, filter: this.props.filter };
    const changeSetCount = Object.keys(this.state.changeSet).length;

    return (
        <div className={ style.container }>
            <div className={ style.toolbar } onClick={ this.toggleCollapsedMode }>
                <i className={ this.state.collapsed ? style.collapedIcon : style.expandedIcon }></i>
                <span className={ style.title }>{ this.props.proxy.name }</span>
                <span className={ changeSetCount ? style.tag : style.emptyTag }>
                  <i className={ style.tagBackground }></i>
                  <strong className={ style.tagCount }>{ changeSetCount }</strong>
                </span>
            </div>
            <div className={ this.state.collapsed ? style.hidden : style.content}>
              { this.state.properties.map( p => factory(p, ctx, this.valueChange) ) }
            </div>
        </div>);
  },
});
