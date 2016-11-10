# Ansible playbook

Ansible is a simple automation engine that automates cloud provisioning, configuration management, application deployment, intra-service orchestration.

Being designed for multi-tier deployments since day one, Ansible models your IT infrastructure by describing how all of your systems inter-relate, rather than just managing one system at a time.

It uses no agents and no additional custom security infrastructure, just a SSH connection is needed.

ParaViewWeb provides an Ansible Playbook for:

1) Configuring Apache to do the WebSocket forwarding and WebSite serving
2) Install ParaView
3) Configure X to auto login so ParaView can use it for its rendering
4) Install Nvidia drivers
5) Configure ParaView Launcher for ParaViewWeb Visualizer as a service

The possible OS targets are:

- Linux Ubuntu 14.04 LTS
- CentOS 7

## Prerequisites

On the source machine:

1) [Ansible (2.0.0.2 or greater)](http://www.ansible.com/) need to be installed.

On the target machine:

1) SSH configured so the source machine can connect without authentication
2) The used used for SSH should be a __password less sudoer__

## Provisioning

Create an inventory file with the following content:

```myInventory_file.txt
[all]
target_Hostname_or_IP
```

Run the following command line:

```sh
$ git clone https://github.com/Kitware/paraviewweb.git
$ ansible-playbook                       \
   -i /path/to/your/myInventory_file.txt \
   paraviewweb/tools/ansible/site.yml    \
   -u <your passwordless ssh user here>  \
   -e hostname=<the hostname to use to connect to apache> \
   -e gpu=<yes|no> \
   -e install_nvidia_driver=<yes|no> \
```

- If gpu is set to 'no' the Mesa LLVM pipeline will be used for rendering.

## Installation Structure

### Common to distributions
- `/opt/paraview` - ParaView installation
- `/etc/opt/paraview/launcher.json` - Launcher configuration file
- `/home/<pvw_user>/data` - Sample test data
- `<proxy_db_path>` - Path to Apache websocket proxy file. Default is `/var/opt/paraview/proxy.txt`
- `/var/log/paraview` - ParaViewWeb log files

### Ubuntu
- `/etc/init/pvw-launcher.conf` - Launcher service configuration
- `/etc/apache2/sites-available/pvw.conf` - Apache site configuration
- `<pvw_site_root>` - Root of ParaViewWeb site. Default is `/opt/paraview/share/paraview-5.0/www/`

### CentOS/RedHat
- `/etc/systemd/system/pvw-launcher.service` - Launcher service configuration
- `/etc/httpd/conf.d/pvw.conf`- Apache site configuration
- `/var/www/html` - Root of ParaViewWeb site


## Testing

To validate the setup, you can connect to the following URL

```
http://<the hostname to use to connect to apache>/visualizer
```

## EC2 Deployment

The following section illustrate the usage of our ansible script in an EC2 setup.

### Launch Instance

1. Choose an Amazon Machine Image (AMI)
  - Ubuntu Server 14.04 LTS (HVM), SSD Volume Type - ami-01f05461
2. Choose an Instance Type
  - GPU instances (g2.2xlarge or g2.8xlarge) <= This will provide the best rendering performance
3. Configure Instance Details
4. Add Storage
5. Tag Instance
6. Configure Security Group

| Name | Protocol | Port |          |           |
| ---- | -------- | ---- | -------- | --------- |
| SSH  | TCP      | 22   | Anywhere | 0.0.0.0/0 |
| HTTP | TCP      | 80   | Anywhere | 0.0.0.0/0 |


When launching the instance you may want to re-use or create a new Key pair.

Here we assume we create a new one named `paraview-52` which should trigger a download of a `paraview-52.pem` file on your computer. 

Now that your instance is starting, you should be able to click on the button __View Instances__ at the bottom-right of the page which should lead you to a table with all your instances.
At that point, you may want to name it `paraview-52` and remember both the public IP or DNS name as you will need them later.

In our case we have: 
- __Public DNS Name:__ `ec2-35-163-16-21.us-west-2.compute.amazonaws.com` 
- __Public IP:__ `35.163.16.21`.

### Provisioning Setup

For this provisioning example, we will gather all we need within a single directory. The following commands will create that directory and fill it with the various pieces needed.

```sh
# Create our working directory
$ mkdir pv52-ec2
$ cd pv52-ec2

# Move our SSH key and set proper security permission
$ mv ~/Downloads/paraview-52.pem .
$ chmod 600 ./paraview-52.pem 

# Get ParaViewWeb
$ git clone https://github.com/Kitware/paraviewweb.git

# Edit inventory file
$ vi ./ec2-instance.txt

[all]
35.163.16.21
```

### Running the provisionning

```sh
$ ansible-playbook                                              \
   -i ./ec2-instance.txt                                        \
   paraviewweb/tools/ansible/site.yml                           \
   -u ubuntu                                                    \
   -e hostname=ec2-35-163-16-21.us-west-2.compute.amazonaws.com \
   -e gpu=yes                                                   \
   -e install_nvidia_driver=no                                  \
   --private-key=./paraview-52.pem
```

Since the ansible script won't install the drivers for the GPU you will have to do it yourself following the instruction from [NVidia](http://www.nvidia.com/Download/index.aspx?lang=en-us)

The driver we used at the time of this documentation was:

<center>
<img src='nvidia-setting.jpg' width='60%' />
</center>

Here is the expected output of the previous command:

```sh
PLAY [Common configuration] ****************************************************

TASK [setup] *******************************************************************
ok: [35.163.16.21]

TASK [common : Create ParaViewWeb user] ****************************************
changed: [35.163.16.21]

TASK [common : include] ********************************************************
included: /Users/seb/Desktop/pv52-ec2/paraviewweb/tools/ansible/roles/common/tasks/./Ubuntu.yml for 35.163.16.21

TASK [common : Ensure packages cache is up to date (Ubuntu)] *******************
changed: [35.163.16.21]

PLAY [Install ParaView] ********************************************************

TASK [setup] *******************************************************************
ok: [35.163.16.21]

TASK [paraview : include_vars] *************************************************
ok: [35.163.16.21]

TASK [paraview : Install ParaView prerequisite packages] ***********************
changed: [35.163.16.21] => (item=[u'xorg', u'slim', u'mesa-common-dev', u'libxt-dev'])

TASK [paraview : stat ParaView download] ***************************************
ok: [35.163.16.21]

TASK [paraview : Download ParaView] ********************************************
changed: [35.163.16.21]

TASK [paraview : Install ParaView] *********************************************
changed: [35.163.16.21]

TASK [paraview : stat ParaView version specific install directory] *************
ok: [35.163.16.21]

TASK [paraview : Move install specfic directory name to 'paraview'] ************
changed: [35.163.16.21]

TASK [paraview : Find ParaView version directory] ******************************
ok: [35.163.16.21]

TASK [paraview : Set ParaView versioned library directory] *********************
ok: [35.163.16.21]

TASK [paraview : Find ParaView version shared directory] ***********************
ok: [35.163.16.21]

TASK [paraview : Set ParaView versioned shared directory] **********************
ok: [35.163.16.21]

TASK [paraview : Create ParaView data directory] *******************************
changed: [35.163.16.21]

TASK [paraview : Create ParaView configuration directory] **********************
changed: [35.163.16.21]

TASK [paraview : stat ParaView sample data download] ***************************
ok: [35.163.16.21]

TASK [paraview : Download sample data] *****************************************
changed: [35.163.16.21]

TASK [paraview : Create data directory] ****************************************
changed: [35.163.16.21]

TASK [paraview : Install ParaView sample data] *********************************
changed: [35.163.16.21]

TASK [paraview : Create LightViz data directory] *******************************
changed: [35.163.16.21]

TASK [paraview : Create Web directory] *****************************************
changed: [35.163.16.21]

TASK [paraview : Install Visualizer Web directory] *****************************
changed: [35.163.16.21]

TASK [paraview : Install LightViz Web directory] *******************************
changed: [35.163.16.21]

TASK [paraview : include] ******************************************************
included: /Users/seb/Desktop/pv52-ec2/paraviewweb/tools/ansible/roles/paraview/tasks/./Ubuntu.yml for 35.163.16.21

TASK [paraview : Step up ParaViewWeb user to auto login to start X] ************
changed: [35.163.16.21] => (item={u'regex': u'^#auto_login          no$', u'line': u'auto_login          yes'})
changed: [35.163.16.21] => (item={u'regex': u'^#default_user        simone$', u'line': u'default_user        pvw-user'})

TASK [paraview : Run nvida-xconfig] ********************************************
changed: [35.163.16.21]

TASK [paraview : Restart server] ***********************************************
ok: [35.163.16.21]

TASK [paraview : Waiting for server to come back up] ***************************
ok: [35.163.16.21 -> localhost]

PLAY [Install Apache] **********************************************************

TASK [setup] *******************************************************************
ok: [35.163.16.21]

TASK [apache : include_vars] ***************************************************
ok: [35.163.16.21]

TASK [apache : Install apache] *************************************************
changed: [35.163.16.21]

TASK [apache : Create proxy mapping file] **************************************
changed: [35.163.16.21]

TASK [apache : Fix Web directory ownership] ************************************
changed: [35.163.16.21]

TASK [apache : include] ********************************************************
included: /Users/seb/Desktop/pv52-ec2/paraviewweb/tools/ansible/roles/apache/tasks/./Ubuntu.yml for 35.163.16.21

TASK [apache : Enable mod_proxy] ***********************************************
changed: [35.163.16.21]

TASK [apache : Enable mod_rewrite] *********************************************
changed: [35.163.16.21]

TASK [apache : Enable mod_proxy_http] ******************************************
changed: [35.163.16.21]

TASK [apache : Enable mod_proxy_wstunnel] **************************************
changed: [35.163.16.21]

TASK [apache : Disable the default site] ***************************************
changed: [35.163.16.21]

TASK [apache : Copy over config] ***********************************************
changed: [35.163.16.21]

TASK [apache : Enable pvw-web site] ********************************************
changed: [35.163.16.21]

TASK [apache : Update directory] ***********************************************
changed: [35.163.16.21]

RUNNING HANDLER [apache : restart apache2] *************************************
changed: [35.163.16.21]

PLAY [Setup ParaViewWeb launcher] **********************************************

TASK [setup] *******************************************************************
ok: [35.163.16.21]

TASK [launcher : Create ParaView log directory] ********************************
changed: [35.163.16.21]

TASK [launcher : include] ******************************************************
included: /Users/seb/Desktop/pv52-ec2/paraviewweb/tools/ansible/roles/launcher/tasks/./Ubuntu.yml for 35.163.16.21

TASK [launcher : Install launcher as service] **********************************
changed: [35.163.16.21]

TASK [launcher : Start launcher] ***********************************************
changed: [35.163.16.21]

TASK [launcher : Template launcher config] *************************************
changed: [35.163.16.21]

PLAY RECAP *********************************************************************
35.163.16.21               : ok=53   changed=34   unreachable=0    failed=0   
```

Once the playbook is done, you should be able to connect to either application with the following links assuming you've updated the hostname to be the one you created.

- http://ec2-35-163-16-21.us-west-2.compute.amazonaws.com/visualizer
- http://ec2-35-163-16-21.us-west-2.compute.amazonaws.com/lightviz
