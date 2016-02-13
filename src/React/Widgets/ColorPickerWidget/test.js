import ColorPicker  from './index';
import expect       from 'expect';
import React        from 'react';
import ReactDOM     from 'react-dom';
import TestUtils    from 'react/lib/ReactTestUtils';

describe('ColorPicker', function() {

    afterEach(function(done) {
        ReactDOM.unmountComponentAtNode(document.body);
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('has an initial start color', function() {
        var startColor = [20,40,80],
            el = TestUtils.renderIntoDocument(<ColorPicker color={startColor}/>);

        expect(el.state.color).toEqual(startColor);
    });

    it('changes color state when an input changes', function() {
        var startColor = [20,40,80],
            el = TestUtils.renderIntoDocument(<ColorPicker color={startColor}/>),
            inputs = TestUtils.scryRenderedDOMComponentsWithTag(el, 'input'),
            newVal = 255;

        TestUtils.Simulate.change(inputs[0], {target: {value: newVal, dataset: {colorIdx: 0}}});
        expect(el.state.color).toEqual([255,40,80]);
    });

    it('can change color with a function', function() {
        var startColor = [20,40,80],
            newColor = [255,255,255],
            el = TestUtils.renderIntoDocument(<ColorPicker color={startColor}/>);

        el.updateColor(newColor);
        expect(el.state.originalColor).toEqual(newColor);
    });

    // detatched dom, img has no height and cannot be clicked on.
    // it('changes color when you click on the image', function() {
    //     var startColor = [0,0,0],
    //         el = TestUtils.renderIntoDocument(<ColorPicker color={startColor}/>);

    //     TestUtils.Simulate.click(el.refs.swatch, {pageX: 100, pageY: 100});
    //     expect(el.state.color).toEqual([54,63,251]);
    // });
});