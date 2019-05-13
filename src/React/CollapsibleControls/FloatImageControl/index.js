import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactCollapsibleControls/FloatImageControl.mcss';

import CollapsibleWidget from '../../Widgets/CollapsibleWidget';
import LayerItem from './LayerItem';
import NumberSliderWidget from '../../Widgets/NumberSliderWidget';

export default class FloatImageControl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      change: false,
      x: props.model.dimensions[0] / 2,
      y: props.model.dimensions[1] / 2,
    };

    this.attachListener(props.model);

    // Bind callback
    this.onProbeChange = this.onProbeChange.bind(this);
    this.attachListener = this.attachListener.bind(this);
    this.detachListener = this.detachListener.bind(this);
    this.updateLight = this.updateLight.bind(this);
    this.toggleProbe = this.toggleProbe.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const previous = this.props.model;
    const next = nextProps.model;

    if (previous !== next) {
      this.detachListener();
      this.attachListener(next);

      // Force redraw
      this.setState({ change: !this.state.change });
    }
  }

  onProbeChange(e) {
    const name = e.target.name;
    const newVal = Number(e.target.value);
    const newState = { x: this.state.x, y: this.state.y };

    newState[name] = newVal;
    this.setState(newState);
    this.props.model.getTimeChart(newState.x, newState.y);
  }

  attachListener(model) {
    this.changeSubscription = model.onProbeChange((data, envelope) => {
      this.forceUpdate();
    });
  }

  detachListener() {
    if (this.changeSubscription) {
      this.changeSubscription.unsubscribe();
      this.changeSubscription = null;
    }
  }

  updateLight(event) {
    this.props.model.setLight(255 - event.target.value);
    this.setState({ change: !this.state.change });
  }

  toggleProbe(newVal) {
    this.props.model.getTimeProbe().enabled = !!newVal;

    if (this.props.model.getTimeProbe().enabled) {
      this.props.model.getTimeChart();
    }

    this.setState({ change: !this.state.change });

    this.props.model.getTimeProbe().triggerChange();
    this.props.model.render();
  }

  render() {
    const floatImageModel = this.props.model;
    const timeProbe = floatImageModel.getTimeProbe();
    const width = floatImageModel.dimensions[0];
    const height = floatImageModel.dimensions[1];

    return (
      <div className={style.container}>
        <CollapsibleWidget title="Scene">
          {floatImageModel.getLayers().map((item, idx) => (
            <LayerItem key={idx} item={item} model={floatImageModel} />
          ))}
          <div className={style.item}>
            <div className={style.label}>Light</div>
            <div className={style.actions}>
              <input
                className={style.lightSlider}
                type="range"
                min="0"
                max="128"
                value={255 - floatImageModel.getLight()}
                onChange={this.updateLight}
              />
            </div>
          </div>
        </CollapsibleWidget>
        <CollapsibleWidget
          title="Time probe"
          open={timeProbe.enabled}
          subtitle={timeProbe.enabled ? (timeProbe.value || 0).toString() : ''}
          visible={floatImageModel.isMultiView()}
          onChange={this.toggleProbe}
        >
          <div className={style.item}>
            <div className={style.label}>X</div>
            <div className={style.actions}>
              <NumberSliderWidget
                step={1}
                min={0.0}
                max={width}
                key="x"
                value={this.state.x}
                name="x"
                onChange={this.onProbeChange}
              />
            </div>
          </div>
          <div className={style.item}>
            <div className={style.label}>Y</div>
            <div className={style.actions}>
              <NumberSliderWidget
                step={1}
                min={0.0}
                max={height}
                key="y"
                value={this.state.y}
                name="y"
                onChange={this.onProbeChange}
              />
            </div>
          </div>
        </CollapsibleWidget>
      </div>
    );
  }
}

FloatImageControl.propTypes = {
  model: PropTypes.object.isRequired,
};
