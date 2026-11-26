module.exports = {
  Platform: {
    OS: 'ios',
    select: (options) => (options.ios !== undefined ? options.ios : options.default),
  },
  StyleSheet: {
    create: (styles) => styles,
    absoluteFill: {},
  },
};
