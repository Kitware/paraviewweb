import test from 'tape-catch';

import QueryDataModel from '..';

// ----------------------------------------------------------------------------

test('Query Data Model - Fetch/Notification', t => {
  const dataDescription = {
    type: ['tonic-query-data-model', 'slice-prober'],
    arguments: {
      time: {
        ui: 'slider',
        values: ['0', '1'],
        label: 'Time',
      },
    },
    arguments_order: ['time'],
    data: [
      {
        name: 'slice_0',
        type: 'blob',
        mimeType: 'image/png',
        pattern: '{time}/{field}_0.png',
      }, {
        name: 'slice_1',
        type: 'blob',
        mimeType: 'image/png',
        pattern: '{time}/{field}_1.png',
      }, {
        name: 'slice_2',
        type: 'blob',
        mimeType: 'image/png',
        pattern: '{time}/{field}_2.png',
      },
    ],
    metadata: {
      title: 'Ocean simulation data',
      type: 'probe-slice',
      id: 'mpas-probe-data',
      description: 'Some simulation data from MPAS',
    },
    InSituDataProber: {
      slices: ['slice_0', 'slice_1', 'slice_2'],
      fields: ['temperature', 'salinity'],
      origin: [-180, -84, 0],
      sprite_size: 10,
      dimensions: [500, 250, 30],
      spacing: [0.72, 0.672, 4.0],
      ranges: {
        temperature: [-5, 30],
        salinity: [0, 38],
      },
    },
  };

  const numberOfRequests = 100;
  const queryDataModel = new QueryDataModel(dataDescription, '/data/probe/');
  let fetchCount = 0;
  let notificationCount = 0;

  queryDataModel.onDataChange((data, envelope) => {
    notificationCount++;
    t.ok(data && !data.error, `callback ${notificationCount}`);

    // Finish test
    if (numberOfRequests === notificationCount) {
      // console.log('Fetch/Notification: done with success');
      t.end();
    }
  });

  queryDataModel.setValue('field', 'temperature');

  let count = numberOfRequests;
  while (count--) {
    fetchCount++;
    t.comment(`fetch ${fetchCount}`);
    queryDataModel.fetchData();
  }
});

// ----------------------------------------------------------------------------

test('Query Data Model - API/Query/Validation', t => {
  const dataDescription = {
    type: ['tonic-query-data-model'],
    arguments: {
      x: {
        values: ['0', '1', '2'],
      },
      y: {
        values: ['0', '1', '2'],
      },
    },
    arguments_order: ['x', 'y'],
    data: [
      {
        name: 'text',
        type: 'text',
        pattern: '{x}_{y}.txt',
      }, {
        name: 'json',
        type: 'json',
        pattern: '{x}_{y}.json',
      },
    ],
  };

  const queryDataModel = new QueryDataModel(dataDescription, '/base/data/dummy/');
  const expectedValues = ['X', 'O', 'X', 'O', 'O', 'X', 'X', 'X', 'O'];


  queryDataModel.onDataChange((data, envelope) => {
    t.ok(data && !data.error, 'Valid data without error');
    const expected = expectedValues.shift();

    t.equal(data.json.data.value, expected, 'Validate data request');

    if (queryDataModel.next('x')) {
      queryDataModel.fetchData();
    } else if (queryDataModel.next('y')) {
      queryDataModel.first('x');
      queryDataModel.fetchData();
    } else {
      t.end();
    }
  });

  queryDataModel.fetchData();
});

