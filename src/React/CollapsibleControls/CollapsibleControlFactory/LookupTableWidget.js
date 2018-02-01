import React from 'react';

import CollapsibleControlFactory from '.';
import CollapsibleWidget from '../../Widgets/CollapsibleWidget';
import LookupTableWidget from '../../Widgets/LookupTableWidget';

CollapsibleControlFactory.registerWidget(
  'LookupTableWidget',
  ({ originalRange = [0, 1], lookupTable, lookupTableManager }) => (
    <CollapsibleWidget title="LookupTable" key="LookupTableWidget_parent">
      <LookupTableWidget
        key="LookupTableWidget"
        originalRange={originalRange}
        lookupTable={lookupTable}
        lookupTableManager={lookupTableManager}
      />
    </CollapsibleWidget>
  )
);
