import CompositeComponent   from '..';
import BGColorComponent     from '../../BackgroundColor';

// Load CSS
require('normalize.css');

const container = document.querySelector('.content');
container.style.position = 'relative';
container.style.width = '100%';
container.style.height = '600px';

const composite = new CompositeComponent();
const green = new BGColorComponent('green');
const red = new BGColorComponent('red');
const blue = new BGColorComponent('blue');
const pink = new BGColorComponent('pink');

composite.addViewport(green);
composite.addViewport(red);
composite.addViewport(blue);
composite.addViewport(pink);

composite.setContainer(container);
