var config = require('../config');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(config.ProjectName.replace(/ /g, '') + '.db');
// var Database = require('better-sqlite3');
// var db = new Database('../ColdStoneMemery.db');

const USER_DB = 'users';
const PRODUCTS_DB = 'products';
const USER_PROD_DB = USER_DB + '_' + PRODUCTS_DB;
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
  createTable(PRODUCTS_DB, {
    info:   'TEXT',
    cost:   'INTEGER',
    author: 'TEXT',
    id:     'INTEGER PRIMARY KEY'  // Map ROWID to id
  }, true);

  createTable(USER_DB, {
    username: 'TEXT',
    password: 'TEXT',
    credits:  'INTEGER',
    bio:      'TEXT',
    avatar:   'TEXT',
    id:       'INTEGER PRIMARY KEY'  // Map ROWID to id
  }, true);

  // createTable(USER_PROD_DB, {
  //   user_id: 'INTEGER',
  //   product_id: 'INTEGER'
  // }, true);

  db.run('CREATE TABLE IF NOT EXISTS ' + USER_PROD_DB + '(' +
      'user_id    INTEGER, ' +
      'product_id INTEGER, ' +
      'id         INTEGER PRIMARY KEY, ' + // Map ROWID to id
      'FOREIGN KEY(user_id) REFERENCES ' + USER_DB + '(id),' +
      'FOREIGN KEY(product_id) REFERENCES ' + PRODUCTS_DB + '(id)' +
    ');'
  )

});
module.exports.getAllProducts = function () {

}

module.exports.getProduct = function (product_id, user, done) {
  /*
  var q = 'SELECT * FROM ' + PRODUCTS_DB +
      ' INNER JOIN ' + USER_PROD_DB + ' on ' + USER_PROD_DB + '.product_id = ' + PRODUCTS_DB + '.id' +
      ' WHERE `id` == ' + product_id;
  */
  var q = 'SELECT * FROM ' + PRODUCTS_DB + ' WHERE `id` == ' + product_id;
  console.log(q);
  db.get(q, function (err, row) {
    if(err || !row) {
      return done(err || 'Product not found');
    }

    var product = row;
    if(!user) {
      return done(null, product);
    }

    // Get info on whether user owns the item
    product.owned = false;

    var q = 'SELECT * FROM ' + USER_PROD_DB +
        ' WHERE `user_id` = ' + user.id +
        ' AND `product_id` = ' + product_id;
    console.log(q);

    db.get(q, function (err, row) {
      if(err) {
        return done(err);
      }

      if(row) {
        product.owned = true;
      }

      return done(null, product);
    });
  });
};

module.exports._db = db;
module.exports.USER_DB = USER_DB;
module.exports.PRODUCTS_DB = PRODUCTS_DB;
module.exports.createTable = createTable;