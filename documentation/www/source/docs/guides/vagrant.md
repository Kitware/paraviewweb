# Vagrant setup

Along with ParaViewWeb, we provide a Vagrant setup which will setup
a VM with Apache, ParaView, its launcher and the ParaViewWeb Visualizer application.

The VM will provide poor rendering performance unless the VM is tuned for
using a proper GPU.

But the goal here was to illustrate how ParaViewWeb can be installed and deployed automatically. Under the hood we rely on an Ansible playbook to
provision the Vagrant VM. Therefore that playbook can also be used on actual
hardware for better performances.

## Prerequisites

The following set of tools need to be installed:

- [VirtualBox](https://www.virtualbox.org/wiki/Downloads)
- [Vagrant](https://www.vagrantup.com/)
- [Ansible](http://www.ansible.com/)

## Running the VM

In order to run and setup the vagrant VM you can do that with the following
set of commands:

```sh
$ git clone https://github.com/Kitware/paraviewweb.git
$ cd paraviewweb/tools
$ vagrant up
```

## Testing

Then you should be able to connect to ```http://localhost:8080/apps/Visualizer```.
