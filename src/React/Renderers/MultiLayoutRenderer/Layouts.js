/* eslint-disable */
export default {
  '2x2': function (center, spacing, width, height) {
    return [
      [spacing, spacing, center[0] - 1.5 * spacing, center[1] - 1.5 * spacing],
      [
        center[0] + 0.5 * spacing,
        spacing,
        width - center[0] - 1.5 * spacing,
        center[1] - 1.5 * spacing,
      ],
      [
        spacing,
        center[1] + 0.5 * spacing,
        center[0] - 1.5 * spacing,
        height - center[1] - 1.5 * spacing,
      ],
      [
        center[0] + 0.5 * spacing,
        center[1] + 0.5 * spacing,
        width - center[0] - 1.5 * spacing,
        height - center[1] - 1.5 * spacing,
      ],
    ];
  },
  '1x1': function (center, spacing, width, height) {
    return [[spacing, spacing, width - 2 * spacing, height - 2 * spacing]];
  },
  '1x2': function (center, spacing, width, height) {
    return [
      [spacing, spacing, width - 2 * spacing, center[1] - 1.5 * spacing],
      [
        spacing,
        center[1] + 0.5 * spacing,
        width - 2 * spacing,
        height - center[1] - 1.5 * spacing,
      ],
    ];
  },
  '2x1': function (center, spacing, width, height) {
    return [
      [spacing, spacing, center[0] - 1.5 * spacing, height - 2 * spacing],
      [
        center[0] + 0.5 * spacing,
        spacing,
        width - center[0] - 1.5 * spacing,
        height - 2 * spacing,
      ],
    ];
  },
  '3xT': function (center, spacing, width, height) {
    return [
      [spacing, spacing, width - 2 * spacing, center[1] - 1.5 * spacing],
      [
        spacing,
        center[1] + 0.5 * spacing,
        center[0] - 1.5 * spacing,
        height - center[1] - 1.5 * spacing,
      ],
      [
        center[0] + 0.5 * spacing,
        center[1] + 0.5 * spacing,
        width - center[0] - 1.5 * spacing,
        height - center[1] - 1.5 * spacing,
      ],
    ];
  },
  '3xL': function (center, spacing, width, height) {
    return [
      [spacing, spacing, center[0] - 1.5 * spacing, height - 2 * spacing],
      [
        center[0] + 0.5 * spacing,
        spacing,
        width - center[0] - 1.5 * spacing,
        center[1] - 1.5 * spacing,
      ],
      [
        center[0] + 0.5 * spacing,
        center[1] + 0.5 * spacing,
        width - center[0] - 1.5 * spacing,
        height - center[1] - 1.5 * spacing,
      ],
    ];
  },
  '3xR': function (center, spacing, width, height) {
    return [
      [spacing, spacing, center[0] - 1.5 * spacing, center[1] - 1.5 * spacing],
      [
        center[0] + 0.5 * spacing,
        spacing,
        width - center[0] - 1.5 * spacing,
        height - 2 * spacing,
      ],
      [
        spacing,
        center[1] + 0.5 * spacing,
        center[0] - 1.5 * spacing,
        height - center[1] - 1.5 * spacing,
      ],
    ];
  },
  '3xB': function (center, spacing, width, height) {
    return [
      [spacing, spacing, center[0] - 1.5 * spacing, center[1] - 1.5 * spacing],
      [
        center[0] + 0.5 * spacing,
        spacing,
        width - center[0] - 1.5 * spacing,
        center[1] - 1.5 * spacing,
      ],
      [
        spacing,
        center[1] + 0.5 * spacing,
        width - 2 * spacing,
        height - center[1] - 1.5 * spacing,
      ],
    ];
  },
};
/* eslint-enable */
