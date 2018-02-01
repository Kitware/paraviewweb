import React from 'react';

import CollapsibleControlFactory from '.';
import FloatImageControl from '../FloatImageControl';

CollapsibleControlFactory.registerWidget('FloatImageControl', ({ model }) => (
  <FloatImageControl key="FloatImageControl" model={model} />
));
