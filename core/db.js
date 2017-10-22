var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('ColdStoneMemery.db');
// var Database = require('better-sqlite3');
// var db = new Database('../ColdStoneMemery.db');

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

  for(var field in fields) {
    var type = fields[field];
    _field_str += '`' + field + '`' + (type ? ' ' + type : '');

    // Add comma to string if not yet at end
    if(i + 1 !== len) {
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


// Init DB
db.serialize(function() {
  createTable('memes', {
    info: 'TEXT',
    cost: 'INTEGER',
    author: 'TEXT'
  }, true);

  createTable('users', {
    username: 'TEXT',
    password: 'TEXT',
    credits: 'INTEGER',
    goldencredits: 'INTEGER',
    bio: 'TEXT',
    avatar: 'TEXT'
  }, true);
});

module.exports.db = db;
module.exports.createTable = createTable;