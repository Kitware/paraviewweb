import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/ScatterPlotControl.mcss';

export default function LegendView(props) {
  const { model } = props;
  const spriteLegend = [];
  /* eslint-disable react/jsx-curly-spacing */
  if (model.usePointSprites) {
    // Point size
    spriteLegend.push(
      <section className={ style.property }>
        <label>Point Size</label>
        <span>{ model.pointSize }</span>
      </section>);

    // Representation type
    spriteLegend.push(
      <section className={ style.property }>
        <label>Representation</label>
        <span>{ model.pointRepresentation }</span>
      </section>);

    // Size mapping
    spriteLegend.push(
      <section className={ style.property }>
        <label>Size by</label>
        <span>{ model.pointSizeBy ? model.pointSizeBy : 'Constant' }</span>
        <table className={ style.propertyTable }>
          <tbody>
            <tr>
              <td><label>Range</label></td>
              <td title="Min radius">{ model.pointSizeMin }</td>
              <td title="Max radius">{ model.pointSizeMax }</td>
            </tr>
          </tbody>
        </table>
      </section>);

    // Constant size for sprite
    if (!model.pointSizeBy) {
      spriteLegend.push(
        <section className={ style.property }>
          <label>Constant&nbsp;Radius</label>
          <span>{ model.constantPointSize }</span>
        </section>);
    }

    // Opacity
    spriteLegend.push(
      <section className={ style.property }>
        <label>Opacity</label>
        <span>{ model.opacityBy ? model.opacityBy : 'Constant' }</span>
      </section>);
  }
  return (
    <div className={ style.container } >
      <section className={ style.property }>
        <label>Axes</label>
        <table className={ style.propertyTable }>
          <tbody>
            <tr><td><label>X</label></td><td><span>{ model.x }</span></td></tr>
            <tr><td><label>Y</label></td><td><span>{ model.y }</span></td></tr>
            <tr><td><label>Z</label></td><td><span>{ model.z }</span></td></tr>
          </tbody>
        </table>
      </section>
      { spriteLegend }
      <section className={ style.property }>
        <div><center>{ model.colorBy }</center></div>
      </section>
    </div>);
}

LegendView.propTypes = {
  model: PropTypes.object,
  toggleEditMode: PropTypes.func,
};
