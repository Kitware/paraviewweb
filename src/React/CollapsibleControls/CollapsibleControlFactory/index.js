const WidgetFactoryMapping = {};

function registerWidget(name, fn) {
  WidgetFactoryMapping[name] = fn;
}

function createWidget(name, options) {
  const fn = WidgetFactoryMapping[name];

  if (fn) {
    return fn(options);
  }
  return null;
}

function getWidgets(obj) {
  if (!obj) {
    return [];
  }

  const widgetDesc = obj.getControlWidgets();
  const widgetList = [];

  widgetDesc.forEach((desc) => {
    const widget = createWidget(desc.name, desc);
    if (widget) {
      widgetList.push(widget);
    } else {
      console.error('Unable to create widget for name:', desc.name);
    }
  });

  return widgetList;
}

export default {
  createWidget,
  getWidgets,
  registerWidget,
};
