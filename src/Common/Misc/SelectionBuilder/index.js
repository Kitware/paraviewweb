// ----------------------------------------------------------------------------
// Internal helpers
// ----------------------------------------------------------------------------

let generation = 0;

function clone(obj, fieldList, defaults) {
  const clonedObj = {};
  fieldList.forEach(name => {
    if (defaults && obj[name] === undefined && defaults[name] !== undefined) {
      clonedObj[name] = defaults[name];
    } else {
      clonedObj[name] = obj[name];
    }
    if (Array.isArray(clonedObj[name])) {
      clonedObj[name] = clonedObj[name].map(i => i);
    }
  });
  return clonedObj;
}

const endpointToRuleOperator = {
  o: '<',
  '*': '<=',
};

export const ruleTypes = {
  '3L': { terms: 3, operators: { values: [['<', '<=']], index: [1] }, variable: 0, values: [2] },
  '3R': { terms: 3, operators: { values: [['>', '>=']], index: [1] }, variable: 2, values: [0] },
  '5C': { terms: 5, operators: { values: [['<', '<='], ['<', '<=']], index: [1, 3] }, variable: 2, values: [0, 4] },
  multi: { terms: -1, operators: null },
  logical: { operators: { values: ['not', 'and', 'or', 'xor'], index: [0] } },
  row: {},
};

// ----------------------------------------------------------------------------
// Public builder method
// ----------------------------------------------------------------------------

export function empty() {
  generation++;
  return {
    type: 'empty',
    generation,
  };
}

// ----------------------------------------------------------------------------

export function partition(variable, dividers) {
  generation++;
  return {
    type: 'partition',
    generation,
    partition: {
      variable,
      dividers: dividers.map(divider =>
        clone(divider,
          ['value', 'uncertainty', 'closeToLeft'],
          { closeToLeft: false })),
    },
  };
}

// ----------------------------------------------------------------------------

export function range(vars) {
  generation++;
  const variables = {};
  const selection = {
    type: 'range',
    generation,
    range: {
      variables,
    },
  };

  // Fill variables
  Object.keys(vars).forEach(name => {
    variables[name] = vars[name].map(interval =>
      clone(interval,
        ['interval', 'endpoints', 'uncertainty'],
        { endpoints: '**' }
      )
    );
    variables[name].sort((a, b) => a.interval[0] - b.interval[0]);
  });

  return selection;
}

// ----------------------------------------------------------------------------

export function rule(type = 'multi', terms = [], roles = []) {
  generation++;
  // FIXME ?? deepClone ??
  return {
    type: 'rule',
    generation,
    rule: {
      type,
      terms,
      roles,
    },
  };
}

// ----------------------------------------------------------------------------

function variableToRule(name, ranges) {
  const terms = ['or'];
  ranges.forEach(clause => {
    terms.push({
      type: '5C',
      terms: [
        clause.interval[0],
        endpointToRuleOperator[clause.endpoints[0]],
        name,
        endpointToRuleOperator[clause.endpoints[1]],
        clause.interval[1],
      ],
    });
  });
  return {
    type: 'rule',
    rule: {
      type: 'logical',
      terms,
    },
  };
}

// ----------

function rangeToRule(selection) {
  const terms = ['and'];
  const vars = selection.range.variables;
  Object.keys(vars).forEach(name => {
    terms.push(variableToRule(name, vars[name]));
  });
  return rule('logical', terms);
}

// ----------

function partitionToRule(selection) {
  const roles = [];
  const { dividers, variable } = selection.partition;
  const terms = dividers.map((divider, idx, array) => {
    if (idx === 0) {
      return {
        type: '3L',
        terms: [
          variable,
          divider.closeToLeft ? '<' : '<=',
          divider.value,
        ],
      };
    }
    return {
      type: '5C',
      terms: [
        array[idx - 1].value,
        array[idx - 1].closeToLeft ? '<' : '<=',
        variable,
        divider.closeToLeft ? '<' : '<=',
        divider.value,
      ],
    };
  });
  const lastDivider = dividers.slice(-1);
  terms.push({
    type: '3R',
    terms: [
      lastDivider.value,
      lastDivider.closeToLeft ? '<' : '<=',
      variable,
    ],
  });

  // Fill roles with partition number
  while (roles.length < terms.length) {
    roles.push({ partition: roles.length });
  }

  return rule('multi', terms, roles);
}

// ----------------------------------------------------------------------------

export function convertToRuleSelection(selection) {
  if (selection.type === 'range') {
    return rangeToRule(selection);
  }
  if (selection.type === 'partition') {
    return partitionToRule(selection);
  }
  if (selection.type === 'empty') {
    return selection;
  }

  throw new Error(`Convertion to rule not supported with selection of type ${selection.type}`);
}

// ----------------------------------------------------------------------------
// Exposed object
// ----------------------------------------------------------------------------

export default {
  empty,
  partition,
  range,
  rule,
  convertToRuleSelection,
};
