import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/SelectionEditorWidget.mcss';

export default function DepthMatchingRender(props) {
  if (props.depth < props.maxDepth) {
    return (
      <DepthMatchingRender depth={props.depth + 1} maxDepth={props.maxDepth}>
        <table className={style.table}>
          <tbody>
            <tr>
              <td className={style.operationCell} />
              <td className={style.groupTableCellPadding} />
              <td>
                <table className={style.table}>
                  <tbody>
                    <tr>
                      <td className={style.tableCell}>{props.children}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </DepthMatchingRender>);
  }

  return props.children;
}

DepthMatchingRender.propTypes = {
  children: PropTypes.object,
  depth: PropTypes.number,
  maxDepth: PropTypes.number,
};
