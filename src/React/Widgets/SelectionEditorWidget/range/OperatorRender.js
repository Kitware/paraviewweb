import React     from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/SelectionEditorWidget.mcss';

import And            from '../../../../../svg/Operations/And.svg';
import Or             from '../../../../../svg/Operations/Or.svg';
import SvgIconWidget  from '../../SvgIconWidget';

const OPERATOR_LABEL = {
  or: Or,
  and: And,
};

export default function render(props) {
  const operator = props.operator;
  return (
    <table className={[props.depth ? style.table : style.rootTable, props.className].join(' ')}>
      <tbody>
        <tr>
          <td className={style.operationCell}>
            <SvgIconWidget icon={OPERATOR_LABEL[operator]} width="25px" height="25px" />
          </td>
          <td className={style.groupTableCell} />
          <td>
            <table className={style.table}>
              <tbody>
                {React.Children.map(props.children, (r, idx) =>
                  <tr key={idx}>
                    <td className={style.tableCell}>
                      {r}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>);
}

render.propTypes = {
  children: PropTypes.array,
  operator: PropTypes.string,
  depth: PropTypes.number,
  className: PropTypes.string,
};
