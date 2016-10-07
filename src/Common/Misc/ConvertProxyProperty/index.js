const typeMapping = {
  textfield: 'Cell',
  slider: 'Slider',
  'list-n': 'Enum',
  'list-1': 'Enum',
  checkbox: 'Checkbox',
  textarea: 'Cell',
};

function extractSize(ui) {
  if (ui.widget === 'list-n') {
    return -1;
  }
  return ui.size;
}

function extractLayout(ui) {
  if (ui.size === 0 || ui.size === -1 || ui.widget === 'list-n') {
    return '-1';
  }

  if (ui.size < 4) {
    return ui.size.toString();
  }

  if (ui.widget === 'list-1') {
    return '1';
  }

  if (ui.size === 6) {
    if (ui.name.toLowerCase().indexOf('bound')) {
      return '3x2';
    }
    if (ui.name.toLowerCase().indexOf('range')) {
      return '3x2';
    }
    console.log('What is the layout for', ui);
    return '2x3';
  }
  console.log('Could not find layout for', ui);
  return 'NO_LAYOUT';
}

function extractType(ui) {
  if (ui.type === 'proxy') {
    return 'string';
  }
  return ui.type;
}

function extractDomain(ui) {
  if (ui.values) {
    if (Array.isArray(ui.values)) {
      const domain = {};
      ui.values.forEach((txt) => {
        domain[txt] = txt;
      });
      return domain;
    }
    if (ui.type === 'proxy') {
      const domain = {};
      Object.keys(ui.values).forEach((key) => {
        domain[key] = key;
      });
      return domain;
    }
    return ui.values;
  }

  if (ui.range) {
    return { range: ui.range };
  }

  return {};
}

export function proxyPropToProp(property, ui) {
  if (!typeMapping[ui.widget]) {
    console.log('No propType for', ui);
  }

  const depList = ui.depends ? ui.depends.split(':') : null;
  const depStatus = depList ? Boolean(Number(depList.pop())) : true;
  const depValue = depList ? depList.pop() : null;
  const depId = depList ? depList.join(':') : null;
  const searchString = [ui.name].concat(property.value).join(' ').toLowerCase();

  return {
    show(ctx) {
      if (depId && ctx.properties[depId] !== undefined) {
        return (ctx.properties[depId][0] === depValue) ? depStatus : !depStatus;
      }
      if (ctx.filter && ctx.filter.length) {
        const queries = ctx.filter.toLowerCase().split(' ');
        let match = true;

        queries.forEach((q) => {
          match = match && searchString.indexOf(q) !== -1;
        });

        return match;
      }
      return !!ctx.advanced || !ui.advanced;
    },
    ui: {
      propType: typeMapping[ui.widget] || ui.widget,
      label: ui.name,
      help: ui.doc,
      noEmpty: true,
      layout: extractLayout(ui),
      type: extractType(ui),
      domain: extractDomain(ui),
      componentLabels: [],
      size: extractSize(ui),
    },
    data: {
      id: [property.id, property.name].join(':'),
      value: [].concat(property.value),
      size: ui.size,
    },
  };
}


export function proxyToProps(proxy) {
  return proxy.properties.map((property, index) => proxyPropToProp(property, proxy.ui[index]));
}

export default {
  proxyToProps,
  proxyPropToProp,
};
