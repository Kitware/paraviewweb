import React from 'react';

import CollapsibleControlFactory from '.';
import EqualizerWidget           from '../../Widgets/EqualizerWidget';

CollapsibleControlFactory.registerWidget(
  'EqualizerWidget',
  ({ levels, colors = ['#cccccc'], callback }) => (
    <EqualizerWidget
      key="Equalizer"
      width={300}
      height={120}
      layers={levels}
      onChange={callback}
      colors={colors}
    />
  )
);
