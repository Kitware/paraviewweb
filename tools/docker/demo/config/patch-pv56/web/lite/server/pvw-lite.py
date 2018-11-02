r"""
    This module is a ParaViewWeb server application.
    The following command line illustrates how to use it::

        $ pvpython -dr .../pvw-lite.py --data /.../path-to-your-data-directory

        --data
             Path used to list that directory on the server and let the client choose a
             file to load.  You may also specify multiple directories, each with a name
             that should be displayed as the top-level name of the directory in the UI.
             If this parameter takes the form: "name1=path1|name2=path2|...",
             then we will treat this as the case where multiple data directories are
             required.  In this case, each top-level directory will be given the name
             associated with the directory in the argument.

        --load-file try to load the file relative to data-dir if any.

        --ds-host None
             Host name where pvserver has been started

        --ds-port 11111
              Port number to use to connect to pvserver

        --rs-host None
              Host name where renderserver has been started

        --rs-port 22222
              Port number to use to connect to the renderserver

        --exclude-regex "[0-9]+\\."
              Regular expression used to filter out files in directory/file listing.

        --group-regex "^\\.|~$|^\\$"
              Regular expression used to group files into a single loadable entity.

        --plugins
            Colon-separated (':') list of fully qualified path names to plugin objects
            to load.

        --color-palette-file
            File to load to define a set of color maps.  File format is the same as
            for ParaViews 'ColorMaps.xml' configuration file.

        --reverse-connect-port
            If supplied, a reverse connection will be established on the given port.
            This option is useful when running in mpi mode and you want pvservers to
            connect to this pvpython application.

        --save-data-dir
            Server directory under which all data will be saved.  Data, state, and
            screenshots can be saved to relative paths under this directory.

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

# import to process args
import os
import sys

# Try handle virtual env if provided
if '--virtual-env' in sys.argv:
  virtualEnvPath = sys.argv[sys.argv.index('--virtual-env') + 1]
  virtualEnv = virtualEnvPath + '/bin/activate_this.py'
  execfile(virtualEnv, dict(__file__=virtualEnv))

# Use local proxy file
defaultProxyFile = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'proxies.json')

# import paraview modules.
from paraview.web import pv_wslink
from paraview.web import protocols as pv_protocols

# import RPC annotation
from wslink import register as exportRpc

from paraview import simple
from wslink import server

import lite_protocols as local_protocols

import argparse

# =============================================================================
# Create custom Pipeline Manager class to handle clients requests
# =============================================================================

class _Server(pv_wslink.PVServerProtocol):

    dataDir = os.getcwd()
    authKey = "wslink-secret"
    dsHost = None
    dsPort = 11111
    rsHost = None
    rsPort = 11111
    rcPort = -1
    fileToLoad = None
    groupRegex = "[0-9]+\\.[0-9]+\\.|[0-9]+\\."
    excludeRegex = "^\\.|~$|^\\$"
    plugins = None
    filterFile = None
    colorPalette = None
    proxies = None
    allReaders = True
    saveDataDir = os.getcwd()
    viewportScale=1.0
    viewportMaxWidth=2560
    viewportMaxHeight=1440
    settingsLODThreshold = 102400

    @staticmethod
    def add_arguments(parser):
        parser.add_argument("--virtual-env", default=None, help="Path to virtual environment to use")
        parser.add_argument("--data", default=os.getcwd(), help="path to data directory to list, or else multiple directories given as 'name1=path1|name2=path2|...'", dest="path")
        parser.add_argument("--load-file", default=None, help="File to load if any based on data-dir base path", dest="file")
        parser.add_argument("--color-palette-file", default=None, help="File to load to define a set of color map", dest="palettes")
        parser.add_argument("--no-built-in-palette", help="If provided, disables built-in color maps", action="store_true", dest="hide_built_in_color_maps")
        parser.add_argument("--ds-host", default=None, help="Hostname to connect to for DataServer", dest="dsHost")
        parser.add_argument("--ds-port", default=11111, type=int, help="Port number to connect to for DataServer", dest="dsPort")
        parser.add_argument("--rs-host", default=None, help="Hostname to connect to for RenderServer", dest="rsHost")
        parser.add_argument("--rs-port", default=11111, type=int, help="Port number to connect to for RenderServer", dest="rsPort")
        parser.add_argument("--reverse-connect-port", default=-1, type=int, help="If supplied, a reverse connection will be established on the given port", dest="reverseConnectPort")
        parser.add_argument("--exclude-regex", default=_Server.excludeRegex, help="Regular expression for file filtering", dest="exclude")
        parser.add_argument("--group-regex", default=_Server.groupRegex, help="Regular expression for grouping files", dest="group")
        parser.add_argument("--plugins", default=None, help="List of fully qualified path names to plugin objects to load", dest="plugins")
        parser.add_argument("--proxies", default=defaultProxyFile, help="Path to a file with json text containing filters to load", dest="proxies")
        parser.add_argument("--no-auto-readers", help="If provided, disables ability to use non-configured readers", action="store_true", dest="no_auto_readers")
        parser.add_argument("--save-data-dir", default='', help="Server directory under which all data will be saved", dest="saveDataDir")
        parser.add_argument("--viewport-scale", default=1.0, type=float, help="Viewport scaling factor", dest="viewportScale")
        parser.add_argument("--viewport-max-width", default=2560, type=int, help="Viewport maximum size in width", dest="viewportMaxWidth")
        parser.add_argument("--viewport-max-height", default=1440, type=int, help="Viewport maximum size in height", dest="viewportMaxHeight")
        parser.add_argument("--settings-lod-threshold", default=102400, type=int, help="LOD Threshold in Megabytes", dest="settingsLODThreshold")

    @staticmethod
    def configure(args):
        _Server.authKey              = args.authKey
        _Server.dataDir              = args.path
        _Server.dsHost               = args.dsHost
        _Server.dsPort               = args.dsPort
        _Server.rsHost               = args.rsHost
        _Server.rsPort               = args.rsPort
        _Server.rcPort               = args.reverseConnectPort
        _Server.excludeRegex         = args.exclude
        _Server.groupRegex           = args.group
        _Server.plugins              = args.plugins
        _Server.proxies              = args.proxies
        _Server.colorPalette         = args.palettes
        _Server.viewportScale        = args.viewportScale
        _Server.viewportMaxWidth     = args.viewportMaxWidth
        _Server.viewportMaxHeight    = args.viewportMaxHeight
        _Server.settingsLODThreshold = args.settingsLODThreshold
        _Server.allReaders           = not args.no_auto_readers
        _Server.showBuiltin          = not args.hide_built_in_color_maps

        # If no save directory is provided, default it to the data directory
        if args.saveDataDir == '':
            _Server.saveDataDir = _Server.dataDir
        else:
            _Server.saveDataDir = args.saveDataDir

        if args.file:
            _Server.fileToLoad  = os.path.join(args.path, args.file)

    def initialize(self):
        # Bring used components from ParaView
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebStartupRemoteConnection(_Server.dsHost, _Server.dsPort, _Server.rsHost, _Server.rsPort, _Server.rcPort))
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebStartupPluginLoader(_Server.plugins))
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebFileListing(_Server.dataDir, "Home", _Server.excludeRegex, _Server.groupRegex))
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebProxyManager(allowedProxiesFile=_Server.proxies, baseDir=_Server.dataDir, fileToLoad=_Server.fileToLoad, allowUnconfiguredReaders=_Server.allReaders))
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebColorManager(pathToColorMaps=_Server.colorPalette, showBuiltin=_Server.showBuiltin))
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebMouseHandler())
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebViewPort(_Server.viewportScale, _Server.viewportMaxWidth, _Server.viewportMaxHeight))
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebPublishImageDelivery(decode=False))
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebTimeHandler())
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebSelectionHandler())
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebWidgetManager())
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebKeyValuePairStore())
        self.registerVtkWebProtocol(pv_protocols.ParaViewWebSaveData(baseSavePath=_Server.saveDataDir))

        # Bring used components from ParaView Lite
        self.registerVtkWebProtocol(local_protocols.ParaViewLite())

        # Update authentication key to use
        self.updateSecret(_Server.authKey)

        # tell the C++ web app to use no encoding. ParaViewWebPublishImageDelivery must be set to decode=False to match.
        self.getApplication().SetImageEncoding(0);

        # Disable interactor-based render calls
        view = simple.GetRenderView()
        view.EnableRenderOnInteraction = 0
        view.Background = [0.4470588235294118, 0.4470588235294118, 0.4470588235294118]
        view.Background2 = [0.2235294117647059, 0.2235294117647059, 0.2235294117647059]
        view.UseGradientBackground = 1
        view.OrientationAxesVisibility = 0

        # ProxyManager helper
        pxm = simple.servermanager.ProxyManager()

        # Update interaction mode
        interactionProxy = pxm.GetProxy('settings', 'RenderViewInteractionSettings')
        interactionProxy.Camera3DManipulators = ['Rotate', 'Pan', 'Zoom', 'Pan', 'Roll', 'Pan', 'Zoom', 'Rotate', 'Zoom']

        # Custom rendering settings
        renderingSettings = pxm.GetProxy('settings', 'RenderViewSettings')
        renderingSettings.LODThreshold = _Server.settingsLODThreshold

# =============================================================================
# Main: Parse args and start server
# =============================================================================

if __name__ == "__main__":
    # Create argument parser
    parser = argparse.ArgumentParser(description="ParaView Lite")

    # Add arguments
    server.add_arguments(parser)
    _Server.add_arguments(parser)
    args = parser.parse_args()
    _Server.configure(args)

    # Start server
    server.start_webserver(options=args, protocol=_Server)
