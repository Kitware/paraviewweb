import React     from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactViewers/Probe3DViewer.mcss';

import AbstractViewerMenu        from '../AbstractViewerMenu';
import LineChartViewer           from '../LineChartViewer';
import LookupTableManagerControl from '../../CollapsibleControls/LookupTableManagerControl';
import ProbeControl              from '../../CollapsibleControls/ProbeControl';
import CollapsibleWidget         from '../../Widgets/CollapsibleWidget';
import QueryDataModelWidget      from '../../Widgets/QueryDataModelWidget';
import ImageRenderer             from '../../Renderers/ImageRenderer';

const chartAxisNames = ['x', 'y', 'z'];
const renderAxisMap = {
  XY: [0, 1, 2],
  ZY: [2, 1, 0],
  XZ: [0, 2, 1],
};

export default class Probe3DViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      probe: [
        props.imageBuilder.getProbe()[0],
        props.imageBuilder.getProbe()[1],
        props.imageBuilder.getProbe()[2],
      ],
      chartVisible: false,
      chartSize: {
        width: 300,
        height: 300,
      },
      chartData: {
        xRange: [0, 1],
        fields: [],
      },
      chartAxis: 0,
    };

    // Bind callback
    this.onChartVisibilityChange = this.onChartVisibilityChange.bind(this);
    this.validateChartAxis = this.validateChartAxis.bind(this);
    this.updateChart = this.updateChart.bind(this);
    this.dragOn = this.dragOn.bind(this);
    this.dragOff = this.dragOff.bind(this);
    this.dragChart = this.dragChart.bind(this);
  }

  // Auto mount listener unless notified otherwise
  componentWillMount() {
    var queryDataModel = this.props.queryDataModel,
      imageBuilder = this.props.imageBuilder;

    this.dragChartFlag = false;
    this.liveChartAxis = 0;

    // Update probe chart data if data change
    this.queryDataModelDataSubscription = queryDataModel.onDataChange((data, envelope) => {
      this.setState({ chartData: imageBuilder.getProbeLine(this.liveChartAxis) });
    });

    // Render method change
    imageBuilder.setRenderMethodMutable();
    this.renderMethodChangeSubscription = imageBuilder.onRenderMethodChange((data, envelope) => {
      if (this.state.chartVisible) {
        this.validateChartAxis();
      }
    });

    // Chart management
    imageBuilder.setProbeLineNotification(true);
    this.chartListenerSubscription = imageBuilder.onProbeLineReady((data, envelope) => {
      var chartData = data[chartAxisNames[this.liveChartAxis]];
      this.setState({ chartData });
    });

    this.probeListenerSubscription = imageBuilder.onProbeChange((probe, envelope) => {
      this.setState({ probe });
    });
  }

  componentDidUpdate() {
    if (this.state.chartVisible) {
      this.chartViewer.updateDimensions();
    }
  }

  // Auto unmount listener
  componentWillUnmount() {
    if (this.queryDataModelDataSubscription) {
      this.queryDataModelDataSubscription.unsubscribe();
      this.queryDataModelDataSubscription = null;
    }
    if (this.renderMethodChangeSubscription) {
      this.renderMethodChangeSubscription.unsubscribe();
      this.renderMethodChangeSubscription = null;
    }
    if (this.chartListenerSubscription) {
      this.chartListenerSubscription.unsubscribe();
      this.chartListenerSubscription = null;
    }
    if (this.probeListenerSubscription) {
      this.probeListenerSubscription.unsubscribe();
      this.probeListenerSubscription = null;
    }
  }

  onChartVisibilityChange(isOpen) {
    if (isOpen) {
      this.validateChartAxis();
    }
    this.setState({ chartVisible: isOpen });
  }

  validateChartAxis() {
    var renderCoords = this.props.imageBuilder.getRenderMethod(),
      chartAxis = 'XYZ'[this.liveChartAxis];

    if (renderCoords.indexOf(chartAxis) === -1) {
      const chartData = this.props.imageBuilder.getProbeLine(chartAxis);

      chartAxis = 'XYZ'.indexOf(renderCoords[0]);

      this.liveChartAxis = chartAxis;
      this.setState({ chartAxis, chartData });
    }
  }

  updateChart(event) {
    var idx = Number(event.target.getAttribute('data-index')),
      imageBuilder = this.props.imageBuilder,
      chartData = imageBuilder.getProbeLine(idx);

    this.liveChartAxis = idx;
    this.setState({ chartData, chartAxis: idx });
  }

  dragOn(event) {
    var el = this.chartContainer,
      top = Number(el.style.top.replace('px', '')),
      left = Number(el.style.left.replace('px', ''));

    this.dragChartFlag = true;
    this.dragPosition = [event.clientX - left, event.clientY - top];
  }

  dragOff() {
    this.dragChartFlag = false;
  }

  dragChart(event) {
    if (this.dragChartFlag) {
      const el = this.chartContainer;
      el.style.left = `${(event.clientX - this.dragPosition[0])}px`;
      el.style.top = `${(event.clientY - this.dragPosition[1])}px`;
    }
  }

  render() {
    const queryDataModel = this.props.queryDataModel;
    const imageBuilder = this.props.imageBuilder;
    const dimensions = imageBuilder.metadata.dimensions;
    const axisMap = renderAxisMap[this.props.imageBuilder.getRenderMethod()];

    const buttonClasses = [];
    [0, 1, 2].forEach((el) => {
      var classes = [];
      if (axisMap[2] === el) {
        classes.push(style.hidden);
      } else if (this.state.chartAxis === el) {
        classes.push(style.selectedButton);
      } else {
        classes.push(style.button);
      }
      buttonClasses.push(classes.join(' '));
    });

    return (
      <div className={style.container}>
        <AbstractViewerMenu
          queryDataModel={queryDataModel}
          imageBuilder={imageBuilder}
          mouseListener={imageBuilder.getListeners()}
          rendererClass={ImageRenderer}
        >
          <LookupTableManagerControl
            key="LookupTableManagerWidget"
            lookupTableManager={imageBuilder.lookupTableManager}
            field={imageBuilder.getField()}
          />
          <ProbeControl
            imageBuilder={imageBuilder}
          />
          <CollapsibleWidget
            title="Chart"
            visible={this.props.probe && imageBuilder.isCrossHairEnabled()}
            onChange={this.onChartVisibilityChange}
            open={this.state.chartVisible}
          >
            <div
              className={style.row}
            >
              <button
                className={buttonClasses[0]}
                type="button"
                data-index="0"
                onClick={this.updateChart}
              >X</button>
              <button
                className={buttonClasses[1]}
                type="button"
                data-index="1"
                onClick={this.updateChart}
              >Y</button>
              <button
                className={buttonClasses[2]}
                type="button"
                data-index="2"
                onClick={this.updateChart}
              >Z</button>
            </div>
          </CollapsibleWidget>
          <CollapsibleWidget
            title="Parameters"
            visible={queryDataModel.originalData.arguments_order.length > 0}
          >
            <QueryDataModelWidget model={queryDataModel} />
          </CollapsibleWidget>
        </AbstractViewerMenu>
        <div
          ref={(c) => { this.chartContainer = c; }}
          className={(this.state.chartVisible && imageBuilder.isCrossHairEnabled()) ? style.chartContainer : style.hidden}
          onMouseMove={this.dragChart}
          onMouseUp={this.dragOff}
          onMouseDown={this.dragOn}
        >
          <LineChartViewer
            ref={(c) => { this.chartViewer = c; }}
            cursor={(this.state.probe[this.state.chartAxis] / dimensions[this.state.chartAxis])}
            data={this.state.chartData}
            width={this.state.chartSize.width}
            height={this.state.chartSize.height}
          />
        </div>
      </div>);
  }
}


Probe3DViewer.propTypes = {
  imageBuilder: PropTypes.object.isRequired,
  probe: PropTypes.bool,
  queryDataModel: PropTypes.object.isRequired,
  userData: PropTypes.object,
};

Probe3DViewer.defaultProps = {
  probe: true,
};
