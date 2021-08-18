import CollapsibleElement from './index';
import expect from 'expect';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react/lib/ReactTestUtils';

class TestCollapsibleElement extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
    };

    // Bind callback
    this.updateVal = this.updateVal.bind(this);
  }

  updateVal(newOpenVal) {
    this.setState({ open: newOpenVal });
  }

  render() {
    return (
      <CollapsibleElement open={this.state.open} onChange={this.updateVal} />
    );
  }
}

describe('CollapsibleElement', function () {
  afterEach(function (done) {
    ReactDOM.unmountComponentAtNode(document.body);
    document.body.innerHTML = '';
    setTimeout(done);
  });

  it('can be hidden completely', function () {
    var el = TestUtils.renderIntoDocument(
        <CollapsibleElement visible={false} />
      ),
      container = TestUtils.findRenderedDOMComponentWithClass(
        el,
        'CollapsibleElement'
      );
    expect(container.style.display).toEqual('none');
  });

  it('can be collapsed and expanded by clicking the header', function () {
    var el = TestUtils.renderIntoDocument(
        <CollapsibleElement>
          <strong>Some Content</strong>
        </CollapsibleElement>
      ),
      header = TestUtils.findRenderedDOMComponentWithClass(
        el,
        'clickable-area'
      );

    //close
    TestUtils.Simulate.click(header);
    expect(el.state.open).toEqual(false);
    expect(el.isCollapsed()).toEqual(true);

    //open
    TestUtils.Simulate.click(header);
    expect(el.state.open).toEqual(true);
    expect(el.isExpanded()).toEqual(true);
  });

  it('can take an onChange listener', function () {
    var el = TestUtils.renderIntoDocument(<TestCollapsibleElement />);
    var header = TestUtils.findRenderedDOMComponentWithClass(
      el,
      'clickable-area'
    );

    TestUtils.Simulate.click(header);
    expect(el.state.open).toEqual(true);
  });
});
