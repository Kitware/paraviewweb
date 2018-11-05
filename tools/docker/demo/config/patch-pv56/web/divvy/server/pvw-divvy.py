r"""
    This module is a ParaViewWeb server application.
    The following command line illustrates how to use it::

        $ pvpython -dr .../pvw-divvy.py --data /.../path-to-your-data-file

        --data
             Path used to load the data file

    Any ParaViewWeb executable script comes with a set of standard arguments that can be overriden if need be::

        --port 8080
             Port number on which the HTTP server will listen.

        --content /path-to-web-content/
             Directory that you want to serve as static web content.
             By default, this variable is empty which means that we rely on another
             server to deliver the static content and the current process only
             focuses on the WebSocket connectivity of clients.

        --authKey vtkweb-secret
             Secret key that should be provided by the client to allow it to make
             any WebSocket communication. The client will assume if none is given
             that the server expects "vtkweb-secret" as secret key.

"""
from __future__ import absolute_import, division, print_function

# import to process args
import os
import sys

# Try handle virtual env if provided
if '--virtual-env' in sys.argv:
  virtualEnvPath = sys.argv[sys.argv.index('--virtual-env') + 1]
  virtualEnv = virtualEnvPath + '/bin/activate_this.py'
  execfile(virtualEnv, dict(__file__=virtualEnv))


# import paraview modules.
from paraview.web import pv_wslink
from paraview.web import protocols as pv_protocols
from divvyProtocol import DivvyProtocol
from scatterplotProtocol import ScatterPlotProtocol

from paraview import simple
from wslink import server

import vtk

import argparse

# =============================================================================
# Create custom PVServerProtocol class to handle clients requests
# =============================================================================

class _DivvyServer(pv_wslink.PVServerProtocol):
    authKey = "wslink-secret"
    fileToLoad = None
    viewportScale=1.0
    viewportMaxWidth=2560
    viewportMaxHeight=1440

    @staticmethod
    def add_arguments(parser):
        parser.add_argument("--virtual-env", default=None, help="Path to virtual environment to use")
        parser.add_argument("--data", default=None, help="path to data file to load", dest="fileToLoad")
        parser.add_argument("--viewport-scale", default=1.0, type=float, help="Viewport scaling factor", dest="viewportScale")
        parser.add_argument("--viewport-max-width", default=2560, type=int, help="Viewport maximum size in width", dest="viewportMaxWidth")
        parser.add_argument("--viewport-max-height", default=1440, type=int, help="Viewport maximum size in height", dest="viewportMaxHeight")

    @staticmethod
    def configure(args):
        _DivvyServer.fileToLoad = args.fileToLoad
        _DivvyServer.authKey    = args.authKey
        _DivvyServer.viewportScale     = args.viewportScale
        _DivvyServer.viewportMaxWidth  = args.viewportMaxWidth
        _DivvyServer.viewportMaxHeight = args.viewportMaxHeight

    def initialize(self):
        # Bring used components
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebMouseHandler())
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebViewPort(_DivvyServer.viewportScale, _DivvyServer.viewportMaxWidth, _DivvyServer.viewportMaxHeight))
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebPublishImageDelivery(decode=False))

        colorManager = pv_protocols.ParaViewWebColorManager()
        self.registerVtkWebProtocol(colorManager)

        dataProtocol = DivvyProtocol(_DivvyServer.fileToLoad)
        self.registerVtkWebProtocol(dataProtocol)
        scatterplot = ScatterPlotProtocol(dataProtocol, colorManager)
        self.registerVtkWebProtocol(scatterplot)
        dataProtocol.setScatterPlot(scatterplot)
        scatterplot.attachListeners()

        self.updateSecret(_DivvyServer.authKey)

        # tell the C++ web app to use no encoding. ParaViewWebPublishImageDelivery must be set to decode=False to match.
        self.getApplication().SetImageEncoding(0);

# =============================================================================
# Main: Parse args and start server
# =============================================================================

if __name__ == "__main__":
    # Create argument parser
    parser = argparse.ArgumentParser(description="Divvy, your data analytic with ParaView")

    # Add default arguments
    server.add_arguments(parser)
    _DivvyServer.add_arguments(parser)
    args = parser.parse_args()
    _DivvyServer.configure(args)

    # Start server
    server.start_webserver(options=args, protocol=_DivvyServer)
