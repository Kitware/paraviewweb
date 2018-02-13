import React from 'react';
import PropTypes from 'prop-types';

import style from 'PVWStyle/ReactWidgets/GitTreeWidget.mcss';

import SizeHelper from '../../../Common/Misc/SizeHelper';

function sortById(a, b) {
  return Number(a.id) < Number(b.id);
}

function generateModel(list, rootId) {
  const model = {
    // Temporary structures
    tree: { [rootId]: [] },
    map: {},
    leaves: [],

    // Helper variables
    rootId,
    y: 0,

    // Results
    nodes: [],
    forks: [],
    branches: [],
    actives: [],
  };

  list.forEach((el) => {
    // Make sure we don't share the same reference
    // with the outside world.
    const node = Object.assign({}, el);

    // Register node as a child of its parent
    if (!{}.hasOwnProperty.call(model.tree, node.parent)) {
      model.tree[node.parent] = [node];
    } else {
      model.tree[node.parent].push(node);
    }

    // Register node to easily find it later by its 'id'
    model.map[node.id] = node;
  });

  // Sort the children of the root
  model.tree[rootId].sort(sortById);

  // All set for the processing
  return model;
}

function assignNodePosition(model, node, x) {
  // Get children if any
  const children = model.tree[node.id];

  // Expand node with position information
  node.x = x;
  node.y = model.y;
  model.y += 1;

  // Register node in the list
  model.nodes.push(node);

  // Process children
  if (!children || children.length === 0) {
    // This node is a leaf, keep track of it for future processing
    model.leaves.push(node);
  } else {
    // Garanty unique branching order logic
    children.sort(sortById);

    // Move down the tree with the most right side of the tree
    children.forEach((child, index) => {
      assignNodePosition(model, child, x + children.length - (index + 1));
    });
  }
}

function extractBranchesAndForks(model, leaf) {
  const { x, y } = leaf;
  const { rootId, map, branches, forks } = model;
  const branch = { x, y };
  let currentNode = leaf;

  // Move currentNode to the top before fork while stretching the branch
  while (
    currentNode.parent !== rootId &&
    map[currentNode.parent].x === branch.x
  ) {
    currentNode = map[currentNode.parent];
    branch.to = currentNode.y;
  }

  // Do we really have a new branch?
  if (typeof branch.to !== 'undefined' && branch.to !== branch.y) {
    branches.push(branch);
  }

  // Do we have a fork?
  if (currentNode.parent !== rootId) {
    forks.push({
      x: map[currentNode.parent].x,
      y: map[currentNode.parent].y,
      toX: currentNode.x,
      toY: currentNode.y,
    });
  }
}

function fillActives(model, activeIds = []) {
  const { nodes, actives } = model;

  // Fill the actives list with the position instead of ids
  nodes.forEach((node) => {
    if (activeIds.indexOf(node.id) !== -1) {
      actives.push(node.y);
    }
  });
}

export default class GitTreeWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      actives: [],
      nodes: [],
      branches: [],
      forks: [],
    };

    // Bind callback
    this.processData = this.processData.bind(this);
    this.toggleActive = this.toggleActive.bind(this);
    this.toggleVisibility = this.toggleVisibility.bind(this);
    this.deleteNode = this.deleteNode.bind(this);
    // this.renderNodes = this.renderNodes.bind(this);
    // this.renderBranches = this.renderBranches.bind(this);
    // this.renderActives = this.renderActives.bind(this);
    // this.renderDeleteActions = this.renderDeleteActions.bind(this);
  }

  componentWillMount() {
    this.processData(this.props.nodes, this.props.actives);
  }

  componentWillReceiveProps(nextProps) {
    this.processData(nextProps.nodes, nextProps.actives);
  }

  processData(list, activeIds = []) {
    const model = generateModel(list, this.props.rootId);
    const { tree, leaves, rootId } = model;
    const { nodes, branches, forks, actives } = model;

    // Assign each node position starting from the root
    tree[rootId].forEach((rootNode) => assignNodePosition(model, rootNode, 0));

    // Update active list
    fillActives(model, activeIds);

    // Create branches and forks starting from the leaves
    leaves.forEach((leaf) => extractBranchesAndForks(model, leaf));

    // Sort forks for better rendering
    forks.sort((a, b) => a.toX > b.toX);

    // Save computed structure to state
    this.setState({ nodes, branches, forks, actives, leaves });
  }

  toggleActive(event) {
    const { actives, nodes } = this.state;

    if (
      event.target.nodeName !== 'circle' &&
      !event.target.classList.contains(style.iconText)
    ) {
      const size = SizeHelper.getSize(this.rootContainer);
      const { deltaY } = this.props;
      // Firefox vs Chrome/Safari// Firefox vs Chrome/Safari
      const originTop = size.clientRect.y || size.clientRect.top;
      const yVal = Math.floor((event.clientY - originTop) / deltaY);
      const index = actives.indexOf(yVal);

      // command key for osx, control key for windows
      if (this.props.multiselect && (event.metaKey || event.ctrlKey)) {
        if (index === -1) {
          actives.push(yVal);
        } else {
          actives.splice(index, 1);
        }
        this.setState({ actives });
      } else {
        actives[0] = yVal;
        this.setState({ actives });
      }

      if (this.props.onChange) {
        const changeSet = [];
        const active = true;

        actives.forEach((idx) => {
          const { id, parent, name, visible } = nodes[idx];
          const userData = nodes[idx].userData
            ? { userData: nodes[idx].userData }
            : null;
          changeSet.push(
            Object.assign({ id, parent, name, visible, active }, userData)
          );
        });

        this.props.onChange({ type: 'active', changeSet });
      }
    }
  }

  toggleVisibility(event) {
    const yVal = parseInt(event.currentTarget.attributes['data-id'].value, 10);
    const { actives, nodes } = this.state;
    const node = nodes[yVal];

    node.visible = !node.visible;
    this.setState({ nodes });

    if (this.props.onChange) {
      const { id, parent, name, visible } = node;
      const active = actives.indexOf(yVal) !== -1;
      const userData = node.userData ? { userData: node.userData } : null;
      const changeSet = [
        Object.assign({ id, parent, name, visible, active }, userData),
      ];

      this.props.onChange({ type: 'visibility', changeSet });
    }
  }

  deleteNode(event) {
    if (this.props.onChange) {
      const yVal = parseInt(
        event.currentTarget.attributes['data-id'].value,
        10
      );
      const { id, parent, name, visible } = this.state.nodes[yVal];
      const userData = this.state.nodes[yVal].userData
        ? { userData: this.state.nodes[yVal].userData }
        : null;
      const changeSet = [
        Object.assign({ id, parent, name, visible }, userData),
      ];

      this.props.onChange({ type: 'delete', changeSet });
    }
  }

  renderNodes() {
    return this.state.nodes.map((el, index) => {
      const {
        activeCircleStrokeColor,
        deltaX,
        deltaY,
        fontSize,
        notVisibleCircleFillColor,
        offset,
        palette,
        radius,
        stroke,
        textColor,
        textWeight,
      } = this.props;
      const isActive = this.state.actives.includes(index);
      const isVisible = !!el.visible;
      const branchColor = palette[el.x % palette.length];

      // Styles
      const currentTextColor = textColor[isActive ? 1 : 0];
      const weight = textWeight[isActive ? 1 : 0];
      const strokeColor = isActive
        ? activeCircleStrokeColor
        : branchColor || branchColor;
      const fillColor = isVisible
        ? branchColor
        : notVisibleCircleFillColor || branchColor;

      // Positions
      const cx = deltaX * el.x + offset;
      const cy = deltaY * el.y + deltaY / 2;
      const tx = cx + radius * 2;
      const ty = cy + (radius - 1);

      return (
        <g key={`node-${index}`} className={style.cursor}>
          <circle
            data-id={el.y}
            cx={cx}
            cy={cy}
            r={radius}
            stroke={strokeColor}
            strokeWidth={stroke}
            fill={fillColor}
            onClick={this.toggleVisibility}
          />
          <text
            className={style.regularText}
            data-id={el.y}
            x={tx}
            y={ty}
            fill={currentTextColor}
            fontWeight={weight}
            fontSize={fontSize}
          >
            {el.name}
          </text>
        </g>
      );
    });
  }

  renderBranches() {
    const { deltaX, deltaY, offset, palette, stroke } = this.props;

    return this.state.branches.map((el, index) => {
      const x1 = deltaX * el.x + offset;
      const y1 = deltaY * el.y + deltaY / 2;
      const y2 = deltaY * el.to + deltaY / 2;
      const strokeColor = palette[el.x % palette.length];

      return (
        <path
          key={`branch-${index}`}
          d={`M${x1},${y1} L${x1},${y2}`}
          stroke={strokeColor}
          strokeWidth={stroke}
        />
      );
    });
  }

  renderForks() {
    const { deltaX, deltaY, offset, palette, radius, stroke } = this.props;

    return this.state.forks.map((el, index) => {
      const x1 = deltaX * el.x + offset;
      const y1 = deltaY * el.y + deltaY / 2 + radius;
      const x2 = deltaX * el.toX + offset;
      const y2 = deltaY * el.toY + deltaY / 2 + radius;
      const strokeColor = palette[el.toX % palette.length];
      const dPath =
        `M${x1},${y1} ` +
        `Q${x1},${y1 + deltaY / 3},${(x1 + x2) / 2},${y1 + deltaY / 3} ` +
        `T${x2},${y1 + deltaY} L${x2},${y2}`;

      return (
        <path
          key={`fork-${index}`}
          d={dPath}
          stroke={strokeColor}
          strokeWidth={stroke}
          fill="transparent"
        />
      );
    });
  }

  renderActives() {
    const { margin, deltaY } = this.props;

    return this.state.actives.map((el, index) => (
      <rect
        key={`active-${index}`}
        data-id={this.state.nodes[el].y}
        x="-50"
        width="1000"
        fill="#999"
        y={el * deltaY + margin / 2}
        height={deltaY - margin}
      />
    ));
  }

  renderDeleteActions() {
    if (!this.props.enableDelete) {
      return null;
    }

    const { deltaY, width, offset, textColor, radius } = this.props;

    return this.state.leaves.map((node, idx) => {
      const isActive = this.state.actives.includes(node.y);
      const currentTextColor = textColor[isActive ? 1 : 0];

      return (
        <text
          key={`delete-${idx}`}
          className={style.iconText}
          onClick={this.deleteNode}
          data-id={node.y}
          x={Number(width) - offset - 10}
          y={deltaY * node.y + deltaY / 2 + (radius - 1)}
          fill={currentTextColor}
        >
          &#xf014;
        </text>
      );
    });
  }

  render() {
    return (
      <svg
        ref={(c) => {
          this.rootContainer = c;
        }}
        style={this.props.style}
        width={this.props.width}
        height={`${this.props.deltaY * this.state.nodes.length}px`}
        onClick={this.toggleActive}
      >
        {this.renderActives()}
        {this.renderBranches()}
        {this.renderForks()}
        {this.renderNodes()}
        {this.renderDeleteActions()}
      </svg>
    );
  }
}

GitTreeWidget.propTypes = {
  activeCircleStrokeColor: PropTypes.string,
  actives: PropTypes.array,
  deltaX: PropTypes.number,
  deltaY: PropTypes.number,
  enableDelete: PropTypes.bool,
  fontSize: PropTypes.number,
  margin: PropTypes.number,
  multiselect: PropTypes.bool,
  nodes: PropTypes.array,
  notVisibleCircleFillColor: PropTypes.string,
  offset: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  palette: PropTypes.array,
  radius: PropTypes.number,
  rootId: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.instanceOf(null), // this could have some problematic effect
  ]),
  stroke: PropTypes.number,
  style: PropTypes.object,
  textColor: PropTypes.array,
  textWeight: PropTypes.array,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

GitTreeWidget.defaultProps = {
  nodes: [],
  actives: [],
  style: {},

  enableDelete: false,
  deltaX: 20,
  deltaY: 30,
  fontSize: 16,
  margin: 3,
  multiselect: false,
  offset: 15,
  palette: ['#e1002a', '#417dc0', '#1d9a57', '#e9bc2f', '#9b3880'],
  radius: 6,
  rootId: '0',
  stroke: 3,
  width: 500,
  activeCircleStrokeColor: 'black', // if 'null', the branch color will be used
  notVisibleCircleFillColor: 'white', // if 'null', the branch color will be used
  textColor: ['black', 'white'], // Normal, Active
  textWeight: ['normal', 'bold'], // Normal, Active
};
