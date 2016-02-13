import React        from 'react';
import InputCell    from './InputCell';
import style        from 'PVWStyle/ReactProperties/CellProperty.mcss';

function arrayFill(arr, expectedLength, filler='') {
    if (!arr) {
        return Array(expectedLength).fill(filler);
    }

    while (arr.length < expectedLength) {
        arr.push(filler);
    }
    return arr;
}

/* eslint-disable react/display-name */
/* eslint-disable react/no-multi-comp */
const layouts = {
    '1': (data, ui, callback) => {
        ui.componentLabels = arrayFill(ui.componentLabels, 1);
        data.value = arrayFill(data.value, 1, null);
        return (
            <tr className={ style.inputRow }>
                <InputCell idx={0} label={ui.componentLabels[0]} type={ui.type} value={data.value[0]} name={data.name} domain={ui.domain} onChange={callback}/>
            </tr>);
    },
    '2': (data, ui, callback) => {
        ui.componentLabels = arrayFill(ui.componentLabels, 2);
        data.value = arrayFill(data.value, 2, null);
        return (
            <tr className={ style.inputRow }>
                <InputCell idx={0} label={ui.componentLabels[0]} type={ui.type} value={data.value[0]} name={data.name} domain={ui.domain} onChange={callback}/>
                <InputCell idx={1} label={ui.componentLabels[1]} type={ui.type} value={data.value[1]} name={data.name} domain={ui.domain} onChange={callback}/>
            </tr>);
    },
    '3': (data, ui, callback) => {
        ui.componentLabels = arrayFill(ui.componentLabels, 3);
        data.value = arrayFill(data.value, 3, null);
        return (
            <tr className={ style.inputRow }>
                <InputCell idx={0} label={ui.componentLabels[0]} type={ui.type} value={data.value[0]} name={data.name} domain={ui.domain} onChange={callback}/>
                <InputCell idx={1} label={ui.componentLabels[1]} type={ui.type} value={data.value[1]} name={data.name} domain={ui.domain} onChange={callback}/>
                <InputCell idx={2} label={ui.componentLabels[2]} type={ui.type} value={data.value[2]} name={data.name} domain={ui.domain} onChange={callback}/>
            </tr>);
    },
    '2x3': (data, ui, callback) => {
        ui.componentLabels = arrayFill(ui.componentLabels, 6);
        data.value = arrayFill(data.value, 6, null);
        return ([
            <tr className={ style.inputRow } key={ data.id + '_0'}>
                <InputCell idx={0} label={ui.componentLabels[0]} type={ui.type} value={data.value[0]} name={data.name} domain={ui.domain} onChange={callback}/>
                <InputCell idx={1} label={ui.componentLabels[1]} type={ui.type} value={data.value[1]} name={data.name} domain={ui.domain} onChange={callback}/>
                <InputCell idx={2} label={ui.componentLabels[2]} type={ui.type} value={data.value[2]} name={data.name} domain={ui.domain} onChange={callback}/>
            </tr>,
            <tr className={ style.inputRow } key={ data.id + '_1'}>
                <InputCell idx={3} label={ui.componentLabels[3]} type={ui.type} value={data.value[3]} name={data.name} domain={ui.domain} onChange={callback}/>
                <InputCell idx={4} label={ui.componentLabels[4]} type={ui.type} value={data.value[4]} name={data.name} domain={ui.domain} onChange={callback}/>
                <InputCell idx={5} label={ui.componentLabels[5]} type={ui.type} value={data.value[5]} name={data.name} domain={ui.domain} onChange={callback}/>
            </tr>]);
        },
    '3x2': (data, ui, callback) => {
        ui.componentLabels = arrayFill(ui.componentLabels, 6);
        data.value = arrayFill(data.value, 6, null);
        return ([
            <tr className={ style.inputRow } key={ data.id + '_0'}>
                <InputCell idx={0} label={ui.componentLabels[0]} type={ui.type} value={data.value[0]} name={data.name} domain={ui.domain} onChange={callback}/>
                <InputCell idx={1} label={ui.componentLabels[1]} type={ui.type} value={data.value[1]} name={data.name} domain={ui.domain} onChange={callback}/>
            </tr>,
            <tr className={ style.inputRow } key={ data.id + '_1'}>
                <InputCell idx={2} label={ui.componentLabels[2]} type={ui.type} value={data.value[2]} name={data.name} domain={ui.domain} onChange={callback}/>
                <InputCell idx={3} label={ui.componentLabels[3]} type={ui.type} value={data.value[3]} name={data.name} domain={ui.domain} onChange={callback}/>
            </tr>,
            <tr className={ style.inputRow } key={ data.id + '_2'}>
                <InputCell idx={4} label={ui.componentLabels[4]} type={ui.type} value={data.value[4]} name={data.name} domain={ui.domain} onChange={callback}/>
                <InputCell idx={5} label={ui.componentLabels[5]} type={ui.type} value={data.value[5]} name={data.name} domain={ui.domain} onChange={callback}/>
            </tr>]);
    },
    'm6': (data, ui, callback) => {
        ui.componentLabels = arrayFill(ui.componentLabels, 6);
        data.value = arrayFill(data.value, 6, null);
        return ([
            <tr className={ style.inputRow } key={ data.id + '_0'}>
                <InputCell idx={0} label={ui.componentLabels[0]} type={ui.type} value={data.value[0]} name={data.name} domain={ui.domain} onChange={callback}/>
                <InputCell idx={1} label={ui.componentLabels[1]} type={ui.type} value={data.value[1]} name={data.name} domain={ui.domain} onChange={callback}/>
                <InputCell idx={2} label={ui.componentLabels[2]} type={ui.type} value={data.value[2]} name={data.name} domain={ui.domain} onChange={callback}/>
            </tr>,
            <tr className={ style.inputRow } key={ data.id + '_1'}>
                <td></td>
                <InputCell idx={3} label={ui.componentLabels[3]} type={ui.type} value={data.value[3]} name={data.name} domain={ui.domain} onChange={callback}/>
                <InputCell idx={4} label={ui.componentLabels[4]} type={ui.type} value={data.value[4]} name={data.name} domain={ui.domain} onChange={callback}/>
            </tr>,
            <tr className={ style.inputRow } key={ data.id + '_2'}>
                <td></td>
                <td></td>
                <InputCell idx={5} label={ui.componentLabels[5]} type={ui.type} value={data.value[5]} name={data.name} domain={ui.domain} onChange={callback}/>
            </tr>]);
    },
    'NO_LAYOUT': (data, ui, callback) => {
        return (<tr className={ style.inputRow }>
            <InputCell idx={0} label={ui.componentLabels[0]} type={ui.type} value={data.value[0]} name={data.name} domain={ui.domain} onChange={callback}/>
        </tr>);
    },
};
/* eslint-enable react/display-name */
/* eslint-enable react/no-multi-comp */

export default function(data, ui, callback) {
    if (!ui.hasOwnProperty('layout')) {
        ui.layout = 'NO_LAYOUT';
    }

    if (!ui.hasOwnProperty('size')) {
        ui.size = 1;
    }

    if (!ui.hasOwnProperty('type')) {
        ui.type = 'string';
    }

    if (!ui.hasOwnProperty('domain')) {
        ui.domain = {};
    }

    const fn = layouts[ui.layout];
    if(fn) {
        return fn(data, ui, callback);
    }
    return null
}
