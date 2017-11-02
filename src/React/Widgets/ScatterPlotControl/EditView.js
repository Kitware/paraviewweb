import React            from 'react';
import style from 'PVWStyle/ReactWidgets/ScatterPlotControl.mcss';
// import SvgIconWidget    from 'paraviewweb/src/React/Widgets/SvgIconWidget';

// import ExtremesBest     from '../../../../../svg/PwfPresets/ExtremesBest.svg';
// import HighestBest      from '../../../../../svg/PwfPresets/HighestBest.svg';
// import LowestBest       from '../../../../../svg/PwfPresets/LowestBest.svg';
// import MiddleBest       from '../../../../../svg/PwfPresets/MiddleBest.svg';

import points           from './icons/points.png';
import sphere           from './icons/sphere.png';
import blackEdgedCircle from './icons/black-edge-circle.png';
import plainCircle      from './icons/circle.png';
import blackEdgedSquare from './icons/black-edge-square.png';
import square           from './icons/square.png';


const REPRESENTATIONS = [
  { key: 'Plain square', icon: square },
  { key: 'Black-edged square', icon: blackEdgedSquare },
  { key: 'Plain circle', icon: plainCircle },
  { key: 'Black-edged circle', icon: blackEdgedCircle },
  { key: 'Sphere', icon: sphere },
];

// FIXME: This mapping comes from the agreement previously held between count toolbar
// FIXME: and parallel coordinates.  The mapping between these names and values should
// FIXME: likely be formalized somewhere.
const ACTIVE_SCORE_MAPPING = {
  unselected: -1,
  no: 0,
  maybe: 1,
  yes: 2,
};

/* eslint-disable react/jsx-no-bind */
// Without a third parameter, this function assumes the second parameter is
// an object contains keys and values to update in the original object.
function applyChange(original, key, value) {
  if (value === undefined) {
    return Object.assign({}, original, key);
  }
  return Object.assign({}, original, { [key]: value });
}

export default function EditView(props) {
  const { model, colorMaps, getScalarRange, scores, activeScores, onActiveScoresChange, onChange } = props;
  const spriteGroup = [];
  const axesGroup = [];
  const colorGroup = [];
  const sizeGroup = [];
  const opacityGroup = [];
  const scoreMap = {
    unselected: '#CCCCCC',
  };

  scores.forEach((scoreObj) => {
    scoreMap[scoreObj.name] = scoreObj.color;
  });

  // const functionPresets = [
  //   { icon: HighestBest, key: 'HighestBest' },
  //   { icon: LowestBest, key: 'LowestBest' },
  //   { icon: MiddleBest, key: 'MiddleBest' },
  //   { icon: ExtremesBest, key: 'ExtremesBest' },
  // ];

  const toggleActiveScore = label => (() => {
    const score = ACTIVE_SCORE_MAPPING[label];
    const scoreIdx = activeScores.indexOf(score);
    if (scoreIdx < 0) {
      activeScores.push(score);
    } else {
      activeScores.splice(scoreIdx, 1);
    }
    onActiveScoresChange(activeScores);
  });

  //
  // Representation
  //
  spriteGroup.push(
    <section className={style.topSpaceProperty} key="sprite-group-use-sprites">
      <label >Points</label>
      <div
        title="Points"
        className={model.usePointSprites === false ? style.selectedSpriteRepContainer : style.spriteRepContainer}
        onClick={e => onChange(applyChange(model, { usePointSprites: false, pointRepresentation: '' }))}
      >
        <img
          alt="Points"
          src={points}
          className={style.spriteRepButton}
        />
      </div>
      <label style={{ marginLeft: 30 }}>Sprites</label>
      { REPRESENTATIONS.map(repr =>
        (<div
          key={repr.key}
          title={repr.key}
          className={model.pointRepresentation === repr.key && model.usePointSprites ? style.selectedSpriteRepContainer : style.spriteRepContainer}
          onClick={e => onChange(applyChange(model, { usePointSprites: true, pointRepresentation: repr.key }))}
        >
          <img
            alt={repr.key}
            src={`${repr.icon}`}
            className={style.spriteRepButton}
          />
        </div>))}
    </section>);

  /* eslint-disable react/jsx-curly-spacing */
  //
  // Axes
  //
  axesGroup.push(
    <section className={ style.titleGroup } key="axes-group-title">
      <label>Axes</label>
    </section>);

  axesGroup.push(
    <section className={ style.property } key="axes-group-x">
      <label>X</label>
      <select
        value={ model.x }
        onChange={ e => onChange(applyChange(model, 'x', e.target.value)) }
      >
        { model.arrayList.map(txt => <option key={txt} value={txt}>{ txt }</option>) }
      </select>
    </section>);

  axesGroup.push(
    <section className={ style.property } key="axes-group-y">
      <label>Y</label>
      <select
        value={ model.y }
        onChange={ e => onChange(applyChange(model, 'y', e.target.value)) }
      >
        { model.arrayList.map(txt => <option key={txt} value={txt}>{ txt }</option>) }
      </select>
    </section>);

  axesGroup.push(
    <section className={ style.property } key="axes-group-z">
      <label>Z</label>
      <select
        value={ model.z }
        onChange={ e => onChange(applyChange(model, 'z', e.target.value)) }
      >
        { model.arrayList.map(txt => <option key={txt} value={txt}>{ txt }</option>) }
      </select>
    </section>);

  //
  // Color
  //
  colorGroup.push(
    <section className={ style.titleGroup } key="color-group-title">
      <label>Color</label>
    </section>);

  colorGroup.push(
    <section className={ style.property } key="color-group-array">
      <label>Color By</label>
      <select
        value={ model.colorBy }
        onChange={ e => onChange(applyChange(model, 'colorBy', e.target.value)) }
      >
        <option value="user selection">Active Annotation</option>
        { model.arrayList.map(txt => <option key={txt} value={txt}>{ txt }</option>) }
      </select>
    </section>);

  if (model.colorBy !== 'user selection' && colorMaps) {
    colorGroup.push(
      <div key="color-group-main-options">
        <section className={ style.property }>
          <label>Emphasis</label>
          <div className={ style.pwfFunctionContainer }>
            { Object.keys(colorMaps).map(name => (<div key={name} className={ style.pwfButtonContainer }>
              <img
                height={'20px'}
                width={'55px'}
                title={name}
                alt={name}
                src={`data:image/png;base64,${colorMaps[name]}`}
                className={model.colorMapName === name ? style.selectedPresetButton : style.presetButton}
                onClick={e => onChange(applyChange(model, 'colorMapName', name))}
              />
            </div>))}
          </div>
        </section>
        <section className={ style.property }>
          <label>Legend</label>
          <div className={ style.pwfFunctionContainer }>
            <img
              height={'25px'}
              alt={'Color Legend'}
              style={{ flex: '1 0 auto', width: 25 }}
              src={`data:image/png;base64,${colorMaps[model.colorMapName]}`}
            />
          </div>
        </section>
        <section className={ style.property }>
          <label />
          <div style={{ top: '-7px' }} className={ style.pwfFunctionContainer }>
            <span className={style.leftLabel}>{getScalarRange(model.colorBy)[0].toFixed(3)}</span>
            <span className={style.rightLabel}>{getScalarRange(model.colorBy)[1].toFixed(3)}</span>
          </div>
        </section>
      </div>);
  } else if (model.colorBy === 'user selection') {
    // FIXME: Perhaps we can refactor this section to remove some of the duplication
    colorGroup.push(
      <section className={ style.property } key="color-group-user-sel-options">
        <label>Legend</label>
        <div className={ style.pwfFunctionContainer }>
          <div
            className={activeScores.indexOf(ACTIVE_SCORE_MAPPING.unselected) >= 0 ? style.colorLegendPatch : style.inactiveColorLegendPatch}
            onClick={toggleActiveScore('unselected')}
            style={{
              background: scoreMap.unselected,
              float: 'left',
            }}
          >
            <span className={style.colorLegendPatchText}>Unselected</span>
          </div>
          <div
            className={activeScores.indexOf(ACTIVE_SCORE_MAPPING.no) >= 0 ? style.colorLegendPatch : style.inactiveColorLegendPatch}
            onClick={toggleActiveScore('no')}
            style={{
              background: scoreMap.no,
              float: 'left',
            }}
          >
            <span className={style.colorLegendPatchText}>No</span>
          </div>
          <div
            className={activeScores.indexOf(ACTIVE_SCORE_MAPPING.maybe) >= 0 ? style.colorLegendPatch : style.inactiveColorLegendPatch}
            onClick={toggleActiveScore('maybe')}
            style={{
              background: scoreMap.maybe,
              float: 'left',
            }}
          >
            <span className={style.colorLegendPatchText}>Maybe</span>
          </div>
          <div
            className={activeScores.indexOf(ACTIVE_SCORE_MAPPING.yes) >= 0 ? style.colorLegendPatch : style.inactiveColorLegendPatch}
            onClick={toggleActiveScore('yes')}
            style={{
              background: scoreMap.yes,
              float: 'left',
            }}
          >
            <span className={style.colorLegendPatchText}>Yes</span>
          </div>
        </div>
      </section>);
  }

  //
  // Size
  //
  sizeGroup.push(
    <section className={ style.titleGroup } key="size-group-title">
      <label>Size</label>
    </section>);

  if (model.usePointSprites) {
    sizeGroup.push(
      <section key="sprite-size-by" className={ style.property }>
        <label>Size By</label>
        <select
          value={ model.pointSizeBy }
          onChange={ e => onChange(applyChange(model, 'pointSizeBy', e.target.value)) }
        >
          <option key="" value="">Constant (no array)</option>
          <option key="user selection" value="user selection">Active Annotation</option>
          { model.arrayList.map(txt => <option key={txt} value={txt}>{ txt }</option>) }
        </select>
      </section>);

    if (model.pointSizeBy === '') {
      sizeGroup.push(
        <section key="sprite-const" className={ style.property }>
          <label>Constant&nbsp;Size</label>
          <input
            type="number"
            min="1"
            max="10"
            value={ model.constantPointSize }
            onChange={ e => onChange(applyChange(model, 'constantPointSize', e.target.value)) }
          />
        </section>);
    } else {  // Sizing by some array
      sizeGroup.push(
        <section key="sprite-size-range" className={ style.property }>
          <label>Size Range</label>
          <input
            key="sprite-size-min"
            type="number"
            min="0.05"
            max="5"
            step="0.05"
            style={{ marginRight: 5 }}
            value={ model.pointSizeMin }
            onChange={ e => onChange(applyChange(model, 'pointSizeMin', e.target.value)) }
          />
          <input
            key="sprite-size-max"
            type="number"
            min="1"
            max="5"
            step="0.05"
            value={ model.pointSizeMax }
            onChange={ e => onChange(applyChange(model, 'pointSizeMax', e.target.value)) }
          />
        </section>);

      // Prevent showing presets in case of user selection
      // if (model.pointSizeBy !== 'user selection') {
      //   sizeGroup.push(
      //     <section key="sprite-size-function" className={ style.property }>
      //       <label>Size</label>
      //       <div className={ style.pwfFunctionContainer }>
      //         {functionPresets.map(p => (<div key={p.key} title={p.key} className={ style.pwfButtonContainer }>
      //           <SvgIconWidget
      //             icon={p.icon}
      //             className={model.pointSizeFunction === p.key ? style.selectedPwfButton : style.pwfButton}
      //             onClick={e => onChange(applyChange(model, 'pointSizeFunction', p.key))}
      //           />
      //         </div>))}
      //       </div>
      //     </section>);
      // }
    }
  } else { // no sprites, just regular points
    sizeGroup.push(
      <section className={ style.property } key="size-group-point-size">
        <label>Constant&nbsp;Size</label>
        <input
          type="number"
          min="1"
          max="10"
          value={ model.pointSize }
          onChange={ e => onChange(applyChange(model, 'pointSize', e.target.value)) }
        />
      </section>);
  }

  //
  // Opacity
  //
  if (model.usePointSprites && model.colorBy !== 'user selection') {
    opacityGroup.push(
      <section className={ style.titleGroup } key="opacity-group-title">
        <label>Opacity</label>
      </section>);

    opacityGroup.push(
      <section key="sprite-opacity" className={ style.property }>
        <label>Opacity By</label>
        <select
          value={ model.opacityBy }
          onChange={ e => onChange(applyChange(model, 'opacityBy', e.target.value)) }
        >
          <option key="" value="">No transparency</option>
          { model.arrayList.map(txt => <option key={txt} value={txt}>{ txt }</option>) }
        </select>
      </section>);

    // opacityGroup.push(
    //   <section key="sprite-opacity-function" className={ style.property }>
    //     <label>Mapping</label>
    //     <div className={ style.pwfFunctionContainer }>
    //       {functionPresets.map(p => (<div key={p.key} title={p.key} className={ style.pwfButtonContainer }>
    //         <SvgIconWidget
    //           icon={p.icon}
    //           className={model.opacityFunction === p.key ? style.selectedPwfButton : style.pwfButton}
    //           onClick={e => onChange(applyChange(model, 'opacityFunction', p.key))}
    //         />
    //       </div>))}
    //     </div>
    //   </section>);
  }

  return (
    <div className={ style.container } >
      { spriteGroup }
      { axesGroup }
      { colorGroup }
      { sizeGroup }
      { opacityGroup }
      <section className={ style.property } key="misc-group-render-stats">
        <label style={{ marginTop: 20 }}>Show Render Stats</label>
        <input
          type="checkbox"
          style={{ marginTop: 30, flex: 'none' }}
          checked={ model.showRenderStats }
          onChange={ e => onChange(applyChange(model, 'showRenderStats', !model.showRenderStats)) }
        />
      </section>
    </div>);
}

EditView.propTypes = {
  model: React.PropTypes.object,
  colorMaps: React.PropTypes.object,
  getScalarRange: React.PropTypes.func,
  scores: React.PropTypes.array,
  activeScores: React.PropTypes.array,
  onActiveScoresChange: React.PropTypes.func,
  onChange: React.PropTypes.func,
  toggleEditMode: React.PropTypes.func,
};
