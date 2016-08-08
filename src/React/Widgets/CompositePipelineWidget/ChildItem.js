import React from 'react';
import style from 'PVWStyle/ReactWidgets/CompositePipelineWidget.mcss';

/**
 * This React component expect the following input properties:
 *   - model:
 *       Expect a LokkupTable instance that you want to render and edit.
 *   - item:
 *       Root of the tree
 */
export default React.createClass({

  displayName: 'CompositePipelineWidget.ChildItem',

  propTypes: {
    item: React.PropTypes.object,
    layer: React.PropTypes.string,
    model: React.PropTypes.object,
  },

  toggleActiveLayer(event) {
    this.props.model.toggleLayerActive(this.props.layer);
  },

  updateOpacity(e) {
    this.props.model.setOpacity(this.props.layer, e.target.value);
    this.forceUpdate();
  },

  render() {
    var inEditMode = this.props.model.isLayerInEditMode(this.props.layer),
      isActive = this.props.model.isLayerActive(this.props.layer),
      hidden = !isActive && !inEditMode,
      hasOpacity = this.props.model.hasOpacity();

    return (
      <div className={hidden ? style.hidden : style.childItem}>
        <i
          className={!inEditMode ? style.deleteButtonOff : isActive ? style.activeButton : style.deleteButtonOn}
          onClick={this.toggleActiveLayer}
        />
        <div className={style.label}>
          {this.props.item.name}
        </div>
        <input
          className={hasOpacity ? style.opacity : style.hidden}
          type="range"
          min="0"
          max="100"
          value={this.props.model.getOpacity(this.props.layer)}
          onChange={this.updateOpacity}
        />
      </div>);
  },

});
