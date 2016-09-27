import 'babel-polyfill';
import React            from 'react';
import ReactDOM         from 'react-dom';
import GitTreeWidget    from '..';

const nodes = [
  { name: 'another branch',          visible: true,  id: '40',  parent: '1'     },
  { name: 'child of branch',         visible: false, id: '50',  parent: '40'    },
  { name: 'branch of branch',        visible: true,  id: '51',  parent: '40'    },
  { name: 'actually the final node', visible: true,  id: '30',  parent: '20'    },
  { name: 'other node',              visible: true,  id:'1',    parent: '199'   },
  { name: 'top node',                visible: false, id: '199', parent: '0'     },
  { name: 'branched node',           visible: false, id: '10',  parent: '1'     },
  { name: 'branched node child',     visible: false, id: '11',  parent: '10'    },
  { name: 'final node',              visible: true,  id: '20',  parent: '1'     },
];

function onChange(event) {
    console.log(event);
}

ReactDOM.render(
    <GitTreeWidget
        nodes={nodes}
        onChange={onChange}
        multiselect
        enableDelete/>,
    document.querySelector('.content')
);
