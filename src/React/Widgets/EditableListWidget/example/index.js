// Load CSS
import 'normalize.css';
import 'font-awesome/css/font-awesome.css';

import React from 'react';
import ReactDOM from 'react-dom';

import EditableListWidget from '..';

const container = document.querySelector('.content');

const columns = [
  {
    key: 'name',
    dataKey: 'name',
    label: 'Name',
    // className: 'fancyNameClass',
    render: (name) => <span style={{ fontStyle: 'italic' }}>{name}</span>,
  },
  {
    key: 'age',
    dataKey: 'age',
    label: 'Age',
  },
  {
    key: 'gender',
    dataKey: 'gender',
    label: 'Gender',
  },
];

const data = [
  {
    name: 'Wayne',
    age: 28,
    gender: 'male',
  },
  {
    name: 'Deborah',
    age: 45,
    gender: 'female',
  },
  {
    name: 'Nicole',
    age: 22,
    gender: 'female',
  },
  {
    name: 'Carlos',
    age: 31,
    gender: 'male',
  },
];

class Example extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      data,
    };

    this.onAdd = this.onAdd.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onSortChange = this.onSortChange.bind(this);
  }

  onAdd(idx) {
    const newData = this.state.data.slice();
    newData.splice(idx, 0, {
      name: 'New Name',
      age: '0',
      gender: 'something',
    });
    this.setState({ data: newData });
  }

  onDelete(key) {
    const newData = this.state.data.slice();
    newData.splice(key, 1);
    this.setState({ data: newData });
  }

  onSortChange(src, dst) {
    const newData = this.state.data.slice();
    newData.splice(dst, 0, ...newData.splice(src, 1));
    this.setState({ data: newData });
  }

  render() {
    const keyedData = this.state.data.map((item, idx) =>
      Object.assign({ key: idx }, item)
    );

    return (
      <EditableListWidget
        sortable
        columns={columns}
        data={keyedData}
        onAdd={this.onAdd}
        onDelete={this.onDelete}
        onSortChange={this.onSortChange}
      />
    );
  }
}

ReactDOM.render(<Example />, container);

document.body.style.margin = '10px';
