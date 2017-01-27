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
      down: {
        key: 'decreasingAlphabet',
        dir: 'down',
        subjectRequired: false,
        label: 'Sort alphabetical (decreasing)',
        icon: decAlphabetIcon,
      },
      up: {
        key: 'increasingAlphabet',
        dir: 'up',
        subjectRequired: false,
        label: 'Sort alphabetical (increasing)',
        icon: incAlphabetIcon,
      },
    }, {
      down: {
        key: 'decreasingStdDev',
        dir: 'down',
        subjectRequired: false,
        label: 'Sort std dev (decreasing)',
        icon: decStddevIcon,
      },
      up: {
        key: 'increasingStdDev',
        dir: 'up',
        subjectRequired: false,
        label: 'Sort std dev (increasing)',
        icon: incStddevIcon,
      },
    }, {
      down: {
        key: 'decreasingEntropy',
        dir: 'down',
        subjectRequired: false,
        label: 'Sort entropy (decreasing)',
        icon: decEntropyIcon,
      },
      up: {
        key: 'increasingEntropy',
        dir: 'up',
        subjectRequired: false,
        label: 'Sort entropy (increasing)',
        icon: incEntropyIcon,
      },
    }, {
      down: {
        key: 'decreasingCorrelation',
        dir: 'down',
        subjectRequired: true,
        label: 'Sort correlation (decreasing)',
        icon: decCorrelationIcon,
      },
      up: {
        key: 'increasingCorrelation',
        dir: 'up',
        subjectRequired: true,
        label: 'Sort correlation (increasing)',
        icon: incCorrelationIcon,
      },
    }, {
      down: {
        key: 'decreasingMutualInfo',
        dir: 'down',
        subjectRequired: true,
        label: 'Sort mutual info (decreasing)',
        icon: decMutualInfoIcon,
      },
      up: {
        key: 'increasingMutualInfo',
        dir: 'up',
        subjectRequired: true,
        label: 'Sort mutual info (increasing)',
        icon: incMutualInfoIcon,
      },
    },
  ];
}

function retrieveSortArray(fieldInfo, sortMethod, varIdx) {
  if (sortMethod === 'decreasingAlphabet' || sortMethod === 'increasingAlphabet') {
    console.log('alphabetical sort');
    return null;
  }
  return fieldInfo.mutualInformation[varIdx];
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
      sortMethod: 'decreasingAlphabet',
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
      fieldShowHistogram: true,
      display: 'unselected',
    });
    this.selectedFields = FieldSelector.newInstance({
      provider: this.props.provider,
      displaySearch: false,
      fieldShowHistogram: true,
      display: 'selected',
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
    const hh = buttonBarHeight / 2;

    if (renderProps.subject && renderProps.subject !== '') {
      this.sortSubject = renderProps.subject;
    }

    if (this.sortSubject) {
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
        <div style={{ overflow: 'auto', position: 'absolute', top: 0, width: '100%', height: `calc(50% - ${hh}px)` }}>
          <ComponentToReact className={style.fullSize} component={this.selectedFields} />
        </div>
        <div
          style={{
            position: 'absolute',
            top: `calc(50% - ${hh}px)`,
            height: buttonBarHeight,
            width: '100%',
            display: 'flex',
            alignItems: 'flex-end' }}
        >
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
                    width="60"
                    height="60"
                    icon={btn.icon}
                    className={isSelected ? style.selectedSortButton : style.sortButton}
                    onClick={() => this.updateSortMethod(btn, idx, isSelected)}
                  />
                </div>);
            })
          }
        </div>
        <div style={{ overflow: 'auto', position: 'absolute', bottom: 0, width: '100%', height: `calc(50% - ${hh}px)` }}>
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
