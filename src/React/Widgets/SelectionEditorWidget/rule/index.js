import React from 'react';

import RuleRender from './RuleRender';
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

export default function ruleSelection(props) {
  const rule = props.selection.rule;
  if (!rule || rule.length === 0 || !rule.type) {
    return null;
  }

  const onChange = (changedPath, editing = false) => {
    const selection = JSON.parse(JSON.stringify(props.selection));
    const terms = selection.rule.terms;
    let currentSelection = terms;

    while (changedPath.length > 2) {
      const idx = changedPath.shift();
      currentSelection[idx].terms = [].concat(currentSelection[idx].terms);
      currentSelection = currentSelection[idx].terms;
    }
    currentSelection[changedPath[0]] = changedPath[1];

    // Notify the change to other components (only if not in progress editing)
    if (!editing) {
      ensureRuleNumbers(selection.rule);
    }

    // Notify of changes
    props.onChange(editing ? selection : SelectionBuilder.markModified(selection), !editing);
  };

  const onDelete = (pathToDelete) => {
    const selection = JSON.parse(JSON.stringify(props.selection));
    const terms = selection.rule.terms;
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
      // Notify the change to other components
      ensureRuleNumbers(selection.rule);
      props.onChange(SelectionBuilder.markModified(selection), true);
    } else {
      props.onChange(SelectionBuilder.empty(), true);
    }
  };

  return (
    <RuleRender
      className={props.className}
      getLegend={props.getLegend}

      onChange={onChange}
      onDelete={onDelete}

      rule={rule}
      depth={0}
      maxDepth={extractMaxDepth(rule, 0)}
      path={[]}
    />);
}

ruleSelection.propTypes = {
  selection: React.PropTypes.object,
  ranges: React.PropTypes.object,
  onChange: React.PropTypes.func,
  getLegend: React.PropTypes.func,
  className: React.PropTypes.string,
};

