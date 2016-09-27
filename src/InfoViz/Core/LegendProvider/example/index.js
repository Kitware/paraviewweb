import 'babel-polyfill';
import React              from 'react';
import ReactDOM           from 'react-dom';

import LegendHelper from '..';
import SvgIconWidget from '../../../../React/Widgets/SvgIconWidget';

const legendEntries = [
  'Aashish',
  'Alex',
  'Alexis',
  'Alvaro',
  'Andinet',
  'Andrew',
  'Ann',
  'Anthony',
  'Arslan',
  'Bailey',
  'Benjamin',
  'Berk',
  'Betsy',
  'Bill',
  'Brad',
  'Bradley',
  'Brenda',
  'Brian',
  'Charles',
  'Charles',
  'Chengjiang',
  'Chet',
  'Christopher',
  'Claudine',
  'Cory',
  'Curtis',
  'Dan',
  'Daniel',
  'David',
  'Deborah',
  'Deepak',
  'Dhanannjay',
  'Doruk',
  'Dzenan',
  'Eran',
  'Eric',
  'Francois',
  'Heather',
  'Hyun Jae',
  'Jacob',
  'Jake',
  'Jamie',
  'Janet',
  'Jared',
  'Jason',
  'Javier',
  'Jean-Christophe',
  'Jeffrey',
  'Johan',
  'John',
  'Jonathan',
  'Joseph',
  'Katherine',
  'Kathleen',
  'Keith',
  'Kenneth',
  'Kerri',
  'Kevin',
  'Linus',
  'Lisa',
  'Lucas',
  'Marcus',
  'Matt',
  'Matthew',
  'Max',
  'Meredith',
  'Michael',
  'Michelle',
  'Omar',
  'Patrick',
  'Paul',
  'Reid',
  'Robert',
  'Roddy',
  'Ronald',
  'Roni',
  'Russell',
  'Sandy',
  'Sankhesh',
  'Scott',
  'Sebastien',
  'Shawn',
  'Stephen',
  'Sujin',
  'Sumedha',
  'Tami',
  'Theresa',
  'Thomas Joseph',
  'Timothy (Tim)',
  'Tristan',
  'Veronica (Vicki)',
  'William (Will)',
  'Yumin',
  'Yvette',
  'Zach',
  'Zachary',
  'Zhaohui',
];

let optionIdx = 0;
const priorityOptions = [
  ['colors'],
  ['shapes'],
  ['shapes', 'colors'],
  ['colors', 'shapes'],
  [],
];

const legend = LegendHelper.newInstance({ legendEntries });
const container = document.querySelector('.content');
//

function next() {
  optionIdx = (optionIdx + 1) % priorityOptions.length;
  legend.assignLegend(priorityOptions[optionIdx]);
  ReactDOM.render(
    <ul>
      <li>{priorityOptions[optionIdx].join(', ')}</li>
      {legendEntries.map((name, idx) =>
        <li key={idx}>
          <SvgIconWidget
            icon={legend.getLegend(name).shape}
            width="20px"
            height="20px"
            style={{ fill: legend.getLegend(name).color }}
          />
          {name}
        </li>)}
    </ul>,
  container);
}

setInterval(next, 5000);
next();

document.body.style.margin = '10px';
