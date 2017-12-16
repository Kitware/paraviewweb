import React from 'react';
import PropTypes from 'prop-types';

import NumberSliderWidget from '../../Widgets/NumberSliderWidget';
import CollapsibleWidget  from '../../Widgets/CollapsibleWidget';

function getImageBuilder(props) {
  let imageBuilder = props.imageBuilder;

  if (!imageBuilder) {
    const key = Object.keys(props.imageBuilders)[0];
    imageBuilder = props.imageBuilders[key].builder;
  }

  return imageBuilder;
}

export default class ProbeControl extends React.Component {
  constructor(props) {
    super(props);

    const imageBuilder = getImageBuilder(props);
    this.state = {
      probe: [
        imageBuilder.getProbe()[0],
        imageBuilder.getProbe()[1],
        imageBuilder.getProbe()[2],
      ],
      showFieldValue: true,
    };

    // Bind callback
    this.getImageBuilder = getImageBuilder;
    this.onProbeVisibilityChange = this.onProbeVisibilityChange.bind(this);
    this.getImageBuilder = this.getImageBuilder.bind(this);
    this.attachImageBuilderListeners = this.attachImageBuilderListeners.bind(this);
    this.detachImageBuilderListeners = this.detachImageBuilderListeners.bind(this);
    this.updateRenderMethod = this.updateRenderMethod.bind(this);
    this.probeChange = this.probeChange.bind(this);
  }

  componentWillMount() {
    this.attachImageBuilderListeners(this.getImageBuilder(this.props));
  }

  /* eslint-disable */
  componentDidMount() {
    this.isReady = true;
    this.setState({
      showFieldValue: this.probeInput.isExpanded(),
    });
  }
  /* eslint-enable */

  componentWillReceiveProps(nextProps) {
    var previousImageBuilder = this.getImageBuilder(this.props),
      nextImageBuilder = this.getImageBuilder(nextProps);

    if (previousImageBuilder !== nextImageBuilder) {
      this.attachImageBuilderListeners(nextImageBuilder);
    }
  }

  componentWillUnmount() {
    this.isReady = false;
    this.detachImageBuilderListeners();
  }

  onProbeVisibilityChange(isProbeOpen) {
    this.setState({
      showFieldValue: isProbeOpen,
    });

    setImmediate(() => {
      if (this.props.imageBuilders) {
        Object.keys(this.props.imageBuilders).forEach((key) => {
          const builder = this.props.imageBuilders[key].builder;
          builder.setCrossHairEnable(isProbeOpen);
          builder.render();
        });
      }
      if (this.props.imageBuilder) {
        this.props.imageBuilder.setCrossHairEnable(isProbeOpen);
        this.props.imageBuilder.render();
      }
    });
  }

  attachImageBuilderListeners(imageBuilder) {
    this.detachImageBuilderListeners();
    this.probeListenerSubscription = imageBuilder.onProbeChange((probe, envelope) => {
      var field = imageBuilder.getFieldValueAtProbeLocation();
      if (this.isReady) {
        this.setState({
          probe, field,
        });
      }
    });

    this.probeDataListenerSubscription = imageBuilder.onProbeLineReady((data, envelope) => {
      var field = imageBuilder.getFieldValueAtProbeLocation();
      if (this.isReady && field !== this.state.field) {
        this.setState({
          field,
        });
      }
    });
  }

  detachImageBuilderListeners() {
    if (this.probeListenerSubscription) {
      this.probeListenerSubscription.unsubscribe();
      this.probeListenerSubscription = null;
    }
    if (this.probeDataListenerSubscription) {
      this.probeDataListenerSubscription.unsubscribe();
      this.probeDataListenerSubscription = null;
    }
  }

  updateRenderMethod(event) {
    if (this.props.imageBuilder) {
      this.props.imageBuilder.setRenderMethod(event.target.value);
      this.props.imageBuilder.render();
      this.forceUpdate();
    }
  }

  probeChange(event) {
    var value = Number(event.target.value),
      probe = this.state.probe,
      idx = Number(event.target.name);

    probe[idx] = value;

    this.getImageBuilder(this.props).setProbe(probe[0], probe[1], probe[2]);
  }

  render() {
    var imageBuilder = this.getImageBuilder(this.props),
      value = this.state.field || imageBuilder.getFieldValueAtProbeLocation(),
      valueStr = `${value}`;

    if (value === undefined) {
      valueStr = '';
    } else {
      if (valueStr && valueStr.length > 6) {
        valueStr = value.toFixed(5);
      }
      if (Math.abs(value) < 0.00001) {
        valueStr = '0';
      }
    }

    return (
      <div>
        <CollapsibleWidget title="Render method" visible={imageBuilder.isRenderMethodMutable()} >
          <select
            style={{ width: '100%' }}
            value={imageBuilder.getRenderMethod()}
            onChange={this.updateRenderMethod}
          >
            {imageBuilder.getRenderMethods().map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </CollapsibleWidget>
        <CollapsibleWidget
          title="Probe"
          subtitle={this.state.showFieldValue ? valueStr : ''}
          ref={(c) => { this.probeInput = c; }}
          onChange={this.onProbeVisibilityChange}
          open={imageBuilder.isCrossHairEnabled()}
        >
          <NumberSliderWidget
            name="0"
            min="0" max={imageBuilder.metadata.dimensions[0] - 1}
            key="slider-x"
            value={this.state.probe[0]}
            onChange={this.probeChange}
          />
          <NumberSliderWidget
            name="1"
            min="0" max={imageBuilder.metadata.dimensions[1] - 1}
            key="slider-Y"
            value={this.state.probe[1]}
            onChange={this.probeChange}
          />
          <NumberSliderWidget
            name="2"
            min="0" max={imageBuilder.metadata.dimensions[2] - 1}
            key="slider-Z"
            value={this.state.probe[2]}
            onChange={this.probeChange}
          />
        </CollapsibleWidget>
      </div>
    );
  }
}

ProbeControl.propTypes = {
  imageBuilder: PropTypes.object.isRequired,
  imageBuilders: PropTypes.object,
};

ProbeControl.defaultProps = {
  imageBuilders: {},
};
