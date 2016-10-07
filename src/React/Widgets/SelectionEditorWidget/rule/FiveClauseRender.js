import React from 'react';

import style from 'PVWStyle/ReactWidgets/SelectionEditorWidget.mcss';

import Ineq             from '../../../../../svg/Operations/Ineq.svg';
import Ineqq            from '../../../../../svg/Operations/Ineqq.svg';
import LegendIcon       from '../LegendIcon';
import NumberFormatter, { sciNotationRegExp } from '../../../../Common/Misc/NumberFormatter';
import SvgIconWidget    from '../../SvgIconWidget';

const CHOICE_LABELS = {
  '<': Ineq,
  '<=': Ineqq,
};

const NEXT_VALUE = {
  '<': '<=',
  '<=': '<',
};

/* eslint-disable react/no-unused-prop-types */

export default function fiveClauseRender(props) {
  const { rule } = props;
  const terms = rule.terms;
  const formatter = new NumberFormatter(3, [Number(terms[0]), Number(terms[4])]);

  function onChange(e, force = false) {
    if (!e.target.validity.valid) {
      return;
    }

    const value = e.target.value;
    const shouldBeNumber = e.target.nodeName === 'INPUT';
    const path = [].concat(props.path, Number(e.target.dataset.path));

    if (shouldBeNumber) {
      path.push(!force ? value : Number(formatter.eval(Number(value))));
    } else {
      path.push(value);
    }

    props.onChange(path, !force);
  }

  function onBlur(e) {
    onChange(e, true);
  }

  function onDelete() {
    props.onDelete(props.path);
  }

  function toggleIneq(e) {
    let target = e.target;
    while (!target.dataset) {
      target = target.parentNode;
    }
    const idx = Number(target.dataset.path);
    const path = [].concat(props.path, idx, NEXT_VALUE[terms[idx]]);
    props.onChange(path);
  }

  return (
    <section className={style.fiveClauseContainer}>
      <input
        className={style.numberInput}
        type="text"
        pattern={sciNotationRegExp}
        data-path="0"
        value={terms[0]}
        onChange={onChange}
        onBlur={onBlur}
      />
      <div className={style.activeInequality} data-path="1" onClick={toggleIneq}>
        <SvgIconWidget style={{ pointerEvents: 'none' }} width="20px" height="20px" icon={CHOICE_LABELS[terms[1]]} />
      </div>
      <div className={style.inequality} title={terms[2]}>
        <LegendIcon width="20px" height="20px" getLegend={props.getLegend} name={terms[2]} />
      </div>
      <div className={style.activeInequality} data-path="3" onClick={toggleIneq}>
        <SvgIconWidget style={{ pointerEvents: 'none' }} width="20px" height="20px" icon={CHOICE_LABELS[terms[3]]} />
      </div>
      <input
        className={style.numberInput}
        type="text"
        pattern={sciNotationRegExp}
        data-path="4"
        value={terms[4]} // formatter.eval(terms[1])
        onChange={onChange}
        onBlur={onBlur}
      />
      <i className={style.deleteButton} onClick={onDelete} />
    </section>);
}

fiveClauseRender.propTypes = {
  getLegend: React.PropTypes.func,
  rule: React.PropTypes.object,
  depth: React.PropTypes.number,
  path: React.PropTypes.array,
  onChange: React.PropTypes.func,
  onDelete: React.PropTypes.func,
};
