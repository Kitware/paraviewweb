import React from 'react';
import style from 'PVWStyle/ReactWidgets/SelectionEditorWidget.mcss';
import NumberFormatter, { sciNotationRegExp } from '../../../../Common/Misc/NumberFormatter';
import SvgIconWidget from '../../SvgIconWidget';
import Ineq from '../../../../../svg/Operations/Ineq.svg';
import Ineqq from '../../../../../svg/Operations/Ineqq.svg';

const CHOICE_LABELS = {
  o: Ineq,
  '*': Ineqq,
};

// typical divider we are rendering:
// {
//   "value": 101.3,
//   "uncertainty": 20,
//   "closeToLeft": false
// },

export default function dividerRender(props) {
  const { divider } = props;
  const formatter = new NumberFormatter(3, [Number(divider.value), Number(divider.uncertainty)]);

  function onChange(e, force = false) {
    if (!e.target.validity.valid) {
      return;
    }

    const value = e.target.value;
    const shouldBeNumber = e.target.nodeName === 'INPUT';
    const path = [].concat(props.path, e.target.dataset.path);

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
    const path = [].concat(props.path, target.dataset.path, !divider.closeToLeft);
    props.onChange(path);
  }

  return (
    <section className={style.fiveClauseContainer}>
      <div className={style.activeInequality} data-path="closeToLeft" onClick={toggleIneq}>
        <SvgIconWidget style={{ pointerEvents: 'none' }} width="20px" height="20px" icon={CHOICE_LABELS[divider.closeToLeft ? '*' : 'o']} />
      </div>
      <input
        className={style.numberInput}
        type="text"
        pattern={sciNotationRegExp}
        data-path="value"
        value={divider.value}
        onChange={onChange}
        onBlur={onBlur}
      />
      {(divider.uncertainty !== undefined) ? (
        <span>
          {/* plus-minus unicode character: &#xb1; */}
          <div className={style.inequality}>&#xb1;
          </div>
          <input
            className={style.numberInput}
            type="text"
            pattern={sciNotationRegExp}
            data-path="uncertainty"
            value={divider.uncertainty}
            onChange={onChange}
            onBlur={onBlur}
          />
        </span>
        ) : null
      }
      <i className={style.deleteButton} onClick={onDelete} />
    </section>
  );
}

dividerRender.propTypes = {
  divider: React.PropTypes.object,
  path: React.PropTypes.array,
  onChange: React.PropTypes.func,
  onDelete: React.PropTypes.func,
};
