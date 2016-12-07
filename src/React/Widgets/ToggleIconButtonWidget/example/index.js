/* global document */
import React                    from 'react';
import ReactDOM                 from 'react-dom';
import ToggleIconButtonWidget   from '..';

const container = document.querySelector('.content');

// Load CSS
require('normalize.css');
require('font-awesome/css/font-awesome.css');

document.body.style.padding = '10px';

function onChange(value, name) {
  console.log(name, ' => ', value);
}

/* eslint-disable no-multi-spaces */
ReactDOM.render(
  <div>
    <ToggleIconButtonWidget name="wifi"   icon="fa-wifi"      value onChange={onChange} />
    <ToggleIconButtonWidget name="btooth" icon="fa-bluetooth" value={false} onChange={onChange} />
    <ToggleIconButtonWidget name="a"      icon="fa-at"  onChange={onChange} />
    <ToggleIconButtonWidget name="b"      icon="fa-ban"    toggle onChange={onChange} />
    <ToggleIconButtonWidget name="c"      icon="fa-bank" alwaysOn onChange={onChange} />
    <ToggleIconButtonWidget name="check"  icon="fa-check-square-o" iconDisabled="fa-square-o" onChange={onChange} />
  </div>,
  container);

