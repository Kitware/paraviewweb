## [ParaViewWeb](http://kitware.github.io/ParaViewWeb/)

[![Build Status](https://travis-ci.org/Kitware/paraviewweb.svg)](https://travis-ci.org/Kitware/paraviewweb)
[![Dependency Status](https://david-dm.org/kitware/paraviewweb.svg)](https://david-dm.org/kitware/paraviewweb)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
![npm-download](https://img.shields.io/npm/dm/paraviewweb.svg)

### Introduction

ParaViewWeb aims to provide a framework or a Toolkit for building interactive
web visualization relying on VTK or ParaView to produce visualization data.

Those data could be static or dynamic ranging from a no-server setup to either
having a ParaView or VTK backend sending either geometry or images to the client.

## Documentation

** COMING SOON **

See the [documentation](https://kitware.github.io/paraviewweb) for a
getting started guide, advanced documentation, and API descriptions.

[Generated API](https://kitware.github.io/paraviewweb/api)

Generated examples:

* [AbstractViewerMenu](https://kitware.github.io/paraviewweb/examples/AbstractViewerMenu)
* [ActionListWidget](https://kitware.github.io/paraviewweb/examples/ActionListWidget)
* [ButtonSelectorWidget](https://kitware.github.io/paraviewweb/examples/ButtonSelectorWidget)
* [CollapsibleWidget](https://kitware.github.io/paraviewweb/examples/CollapsibleWidget)
* [ColorPickerWidget](https://kitware.github.io/paraviewweb/examples/ColorPickerWidget)
* [CompositePipelineWidget](https://kitware.github.io/paraviewweb/examples/CompositePipelineWidget)
* [ContentEditableWidget](https://kitware.github.io/paraviewweb/examples/ContentEditableWidget)
* [Coordinate2DWidget](https://kitware.github.io/paraviewweb/examples/Coordinate2DWidget)
* [DoubleSliderWidget](https://kitware.github.io/paraviewweb/examples/DoubleSliderWidget)
* [DropDownWidget](https://kitware.github.io/paraviewweb/examples/DropDownWidget)
* [EqualizerWidget](https://kitware.github.io/paraviewweb/examples/EqualizerWidget)
* [FileBrowserWidget](https://kitware.github.io/paraviewweb/examples/FileBrowserWidget)
* [FloatImageControl](https://kitware.github.io/paraviewweb/examples/FloatImageControl)
* [GitTreeWidget](https://kitware.github.io/paraviewweb/examples/GitTreeWidget)
* [ImageBuilderViewer](https://kitware.github.io/paraviewweb/examples/ImageBuilderViewer)
* [ImageRenderer](https://kitware.github.io/paraviewweb/examples/ImageRenderer)
* [InlineToggleButtonWidget](https://kitware.github.io/paraviewweb/examples/InlineToggleButtonWidget)
* [LayoutsWidget](https://kitware.github.io/paraviewweb/examples/LayoutsWidget)
* [LightControl](https://kitware.github.io/paraviewweb/examples/LightControl)
* [LineChartViewer](https://kitware.github.io/paraviewweb/examples/LineChartViewer)
* [LookupTableManagerControl](https://kitware.github.io/paraviewweb/examples/LookupTableManagerControl)
* [LookupTableWidget](https://kitware.github.io/paraviewweb/examples/LookupTableWidget)
* [MultiLayoutViewer](https://kitware.github.io/paraviewweb/examples/MultiLayoutViewer)
* [MultiViewControl](https://kitware.github.io/paraviewweb/examples/MultiViewControl)
* [NumberInputWidget](https://kitware.github.io/paraviewweb/examples/NumberInputWidget)
* [NumberSliderWidget](https://kitware.github.io/paraviewweb/examples/NumberSliderWidget)
* [PixelOperatorControl](https://kitware.github.io/paraviewweb/examples/PixelOperatorControl)
* [Probe3DViewer](https://kitware.github.io/paraviewweb/examples/Probe3DViewer)
* [ProbeControl](https://kitware.github.io/paraviewweb/examples/ProbeControl)
* [QueryDataModelControl](https://kitware.github.io/paraviewweb/examples/QueryDataModelControl)
* [QueryDataModelWidget](https://kitware.github.io/paraviewweb/examples/QueryDataModelWidget)
* [TextInputWidget](https://kitware.github.io/paraviewweb/examples/TextInputWidget)
* [ToggleIconButtonWidget](https://kitware.github.io/paraviewweb/examples/ToggleIconButtonWidget)
* [TogglePanelWidget](https://kitware.github.io/paraviewweb/examples/TogglePanelWidget)
* [VolumeControl](https://kitware.github.io/paraviewweb/examples/VolumeControl)


## Development

You can start building the ParaViewWeb library by itself with the following
set of commands:

```js
$ git clone https://github.com/kitware/paraviewweb.git
$ cd paraviewweb
$ npm run install:global
$ npm install
$ npm run build
```

### Licensing

**ParaViewWeb** is licensed under [BSD Clause 3](LICENSE).

### Getting Involved

Fork our repository and do great things. At [Kitware](http://www.kitware.com),
we've been contributing to open-source software for 15 years and counting, and
want to make **ParaViewWeb** useful to as many people as possible.
