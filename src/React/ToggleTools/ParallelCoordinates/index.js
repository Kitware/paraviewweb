import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/ToggleTools.mcss';

import ComponentToReact from '../../../Component/React/ComponentToReact';
import ParallelCoordinates from '../../../InfoViz/Native/ParallelCoordinates';
import OverlayWindow from '../../Containers/OverlayWindow';
import SvgIconWidget from '../../Widgets/SvgIconWidget';

import OverlayTitleBar from '../../Widgets/OverlayTitleBar';
import icon from '../../../../svg/Buttons/ParallelCoordinates.svg';

const isSame = (array1, array2) =>
  array1.length === array2.length &&
  array1.every((element, index) => element === array2[index]);

export default class ParallelCoordinatesTool extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      overlayVisible: false,
    };

    this.title = 'Parallel Coordinates';

    // Autobinding
    this.toggleOverlay = this.toggleOverlay.bind(this);
  }

  componentWillMount() {
    this.component = ParallelCoordinates.newInstance({
      provider: this.props.provider,
    });
    this.component.propagateAnnotationInsteadOfSelection(true, 0, 1);
    this.component.setVisibleScoresForSelection(this.props.partitionScores);
    this.component.setShowOnlySelection(!!this.props.showOnlySelection);
  }

  componentDidUpdate() {
    let changeDetected = false;

    if (
      !isSame(this.component.getVisibleScores(), this.props.partitionScores)
    ) {
      this.component.setVisibleScoresForSelection(this.props.partitionScores);
      changeDetected = true;
    }

    if (
      this.component.getShowOnlySelection() !== !!this.props.showOnlySelection
    ) {
      this.component.setShowOnlySelection(!!this.props.showOnlySelection);
      changeDetected = true;
    }

    if (changeDetected) {
      this.component.render();
    }
  }

  componentWillUnmount() {
    this.component.destroy();
  }

  toggleOverlay() {
    const overlayVisible = !this.state.overlayVisible;
    if (overlayVisible) {
      this.props.onActiveWindow(this);
    }
    this.setState({ overlayVisible });
  }

  render() {
    return (
      <div className={style.container}>
        <div title={this.title}>
          <SvgIconWidget
            width={this.props.size}
            height={this.props.size}
            icon={icon}
            className={this.state.overlayVisible ? style.iconOff : style.iconOn}
            onClick={() => this.toggleOverlay()}
          />
        </div>
        <OverlayWindow
          title={
            <OverlayTitleBar
              title={this.title}
              onClose={() => this.toggleOverlay()}
            />
          }
          x={20}
          y={390}
          visible={this.state.overlayVisible}
          minContentWidth={460}
          minContentHeight={265}
          width={470}
          height={300}
          onResize={() => this.component.resize()}
          onActive={() => this.props.onActiveWindow(this)}
          front={this === this.props.activeWindow}
        >
          <div
            style={{
              overflow: 'auto',
              position: 'absolute',
              width: '100%',
              height: '100%',
            }}
          >
            <ComponentToReact
              className={style.fullSize}
              component={this.component}
            />
          </div>
        </OverlayWindow>
      </div>
    );
  }
}

ParallelCoordinatesTool.propTypes = {
  provider: PropTypes.object.isRequired,
  size: PropTypes.string,

  activeWindow: PropTypes.object.isRequired,
  onActiveWindow: PropTypes.func.isRequired,

  showOnlySelection: PropTypes.bool,
  partitionScores: PropTypes.array,
};

ParallelCoordinatesTool.defaultProps = {
  size: '35px',
  showOnlySelection: false,
  partitionScores: [0, 1, 2],
};
