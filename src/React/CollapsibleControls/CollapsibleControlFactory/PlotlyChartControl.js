import React from 'react';

import CollapsibleControlFactory from '.';
import PlotlyChartControl        from '../PlotlyChartControl';

CollapsibleControlFactory.registerWidget(
  'PlotlyChartControl',
  ({ model }) => (
    <PlotlyChartControl
      key="PlotlyChartControl"
      model={model}
    />
  )
);
