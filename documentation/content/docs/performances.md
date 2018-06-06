title: ParaViewWeb vs ParaView
---
# Performance analysis

This document aims to provide informations regarding the performance you can expect from a ParaViewWeb setup vs similar configuration using the client/server architecture of ParaView and its Qt client.
The test were performed on:

__Client - New Mexico ([map](https://www.google.com/maps/dir/Santa+Fe,+NM/Amazon+Data+Center,+Boardman,+OR+97818/@40.5028874,-117.2515113,6z/data=!3m1!4b1!4m13!4m12!1m5!1m1!1s0x87185043e79852a9:0x8c902373fd88df40!2m2!1d-105.937799!2d35.6869752!1m5!1m1!1s0x54a2b2b4a09c7c29:0x6cfb9b9e8655843!2m2!1d-119.6536926!2d45.8409449))__
```
MacBook Pro (15-inch, 2016) - macOS High Sierra (10.13.3)
Processor: 2.9 GHz Intel Core i7
Memory: 16 GB 2133 MHz LPDDR3
GPU: Radeon Pro 460 4 GB
```

__Server - Amazon EC2 - N Virginia ([map](https://www.google.com/maps/place/Amazon+Sortation+Center+RIC5/@34.0346852,-109.0484094,4.25z/data=!4m5!3m4!1s0x89b13c128823b5e3:0xf048c52753badeaa!8m2!3d37.7290999!4d-77.4565854))__
```
Amazon EC2 - g2.2xlarge ($0.650) - US East (N Virginia)
ParaView 5.5 / EGL build
```

__[Speed test results](http://www.speedtest.net/)__
```
Ping: 22ms
Download: 170 Mps
Upload: 22 Mbps
```

## Idle resource usage

|                            | MacBookPro Memory | MacBookPro Real Memory |
| -------------------------- | ----------------- | ---------------------- |
| ParaView Qt client         | 344.2 MB          | 540.8 MB               |
| pvserver                   | 22.2 MB           | 57.1 MB                |
| pvpython                   | 13.0 MB           | 40.6 MB                |
| pvpython + pv lib (1)      | 83.6 MB           | 147.4 MB               |
| visualizer (server) (2)    | 123.4 MB          | 195.5 MB               |

__Real Memory:__ Total Memory currently consumed by an application (including Virtual pages)
__Memory:__ Memory used in RAM

## Interactive resource usage

The test was done on the EC2 server using top to monitor the resources taken by ParaView.
The loaded data was the Lidar one which report 228 MB in the information panel.
The filter was a clip which created a new dataset that was 181.3 MB in the information panel.

| ParaView - Visualizer on EC2 | CPU  | Memory                      |
| ---------------------------- | ---- | --------------------------- |
| Idle                         |   1% | const (6.5%)                |
| Interacting 30 FPS           | 265% | const (6.5%)                |
| Apply a filter               | 100% | const + filter data (10.2%) |

## Loading cost analysis

This section only focus on the intial cost of starting a given process.

|                            | MacBookPro |  EC2 |
| -------------------------- | -----------| ---- |
| ParaView Qt client         |     ~ 2.4s |      |
| pvserver                   |       < 1s | < 1s |
| pvpython + pv lib (1)      |       ~ 1s | ~ 1s |
| visualizer (server) (2)    |     ~ 3.4s |      |
| visualzier (server+client) |            | ~ 4s |

1) Starting Python interpreted and loading the ParaView library.
2) Starting Python interpreted, loading the ParaView library and starting web server.

Then loading data will add-up to those numbers

| Loaded data type               | Load time |
| ------------------------------ | --------- |
|    1 MB exodus file            |    + 0.4s |
|    4 MB data + state           |    + 1.5s |
| 2.25 GB data + extract surface |   + 34.5s |

## Rendering performances with GPU

For the rendering performances we've loaded the same dataset of 4.8 Million point cloud and interact with it. The times reported are while interacting leaving the still render out of the picture. In either case the last render does not affect how the tools performance is percived. 

### Running on __localhost__

| Image resolution | ParaView Qt client | ParaView* (client/server) | ParaView* - Visualizer |
| ---------------- | ------------------ | ------------------------- | ---------------------- |
| 1280 x 720       | + 600 fps          | 27/22/21/4 fps            | 30 fps                 |
| 1920 x 1080      | + 600 fps          | 16/12/11/4 fps            | 30 fps                 |

__Compression modes\*:__

| ParaView* (client/server) | ParaView* - Visualizer       |
| ------------------------- | ---------------------------- |
| No compression (~ BMP)    | 50% JPEG / Ratio 1 - Default |
| LZ4 (default settings)    | 25% JPEG / Ratio 1           |
| Squirt (default settings) | 50% JPEG / Ratio 0.5         |
| zlib (default settings)   | 25% JPEG / Ratio 0.25        |

### Running on __EC2__

| Image resolution | ParaView* (client/server) | ParaView - Visualizer |
| ---------------- | ------------------------- | --------------------- |
| 1280 x 720       | 3/3/3/2 fps               | 30/30/30/30 fps       |
| 1920 x 1080      | 3/1/2/2 fps               | 23/23/30/30 fps       |

__Compression modes\*:__

| ParaView* (client/server) | ParaView* - Visualizer       | Web image 1280x720  | Web image 1920x1080 |
| ------------------------- | ---------------------------- | ------------------- | ------------------- |
| No compression (~ BMP)    | 50% JPEG / Ratio 1 - Default | 45.6 KB vs 298.2 KB | 83.5 KB vs 563.6 KB |
| LZ4 (default settings)    | 25% JPEG / Ratio 1           | 31.0 KB vs 295.4 KB | 56.9 KB vs 562.0 KB |
| Squirt (default settings) | 50% JPEG / Ratio 0.5         | 17.0 KB vs 293.7 KB | 29.9 KB vs 560.8 KB |
| zlib (default settings)   | 25% JPEG / Ratio 0.25        |  4.6 KB vs 293.9 KB | 7.82 KB vs 560.7 KB |

__Note__: 

ParaViewWeb target 30 FPS hence the constant 30 FPS value.
When increasing the server FPS value, I was able to reach ~45 FPS with an image of 1280x720 and a JPEG Quality of 50% (Ratio 1 => same image resolution).
When lowering even more the quality of the transfered image I was getting the 60 FPS which was the targeted framerate set on the server side.

## Rendering performances with CPU

For software rendering performance analysis we are going to compare both `llvm` and `OpenSWR` backend across a various set of dataset and hardware. Then we will tune some parameters to see how they affect interactive rendering performances.
All the testings will be done with ParaView Visualizer.

### Datasets

| Name              | Size                  | Purpose                                            |
| ----------------- | --------------------- | -------------------------------------------------- |
| disk_out_ref.ex2  | 700 KB / 7x10^3 Cells | Small dataset not stressing rendering              |
| lidar.vtp         |  61 MB / 5x10^6 Cells | Point cloud dataset with a decent number of points |
| Enclosure.vtm     | 260 MB / 3x10^6 Cells | Surface mesh with a decent number of triangles     |

### Hardware

```
MacBook Pro (15-inch, 2016) - macOS High Sierra (10.13.3)
Processor: 2.9 GHz Intel Core i7
Memory: 16 GB 2133 MHz LPDDR3
GPU: Radeon Pro 460 4 GB
```

```
Dell Precision Tower 7910 - Ubuntu 16.04 LTS
Processor: Intel® Xeon(R) CPU E5-2640 v3 @ 2.60GHz × 32
Memory: 128 GB
Graphics: Quadro K2200/PCIe/SSE2
```

```
Amazon EC2 - US East (N Virginia)
ParaView 5.5 / OSMesa build
c5.2xlarge ($0.34) | c5.4xlarge ($0.68) | c5.9xlarge ($1.53)
r4.2xlarge ($0.532)| r4.4xlarge ($1.064)
```

### Rendering with osmesa-llvm

Docker command line used to run the following tests

```
docker run -v /test-data:/data -p 0.0.0.0:8081:80 -ti kitware/paraviewweb:pvw-visualizer-osmesa-5.5.0 "ws://localhost:8081" --mesa-llvm
open http://localhost:8081
```

On local network

| Hardware    | Image resolution | disk_out_ref.ex2      | lidar.vtp                  | Enclosure.vtm          |
| ----------- | ---------------- | --------------------- | -------------------------- | ---------------------- |
| MacBook Pro | 1280 x 720       | 20/23/20/20/20/20 fps |  1/1.2/1.2/1.1/0.9/0.8 fps |  1/ 1/.9/1.1/ 1/ 1 fps |
| Dell 7910   | 1280 x 720       | 26/26/20/20/20/20 fps | .5/0.5/0.5/0.4/0.4/0.4 fps | .5/.5/.5/0.5/.6/.6 fps |

On EC2 with DSL network

| Hardware    | Image resolution | disk_out_ref.ex2      | lidar.vtp                   | Enclosure.vtm               |
| ----------- | ---------------- | --------------------- | --------------------------- | --------------------------- |
| c5.2xlarge  | 1280 x 720       | 30/30/20/20/20/20 fps | 1.3/1.3/1.3/1.2/0.9/0.9 fps | 1.2/1.2/1.2/1.3/1.4/1.3 fps |
| c5.4xlarge  | 1280 x 720       | 20/30/20/20/20/20 fps | 1.3/1.3/1.3/1.2/0.9/0.9 fps | 1.2/1.2/1.2/1.3/1.4/1.4 fps |
| c5.9xlarge  | 1280 x 720       | 30/30/20/20/20/20 fps | 1.3/1.3/1.4/1.2/0.9/0.9 fps | 1.3/1.2/1.2/1.3/1.4/1.4 fps |
| r4.2xlarge  | 1280 x 720       | 26/30/20/20/20/20 fps | 0.8/1.0/1.0/0.8/0.6/0.6 fps | 0.9/0.9/0.9/1.0/1.1/1.1 fps |
| r4.4xlarge  | 1280 x 720       | 30/30/20/20/20/20 fps | 0.8/1.0/1.0/0.7/0.6/0.6 fps | 0.9/0.9/0.9/0.9/1.0/1.0 fps |

Rendering configuration settings

| Setting name                      | a  | b  | c  | d  | e  | f  |
| --------------------------------- | -- | -- | -- | -- | -- | -- |
| Max interactive server FPS        | 30 | 30 | 20 | 20 | 20 | 20 |
| Interactive image quality (JPEG)  | 50 | 50 | 80 | 80 | 80 | 80 |
| Interactive image ratio           |  1 |  1 |  1 | .5 | .1 | .1 |
| Mouse event throttling per second | 60 | 60 | 40 | 40 | 40 | 40 |
| Use FXAA                          |  1 |  0 |  0 |  0 |  0 |  1 |

### Rendering with osmesa-swr

Docker command line used to run the following tests

```
docker run -v /test-data:/data -p 0.0.0.0:8081:80 -ti kitware/paraviewweb:pvw-visualizer-osmesa-5.5.0 "ws://localhost:8081" --mesa-swr
open http://localhost:8081
```

On local network

| Hardware    | Image resolution | disk_out_ref.ex2   | lidar.vtp                   | Enclosure.vtm           |
| ----------- | ---------------- | ------------------ | --------------------------- | ----------------------- |
| MacBook Pro | 1280 x 720       | 12/28/20/20/20 fps | 0.8/0.9/0.9/0.4/0.3/0.2 fps | 2.2/2.6/ 3/ 5/12/11 fps |
| Dell 7910   | 1280 x 720       | 30/30/20/20/20 fps | 2.6/3.1/3.1/1.6/0.3/0.3 fps |   8/  9/10/15/20/20 fps |

On EC2 with DSL network

| Hardware    | Image resolution | disk_out_ref.ex2      | lidar.vtp                   | Enclosure.vtm         |
| ----------- | ---------------- | --------------------- | --------------------------- | --------------------- |
| c5.2xlarge  | 1280 x 720       | 15/28/20/20/20/20 fps | 0.9/0.9/0.9/0.5/0.4/0.3 fps |  3/ 4/ 4/ 5/14/14 fps |
| c5.4xlarge  | 1280 x 720       | 30/30/20/20/20/20 fps | 1.8/2.0/2.1/1.0/0.4/0.4 fps |  6/ 7/ 7/12/20/20 fps |
| c5.9xlarge  | 1280 x 720       | 30/30/20/20/20/20 fps | 4.6/5.0/5.0/2.0/0.4/0.3 fps | 13/15/15/20/20/20 fps |
| r4.2xlarge  | 1280 x 720       | 11/30/20/20/20/20 fps | 0.6/0.7/0.7/0.3/0.3/0.2 fps |  2/ 2/ 2/ 4/10/10 fps |
| r4.4xlarge  | 1280 x 720       | 22/30/20/20/20/20 fps | 1.2/1.6/1.6/0.8/0.3/0.3 fps |  4/ 5/ 5/ 9/20/20 fps |

Rendering configuration settings

| Setting name                      | a  | b  | c  | d  | e  | f  |
| --------------------------------- | -- | -- | -- | -- | -- | -- |
| Max interactive server FPS        | 30 | 30 | 20 | 20 | 20 | 20 |
| Interactive image quality (JPEG)  | 50 | 50 | 80 | 80 | 80 | 80 |
| Interactive image ratio           |  1 |  1 |  1 | .5 | .1 | .1 |
| Mouse event throttling per second | 60 | 60 | 40 | 40 | 40 | 40 |
| Use FXAA                          |  1 |  0 |  0 |  0 |  0 |  1 |

### Performance comments

The framerate is noticeably impacted by the resolution of the image that needs to be generated, that's why by reducing the image ratio while interacting greatly increase the framerate which is not the case for GPU rendering.

## WebGL download time

| Name              | Size                  | Purpose                                            |
| ----------------- | --------------------- | -------------------------------------------------- |
| disk_out_ref.ex2  | 700 KB / 7x10^3 Cells | Small dataset not stressing rendering              |
| lidar.vtp         |  61 MB / 5x10^6 Cells | Point cloud dataset with a decent number of points |
| Enclosure.vtm     | 260 MB / 3x10^6 Cells | Surface mesh with a decent number of triangles     |

Download time

| Dataset          | Initial render | Clip half   | FPS on MacBookPro |
| ---------------- | -------------- | ----------- | ----------------- |
| disk_out_ref.ex2 |   209 ms       |   116 ms    | 60/60 fps         |
| lidar.vtp        | 47963 ms       | 31197 ms    | 30/60 fps         |
| Enclosure.vtm    | 37123 ms       | 22841 ms    | 60/60 fps         |
