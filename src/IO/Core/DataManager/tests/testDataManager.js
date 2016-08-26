import test from 'tape-catch';

import DataManager from '..';

// ----------------------------------------------------------------------------

const dataTesting = {
    'data.int8.dat': { type: Int8Array, values: [  -128, 0, 1, 2, 3, 4, 8, 16, 32, 64, 127 ]},
    'data.uint8.dat': { type: Uint8Array, values: [ 0, 2, 1, 3, 5, 4, 8, 16, 32, 64, 127, 128, 254, 0, 0, 0, 0, 0, 0, 120 ]},
    'data.int16.le.dat': { type: Int16Array, values: [ -32500, -1024, -512, 0, 512, 1024, 32500]},
    'data.uint16.le.dat': { type: Uint16Array, values: [ 0, 512, 1024, 2048, 4096, 9192, 16384, 32768, 65535]},
    'data.int32.le.dat': { type: Int32Array, values: [ -65000, -32500, -1024, -512, 0, 512, 1024, 32500, 65000]},
    'data.uint32.le.dat': { type: Uint32Array, values: [ 0, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65535, 131071]},
    'data.float32.le.dat': { type: Float32Array, values: [ 0, 512.1024, 2048.4096, 8192.16384, 32768.65535]},
    // PhantomJS < 2.0 not suppoted 'data.float64.le.dat': { type: Float64Array, values: [ 0, 512.1024, 2048.4096, 8192.16384, 32768.65535]},
    // 'data.int16.be.dat': { type: Int16Array, values: [ -32500, -1024, -512, 0, 512, 1024, 32500]},
    // 'data.uint16.be.dat': { type: Uint16Array, values: [ 0, 512, 1024, 2048, 4096, 9192, 16384, 32768, 65535]},
    // 'data.int32.be.dat': { type: Int32Array, values: [ -65000, -32500, -1024, -512, 0, 512, 1024, 32500, 65000]},
    // 'data.uint32.be.dat': { type: Uint32Array, values: [ 0, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65535, 131071]},
    // 'data.float32.be.dat': { type: Float32Array, values: [ 0, 512.1024, 2048.4096, 8192.16384, 32768.65535]},
    // 'data.float64.be.dat': { type: Float64Array, values: [ 0, 512.1024, 2048.4096, 8192.16384, 32768.65535]}
}, epsilon = 0.001;

// ----------------------------------------------------------------------------

test('DataManager - Download Binary Data', t => {
  const dataManager = new DataManager();
  const dataTypes = Object.keys(dataTesting);
  t.ok(dataManager, 'Got DataManager instance');

  dataManager.on('error', (data, envelope) => {
    t.fail('DataManager triggered an error: ' + JSON.stringify(data, 2));
  });

  function processData(name) {
    dataManager.on('/base/data/binary/' + name, function(d, envelope) {
      t.ok(d, `Response for ${name}`);
      t.notOk(d.error, `${name} has no error`);

      const buffer = d.data;
      const nativeArray = new dataTesting[name].type(buffer);
      const nativeToArray = [];
      const valideValues = dataTesting[name].values;

      let count = nativeArray.length;
      let dataIsEquals = true;

      for(let i = 0; i < count; i++) {
        nativeToArray.push(nativeArray[i]);
        dataIsEquals = dataIsEquals && Math.abs(nativeArray[i] - valideValues[i]) < epsilon;
      }

      if(!dataIsEquals) {
        t.deepEqual(nativeToArray, valideValues, `Data ${name}`)
      } else {
        t.ok(`Data ${name}`)
      }

      // Finish test
      if(dataTypes.length) {
          processData(dataTypes.shift());
      } else {
          t.comment('Binary data: done with success');
          // dataManager.destroy();
          t.end();
      }
    });

    // Trigger the download request
    const fetchURL = '/base/data/binary/' + name;
    const url = dataManager.fetchURL(fetchURL, 'arraybuffer');
    t.equal(url, fetchURL, 'Url match');
  }

  processData(dataTypes.shift());
});

// ----------------------------------------------------------------------------

test('DataManager - Trigger n fetch and check the amount of notification', t => {
  const dataManager = new DataManager();
  const urlToFetch = '/base/data/dummy/0_1.png';
  const numberToTry = 10;
  let fetchCount = 0;
  let notificationCount = 0;

  dataManager.on('error', (data, envelope) => {
    t.fail('DataManager triggered an error: ' + JSON.stringify(data, 2));
  });

  dataManager.on(urlToFetch, (data, envelope) => {
    notificationCount++;
    t.ok(data && !data.error, `n: ${notificationCount} f: ${fetchCount} t: ${numberToTry}`);

    if(notificationCount === fetchCount && notificationCount === numberToTry) {
      t.comment('Fetch/Notification: done with success');
      t.end();
    }
  });

  function createNewFetch() {
    // Trigger the download request
    t.comment(`fetch ${1 + fetchCount}`);
    const url = dataManager.fetchURL(urlToFetch, 'blob', 'image/png');
    fetchCount++;

    t.equal(url, urlToFetch, 'URL requested should match the one returned');

    if(fetchCount < numberToTry) {
      createNewFetch();
    }
  }

  createNewFetch();
});

// ----------------------------------------------------------------------------

test('Data Manager - Download JSON/Images using pattern', t => {
  const urlToBeValid = [];
  const dataManager = new DataManager();
  let nbImageAvailable = 0;
  let exepectedNbImages = 1;
  let nbToFree = 0;
  let alreadyFree = 0;

  dataManager.on('/data/probe/index.json', (data, envelope) => {
    t.ok(data.data, 'Got JSON data');

    t.deepEqual(data.data.InSituDataProber.dimensions, [500, 250, 30], 'Dimension in JSON data');
    t.deepEqual(data.data.InSituDataProber.fields, [ "temperature", "salinity" ], 'Fields in JSON data');
    t.equal(data.data.InSituDataProber.sprite_size, 10, 'Sprite size in JSON data');

    // Register file pattern
    dataManager.registerURL('images', '/data/probe/' + data.data.data[0].pattern, 'blob', 'image/png');
    let count = exepectedNbImages = 1;
    while(count--) {
      dataManager.fetch('images', { field: 'temperature', time: '0' });
    }
  });

  dataManager.on('images', (d, envelope) => {
    nbImageAvailable++;

    // No error
    t.ok(d && !d.error, 'Data without error')
    urlToBeValid.push(d.requestedURL);

    if(nbImageAvailable === exepectedNbImages) {
      var count = urlToBeValid.length;
      while(count--) {
        t.ok(dataManager.get(urlToBeValid[count]), `Got image ${urlToBeValid[count]}`);
        var freeResource = (count % 2 === 0);
        t.ok(dataManager.get(urlToBeValid[count], freeResource).data.size > 10, 'Image have content');
      }

      // Test that the cache is empty
      count = urlToBeValid.length;
      while(count--) {
        if(dataManager.get(urlToBeValid[count])) {
          dataManager.free(urlToBeValid[count]);
          nbToFree++;
        } else {
          alreadyFree++;
        }
        t.notOk(dataManager.get(urlToBeValid[count]), 'Image was properly released');

        // Should not hurt to free it again
        dataManager.free(urlToBeValid[count]);
      }

      t.comment('JSON/Images pattern: done with success');
      // dataManager.destroy();
      t.end();
    }
  });

  dataManager.on('error', (data, envelope) => {
    t.fail('Got error notification ' + data.error);
  });

  const fetchURL = '/data/probe/index.json';
  const url = dataManager.fetchURL(fetchURL, 'json');
  t.equal(url, fetchURL, 'URL should match');
});
