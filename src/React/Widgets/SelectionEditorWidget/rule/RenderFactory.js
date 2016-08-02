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
  const terms = [].concat(currSelection.rule.terms);
  const selection = Object.assign({}, currSelection);
  selection.rule.terms = terms;
  let currentSelection = terms;

  while (changedPath.length > 2) {
    const idx = changedPath.shift();
    currentSelection[idx].terms = [].concat(currentSelection[idx].terms);
    currentSelection = currentSelection[idx].terms;
  }
  currentSelection[changedPath[0]] = changedPath[1];

  // this.setState({
  //   selection,
  // });

  // Notify the change to other components (only if not in progress editing)
  if (!editing) {
    ensureRuleNumbers(selection.rule);
    // const newSelection = AnnotationService.selection(selection).fromRule(rule);
    // this.props.annotationService.setActiveSelection(newSelection);
  }
  return { selection, propagate: !editing };
}

export function onDeleteSelection(currSelection, pathToDelete) {
  const terms = [].concat(currSelection.rule.terms);
  const selection = Object.assign({}, currSelection);
  selection.rule.terms = terms;
  let currentSelection = terms;
  let lastIdx = pathToDelete[0];
  let previousSelection = currentSelection;

  if (pathToDelete.length > 1) {
    while (pathToDelete.length > 2) {
      lastIdx = pathToDelete.shift();
      currentSelection[lastIdx].terms = [].concat(currentSelection[lastIdx].terms);
      previousSelection = currentSelection;
      currentSelection = currentSelection[lastIdx].terms;
    }
    // const otherIdxToRemove = pathToDelete[1] > 0 ? (pathToDelete[1] - 1) : 1;
    // const condition = (i, idx) => !(idx === pathToDelete[1] || idx === otherIdxToRemove);

    // do we have more that 2 terms in this clause? If so, we can just remove one.
    if (currentSelection[pathToDelete[0]].terms.length > 3) {
      currentSelection[pathToDelete[0]].terms.splice(pathToDelete[0], 1);
    } else {
      // Down to 1 clause - we need to bubble up the rule
      const idxToKeep = pathToDelete[1] === 1 ? 2 : 1;
      previousSelection[lastIdx] = currentSelection[pathToDelete[0]].terms[idxToKeep];
    }
  } else {
    // Filtering the root
    selection.rule.terms.splice(pathToDelete[0], 1);
  }

  if (selection.rule.terms.length > 1) {
    // this.setState({
    //   selection,
    // });
    // Notify the change to other components
    ensureRuleNumbers(selection.rule);
    // const newSelection = AnnotationService.selection(selection).fromRule(rule);
    // this.props.annotationService.setActiveSelection(newSelection);
    return { selection, propagate: true };
  }
  return { selection: SelectionBuilder.empty(), propagate: true };
}

export function renderRule(rule, props, path, depth, maxDepth = 2, onChange = null, onDelete = null) {
  if (!rule || rule.length === 0 || !rule.type) {
    return null;
  }

  const ruleSelector = rule.type;
  const subProps = Object.assign({ onChange, onDelete }, props, { rule, depth, maxDepth, path });

  if (ruleSelector === 'logical') {
    return <OperatorRender {...subProps} />;
  }
  if (ruleSelector === '5C') {
    return <DepthMatchingRender depth={depth} maxDepth={maxDepth}><FiveClauseRender {...subProps} /></DepthMatchingRender>;
  }
  return null;
}

export function render(selection, props, onChange = null, onDelete = null) {
  return renderRule(
            selection.rule,                      // rule to process
            props,                               // properties
            [],                                  // initial path
            0,                                   // current depth
            extractMaxDepth(selection.rule, 0),  // Max depth
            onChange,                            // onChange Callback
            onDelete);                           // onDelete Callback
}


export default {
  render,
  renderRule,
  onChangeSelection,
  onDeleteSelection,
};
