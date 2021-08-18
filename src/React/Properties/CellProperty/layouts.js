import React from 'react';
import style from 'PVWStyle/ReactProperties/CellProperty.mcss';

import InputCell from './InputCell';

function arrayFill(arr, expectedLength, filler = '') {
  if (!arr) {
    return Array(expectedLength).fill(filler);
  }

  while (arr.length < expectedLength) {
    arr.push(filler);
  }
  return arr;
}
/* eslint-disable */
const layouts = {
  1: (data, ui, callback) => {
    ui.componentLabels = arrayFill(ui.componentLabels, 1);
    data.value = arrayFill(data.value, 1, null);
    return (
      <tbody>
        <tr className={style.inputRow}>
          <InputCell
            idx={0}
            label={ui.componentLabels[0]}
            type={ui.type}
            value={data.value[0]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
        </tr>
      </tbody>
    );
  },
  2: (data, ui, callback) => {
    ui.componentLabels = arrayFill(ui.componentLabels, 2);
    data.value = arrayFill(data.value, 2, null);
    return (
      <tbody>
        <tr className={style.inputRow}>
          <InputCell
            idx={0}
            label={ui.componentLabels[0]}
            type={ui.type}
            value={data.value[0]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
          <InputCell
            idx={1}
            label={ui.componentLabels[1]}
            type={ui.type}
            value={data.value[1]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
        </tr>
      </tbody>
    );
  },
  3: (data, ui, callback) => {
    ui.componentLabels = arrayFill(ui.componentLabels, 3);
    data.value = arrayFill(data.value, 3, null);
    return (
      <tbody>
        <tr className={style.inputRow}>
          <InputCell
            idx={0}
            label={ui.componentLabels[0]}
            type={ui.type}
            value={data.value[0]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
          <InputCell
            idx={1}
            label={ui.componentLabels[1]}
            type={ui.type}
            value={data.value[1]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
          <InputCell
            idx={2}
            label={ui.componentLabels[2]}
            type={ui.type}
            value={data.value[2]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
        </tr>
      </tbody>
    );
  },
  '2x3': (data, ui, callback) => {
    ui.componentLabels = arrayFill(ui.componentLabels, 6);
    data.value = arrayFill(data.value, 6, null);
    return (
      <tbody>
        <tr className={style.inputRow} key={data.id + '_0'}>
          <InputCell
            idx={0}
            label={ui.componentLabels[0]}
            type={ui.type}
            value={data.value[0]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
          <InputCell
            idx={1}
            label={ui.componentLabels[1]}
            type={ui.type}
            value={data.value[1]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
          <InputCell
            idx={2}
            label={ui.componentLabels[2]}
            type={ui.type}
            value={data.value[2]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
        </tr>
        <tr className={style.inputRow} key={data.id + '_1'}>
          <InputCell
            idx={3}
            label={ui.componentLabels[3]}
            type={ui.type}
            value={data.value[3]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
          <InputCell
            idx={4}
            label={ui.componentLabels[4]}
            type={ui.type}
            value={data.value[4]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
          <InputCell
            idx={5}
            label={ui.componentLabels[5]}
            type={ui.type}
            value={data.value[5]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
        </tr>
      </tbody>
    );
  },
  '3x2': (data, ui, callback) => {
    ui.componentLabels = arrayFill(ui.componentLabels, 6);
    data.value = arrayFill(data.value, 6, null);
    return (
      <tbody>
        <tr className={style.inputRow} key={data.id + '_0'}>
          <InputCell
            idx={0}
            label={ui.componentLabels[0]}
            type={ui.type}
            value={data.value[0]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
          <InputCell
            idx={1}
            label={ui.componentLabels[1]}
            type={ui.type}
            value={data.value[1]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
        </tr>
        <tr className={style.inputRow} key={data.id + '_1'}>
          <InputCell
            idx={2}
            label={ui.componentLabels[2]}
            type={ui.type}
            value={data.value[2]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
          <InputCell
            idx={3}
            label={ui.componentLabels[3]}
            type={ui.type}
            value={data.value[3]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
        </tr>
        <tr className={style.inputRow} key={data.id + '_2'}>
          <InputCell
            idx={4}
            label={ui.componentLabels[4]}
            type={ui.type}
            value={data.value[4]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
          <InputCell
            idx={5}
            label={ui.componentLabels[5]}
            type={ui.type}
            value={data.value[5]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
        </tr>
      </tbody>
    );
  },
  n: (data, ui, callback) => {
    ui.componentLabels = arrayFill(ui.componentLabels, ui.size);
    data.value = arrayFill(data.value, ui.size, null);
    return (
      <tbody>
        <tr className={style.inputRow}>
          {data.value.map((value, idx) => (
            <InputCell
              idx={idx}
              key={idx}
              label={ui.componentLabels[idx]}
              type={ui.type}
              value={value}
              name={data.name}
              domain={ui.domain}
              onChange={callback}
            />
          ))}
        </tr>
      </tbody>
    );
  },
  m6: (data, ui, callback) => {
    ui.componentLabels = arrayFill(ui.componentLabels, 6);
    data.value = arrayFill(data.value, 6, null);
    return (
      <tbody>
        <tr className={style.inputRow} key={data.id + '_0'}>
          <InputCell
            idx={0}
            label={ui.componentLabels[0]}
            type={ui.type}
            value={data.value[0]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
          <InputCell
            idx={1}
            label={ui.componentLabels[1]}
            type={ui.type}
            value={data.value[1]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
          <InputCell
            idx={2}
            label={ui.componentLabels[2]}
            type={ui.type}
            value={data.value[2]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
        </tr>
        <tr className={style.inputRow} key={data.id + '_1'}>
          <td />
          <InputCell
            idx={3}
            label={ui.componentLabels[3]}
            type={ui.type}
            value={data.value[3]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
          <InputCell
            idx={4}
            label={ui.componentLabels[4]}
            type={ui.type}
            value={data.value[4]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
        </tr>
        <tr className={style.inputRow} key={data.id + '_2'}>
          <td />
          <td />
          <InputCell
            idx={5}
            label={ui.componentLabels[5]}
            type={ui.type}
            value={data.value[5]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
        </tr>
      </tbody>
    );
  },
  '-1': (data, ui, callback) => {
    return (
      <tbody>
        {data.value.map((value, index) => {
          return (
            <tr key={[data.id, index].join('_')} className={style.inputRow}>
              <td>
                <i
                  className={index ? style.deleteIcon : style.hidden}
                  onClick={() => {
                    callback(index, null);
                  }}
                />
              </td>
              <InputCell
                idx={index}
                label=""
                type={ui.type}
                value={value}
                name={data.name}
                domain={ui.domain}
                onChange={callback}
              />
            </tr>
          );
        })}
      </tbody>
    );
  },
  '3x3+1': (data, ui, callback) => {
    ui.componentLabels = arrayFill(ui.componentLabels, 10);
    data.value = arrayFill(data.value, 10, null);
    return (
      <tbody>
        <tr className={style.inputRow} key={data.id + '_0'}>
          <InputCell
            idx={0}
            label={ui.componentLabels[0]}
            type={ui.type}
            value={data.value[0]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
          <InputCell
            idx={1}
            label={ui.componentLabels[1]}
            type={ui.type}
            value={data.value[1]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
          <InputCell
            idx={2}
            label={ui.componentLabels[2]}
            type={ui.type}
            value={data.value[2]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
        </tr>
        <tr className={style.inputRow} key={data.id + '_1'}>
          <InputCell
            idx={3}
            label={ui.componentLabels[3]}
            type={ui.type}
            value={data.value[3]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
          <InputCell
            idx={4}
            label={ui.componentLabels[4]}
            type={ui.type}
            value={data.value[4]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
          <InputCell
            idx={5}
            label={ui.componentLabels[5]}
            type={ui.type}
            value={data.value[5]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
        </tr>
        <tr className={style.inputRow} key={data.id + '_2'}>
          <InputCell
            idx={6}
            label={ui.componentLabels[6]}
            type={ui.type}
            value={data.value[6]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
          <InputCell
            idx={7}
            label={ui.componentLabels[7]}
            type={ui.type}
            value={data.value[7]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
          <InputCell
            idx={8}
            label={ui.componentLabels[8]}
            type={ui.type}
            value={data.value[8]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
        </tr>
        <tr className={style.inputRow} key={data.id + '_3'}>
          <InputCell
            idx={9}
            label={ui.componentLabels[9]}
            type={ui.type}
            value={data.value[9]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
          <td />
          <td />
        </tr>
      </tbody>
    );
  },
  NO_LAYOUT: (data, ui, callback) => {
    return (
      <tbody>
        <tr className={style.inputRow}>
          <InputCell
            idx={0}
            label={ui.componentLabels[0]}
            type={ui.type}
            value={data.value[0]}
            name={data.name}
            domain={ui.domain}
            onChange={callback}
          />
        </tr>
      </tbody>
    );
  },
};
/* eslint-enable */

export default function (data, ui, callback) {
  if (!{}.hasOwnProperty.call(ui, 'layout')) {
    ui.layout = 'NO_LAYOUT';
  }

  if (!{}.hasOwnProperty.call(ui, 'size')) {
    ui.size = 1;
  }

  if (!{}.hasOwnProperty.call(ui, 'type')) {
    ui.type = 'string';
  }

  if (!{}.hasOwnProperty.call(ui, 'domain')) {
    ui.domain = {};
  }

  const fn = layouts[ui.layout];
  if (fn) {
    return fn(data, ui, callback);
  }
  return null;
}
