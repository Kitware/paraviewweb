import 'normalize.css';

import ToggleControlComponent from 'paraviewweb/src/Component/Native/ToggleControl';
import BGColorComponent from 'paraviewweb/src/Component/Native/BackgroundColor';
import Spacer from 'paraviewweb/src/Component/Native/Spacer';

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
