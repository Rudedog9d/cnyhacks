var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
var flash = require('connect-flash');
var passport = require('passport');
var nunjucks = require('nunjucks');
var serveIndex = require('serve-index');

// Config
var config = require('./config');

// Core Server files
var auth = require('./core/auth');
var db = require('./core/db');

// Routes
var index = require('./routes/index');
var mail = require('./routes/mail');
var admin = require('./routes/admin');
var resources = require('./routes/resources');
var users = require('./routes/users');
var api = require('./routes/api');

/* Use MemoryStore unless SQLite is required */
// // Set up session store so we can use it later for cookie monster
// var SQLiteStore = require('connect-sqlite3')(expressSession);
// var SessionStore = new SQLiteStore({
//   // db: db.db_name
//   db: 'sessions.db'
// });

// Set Default Config Values
config.ProjectName = config.ProjectName || 'CNY Hackathon';

var app = express();

// Set up templating ( jinga style 8-D )
let nj = nunjucks.configure(path.join(__dirname, 'views'), {
  express: app,
  watch: config.debug,
  noCache: config.debug
});

// unused
nj.addFilter('base64', function(str) {
  return Buffer.from(str, 'utf8').toString('base64');
});

// unused
nj.addFilter('encodeUri', function(str) {
  return encodeURIComponent(str)
});

nj.addFilter('hexify', function(str) {
  var hex, i;

  var result = "";
  for (i=0; i<str.length; i++) {
    hex = str.charCodeAt(i).toString(16);
    result += ("000"+hex).slice(-4);
  }

  return result
});

// unused
nj.addFilter('unhexify', function(str) {
  var j;
  var hexes = str.match(/.{1,4}/g) || [];
  var back = "";
  for(j = 0; j<hexes.length; j++) {
    back += String.fromCharCode(parseInt(hexes[j], 16));
  }

  return back;
});


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(flash());

app.use(expressSession({
  secret: 'mySecretKey',
  cookie: {
    httpOnly: false,
    sameSite: false,
    secure: false
  },
  // store: SessionStore,
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/public', serveIndex(path.join(__dirname, 'public'), {
  hidden: true,
  view: 'details'
}));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Legacy Route
app.use('/', express.static(path.join(__dirname, 'public')));

// Make .git dir public
app.use('/.git', serveIndex(path.join(__dirname, '.git'), {
  hidden: true,
  view: 'details'
}));
app.use('/.git', express.static(path.join(__dirname, '.git')));

app.set('port', process.env.PORT || 3000);

// Set local variables to send on EVERY request
app.locals = {
  'ProjectName': config.ProjectName
};

// Set local variables to send on a per-request basis (user, ect)
app.use(function (req, res, next) {
  // Send user with each request (Only for use by Express templates, not user)
  res.locals.user = req.user;
  return next();
});

/* UNAUTHENTICATED ROUTES */
app.use('/vendor', express.static('node_modules'));
app.use('/', index);
app.use('/users', users);

app.use(auth.requireLogin);

/* AUTHENTICATED ROUTES ONLY */
app.use('/api', api);
app.use('/mail', mail);
app.use('/resources', resources);
app.use('/admin', admin);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('DogNet Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = err;

  // Remove stack trace in Production Mode
  if(!config.debug) {
    res.locals.error.stack = ''
  }

  // render the error page
  res.status(err.status || 500);
  res.render('error.html');
});

module.exports = app;
