
#
# sudo docker build -t pvw-visualizer-5.5.0 .
#
# The following will configure all EXPOSED ports to be mapped to random
# ports on the host.  After which, you will use "docker port <container>"
# to find out the mapping.
#
# sudo docker run --runtime=nvidia -P -ti pvw-visualizer-5.5.0
#
# The following is specific about which container ports get mapped to which
# host ports.  In this case port 80 in the container is mapped to port 8081
# on the host:
#
# sudo docker run --runtime=nvidia -p 127.0.0.1:8081:80 -ti pvw-visualizer-5.5.0
#
# Or, to customize the protocol and hostname used in the sessionURL returned
# by the launcher, you can provide an extra argument after the image
# name:
#
# sudo docker run --runtime=nvidia -p 127.0.0.1:8081:80 -ti pvw-visualizer-5.5.0 "wss://www.example.com"
#
# In order to run the container with a bash shell instead (for debugging):
#
# sudo docker run --runtime=nvidia --entrypoint=bash -ti pvw-visualizer-5.5.0
#

ARG BASE_IMAGE=kitware/paraviewweb:pvw-base-5.5.0
FROM ${BASE_IMAGE}

# Copy the launcher config template
COPY config/launcher/launcher-template.json /opt/wslink-launcher/launcher-template.json

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
  "visualizer", "/opt/paraview/install/share/paraview-5.5/web/visualizer/www" \
]

# Start the container
ENTRYPOINT ["/opt/paraviewweb/scripts/start.sh"]
