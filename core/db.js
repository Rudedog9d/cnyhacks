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
    imgSrc:   'TEXT',
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
    hidden: 'INTEGER',
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

module.exports.findAllUsers = function (done) {
  db.all('SELECT * FROM ' + USER_DB + ';', done)
};

module.exports.findUserById = function (user_id, done) {
  var q = 'SELECT * FROM ' + USER_DB + ' WHERE id = ' + user_id + ';';
  db.get(q, done)
};

module.exports.findUserByUsername = function (username, done) {
  var q = 'SELECT * FROM ' + USER_DB + ' WHERE username = "' + username + '";';
  db.get(q, done)
};

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

  // Build Query - Thanks @tbutts
  var q = 'Select * from ' + PRODUCTS_DB +
      ' LEFT JOIN (SELECT * FROM ' + USER_PROD_DB + ' where user_id = ' + user.id + ') AS up' +
      ' on products.id = up.product_id';

  // If additional filters exist, add them to the query
  if(util.objectKeys(filter).length) {
    q += ' WHERE ';
    // Add Filters
    for (var f in filter) {
      var val = filter[f];
      q += '`' + f + '` = ' + val + ' AND ';
    }

    // Hack to remove final AND
    q = q.substring(0, q.length - 4);
  }

  q += ' ORDER BY owned DESC;'; // End Query
  console.log(q);       // Log Query
  ret = [];

  // Get all product Entries
  db.each(q,
    // Each row Callback
    function(err, row) {
      if(err){ return done(err) }

      var obj = {};
      for(prop in row) {
        // Skip invalid props (todo improve)
        if(prop === 'product_id' || prop === 'user_id')
          continue;
        obj[prop] = row[prop];
      }

      // Set owned to a Boolean value
      obj['owned'] = !!row.owned;

      // Add to return list
      ret.push(obj)
    },
    // Complete callback
    function (err, numRows) {
      return done(err, ret)
    });
};

/**
 * Purchase a product. Updates the User's credits first, then updates DB with purchase on success
 * @param user    User Object purchasing Item
 * @param product Product Object to purchase [ from getProduct() ]
 * @param done    Callback when operation is finished - will be called with params from db.run()
 */
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
        // Update the existing entry (just in case)
        q = 'UPDATE ' + USER_PROD_DB +
            ' SET owned = 1' +
            ' WHERE `user_id` = ' + user.id +
            ' AND `product_id` = ' + product.id;
      } else {
        // Insert new entry to DB representing a user owns that item
        q = 'INSERT INTO ' + USER_PROD_DB + '(user_id, product_id, owned)' +
            ' VALUES (' +
            user.id + ',' +     // user_id
            product.id + ',' +  // product_id
            '1' + ')'           // owned
      }

      // Run the Update/Insert
      db.run(q, [], done);
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
  module.exports.updateUser(user, {credits: (user.credits + creditChange)}, done)
};

/**
 * Modify a User
 * @param user    User to Modify
 * @param updates Fields to update
 * @param done
 */
module.exports.updateUser = function (user, updates, done) {
  var q = 'UPDATE ' + USER_DB + ' SET ';
  for(update in updates) {
    var v = updates[update];
    q += '`' + update + '` = ' + (typeof v === 'string' ? '"' + v + '"' : v) + ','
  }
  // Hack to remove final ','
  q = q.substring(0, q.length - 1);
  q += ' WHERE `id` = ' + user.id + ';';

  db.run(q, {}, function (err) {
    done(err, Object.assign(user, updates))
  })
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
  var q = 'SELECT * FROM ' + PRODUCTS_GOLDEN_DB + (filter.length ? ' WHERE' : '' );

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