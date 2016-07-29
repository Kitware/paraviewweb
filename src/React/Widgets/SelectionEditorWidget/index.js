import React from 'react';
// import * as AnnotationService from '../../native/AnnotationService';
import RenderFactory from './RenderFactory';
import style from 'PVWStyle/ReactWidgets/SelectionEditorWidget.mcss';
import NumberFormatter from '../../../Common/Misc/NumberFormatter';
import SelectionBuilder from '../../../Common/Misc/SelectionBuilder';

function extractMaxDepth(rule, currentDepth) {
  if (!rule || rule.length === 0) {
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

function formatNumbers(rule) {
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

export default React.createClass({
  displayName: 'SelectionEditorWidget',

  propTypes: {
    legendService: React.PropTypes.object,
    selections: React.PropTypes.array,
  },
  state: {},

  componentWillMount() {
    // const { annotationService } = this.props;
    const selection = this.props.selections[0];

    if (selection) {
      formatNumbers(selection.rule);
      this.setState({ selection });
    }

    // Attach listeners
    // this.subscriptions.push(
    //   annotationService.onSelectionChanged((data, envelope) => {
    //     formatNumbers(data.rule);
    //     this.setState({ selection: data });
    //   })
    // );
    // this.subscriptions.push(
    //   annotationService.onAnnotationAdded((data, envelope) => {
    //     this.forceUpdate();
    //   })
    // );
    // this.subscriptions.push(
    //   annotationService.onAnnotationChange((data, envelope) => {
    //     this.forceUpdate();
    //   })
    // );
  },

  componentWillUnmount() {
    // Remove listeners
    while (this.subscriptions.length) {
      this.subscriptions.pop().unsubscribe();
    }
  },

  // Callback friendly methods
  onChange(changedPath, editing = false) {
    const terms = [].concat(this.state.selection.rule.terms);
    const selection = Object.assign({}, this.state.selection);
    selection.rule.terms = terms;
    let currentSelection = terms;

    while (changedPath.length > 2) {
      const idx = changedPath.shift();
      currentSelection[idx].terms = [].concat(currentSelection[idx].terms);
      currentSelection = currentSelection[idx].terms;
    }
    currentSelection[changedPath[0]] = changedPath[1];

    this.setState({ selection });

    // Notify the change to other components (only if not in progress editing)
    if (!editing) {
      ensureRuleNumbers(selection.rule);
      // const newSelection = AnnotationService.selection(selection).fromRule(rule);
      // this.props.annotationService.setActiveSelection(newSelection);
    }
  },

  onDelete(pathToDelete) {
    const terms = [].concat(this.state.selection.rule.terms);
    const selection = Object.assign({}, this.state.selection);
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
      this.setState({ selection });
      // Notify the change to other components
      ensureRuleNumbers(selection.rule);
      // const newSelection = AnnotationService.selection(selection).fromRule(rule);
      // this.props.annotationService.setActiveSelection(newSelection);
    } else {
      this.setState({ selection: SelectionBuilder.empty() });

      // const newSelection = AnnotationService.selection('empty');
      // this.props.annotationService.setActiveSelection(newSelection);
    }
  },

  subscriptions: [],

  render() {
    if (!this.state.selection || !this.state.selection.rule || this.state.selection.rule.length === 0) {
      return <div className={style.emptySelection}>No selection</div>;
    }

    return (
      <div className={style.container}>
        {RenderFactory.render(
            this.state.selection.rule,                      // rule to process
            this.props,                                     // properties
            [],                                             // initial path
            0,                                              // current depth
            extractMaxDepth(this.state.selection.rule, 0),  // Max depth
            this.onChange,                                  // onChange Callback
            this.onDelete)                                  // onDelete Callback
        }
      </div>);
  },
});

