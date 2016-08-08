import React        from 'react';
import style        from 'PVWStyle/ReactWidgets/CompositePipelineWidget.mcss';
import ChildItem    from './ChildItem';

/**
 * This React component expect the following input properties:
 *   - model:
 *       Expect a LokkupTable instance that you want to render and edit.
 *   - item:
 *       Root of the tree
 *   - layer:
 *       Layer id.
 */
export default React.createClass({

  displayName: 'CompositePipelineWidget.RootItem',

  propTypes: {
    item: React.PropTypes.object,
    layer: React.PropTypes.string,
    model: React.PropTypes.object,
  },

  getInitialState() {
    return {
      dropDown: false,
    };
  },

  toggleVisibility() {
    this.props.model.toggleLayerVisible(this.props.layer);
  },

  toggleDropDown() {
    if (this.props.model.getColor(this.props.layer).length > 1) {
      this.setState({
        dropDown: !this.state.dropDown,
      });
    }
  },

  updateColorBy(event) {
    this.props.model.setActiveColor(this.props.layer, event.target.dataset.color);
    this.toggleDropDown();
  },

  toggleEditMode() {
    this.props.model.toggleEditMode(this.props.layer);
  },

  updateOpacity(e) {
    this.props.model.setOpacity(this.props.layer, e.target.value);
    this.forceUpdate();
  },

  render() {
    var model = this.props.model,
      layer = this.props.layer,
      visible = model.isLayerVisible(this.props.layer),
      children = (this.props.item.children || []),
      inEditMode = this.props.model.isLayerInEditMode(this.props.layer),
      hasChildren = (children.length > 0),
      hasOpacity = model.hasOpacity(),
      hasDropDown = this.props.model.getColor(this.props.layer).length > 1,
      editButton = hasChildren ? <i className={inEditMode ? style.editButtonOn : style.editButtonOff} onClick={this.toggleEditMode} /> : '';

    return (
      <div className={style.section}>
        <div className={style.item}>
          <div className={style.label}>
            {this.props.item.name}
          </div>
          <div className={style.actions}>
            {editButton}
            <i
              className={visible ? style.visibleButtonOn : style.visibleButtonOff}
              onClick={this.toggleVisibility}
            />
            <i
              className={hasDropDown ? style.dropDownButtonOn : style.dropDownButtonOff}
              onClick={this.toggleDropDown}
            />
            <div
              onClick={this.updateColorBy}
              className={this.state.dropDown ? style.menu : style.hidden}
            >
              {model.getColor(layer).map(color =>
                <div
                  key={color} data-color={color}
                  className={model.isActiveColor(layer, color) ? style.selectedMenuItem : style.menuItem}
                >
                  {model.getColorToLabel(color)}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={(hasOpacity && !hasChildren) ? style.item : style.hidden}>
          <input
            className={style.opacity}
            type="range"
            min="0"
            max="100"
            value={model.getOpacity(layer)}
            onChange={this.updateOpacity}
          />
        </div>
        <div className={style.children}>
          {children.map((item, idx) =>
            <ChildItem key={idx} item={item} layer={item.ids.join('')} model={model} />
          )}
        </div>
      </div>);
  },
});
