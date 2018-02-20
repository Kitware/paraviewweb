import 'normalize.css';

import React from 'react';
import { render } from 'react-dom';

import FileBrowserWidget from 'paraviewweb/src/React/Widgets/FileBrowserWidget';

document.body.style.margin = 0;
document.body.style.padding = 0;
document.querySelector('.content').style.height = '98vh';

function onAction(type, files, aaa) {
  console.log(type, files, aaa);
}

render(
  React.createElement(FileBrowserWidget, {
    directories: ['a', 'b', 'c'],
    groups: [
      { label: 'd', files: ['da', 'db', 'dc'] },
      { label: 'e', files: ['ea', 'eb', 'ec'] },
      { label: 'f', files: ['fa', 'fb', 'fc'] },
    ],
    files: [
      'g',
      'h',
      'i',
      'Super long name with not much else bla bla bla bla bla bla bla bla bla bla bla bla.txt',
    ],
    onAction,
    path: ['Home', 'subDir1', 'subDir2', 'subDir3'],
  }),
  document.querySelector('.content')
);
