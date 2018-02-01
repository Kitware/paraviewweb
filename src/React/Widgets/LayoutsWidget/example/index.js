import 'normalize.css';

import React from 'react';
import ReactDOM from 'react-dom';

import LayoutsWidget from '..';

ReactDOM.render(
  <LayoutsWidget onChange={console.log} />,
  document.querySelector('.content')
);
