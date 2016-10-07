import React from 'react';
import style from 'PVWStyle/ReactWidgets/SelectionEditorWidget.mcss';
import LegendIcon from '../LegendIcon';

export default function fieldRender(props) {
  return (
    <table className={[props.depth ? style.table : style.rootTable, props.className].join(' ')}>
      <tbody>
        <tr>
          <td className={style.operationCell} title={props.fieldName}>
            <LegendIcon width="25px" height="25px" getLegend={props.getLegend} name={props.fieldName} />
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

fieldRender.propTypes = {
  children: React.PropTypes.oneOfType([React.PropTypes.element, React.PropTypes.array]),
  getLegend: React.PropTypes.func,
  fieldName: React.PropTypes.string,
  depth: React.PropTypes.number,
  className: React.PropTypes.string,
};
