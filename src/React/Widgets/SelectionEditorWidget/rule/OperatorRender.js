import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/SelectionEditorWidget.mcss';

import And from '../../../../../svg/Operations/And.svg';
import Or from '../../../../../svg/Operations/Or.svg';
import RuleRender from './RuleRender';
import SvgIconWidget from '../../SvgIconWidget';

const OPERATOR_LABEL = {
  or: Or,
  and: And,
};

export default function render(props) {
  const operator = props.rule.terms[0];
  const subRules = props.rule.terms.filter((r, idx) => idx > 0);
  return (
    <table
      className={[
        props.depth ? style.table : style.rootTable,
        props.className,
      ].join(' ')}
    >
      <tbody>
        <tr>
          <td className={style.operationCell}>
            <SvgIconWidget
              icon={OPERATOR_LABEL[operator]}
              width="25px"
              height="25px"
            />
          </td>
          <td className={style.groupTableCell} />
          <td>
            <table className={style.table}>
              <tbody>
                {subRules.map((r, idx) => (
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
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

render.propTypes = {
  getLegend: PropTypes.func,
  rule: PropTypes.object,
  depth: PropTypes.number,
  maxDepth: PropTypes.number,
  path: PropTypes.array,
  onChange: PropTypes.func,
  onDelete: PropTypes.func,
  className: PropTypes.string,
};
