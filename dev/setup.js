/**
 * Set up Database for ReeMail. Run from root directory of the repo
 * node dev/setup.js
 */
const fs = require('fs');
const db = require('../core/db');
const bcrypt = require('bcrypt');

const ADMIN_ACCOUNT = "admin@reemail";

/* Import Emails from JSON file */

// Setup input/output streams
inputFile = 'dev/emails.json';
let items = [];

// Read in netstat data line by line
// sourceInterface.on('line', function(line) {
fs.readFile(inputFile, 'utf8', function(err, data) {
  // process line here
  let json = JSON.parse(data);

  for(line of json) {
    let email = {
      'folder': line.folder || "inbox",
      'username': line.username || ADMIN_ACCOUNT,
      'from': line.from,
      'to': line.to,
      'cc': line.cc || undefined,
      'bcc': line.bcc || undefined,
      'subject': line.subject,
      'body': line.body,
      'markup': line.markup || "HTML"
    };

    let keys = "";
    let valuesString = "";
    let values = [];

    for(key in email){
      if(!email[key]) {
        continue;
      }
      keys += email[key] ? '`' + key + "`," : "";
      valuesString += email[key] ? "?," : "";
      values.push(email[key])
    }

    // Remove trailing commas
    keys = keys.substring(0, keys.length - 1);
    valuesString = valuesString.substring(0, valuesString.length - 1);

    let q = `INSERT INTO \`${db.tables.EMAILS_DB}\` (${keys}) VALUES (${valuesString})`;
    try {
      db._db.run(q, values, function (err) {
        console.log(err)
      });
    } catch(e){
      console.log('error!', q, e)
    }
  }
});

/* Set up Admin User */
function genPasswd(len = 8) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < len; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

bcrypt.hash(genPasswd(20), 10, function (err, hash) {
  if(err) throw err;
  db.insertUser(ADMIN_ACCOUNT, hash, 'ReeMail Administrator', null)
});
