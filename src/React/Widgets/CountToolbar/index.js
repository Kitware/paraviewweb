import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/CountToolbar.mcss';

import { capitalize } from '../../../Common/Core/CompositeClosureHelper';

const arrayZeros = (n) => Array(...Array(n)).map(Number.prototype.valueOf, 0);
const arraySequence = (n) => Array(...Array(n)).map((d, i) => i);

export default class CountToolbar extends React.Component {
  constructor(props) {
    super(props);

    const inScores = this.props.provider.getScores();
    const numScores = inScores.length;
    this.state = {
      count: '',
      total: this.props.provider.getDataRowCount(),
      annotationType: 'empty',
      annotationName: '',
      scoreCounts: arrayZeros(numScores + 1),
      activeScores: this.props.activeScores
        ? [].concat(this.props.activeScores)
        : arraySequence(numScores + 1),
      scores: inScores,
      numScores,
    };
    this.state.scoreCounts[numScores] = this.state.total;

    // Autobinding
    // this.onActiveScoreChange = this.onActiveScoreChange.bind(this);
    this.boxClick = this.boxClick.bind(this);
  }

  componentWillMount() {
    this.subscriptions = [];
    this.subscriptions.push(
      this.props.provider.subscribeToDataSelection(
        'counts',
        (countData) => {
          let count = 0;
          let unselected = 0;
          let total = 0;
          const scoreCounts = arrayZeros(this.state.numScores + 1);
          countData.forEach((item) => {
            unselected += item.count;
            scoreCounts[item.role.score] = item.count;
            if (this.state.activeScores.indexOf(item.role.score) !== -1) {
              count += item.count;
            }
            total = item.total;
          });
          unselected = total - unselected;
          scoreCounts[scoreCounts.length - 1] = unselected;
          this.setState({ count, scoreCounts, total });
        },
        [],
        { partitionScores: arraySequence(this.state.numScores) }
      )
    );

    const processAnnotation = (annotation) => {
      if (!annotation) {
        return;
      }

      const changeSet = {};
      const annotationType = annotation.selection.type;
      changeSet.annotationType = annotationType;
      changeSet.annotationName = annotation.name ? annotation.name : '';

      if (
        this.state.annotationType === 'partition' &&
        annotationType !== 'partition'
      ) {
        // Changing from partition to anything else, we re-activate everything
        changeSet.activeScores = arraySequence(this.state.numScores + 1);
      }

      this.setState(changeSet);
      if (changeSet.activeScores) {
        this.notifyVisibilityChanged(changeSet.activeScores);
      }
    };

    this.subscriptions.push(
      this.props.provider.onAnnotationChange(processAnnotation)
    );
    processAnnotation(this.props.provider.getAnnotation());
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.activeScores) {
      this.setState({ activeScores: [].concat(nextProps.activeScores) });
    }
  }

  componentWillUnmount() {
    while (this.subscriptions.length) {
      this.subscriptions.pop().unsubscribe();
    }
  }

  notifyVisibilityChanged(activeScores) {
    if (this.props.onChange) {
      this.props.onChange(activeScores);
    }
  }

  boxClick(event) {
    const idx = Number(event.target.getAttribute('data-score'));

    const changeSet = {};
    if (this.state.activeScores.indexOf(idx) === -1) {
      changeSet.activeScores = this.state.activeScores.concat(idx);
    } else {
      changeSet.activeScores = this.state.activeScores.filter((i) => i !== idx);
    }

    let count = 0;
    changeSet.activeScores.forEach((i) => {
      count += this.state.scoreCounts[i] || 0;
    });

    changeSet.count = count;
    this.setState(changeSet);
    this.notifyVisibilityChanged(changeSet.activeScores);
  }

  render() {
    return (
      <div className={style.container}>
        <div
          className={style.activeAnnotationName}
          title={`Active annotation: ${this.state.annotationName}`}
        >
          {this.state.annotationName}
        </div>
        <section className={style.scoreContainer}>
          <div
            className={
              this.state.activeScores.indexOf(this.state.numScores) !== -1
                ? style.selectedScoreBlock
                : style.scoreBlock
            }
            style={{
              background: '#CCCCCC',
              display: 'inline-block',
            }}
            title={`Total (${this.state.count} active)`}
            data-score={`${this.state.numScores}`}
            onClick={this.boxClick}
          >
            {this.state.total}
          </div>
          <div className={style.expressionOperator}>=</div>
          {this.state.scores.map((score, idx) => (
            <div key={`root-${idx}`} className={style.subBlock}>
              <div
                className={
                  this.state.activeScores.indexOf(idx) !== -1
                    ? style.selectedScoreBlock
                    : style.scoreBlock
                }
                style={{
                  background: score.color,
                  display: 'inline-block',
                }}
                title={`"${capitalize(score.name)}" (${
                  this.state.annotationType
                } annotation)`}
                data-score={idx}
                onClick={this.boxClick}
              >
                {this.state.scoreCounts[idx]}
              </div>
              <div className={style.expressionOperator}>+</div>
            </div>
          ))}
          <div
            className={style.selectedScoreBlock}
            style={{
              background: '',
              display: 'inline-block',
              border: '2px dashed black',
              cursor: 'default',
            }}
            title={`Unselected (${this.state.annotationType} annotation)`}
          >
            {this.state.scoreCounts[this.state.scoreCounts.length - 1]}
          </div>
        </section>
      </div>
    );
  }
}

CountToolbar.propTypes = {
  provider: PropTypes.object,
  onChange: PropTypes.func,
  activeScores: PropTypes.array,
};

CountToolbar.defaultProps = {
  provider: undefined,
  onChange: undefined,
  activeScores: undefined,
};
