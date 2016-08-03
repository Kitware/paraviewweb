import React from 'react';
import style from 'PVWStyle/ReactWidgets/SelectionEditorWidget.mcss';
import LegendIcon from '../LegendIcon';

export default function FieldRender(props) {
  return (
    <table className={props.depth ? style.table : style.rootTable}>
      <tbody>
        <tr>
          <td className={style.operationCell} title={props.fieldName}>
            <LegendIcon width="25px" height="25px" provider={props.legendService} name={props.fieldName} />
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

FieldRender.propTypes = {
  children: React.PropTypes.array,
  legendService: React.PropTypes.object,
  fieldName: React.PropTypes.string,
  depth: React.PropTypes.number,
};
