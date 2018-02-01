import React from 'react';

import CollapsibleControlFactory from '.';
import LookupTableManagerControl from '../LookupTableManagerControl';

CollapsibleControlFactory.registerWidget(
  'LookupTableManagerWidget',
  ({ lookupTableManager, activeField }) => {
    let field = activeField;
    if (!field) {
      field = lookupTableManager.getActiveField();
    }
    return (
      <LookupTableManagerControl
        key="LookupTableManagerWidget"
        field={field}
        lookupTableManager={lookupTableManager}
      />
    );
  }
);
