import React from 'react';

import OperatorRender from './OperatorRender';
import FiveClauseRender from './FiveClauseRender';
import DepthMatchingRender from '../DepthMatchingRender';
// import NumberFormatter from '../../../../Common/Misc/NumberFormatter';
import SelectionBuilder from '../../../../Common/Misc/SelectionBuilder';

// Callback methods
export function onChangeSelection(currSelection, changedPath, editing = false) {
  // clone, so we don't step on whatever is current.
  const selection = JSON.parse(JSON.stringify(currSelection));
  const currentInterval = selection.range.variables[changedPath[0]][changedPath[1]];
  const changeItemIndex = changedPath[2];
  const newValue = changedPath[3];

  // console.log('change', currentInterval, changeItemIndex, newValue);
  if (changeItemIndex === 0 || changeItemIndex === 4) {
    // change an input
    currentInterval.interval[changeItemIndex === 0 ? 0 : 1] = newValue;
  } else if (changeItemIndex === 1 || changeItemIndex === 3) {
    currentInterval.endpoints = (changeItemIndex === 1 ?
                                 `${newValue}${currentInterval.endpoints.slice(1, 2)}` :
                                 `${currentInterval.endpoints.slice(0, 1)}${newValue}`);
  }
  // Notify happens in parent
  return { selection, propagate: !editing };
}

export function onDeleteSelection(currSelection, pathToDelete) {
  // clone, so we don't step on whatever is current.
  const selection = JSON.parse(JSON.stringify(currSelection));
  const intervals = selection.range.variables[pathToDelete[0]];
  const deleteIntervalIndex = pathToDelete[1];

  // console.log('delete', intervals, deleteIntervalIndex);
  // do we have more that 2 terms for this variable? If so, we can just remove one.
  if (intervals.length >= 2) {
    intervals.splice(deleteIntervalIndex, 1);
  } else {
    // Deleting the last interval - delete the variable.
    delete selection.range.variables[pathToDelete[0]];
  }

  // If we still have at least one variable, selection isn't empty.
  if (Object.keys(selection.range.variables).length !== 0) {
    return { selection, propagate: true };
  }
  return { selection: SelectionBuilder.empty(), propagate: true };
}

export function render(selection, props, onChange = null, onDelete = null) {
  const vars = selection.range.variables;

  let maxDepth = 1;
  Object.keys(vars).forEach((key) => {
    if (vars[key].length > 1) maxDepth = 2;
  });

  return (<OperatorRender operator={'and'} depth={0} >{
    Object.keys(vars).map(
      (fieldName, idx) => {
        // doesn't like legendService, but it's valid for 5C
        /* eslint-disable react/prop-types */
        const getSubProps = (clause, j) => ({ onChange, onDelete, intervalSpec: clause, fieldName, path: [fieldName, j],
                                              key: j, legendService: props.provider });
        /* eslint-enable react/prop-types */
        if (vars[fieldName].length > 1) {
          return (<OperatorRender operator={'or'} depth={1} key={idx}>{
            vars[fieldName].map(
              (clause, j) => (
                <FiveClauseRender {...getSubProps(clause, j)} />
              )
            )
          }</OperatorRender>);
        }
        return vars[fieldName].map(
          (clause, j) => (
            <DepthMatchingRender depth={1} maxDepth={maxDepth}><FiveClauseRender {...getSubProps(clause, j)} /></DepthMatchingRender>
          )
        );
      }
    )
  }</OperatorRender>);
}

export default {
  render,
  onChangeSelection,
  onDeleteSelection,
};
