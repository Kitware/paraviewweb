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

__Server - Amazon EC2 - Oregon ([map](https://www.google.com/maps/dir/Santa+Fe,+NM/Amazon+Data+Center,+Boardman,+OR+97818/@40.5028874,-117.2515113,6z/data=!3m1!4b1!4m13!4m12!1m5!1m1!1s0x87185043e79852a9:0x8c902373fd88df40!2m2!1d-105.937799!2d35.6869752!1m5!1m1!1s0x54a2b2b4a09c7c29:0x6cfb9b9e8655843!2m2!1d-119.6536926!2d45.8409449))__
```
Amazon EC2 - g2.2xlarge - US West (Oregon)
ParaView 5.4.1 / EGL build
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

| Loaded data type  | Load time |
| ----------------- | --------- |
| 1 MB exodus file  |    + 0.4s |
| 4 MB data + state |    + 1.5s |

## Rendering performances

For the rendering performances we've loaded the same dataset of 4.8 Million point cloud and interact with it. The times reported are while interacting leaving the still render out of the picture. In either case the last render does not affect how the tools performance is percived. 

### Running on __localhost__

| Image resolution | ParaView Qt client | ParaView* (client/server) | ParaView - Visualizer |
| ---------------- | ------------------ | ------------------------- | --------------------- |
| 1280 x 720       | + 600 fps          | 27/22/21/4 fps            | 27 fps                |
| 1920 x 1080      | + 600 fps          | 16/12/11/4 fps            | 14 fps                |

__Compression modes\*:__
 1) No compression (~ BMP)
 2) LZ4 (default settings)
 3) Squirt (default settings)
 4) zlib (default settings)

ParaView - Visualizer in that example was not compressing the image by lowering the JPEG quality or lowering the image resolution while interacting. If any compression is used JPEG or image size, we easily reach +50 fps while interacting.

### Running on __EC2__

| Image resolution | ParaView* (client/server) | ParaView - Visualizer |
| ---------------- | ------------------------- | --------------------- |
| 1280 x 720       | 3/3/3/2 fps               | 9 fps                 |
| 1920 x 1080      | 3/1/2/2 fps               | 6 fps                 |

__Compression modes\*:__
 1) No compression (~ BMP)
 2) LZ4 (default settings)
 3) Squirt (default settings)
 4) zlib (default settings)
