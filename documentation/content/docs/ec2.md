## ParaViewWeb on EC2

We have built Docker images containing ParaView 5.5 for NVidia GPUs w/ EGL rendering support for ParaViewWeb.  You can find these images [here](https://hub.docker.com/r/kitware/paraviewweb). One of them exposes Visualizer as a standalone deployment.

A similar image exist for CPU only using OSMesa-lvm.

## Example deployment on EC2

For this setup we have used an AWS EC2 instance with an NVidia GPU, and running Ubuntu 16.04.  Below we describe the steps.

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

    sudo apt-get update
    sudo apt-get install docker-ce

Now we can install the `nvidia-docker2` package, using a similar approach to the one just above.  First install the `nvidia-docker` gpg key:

    curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -

Add sources from the `nvidia-docker` sources list to `apt`:

```
    curl -s -L https://nvidia.github.io/nvidia-docker/ubuntu16.04/nvidia-docker.list | \
        sudo tee /etc/apt/sources.list.d/nvidia-docker.list
```

Update the package index again, install `nvidia-docker2`, then reload the docker daemon configuration:

    sudo apt-get update
    sudo apt-get install nvidia-docker2
    sudo pkill -SIGHUP dockerd

Verify that it's working:

```
    sudo docker run --runtime=nvidia --rm nvidia/cuda nvidia-smi
    Unable to find image 'nvidia/cuda:latest' locally
    latest: Pulling from nvidia/cuda
    297061f60c36: Pull complete
    e9ccef17b516: Pull complete
    dbc33716854d: Pull complete
    8fe36b178d25: Pull complete
    686596545a94: Pull complete
    f611dfbee954: Pull complete
    c51814f3e9ba: Pull complete
    5da0fc07e73a: Pull complete
    97462b1887aa: Pull complete
    924ea239f6fe: Pull complete
    Digest: sha256:69f3780f80a72cb7cebc7f401a716370f79412c5aa9362306005ca4eb84d0f3c
    Status: Downloaded newer image for nvidia/cuda:latest
    Thu May 17 19:56:53 2018
    +-----------------------------------------------------------------------------+
    | NVIDIA-SMI 384.111                Driver Version: 384.111                   |
    |-------------------------------+----------------------+----------------------+
    | GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
    | Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
    |===============================+======================+======================|
    |   0  GRID K520           Off  | 00000000:00:03.0 Off |                  N/A |
    | N/A   37C    P0    37W / 125W |      0MiB /  4036MiB |      0%      Default |
    +-------------------------------+----------------------+----------------------+
    
    +-----------------------------------------------------------------------------+
    | Processes:                                                       GPU Memory |
    |  GPU       PID   Type   Process name                             Usage      |
    |=============================================================================|
    |  No running processes found                                                 |
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
    sudo docker run --runtime=nvidia -p 127.0.0.1:8081:80 -t -i -v <host-data-directory>:/data kitware/paraviewweb:pvw-visualizer-5.5.0 "ws://<ec2-hostname-or-ip>"
```

You will obviously replace `<host-data-directory>` with some real directory where your datasets are located, and replace `<ec2-hostname-or-ip>` with the actual hostname or IP address of the instance.

### Try it out

If you chose to create a simple landing page, just point your browser at the running instance now:

    http://<ec2-hostname-or-ip>

Otherwise, you can point straight through to ParaViewWeb Visualizer:

    http://<ec2-hostname-or-ip>/visualizer

### Help and support

Please [contact us](http://www.kitware.com/products/support.html) if you need help with deployment or custom development.
