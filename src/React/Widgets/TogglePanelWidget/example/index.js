// Load CSS
import 'normalize.css';
import 'font-awesome/css/font-awesome.css';

import React from 'react';
import ReactDOM from 'react-dom';

import TogglePanelWidget from '..';

const container = document.querySelector('.content');

document.body.style.padding = '10px';
document.body.style.background = '#ccc';

ReactDOM.render(
  <div>
    <div
      style={{
        position: 'relative',
        width: '2em',
        border: 'solid 1px black',
        borderRadius: '5px',
      }}
    >
      <TogglePanelWidget anchor={['top', 'right']} position={['top', 'left']}>
        <div
          style={{
            padding: '50px',
            background: 'red',
            border: 'solid 1px black',
            borderRadius: '5px',
          }}
        >
          Some content here
        </div>
      </TogglePanelWidget>
      <TogglePanelWidget anchor={['bottom', 'left']} position={['top', 'left']}>
        <div
          style={{
            padding: '50px',
            background: 'red',
            border: 'solid 1px black',
            borderRadius: '5px',
          }}
        >
          Some other here
        </div>
      </TogglePanelWidget>
    </div>
  </div>,
  container
);
