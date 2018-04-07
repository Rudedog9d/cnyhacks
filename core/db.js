var config = require('../config');
var util = require('./util');
var sqlite3 = require('sqlite3').verbose();
var path = require('path');
var fs = require('fs');
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
    // timestamp: 'DATE',  // Time that email was recieved
    username: 'TEXT',  // Time that email was recieved
    from: 'TEXT',  // From address email was received from
    to: 'TEXT',  // List of Emails in the TO header
    cc: 'TEXT',  // List of Emails in the CC header
    bcc: 'TEXT',  // List of Emails in the BCC header
    subject: 'TEXT',  // Subject line of the email
    body: 'TEXT',  // Body of email
    markup: 'TEXT',  // Markup language of email - valid options are HTML, MARKDOWN, or NONE
    secure: 'BOOL',  // Whether email was sent securely
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
  module.exports.queryOne(tables.USER_DB, {"username": username}, done)
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
  ], function(err) {
    if(err)
      return done(err);
    // return up a directory to access root of repo by default
    let filepath = path.join(__dirname, '..', config.welcomeEmailPath);
    fs.readFile(filepath, 'utf8', function (err, data) {
      if(err){
        let err = new Error(`Could not read welcome email from ${config.welcomeEmailPath}`);
        err.status = 500;
        return done(err)
      }

      let welcomeEmail = JSON.parse(data);
      welcomeEmail.username = username;
      welcomeEmail.to = username;
      welcomeEmail.from = "ReeMail System";
      welcomeEmail.folder = "inbox";
      module.exports.insertMail(welcomeEmail, done)
    })
  })
};

module.exports.insertMail = function (info, done) {
  if(!info.username || !info.folder) {
    let err = new Error(`Username and Folder are required!`);
    err.status = 500;
    return done(err)
  }

  // Base Query
  let query = 'INSERT INTO `' + tables.EMAILS_DB + '` (';//'`(`username`,`password`, `bio`, `avatar`) VALUES (?, ?, ?, ?);';
  let valuesString = ') VALUES (';
  let vals = [];

  // Add Keys Generically
  for(key in info) {
    query += `\`${key}\`,`;
    valuesString += `?, `;
    vals.push(info[key]);
  }

  // Remove trailing comma/space
  query = query.substring(0, query.length - 1);
  valuesString = valuesString.substring(0, valuesString.length - 2);

  // End Query
  query += valuesString + ");";

  return db.run(query, vals, done)
};

module.exports.getMail = function (query, done) {
  return module.exports.query(tables.EMAILS_DB, query, done)
};

module.exports.getFolders = function (username, done) {
  let q = `SELECT DISTINCT folder FROM \`${tables.EMAILS_DB}\` WHERE username = "${username}";`;
  return module.exports._query(q, done)
};

module.exports.queryOne = function (table, query, done) {
  module.exports.query(table, query, function (err, res) {
    done(err, res && res.length ? res[0] : null)
  })
};

module.exports.query = function (table, query, done) {
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

  return module.exports._query(q, done)
};

module.exports._query = function (query, done) {
  console.log(query);       // Log Query
  ret = [];

  // Get all product Entries
  return db.all(query, done)
};

module.exports._db = db;
module.exports.tables = tables;
module.exports.createTable = createTable;