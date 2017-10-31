// Todo use an actual configuration manager
config = {
  // development || production
  mode: 'production',
  ProjectName: 'Cold Stone Memery'
};

// default to production
config.debug = (config.mode === 'development');

module.exports = config;