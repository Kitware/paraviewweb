var dataTesting = {
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


describe("Data Manager - Download Binary Data", function() {
        it('test all data format', function(done) {
            var dataManager = null,
                dataTypes = Object.keys(dataTesting);

            testHelper.start();

            expect(ParaViewWeb.IO.Core.DataManager).toBeDefined();
            dataManager = new ParaViewWeb.IO.Core.DataManager();

            dataManager.on('error', function(data, envelope) {
                console.error('ERROR');
                testHelper(data.error, data.response);
            });

            function processData(name) {
                dataManager.on('/base/data/binary/' + name, function(data, envelope) {
                    testHelper(null, data);
                });

                // Trigger the download request
                var fetchURL = '/base/data/binary/' + name,
                    url = dataManager.fetchURL(fetchURL, 'arraybuffer');
                expect(url).toEqual(fetchURL);

                // Inspect data
                testHelper.waitAndRun(function(d) {
                    // No error
                    expect(d.error).toBeNull();
                    expect(d.response).not.toBeNull();

                    var buffer = d.response.data;

                    var nativeArray = new dataTesting[name].type(buffer),
                        nativeToArray = [],
                        valideValues = dataTesting[name].values,
                        count = nativeArray.length,
                        dataIsEquals = true;

                    for(var i = 0; i < count; i++) {
                        nativeToArray.push(nativeArray[i]);
                        dataIsEquals = dataIsEquals && Math.abs(nativeArray[i] - valideValues[i]) < epsilon;
                    }

                    if(!dataIsEquals) {
                        console.error(name + ' is not valid:');
                        console.error('Native(s): '.replace(/s/g, nativeToArray.length) + nativeToArray);
                        console.error('Expect(s): '.replace(/s/g, valideValues.length) + valideValues);
                    } else {
                        console.log(name + ' is VALID ');
                    }


                    // Finish test
                    if(dataTypes.length) {
                        processData(dataTypes.shift());
                    } else {
                        console.log('Binary data: done with success');
                        // dataManager.destroy();
                        testHelper.done(done);
                    }
                });
            }

            processData(dataTypes.shift());
        });
});
