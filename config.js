// Todo use an actual configuration manager
config = {
  // development || production
  mode: 'development',
  ProjectName: 'ReeMail'
};

// default to production
config.debug = (config.mode === 'development');

// Default Email
config.welcomeEmailPath = 'welcome-email.json';

module.exports = config;
