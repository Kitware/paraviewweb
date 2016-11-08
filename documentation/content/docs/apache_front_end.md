# Using Apache as a front end

## Introduction

In order to use Apache as a front end for ParaViewWeb, we recommend that you use version 2.4.7 or later of Apache.  This is because as of version 2.4.7 Apache has, out of the box, everything required for it to serve as a ParaViewWeb front end.

Once Apache is ready to run, you will need to configure it together with your chosen launcher (see [Multi-User Setup](multi_user_setup.html) for information) to manage visualization sessions.

## Getting Apache

The easiest thing to do is just to install Apache from a package.  On recent Ubuntu distributions, this can be done as follows:

``` bash
$ sudo apt-get install apache2-dev apache2 libapr1-dev apache2-utils
```

## Configure Apache httpd for use with ParaViewWeb

Next we address the configuration of Apache for use with ParaViewWeb.

### Create a proxy/mapping file

Choose a directory for the mapping file that the launcher and Apache use to communicate about sessions and port locations.  Then create a group so that both components have access to the file.  For the purpose of these instructions, assume the full path to the directory you have chosen is `<MAPPING-FILE-DIR>`, assume that `daemon` is the user who will run Apache, and assume that `pvw-user` is the user who will run the launcher and you are logged in as this user.  Then you would do the following:

``` bash
$ sudo mkdir -p <MAPPING-FILE-DIR>
$ sudo touch <MAPPING-FILE-DIR>/proxy.txt
$ sudo groupadd mappingfileusers
$ sudo usermod -a -G mappingfileusers pvw-user
$ newgrp mappingfileusers
$ sudo usermod -a -G mappingfileusers daemon
$ sudo chgrp mappingfileusers <MAPPING-FILE-DIR>/proxy.txt
$ sudo chmod 660 <MAPPING-FILE-DIR>/proxy.txt
```

### Add a virtual host

Now add a virtual host to the Apache configuration.

In this case you should create a file in `/etc/apache2/sites-available/` and make a symbolic link to it from `/etc/apache2/sites-enabled/`.  We'll assume you named this file `001-pvw.conf`.

In either case, make sure to replace the `ServerName` value (shown below as `${MY-SERVER-NAME}`) with the correct host name.  Also make sure the `DocumentRoot` value (shown below as `${MY-DOCUMENT-ROOT}`) makes sense for your particular deployment, we typically point it at the `www` directory of the ParaView build or install tree.  Additionally, be sure to change `${MAPPING-FILE-DIR}` to the real location where you have put the map file.

```apache
<VirtualHost *:80>
    ServerName ${MY-SERVER-NAME}
    ServerAdmin webmaster@example-host.example.com
    DocumentRoot ${MY-DOCUMENT-ROOT}
    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined

    ### The following commented lines could be useful when running
    ### over https and wss:
    # SSLEngine On
    # SSLCertificateFile    /etc/apache2/ssl/your_certificate.crt
    # SSLCertificateKeyFile /etc/apache2/ssl/your_domain_key.key
    # SSLCertificateChainFile /etc/apache2/ssl/DigiCertCA.crt
    #
    # <Location ${MY-DOCUMENT-ROOT} >
    #   SSLRequireSSL On
    #   SSLVerifyClient optional
    #   SSLVerifyDepth 1
    #   SSLOptions +StdEnvVars +StrictRequire
    # </Location>

    # Rule for ParaViewWeb launcher
    ProxyPass /paraview http://localhost:9000/paraview

    # Rewrite setup for ParaViewWeb
    RewriteEngine On

    # This is the path the mapping file Jetty creates
    RewriteMap session-to-port txt:${MAPPING-FILE-DIR}/proxy.txt

    # This is the rewrite condition. Look for anything with a sessionId= in the query part of the URL and capture the value to use below.
    RewriteCond %{QUERY_STRING}     ^sessionId=(.*)&path=(.*)$ [NC]

    # This does the rewrite using the mapping file and the sessionId
    RewriteRule    ^/proxy.*$  ws://${session-to-port:%1}/%2  [P]

    <Directory "${MY-DOCUMENT-ROOT}">
        Options Indexes FollowSymLinks
        Order allow,deny
        Allow from all
        AllowOverride None
        Require all granted
    </Directory>
    
</VirtualHost>
```

#### Enable required modules

First of all, you will need to enable the modules that will be used by our ParaViewWeb virtual host.

``` bash
$ sudo a2enmod vhost_alias
$ sudo a2enmod proxy
$ sudo a2enmod proxy_http
$ sudo a2enmod proxy_wstunnel
$ sudo a2enmod rewrite
```

Then enable the virtual host you created above and restart Apache

``` bash
$ sudo a2ensite 001-pvw.conf
$ sudo service apache2 restart
```

If you run into problems with your new virtual host listening properly, you may need to disable the default virtual hosts file as follows:

``` bash
$ sudo a2dissite 000-default.conf
```
