#
# To build this image and run it with a shell, first change into the directory
# where this Dockerfile lives, then:
#
# sudo docker build -t pv-sys-python-v5.6.0 .
#
# Or, to choose specific tagged version:
#
# sudo docker build --build-arg PARAVIEW_TAG=v5.6.0 --build-arg SUPERBUILD_TAG=v5.6.0 -t pv-sys-python-v5.6.0 .
#
# Run the image with bash to look around:
#
# sudo docker run --runtime=nvidia -ti pv-sys-python-v5.6.0 bash
#

FROM nvidia/opengl:1.0-glvnd-devel-ubuntu16.04

ARG PARAVIEW_TAG=master
ARG SUPERBUILD_TAG=master

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        chrpath \
        curl \
        gfortran \
        git \
        g++ \
        openssl \
        python2.7-dev \
        python-pip \
        python-setuptools && \
    rm -rf /var/lib/apt/lists/*

# Get CMake, then clone, configure and build ParaView
RUN mkdir -p /opt/cmake/3.11.1 && cd /opt/cmake/3.11.1 && \
    curl -L https://cmake.org/files/v3.11/cmake-3.11.1-Linux-x86_64.tar.gz | tar --strip-components=1 -xzv && \
    mkdir -p /opt/paraview && cd /opt/paraview && \
    git clone --recursive https://gitlab.kitware.com/paraview/paraview-superbuild.git src && \
    cd src && git checkout ${SUPERBUILD_TAG} && git submodule update && cd .. && \
    mkdir build && cd build && \
    /opt/cmake/3.11.1/bin/cmake \
    -DCTEST_USE_LAUNCHERS:BOOL=1 \
    -DCMAKE_INSTALL_PREFIX:PATH=/opt/paraview/install \
    -DENABLE_egl:BOOL=ON \
    -DEGL_INCLUDE_DIR:PATH=/usr/local/include \
    -DEGL_LIBRARY:FILEPATH=/usr/local/lib/x86_64-linux-gnu/libEGL.so \
    -DEGL_gldispatch_LIBRARY:FILEPATH=/usr/local/lib/x86_64-linux-gnu/libGLdispatch.so \
    -DEGL_opengl_LIBRARY:FILEPATH=/usr/local/lib/x86_64-linux-gnu/libOpenGL.so \
    -DENABLE_vistrails:BOOL=ON \
    -DUSE_SYSTEM_qt5:BOOL=OFF \
    -DENABLE_netcdf:BOOL=OFF \
    -DENABLE_hdf5:BOOL=ON \
    -DENABLE_szip:BOOL=ON \
    -DENABLE_paraviewgettingstartedguide:BOOL=OFF \
    -DENABLE_visitbridge:BOOL=ON \
    -DENABLE_mesa:BOOL=OFF \
    -DENABLE_ffmpeg:BOOL=ON \
    -DPARAVIEW_DEFAULT_SYSTEM_GL:BOOL=OFF \
    -DENABLE_nvidiaindex:BOOL=OFF \
    -DENABLE_qt5:BOOL=OFF \
    -DENABLE_mpi:BOOL=ON \
    -DENABLE_silo:BOOL=ON \
    -DENABLE_paraview:BOOL=ON \
    -DENABLE_xdmf3:BOOL=ON \
    -DENABLE_h5py:BOOL=ON \
    -DBUILD_SHARED_LIBS:BOOL=ON \
    -Dvtkm_SOURCE_SELECTION:STRING=for-git \
    -DENABLE_paraviewtutorial:BOOL=OFF \
    -DENABLE_vtkm:BOOL=ON \
    -DENABLE_numpy:BOOL=ON \
    -DENABLE_vrpn:BOOL=ON \
    -DENABLE_paraviewusersguide:BOOL=OFF \
    -DENABLE_cosmotools:BOOL=ON \
    -DCMAKE_BUILD_TYPE:STRING=Release \
    -DENABLE_glu:BOOL=ON \
    -DENABLE_tbb:BOOL=ON \
    -DENABLE_boxlib:BOOL=OFF \
    -Dsuperbuild_download_location:PATH=/opt/paraview/build/downloads \
    -DENABLE_paraviewweb:BOOL=ON \
    -DENABLE_paraviewtutorialdata:BOOL=OFF \
    -DENABLE_boost:BOOL=ON \
    -DENABLE_vortexfinder2:BOOL=OFF \
    -DENABLE_python:BOOL=ON \
    -DUSE_SYSTEM_python=ON \
    -DUSE_SYSTEM_pythonsetuptools=ON \
    -DDIY_SKIP_SVN:BOOL=ON \
    -DUSE_NONFREE_COMPONENTS:BOOL=ON \
    -DENABLE_matplotlib:BOOL=ON \
    -DENABLE_las:BOOL=ON \
    -DBUILD_TESTING:BOOL=ON \
    -DENABLE_scipy:BOOL=ON \
    -DENABLE_ospray:BOOL=OFF \
    -DENABLE_acusolve:BOOL=ON \
    -DENABLE_fontconfig:BOOL=ON \
    -Dparaview_FROM_GIT:BOOL=ON \
    -Dparaview_GIT_TAG:STRING=${PARAVIEW_TAG} \
    -Dparaview_SOURCE_SELECTION:STRING=git \
    -DCTEST_USE_LAUNCHERS:BOOL=TRUE \
    "-GUnix Makefiles" \
    ../src && \
    make -j"$(nproc)" install && \
    rm -rf /opt/paraview/build && \
    rm -rf /opt/paraview/src && \
    rm -rf /opt/cmake

WORKDIR /opt/paraview
