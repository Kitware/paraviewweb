import React from 'react';

import CollapsibleControlFactory from '.';
import ProbeControl              from '../ProbeControl';

CollapsibleControlFactory.registerWidget(
  'ProbeControl',
  ({ model }) => (
    <ProbeControl
      key="ProbeControl"
      imageBuilder={model}
    />
  )
);
