#!/usr/bin/env bash

#
# Patches launcher configuration session url, as well as perhaps any
# additional arguments to pvpython, then restarts the apache webserver
# and starts the launcher in the foreground.  You can optionally pass a
# custom session root url (e.g: "wss://www.example.com") which will be
# used instead of the default.
#
# You can also pass extra arguments after the session url that will be
# provided as extra arguments to pvpython.  In this case, you must also
# pass the session url argument first.
#
# Examples
#
# To just accept the defaults of "ws://localhost":
#
#     ./start.sh
#
# To choose 'wss' and 'www.customhost.com':
#
#     ./start.sh "wss://www.customhost.com"
#
# Makes the assumption that there is a template launcher config where the
# "sessionURL" key/value looks like:
#
#     "sessionURL": "SESSION_URL_ROOT/proxy?sessionId=${id}&path=ws"
#
# To add extra arguments to be passed to pvpython:
#
#     ./start.sh "ws://localhost" -dr "--mesa-swr"
#

ROOT_URL="ws://localhost"
REPLACEMENT_ARGS=""

LAUNCHER_TEMPLATE_PATH=/opt/wslink-launcher/launcher-template.json
LAUNCHER_PATH=/opt/wslink-launcher/launcher.json

if [ "$#" -ge 1 ]
then
  ROOT_URL=$1
  shift

  while (($#))
  do
    REPLACEMENT_ARGS="${REPLACEMENT_ARGS}\"$1\", "
    shift
  done
fi

INPUT=$(<"${LAUNCHER_TEMPLATE_PATH}")
OUTPUT="${INPUT//"SESSION_URL_ROOT"/$ROOT_URL}"
OUTPUT="${OUTPUT//"EXTRA_PVPYTHON_ARGS"/$REPLACEMENT_ARGS}"
echo -e "$OUTPUT" > "${LAUNCHER_PATH}"

# Make sure the apache webserver is running
echo "Starting/Restarting Apache webserver"
service apache2 restart

# Run the pvw launcher in the foreground so this script doesn't end
echo "Starting the wslink launcher"
/opt/paraview/install/bin/pvpython /opt/paraview/install/lib/python2.7/site-packages/wslink/launcher.py ${LAUNCHER_PATH}
