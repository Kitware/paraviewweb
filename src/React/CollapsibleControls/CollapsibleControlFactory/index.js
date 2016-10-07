import React                        from 'react';
import CollapsibleWidget            from '../../Widgets/CollapsibleWidget';

// Full feature control
import FloatImageControl            from '../FloatImageControl';
import TimeFloatImageControl        from '../TimeFloatImageControl';
import LightControl                 from '../LightControl';
import LookupTableManagerControl    from '../LookupTableManagerControl';
import PixelOperatorControl         from '../PixelOperatorControl';
import PlotlyChartControl           from '../PlotlyChartControl';
import ProbeControl                 from '../ProbeControl';
import QueryDataModelControl        from '../QueryDataModelControl';
import VolumeControl                from '../VolumeControl';

// Need to be wrapped inside CollapsibleWidget
import CompositePipelineWidget      from '../../Widgets/CompositePipelineWidget';
import EqualizerWidget              from '../../Widgets/EqualizerWidget';
import LookupTableWidget            from '../../Widgets/LookupTableWidget';


/* eslint-disable react/display-name */
/* eslint-disable react/no-multi-comp */
/* eslint-disable react/prop-types */
/* eslint-disable react/no-string-refs */
const WidgetFactoryMapping = {
  QueryDataModelWidget({ queryDataModel, handleExploration }) {
    return (
      <QueryDataModelControl
        key="QueryDataModel"
        handleExploration={!!handleExploration}
        model={queryDataModel}
      />);
  },
  EqualizerWidget({ levels, colors = ['#cccccc'], callback }) {
    return (
      <EqualizerWidget
        key="Equalizer"
        width={300}
        height={120}
        layers={levels}
        onChange={callback}
        colors={colors}
      />);
  },
  LookupTableWidget({ originalRange = [0, 1], lookupTable, lookupTableManager }) {
    return (
      <CollapsibleWidget title="LookupTable" key="LookupTableWidget_parent">
        <LookupTableWidget
          key="LookupTableWidget"
          ref="LookupTableWidget"
          originalRange={originalRange}
          lookupTable={lookupTable}
          lookupTableManager={lookupTableManager}
        />
      </CollapsibleWidget>);
  },
  LookupTableManagerWidget({ lookupTableManager, activeField }) {
    var field = activeField;
    if (!field) {
      field = lookupTableManager.getActiveField();
    }
    return (
      <LookupTableManagerControl
        key="LookupTableManagerWidget"
        ref="LookupTableManagerWidget"
        field={field}
        lookupTableManager={lookupTableManager}
      />);
  },
  CompositeControl({ pipelineModel }) {
    return (
      <CollapsibleWidget title="Pipeline" key="CompositeControl_parent">
        <CompositePipelineWidget
          key="CompositeControl"
          ref="CompositeControl"
          model={pipelineModel}
        />
      </CollapsibleWidget>);
  },
  ProbeControl({ model }) {
    return (
      <ProbeControl
        key="ProbeControl"
        ref="ProbeControl"
        imageBuilder={model}
      />);
  },
  LightPropertiesWidget({ light }) {
    return (
      <LightControl
        key="LightPropertiesWidget"
        ref="LightPropertiesWidget"
        light={light}
      />);
  },
  VolumeControlWidget({ lookupTable, equalizer, intensity, computation }) {
    return (
      <VolumeControl
        key="VolumeControlWidget"
        ref="VolumeControlWidget"
        intensity={intensity}
        computation={computation}
        equalizer={equalizer}
        lookupTable={lookupTable}
      />);
  },
  PixelOperatorControl({ model }) {
    return (
      <PixelOperatorControl
        key="PixelOperatorControl"
        ref="PixelOperatorControl"
        operator={model}
      />);
  },
  FloatImageControl({ model }) {
    return (
      <FloatImageControl
        key="FloatImageControl"
        ref="FloatImageControl"
        model={model}
      />);
  },
  TimeFloatImageControl({ model }) {
    return (
      <TimeFloatImageControl
        key="TimeFloatImageControl"
        ref="TimeFloatImageControl"
        model={model}
      />);
  },
  PlotlyChartControl({ model }) {
    return (
      <PlotlyChartControl
        key="PlotlyChartControl"
        ref="PlotlyChartControl"
        model={model}
      />);
  },
};
/* eslint-enable react/display-name */
/* eslint-enable react/no-multi-comp */
/* eslint-enable react/prop-types */
/* eslint-enable react/no-string-refs */
function createWidget(name, options) {
  var fn = WidgetFactoryMapping[name];

  if (fn) {
    return fn(options);
  }
  return null;
}

function getWidgets(obj) {
  if (!obj) {
    return [];
  }

  const widgetDesc = obj.getControlWidgets(),
    widgetList = [];

  widgetDesc.forEach((desc) => {
    var widget = createWidget(desc.name, desc);
    if (widget) {
      widgetList.push(widget);
    } else {
      console.error('Unable to create widget for name:', desc.name);
    }
  });

  return widgetList;
}

export default {
  createWidget,
  getWidgets,
};
