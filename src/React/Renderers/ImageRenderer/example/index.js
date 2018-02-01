import 'normalize.css';

import React from 'react';
import ReactDOM from 'react-dom';

import ImageRenderer from '..';

const container = document.createElement('div');
const btn = document.createElement('button');
const nextBtn = document.createElement('button');
const urlInput = document.createElement('input');
const urls = [
  'http://www.paraview.org/wp-content/uploads/2015/03/LANL_ClimateExample.jpg',
  'http://www.paraview.org/wp-content/uploads/2014/04/0_full_Asteroid.png',
  'http://www.paraview.org/wp-content/uploads/2014/05/NCOM.png',
  'http://www.paraview.org/wp-content/uploads/2014/05/RASM.png',
  'http://www.paraview.org/wp-content/uploads/2014/04/seismic.jpg',
];

let component = null;
let imageIndex = 0;
const images = [];
let count = urls.length;

// Preload images
while (count--) {
  const img = new Image();
  img.src = urls[count];
  images.push(img);
}

// Add reset camera
btn.onclick = function resetCamera() {
  if (component) {
    component.resetCamera();
  }
};
btn.appendChild(document.createTextNode('Reset Camera'));
btn.style.top = '5px';
btn.style.left = '5px';
btn.style.position = 'absolute';
btn.style.zIndex = '10';

// Next image
nextBtn.onclick = function nextImage() {
  if (component) {
    imageIndex = (imageIndex + 1) % urls.length;
    urlInput.setAttribute('value', urls[imageIndex]);
    component.renderImage({ url: urls[imageIndex] });
    component.resetCamera();
  }
};
nextBtn.appendChild(document.createTextNode('Next Image'));
nextBtn.style.top = '5px';
nextBtn.style.right = '5px';
nextBtn.style.position = 'absolute';
nextBtn.style.zIndex = '10';

// Add Image URL
urlInput.onblur = function updateURL() {
  component.renderImage({ url: urlInput.value });
};
urlInput.style.bottom = '5px';
urlInput.style.left = '5px';
urlInput.style.width = 'calc(100% - 20px)';
urlInput.style.position = 'absolute';
urlInput.style.zIndex = '10';
urlInput.setAttribute('type', 'text');
urlInput.setAttribute(
  'value',
  'http://www.paraview.org/wp-content/uploads/2015/03/LANL_ClimateExample.jpg'
);

// Configure container
container.style.width = '100%';
container.style.height = '100%';
container.style.position = 'absolute';

// Add container to body
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#eee';

document.body.appendChild(btn);
document.body.appendChild(nextBtn);
document.body.appendChild(urlInput);
document.body.appendChild(container);

component = ReactDOM.render(React.createElement(ImageRenderer, {}), container);

component.renderImage({
  url:
    'http://www.paraview.org/wp-content/uploads/2015/03/LANL_ClimateExample.jpg',
});
