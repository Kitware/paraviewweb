import React from 'react';

import OperatorRender from './OperatorRender';
import FiveClauseRender from './FiveClauseRender';
import DepthMatchingRender from '../DepthMatchingRender';
import NumberFormatter from '../../../../Common/Misc/NumberFormatter';
import SelectionBuilder from '../../../../Common/Misc/SelectionBuilder';

function extractMaxDepth(rule, currentDepth) {
  if (!rule || !rule.terms || rule.terms.length === 0) {
    return currentDepth;
  }

  const ruleSelector = rule.type;
  if (ruleSelector === 'rule') {
    return extractMaxDepth(rule.rule, currentDepth);
  }
  if (ruleSelector === 'logical') {
    return rule.terms
      .filter((r, idx) => (idx > 0))                // Get the sub rules
      .map(sr => extractMaxDepth(sr, currentDepth + 1))   // Get depth of subRules
      .reduce((prev, curr) => (prev > curr ? prev : curr)); // Extract max
  }

  return currentDepth;
}

// Edit in place
function ensureRuleNumbers(rule) {
  if (!rule || rule.length === 0) {
    return;
  }

  const ruleSelector = rule.type;
  if (ruleSelector === 'rule') {
    ensureRuleNumbers(rule.rule);
  }
  if (ruleSelector === 'logical') {
    rule.terms.filter((r, idx) => (idx > 0)).forEach(r => ensureRuleNumbers(r));
  }

  if (ruleSelector === '5C') {
    const terms = rule.terms;
    terms[0] = Number(terms[0]);
    terms[4] = Number(terms[4]);
  }
}

export function formatNumbers(rule) {
  if (!rule || rule.length === 0) {
    return;
  }

  const ruleSelector = rule.type;
  if (ruleSelector === 'rule') {
    formatNumbers(rule.rule);
  }
  if (ruleSelector === 'logical') {
    rule.terms.filter((r, idx) => (idx > 0)).forEach(r => formatNumbers(r));
  }

  if (ruleSelector === '5C') {
    const terms = rule.terms;
    const formatter = new NumberFormatter(3, [Number(terms[0]), Number(terms[4])]);
    terms[0] = Number(formatter.eval(terms[0]));
    terms[4] = Number(formatter.eval(terms[4]));
  }
}

// Callback methods
export function onChangeSelection(currSelection, changedPath, editing = false) {
  // clone, so we don't step on whatever is current.
  const selection = JSON.parse(JSON.stringify(currSelection));
  const currentInterval = selection.range.variables[changedPath[0]][changedPath[1]];
  const changeItemIndex = changedPath[2];
  const newValue = changedPath[3];

  console.log('change', currentInterval, changeItemIndex, newValue);
  if (changeItemIndex === 0 || changeItemIndex === 4) {
    // change an input
    currentInterval.interval[changeItemIndex === 0 ? 0 : 1] = newValue;
  } else if (changeItemIndex === 1 || changeItemIndex === 3) {
    currentInterval.endpoints = (changeItemIndex === 1 ?
                                 `${newValue}${currentInterval.endpoints.slice(1, 2)}` :
                                 `${currentInterval.endpoints.slice(0, 1)}${newValue}`);
  }
  // Notify the change to other components (only if not in progress editing)
  if (!editing) {
    // ensureRuleNumbers(selection.rule);
    // const newSelection = AnnotationService.selection(selection).fromRule(rule);
    // this.props.annotationService.setActiveSelection(newSelection);
  }
  return { selection, propagate: !editing };
}

export function onDeleteSelection(currSelection, pathToDelete) {
  // clone, so we don't step on whatever is current.
  const selection = JSON.parse(JSON.stringify(currSelection));
  const intervals = selection.range.variables[pathToDelete[0]];
  const deleteIntervalIndex = pathToDelete[1];

  console.log('delete', intervals, deleteIntervalIndex);
  // do we have more that 2 terms for this variable? If so, we can just remove one.
  if (intervals.length >= 2) {
    intervals.splice(deleteIntervalIndex, 1);
  } else {
    // Deleting the last interval - delete the variable.
    delete selection.range.variables[pathToDelete[0]];
  }

  // If we still have at least one variable, selection isn't empty.
  if (Object.keys(selection.range.variables).length !== 0) {
    // Notify the change to other components
    // ensureRuleNumbers(selection.rule);
    // const newSelection = AnnotationService.selection(selection).fromRule(rule);
    // this.props.annotationService.setActiveSelection(newSelection);
    return { selection, propagate: true };
  }
  return { selection: SelectionBuilder.empty(), propagate: true };
}

export function render(selection, props, onChange = null, onDelete = null) {
  // return renderRule(
  //           selection,                           // rule to process
  //           props,                               // properties
  //           [],                                  // initial path
  //           0,                                   // current depth
  //           2,                                   // Max depth
  //           onChange,                            // onChange Callback
  //           onDelete);                           // onDelete Callback

  const vars = selection.range.variables;
  let maxDepth = 1;
  // const path = [];
  Object.keys(vars).forEach((key) => {
    if (vars[key].length > 1) maxDepth = 2;
  });


  // return <OperatorRender operator={'and'} >{Object.keys(vars).map((fieldName, idx) => {
  //   if (vars[fieldName].length > 1) {
  //     return <OperatorRender operator={'or'} >{
  //       vars[fieldName].map((clause, j) => (<FiveClauseRender {...subProps} />))
  //     }</OperatorRender>;
  //   } else {
  //     return <DepthMatchingRender depth={1} maxDepth={maxDepth}><FiveClauseRender { clause={vars[fieldName][0]}, ...subProps} /></DepthMatchingRender>;
  //   }
  // })}</OperatorRender>;

  return (<OperatorRender operator={'and'} depth={0} >{
    Object.keys(vars).map(
      (fieldName, idx) => {
        // doesn't like legendService, but it's valid for 5C
        /* eslint-disable react/prop-types */
        const getSubProps = (clause, j) => ({ onChange, onDelete, interval: clause, fieldName, path: [fieldName, j],
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
