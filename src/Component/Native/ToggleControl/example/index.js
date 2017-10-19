import ToggleControlComponent   from '..';
import BGColorComponent     from '../../BackgroundColor';
import Spacer from '../../Spacer';

// Load CSS
import 'normalize.css';

const container = document.querySelector('.content');
container.style.height = '100vh';

const green = new BGColorComponent('green');
const spacer = new Spacer('200px');

const toggleView = new ToggleControlComponent(green, spacer);

toggleView.setContainer(container);
toggleView.render();

window.addEventListener('resize', () => {
  toggleView.resize();
});
