import CoordinateControl from './index';
import expect            from 'expect';
import React             from 'react';
import ReactDOM          from 'react-dom';
import TestUtils         from 'react/lib/ReactTestUtils';

describe('CoordinateControl', function() {
    afterEach(function(done) {
        ReactDOM.unmountComponentAtNode(document.body);
        document.body.innerHTML = '';
        setTimeout(done);
    });

    function convertToCoord(val, size) {
        return (val * 2 / (size * 2) - 0.5) * 2;
    }

    it('has two inputs and a canvas', function() {
        var el = TestUtils.renderIntoDocument(<CoordinateControl hideXY={false}/>),
            canvas = TestUtils.scryRenderedDOMComponentsWithTag(el, 'canvas'),
            inputs = TestUtils.scryRenderedDOMComponentsWithTag(el, 'input');
        expect(canvas.length).toBe(1);
        expect(inputs.length).toBe(2);
        expect(inputs[0].value).toBe(inputs[1].value);
    });
    it('can hide XY inputs', function() {
        var el = TestUtils.renderIntoDocument(<CoordinateControl hideXY={true}/>),
            inputsContainer = TestUtils.findRenderedDOMComponentWithClass(el, 'inputs');
        expect(inputsContainer.classList.contains('is-hidden')).toBe(true);
    });
    it('keeps coordinate state and XY inputs in sync', function() {
        var el = TestUtils.renderIntoDocument(<CoordinateControl/>),
            inputs = TestUtils.scryRenderedDOMComponentsWithTag(el, 'input'),
            newXVal = 0.60,
            newYVal = -0.45;
        TestUtils.Simulate.change(inputs[0], {target: {value: newXVal}});
        TestUtils.Simulate.change(inputs[1], {target: {value: newYVal}});

        expect(el.coordinates()).toEqual({x: newXVal, y: newYVal});
    });
    it('can update coordinates externally', function() {
        var el = TestUtils.renderIntoDocument(<CoordinateControl x={0.25} y={0.45}/>),
            newXVal = -0.25,
            newYVal = -0.45;

        el.updateCoordinates({x: newXVal, y: newYVal});
        expect(el.coordinates()).toEqual({x: newXVal, y: newYVal});
    });
    it('updates values when dragged', function() {
        var size = 400,
            el = TestUtils.renderIntoDocument(<CoordinateControl x={0.25} y={0.45} width={size} height={size}/>),
            canvas = TestUtils.findRenderedDOMComponentWithTag(el, 'canvas'),
            newXVal = 100,
            newYVal = 200;

        el.mouseHandler.emit('drag', {pointers: [
            {clientX: newXVal, clientY: newYVal}
        ]});
        expect(el.coordinates()).toEqual({x: convertToCoord(newXVal, size), y: -convertToCoord(newYVal, size)});
    });
    it('triggers a given onChange function', function() {
        var Mock = React.createClass({
            getInitialState() {
                return {x:0, y:0};
            },
            updateCoords(newVals) {
                this.setState({x:newVals.x, y:newVals.y});
            },
            render() {
                return (<CoordinateControl onChange={this.updateCoords}/>);
            }
        });
        var el = TestUtils.renderIntoDocument(<Mock/>),
            input = TestUtils.scryRenderedDOMComponentsWithTag(el, 'input')[0],
            newXVal = 0.88;

        TestUtils.Simulate.change(input, {target: {value: newXVal}});
        expect(el.state.x).toEqual(newXVal);
    });
    it('takes a click on the canvas and updates it to state', function() {
        var size = 400,
            el = TestUtils.renderIntoDocument(<CoordinateControl width={size} height={size}/>),
            canvas = TestUtils.findRenderedDOMComponentWithTag(el, 'canvas'),
            newXVal = 100,
            newYVal = 200;
        expect(canvas.width).toBe(size);
        expect(canvas.height).toBe(size);

        el.mouseHandler.emit('click', {pointers: [
            {clientX: newXVal, clientY: newYVal}
        ]});
        expect(el.state.x).toBe(convertToCoord(newXVal, size));
        expect(el.state.y).toBe(-convertToCoord(newYVal, size));

        newXVal = 350;
        newYVal = 120;
        el.mouseHandler.emit('click', {pointers: [
            {clientX: newXVal, clientY: newYVal}
        ]});
        expect(el.state.x).toBe(convertToCoord(newXVal, size));
        expect(el.state.y).toBe(-convertToCoord(newYVal, size));
    });
    it('destroys listeners when removed', function() {
        var el = TestUtils.renderIntoDocument(<CoordinateControl />);
        ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(el).parentNode);
        expect(el.mouseHandler.hammer.element).toNotExist();
    });
});