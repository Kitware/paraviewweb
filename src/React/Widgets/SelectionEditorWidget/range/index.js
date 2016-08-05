import React from 'react';

import DepthMatchingRender  from '../DepthMatchingRender';
import FiveClauseRender     from './FiveClauseRender';
import OperatorRender       from './OperatorRender';
import SelectionBuilder     from '../../../../Common/Misc/SelectionBuilder';

export default function rangeSelection(props) {
  const vars = props.selection.range.variables;

  let maxDepth = 1;
  Object.keys(vars).forEach((key) => {
    if (vars[key].length > 1) maxDepth = 2;
  });

  const onChange = (changedPath, editing = false) => {
    // clone, so we don't step on whatever is current.
    const selection = JSON.parse(JSON.stringify(props.selection));
    const currentInterval = selection.range.variables[changedPath[0]][changedPath[1]];
    const changeItemIndex = changedPath[2];
    const newValue = changedPath[3];

    if (changeItemIndex === 0 || changeItemIndex === 4) {
      // change an input
      currentInterval.interval[changeItemIndex === 0 ? 0 : 1] = newValue;
    } else if (changeItemIndex === 1 || changeItemIndex === 3) {
      currentInterval.endpoints = (changeItemIndex === 1 ?
                                 `${newValue}${currentInterval.endpoints.slice(1, 2)}` :
                                 `${currentInterval.endpoints.slice(0, 1)}${newValue}`);
    }

    // Notify happens in parent
    props.onChange(editing ? selection : SelectionBuilder.markModified(selection), !editing);
  };

  const onDelete = (pathToDelete) => {
    // clone, so we don't step on whatever is current.
    const selection = JSON.parse(JSON.stringify(props.selection));
    const intervals = selection.range.variables[pathToDelete[0]];
    const deleteIntervalIndex = pathToDelete[1];

    // do we have more that 2 terms for this variable? If so, we can just remove one.
    if (intervals.length >= 2) {
      intervals.splice(deleteIntervalIndex, 1);
    } else {
      // Deleting the last interval - delete the variable.
      delete selection.range.variables[pathToDelete[0]];
    }

    // If we still have at least one variable, selection isn't empty.
    if (Object.keys(selection.range.variables).length !== 0) {
      props.onChange(SelectionBuilder.markModified(selection), true);
    } else {
      props.onChange(SelectionBuilder.empty(), true);
    }
  };

  return (
    <OperatorRender operator={'and'} depth={0} className={props.className}>
      {Object.keys(vars).map(
        (fieldName, idx) => {
          if (vars[fieldName].length > 1) {
            return (
              <OperatorRender operator={'or'} depth={1} key={idx}>
                {vars[fieldName].map((clause, j) =>
                  <FiveClauseRender
                    getLegend={props.getLegend}
                    onChange={onChange}
                    onDelete={onDelete}
                    intervalSpec={clause}
                    fieldName={fieldName}
                    path={[fieldName, j]}
                    key={j}
                  />
                )}
              </OperatorRender>);
          }
          return vars[fieldName].map(
            (clause, j) =>
              <DepthMatchingRender depth={1} maxDepth={maxDepth}>
                <FiveClauseRender
                  getLegend={props.getLegend}
                  onChange={onChange}
                  onDelete={onDelete}
                  intervalSpec={clause}
                  fieldName={fieldName}
                  path={[fieldName, j]}
                  key={j}
                />
              </DepthMatchingRender>
          );
        }
      )}
    </OperatorRender>);
}

rangeSelection.propTypes = {
  selection: React.PropTypes.object,
  ranges: React.PropTypes.object,
  onChange: React.PropTypes.func,
  getLegend: React.PropTypes.func,
  className: React.PropTypes.string,
};
