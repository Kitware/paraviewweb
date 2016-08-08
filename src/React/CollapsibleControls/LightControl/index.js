import React                from 'react';

import style                from 'PVWStyle/ReactCollapsibleControls/LightControl.mcss';

import CollapsibleWidget    from '../../Widgets/CollapsibleWidget';
import Coordinate2DWidget   from '../../Widgets/Coordinate2DWidget';
import LightButton          from '../../Widgets/ToggleIconButtonWidget';
import NumberInputWidget    from '../../Widgets/NumberInputWidget';

export default React.createClass({

  displayName: 'LightControl',

  propTypes: {
    light: React.PropTypes.object.isRequired,
  },

  getInitialState() {
    return this.props.light.getLightProperties().lightTerms;
  },

  onLightTermsChange(newVal, name) {
    var newState = {};
    newState[name] = newVal;
    this.setState(newState);
    setImmediate(() => {
      this.props.light.setLightProperties({
        lightTerms: newState,
      });
    });
  },

  onLightPositionChange(event) {
    this.props.light.setLightProperties({
      lightPosition: event,
    });
  },

  toggleLight(enabled) {
    this.props.light.setLightingEnabled(enabled);
  },

  render() {
    var lightButton = <LightButton key="enable-light-button" onChange={this.toggleLight} value={this.props.light.getLightingEnabled()} />;
    return (
      <CollapsibleWidget title="Light Properties" subtitle={lightButton} activeSubTitle>
        <section className={style.container}>
          <Coordinate2DWidget onChange={this.onLightPositionChange} width={114} height={114} hideXY />
          <section className={style.controls}>
            <div className={style.inputRow}>
              <label>Ambient</label>
              <NumberInputWidget
                className={style.property} step={0.05} min={0.0} max={1.0}
                key="ka" value={this.state.ka} name="ka" onChange={this.onLightTermsChange}
              />
            </div>
            <div className={style.inputRow}>
              <label>Diffuse</label>
              <NumberInputWidget
                className={style.property} step={0.05} min={0.0} max={1.0}
                key="kd" value={this.state.kd} name="kd" onChange={this.onLightTermsChange}
              />
            </div>
            <div className={style.inputRow}>
              <label>Specular</label>
              <NumberInputWidget
                className={style.property} step={0.05} min={0.0} max={1.0}
                key="ks" value={this.state.ks} name="ks" onChange={this.onLightTermsChange}
              />
            </div>
            <div className={style.inputRow}>
              <label>Alpha</label>
              <NumberInputWidget
                className={style.property} step={1} min={0.0} max={100}
                key="alpha" value={this.state.alpha} name="alpha" onChange={this.onLightTermsChange}
              />
            </div>
          </section>
        </section>
      </CollapsibleWidget>
    );
  },
});
