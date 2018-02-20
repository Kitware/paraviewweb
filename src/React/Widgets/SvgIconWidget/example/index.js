import 'normalize.css';

import React from 'react';
import ReactDOM from 'react-dom';

import SvgIconWidget from 'paraviewweb/src/React/Widgets/SvgIconWidget';
import style from 'paraviewweb/src/React/Widgets/SvgIconWidget/example/style.mcss';

import pv from 'paraviewweb/svg/paraview.svg';
import pvw from 'paraviewweb/svg/paraviewweb.svg';
import gau from 'paraviewweb/svg/function-gaussian.svg';
import lin from 'paraviewweb/svg/function-linear.svg';

const container = document.querySelector('.content');

ReactDOM.render(
  <div>
    <SvgIconWidget width="30px" height="30px" />
    <SvgIconWidget className={style.smallIcon} icon={pv} />
    <SvgIconWidget className={style.mediumIcon} icon={pvw} />
    <SvgIconWidget className={style.bigIcon} icon={gau} />
    <SvgIconWidget className={style.redIcon} icon={lin} />
  </div>,
  container
);

document.body.style.margin = '10px';
