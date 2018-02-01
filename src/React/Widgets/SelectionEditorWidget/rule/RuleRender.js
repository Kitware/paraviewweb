import React from 'react';
import PropTypes from 'prop-types';

import OperatorRender from './OperatorRender';
import FiveClauseRender from './FiveClauseRender';
import DepthMatchingRender from '../DepthMatchingRender';

export default function render(props) {
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
      />
    );
  }
  if (ruleSelector === '5C') {
    return (
      <DepthMatchingRender depth={props.depth} maxDepth={props.maxDepth}>
        <FiveClauseRender
          getLegend={props.getLegend}
          onChange={props.onChange}
          onDelete={props.onDelete}
          rule={props.rule}
          depth={props.depth}
          maxDepth={props.maxDepth}
          path={props.path}
        />
      </DepthMatchingRender>
    );
  }
  return null;
}

render.propTypes = {
  className: PropTypes.string,
  rule: PropTypes.object,
  depth: PropTypes.number,
  maxDepth: PropTypes.number,
  path: PropTypes.array,
  onChange: PropTypes.func,
  onDelete: PropTypes.func,
  getLegend: PropTypes.func,
};

render.defaultProps = {
  className: undefined,
  rule: undefined,
  depth: undefined,
  maxDepth: undefined,
  path: undefined,
  onChange: undefined,
  onDelete: undefined,
  getLegend: undefined,
};
