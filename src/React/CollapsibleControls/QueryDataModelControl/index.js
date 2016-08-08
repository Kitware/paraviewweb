import React                    from 'react';

import style                    from 'PVWStyle/ReactCollapsibleControls/QueryDataModelControl.mcss';

import CollapsibleWidget        from '../../Widgets/CollapsibleWidget';
import DataListenerMixin        from '../../Widgets/QueryDataModelWidget/DataListenerMixin';
import DataListenerUpdateMixin  from '../../Widgets/QueryDataModelWidget/DataListenerUpdateMixin';
import ExploreButton            from '../../Widgets/ToggleIconButtonWidget';
import QueryDataModelWidget     from '../../Widgets/QueryDataModelWidget';

export default React.createClass({

  displayName: 'QueryDataModelControl',

  propTypes: {
    handleExploration: React.PropTypes.bool,
    model: React.PropTypes.object,
  },

  mixins: [DataListenerMixin, DataListenerUpdateMixin],

  getDefaultProps() {
    return {
      handleExploration: false,
    };
  },

  toggleExploration(enabled) {
    this.props.model.exploreQuery(enabled, true, !this.props.handleExploration);
  },

  render() {
    var exploreButton = (
      <ExploreButton
        key="explore-button"
        icon={style.exploreIcon}
        onChange={this.toggleExploration}
        value={this.props.model.exploreState.animate}
      />);

    return (
      <CollapsibleWidget
        title="Parameters"
        key="QueryDataModelWidget_parent"
        visible={this.props.model.originalData.arguments_order.length > 0}
        activeSubTitle
        subtitle={exploreButton}
      >
        <QueryDataModelWidget
          key="QueryDataModelWidget"
          model={this.props.model}
        />
      </CollapsibleWidget>);
  },
});
