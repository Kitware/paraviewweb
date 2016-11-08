# Installing NVIDA drivers on RedHat

First install required kernel package needed to build driver:

```
sudo yum install kernel-devel kernel-headers
```

Download appropriate driver from:

http://www.nvidia.com/Download/

Install the driver:

```
sudo sh NVIDIA-Linux-x86_64-367.27.run --kernel-source-path  /usr/src/kernels/3.10.0-327.22.2.el7.x86_64/
```

Get the the PCI bus ID of the GPU using:

```
lspci -nn | grep VGA
```

Set the PCI bus ID in the xconfig:

```
sudo nvidia-xconfig --busid=<pci_id> --use-display-device=None
```

pci_id - The id from the lspci command for example: PCI:0:3:0

