# Introduction

This repository contains images useful for running/deploying ParaViewWeb.  This documentation, along with the Dockerfiles used to build the images (as well as everything else related to ParaViewWeb) are hosted on our Github [repo](https://github.com/Kitware/paraviewweb).

# Images

There are currently three images available, though you would normally only need to run the `pvw-visualizer-5.5.0` one for the simplest deployment:

- `pv-5.5.0`: Base image containing ParaView 5.5 binary with EGL rendering support.  This image is based off the [nvidia/opengl](https://hub.docker.com/r/nvidia/opengl/) images.  [Dockerfile](https://github.com/Kitware/paraviewweb/tree/master/tools/docker/paraview/Dockerfile)
- `pvw-base-5.5.0`: Built on top of the `pv-5.5.0` image, this adds the Apache webserver, along with some extra scripts and configuration files used by the next image in the stack.  [Dockerfile](https://github.com/Kitware/paraviewweb/tree/master/tools/docker/paraviewweb/Dockerfile)
- `pvw-visualizer-5.5.0`: Built on top of the `pvw-base-5.5.0` image, this adds an Apache endpoint for the ParaViewWeb Visualizer application, and brings a custom launcher config.  [Dockerfile](https://github.com/Kitware/paraviewweb/tree/master/tools/docker/visualizer/Dockerfile)

# EC2 Deployment

For additional information on how to deploy these images on Amazon EC2, please refer to the ParaViewWeb [guide on EC2](http://kitware.github.io/paraviewweb/docs/ec2.html).
