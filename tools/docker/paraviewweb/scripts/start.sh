#!/usr/bin/env bash

#
# Patches launcher configuration session url, then restarts the apache
# webserver and starts the launcher in the foreground.  You can optionally
# pass a custom session root url (e.g: "wss://www.example.com") which will
# be used instead of the default.
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

ROOT_URL="ws://localhost"

LAUNCHER_TEMPLATE_PATH=/opt/wslink-launcher/launcher-template.json
LAUNCHER_PATH=/opt/wslink-launcher/launcher.json

if [ "$#" -eq 1 ]
then
  ROOT_URL=$1
fi

INPUT=$(<"${LAUNCHER_TEMPLATE_PATH}")
OUTPUT="${INPUT//"SESSION_URL_ROOT"/$ROOT_URL}"
echo -e "$OUTPUT" > "${LAUNCHER_PATH}"

# Make sure the apache webserver is running
echo "Starting/Restarting Apache webserver"
service apache2 restart

# Run the pvw launcher in the foreground so this script doesn't end
echo "Starting the wslink launcher"
/opt/paraview/install/bin/pvpython /opt/paraview/install/lib/python2.7/site-packages/wslink/launcher.py ${LAUNCHER_PATH}
