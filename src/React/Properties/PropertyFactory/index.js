import React            from 'react';

import CellProperty     from '../CellProperty';
import CheckboxProperty from '../CheckboxProperty';
import EnumProperty     from '../EnumProperty';
import MapProperty     from '../MapProperty';
import SliderProperty   from '../SliderProperty';

/* eslint-disable react/display-name */
/* eslint-disable react/no-multi-comp */
/* eslint-disable max-len */
const factoryMapping = {
  Cell: (prop, viewData, onChange) => <CellProperty key={prop.data.id} data={prop.data} ui={prop.ui} viewData={viewData} show={prop.show} onChange={onChange} />,
  Slider: (prop, viewData, onChange) => <SliderProperty key={prop.data.id} data={prop.data} ui={prop.ui} viewData={viewData} show={prop.show} onChange={onChange} />,
  Enum: (prop, viewData, onChange) => <EnumProperty key={prop.data.id} data={prop.data} ui={prop.ui} viewData={viewData} show={prop.show} onChange={onChange} />,
  Checkbox: (prop, viewData, onChange) => <CheckboxProperty key={prop.data.id} data={prop.data} ui={prop.ui} viewData={viewData} show={prop.show} onChange={onChange} />,
  Map: (prop, viewData, onChange) => <MapProperty key={prop.data.id} data={prop.data} ui={prop.ui} viewData={viewData} show={prop.show} onChange={onChange} />,
};

/* eslint-enable react/display-name */
/* eslint-enable react/no-multi-comp */
/* eslint-enable max-len */


function capitalize(str) {
  return str[0].toUpperCase() + str.substr(1).toLowerCase();
}

export default function (prop, vd, onChange) {
  var fn = factoryMapping[capitalize(prop.ui.propType)];
  if (fn) {
    return fn(prop, vd, onChange);
  }
  return null;
}
