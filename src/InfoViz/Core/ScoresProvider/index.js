import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

// ----------------------------------------------------------------------------
// Partition Provider
// ----------------------------------------------------------------------------

function scoresProvider(publicAPI, model) {
  publicAPI.setScores = scores => {
    model.scores = [].concat(scores);
    const scoreMapByValue = {};
    model.scores.forEach(score => {
      scoreMapByValue[score.value] = score;
    });
    model.scoreMapByValue = scoreMapByValue;
    publicAPI.fireScoresChange(model.scores);
  };

  publicAPI.getScoreColor = value => {
    const score = model.scoreMapByValue[value];
    return score ? score.color : undefined;
  };

  publicAPI.getScoreName = value => {
    const score = model.scoreMapByValue[value];
    return score ? score.name : undefined;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  defaultScore: 0,
  // scores: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'ScoresProvider');
  CompositeClosureHelper.event(publicAPI, model, 'scoresChange', false);
  CompositeClosureHelper.get(publicAPI, model, ['defaultScore', 'scores']);
  CompositeClosureHelper.set(publicAPI, model, ['defaultScore']);

  scoresProvider(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
