import CompositeClosureHelper from '../../../Common/Core/CompositeClosureHelper';

// ----------------------------------------------------------------------------
// Partition Provider
// ----------------------------------------------------------------------------

function scoresProvider(publicAPI, model) {
  publicAPI.setScores = (scores) => {
    model.scores = [].concat(scores);
    const scoreMapByValue = {};
    model.scores.forEach((score) => {
      scoreMapByValue[score.value] = score;
    });
    model.scoreMapByValue = scoreMapByValue;
    publicAPI.fireScoresChange(model.scores);
  };

  publicAPI.getScoreColor = (value) => {
    const score = model.scoreMapByValue[value];
    return score ? score.color : undefined;
  };

  publicAPI.getScoreName = (value) => {
    const score = model.scoreMapByValue[value];
    return score ? score.name : undefined;
  };
  publicAPI.getDefaultScore = () => {
    if (model.scores) {
      const index = model.scores.findIndex(score => !!score.isDefault);
      return (index === -1 ? 0 : index);
    }
    return 0;
  };
  publicAPI.setDefaultScore = (value) => {
    if (model.scores) {
      model.scores[publicAPI.getDefaultScore()].isDefault = false;
      model.scores[value].isDefault = true;
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // scores: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  CompositeClosureHelper.destroy(publicAPI, model);
  CompositeClosureHelper.isA(publicAPI, model, 'ScoresProvider');
  CompositeClosureHelper.event(publicAPI, model, 'scoresChange', false);
  CompositeClosureHelper.get(publicAPI, model, ['scores']);

  scoresProvider(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = CompositeClosureHelper.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
