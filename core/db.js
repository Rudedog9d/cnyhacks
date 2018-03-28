var config = require('../config');
var util = require('./util');
var sqlite3 = require('sqlite3').verbose();
var db_name = '';
if(config.debug) {
  db_name = config.ProjectName.replace(/ /g, '') + '_DEV.db';
  console.log('DEBUG MODE: Using DB file ' + db_name);
} else {
  db_name = config.ProjectName.replace(/ /g, '') + '.db';
  console.log('PRODUCTION MODE: Using DB file ' + db_name);
}
module.exports.db_name = db_name;
var db = new sqlite3.Database(db_name);

const tables = {
  USER_DB: 'users',
  EMAILS_DB: 'emails'
};

module.exports.db = {};

/**
 * Create a table `name` in database with `fields`.
 *
 * @param name (String): Name of table to create
 * @param fields (Dict): Field names to create in table. ( key=name, value=type )
 * @param upsert Boolean: Create the table only if it doesn't exist (otherwise raise error)
 */
function createTable(name, fields, upsert) {
  var len = Object.keys(fields).length;
  var _field_str = "";
  var i = 0;

  for (var field in fields) {
    var type = fields[field];
    _field_str += '`' + field + '`' + (type ? ' ' + type : '');

    // Add comma to string if not yet at end
    if (i + 1 !== len) {
      _field_str += ', '
    }

    i++;
  }

  db.run('CREATE TABLE ' + (upsert ? 'IF NOT EXISTS' : '') + '`' + name + '` (' + _field_str + ');')

  // todo: this the smart way ( no idea why it doesn't work -_- )
  // var cmd = db.prepare('CREATE TABLE $name ( ? )', {
  //   $name: name
  // })
}

module.exports.db.run = function (q, cb) {
  _db.run(q, cb)
};

module.exports.db.get = function (q, cb) {
  _db.get(q, cb)
};

// Init DB
db.serialize(function () {
  createTable(tables.EMAILS_DB, {
    folder: 'TEXT',  // Folder that the mail belongs to
    timestamp: 'DATE',  // Time that email was recieved
    user: 'TEXT',  // Time that email was recieved
    from: 'EMAIL',  // From address email was received from
    to: 'LIST',  // List of Emails in the TO header
    cc: 'LIST',  // List of Emails in the CC header
    bcc: 'LIST',  // List of Emails in the BCC header
    subject: 'TEXT',  // Subject line of the email
    body: 'TEXT',  // Body of email
    markup: 'TEXT',  // Markup language of email - valid options are HTML, MARKDOWN, or NONE
    secure: 'BOOL',  // Whether email was sent securely
    password: 'TEXT',  // Bcrypt password to decrypt email, if it was sent encrypted and internally
    id:     'INTEGER PRIMARY KEY'  // Map ROWID to id
  }, true);

  createTable(tables.USER_DB, {
    username: 'TEXT',
    password: 'TEXT',
    bio:      'TEXT',
    avatar:   'TEXT',
    id:       'INTEGER PRIMARY KEY'  // Map ROWID to id
  }, true);

  // db.run('CREATE TABLE IF NOT EXISTS ' + USER_PROD_DB + '(' +
  //     'user_id    INTEGER, ' +
  //     'product_id INTEGER, ' +
  //     'owned      INTEGER, ' +
  //     // 'id         INTEGER PRIMARY KEY, ' + // Map ROWID to id
  //     'FOREIGN KEY(user_id) REFERENCES ' + USER_DB + '(id),' +
  //     'FOREIGN KEY(product_id) REFERENCES ' + PRODUCTS_DB + '(id)' +
  //     ');'
  // );

});

module.exports.findAllUsers = function (done) {
  db.all('SELECT * FROM ' + tables.USER_DB + ';', done)
};

module.exports.findUserById = function (user_id, done) {
  var q = 'SELECT * FROM ' + tables.USER_DB + ' WHERE id = ' + user_id + ';';
  db.get(q, done)
};

module.exports.findUserByUsername = function (username, done) {
  var q = 'SELECT * FROM ' + tables.USER_DB + ' WHERE username = "' + username + '";';
  // db.get(q, done)
  module.exports._queryOne(tables.USER_DB, {"username": username}, done)
};

module.exports.insertUser = function (username, passwd, bio, avatar, done) {
  if(!username || !passwd) {
    return done("Username and password required!")
  }

  var query = 'INSERT INTO `' + tables.USER_DB + '`(`username`,`password`, `bio`, `avatar`) VALUES (?, ?, ?, ?);';
  return db.run(query, [
      username,  // username
      passwd,    // password
      bio || 'I am <b>Awesome</b>!', // Default Bio,
      avatar || "unknown.png"        // default avatar
  ], done)
};

module.exports.getEmails = function (query, done) {
  return module.exports._query(tables.USER_DB, query, done)
};

module.exports._queryOne = function (table, query, done) {
  module.exports._query(table, query, function (err, res) {
    done(err, res && res.length ? res[0] : null)
  })
};

module.exports._query = function (table, query, done) {
  // Build Query
  var q = 'Select * from ' + table;

  // If additional filters exist, add them to the query
  if(util.objectKeys(query).length) {
    q += ' WHERE ';
    // Add Filters
    for (var f in query) {
      var val = query[f];
      q += '`' + f + '` = "' + val + '" AND ';
    }

    // Hack to remove final AND
    q = q.substring(0, q.length - 4);
  }

  q += ';'; // End Query
  console.log(q);       // Log Query
  ret = [];

  // Get all product Entries
  return db.all(q, done)
};

module.exports._db = db;
module.exports.tables = tables;
module.exports.createTable = createTable;