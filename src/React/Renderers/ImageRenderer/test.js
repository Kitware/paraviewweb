import React from 'react';
import ImageRenderer from '../../../react/renderer/Image';
import expect from 'expect';
import TestUtils from 'react/lib/ReactTestUtils';

const container = document.createElement('body');

describe('ImageRenderer', function () {
  var el;
  beforeAll(function () {
    el = TestUtils.renderIntoDocument(
      React.createElement(ImageRenderer, {}),
      container
    );

    el.renderImage({
      url:
        'http://www.paraview.org/wp-content/uploads/2015/03/LANL_ClimateExample.jpg',
    });
  });

  it('renders on a page', function () {
    expect(el).toExist();
  });

  it('has a dialog', function () {
    var dialog = TestUtils.findRenderedDOMComponentWithClass(
      el,
      'UpdateDialog'
    );
    expect(dialog).toExist();

    var contents = TestUtils.scryRenderedDOMComponentsWithClass(
      el,
      'ContentEditable'
    );
    expect(contents.length).toEqual(2);
    expect(contents[0].innerHTML).toBe('No title');
    expect(contents[1].innerHTML).toBe('No description');
  });

  it('can zoom on an image', function () {
    expect(el.zoom).toEqual(1); //sanity

    el.mouseHandler.emit('zoom', {
      scale: 2,
      relative: { x: 100, y: 100 },
    });
    expect(el.zoom).toEqual(2);

    // var evt = new KeyboardEvent('keydown', {keyCode: 82});
    // document.dispatchEvent(evt);
    // expect(el.zoom).toEqual(1);
  });
});
