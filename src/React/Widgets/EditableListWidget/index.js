import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/EditableListWidget.mcss';

function clamp(min, max, value) {
  return Math.min(max, Math.max(min, value));
}

class EditableList extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      dragTargetKey: null,
      dragOffset: 0,
      initialMouseY: 0,
      initialTargetY: 0,
      initialIndex: 0,
      sortIndex: 0,
    };

    this.container = null;
    this.dragTargetEl = null;

    this.getWindow = this.getWindow.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragMove = this.onDragMove.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
  }

  onDragStart(ev, itemKey) {
    // gets the drag handle's containing row div
    let target = ev.target;
    while (!target.getAttribute('draggrip')) {
      target = target.parentNode;
    }
    target = target.parentNode;

    const itemIndex = this.props.data.findIndex((item) => item.key === itemKey);

    const targetRect = target.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();

    const window = this.getWindow();
    window.addEventListener('mousemove', this.onDragMove);
    window.addEventListener('mouseup', this.onDragEnd);

    this.dragTargetEl = target;

    this.setState({
      dragTargetKey: itemKey,
      dragOffset: 0,
      // only lock to Y axis
      initialMouseY: ev.pageY,
      initialTargetY: targetRect.top - containerRect.top,
      initialIndex: itemIndex,
      sortIndex: itemIndex,
    });

    ev.stopPropagation();
    ev.preventDefault();
  }

  onDragMove(ev) {
    const containerRect = this.container.getBoundingClientRect();
    const clampedMouseY = clamp(
      containerRect.top,
      containerRect.bottom,
      ev.pageY
    );

    // ignore currently dragging node
    const siblings = Array.from(this.dragTargetEl.parentNode.childNodes).filter(
      (node) => node !== this.dragTargetEl
    );

    let newIndex = -1;
    for (let i = 0; i < siblings.length; ++i) {
      const { top: siblingTop, bottom: siblingBottom } = siblings[
        i
      ].getBoundingClientRect();

      if (clampedMouseY >= siblingTop && clampedMouseY <= siblingBottom) {
        newIndex = i;
      }
    }

    const targetHeight = this.dragTargetEl.offsetHeight;
    const newDragOffset = clamp(
      -this.state.initialTargetY,
      containerRect.height - this.state.initialTargetY - targetHeight,
      ev.pageY - this.state.initialMouseY
    );

    this.setState({
      dragOffset: newDragOffset,
      sortIndex: newIndex,
    });

    ev.stopPropagation();
    ev.preventDefault();
  }

  onDragEnd(ev) {
    window.removeEventListener('mousemove', this.onDragMove);
    window.removeEventListener('mouseup', this.onDragEnd);

    this.setState({ dragTargetKey: null });

    ev.stopPropagation();
    ev.preventDefault();

    this.props.onSortChange(this.state.initialIndex, this.state.sortIndex);
  }

  getWindow() {
    const doc = (this.container || {}).ownerDocument || document;
    return doc.defaultView || window;
  }

  render() {
    const rows = this.props.data.map((item) => {
      const cells = this.props.columns.map((column) => {
        const value = item[column.dataKey];
        const content = column.render ? column.render(value, item) : value;
        const cellKey = `${column.key}::${item.key}`;
        const classes = [style.column];
        Array.prototype.push.apply(classes, column.classNames);

        return (
          <div key={cellKey} className={classes.join(' ')}>
            <div className={style.columnVerticalWrapper}>
              {column.label ? (
                <span className={style.colname}>{column.label}:</span>
              ) : null}
              <span className={style.colcontent}>{content}</span>
            </div>
          </div>
        );
      });

      const rowClasses = [style.row];
      const rowStyles = {};

      if (this.state.dragTargetKey === item.key) {
        rowClasses.push(style.dragging);
        Object.assign(rowStyles, {
          top: `${this.state.initialTargetY + this.state.dragOffset}px`,
        });
      }

      return (
        <div key={item.key} className={rowClasses.join(' ')} style={rowStyles}>
          {this.props.sortable ? (
            <div
              draggrip="true"
              className={style.dragGrip}
              onMouseDown={(ev) => this.onDragStart(ev, item.key)}
            >
              <svg
                className={style.icon}
                width="14"
                height="13"
                viewBox="0 0 14 13"
              >
                <path d="M0 1L14 1L14 4L0 4L0 1Z" />
                <path d="M14 5.45L0 5.45L0 8.45L14 8.45L14 5.45Z" />
                <path d="M14 10L0 10L0 13L14 13L14 10Z" />
              </svg>
            </div>
          ) : null}
          <div className={style.rowContent}>{cells}</div>
          <div className={style.remove}>
            <button
              className={style.icon}
              onClick={() => this.props.onDelete(item.key)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M13.3 0L16 2.71L2.71 16L0 13.3L13.3 0Z" />
                <path d="M16 13.3L13.29 16L0 2.71L2.71 0L16 13.3Z" />
              </svg>
            </button>
          </div>
        </div>
      );
    });

    if (Number.isInteger(this.state.dragTargetKey)) {
      let insertIndex = this.state.sortIndex;
      if (insertIndex > this.state.initialIndex) {
        // +1 so the placeholder index skips the drag target.
        insertIndex += 1;
      }
      rows.splice(
        insertIndex,
        0,
        <div
          key="item-placeholder"
          className={style.placeholder}
          style={{
            width: `${this.dragTargetEl.offsetWidth}px`,
            height: `${this.dragTargetEl.offsetHeight}px`,
          }}
        />
      );
    }

    return (
      <div>
        <div
          className={style.list}
          ref={(r) => {
            this.container = r;
          }}
        >
          {rows}
        </div>
        <div className={style.row}>
          <button
            className={style.addButton}
            onClick={() => this.props.onAdd(rows.length)}
          >
            {this.props.addLabel}
          </button>
        </div>
      </div>
    );
  }
}

EditableList.propTypes = {
  columns: PropTypes.array,
  data: PropTypes.array,
  sortable: PropTypes.bool,
  onAdd: PropTypes.func,
  onDelete: PropTypes.func,
  onSortChange: PropTypes.func,
  addLabel: PropTypes.string,
};

EditableList.defaultProps = {
  columns: [],
  data: [],
  sortable: false,
  onAdd: () => {},
  onDelete: () => {},
  onSortChange: () => {},
  addLabel: 'Add new item',
};

export default EditableList;
