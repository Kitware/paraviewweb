import                 React from 'react';

import      ComponentToReact from '../../../Component/React/ComponentToReact';
import         SvgIconWidget from '../../../React/Widgets/SvgIconWidget';
import         FieldSelector from '../../Native/FieldSelector';
import                 style from '../../../../style/InfoVizReact/FieldExplorer.mcss';

import       incAlphabetIcon from './svg/alphabet-down.svg';
import       decAlphabetIcon from './svg/alphabet-up.svg';
import    incCorrelationIcon from './svg/correlation-down.svg';
import    decCorrelationIcon from './svg/correlation-up.svg';
import        incEntropyIcon from './svg/entropy-down.svg';
import        decEntropyIcon from './svg/entropy-up.svg';
import     incMutualInfoIcon from './svg/mutualinfo-down.svg';
import     decMutualInfoIcon from './svg/mutualinfo-up.svg';
import         incStddevIcon from './svg/stddev-down.svg';
import         decStddevIcon from './svg/stddev-up.svg';


function buildSortButtonList() {
  return [
    {
      down: {
        key: 'increasingAlphabet',
        dir: 'down',
        subjectRequired: false,
        label: 'Sort alphabetical (increasing)',
        icon: incAlphabetIcon,
      },
      up: {
        key: 'decreasingAlphabet',
        dir: 'up',
        subjectRequired: false,
        label: 'Sort alphabetical (decreasing)',
        icon: decAlphabetIcon,
      },
    }, {
      down: {
        key: 'increasingStdDev',
        dir: 'down',
        subjectRequired: false,
        label: 'Sort std dev (increasing)',
        icon: incStddevIcon,
      },
      up: {
        key: 'dedreasingStdDev',
        dir: 'up',
        subjectRequired: false,
        label: 'Sort std dev (decreasing)',
        icon: decStddevIcon,
      },
    }, {
      down: {
        key: 'increasingEntropy',
        dir: 'down',
        subjectRequired: false,
        label: 'Sort entropy (increasing)',
        icon: incEntropyIcon,
      },
      up: {
        key: 'decreasingEntropy',
        dir: 'up',
        subjectRequired: false,
        label: 'Sort entropy (decreasing)',
        icon: decEntropyIcon,
      },
    }, {
      down: {
        key: 'increasingCorrelation',
        dir: 'down',
        subjectRequired: true,
        label: 'Sort correlation (increasing)',
        icon: incCorrelationIcon,
      },
      up: {
        key: 'decreasingCorrelation',
        dir: 'up',
        subjectRequired: true,
        label: 'Sort correlation (decreasing)',
        icon: decCorrelationIcon,
      },
    }, {
      down: {
        key: 'increasingMutualInfo',
        dir: 'down',
        subjectRequired: true,
        label: 'Sort mutual info (increasing)',
        icon: incMutualInfoIcon,
      },
      up: {
        key: 'decreasingMutualInfo',
        dir: 'up',
        subjectRequired: true,
        label: 'Sort mutual info (decreasing)',
        icon: decMutualInfoIcon,
      },
    },
  ];
}

function retrieveSortArray(fieldInfo, sortMethod, varIdx) {
  if (sortMethod.indexOf('StdDev') >= 0) {
    return fieldInfo.taylorR;
  } else if (sortMethod.indexOf('Entropy') >= 0) {
    return fieldInfo.entropy;
  } else if (sortMethod.indexOf('Correlation') >= 0) {
    return fieldInfo.taylorPearson[varIdx];
  } else if (sortMethod.indexOf('MutualInfo') >= 0) {
    return fieldInfo.mutualInformation[varIdx];
  }

  // Default is to sort alphabetical
  return null;
}

function swap(d) {
  return d === 'up' ? 'down' : 'up';
}


export default class FieldExplorer extends React.Component {

  constructor(props) {
    super(props);

    this.subscriptions = [];
    this.unselectedFields = null;
    this.selectedFields = null;

    this.sortButtons = buildSortButtonList();
    this.sortSubject = null;

    this.sortByVar = null;

    this.state = {
      sortMethod: 'increasingAlphabet',
      sortDir: 'down',
      subjectRequired: false,
      btnDirections: ['down', 'down', 'down', 'down', 'down'],
    };

    // Autobinding
    this.updateSortMethod = this.updateSortMethod.bind(this);
  }

  // One-time initialization.
  componentWillMount() {
    this.unselectedFields = FieldSelector.newInstance({
      provider: this.props.provider,
      displaySearch: true,
      showSelectedFirstToggle: true,
    });
  }

  componentDidMount() {
    this.unselectedFields.setFieldsToRender();
    this.unselectedFields.render();
  }

  componentWillUnmount() {
    this.unselectedFields.destroy();
    this.unselectedFields = null;
  }

  updateSortMethod(btnInfo, btnIdx, alreadySelected) {
    const nextState = {
      sortMethod: btnInfo.key,
      subjectRequired: btnInfo.subjectRequired,
      btnDirections: [].concat(this.state.btnDirections),
      sortDir: btnInfo.dir,
    };

    if (alreadySelected) {
      // This sort method is already selected, just swap the direction
      const dir = swap(nextState.btnDirections[btnIdx]);
      nextState.btnDirections[btnIdx] = dir;
      nextState.sortDir = dir;
      nextState.sortMethod = this.sortButtons[btnIdx][dir].key;
    }

    this.setState(nextState);
  }

  render() {
    const renderProps = this.props.getRenderProps();
    const buttonBarHeight = 80;

    if (renderProps.subject && renderProps.subject !== '') {
      this.sortSubject = renderProps.subject;
    }

    if (this.sortSubject && renderProps.fieldInfo) {
      this.sortByVar = renderProps.fieldInfo.fieldMapping.reduce(
              (varId, entry) => (entry.name === this.sortSubject ? entry.id : varId),
              null);
    }

    if (this.sortByVar !== null || this.state.subjectRequired === false) {
      const sortArray = retrieveSortArray(renderProps.fieldInfo, this.state.sortMethod, this.sortByVar);
      this.unselectedFields.setSortArray(sortArray, this.state.sortDir);
    }

    return (
      <div className={style.container}>
        <div className={style.buttonBar} style={{ height: buttonBarHeight }} >
          <span className={style.sortContainerText}>
            {`Sort options (current subject: ${this.sortSubject})`}
          </span>
          {
            this.sortButtons.map((btnInfo, idx) => {
              const btn = btnInfo[this.state.btnDirections[idx]];
              const otherBtn = btnInfo[swap(this.state.btnDirections[idx])];
              const isSelected = this.state.sortMethod === btn.key || this.state.sortMethod === otherBtn.key;
              return (
                <div key={btn.key} title={btn.label} className={style.sortButtonContainer}>
                  <SvgIconWidget
                    width="50"
                    height="50"
                    icon={btn.icon}
                    className={isSelected ? style.selectedSortButton : style.sortButton}
                    onClick={() => this.updateSortMethod(btn, idx, isSelected)}
                  />
                </div>);
            })
          }
        </div>
        <div style={{ overflow: 'auto', position: 'absolute', bottom: 0, width: '100%', height: `calc(100% - ${buttonBarHeight}px)` }}>
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
