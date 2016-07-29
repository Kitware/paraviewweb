import ToggleControlComponent   from '..';
import BGColorComponent     from '../../BackgroundColor';

// Load CSS
import 'normalize.css';

const container = document.querySelector('.content');
container.style.height = '100vh';

const green = new BGColorComponent('green');
const red = new BGColorComponent('red');
const toggleView = new ToggleControlComponent(green, red);

toggleView.setContainer(container);
toggleView.render();

window.addEventListener('resize', () => {
  toggleView.resize();
});
