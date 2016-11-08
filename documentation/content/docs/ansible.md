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
http://<the hostname to use to connect to apache>/apps/Visualizer
```
