# ParaView 5.6

This guide gather setups and command lines that can be used to configure a linux box as a ParaViewWeb server using our ParaView 5.6 docker image.

We split that `How to` into sections assuming we start from a clean system like the one you get on an EC2 instance. Therefore, it will be up to you to skip the sections that may not apply to your setup.

This guide assume a Linux Ubuntu 16 or 18 with a Nvidia GPU that support EGL. 

## Required packages

### Package installation

If you want to update your system, you can run the following set of commands.

```
sudo apt-get update
sudo apt-get upgrade
=> GRUB: Install maintainers version

sudo apt-get dist-upgrade
=> GRUB: Install maintainers version

sudo apt-get install nvidia-384
```

If you plan to add a webserver as frontend, you can run the following command. Apache can be used for the following set of reasons.
  1. Expose your service over HTTPS instead of the plain HTTP that the   docker image will provide.
  2. Expose other services or web content to the same endpoint.

```
sudo apt-get install apache2-dev apache2 libapr1-dev apache2-utils
```

Then after those updates, a reboot is in order.

```
sudo reboot
```

### Docker runtime installation

If you don't have Docker already installed on your system, you can get the runtime by running the following commands.

```
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo apt-key fingerprint 0EBFCD88
sudo add-apt-repository \
  "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) \
  stable"

sudo apt-get update
sudo apt-get install docker-ce
```

For levergaring your GPU and get better performances, you will need to add the nvidia runtime for docker. A full guide on how to do it is available [here](https://github.com/NVIDIA/nvidia-docker), but a summary is also availble below assuming things didn't change.

```
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | \
  sudo apt-key add -
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update
sudo apt-get install nvidia-docker2
sudo pkill -SIGHUP dockerd
```

Then if you want to make sure the new runtime works, you can run the following command.

```
sudo docker run --runtime=nvidia --rm nvidia/cuda:9.0-base nvidia-smi
```

### Apache configuration

This section can be skipped if you don't plan to use Apache as front end to expose your service over HTTPS. 

For that frontend, we will need a couple of module that we will enable with the following command lines.

```
sudo a2enmod vhost_alias
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod rewrite
sudo a2enmod headers
sudo a2enmod ssl
sudo service apache2 restart
```

In the following section some elements should be replaced by the user accordingly. Here is the list of fields the user will have to provide.

- `${SERVER_NAME}`: This is the host that can be used to reach your server. The full set of characters should be replace by something valid like __www.kitware.com__ or __pvw.company.com__.
- `${DOMAIN_CERT}`: This is the name of your certificate file for securing your HTTPS connection.

Then we will create 2 virtual host, one listening on HTTP that will redirect to its HTTPS counter part.

So you should create the following content in a new file `/etc/apache2/sites-available/001-pvw.conf`.

```
<VirtualHost *:80>
  ServerName   ${SERVER_NAME}
  Redirect permanent / https://${SERVER_NAME}/
</VirtualHost>
```

The same for HTTPS in a new file `/etc/apache2/sites-available/002-pvw-https.conf`.

```
<VirtualHost *:443>
  ProxyPreserveHost On
  ServerName   ${SERVER_NAME}
  ErrorLog /var/log/apache2/001-pvw_error.log
  CustomLog /var/log/apache2/001-pvw_access.log combined

  SSLEngine on
  SSLCertificateFile      "/etc/apache2/ssl/${DOMAIN_CERT}.crt"
  SSLCertificateKeyFile   "/etc/apache2/ssl/${DOMAIN_CERT}.key"
  SSLCertificateChainFile "/etc/apache2/ssl/DigiCertCA.crt"
  SSLProxyEngine on

  # Handle websocket forwarding
  ProxyPass /proxy ws://localhost:9000/proxy

  # Main server
  ProxyPass        / http://localhost:9000/
  ProxyPassReverse / http://localhost:9000/
</VirtualHost>
```

Now that we have those 2 new Virtual Host, lets disable the default one and enable ours.

```
sudo a2dissite 000-default.conf
sudo a2ensite 002-pvw-https
sudo a2ensite 001-pvw
```

Now you should restart Apache so all the changes became active.

```
sudo service apache2 restart
```

## Run ParaView Docker image

Now we just need to start our service via docker to serve the ParaViewWeb applications on our current hardware. For that we will run the image as a Daemon, but you could edit the docker command line to better match what you are trying to do.

In the following command some fields need to be changed to match the user needs. Here is the list of fields the user will have to provide.

- `${SERVER_NAME}`: This is the host that can be used to reach your server. The full set of characters should be replace by something valid like __www.kitware.com__ or __pvw.company.com__.
- `${PROTOCOL}`: If you are connecting using __http://__ then the value should be __ws__ while if you setup Apache or something else to provide a secure connection via __https://__ then the value should be __wss__
- `${DATA}`: This is a local path on your system where your data files are stored so that the Web application will have access and load them.
- `${PORT}`: The port that you want the docker image to run on. For the Apache virtual host configuration, we assume the value to be `9000`.

So the command line should looks like that:

```
PORT=9000
DATA=/mnt/data
SERVER_NAME=pvw.company.com

sudo docker run --runtime=nvidia             \
    -p 0.0.0.0:${PORT}:80                     \
    -v ${DATA}:/data                           \
    --restart unless-stopped                    \
    -dti kitware/paraviewweb:pvw-egl-demo-v5.6.0 \
    "${PROTOCOL}://${SERVER_NAME}/"
```
And you can access it by pointing your browser to `https://${SERVER_NAME}/`, assuming you used Apache for HTTPS as frontend.

If you want to stop the service you can look for the container ID using the `sudo docker ps` command line. Then you can stop it with this other command `sudo docker stop ${CONTAINER_ID}`.

Also if you just want to run it locally to demo it as a process, that you can kill with a `ctrl+c`, you can use the following command line.

```
sudo docker run --runtime=nvidia             \
    -p 0.0.0.0:9000:80                        \
    -v ~:/data                                 \
    -ti kitware/paraviewweb:pvw-egl-demo-v5.6.0 \
    "ws://localhost:9000/"
```

And you can access it by pointing your browser to `http://localhost:9000`
