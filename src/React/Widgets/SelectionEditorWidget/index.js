import React from 'react';
import EmptyRenderFactory from './empty/RenderFactory';
import RuleRenderFactory from './rule/RenderFactory';
import RangeRenderFactory from './range/RenderFactory';
import style from 'PVWStyle/ReactWidgets/SelectionEditorWidget.mcss';


export default React.createClass({
  displayName: 'SelectionEditorWidget',

  propTypes: {
    provider: React.PropTypes.object,
    selections: React.PropTypes.array,
  },

  getInitialState() {
    return { };
  },

  componentWillMount() {
    const selection = this.props.provider.getSelection();

    if (selection) {
      // formatNumbers(selection.rule);
      this.setState({ selection });
    }

    // Attach listeners
    if (this.props.provider.isA('SelectionProvider')) {
      this.subscriptions.push(this.props.provider.onSelectionChange(sel => {
        this.setState({ selection: sel });
      }));
    }
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

  // Callback methods. Type renderer calls with whatever args they need. We
  // pass current selection and those args to type renderer.
  onChange(...args) {
    const newSelection = this.renderFactory[this.state.selection.type].onChangeSelection.apply(this, [this.state.selection].concat(args));

    this.setState({ selection: newSelection.selection });

    // Notify the change to other components (only if not in progress editing)
    if (newSelection.propagate && this.props.provider.isA('SelectionProvider')) {
      // ensureRuleNumbers(selection.rule);
      this.props.provider.setSelection(newSelection.selection);
    }
  },

  onDelete(...args) {
    const newSelection = this.renderFactory[this.state.selection.type].onDeleteSelection.apply(this, [this.state.selection].concat(args));

    this.setState({ selection: newSelection.selection });

    // Notify the change to other components (only if not in progress editing)
    if (newSelection.propagate && this.props.provider.isA('SelectionProvider')) {
      this.props.provider.setSelection(newSelection.selection);
    }
  },

  subscriptions: [],
  renderFactory: {
    empty: EmptyRenderFactory,
    rule: RuleRenderFactory,
    range: RangeRenderFactory,
  },

  render() {
    const type = this.state.selection ? this.state.selection.type : 'empty';

    return (
      <div className={style.container}>
        {this.renderFactory[type].render(
          this.state.selection,            // selection to process
          this.props,                      // properties
          this.onChange,                   // onChange Callback
          this.onDelete)                   // onDelete Callback
        }
      </div>);
  },
});

