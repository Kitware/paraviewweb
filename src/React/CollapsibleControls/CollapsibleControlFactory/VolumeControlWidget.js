import React from 'react';

import CollapsibleControlFactory from '.';
import VolumeControl             from '../VolumeControl';

CollapsibleControlFactory.registerWidget(
  'VolumeControlWidget',
  ({ lookupTable, equalizer, intensity, computation }) => (
    <VolumeControl
      key="VolumeControlWidget"
      intensity={intensity}
      computation={computation}
      equalizer={equalizer}
      lookupTable={lookupTable}
    />
  )
);
