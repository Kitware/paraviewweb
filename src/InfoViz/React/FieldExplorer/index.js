import                 React from 'react';

import      ComponentToReact from '../../../Component/React/ComponentToReact';
import         SvgIconWidget from '../../../React/Widgets/SvgIconWidget';
import         FieldSelector from '../../Native/FieldSelector';
import                 style from '../../../../style/InfoVizReact/FieldExplorer.mcss';

import       decAlphabetIcon from './svg/alphabet-down.svg';
import       incAlphabetIcon from './svg/alphabet-up.svg';
import    decCorrelationIcon from './svg/correlation-down.svg';
import    incCorrelationIcon from './svg/correlation-up.svg';
import        decEntropyIcon from './svg/entropy-down.svg';
import        incEntropyIcon from './svg/entropy-up.svg';
import     decMutualInfoIcon from './svg/mutualinfo-down.svg';
import     incMutualInfoIcon from './svg/mutualinfo-up.svg';
import         decStddevIcon from './svg/stddev-down.svg';
import         incStddevIcon from './svg/stddev-up.svg';


function buildSortButtonList() {
  return [
    {
      key: 'decreasingAlphabet',
      label: 'Sort alphabetical (decreasing)',
      icon: decAlphabetIcon,
    }, {
      key: 'increasingAlphabet',
      label: 'Sort alphabetical (increasing)',
      icon: incAlphabetIcon,
    }, {
      key: 'decreasingCorrelation',
      label: 'Sort correlation (decreasing)',
      icon: decCorrelationIcon,
    }, {
      key: 'increasingCorrelation',
      label: 'Sort correlation (increasing)',
      icon: incCorrelationIcon,
    }, {
      key: 'decreasingEntropy',
      label: 'Sort entropy (decreasing)',
      icon: decEntropyIcon,
    }, {
      key: 'increasingEntropy',
      label: 'Sort entropy (increasing)',
      icon: incEntropyIcon,
    }, {
      key: 'decreasingMutualInfo',
      label: 'Sort mutual info (decreasing)',
      icon: decMutualInfoIcon,
    }, {
      key: 'increasingMutualInfo',
      label: 'Sort mutual info (increasing)',
      icon: incMutualInfoIcon,
    }, {
      key: 'decreasingStdDev',
      label: 'Sort std dev (decreasing)',
      icon: decStddevIcon,
    }, {
      key: 'increasingStdDev',
      label: 'Sort std dev (increasing)',
      icon: incStddevIcon,
    },
  ];
}

function retrieveSortArray(fieldInfo, sortMethod, varIdx) {
  return fieldInfo.mutualInformation[varIdx];
}


export default class FieldExplorer extends React.Component {

  constructor(props) {
    super(props);

    this.subscriptions = [];
    this.unselectedFields = null;
    this.selectedFields = null;

    this.sortButtons = buildSortButtonList();
    this.sortMethod = 'munk';

    this.sortByVar = null;

    // Autobinding
    this.updateSortMethod = this.updateSortMethod.bind(this);
  }

  getInitialState() {
    return {
      sortMethod: 'decreasingMutualInfo',
    };
  }

  // One-time initialization.
  componentWillMount() {
    this.unselectedFields = FieldSelector.newInstance({
      provider: this.props.provider,
      displaySearch: true,
      fieldShowHistogram: true,
      displayOnlyUnselected: true,
    });
    this.selectedFields = FieldSelector.newInstance({
      provider: this.props.provider,
      displaySearch: false,
      fieldShowHistogram: true,
      displayUnselected: false,
    });
  }

  componentDidMount() {
    this.selectedFields.setFieldsToRender();
    this.selectedFields.render();

    this.unselectedFields.setFieldsToRender();
    this.unselectedFields.render();
  }

  componentWillUnmount() {
    this.unselectedFields.destroy();
    this.unselectedFields = null;

    this.selectedFields.destroy();
    this.selectedFields = null;
  }

  updateSortMethod(sortKey, btnIdx) {
    console.log(`Sort method updated, method = ${sortKey}, btnIdx = ${btnIdx}`);
    this.setState({ sortMethod: sortKey });
  }

  render() {
    const renderProps = this.props.getRenderProps();

    let sortOrder = null;
    if (renderProps.subject) {
      sortOrder = renderProps.fieldInfo.fieldMapping.reduce(
              (varId, entry) => (entry.name === renderProps.subject ? entry.id : varId),
              null);
    }
    if (this.sortByVar !== sortOrder && sortOrder !== null) {
      this.sortByVar = sortOrder;
      const sortArray = retrieveSortArray(renderProps.fieldInfo, this.state.sortMethod, this.sortByVar);
      this.unselectedFields.setSortArray(sortArray);
    } else if (renderProps.disposition === 'final' && sortOrder === null) {
      // reset to alphabetical, use 'up' to reverse
      this.unselectedFields.setSortArray(null, 'down');
      this.sortByVar = null;
    }

    return (
      <div className={style.container}>
        <div style={{ overflow: 'auto', position: 'absolute', top: 0, width: '100%', height: 'calc(50% - 30px)' }}>
          <ComponentToReact className={style.fullSize} component={this.selectedFields} />
        </div>
        <div style={{ position: 'absolute', top: 'calc(50% - 30px)', height: 30, width: '100%', display: 'flex' }}>
          {
            this.sortButtons.map((btnInfo, idx) => (
              <div key={btnInfo.key} title={btnInfo.label} className={style.sortButtonContainer}>
                <SvgIconWidget
                  width="32"
                  height="32"
                  icon={btnInfo.icon}
                  className={style.sortButton}
                  onClick={() => this.updateSortMethod(btnInfo.key, idx)}
                />
              </div>
            ))
          }
        </div>
        <div style={{ overflow: 'auto', position: 'absolute', bottom: 0, width: '100%', height: 'calc(50% - 30px)' }}>
          <ComponentToReact className={style.fullSize} component={this.unselectedFields} />
        </div>
      </div>);
  }
}

FieldExplorer.propTypes = {
  provider: React.PropTypes.object,
  getRenderProps: React.PropTypes.func,
};

FieldExplorer.defaultProps = {
  provider: null,
};
