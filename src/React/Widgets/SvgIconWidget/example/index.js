import 'babel-polyfill';
import React              from 'react';
import ReactDOM           from 'react-dom';
import SvgIconWidget      from '..';
import style              from './style.mcss';

import pv   from '../../../../../svg/paraview.svg';
import pvw  from '../../../../../svg/paraviewweb.svg';
import gau  from '../../../../../svg/function-gaussian.svg';
import lin  from '../../../../../svg/function-linear.svg';

const container = document.querySelector('.content');

ReactDOM.render(
  <div>
    <SvgIconWidget width='30px' height='30px'/>
    <SvgIconWidget className={ style.smallIcon }  icon={ pv } />
    <SvgIconWidget className={ style.mediumIcon } icon={ pvw } />
    <SvgIconWidget className={ style.bigIcon }    icon={ gau} />
    <SvgIconWidget className={ style.redIcon }    icon={ lin } />
  </div>,
  container);

document.body.style.margin = '10px';
