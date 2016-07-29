title: Roadmap
---

### Introduction

ParaViewWeb aims to be a library for building visualization applications on the Web. Those applications can leverage a VTK/ParaView backend for large data processing and/or rendering but can also be used on static web server like Apache or nginx.

The technologies use for building the ParaViewWeb library are Webpack, ES6 with babel and a set of module decomposition similar to what we have in VTK and ParaView.

ParaViewWeb is currently use in the following set of applications:

- __ParaViewWeb Visualizer__: The Visualizer application aims to provide a ParaView like experience inside your web browser. The ParaViewWeb library provides to the application all the components it needs to build the UI as well as the WebSocket connectivity to the ParaView server. The application is just connecting all the components together in a miningful way and providing a nice command line interface.
- __ParaViewWeb LightViz__: The LightViz application aims to provide an intutive and interactive visualization tool which could easily adapt itself to the data we are looking at. The ParaViewWeb library provides to the application all the components it needs to build the UI as well as the WebSocket connectivity to the ParaView server. The application is just connecting all the components together in a miningful way and providing a nice command line interface.
- __ParaViewWeb ArcticViewer__: The ArcticViewer application break the pattern here by not requireing a processing server like ParaView or VTK. In fact, ArcticView rely on the fact that the data has been pre-processed which allow it to be directly read by the Web client. In that use case, ParaViewWeb provides the various data handlers, rendering algorithms and UI components to drive the data fetching along with the rendering parameters. ArcticView is then providing an infrastructure for running a data visualization tool directly from a command line where various types of data are understood and the appropriate viewer get instantiated based on the data we are looking at. 
- __SimPut__: The SimPut application as opposed to the other applications does not provide any visualization. The application aims to provide an environment for dynamically generating UI with various form of inputs in order to produce templated outputs file for simulation code. SimPut is leveraging from ParaViewWeb its infrastructure to build user input interface for Proxies properties which are also used insde the ParaViewWeb Visualizer to create the Proxy Editor Panel.
- __HPCCloud__: HPCCloud is more of a platform as it embbed many of the tools listed above. And because of that, it also make some usage to the ParaViewWeb library.

### Roadmap

This roadmap does not provide any timeline but instead provides insight on its modules and how we see them evolved.

#### Common

The common module aims to provide some core data model and helpers.
This include color handling, offscreen canvas, WebGL utility and various data model to hold state for some UI components.

The evolution of that module is somewhat limited. Although some possible add-on could be:

- Helper class to monitor change of size of a given container [implementation](https://www.npmjs.com/package/javascript-detect-element-resize)
- Color handling could be replaced by the vtk.js implementations. 

#### Components

The components module aims to provide a set of graphical pieces that share the same API (setContainer/resize/render/destroy). This should grow with time while we create more interactive tools for exploring and visualizing data.

This module will grow with various type of Information Visualization. We currently have a field selector, 1D/2D histograms, mutual information diagram, parallel coordinates and we expect to add a sankey diagram as well as some other tools for annotating data.

#### Interaction

The interaction module aims to deal with user input/interaction, mouse and touch handling.
This will probably evolved if the current implementation are lacking some behavior we want to handle. But I don't expect much change in it.

#### IO

The IO module aims to provide connectivity to various source of data. 

- Core: Provides several download helpers which can deal with pattern based data querying and various type of data (ArrayBuffer, images, text, json...). 
- WebSocket: Provides helpers for a VTK/ParaView Web backend.
- Girder: Provides helpers for interacting with a Girder backend.

I don't foresee much evolution within that module except for supporting new ParaViewWeb protocols.

#### NativeUI

The NativeUI module is composed of various UI pieces that do not depend on anything.

It is likely that module will disapear and be migrated into the Components one which ensure a consistent API across various UI pieces.

#### React

The React module is composed of React pieces. Those UI pieces will tend to grow based on the need of various applications. Although it is likely that any new class will be stateless and will need a Redux infrastructure to be used.

#### Rendering

The Rendering module gather data processing algorithms which could be used for generating images or other types of data structures.

This module may be renamed and restructure as more data convertion algorithm are getting created than actual rendering code.

### Wish list

If you feel that ParaViewWeb could help you in your application development and that is missing something. Please create a new issue and we'll see if we can integrate that into our next release.

### Future

As ParaViewWeb mature, its documentation and testing should grow.
