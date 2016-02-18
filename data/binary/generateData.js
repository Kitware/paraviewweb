#! /usr/bin/env node

var fs = require('fs'),
    path = __dirname + '/',
    dataToWrite = [
        {
            name: 'data.int8',
            buffer: new Buffer(11),
            values: [ -128, 0, 1, 2, 3, 4, 8, 16, 32, 64, 127 ],
            BYTES_PER_ELEMENT: 1,
            method: 'writeInt8',
            type: Int8Array
        },{
            name: 'data.uint8',
            buffer: new Buffer(20),
            values: [ 0, 2, 1, 3, 5, 4, 8, 16, 32, 64, 127, 128, 254, 0, 0, 0, 0, 0, 0, 120 ],
            BYTES_PER_ELEMENT: 1,
            method: 'writeUInt8',
            type: Uint8Array
        },{
            name: 'data.int16.le',
            buffer: new Buffer(14),
            values: [ -32500, -1024, -512, 0, 512, 1024, 32500],
            BYTES_PER_ELEMENT: 2,
            method: 'writeInt16LE',
            type: Int16Array
        },{
            name: 'data.uint16.le',
            buffer: new Buffer(18),
            values: [ 0, 512, 1024, 2048, 4096, 9192, 16384, 32768, 65535],
            BYTES_PER_ELEMENT: 2,
            method: 'writeUInt16LE',
            type: Uint16Array
        },{
            name: 'data.int32.le',
            buffer: new Buffer(36),
            values: [ -65000, -32500, -1024, -512, 0, 512, 1024, 32500, 65000],
            BYTES_PER_ELEMENT: 4,
            method: 'writeInt32LE',
            type: Int32Array
        },{
            name: 'data.uint32.le',
            buffer: new Buffer(40),
            values: [ 0, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65535, 131071],
            BYTES_PER_ELEMENT: 4,
            method: 'writeUInt32LE',
            type: Uint32Array
        },{
            name: 'data.float32.le',
            buffer: new Buffer(20),
            values: [ 0, 512.1024, 2048.4096, 8192.16384, 32768.65535],
            BYTES_PER_ELEMENT: 4,
            method: 'writeFloatLE',
            type: Float32Array
        },{
            name: 'data.float64.le',
            buffer: new Buffer(40),
            values: [ 0, 512.1024, 2048.4096, 8192.16384, 32768.65535],
            BYTES_PER_ELEMENT: 8,
            method: 'writeDoubleLE',
            type: Float64Array
        },{
            name: 'data.int16.be',
            buffer: new Buffer(14),
            values: [ -32500, -1024, -512, 0, 512, 1024, 32500],
            BYTES_PER_ELEMENT: 2,
            method: 'writeInt16BE',
            type: Int16Array
        },{
            name: 'data.uint16.be',
            buffer: new Buffer(18),
            values: [ 0, 512, 1024, 2048, 4096, 9192, 16384, 32768, 65535],
            BYTES_PER_ELEMENT: 2,
            method: 'writeUInt16BE',
            type: Uint16Array
        },{
            name: 'data.int32.be',
            buffer: new Buffer(36),
            values: [ -65000, -32500, -1024, -512, 0, 512, 1024, 32500, 65000],
            BYTES_PER_ELEMENT: 4,
            method: 'writeInt32BE',
            type: Int32Array
        },{
            name: 'data.uint32.be',
            buffer: new Buffer(40),
            values: [ 0, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65535, 131071],
            BYTES_PER_ELEMENT: 4,
            method: 'writeUInt32BE',
            type: Uint32Array
        },{
            name: 'data.float32.be',
            buffer: new Buffer(20),
            values: [ 0, 512.1024, 2048.4096, 8192.16384, 32768.65535],
            BYTES_PER_ELEMENT: 4,
            method: 'writeFloatBE',
            type: Float32Array
        },{
            name: 'data.float64.be',
            buffer: new Buffer(40),
            values: [ 0, 512.1024, 2048.4096, 8192.16384, 32768.65535],
            BYTES_PER_ELEMENT: 8,
            method: 'writeDoubleBE',
            type: Float64Array
        }
    ];

dataToWrite.forEach(function(item) {
    // Fill buffer
    var buffer = item.buffer,
        values = item.values,
        count = values.length,
        method = item.method,
        bytesPerElement = item.BYTES_PER_ELEMENT;

    for(var i = 0; i < count; i++) {
        buffer[method](values[i], i * bytesPerElement);
    }

    // var nativeArray = new item.type(buffer),
    //     nativeValues = [],
    //     equals = true;
    // for(var i = 0; i < count; i++) {
    //     equals = equals && (nativeArray[i] === values[i]);
    //     nativeValues.push(nativeArray[i]);
    // }

    // if(equals) {
    //     console.log('Well written ' + item.name + '\n');
    // } else {
    //     console.log('I/O error ' + item.name);
    //     console.log('n(s) '.replace(/s/g, nativeValues.length) + nativeValues);
    //     console.log('v(s) '.replace(/s/g, values.length) + values);
    //     console.log();
    // }

    // Write buffer
    var fd = fs.openSync(path + item.name + '.dat', 'w');
    fs.writeSync(fd, buffer, 0, buffer.length, 0);
    fs.closeSync(fd);
});

