import React from 'react';

import FieldRender      from './FieldRender';
import DividerRender    from './DividerRender';
import SelectionBuilder from '../../../../Common/Misc/SelectionBuilder';

function clampDividerUncertainty(dividers, index, inMaxUncertainty) {
  const divider = dividers[index];
  const val = divider.value;
  const uncertScale = 1.0;
  let maxUncertainty = inMaxUncertainty;
  // Note comparison with low/high divider is signed. If val indicates divider has been
  // moved _past_ the neighboring divider, low/high will be negative.
  if (index > 0) {
    const low = dividers[index - 1].value + (dividers[index - 1].uncertainty * uncertScale);
    maxUncertainty = Math.min(maxUncertainty, (val - low) / uncertScale);
  }
  if (index < dividers.length - 1) {
    const high = dividers[index + 1].value - (dividers[index + 1].uncertainty * uncertScale);
    maxUncertainty = Math.min((high - val) / uncertScale, maxUncertainty);
  }
  // make sure uncertainty is zero when val has passed a neighbor.
  maxUncertainty = Math.max(maxUncertainty, 0);
  divider.uncertainty = Math.min(maxUncertainty, divider.uncertainty);
}

function clampDivider(selection, index, ranges) {
  // make sure uncertainties don't overlap.
  const divider = selection.partition.dividers[index];

  let maxUncertainty = Number.MAX_VALUE;
  const minMax = ranges ? ranges[selection.partition.variable] : undefined;
  if (minMax) {
    maxUncertainty = 0.5 * (minMax[1] - minMax[0]);
    // if available, clamp divider value to min/max of its range.
    divider.value = Math.min(minMax[1], Math.max(minMax[0], divider.value));
  }
  clampDividerUncertainty(selection.partition.dividers, index, maxUncertainty);
  // Re-sort dividers so uncertainty clamping works next time.
  selection.partition.dividers.sort((a, b) => (a.value - b.value));
  // make sure uncertainties don't overlap.
  selection.partition.dividers.forEach((divdr, i) => {
    clampDividerUncertainty(selection.partition.dividers, i, maxUncertainty);
  });
}

export default function partitionSelection(props) {
  const onChange = (changedPath, editing = false) => {
    // clone, so we don't step on whatever is current.
    const selection = JSON.parse(JSON.stringify(props.selection));
    if (changedPath[0] === 'dividers') {
      const index = changedPath[1];
      const divider = selection.partition.dividers[index];
      const changeItemKey = changedPath[2];
      const newValue = changedPath[3];

      // console.log('change', divider, changeItemKey, newValue);
      divider[changeItemKey] = newValue;
      if (!editing) clampDivider(selection, index, props.ranges);
    }

    // Notify happens in parent
    props.onChange(editing ? selection : SelectionBuilder.markModified(selection), !editing);
  };

  const onDelete = (pathToDelete) => {
    // clone, so we don't step on whatever is current.
    const selection = JSON.parse(JSON.stringify(props.selection));
    if (pathToDelete[0] === 'dividers') {
      const deleteIndex = pathToDelete[1];
      // remove one.
      selection.partition.dividers.splice(deleteIndex, 1);
    }

    props.onChange(SelectionBuilder.markModified(selection), true);
  };

  const dividers = props.selection.partition.dividers;
  const fieldName = props.selection.partition.variable;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 0 }}>
        {props.children}
      </div>
      <FieldRender className={props.className} fieldName={fieldName} getLegend={props.getLegend} depth={0} >
        {dividers.map((divider, idx) =>
          <DividerRender
            onChange={onChange}
            onDelete={onDelete}
            divider={divider}
            path={['dividers', idx]}
            key={idx}
            getLegend={props.getLegend}
          />
        )}
      </FieldRender>
    </div>);
}

partitionSelection.propTypes = {
  children: React.PropTypes.oneOfType([React.PropTypes.element, React.PropTypes.array]),
  selection: React.PropTypes.object,
  ranges: React.PropTypes.object,
  onChange: React.PropTypes.func,
  getLegend: React.PropTypes.func,
  className: React.PropTypes.string,
};

