config = {
    // development || production
    mode: 'development'
};

// default to production
config.debug = (config.mode === 'development');

module.exports = config;