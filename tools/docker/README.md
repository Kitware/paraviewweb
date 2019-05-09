# Introduction

This repository contains images useful for running/deploying ParaViewWeb.  This documentation, along with the Dockerfiles used to build the images (as well as everything else related to ParaViewWeb) are hosted on our Github [repo](https://github.com/Kitware/paraviewweb).

# Images

There are currently several kinds of images available, though you would normally only need to run the `pvw-v5.6.0-visualizer` one for the simplest deployment:

- `pv-v5.6.0-egl`: Base image containing ParaView 5.6 binary with EGL rendering support.  This image is based off the [nvidia/opengl](https://hub.docker.com/r/nvidia/opengl/) images.  [Dockerfile](https://gitlab.kitware.com/paraview/paraview-superbuild/tree/master/Scripts/docker/Ubuntu/Dockerfile)
- 'pv-v5.6.0-osmesa': Same as above, but with OSMesa rendering for running on machines with no underlying nvidia graphics card.  The same Dockerfile as above is used to build thei image.
- `pvw-v5.6.0-egl` and `pvw-v5.6.0-osmesa`: Built on top of the ParaView images above, this adds the Apache webserver, along with some extra scripts and configuration files used by the next image in the stack.  [Dockerfile](https://github.com/Kitware/paraviewweb/tree/master/tools/docker/paraviewweb/Dockerfile)
- `pvw-v5.6.0-egl-demo` and `pvw-v5.6.0-egl-visualizer`: Built on top of the `pvw-v5.6.0-egl` image, these add an Apache endpoint for custom applications, and bring a custom launcher config.  [Dockerfile](https://github.com/Kitware/paraviewweb/tree/master/tools/docker/visualizer/Dockerfile)

# EC2 Deployment

For additional information on how to deploy these images on Amazon EC2, please refer to the ParaViewWeb [guide on EC2](http://kitware.github.io/paraviewweb/docs/ec2.html).
