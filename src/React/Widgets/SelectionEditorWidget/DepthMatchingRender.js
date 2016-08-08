import React from 'react';
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
  children: React.PropTypes.object,
  depth: React.PropTypes.number,
  maxDepth: React.PropTypes.number,
};
