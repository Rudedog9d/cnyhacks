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
module.exports.updatePassword = function (username, pass, done) {
  module.exports.findUserByUsername(username , function(err, user){
    if(err) {
      return done(err);
    }
    if(!user) {
      err = new Error("User Not Found");
      err.status = 404;
      return done(err)
    }

    let q = "UPDATE `users` SET `password`='" + pass + "' WHERE `_rowid_`='" + user.id + "';";
    db.run(q, done);
  });
};

// module.exports.getProduct = function (user, product_id, done) {
//   return module.exports.getAllProducts(user, {id: product_id}, function (err, rows) {
//     // Return first results
//     done(err, rows[0])
//   })
// };
//
// module.exports.getAllProducts = function (user, filter, done) {
//   if(typeof filter === 'function') {
//     // Filter is actually CB - How do the JS libraries do it?
//     done = filter;
//   }
//
//   // Build Query - Thanks @tbutts
//   var q = 'Select * from ' + PRODUCTS_DB +
//       ' LEFT JOIN (SELECT * FROM ' + USER_PROD_DB + ' where user_id = ' + user.id + ') AS up' +
//       ' on products.id = up.product_id';
//
//   // If additional filters exist, add them to the query
//   if(util.objectKeys(filter).length) {
//     q += ' WHERE ';
//     // Add Filters
//     for (var f in filter) {
//       var val = filter[f];
//       q += '`' + f + '` = ' + val + ' AND ';
//     }
//
//     // Hack to remove final AND
//     q = q.substring(0, q.length - 4);
//   }
//
//   q += ' ORDER BY owned DESC;'; // End Query
//   console.log(q);       // Log Query
//   ret = [];
//
//   // Get all product Entries
//   db.each(q,
//     // Each row Callback
//     function(err, row) {
//       if(err){ return done(err) }
//
//       var obj = {};
//       for(prop in row) {
//         // Skip invalid props (todo improve)
//         if(prop === 'product_id' || prop === 'user_id')
//           continue;
//         obj[prop] = row[prop];
//       }
//
//       // Set owned to a Boolean value
//       obj['owned'] = !!row.owned;
//
//       // Add to return list
//       ret.push(obj)
//     },
//     // Complete callback
//     function (err, numRows) {
//       return done(err, ret)
//     });
// };
//
// /**
//  * Purchase a product. Updates the User's credits first, then updates DB with purchase on success
//  * @param user    User Object purchasing Item
//  * @param product Product Object to purchase [ from getProduct() ]
//  * @param done    Callback when operation is finished - will be called with params from db.run()
//  */
// module.exports.purchaseProduct = function (user, product, done) {
//   module.exports.updateUserCredits(user, 0 - product.cost, function (err) {
//     if(err) { return done ? done(err) : false }
//
//     // Check if there is already an Entry in the User_Product Table
//     var q = 'SELECT * FROM ' + USER_PROD_DB +
//         ' WHERE `user_id` = ' + user.id +
//         ' AND `product_id` = ' + product.id;
//     db.get(q, function (err, row) {
//       var q = '';
//       if(row) {
//         // Update the existing entry (just in case)
//         q = 'UPDATE ' + USER_PROD_DB +
//             ' SET owned = 1' +
//             ' WHERE `user_id` = ' + user.id +
//             ' AND `product_id` = ' + product.id;
//       } else {
//         // Insert new entry to DB representing a user owns that item
//         q = 'INSERT INTO ' + USER_PROD_DB + '(user_id, product_id, owned)' +
//             ' VALUES (' +
//             user.id + ',' +     // user_id
//             product.id + ',' +  // product_id
//             '1' + ')'           // owned
//       }
//
//       // Run the Update/Insert
//       db.run(q, [], done);
//     });
//   });
// };
//
// /**
//  * Modify a User's credits
//  * @param user          User to Modify
//  * @param creditChange  Amount of Credits (Positive/Negative)
//  * @param done
//  */
// module.exports.updateUserCredits = function (user, creditChange, done) {
//   module.exports.updateUser(user, {credits: (user.credits + creditChange)}, done)
// };
//
// /**
//  * Modify a User
//  * @param user    User to Modify
//  * @param updates Fields to update
//  * @param done
//  */
// module.exports.updateUser = function (user, updates, done) {
//   var q = 'UPDATE ' + USER_DB + ' SET ';
//   for(update in updates) {
//     var v = updates[update];
//     q += '`' + update + '` = ' + (typeof v === 'string' ? '"' + v + '"' : v) + ','
//   }
//   // Hack to remove final ','
//   q = q.substring(0, q.length - 1);
//   q += ' WHERE `id` = ' + user.id + ';';
//
//   db.run(q, {}, function (err) {
//     done(err, Object.assign(user, updates))
//   })
// };
//
// module.exports.getGoldenProduct = function (product_id, user, done) {
//   return module.exports.getAllGoldenProducts(user, {product_id: product_id}, done)
// };
//
// module.exports.getAllGoldenProducts = function (user, filter, done) {
//   if(typeof filter === 'function') {
//     // Filter is actually CB - How do the JS libraries do it?
//     done = filter;
//   }
//
//   // Build Query
//   var q = 'SELECT * FROM ' + PRODUCTS_GOLDEN_DB + (filter.length ? ' WHERE' : '' );
//
//   // Add Filters
//   for (var f in filter) {
//     var val = filter[f];
//     q += '`' + f + '` = ' + val + ' AND ';
//   }
//
//
//   q += ';'; // End Query
//
//   console.log(q);
//
//   // Get all product Entries
//   db.all(q,
//
//       // Complete callback
//       function (err, rows) {
//         return done(null, rows)
//       });
// };

module.exports._db = db;
module.exports.tables = tables;
module.exports.createTable = createTable;