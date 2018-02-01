import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/FileBrowserWidget.mcss';

import ActionList from '../ActionListWidget';

export default class FileBrowserWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      list: [],
    };

    // Bind callback
    this.onPathChange = this.onPathChange.bind(this);
    this.onAction = this.onAction.bind(this);
  }

  componentDidMount() {
    this.processProps(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.processProps(nextProps);
  }

  onAction(name, action, data) {
    if (this.props.onAction) {
      this.props.onAction(
        action,
        name,
        data.length ? JSON.parse(atob(data)) : null
      );
    }
  }

  onPathChange(event) {
    let target = event.target;
    while (target.localName !== 'li') {
      target = target.parentNode;
    }
    if (this.props.onAction) {
      const path = [];
      const pathSize = Number(target.dataset.idx);
      while (path.length <= pathSize) {
        path.push(this.props.path[path.length]);
      }
      this.props.onAction('path', path.join('/'), path);
    }
  }

  processProps(props) {
    const list = [];
    props.directories.forEach((name) => {
      list.push({ name, icon: style.folderIcon, action: 'directory' });
    });
    props.groups.forEach((g) => {
      list.push({
        name: g.label,
        icon: style.groupIcon,
        action: 'group',
        data: btoa(JSON.stringify(g.files)),
      });
    });
    props.files.forEach((name) => {
      list.push({ name, icon: style.fileIcon, action: 'file' });
    });
    this.setState({ list });
  }

  render() {
    return (
      <div className={style.container}>
        <ul className={style.breadcrumb}>
          {this.props.path.map((name, idx) => (
            <li
              className={style.breadcrumbItem}
              key={idx}
              data-idx={idx}
              title={name}
              onClick={this.onPathChange}
            >
              <i className={style.breadcrumbFolderIcon} />
              <span className={style.breadcrumbLabel}>{name}</span>
            </li>
          ))}
        </ul>
        <ActionList list={this.state.list} onClick={this.onAction} />
      </div>
    );
  }
}

/* eslint-disable react/no-unused-prop-types */
FileBrowserWidget.propTypes = {
  directories: PropTypes.array.isRequired,
  files: PropTypes.array.isRequired,
  groups: PropTypes.array.isRequired,
  onAction: PropTypes.func.isRequired,
  path: PropTypes.array.isRequired,
};
/* eslint-enable react/no-unused-prop-types */
