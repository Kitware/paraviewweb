import ButtonSelector from './index';
import expect from 'expect';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react/lib/ReactTestUtils';

describe('ButtonSelector', function() {
  afterEach(function(done) {
    ReactDOM.unmountComponentAtNode(document.body);
    document.body.innerHTML = '';
    setTimeout(done);
  });

  it('lists buttons given an array of objects', function() {
    var options = [
        { name: 'Choice A' },
        { name: 'Choice B' },
        { name: 'Choice C' },
      ],
      el = TestUtils.renderIntoDocument(<ButtonSelector list={options} />),
      buttons = TestUtils.scryRenderedDOMComponentsWithTag(el, 'button');

    expect(buttons.length).toBe(options.length);
    expect(buttons[0].name).toBe(options[0].name);
  });

  it('lists buttons given an array of objects', function() {
    var changling = 0,
      countOut = -1,
      arrayOut = [],
      options = [
        { name: 'Choice A' },
        { name: 'Choice B' },
        { name: 'Choice C' },
      ],
      el = TestUtils.renderIntoDocument(
        <ButtonSelector
          list={options}
          onChange={(count, array) => {
            changling += 1;
            countOut = count;
            arrayOut = array;
          }}
        />
      ),
      buttons = TestUtils.scryRenderedDOMComponentsWithTag(el, 'button');

    TestUtils.Simulate.click(buttons[0]);
    expect(changling).toEqual(1);
    expect(countOut).toEqual(0);
    expect(arrayOut).toEqual(options);
  });
});
