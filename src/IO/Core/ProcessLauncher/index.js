import Monologue from 'monologue.js'

const
    PROCESS_READY_TOPIC = 'launcher.process.ready',
    PROCESS_STOPPED_TOPIC = 'launcher.process.stopped',
    CONNECTION_INFO_TOPIC = 'launcher.info.connection',
    ERROR_TOPIC = 'launcher.error';

var
    connections = [];

export default class ProcessLauncher {
    constructor(endPoint) {
        this.endPoint = endPoint;
    }

    start(config) {
        var xhr = new XMLHttpRequest(),
            url = this.endPoint;

        xhr.open('POST', url, true);
        xhr.responseType = 'json';

        xhr.onload = (e) => {
            var response = xhr.response;
            if(xhr.status === 200 && !response.error) {
                // Add connection to our global list
                connections.push(response);
                this.emit(PROCESS_READY_TOPIC, response);
                return;
            }
            this.emit(ERROR_TOPIC, response);
        };

        xhr.onerror = (e) => {
            this.emit(ERROR_TOPIC, xhr.response);
        }

        xhr.send(JSON.stringify(config));
    }

    fetchConnection(sessionId, success, error) {
        var xhr = new XMLHttpRequest(),
            url = [this.endPoint, sessionId].join('/');

        xhr.open('GET', url, true);
        xhr.responseType = 'json';

        xhr.onload = (e) => {
            if(this.status === 200) {
                this.emit(CONNECTION_INFO_TOPIC, xhr.response);
                return;
            }
            this.emit(ERROR_TOPIC, xhr.response);
        };

        xhr.onerror = (e) => {
            this.emit(ERROR_TOPIC, xhr.response);
        }

        xhr.send();
    }

    stop(connection) {
        var xhr = new XMLHttpRequest(),
            url = [this.endPoint, connection.id].join('/');

        xhr.open('DELETE', url, true);
        xhr.responseType = 'json';

        xhr.onload = (e) => {
            if(this.status === 200) {
                const response = xhr.response;
                // Remove connection from the list
                // FIXME / TODO
                this.emit(PROCESS_STOPPED_TOPIC, response);
                return;
            }
            this.emit(ERROR_TOPIC, xhr.response);
        };
        xhr.onerror = (e) => {
            this.emit(ERROR_TOPIC, xhr.response);
        }
        xhr.send();
    }

    listConnections() {
        return connections;
    }

    onProcessReady(callback) {
        return this.on(PROCESS_READY_TOPIC, callback);
    }

    onProcessStopped(callback) {
        return this.on(PROCESS_STOPPED_TOPIC, callback);
    }

    onFetch(callback) {
        return this.on(CONNECTION_INFO_TOPIC, callback);
    }

    onError(callback) {
        return this.on(ERROR_TOPIC, callback);
    }

    destroy() {
        this.off();
        this.endPoint = null;
    }
}
Monologue.mixInto(ProcessLauncher);
