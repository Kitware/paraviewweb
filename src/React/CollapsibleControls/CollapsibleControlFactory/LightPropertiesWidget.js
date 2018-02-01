import React from 'react';

import CollapsibleControlFactory from '.';
import LightControl from '../LightControl';

CollapsibleControlFactory.registerWidget(
  'LightPropertiesWidget',
  ({ light }) => <LightControl key="LightPropertiesWidget" light={light} />
);
