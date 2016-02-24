const typeMapping = {
  textfield: 'Cell',
  slider: 'Slider',
  'list-n': 'Enum',
  'list-1': 'Enum',
  checkbox: 'Checkbox',
};

function extractLayout(ui) {
  if(ui.size < 4) {
    return ui.size.toString();
  }

  if(ui.size === 6) {
    if(ui.name.toLowerCase().indexOf('bound')) {
      return '3x2';
    }
    if(ui.name.toLowerCase().indexOf('range')) {
      return '3x2';
    }
    console.log('What is the layout for', ui);
    return '2x3';
  }
  console.log('Could not find layout for', ui);
  return 'NO_LAYOUT';
}

function extractDomain(ui) {
  if(ui.values) {
    if(Array.isArray(ui.values)) {
      const domain = {};
      ui.values.forEach(txt => {
        domain[txt] = txt;
      });
      return domain;
    }
    return ui.values;
  }

  if(ui.range) {
    console.log('FIXME: build domain using range');
  }

  return {};
}

export function proxyPropToProp(property, ui) {

  if(!typeMapping[ui.widget]) {
    console.log('No propType for', ui);
  }

  const searchString = [ ui.name, ui.doc ].concat(property.value).join(' ').toLowerCase();

  return {
    show(ctx) {
      if(ctx.filter && ctx.filter.length) {
        const queries = ctx.filter.toLowerCase().split(' ');
        let match = true;

        queries.forEach(q => {
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
      type: ui.type,
      domain: extractDomain(ui),
      componentLabels: [],
      size: ui.size,
    },
    data: {
      id: [property.id, property.name].join(':'),
      value: [].concat(property.value),
    },
  }
}


export function proxyToProps(proxy) {
  return proxy.properties.map((property, index) => {
    return proxyPropToProp(property, proxy.ui[index]);
  })
}

export default {
  proxyToProps,
  proxyPropToProp,
}
