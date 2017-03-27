import React from 'react';

import CollapsibleControlFactory from '.';
import CollapsibleWidget         from '../../Widgets/CollapsibleWidget';
import CompositePipelineWidget   from '../../Widgets/CompositePipelineWidget';

CollapsibleControlFactory.registerWidget(
  'CompositeControl',
  ({ pipelineModel }) => (
    <CollapsibleWidget title="Pipeline" key="CompositeControl_parent">
      <CompositePipelineWidget
        key="CompositeControl"
        model={pipelineModel}
      />
    </CollapsibleWidget>)
  );
