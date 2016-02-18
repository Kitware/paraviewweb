# ImageExporter

Class used with an ArcticViewer server to update **index.js** metadata and thumbnails.

## constructor(format='image/jpeg', padding=3)

Padding if used to ensure the generated timestamp have a constant size.

## exportImage(data) 

A POST request will be issued on '/export' using the **canvas** and **arguments** available from the given data object.

## updateMetadata(dataToSend)

A POST request will be issued on '/update' with the exported image and metadata.

## extractCanvasRegion(canvas, region, outputSize, format='image/png')

Helper method that will return a base64 encoded string representing the sub-region of a given canvas as an image.
