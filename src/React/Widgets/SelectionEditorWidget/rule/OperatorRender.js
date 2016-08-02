import React from 'react';
import RenderFactory from './RenderFactory';
import style from 'PVWStyle/ReactWidgets/SelectionEditorWidget.mcss';
import SvgIconWidget from '../../SvgIconWidget';
import And from '../../../../../svg/Operations/And.svg';
import Or from '../../../../../svg/Operations/Or.svg';

const OPERATOR_LABEL = {
  or: Or,
  and: And,
};

export default function OperatorRender(props) {
  const operator = props.rule.terms[0];
  const subRules = props.rule.terms.filter((r, idx) => (idx > 0));
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
              {subRules.map((r, idx) =>
                <tr key={idx}>
                  <td className={style.tableCell}>
                  {RenderFactory.renderRule(r, props, [].concat(props.path, idx + 1), props.depth + 1, props.maxDepth)}
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
  legendService: React.PropTypes.object,
  // annotationService: React.PropTypes.object,
  rule: React.PropTypes.object,
  depth: React.PropTypes.number,
  maxDepth: React.PropTypes.number,
  path: React.PropTypes.array,
  onChange: React.PropTypes.func,
  onDelete: React.PropTypes.func,
};
