import React from 'react';
// import RenderFactory from './RenderFactory';
import style from 'PVWStyle/ReactWidgets/SelectionEditorWidget.mcss';
import SvgIconWidget from '../../SvgIconWidget';
import And from '../../../../../svg/Operations/And.svg';
import Or from '../../../../../svg/Operations/Or.svg';

const OPERATOR_LABEL = {
  or: Or,
  and: And,
};

export default function OperatorRender(props) {
  const operator = props.operator;
  // const subRules = props.rule.terms.filter((r, idx) => (idx > 0));
  return (
    <table className={props.depth ? style.table : style.rootTable}>
      <tbody>
        <tr>
          <td className={style.operationCell}>
            <SvgIconWidget icon={OPERATOR_LABEL[operator]} width="25px" height="25px" />
          </td>
          <td className={style.groupTableCell}>
          </td>
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

OperatorRender.propTypes = {
  children: React.PropTypes.array,
  // annotationService: React.PropTypes.object,
  operator: React.PropTypes.string,
  depth: React.PropTypes.number,
};
