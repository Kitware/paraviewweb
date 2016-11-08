## ParaView 4.4 AMIs

### Hardware

When you are instantiating an Amazon Machine Image (AMI), you should use:
- Hardware with GPU: g2.2xlarge
- Security rule: http + ssh (80+22)

### Software

__OS:__ Ubuntu 14.04 LTS
__User:__ ec2-user

The machine at startup will:
- Start X for ParaView
- Configure Apache with the current DNS name of the machine
- Configure the launcher with the proper hostname.
- Start ParaViewWeb launcher

Once started (~5 minutes), you can access the machine like the following:
- http://ec2-198-51-100-1.compute-1.amazonaws.com/apps/Visualizer

### AMIs

| Region                | Name                   | AMI          |
| --------------------- | ---------------------- | ------------ |
| US East (N. Virginia) | ParaViewWeb-4.4-public | ami-34f3f65e |
| US West (Oregon)      | ParaViewWeb-4.4-public | ami-6b739c0b |

## ParaView 5.2 AMIs

### Hardware

When you are instantiating an AMI, you should use:
- Hardware with GPU: g2.2xlarge
- Security rule: http + ssh (80+22)

### Software

__OS:__ Ubuntu 16.04 LTS
__User:__ ec2-user

The machine at startup will:
- Start X for ParaView
- Configure Apache with the current DNS name of the machine
- Configure the launcher with the proper hostname.
- Start ParaViewWeb launcher

Once started (~5 minutes), you can access the machine like the following:
- http://ec2-198-51-100-1.compute-1.amazonaws.com/Visualizer
- http://ec2-198-51-100-1.compute-1.amazonaws.com/LightViz

### AMIs

Please [contact us](http://www.kitware.com/products/support.html) if you need us to build a VM for you.
