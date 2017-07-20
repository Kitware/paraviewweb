# WslinkImageStream
Publish/subscribe binary image stream, API compatible with BinaryImageStream

## newInstance({client, stillQuality=100, interactiveQuality=50, mimeType='image/jpeg'})

Create an instance of a binary image stream protocol handler.

## enableView(enabled) 

Toggle ON or OFF the streaming of a given view to the client.

## startInteractiveQuality()

Trigger a call to the server to update the image quality to interactive.

## stopInteractiveQuality()

Trigger a call to the server to update the image quality to still.

## updateQuality(stillQuality=100, interactiveQuality=50) 

Update compression setting regarding the still and interactive mode.

## connect({view_id=-1, size=[500,500]})

Establish image subscription with the server.

## destroy() 

Remove listener and free resources.

## onImageReady(callback) : subscription

Attach listener for when an image is received.
