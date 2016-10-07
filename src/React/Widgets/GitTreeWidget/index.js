import React      from 'react';
import style      from 'PVWStyle/ReactWidgets/GitTreeWidget.mcss';
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
    var node = Object.assign({}, el);

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
  var children = model.tree[node.id];

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
      assignNodePosition(model, child, (x + children.length) - (index + 1));
    });
  }
}

function extractBranchesAndForks(model, leaf) {
  var { x, y } = leaf,
    { rootId, map, branches, forks } = model,
    branch = { x, y },
    currentNode = leaf;

  // Move currentNode to the top before fork while stretching the branch
  while (currentNode.parent !== rootId && map[currentNode.parent].x === branch.x) {
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

export default React.createClass({
  displayName: 'GitTreeWidget',

  propTypes: {
    activeCircleStrokeColor: React.PropTypes.string,
    actives: React.PropTypes.array,
    deltaX: React.PropTypes.number,
    deltaY: React.PropTypes.number,
    enableDelete: React.PropTypes.bool,
    fontSize: React.PropTypes.number,
    margin: React.PropTypes.number,
    multiselect: React.PropTypes.bool,
    nodes: React.PropTypes.array,
    notVisibleCircleFillColor: React.PropTypes.string,
    offset: React.PropTypes.number,
    onChange: React.PropTypes.func,
    palette: React.PropTypes.array,
    radius: React.PropTypes.number,
    rootId: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
      React.PropTypes.instanceOf(null), // this could have some problematic effect
    ]),
    stroke: React.PropTypes.number,
    style: React.PropTypes.object,
    textColor: React.PropTypes.array,
    textWeight: React.PropTypes.array,
    width: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
    ]),
  },

  getDefaultProps() {
    return {
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
  },

  getInitialState() {
    return {
      actives: [],
      nodes: [],
      branches: [],
      forks: [],
    };
  },

  componentWillMount() {
    this.processData(this.props.nodes, this.props.actives);
  },

  componentWillReceiveProps(nextProps) {
    this.processData(nextProps.nodes, nextProps.actives);
  },

  processData(list, activeIds = []) {
    var model = generateModel(list, this.props.rootId),
      { tree, leaves, rootId } = model,
      { nodes, branches, forks, actives } = model;

    // Assign each node position starting from the root
    tree[rootId].forEach(rootNode => assignNodePosition(model, rootNode, 0));

    // Update active list
    fillActives(model, activeIds);

    // Create branches and forks starting from the leaves
    leaves.forEach(leaf => extractBranchesAndForks(model, leaf));

    // Sort forks for better rendering
    forks.sort((a, b) => a.toX > b.toX);

    // Save computed structure to state
    this.setState({ nodes, branches, forks, actives, leaves });
  },

  toggleActive(event) {
    var { actives, nodes } = this.state;

    if (event.target.nodeName !== 'circle' && !event.target.classList.contains(style.iconText)) {
      const size = SizeHelper.getSize(this.rootContainer),
        { deltaY } = this.props,
        // Firefox vs Chrome/Safari// Firefox vs Chrome/Safari
        originTop = size.clientRect.y || size.clientRect.top,
        yVal = Math.floor((event.clientY - originTop) / deltaY),
        index = actives.indexOf(yVal);

      // command key for osx, control key for windows
      if (this.props.multiselect && (event.metaKey || event.ctrlKey)) {
        if (index === -1) {
          actives.push(yVal);
        } else {
          actives.splice(index, 1);
        }
      } else {
        actives = [yVal];
      }
      this.setState({ actives });

      if (this.props.onChange) {
        const changeSet = [],
          active = true;

        actives.forEach((idx) => {
          const { id, parent, name, visible } = nodes[idx];
          changeSet.push({ id, parent, name, visible, active });
        });

        this.props.onChange({ type: 'active', changeSet });
      }
    }
  },

  toggleVisibility(event) {
    var yVal = parseInt(event.currentTarget.attributes['data-id'].value, 10),
      { actives, nodes } = this.state,
      node = nodes[yVal];

    node.visible = !node.visible;
    this.setState({ nodes });

    if (this.props.onChange) {
      const { id, parent, name, visible } = node,
        active = (actives.indexOf(yVal) !== -1),
        changeSet = [{ id, parent, name, visible, active }];

      this.props.onChange({ type: 'visibility', changeSet });
    }
  },

  deleteNode(event) {
    if (this.props.onChange) {
      const yVal = parseInt(event.currentTarget.attributes['data-id'].value, 10),
        { id, parent, name, visible } = this.state.nodes[yVal],
        changeSet = [{ id, parent, name, visible }];

      this.props.onChange({ type: 'delete', changeSet });
    }
  },

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
        } = this.props,
        isActive = this.state.actives.includes(index),
        isVisible = !!el.visible,
        branchColor = palette[el.x % palette.length];

      // Styles
      const currentTextColor = textColor[isActive ? 1 : 0];
      const weight = textWeight[isActive ? 1 : 0];
      const strokeColor = isActive ? activeCircleStrokeColor : branchColor || branchColor;
      const fillColor = isVisible ? branchColor : notVisibleCircleFillColor || branchColor;

      // Positions
      const cx = (deltaX * el.x) + offset,
        cy = (deltaY * el.y) + (deltaY / 2),
        tx = cx + (radius * 2),
        ty = cy + (radius - 1);

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
        </g>);
    });
  },

  renderBranches() {
    const { deltaX, deltaY, offset, palette, stroke } = this.props;

    return this.state.branches.map((el, index) => {
      const x1 = (deltaX * el.x) + offset,
        y1 = (deltaY * el.y) + (deltaY / 2),
        y2 = (deltaY * el.to) + (deltaY / 2),
        strokeColor = palette[el.x % palette.length];

      return (
        <path
          key={`branch-${index}`}
          d={`M${x1},${y1} L${x1},${y2}`}
          stroke={strokeColor}
          strokeWidth={stroke}
        />);
    });
  },

  renderForks() {
    const { deltaX, deltaY, offset, palette, radius, stroke } = this.props;

    return this.state.forks.map((el, index) => {
      const x1 = (deltaX * el.x) + offset,
        y1 = (deltaY * el.y) + (deltaY / 2) + radius,
        x2 = (deltaX * el.toX) + offset,
        y2 = (deltaY * el.toY) + (deltaY / 2) + radius,
        strokeColor = palette[(el.toX) % palette.length],
        dPath = `M${x1},${y1} `
              + `Q${x1},${y1 + (deltaY / 3)},${(x1 + x2) / 2},${y1 + (deltaY / 3)} `
              + `T${x2},${y1 + deltaY} L${x2},${y2}`;

      return (
        <path
          key={`fork-${index}`}
          d={dPath}
          stroke={strokeColor}
          strokeWidth={stroke}
          fill="transparent"
        />);
    });
  },

  renderActives() {
    const { margin, deltaY } = this.props;

    return this.state.actives.map((el, index) =>
      <rect
        key={`active-${index}`}
        data-id={this.state.nodes[el].y}
        x="-50"
        width="1000"
        fill="#999"
        y={(el * deltaY) + (margin / 2)}
        height={deltaY - margin}
      />
    );
  },

  renderDeleteActions() {
    if (!this.props.enableDelete) {
      return null;
    }

    const { deltaY, width, offset, textColor, radius } = this.props;

    return this.state.leaves.map((node, idx) => {
      const isActive = this.state.actives.includes(node.y),
        currentTextColor = textColor[isActive ? 1 : 0];

      return (
        <text
          key={`delete-${idx}`}
          className={style.iconText}
          onClick={this.deleteNode}
          data-id={node.y}
          x={Number(width) - offset - 10}
          y={(deltaY * node.y) + (deltaY / 2) + (radius - 1)}
          fill={currentTextColor}
        >&#xf014;
        </text>);
    });
  },

  render() {
    return (
      <svg
        ref={c => (this.rootContainer = c)}
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
      </svg>);
  },
});
