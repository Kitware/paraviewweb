import React from 'react';

import CollapsibleControlFactory from '.';
import PixelOperatorControl from '../PixelOperatorControl';

CollapsibleControlFactory.registerWidget(
  'PixelOperatorControl',
  ({ model }) => (
    <PixelOperatorControl key="PixelOperatorControl" operator={model} />
  )
);
