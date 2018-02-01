import React from 'react';

import CollapsibleControlFactory from '.';
import TimeFloatImageControl from '../TimeFloatImageControl';

CollapsibleControlFactory.registerWidget(
  'TimeFloatImageControl',
  ({ model }) => (
    <TimeFloatImageControl key="TimeFloatImageControl" model={model} />
  )
);
