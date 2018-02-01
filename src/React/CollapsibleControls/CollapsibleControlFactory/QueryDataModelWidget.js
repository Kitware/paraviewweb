import React from 'react';

import CollapsibleControlFactory from '.';
import QueryDataModelControl from '../QueryDataModelControl';

CollapsibleControlFactory.registerWidget(
  'QueryDataModelWidget',
  ({ queryDataModel, handleExploration }) => (
    <QueryDataModelControl
      key="QueryDataModel"
      handleExploration={!!handleExploration}
      model={queryDataModel}
    />
  )
);
