import React from 'react';

import FieldRender from './FieldRender';
import DividerRender from './DividerRender';
// import NumberFormatter from '../../../../Common/Misc/NumberFormatter';
import SelectionBuilder from '../../../../Common/Misc/SelectionBuilder';

// Callback methods
export function onChangeSelection(currSelection, changedPath, editing = false) {
  // clone, so we don't step on whatever is current.
  const selection = JSON.parse(JSON.stringify(currSelection));
  if (changedPath[0] === 'dividers') {
    const divider = selection.partition.dividers[changedPath[1]];
    const changeItemKey = changedPath[2];
    const newValue = changedPath[3];

    // console.log('change', divider, changeItemKey, newValue);
    divider[changeItemKey] = newValue;
  }
  // Notify happens in parent
  return { selection, propagate: !editing };
}

export function onDeleteSelection(currSelection, pathToDelete) {
  // clone, so we don't step on whatever is current.
  const selection = JSON.parse(JSON.stringify(currSelection));
  if (pathToDelete[0] === 'dividers') {
    const dividers = selection.partition.dividers;
    const deleteIndex = pathToDelete[1];

    // console.log('delete', selection.partition.dividers[pathToDelete[1]], deleteIndex);
    // remove one.
    dividers.splice(deleteIndex, 1);
  }
  // If we still have at least one divider, selection isn't empty.
  if (selection.partition.dividers.length !== 0) {
    return { selection, propagate: true };
  }
  return { selection: SelectionBuilder.empty(), propagate: true };
}

export function render(selection, props, onChange = null, onDelete = null) {
  const dividers = selection.partition.dividers;
  const fieldName = selection.partition.variable;

  // doesn't like provider, legendService, but it's valid for us
  /* eslint-disable react/prop-types */
  return (<FieldRender fieldName={fieldName} legendService={props.provider} depth={0} >{
    dividers.map(
      (divider, idx) => {
        const subProps = { onChange, onDelete, divider, path: ['dividers', idx],
                           key: idx, legendService: props.provider };
        /* eslint-enable react/prop-types */

        return (<DividerRender {...subProps} />);
      }
    )
  }</FieldRender>);
}

export default {
  render,
  onChangeSelection,
  onDeleteSelection,
};
