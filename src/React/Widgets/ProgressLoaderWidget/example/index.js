import React from 'react';
import ReactDOM from 'react-dom';

import ProgressLoaderWidget from 'paraviewweb/src/React/Widgets/ProgressLoaderWidget';

const container = document.querySelector('.content');

ReactDOM.render(
  <ProgressLoaderWidget message="Something is going on..." />,
  container
);

document.body.style.margin = '10px';
