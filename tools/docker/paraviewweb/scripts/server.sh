#!/usr/bin/env bash

# Check for a requirements.txt in the mounted root, "/pvw/requirements.txt".
# If we find it, we can pip install those.
if [ -f "/pvw/requirements.txt" ]
then
  if [ -z "${SYSTEM_PYTHON_PIP}" ]; then
    PIP_CMD=pip
  else
    PIP_CMD="${!SYSTEM_PYTHON_PIP}"
  fi
  "${PIP_CMD}" install -r "/pvw/requirements.txt"
fi

# Copy the launcher config into the location where the start script expects
# to find it.  The config may or may not have replacement values in it, if it
# does not, the start script will not change it in any way.  Here we expect
# that the user doing the "docker run ..." has set up an external directory
# containing a "launcher/config.json" filepath and mounts that path as "/pvw".
cp /pvw/launcher/config.json /opt/launcher/config-template.json

# This rewrites the apache configuration so that "DocumentRoot" is set to
# /pvw/www and a single <Directory> entry is added for that same path.  Again,
# this assumes the user doing the "docker run ..." has set up an external
# directory containing a "www" directory and mounts that path as "/pvw".
if [ -f "/pvw/endpoints.txt" ]
then
  /opt/paraviewweb/scripts/addEndpoints.sh $(cat /pvw/endpoints.txt)
else
  /opt/paraviewweb/scripts/addEndpoints.sh "DOCUMENT-ROOT-DIRECTORY" "/pvw/www"
fi

# This performs replacements on the launcher-template.json copied into place
# above, based on the presence of environment variables passed with "-e" to the
# "docker run ..." command.
/opt/paraviewweb/scripts/start.sh
