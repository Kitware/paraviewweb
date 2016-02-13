// Generic request handler
function makeRequest(url, handler) {
    var xhr = new XMLHttpRequest();

    xhr.open('GET', url, true);
    xhr.responseType = handler.type;

    xhr.onload = function(e) {
        if(this.status === 200) {
            return handler.fn(null, xhr);
        }
        handler.fn(e, xhr);
    };
    xhr.onerror = function(e) {
        handler.fn(e, xhr);
    }
    xhr.send();
}

// Array buffer handler
function arraybufferHandler(callback) {
    return {
        type: 'arraybuffer',
        fn: (error, xhrObject) => {
            if(error) {
                return callback(error);
            }
            callback(null, xhrObject.response);
        },
    };
}

// Text handler
function textHandler(callback) {
    return {
        type: 'text',
        fn: (error, xhrObject) => {
            if(error) {
                return callback(error);
            }
            callback(null, xhrObject.response);
        },
    };
}

// JSON handler
function jsonHandler(callback) {
    return {
        type: 'text',
        fn: (error, xhrObject) => {
            if(error) {
                return callback(error);
            }
            callback(null, JSON.parse(xhrObject.response));
        },
    };
}

// Blob handler
function blobHandler(mimeType, callback) {
    return {
        type: 'blob',
        fn: (error, xhrObject) => {
            if(error) {
                return callback(error);
            }

            const blob = new Blob([xhrObject.response], {type: mimeType});
            callback(null, blob);
        },
    };
}

// Fetch methods

function fetchJSON(url, callback) {
    makeRequest(url, jsonHandler(callback));
}

function fetchTxt(url, callback) {
    makeRequest(url, textHandler(callback));
}

function fetchBlob(url, mimeType, callback) {
    makeRequest(url, blobHandler(mimeType, callback));
}

function fetchArray(url, callback) {
    makeRequest(url, arraybufferHandler(callback));
}

// Export fetch methods
export default {
    fetchJSON,
    fetchTxt,
    fetchBlob,
    fetchArray,
}
