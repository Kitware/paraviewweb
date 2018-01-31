import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/ToggleTools.mcss';

import AnnotationEditorWidget from '../../Widgets/AnnotationEditorWidget';
import OverlayWindow from '../../Containers/OverlayWindow';
import SvgIconWidget from '../../Widgets/SvgIconWidget';

import OverlayTitleBar from '../../Widgets/OverlayTitleBar';
import icon from '../../../../svg/Buttons/Annotation.svg';

export default class AnnotationEditorTool extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      overlayVisible: false,
      ranges: {},
      annotation: null,
    };

    this.title = 'Annotation Editor';

    // Get some fields selected
    props.provider.getFieldNames().forEach((name) => {
      this.state.ranges[name] = props.provider.getField(name).range;
    });

    // Autobinding
    this.toggleOverlay = this.toggleOverlay.bind(this);
    this.onAnnotationChange = this.onAnnotationChange.bind(this);
  }

  componentWillMount() {
    this.subscription = this.props.provider.onAnnotationChange((annotation) => {
      this.setState({ annotation });
    });
    const annotation = this.props.provider.getAnnotation();
    this.setState({ annotation });
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  onAnnotationChange(annotation, isEditDone) {
    if (this.state.annotation && this.state.annotation.readOnly) {
      return;
    }
    this.setState({ annotation });
    if (isEditDone) {
      this.props.provider.setAnnotation(annotation);
    }
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
          x={500}
          y={80}
          visible={this.state.overlayVisible}
          minContentWidth={460}
          minContentHeight={265}
          width={470}
          height={300}
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
            <AnnotationEditorWidget
              annotation={this.state.annotation}
              scores={this.props.provider.getScores()}
              ranges={this.state.ranges}
              onChange={this.onAnnotationChange}
              getLegend={this.props.provider.getLegend}
              showUncertainty={this.props.showUncertainty}
            />
          </div>
        </OverlayWindow>
      </div>
    );
  }
}

AnnotationEditorTool.propTypes = {
  provider: PropTypes.object,
  size: PropTypes.string,
  showUncertainty: PropTypes.bool,

  activeWindow: PropTypes.object,
  onActiveWindow: PropTypes.func,
};

AnnotationEditorTool.defaultProps = {
  size: '35px',
  showUncertainty: true,
};
