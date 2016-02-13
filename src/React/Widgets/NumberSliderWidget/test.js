import expect              from 'expect';
import NumberSliderControl from './index';
import React               from 'react';
import ReactDOM            from 'react-dom';
import TestUtils           from 'react/lib/ReactTestUtils';

describe('NumberSliderControl', function() {
    afterEach(function(done) {
        ReactDOM.unmountComponentAtNode(document.body);
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('has two inputs whose values are equal', function() {
        var el = TestUtils.renderIntoDocument(<NumberSliderControl min={20} value={25} max={30}/>),
            inputs = TestUtils.scryRenderedDOMComponentsWithTag(el, 'input');
        expect(inputs.length).toBe(2);
        expect(inputs[0].value).toBe(inputs[1].value);
    });
    it('takes an external value and a value can be read with the same function', function() {
         var el = TestUtils.renderIntoDocument(<NumberSliderControl />),
            newVal = 75;

        el.value(newVal);
        expect(el.value()).toEqual(newVal);
    });
    it('clamps a value if a given value is too big', function() {
        var el = TestUtils.renderIntoDocument(<NumberSliderControl />),
            newVal = 250,
            expectedVal = 100;

        el.value(newVal);
        expect(el.value()).toEqual(expectedVal);
    });
    it('keeps the values of two inputs the same', function() {

        var oldName = 'razzmatazz',
            newName = 'pogo',
            Mock = React.createClass({
                getInitialState() {
                    return {val: 25, name: 'razzmatazz'};
                },
                updateVal(e) {
                    this.setState({val: e.target.value, name: e.target.name});
                },
                render() {
                    return (<NumberSliderControl name={newName}
                        min={20} max={30}
                        value={this.state.val}
                        onChange={this.updateVal}/>);
                }
            });

        var el = TestUtils.renderIntoDocument(<Mock/>),
            newVal = '28',
            inputSlider = ReactDOM.findDOMNode(el).querySelector('input[type=range]'),
            inputField  = ReactDOM.findDOMNode(el).querySelector('input[type=number]');

        expect(el.state.val).toEqual(25); //sanity
        expect(el.state.name).toEqual(oldName); //sanity

        TestUtils.Simulate.change(inputSlider, {target: {value: newVal}});
        expect(el.state.val).toEqual(newVal);
        expect(el.state.name).toEqual(newName);
        expect(inputField.value).toEqual(newVal);
    });
});
