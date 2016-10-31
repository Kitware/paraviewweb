import CompositeComponent   from '..';
import BackgroundColor      from '../../BackgroundColor';

// Load CSS
require('normalize.css');

const container = document.querySelector('.content');
container.style.position = 'relative';
container.style.width = '100%';
container.style.height = '600px';

const composite = new CompositeComponent();
const green = BackgroundColor.newInstance({ color:'green' });
const red   = BackgroundColor.newInstance({ color:'red' });
const blue  = BackgroundColor.newInstance({ color:'blue' });
const pink  = BackgroundColor.newInstance({ color:'pink' });

composite.addViewport(green);
composite.addViewport(red);
composite.addViewport(blue);
composite.addViewport(pink);

composite.setContainer(container);
