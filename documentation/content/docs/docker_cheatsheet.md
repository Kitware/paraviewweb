# ParaViewWeb Generic container

## Running pvw-{version}-{egl/osmesa}

This docker image aims to ease any ParaViewWeb application deployment by offering a standard way of strcuturing your web application and exposing it to the world.

### Expected structure

```
    <APP_ROOT>/www/
    <APP_ROOT>/launcher/config.json
    <APP_ROOT>/requirements.txt        (optional)
    <APP_ROOT>/server/                 (optional)
```

__www__ is the directory that will be served by Apache inside docker.
__launcher/config.json__ is the launcher configuration where __SESSION_URL_ROOT__ and __EXTRA_PVPYTHON_ARGS__ would be replaced with the proper docker environments properties.
__requirements.txt__ allow you to install additional Python packages which will then be usable inside your ParaViewWeb application.
__server/__ is the directory where we tend to put our ParaViewWeb server scripts by convention.

### Launcher configuration

The following configuration could be used as a base for your application.

```
{
  "resources": [ {"port_range": [9010, 9014], "host": "localhost"} ],
  "sessionData": {},
  "configuration": {
    "log_dir": "/opt/launcher/log",
    "host": "localhost",
    "endpoint": "paraview",
    "sessionURL": "SESSION_URL_ROOT/proxy?sessionId=${id}&path=ws",
    "timeout": 25,
    "upload_dir": "/data/upload",
    "fields": [],
    "port": 9000,
    "proxy_file": "/opt/launcher/proxy-mapping.txt",
    "sanitize": {
      "file": {
          "type": "regexp",
          "regexp": "^[-\\\\w./]+$",
          "default": "emptyFile"
      }
    }
  },
  "properties": {
    "dataDir": "/data",
    "webapps_dir": "/opt/paraview/share/paraview-5.6/web",
    "python_exec": "/opt/paraview/bin/pvpython"
  },
  "apps": {
    "MySuperPVWApp": {
      "cmd": [
        "${python_exec}",
        EXTRA_PVPYTHON_ARGS
        "/pvw/server/pvw-server.py",
        "--port", "${port}",
        "--authKey", "${secret}",
        "--timeout", "30"
      ],
      "ready_line" : "Starting factory"
    },
    "visualizer": {
      "cmd": [
        "${python_exec}",
        EXTRA_PVPYTHON_ARGS
        "${webapps_dir}/visualizer/server/pvw-visualizer.py",
        "--port", "${port}",
        "--data", "${dataDir}",
        "--authKey", "${secret}",
        "--viewport-max-width", "1920",
        "--viewport-max-height", "1080",
        "--timeout", "30"
      ],
      "ready_line" : "Starting factory"
    },
    "visualizer-with-file": {
      "cmd": [
        "${python_exec}",
        EXTRA_PVPYTHON_ARGS
        "${webapps_dir}/visualizer/server/pvw-visualizer.py",
        "--port", "${port}",
        "--data", "${dataDir}",
        "--authKey", "${secret}",
        "--viewport-max-width", "1920",
        "--viewport-max-height", "1080",
        "--timeout", "30",
        "--load-file", "${file}"
      ],
      "ready_line" : "Starting factory"
    },
    "paraview-lite": {
      "cmd": [
        "${python_exec}",
        EXTRA_PVPYTHON_ARGS
        "${webapps_dir}/lite/server/pvw-lite.py",
        "--port", "${port}",
        "--data", "${dataDir}",
        "--authKey", "${secret}",
        "--viewport-max-width", "1920",
        "--viewport-max-height", "1080",
        "--timeout", "30"
      ],
      "ready_line" : "Starting factory"
    },
    "divvy": {
      "cmd": [
        "${python_exec}",
        EXTRA_PVPYTHON_ARGS
        "${webapps_dir}/divvy/server/pvw-divvy.py",
        "--port", "${port}",
        "--data", "${dataDir}/${file}",
        "--authKey", "${secret}",
        "--viewport-max-width", "1920",
        "--viewport-max-height", "1080",
        "--timeout", "30"
      ],
      "ready_line" : "Starting factory"
    }
  }
}
```

### Running docker

__Configuration properties__

We use environment variable (-e) for our Docker in order to dynamically configure our launcher configuration:

- __SERVER_NAME__: Specify which hostname and port the service will be accessible to. 
- __PROTOCOL__: Specify which ws protocol you want to use `ws` or `wss`.
- __EXTRA_PVPYTHON_ARGS__: Arbitrary set of arguments.


In the launcher configuration those properties will then be used to replace the following keywords:

- __SESSION_URL_ROOT__: "${PROTOCOL}://${SERVER_NAME}"
- __EXTRA_PVPYTHON_ARGS__: EXTRA_PVPYTHON_ARGS split by ','


__Use OSMesa for CPU only__

```
export PORT=8080
export DATA=/my-datasets/
export DEPLOY=/my-pvw-app/
export SERVER_NAME=localhost:443
export PROTOCOL=wss

sudo docker run --runtime=nvidia        \
    -p 0.0.0.0:${PORT}:80                \
    -v ${DATA}:/data                      \
    -v ${DEPLOY}:/pvw                      \
    -e "SERVER_NAME=${SERVER_NAME}"          \
    -e "PROTOCOL=${PROTOCOL}"                 \
    -e EXTRA_PVPYTHON_ARGS="-dr,--mesa-swr"    \
    -ti kitware/paraviewweb:pvw-v5.6.0-osmesa
```

__Use EGL for NVIDIA GPU__

```
export PORT=8080
export DATA=/my-datasets/
export DEPLOY=/my-pvw-app/
export SERVER_NAME=localhost:443
export PROTOCOL=wss

sudo docker run --runtime=nvidia        \
    -p 0.0.0.0:${PORT}:80                \
    -v ${DATA}:/data                      \
    -v ${DEPLOY}:/pvw                      \
    -e "SERVER_NAME=${SERVER_NAME}"          \
    -e "PROTOCOL=${PROTOCOL}"                 \
    -ti kitware/paraviewweb:pvw-v5.6.0-egl
```
