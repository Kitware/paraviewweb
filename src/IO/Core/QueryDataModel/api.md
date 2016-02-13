# QueryDataModel #

This class definition lets you create a Data Model from a specific JSON object which
describes a n-dimensional system. The created model allows you to query
and navigate through the data via an API, UI control, and/or mouse interaction.

That model will handle all the data management and delegate the data processing
or rendering to your application.

This documentation will focus on its API and its usage.

**JSON Structure**

The core of that _Query Data Model_ is the JSON structure that it loads
and works with. The following JSON structure illustrate what this module is expecting:

```js
{
    id          : 'unique_identifier_like_a_sha',
    type        : [ 'tonic-query-data-model',
                    'extended-model-name-1',
                    'extended-model-name-2' ],
    arguments   : {
        't' : {
            label   : 'Time',
            default : 3,
            ui      : 'slider',
            values  : [ '00', '05', '10', '15', '20' ],
            loop    : 'reverse',
            bind    : {
                mouse : { zoom : { modifier: 0, coordinate: 1, step: 0 } }
            }
        },
        'field' : {
            label   : 'Field',
            default : 1,
            ui      : 'list',
            values  : [ 'Pressure', 'Temperature', 'Velocity' ]
        },
        'alpha' : {
            label   : 'Angle',
            ui      : 'slider',
            values  : [ '0', '90', '180', '270' ],
            loop    : 'modulo',
            bind    : {
                mouse : { drag : { modifier: 0, coordinate: 0, step: 10 } }
            }
        }
    },
    arguments_order: [ 'field', 'alpha', 't' ],
    data: [
        {
            name    : 'image',
            type    : 'blob',
            mimeType: 'image/jpg',
            pattern : '{field}/{t}_{alpha}.jpg'
        },{
            name    : 'description',
            type    : 'text',
            pattern : '{field}/{t}.txt'
        },{
            name    : 'statistic',
            type    : 'json',
            pattern : '{field}/{t}_{alpha}.json',
            category: ['option-b']
        }
    ],
    metadata: { /* Can contain what you want */ }
}
```

### **id**

A string that can be used to uniquely identify the given model. If none is provided,
the _QueryDataModel_ will automatically generate one.

### **type**

Describe the composition of the given model. As we describe a _Query Data Model_
it must contain _'tonic-query-data-model'_ but can be augmented with any
additional data which could also then be used to drive the querying/processing/rendering.

What is described here is what we expect as a _'tonic-query-data-model'_ type.
Additional data structures can be added but they should not interfere or redefine
the existing core structure.

### **arguments**

List of _arguments_ that can be used to describe the query.
Each argument must have at least a list of **values**.

The rest of the options will then be derived from their default.
Here is the list of defaults that will be picked if they are not provided.

```js
{
    arguments: {
        argId: {
            label   : 'argId',      // The actual name of the argument
            default : 0,            // The first item in the values list
            ui      : 'list',       // The UI will use a drop down
            loop    : undefined,    // No looping on this parameter
            bind    : undefined     // No binding will occur on mouse/key/?
        }
    }
}
```

Here is the possible set of values for each argument and what they are:

- **label**   : Human readable name for UI.
- **default** : Index within the values for initial value. (default: **0**)
- **ui**      : Type of UI component to use. Can either be [ undefined, 'slider', '**list**'].
- **loop**    : Specify a periodic/looping behavior. Can either be [ **undefined**, 'modulo', 'reverse']
- **bind**    : Specify how to bind interactions to attribute.

### **arguments_order**

Order of the arguments that should be used to build the user interface.
This is an array of strings with the name of all the attributes you want to see
inside the user interface.

### **data**

List of data to be fetched. Each element in the list must have a **name**, **type** and a **pattern**.
Then if the type is _'blob'_, a **mimeType** must be specified.

_pattern_ must be defined is using the {} to surround the name of the
parameter that can compose the query.

Optionally, data can be grouped by categories to simplify the way they're fetched. This allows you to exclusively fetch the data you are currently interested in.
If no category is provided, that means the full data list is mandatory.

### **metadata**

User data that can easily be accessed via the API.

## constructor(jsonObject, basepath)

The jsonObject content has been previously described but the basepath is used to
fetch the related resource relative to that basepath.

## getQuery() : { argA: valueA, argB: valueB }

Returns a simple map where the keys are the _arguments_ attribute names and the
values are the actual value for the given attribute.

## fetchData(category)

Triggers the download of the data associated with the current _query_.

If no category is provided, then only the data with no category will be downloaded
while if a category is provided all the data that belong to that category will be
downloaded.

In order to be aware when that set of data is available for processing you can
attach a listener by calling the following method.

```javascript
// For the default category
instance.onDataChange( (data, envelope) => {} );

// For custom category
instance.on( categoryName, (data, envelope) => {});

// Data layout will look like that
var data = {
    dataName1: dataContentFromDataManager,
    dataName2: dataContentFromDataManager
}
```

## lazyFetchData(category)

Similar to __fetchData(category)__ except that it won't make a network request
until the previous one is fully done. Moreover any __lazyFetchData()__ call made
during that pending period will be ignored and only the latest one will be triggered.

Very useful when interacting with a slider and/or mouse interaction for changing
the underlying query.

## {_action_}(attributeName) : changeDetected

Several actions can be performed on a given attribute to change the query.
Sometimes an action won't result in any change as we may have reached the end
of the range of a non-looping attribute. Hence we provide feedback to the user
to let them know if their method call affected the underline query or not.

Here is the list of possible actions:

- **first**     : Move to the _first_ value of the values list.
- **previous**  : Move to the _previous_ value in the values list.
- **next**      : Move to the _next_ value in the values list.
- **last**      : Move to the _last_ value in the values list.

This will trigger the following events:

- **state.change.first**
- **state.change.previous**
- **state.change.next**
- **state.change.last**

Those events could be capture by adding a listener using the **onStateChange** method.

## setValue(attributeName, value) : changeDetected

Assigns a new value to the attribute, but the value must be part of the values list.

This will trigger the following event:

- **state.change.value**

That event can be capture by adding a listener using the **onStateChange** method.

## setIndex(attributeName, index) : changeDetected

Assigns a new value to the attribute base on the value that is at provided index
inside the values list.

This will trigger the following event:

- **state.change.idx**

That event can be capture by adding a listener using the **onStateChange** method.

## getValue(attributeName) : value

Returns the current value inside the values list.

## getValues(attributeName) : values

Returns the full list of possible values.

## getIndex(attributeName) : index

Returns the current value index inside the values list.

## getSize(attributeName) : index

Returns the number of values inside the values list or _null_ if the attribute
was not found.

## getUiType(attributeName) : String

Returns the type of the UI that should be created. It can either be _slider_ or _list_.

## label(attributeName) : String

Returns the label that should be used for the given attribute.

## setAnimationFlag(attributeName, flagState)

Tags or untags a given attribute to be part of the animation process.

This will trigger the following event:

- **state.change.animation**

That event can be capture by adding a listener using the **onStateChange** method.

## getAnimationFlag(attributeName)

Returns the current state of the animation flag for a given attribute.

## toggleAnimationFlag(attributeName) : currentState

Toggles the animation flag state and return its actual value.

This will trigger the following event:

- **state.change.animation**

That event can be capture by adding a listener using the **onStateChange** method.

## hasAnimationFlag() : Boolean

Returns true if at least one argument has been toggled for animation.

## isAnimating() : Boolean

Returns true if an animation is currently playing.

## animate( start[, deltaT=500] )

Start or stop an animation where a deltaT can be provided in milliseconds. For example:

```js
// Will start the animation with a wait time of 750ms
// before going to the next data query.
animate(true, 750);
```

To stop a running animation.

```js
animate(false);
```

On an animation stop, the following event will be triggered:

- **state.change.play**

That event can be capture by adding a listener using the **onStateChange** method.

## getDataMetaData(dataName) : { data metadata }

Helper function used to retrieved any metadata that could be associated to a data
entry.

## onDataChange( listener ) : subscriptionObject

Add a data listener to be aware when the expected set of data will be ready.
The _data_ object that is provided to the listener will contains all the
cachedDataObject from dataManager instance that is part of the category that was
used to register the listener, using their name from the original JSON data model.

```js
function listener(data, envelope) {
    // Where data is
    // {
    //    data-name: {data-manager}cacheObject
    // }
}
```

More information on **subscriptionObject** and listeners can be found on
[monologue.js](https://github.com/postaljs/monologue.js).

For instance, to listen for a specific category, you should use the following method:

```javascript
instance.on(categoryName, listener);
```

In fact, the **onDataChange** is calling the __this.on('_', listener)__ as the '_' is
the default category name.

## onStateChange(listener)

Shortcut for __this.on('state.change.*', listener)__.

And the content of such event will be as follow.

```js
var event = {
    value: "0.1",
    idx: 0,
    name: "Time",
    instance: queryDataModelInstance
};
```

## getMouseListener() : { drag: callback, zoom: callback }

This method will create a callback map that can be used to be attach to a __MouseHandler__ instance.

If no mouse binding was defined in the original model, then the method will return null.

## clone() : new instance

This method will create a new instance of QueryDataModel using the same core
but totally disconnected event or query wise.

## getCacheSize()

Return the maximum size that the cache can contain before the gc() take any action.

## setCacheSize( maxSizeInBytes )

Update the maximum cache size to adjust when the garbage collector should empty it.

## getMemoryUsage()

Return the current memory usage of the cache data in Bytes.

## link(queryDataModel, args=null, fetch=false) : Subscription

Link any attribute change from the given queryDataModel to your local instance.
Optionally, you can provide a list of arguments that you want to synchronize as
well as any change could also trigger a fetchData() call on your instance.
The returned object let you unsubscribe of the change update.
