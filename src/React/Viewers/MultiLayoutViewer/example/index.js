import React                from 'react';
import ReactDOM             from 'react-dom';
import equals               from 'mout/src/array/equals';

import ImageBuilder         from '../../../../Rendering/Image/DataProberImageBuilder';
import LineChartPainter     from '../../../../Rendering/Painter/LineChartPainter';
import LookupTableManager   from '../../../../Common/Core/LookupTableManager';
import MultiLayoutViewer    from '..';
import QueryDataModel       from '../../../../IO/Core/QueryDataModel';
import jsonData             from 'tonic-arctic-sample-data/data/probe/index.json';

// Load CSS
require('normalize.css');

/* global __BASE_PATH__ */
const
    bodyElement = document.querySelector('.content'),
    dataModel = new QueryDataModel(jsonData, __BASE_PATH__ + '/data/probe/'),
    lutManager = new LookupTableManager(),
    imageBuilderA = new ImageBuilder(dataModel, lutManager),
    imageBuilderB = new ImageBuilder(dataModel, lutManager),
    imageBuilderC = new ImageBuilder(dataModel, lutManager),
    xChartPainter = new LineChartPainter("X: {x}"),
    yChartPainter = new LineChartPainter("Y: {x}"),
    zChartPainter = new LineChartPainter("Z: {x}"),
    dimensions = dataModel.originalData.InSituDataProber.dimensions;

// Configure Image builders
imageBuilderA.setRenderMethod(imageBuilderA.getRenderMethods()[0]);
imageBuilderB.setRenderMethod(imageBuilderA.getRenderMethods()[1]);
imageBuilderC.setRenderMethod(imageBuilderA.getRenderMethods()[2]);

imageBuilderA.setRenderMethodImutable();
imageBuilderB.setRenderMethodImutable();
imageBuilderC.setRenderMethodImutable();

imageBuilderA.setProbeLineNotification(true);
imageBuilderB.setProbeLineNotification(true);
imageBuilderC.setProbeLineNotification(true);

function updateProbeLocation(data, envelope) {
    var builders = [imageBuilderA, imageBuilderB, imageBuilderC];

    builders.forEach(function(builder) {
        if(!equals(data, builder.getProbe())) {
            builder.setProbe(data[0], data[1], data[2])
        }
    });

    // Update charts
    xChartPainter.setMarkerLocation(data[0]/(dimensions[0]-1));
    yChartPainter.setMarkerLocation(data[1]/(dimensions[1]-1));
    zChartPainter.setMarkerLocation(data[2]/(dimensions[2]-1));
}

imageBuilderA.onProbeChange(updateProbeLocation);
imageBuilderB.onProbeChange(updateProbeLocation);
imageBuilderC.onProbeChange(updateProbeLocation);

function updateCrosshairVisibility(data, envelope) {
    var builders = [imageBuilderA, imageBuilderB, imageBuilderC];

    builders.forEach(function(builder) {
        builder.setCrossHairEnable(data);
    });

    // Update charts
    xChartPainter.enableMarker(data);
    yChartPainter.enableMarker(data);
    zChartPainter.enableMarker(data);
}

imageBuilderA.onCrosshairVisibilityChange(updateCrosshairVisibility);
imageBuilderB.onCrosshairVisibilityChange(updateCrosshairVisibility);
imageBuilderC.onCrosshairVisibilityChange(updateCrosshairVisibility);

// Line Chart handling
imageBuilderA.onProbeLineReady(updateChartPainters);
imageBuilderB.onProbeLineReady(updateChartPainters);
imageBuilderC.onProbeLineReady(updateChartPainters);

function updateChartPainters(data, envelope) {
    if(data.x.fields[0].data.length) {
        xChartPainter.updateData(data.x);
    }
    if(data.y.fields[0].data.length) {
        yChartPainter.updateData(data.y);
    }
    if(data.z.fields[0].data.length) {
        zChartPainter.updateData(data.z);
    }
}

// Create UI element
ReactDOM.render(
    React.createElement(
        MultiLayoutViewer,
        {
            queryDataModel: dataModel,
            renderers: {
                'XY': { builder: imageBuilderA, name: 'XY'},
                'ZY': { builder: imageBuilderB, name: 'ZY'},
                'XZ': { builder: imageBuilderC, name: 'XZ'},
                'Chart X': {painter: xChartPainter, name: 'Chart X'},
                'Chart Y': {painter: yChartPainter, name: 'Chart Y'},
                'Chart Z': {painter: zChartPainter, name: 'Chart Z'},
            },
        }),
    bodyElement);

dataModel.fetchData();
