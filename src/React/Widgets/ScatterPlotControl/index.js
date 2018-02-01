import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/ScatterPlotControl.mcss';

import LegendView from './LegendView';
import EditView from './EditView';

export default class ScatterPlotControl extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      editMode: true,
    };

    // Auto bind method
    this.toggleEditMode = () => {
      const editMode = !this.state.editMode;
      this.setState({ editMode });
    };

    this.onChange = (model) => {
      this.props.manager.updateModel(model);
      this.forceUpdate();
    };
  }

  render() {
    if (!this.props.manager || !this.props.manager.getModel()) {
      return null;
    }
    const model = this.props.manager.getModel();

    if (this.state.editMode) {
      return (
        <div className={style.viewport}>
          <EditView
            model={model}
            colorMaps={this.props.manager.getColorMaps()}
            getScalarRange={(arrayName) =>
              this.props.manager.getScalarRange(arrayName)
            }
            scores={this.props.manager.getProvider().getScores()}
            activeScores={this.props.activeScores}
            onActiveScoresChange={this.props.onActiveScoresChange}
            toggleEditMode={this.toggleEditMode}
            onChange={this.onChange}
          />
        </div>
      );
    }
    return (
      <div className={style.viewport}>
        <LegendView model={model} toggleEditMode={this.toggleEditMode} />
      </div>
    );
  }
}

ScatterPlotControl.propTypes = {
  manager: PropTypes.object,
  activeScores: PropTypes.array,
  onActiveScoresChange: PropTypes.func,
};

ScatterPlotControl.defaultProps = {
  manager: undefined,
  activeScores: undefined,
  onActiveScoresChange: undefined,
};
