import React from 'react';
import style from 'PVWStyle/ReactCollapsibleControls/FloatImageControl.mcss';

export default React.createClass({

  displayName: 'FloatImageControl.LayerItem',

  propTypes: {
    item: React.PropTypes.object.isRequired,
    model: React.PropTypes.object.isRequired,
  },

  getInitialState() {
    return {
      change: false,
      dropDown: false,
    };
  },

  toggleMesh() {
    if (this.props.item.hasMesh) {
      this.props.model.updateMaskLayerVisibility(this.props.item.name, !this.props.item.meshActive);
      this.setState({ change: !this.state.change });
    }
  },

  toggleVisibility() {
    this.props.model.updateLayerVisibility(this.props.item.name, !this.props.item.active);
    this.setState({ change: !this.state.change });
  },

  toggleDropDown() {
    if (this.props.item.arrays.length > 1) {
      this.setState({ dropDown: !this.state.dropDown });
    }
  },

  updateColorBy(event) {
    this.props.model.updateLayerColorBy(this.props.item.name, event.target.dataset.color);
    this.toggleDropDown();
  },

  render() {
    var layer = this.props.item,
      visible = layer.active,
      meshVisible = layer.meshActive,
      meshAvailable = layer.hasMesh,
      hasDropDown = layer.arrays.length > 1;

    return (
      <div className={style.item}>
        <div className={style.sceneLabel}>
          {layer.name}
        </div>
        <div className={style.sceneActions}>
          <i
            className={(meshAvailable ? (meshVisible ? style.meshButtonOn : style.meshButtonOff) : style.hidden)}
            onClick={this.toggleMesh}
          />
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
            {layer.arrays.map(color => (
              <div
                key={color}
                data-color={color}
                className={(color === layer.array) ? style.selectedMenuItem : style.menuItem}
              >
                {color}
              </div>)
            )}
          </div>
        </div>
      </div>);
  },
});
