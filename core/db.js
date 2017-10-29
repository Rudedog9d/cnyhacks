var config = require('../config');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(config.ProjectName.replace(/ /g, '') + '.db');
// var Database = require('better-sqlite3');
// var db = new Database('../ColdStoneMemery.db');

const USER_DB = 'users';
const PRODUCTS_DB = 'products';
const PRODUCTS_GOLDEN_DB = 'golden_products';
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
    name:   'TEXT',
    cost:   'INTEGER',
    description:  'TEXT',
    author: 'TEXT',
    id:     'INTEGER PRIMARY KEY'  // Map ROWID to id
  }, true);

  createTable(PRODUCTS_GOLDEN_DB, {
    name:   'TEXT',
    cost:   'INTEGER',
    description: 'TEXT',
    content: 'TEXT',
    imgScr: 'TEXT',
    id:     'INTEGER PRIMARY KEY'  // Map ROWID to id
  }, true);

  createTable(USER_DB, {
    username: 'TEXT',
    password: 'TEXT',
    credits:  'INTEGER',
    golden_credits: 'INTEGER',
    bio:      'TEXT',
    avatar:   'TEXT',
    id:       'INTEGER PRIMARY KEY'  // Map ROWID to id
  }, true);

  db.run('CREATE TABLE IF NOT EXISTS ' + USER_PROD_DB + '(' +
      'user_id    INTEGER, ' +
      'product_id INTEGER, ' +
      'owned      INTEGER, ' +
      // 'id         INTEGER PRIMARY KEY, ' + // Map ROWID to id
      'FOREIGN KEY(user_id) REFERENCES ' + USER_DB + '(id),' +
      'FOREIGN KEY(product_id) REFERENCES ' + PRODUCTS_DB + '(id)' +
      ');'
  );

});
module.exports.getProduct = function (user, product_id, done) {
  return module.exports.getAllProducts(user, {id: product_id}, function (err, rows) {
    // Return first results
    done(err, rows[0])
  })
};

module.exports.getAllProducts = function (user, filter, done) {
  if(typeof filter === 'function') {
    // Filter is actually CB - How do the JS libraries do it?
    done = filter;
  }

  // Build Query
  var q = 'SELECT * FROM ' + PRODUCTS_DB +
      ' LEFT JOIN ' + USER_PROD_DB + ' on ' + USER_PROD_DB + '.product_id = ' + PRODUCTS_DB + '.id' + ' WHERE ';

  // Add Filters
  for (var f in filter) {
    var val = filter[f];
    q += '`' + f + '` = ' + val + ' AND ';
  }

  // Add filter for current user
  q += ' (`user_id` == ' + user.id + ' OR `user_id` IS NULL)';
  q += ';'; // End Query

  console.log(q);

  ret = [];

  // Get all product Entries
  db.each(q,
    // Each row Callback
    function(err, row) {
      if(err){ return done(err) }

      // Todo: make this not static and sucky
      ret.push({
        id: row.id,
        info: row.info,
        author: row.author,
        owned: !!row.owned,
        cost: row.cost
      });
    },
    // Complete callback
    function (err, numRows) {
      return done(null, ret)
    });
};

module.exports.purchaseProduct = function (user, product, done) {
  module.exports.updateUserCredits(user, 0 - product.cost, function (err) {
    if(err) { return done ? done(err) : false }

    // Check if there is already an Entry in the User_Product Table
    var q = 'SELECT * FROM ' + USER_PROD_DB +
        ' WHERE `user_id` = ' + user.id +
        ' AND `product_id` = ' + product.id;
    db.get(q, function (err, row) {
      var q = '';
      if(row) {
        // Update
        q = 'UPDATE ' + USER_PROD_DB +
            ' SET owned = 1' +
            ' WHERE `user_id` = ' + user.id +
            ' AND `product_id` = ' + product.id;
      } else {
        q = 'INSERT INTO ' + USER_PROD_DB + '(user_id, product_id, owned)' +
            ' VALUES (' +
            user.id + ',' +     // user_id
            product.id + ',' +  // product_id
            '1' + ')'           // owned
      }
      db.run(q, {}, done);
    });
  });
};

/**
 * Modify a User's credits
 * @param user          User to Modify
 * @param creditChange  Amount of Credits (Positive/Negative)
 * @param done
 */
module.exports.updateUserCredits = function (user, creditChange, done) {
  var q = 'UPDATE ' + USER_DB +
      ' SET credits = ' + (user.credits + creditChange) +
      ' WHERE `id` = ' + user.id;
  db.run(q, {}, done)
};

module.exports.getGoldenProduct = function (product_id, user, done) {
  return module.exports.getAllGoldenProducts(user, {product_id: product_id}, done)
};

module.exports.getAllGoldenProducts = function (user, filter, done) {
  if(typeof filter === 'function') {
    // Filter is actually CB - How do the JS libraries do it?
    done = filter;
  }

  // Build Query
  var q = 'SELECT * FROM ' + PRODUCTS_GOLDEN_DB +
      (filter.length ? ' WHERE' : '' );

  // Add Filters
  for (var f in filter) {
    var val = filter[f];
    q += '`' + f + '` = ' + val + ' AND ';
  }


  q += ';'; // End Query

  console.log(q);

  // Get all product Entries
  db.all(q,

      // Complete callback
      function (err, rows) {
        return done(null, rows)
      });
};

module.exports._db = db;
module.exports.USER_DB = USER_DB;
module.exports.PRODUCTS_DB = PRODUCTS_DB;
module.exports.createTable = createTable;