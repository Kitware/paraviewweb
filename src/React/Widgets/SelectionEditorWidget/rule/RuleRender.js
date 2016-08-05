import React from 'react';

import OperatorRender from './OperatorRender';
import FiveClauseRender from './FiveClauseRender';
import DepthMatchingRender from '../DepthMatchingRender';

export default function ruleRender(props) {
  const ruleSelector = props.rule.type;
  if (ruleSelector === 'logical') {
    return (
      <OperatorRender
        className={props.className}
        getLegend={props.getLegend}

        onChange={props.onChange}
        onDelete={props.onDelete}

        rule={props.rule}
        depth={props.depth}
        maxDepth={props.maxDepth}
        path={props.path}
      />);
  }
  if (ruleSelector === '5C') {
    return (
      <DepthMatchingRender depth={props.depth} maxDepth={props.maxDepth} >
        <FiveClauseRender
          getLegend={props.getLegend}

          onChange={props.onChange}
          onDelete={props.onDelete}

          rule={props.rule}
          depth={props.depth}
          maxDepth={props.maxDepth}
          path={props.path}
        />
      </DepthMatchingRender>);
  }
  return null;
}

ruleRender.propTypes = {
  className: React.PropTypes.string,
  rule: React.PropTypes.object,
  depth: React.PropTypes.number,
  maxDepth: React.PropTypes.number,
  path: React.PropTypes.array,
  onChange: React.PropTypes.func,
  onDelete: React.PropTypes.func,
  getLegend: React.PropTypes.func,
};
