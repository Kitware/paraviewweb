import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/BusyFeedback.mcss';

export default class BusyFeedback extends React.Component {
  constructor(props) {
    super(props);
    this.state = { busy: 0 };
  }

  componentWillMount() {
    this.subscription = this.props.provider.onBusy((busy) =>
      this.setState({ busy })
    );
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  render() {
    return (
      <div className={style.container}>
        <i className={this.state.busy ? style.busy : style.idle} />
      </div>
    );
  }
}

BusyFeedback.propTypes = {
  provider: PropTypes.object,
};

BusyFeedback.defaultProps = {
  provider: undefined,
};
