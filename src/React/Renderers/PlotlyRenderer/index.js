import React from 'react';
import PropTypes from 'prop-types';
import Plotly from 'plotly.js';

import style from 'PVWStyle/ReactRenderers/PlotlyRenderer.mcss';

import sizeHelper from '../../../Common/Misc/SizeHelper';

export default class PlotlyRenderer extends React.Component {
  constructor(props) {
    super(props);

    // Bind callback
    this.updateDimensions = this.updateDimensions.bind(this);
  }

  componentWillMount() {
    this.dataSubscription = this.props.chartBuilder.onDataReady((data) => {
      const container = this.chartRenderer;
      if (!container) {
        return;
      }
      if (
        !data.forceNewPlot &&
        container.data &&
        container.data.length > 0 &&
        container.data[0].type === data.traces[0].type
      ) {
        container.data = data.traces;
        Plotly.redraw(container);
      } else {
        const layout = {
          title: data.title,
          showlegend: true,
          legend: {
            // Somehow positions legend in lower right of div
            x: 100,
            y: 0,
          },
        };
        const config = {
          showLink: false,
          scrollZoom: true,
          displayModeBar: false,
        };

        Plotly.newPlot(
          container,
          data.traces,
          data.layout || layout,
          data.config || config
        );
      }

      if (data.hover && data.hover.enable === true) {
        Plotly.Fx.hover(container, data.hover.hoverList);
      }
    });
  }

  componentDidMount() {
    // Listen to window resize
    this.sizeSubscription = sizeHelper.onSizeChangeForElement(
      this.chartRenderer,
      this.updateDimensions
    );

    // Make sure we monitor window size if it is not already the case
    sizeHelper.startListening();

    this.updateDimensions();
  }

  componentDidUpdate(nextProps, nextState) {
    this.updateDimensions();
  }

  componentWillUnmount() {
    // Remove window listener
    if (this.sizeSubscription) {
      this.sizeSubscription.unsubscribe();
      this.sizeSubscription = null;
    }

    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
      this.dataSubscription = null;
    }
  }

  updateDimensions() {
    const elt = this.chartRenderer;
    if (elt.layout) {
      Plotly.relayout(elt, elt.layout);
    }
  }

  render() {
    return (
      <div
        className={style.chartContainer}
        ref={(c) => {
          this.chartRenderer = c;
        }}
      />
    );
  }
}

PlotlyRenderer.propTypes = {
  chartBuilder: PropTypes.object.isRequired,
};

PlotlyRenderer.defaultProps = {};
