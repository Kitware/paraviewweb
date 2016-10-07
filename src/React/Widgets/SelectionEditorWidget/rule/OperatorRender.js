import React from 'react';

import style from 'PVWStyle/ReactWidgets/SelectionEditorWidget.mcss';

import And           from '../../../../../svg/Operations/And.svg';
import Or            from '../../../../../svg/Operations/Or.svg';
import RuleRender    from './RuleRender';
import SvgIconWidget from '../../SvgIconWidget';

const OPERATOR_LABEL = {
  or: Or,
  and: And,
};

export default function operatorRender(props) {
  const operator = props.rule.terms[0];
  const subRules = props.rule.terms.filter((r, idx) => (idx > 0));
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
                {subRules.map((r, idx) =>
                  <tr key={idx}>
                    <td className={style.tableCell}>
                      <RuleRender
                        rule={r}
                        path={[].concat(props.path, idx + 1)}
                        depth={props.depth + 1}
                        maxDepth={props.maxDepth}
                        onChange={props.onChange}
                        onDelete={props.onDelete}
                        getLegend={props.getLegend}
                      />
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
  getLegend: React.PropTypes.func,
  rule: React.PropTypes.object,
  depth: React.PropTypes.number,
  maxDepth: React.PropTypes.number,
  path: React.PropTypes.array,
  onChange: React.PropTypes.func,
  onDelete: React.PropTypes.func,
  className: React.PropTypes.string,
};
