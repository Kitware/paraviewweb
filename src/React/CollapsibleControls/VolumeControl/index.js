import React                from 'react';

import style                from 'PVWStyle/ReactCollapsibleControls/VolumeControl.mcss';

import CollapsibleWidget    from '../../Widgets/CollapsibleWidget';
import EqualizerWidget      from '../../Widgets/EqualizerWidget';
import LightButton          from '../../Widgets/ToggleIconButtonWidget';
import LookupTableWidget    from '../../Widgets/LookupTableWidget';

export default React.createClass({

  displayName: 'VolumeControl',

  propTypes: {
    computation: React.PropTypes.object.isRequired,
    equalizer: React.PropTypes.object.isRequired,
    intensity: React.PropTypes.object,
    lookupTable: React.PropTypes.object.isRequired,
  },

  componentWillMount() {
    this.equalizerSubscription = this.props.equalizer.onChange(() => {
      this.forceUpdate();
    });
    this.intensitySubscription = this.props.intensity.onChange(() => {
      this.forceUpdate();
    });
    this.computationSubscription = this.props.intensity.onChange(() => {
      this.forceUpdate();
    });
  },

  componentWillUnmount() {
    if (this.equalizerSubscription) {
      this.equalizerSubscription.unsubscribe();
      this.equalizerSubscription = null;
    }
    if (this.intensitySubscription) {
      this.intensitySubscription.unsubscribe();
      this.intensitySubscription = null;
    }
    if (this.computationSubscription) {
      this.computationSubscription.unsubscribe();
      this.computationSubscription = null;
    }
  },

  render() {
    var equalizer = this.props.equalizer,
      lut = this.props.lookupTable,
      intensityButton = (
        <LightButton
          key="toggle-intensity"
          onChange={this.props.intensity.toggleState}
          value={this.props.intensity.getState()}
        />),
      resetOpacityButton = (
        <LightButton
          key="reset"
          icon={style.undoIcon}
          toggle={false}
          onChange={this.props.equalizer.resetOpacities}
          value
        />),
      cpuGpuButton = (
        <LightButton
          key="toggle-gpu"
          icon={style.mobileIcon}
          onChange={this.props.computation.toggleState}
          value={!this.props.computation.getState()}
        />);

    return (
      <div>
        <CollapsibleWidget
          title="LookupTable"
          key="LookupTableWidget_parent"
          subtitle={intensityButton}
          activeSubTitle
        >
          <LookupTableWidget
            key="LookupTableWidget"
            originalRange={lut.originalRange}
            lookupTable={lut.lookupTable}
            lookupTableManager={lut.lookupTableManager}
          />
        </CollapsibleWidget>
        <CollapsibleWidget title="Opacity Control" subtitle={[cpuGpuButton, resetOpacityButton]} activeSubTitle>
          <EqualizerWidget
            key="Equalizer"
            layers={equalizer.getOpacities()}
            onChange={equalizer.updateOpacities}
            colors={equalizer.getColors()}
            spacing={5}
          />
        </CollapsibleWidget>
      </div>);
  },
});
