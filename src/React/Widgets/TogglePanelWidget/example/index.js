import TogglePanelWidget from '..';
import React             from 'react';
import ReactDOM          from 'react-dom';

const container = document.querySelector('.content');

// Load CSS
require('normalize.css');
require('font-awesome/css/font-awesome.css');

document.body.style.padding = '10px';
document.body.style.background = '#ccc';

ReactDOM.render(
    <div>
        <div style={{
                position: 'relative',
                width: '2em',
                border: 'solid 1px black',
                borderRadius: '5px',
            }}>
            <TogglePanelWidget anchor={['top', 'right']} position={['top', 'left']}>
                <div style={{
                    padding: '50px',
                    background: 'red',
                    border: 'solid 1px black',
                    borderRadius: '5px',
                }}>
                Some content here
                </div>
            </TogglePanelWidget>
            <TogglePanelWidget anchor={['bottom', 'left']} position={['top', 'left']}>
                <div style={{
                    padding: '50px',
                    background: 'red',
                    border: 'solid 1px black',
                    borderRadius: '5px',
                }}>
                Some other here
                </div>
            </TogglePanelWidget>
        </div>
    </div>,
    container);

