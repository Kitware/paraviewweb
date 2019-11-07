# Build Your Own Container

Sometimes the approach of deploying your application using only the base paraviewweb Docker image may not fit your needs exactly.  For example, if you want to bundle your application within a container completely under your own control, or if you want to customize the startup script or running processes, then building your own container on top of ones we provide might be the right solution.

This document focuses on how you can build your application container leveraging the images we have built using the Dockerfiles in this repo.  The high-level summary is that you should build on top of the paraviewweb base container (on Dockerhub: `pvw-<version>-egl`, or `pvw-<version>-osmesa`), copy in your own launcher configuration file and any application files/resources your application needs, add your application endpoint(s) wherever you'd like them to live, and override the default `ENTRYPOINT`.

## Example of a custom application `Dockerfile`

As an example, let's look at the `Dockerfile` for the `visualizer` container provided in this repository (`tools/docker/visualizer/Dockerfile`).  The goal of the `visualizer` application is to host the ParaViewWeb Visualizer application.

```
ARG BASE_IMAGE=kitware/paraviewweb:pvw-v5.6.0-egl
FROM ${BASE_IMAGE}

# Copy the launcher config template
COPY config/launcher/config-template.json /opt/launcher/config-template.json

#
# Now w run this script which will update the apache vhost file.  We use bash
# instead of "sh" due to the use of "read -d" in the script.  Also, it is bash, not
# docker which manages the env variable interpolation, so we must use bash if we
# want that convenience.
#
# To add more endpoints, simply add more pairs of arguments beyond "visualizer" and
# "/opt/paraview/.../www".
#
RUN ["/opt/paraviewweb/scripts/addEndpoints.sh", \
  "visualizer", "/opt/paraview/share/paraview-5.6/web/visualizer/www" \
]

# Start the container
ENTRYPOINT ["/opt/paraviewweb/scripts/start.sh"]
```

Now let's look at each of the pieces in the `Dockerfile` in more detail.

The first thing to note is that we make the base container an argument so that we can easily change base images, allowing us to more easily create several different versions of our application container.

Next, within our `Dockerfile` directory, we have created a `config/launcher/` directory containing our custom launcher configuration file, which could either be the launcher configuration we need already, or might be a template with some values to be replaced any time the container is run.  Have a look at that file (`tools/docker/visualizer/config/launcher/config.json`) to see what it contains.  The `Dockerfile` above copies that template into our container, with the idea that whenever we run the container, the `start.sh` script provided in the paraviewweb base container (the script we use as the `ENTRYPOINT` above) will take some runtime environment variables and replace specific values in the launcher configuration template.  This gives us runtime control over the `sessionUrl` returned to clients by the launcher whenever it starts a visualization process on their behalf.  It also lets us specify (again, at the time we run the container) any extra arguments to be passed to the launched `pvpython` processes.

At the time of this writing, there are only two values we expect to get replaced in the launcher configuration template: `SESSION_URL_ROOT` and `EXTRA_PVPYTHON_ARGS`.

Next note the `RUN` section in the `Dockerfile` above.  This is running a shell script put into the paraviewweb container, where the goal is to dynamically update the apache virtual host configuration inside the container to add endpoints for our application.  The `addEndpoints.sh` shell script can be found in `tools/docker/paraviewweb/scripts/addEndpoint.sh` if you want to see exactly what's going on, but in essence, it expects arguments to come in pairs.  In each pair the first item should be an alias (just a short string), and the second item should be a directory path available within the container.  In this case, the path already exists in the ParaView install directory due to the use of the ParaView Superbuild, but in general the paths could be anywhere, even ones you expect to mount when you run the container.  For each argument pair, the script will insert some lines in the apache config for you.  For example, if you run the script like this:

```
/opt/paraviewweb/scripts/addEndpoints.sh foo /pvw/www
```

Then the `/etc/apache2/sites-enabled/001-pvw.conf` will be amended to contain:

```
    Alias foo /pvw/www

    <Directory /pvw/www>
      Options Indexes FollowSymLinks
      Order allow,deny
      Allow from all
      AllowOverride None
      Require all granted
    </Directory>
```

And in that case you should add `/foo` to the url in order to reach your application, similar to `http(s)//<host>:<port>/foo`.

So the `Dockerfile` above results in a container where the apache virtual host configuration has a single endpoint exposed, aliased by `visualizer`.  You can add as many pairs of arguments as you like when you invoke the `addEndpoints.sh` script.

One final note on the `addEndpoints.sh` script: the special string `DOCUMENT-ROOT-DIRECTORY` is treated differently: if the script sees that instead of any other value for the alias, then it does not add a new `Alias` or `Directory` to the virtual host config file.  Instead it just replaces `DOCUMENT-ROOT-DIRECTORY` in the two places it appears in the apache config template installed into the base image.  This allows you to expose your application at the root of the webserver if you wish.  In that case, you will just point to a url like `http(s)//<host>:<port>` to reach your application. If you do not add `DOCUMENT-ROOT-DIRECTORY` along with some directory you want as the `DocumentRoot`, then by default `/var/www/html` will be configured as the `DocumentRoot` by the `addEndpoints.sh` script (in addition to any aliases it may have created based on other args to `addEndpoints.sh`).

You can see the input to the `addEndpoint.sh` script (the apache virtual host configuration file provided by the paraviewweb container) in `tools/docker/paraviewweb/config/apache/001-pvw.conf`.

## Running your application

Once you build the container you defined above, for example:

```
cd <path-to-dir-containing-Dockerfile-and-resources>
docker build -t my-custom-app-image .
```

You can run it with a few different environment variables to control at runtime some of the functionality.  First note that if you followed the example in `tools/docker/visualizer/config/launcher/config.json`, then your launcher configuration file has a line like:

```
    "sessionURL": "SESSION_URL_ROOT/proxy?sessionId=${id}&path=ws",
```

This `sessionURL` is what the launcher hands back to clients once it has started a pvpython visualization process on their behalf.  We use the environment variables `SERVER_NAME` and `PROTOCOL` to build the string that will be written in place of `SESSION_URL_ROOT` when you run the container.  The client will use this `sessionURL` to reach the websocket associated with the `pvpython` process, so be sure to supply the value that will allow your client to reach the target endpoint.

If you want the launcher to tell clients to connect to `ws://my.example.com`, then you'd run your container as follows:

```
docker run --gpus all              \
    -p 0.0.0.0:80:80                \
    -v ...                           \
    -e SERVER_NAME="my.example.com"   \
    -e PROTOCOL="ws"                   \
    -ti my-custom-app-image
```

and you would then point your browser at `http://my.example.com/visualizer` in order to run the visualizer application as configured in this document.
