# ParaViewWeb on  Windows

This readme described the process of setting up a Paraview Web Server instance on a Windows 10 workstation. Once the ParaView Web is setup, the Visualizer app may be embedded in some other application's web page (as an internal frame). 

## Download the correct binaries

This guide has been created while using Paraview 5.2.0 installation binaries. There are a few choices available and among those, the binary for Windows MPI was used. The following details were specified while downloading the file from http://www.paraview.org/download/

```
Version of ParaView: v5.2
Type of Download: ParaView Binary Installers
Operating System: Windows 64 bit
File to Download: ParaView-5.2.0-Qt4-OpenGL2-MPI-Windows-64bit.exe
```

Before installing ParaView, the following libraries need to be present:

- __Microsoft Message Passing Interface (MS MPI) Libraries__ - download the MS MPI libraries from the [Microsoft Website]

Run the downloaded executable file and follow the onscreen installation instructions to install the ParaView Desktop application. Once the application has been installed:

- Start the application, and
- Open a data file and check that the file is properly rendered by the application. Sample data files can be found bundled with the installer.

For the purpose of this document, the ParaView application is installed in `C:` drive in a directory named ParaView-5.2.0 (`C:\ParaView-5.2.0`). Henceforth, this directory will be referred to as `<paraview-root>`.

__It is recommended that the paraview application is installed in a path which does _not_  have spaces. For example, installing the application in `C:\Program Files\ParaView 5.2.0`  is NOT recommended.__

## Install Apache Web Server
The Apache web server acts as the front end to the ParaView Web application.

### Download Apache Web Server for Windows
The Apache web server is not natively supported on Windows. To get a Windows installer, a modified server can be downloaded from a number of third party vendors like:

- [ApacheHaus](http://www.apachehaus.com/cgi-bin/download.plx)
- [Apache Lounge](http://www.apachelounge.com/download/)

_Note:_ It is important to download the corresponding version of Visual C++ Runtime libraries

Once the Apache HTTPD is installed the server needs to be configured for:

- Virtual host
- Integration with ParaView Web

## Configuring the Apache httpd Server
For the purpose of this document, the Apache server is extracted to the `C:` drive in a directory named Apache24 (`C:\Apache24`). Henceforth, this directory will be referred to as `<apache-root>`.

### Adding Virtual Hosts
Open the `<apache-root>\conf\extra\httpd-vhosts.conf` file and add the following sections:

Grant all access rights in the <paraview-root> directory to the httpd server.

```
<Directory <paraview-root>>
  Require all granted
</Directory>
```

Create a default host config for traffic directed to `http://localhost`:

```
<VirtualHost *:80>
  DocumentRoot <apache-root>/htdocs
  ServerName localhost
</VirtualHost>
```

Create a virutal host named "paraview" which will be used for directing all traffic to the ParaView Web:

```
<VirtualHost *:80>
  ServerName   paraview
  ServerAdmin  admin@paraview.com
  DocumentRoot <paraview-root>/share/paraview-5.2/web/visualizer/www
  ErrorLog <paraview-root>/error.log
  CustomLog  <paraview-root>/log/apache2/access.log combined
  <Directory "<paraview-root>">
      Options Indexes FollowSymLinks
      Order allow,deny
      Allow from all
      AllowOverride None
      Require all granted
  </Directory>

  # Handle launcher forwarding
  # port and endpoint should match launcher.config
  ProxyPass /paraview http://localhost:9000/paraview

  # Handle WebSocket forwarding
  RewriteEngine On

  # This is the path the mapping file Jetty creates
  # path to proxy should match launcher.config
  RewriteMap session-to-port txt:<apache-root>/proxy.txt

  # This is the rewrite condition. Look for anything with a sessionId= in the
  # query part of the URL and capture the value to use below.
  RewriteCond %{QUERY_STRING} ^sessionId=(.*)&path=(.*)$ [NC]

  # This does the rewrite using the mapping file and the sessionId
  RewriteRule ^/proxy.*$  ws://${session-to-port:%1}/%2  [P]
</VirtualHost>
```

Save the `<apache-root>\conf\extra\httpd-vhosts.conf` file and:

1. create the folder(s): `<paraview-root>\log\apache2`
2. create an empty file named `proxy.txt` in the `<apache-root>` directory
3. open the `<apache-root>\conf\httpd.conf` file and enable (uncomment) the following modules:
  - vhost_alias
  - proxy
  - proxy_http
  - proxy_wstunnel
  - rewrite
4. open the `C:\Windows\System32\drivers\etc\hosts` file and add an entry for paraview:

```
127.0.0.1            paraview
<your-ip-address>    paraview
```

## Creating the ParaView Web Launcher configuration

Once the virtual hosts have been setup, the ParaView Web launcher configuration needs to be created so the requests for ParaView Web are processed appropriately. To do this, create a file named `launcher.config` in the ParaView installation directory. (`<paraview-root>\launcher.config`). The content of the file is as follows:

```
{
  "configuration": {
    "host" : "localhost",
    "port" : 9000,
    "endpoint": "paraview",
  "content": "<paraview-root>/share/paraview-5.2/web/visualizer/www",
    "proxy_file" : "<apache-root>/proxy.txt",
    "sessionURL" : "ws://paraview:80/proxy?sessionId=${id}&path=ws",
    "timeout" : 30,
    "log_dir" : "<paraview-root>/log/",
    "fields" : []
  },
  "resources" : [ {
  "host" : "localhost",
  "port_range" : [9001, 9999]
  } ],
  "properties" : {
    "python_exec" : "<paraview-root>/bin/pvpython.exe",
    "visualizer": "<paraview-root>/share/paraview-5.2/web/visualizer/server/pvw-visualizer.py"
  },
  "apps": {
    "visualizer": {
        "cmd": [
            "${python_exec}", "-dr", "${visualizer}", "--port", "${port}", "--authKey", "${secret}",  "--data", "${dataDir}", "--load-file", "${dataFile}"
        ],
        "ready_line" : "Starting factory"
    }
  }
}
```

## Modify the index.html
Add the following script to the `<paraview-root>\share\paraview-5.2\web\visualizer\www\index.html` file (replace the existing script):

```
<script>    
  function getFileToLoad() {
    var directoryPath = window.name;
    var filename = directoryPath.split('\\').slice(-1).join('\\');
    var directory = directoryPath.substring(0, directoryPath.indexOf(filename));
    return {
      dataFile:filename,
      dataDir:directory
    };
  };
  Visualizer.connect({
      application: 'visualizer',
      dataFile: getFileToLoad().dataFile,
      dataDir: getFileToLoad().dataDir
  });
  Visualizer.autoStopServer(10);
</script>
```

In the above script, the following properties are being passed:

- __dataFile__ - the name of the file to be rendered in the Visualizer
- __dataDir__ - the location of the data directory under which the data file(s) are present

If the dataDir location is fixed then it can be hard coded in the script, and only the dataFile name needs to be passed. In such a case, the following script should be used:

```
// grab the parameter from the URL
function getUrlParameter(name) {
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

Visualizer.connect({
  application: 'visualizer',
  dataFile: getUrlParameter('data'),
  dataDir: 'C:\\SomeFolder\\Data\\Files'
});
```

The URL to invoke this would be: `http://paraview/?data=can.ex2`

## Starting up from the command line

Open a command prompt to run each of the following:

- Start the apache httd server by running: `<apache-root>\bin\httpd.exe`
- Create a launcher script (`launcher.bat`) to start the ParaView Web Server with the following commands:

```
set PV_HOME=<paraview-root>
%PV_HOME%\bin\pvpython.exe %PV_HOME%\bin\Lib\site-packages\vtk\web\launcher.py %PV_HOME%\launcher.config
```

Run `launcher.bat` file


[Microsoft Website]: https://msdn.microsoft.com/en-us/library/bb524831(v=vs.85).aspx
