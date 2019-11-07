## ParaViewWeb on EC2

We have built Docker images containing ParaView 5.5 which support ParaViewWeb applications.  These images currently come in two flavors: One for NVidia GPUs w/ EGL rendering support, and another with support for OSMesa (including the `llvm` and `swr` rendering backends).  You can find these images [here](https://hub.docker.com/r/kitware/paraviewweb).  Each of the flavors mentioned above exposes Visualizer as a standalone deployment.

## Example deployment on EC2

For this setup we have used an AWS EC2 instance with an NVidia GPU, and running Ubuntu 16.04.  Below we describe the steps.  Note that if your instance doesn't have an NVidia GPU, you can still try the `osmesa` image.  For that, just skip the instructions having to do with graphics card driver installation and `nvidia-docker2` package installation, and use the `osmesa` run example at the bottom of this document.  All the rest of the steps should remain the same.

### Machine setup

Update system packages:

    sudo apt-get update
    sudo apt-get upgrade
    sudo apt-get dist-upgrade
    sudo reboot

Install graphics card drivers

    sudo apt-get install nvidia-384
    sudo reboot

Check graphics card driver installation:

```
    nvidia-smi -q | head
    ==============NVSMI LOG==============

    Timestamp                           : Thu May 17 19:51:05 2018
    Driver Version                      : 384.111

    Attached GPUs                       : 1
    GPU 00000000:00:03.0
        Product Name                    : GRID K520
        Product Brand                   : Grid
```

To install Docker, first install their official GPG key:

    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

Check it by verifying the last 8 characters:

```
    sudo apt-key fingerprint 0EBFCD88
    pub   4096R/0EBFCD88 2017-02-22
          Key fingerprint = 9DC8 5822 9FC7 DD38 854A  E2D8 8D81 803C 0EBF CD88
    uid                  Docker Release (CE deb) <docker@docker.com>
    sub   4096R/F273FCD8 2017-02-22
```

Now set up the "stable" repository:

```
    sudo add-apt-repository \
        "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) \
        stable"
```

Then update the package index and install Docker community edition:

```
    sudo apt-get update
    sudo apt-get install docker-ce
```

Note that the `nvidia-docker2` package is now deprecated (as of Docker 19.03), and the current way of installing nvidia support for gpus within containers is as follows:

```
    # Add the package repositories
    distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
    curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
    curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

    sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
    sudo systemctl restart docker
```

See the source of that documentation [here](https://github.com/NVIDIA/nvidia-docker) for full details.

Verify that it's working:

```
    sudo docker run --rm --gpus all nvidia/cuda:9.0-base nvidia-smi
    Wed Nov  6 23:34:43 2019       
    +-----------------------------------------------------------------------------+
    | NVIDIA-SMI 430.50       Driver Version: 430.50       CUDA Version: 10.1     |
    |-------------------------------+----------------------+----------------------+
    | GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
    | Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
    |===============================+======================+======================|
    |   0  GeForce RTX 208...  Off  | 00000000:04:00.0  On |                  N/A |
    | 30%   46C    P5    29W / 250W |   1864MiB / 11019MiB |     11%      Default |
    +-------------------------------+----------------------+----------------------+
                                                                                   
    +-----------------------------------------------------------------------------+
    | Processes:                                                       GPU Memory |
    |  GPU       PID   Type   Process name                             Usage      |
    |=============================================================================|
    +-----------------------------------------------------------------------------+
```

### Setting up a world-facing WebServer

We installed Apache on the instance to act as the front-end for our webapps.  All we needed was the `apache2` package and some confguration.

    sudo apt-get install apache2

Now we can configure that webserver.  First enable some extra modules, saving the restart for last:

    sudo a2enmod vhost_alias
    sudo a2enmod proxy
    sudo a2enmod proxy_http
    sudo a2enmod proxy_wstunnel

Create a simple virtual host configuration:

    sudo vim /etc/apache2/sites-available/001-pvw-forward.conf

Just paste this content there for a start:

```
    <VirtualHost *:80>
      ServerName   some.example.com
      ServerAdmin  youremail@example.com
      DocumentRoot /home/ubuntu/paraviewweb-docker/testsite/www
      ErrorLog /home/ubuntu/paraviewweb-docker/testsite/logs/error.log
      CustomLog /home/ubuntu/paraviewweb-docker/testsite/logs/access.log combined

      <Directory /home/ubuntu/paraviewweb-docker/testsite/www>
        Options Indexes FollowSymLinks
        Order allow,deny
        Allow from all
        AllowOverride None
        Require all granted
      </Directory>

      # Handle requests for visualizer
      ProxyPass /visualizer http://localhost:8081/visualizer
      ProxyPassReverse /visualizer http://localhost:8081/visualizer

      # Handle launcher forwarding
      ProxyPass /paraview http://localhost:8081/paraview

      # Handle websocket forwarding
      ProxyPass /proxy ws://localhost:8081/proxy

    </VirtualHost>
```

Now create the simple website directory structure and possibly add a basic landing page:

    mkdir -p /home/ubuntu/paraviewweb-docker/testsite/www
    mkdir /home/ubuntu/paraviewweb-docker/testsite/logs
    vim /home/ubuntu/paraviewweb-docker/testsite/www/index.html

Here you could copy the following example landing page, though it's not really necessary for validation of the ParaViewWeb Docker image:

```
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
        <title>Test Web Site</title>
      </head>
      <body>
        <h1> Test </h1>
        <a href="visualizer">Visualizer</a>
      </body>
    </html>
```

Now disable the default site, and enable the one you created above, and finally restart the webserver:
    
    sudo a2dissite 000-default
    sudo a2ensite 001-pvw-forward
    sudo service apache2 restart

All that's left is to run the docker image as follows:

```
    sudo docker run --gpus all                     \
        -p 127.0.0.1:8081:80                        \
        -v <host-data-directory>:/data               \
        -e "SERVER_NAME=<ec2-hostname-or-ip[:port]>"  \
        -e "PROTOCOL=ws"                               \
        -ti kitware/paraviewweb:pvw-visualizer-5.5.0
```

Do not forget to replace `<host-data-directory>` with some real directory where your datasets are located, and replace `<ec2-hostname-or-ip[:port]>` with the actual hostname or IP address (and possibly port) of the instance.

Some other run examples follow.  To run the osmesa image, you don't need the `--gpus` argument:

```
    sudo docker run                                \
        -p 127.0.0.1:8081:80                        \
        -v <host-data-directory>:/data               \
        -e "SERVER_NAME=<ec2-hostname-or-ip[:port]>"  \
        -e "PROTOCOL=ws"                               \
        -ti kitware/paraviewweb:pvw-visualizer-osmesa-5.5.0
```

Additionally, extra arguments can be passed to the `pvpython` process that will be launched by providing the "EXTRA_PVPYTHON_ARGS" environment variable in the docker command.  For example, you could pick the `swr` rendering backend while at the same time preventing loading of ParaView registry values like this:

```
    sudo docker run                                \
        -p 127.0.0.1:8081:80                        \
        -v <host-data-directory>:/data               \
        -e "SERVER_NAME=<ec2-hostname-or-ip[:port]>"  \
        -e "PROTOCOL=ws"                               \
        -e "EXTRA_PVPYTHON_ARGS=-dr,--mesa-swr"         \
        -ti kitware/paraviewweb:pvw-visualizer-osmesa-5.5.0
```

Note in the above that the extra pvpython args are comma-separated, with no additional spaces inserted.

### Try it out

If you chose to create a simple landing page, just point your browser at the running instance now:

    http://<ec2-hostname-or-ip>

Otherwise, you can point straight through to ParaViewWeb Visualizer:

    http://<ec2-hostname-or-ip>/visualizer

### Help and support

Please [contact us](http://www.kitware.com/products/support.html) if you need help with deployment or custom development.
