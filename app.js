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
var index = require('./routes/index');
var store = require('./routes/store');
var admin = require('./routes/admin');
var users = require('./routes/users');
var db = require('./core/db');
var config = require('./config');

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
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(flash());
app.use(expressSession({secret: 'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));


// Set local variables to send on EVERY request
app.locals = {
    'ProjectName': config.ProjectName || 'CNY Hackathon'
};

// Set local variables to send on a per-request basis (user, ect)
app.use(function (req, res, next) {
    // Send user with each request (Only for use by Express templates, not user)
    res.locals.user = req.user;
    return next();
});

app.use('/', index);
app.use('/users', users);
app.use('/store', store);
app.use('/adminsonly', admin);
app.use('/vendor', express.static('node_modules'));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error.html');
});

module.exports = app;
