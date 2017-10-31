// Todo use an actual configuration manager
config = {
  // development || production
  mode: 'development',
  ProjectName: 'Cold Stone Memery'
};

// default to production
config.debug = (config.mode === 'development');

module.exports = config;
