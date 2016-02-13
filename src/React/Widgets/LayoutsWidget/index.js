import React from 'react';
import style from 'PVWStyle/ReactWidgets/LayoutsWidget.mcss';

export default React.createClass({

    displayName: 'LayoutsWidget',

    propTypes: {
        onChange: React.PropTypes.func,
    },

    onLayoutChange(event) {
        var layout = event.currentTarget.getAttribute('name');
        if(this.props.onChange) {
            this.props.onChange(layout);
        }
    },

    render() {
        return (<section>
                    <table className={ style.table } name="2x2" onClick={this.onLayoutChange}>
                      <tbody>
                        <tr>
                          <td className={ style.td }></td>
                          <td className={ style.td }></td>
                        </tr>
                        <tr>
                          <td className={ style.td }></td>
                          <td className={ style.td }></td>
                        </tr>
                      </tbody>
                    </table>

                    <table className={ style.table } name="1x2" onClick={this.onLayoutChange}>
                      <tbody>
                        <tr>
                          <td className={ style.td }></td>
                        </tr>
                        <tr>
                          <td className={ style.td }></td>
                        </tr>
                      </tbody>
                    </table>

                    <table className={ style.table } name="2x1" onClick={this.onLayoutChange}>
                      <tbody>
                        <tr>
                          <td className={ style.td }></td>
                          <td className={ style.td }></td>
                        </tr>
                      </tbody>
                    </table>

                    <table className={ style.table } name="1x1" onClick={this.onLayoutChange}>
                      <tbody>
                        <tr>
                          <td className={ style.td }></td>
                        </tr>
                      </tbody>
                    </table>

                    <table className={ style.table } name="3xL" onClick={this.onLayoutChange}>
                      <tbody>
                        <tr>
                          <td rowSpan="2" className={ style.td }></td>
                          <td className={ style.td }></td>
                        </tr>
                        <tr>
                          <td className={ style.td }></td>
                        </tr>
                      </tbody>
                    </table>

                    <table className={ style.table } name="3xT" onClick={this.onLayoutChange}>
                      <tbody>
                        <tr>
                          <td colSpan="2" className={ style.td }></td>
                        </tr>
                        <tr>
                          <td className={ style.td }></td>
                          <td className={ style.td }></td>
                        </tr>
                      </tbody>
                    </table>

                    <table className={ style.table } name="3xR" onClick={this.onLayoutChange}>
                      <tbody>
                        <tr>
                          <td className={ style.td }></td>
                          <td rowSpan="2" className={ style.td }></td>
                        </tr>
                        <tr>
                          <td className={ style.td }></td>
                        </tr>
                      </tbody>
                    </table>

                    <table className={ style.table } name="3xB" onClick={this.onLayoutChange}>
                      <tbody>
                        <tr>
                          <td className={ style.td }></td>
                          <td className={ style.td }></td>
                        </tr>
                        <tr>
                          <td colSpan="2" className={ style.td }></td>
                        </tr>
                      </tbody>
                    </table>
                </section>);
    },
});
