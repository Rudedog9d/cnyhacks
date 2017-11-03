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

var auth = require('./core/auth');
var work = require('./routes/work');
var index = require('./routes/index');
var store = require('./routes/store');
var admin = require('./routes/admin');
var resources = require('./routes/resources');
var users = require('./routes/users');
var db = require('./core/db');
var config = require('./config');

// set up session store so we can use it later for cookie monster
var SQLiteStore = require('connect-sqlite3')(expressSession);
var SessionStore = new SQLiteStore({
  db: db.db_name
});

// Set Default Config Values
config.ProjectName = config.ProjectName || 'CNY Hackathon';

var app = express();

// Set up templating ( jinga style 8-D )
nunjucks.configure(path.join(__dirname, 'views'), {
  express: app,
  watch: config.debug,
  noCache: config.debug
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
  store: SessionStore,
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));


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
app.use('/resources', resources);
app.use('/work', work);
app.use('/store', store);
app.use('/adminsonly', admin);
app.use('/cookies', function (req, res, next) {
  var cookie = req.body.cookie;
  if(!cookie) {
    return next(new Error('no cookie supplied', 400))
  }

  // We only want the 32 chars between : and . - ex, W9EnBM62iUJJO_lysaZhEh77oGChR_QM from
  // s:W9EnBM62iUJJO_lysaZhEh77oGChR_QM.xt1JHAZ7rS39fny/9mNrgq83U0ksDXqe68R8NtUsclQ
  if(cookie.indexOf('%') !== -1) {
    return res.send("Don't send me that encoded garbage!")
  }

  if(cookie === req.sessionID) {
    return res.send("But I already know who YOU are! I want a new cookie!")
  }

  SessionStore.get(cookie, function(err, session){
    if(err) {
      var err = new Error('An error occurred looking up the cookie');
      err.status = 500;
      return next(err)
    }

    if(session) {
      return res.send('flag{CO0kK3ym0NsT3R}')
    }
    return res.send("yuck! You call that a cookie?!?")
  })
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error.html');
});

module.exports = app;
