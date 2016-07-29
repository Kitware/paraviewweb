import React from 'react';

import OperatorRender from './OperatorRender';
import FiveClauseRender from './FiveClauseRender';
import DepthMatchingRender from './DepthMatchingRender';

export function render(rule, props, path, depth, maxDepth = 2, onChange = null, onDelete = null) {
  if (!rule || rule.length === 0) {
    return null;
  }

  const ruleSelector = rule.type;
  const subProps = Object.assign({ onChange, onDelete }, props, { rule, depth, maxDepth, path });

  if (!ruleSelector) {
    return null;
  }

  if (ruleSelector === 'logical') {
    return <OperatorRender {...subProps} />;
  }
  if (ruleSelector === '5C') {
    return <DepthMatchingRender depth={depth} maxDepth={maxDepth}><FiveClauseRender {...subProps} /></DepthMatchingRender>;
  }
  return null;
}

export default { render };
