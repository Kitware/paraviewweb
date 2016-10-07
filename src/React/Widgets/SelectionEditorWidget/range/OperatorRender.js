import React          from 'react';

import style          from 'PVWStyle/ReactWidgets/SelectionEditorWidget.mcss';

import And            from '../../../../../svg/Operations/And.svg';
import Or             from '../../../../../svg/Operations/Or.svg';
import SvgIconWidget  from '../../SvgIconWidget';

const OPERATOR_LABEL = {
  or: Or,
  and: And,
};

export default function operatorRender(props) {
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

operatorRender.propTypes = {
  children: React.PropTypes.array,
  operator: React.PropTypes.string,
  depth: React.PropTypes.number,
  className: React.PropTypes.string,
};
