var fs = require('fs');
const db = require('../core/db');

// Setup input/output streams
inputFile = 'dev/emails.json';
// const sourceStream = fs.createReadStream(inputFile);
// const sourceInterface = readline.createInterface(sourceStream);

// const outputFile = 'out.json';
// const outputStream = fs.createWriteStream(outputFile);

let items = [];

// Read in netstat data line by line
// sourceInterface.on('line', function(line) {
fs.readFile(inputFile, 'utf8', function(err, data) {
  // process line here
  let json = JSON.parse(data);

  for(line of json) {
  // line = json[0];
    let email = {
      'folder': line.folder || "inbox",
      'username': line.username || "admin@reemail",
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

// // On Read finished
// sourceInterface.on('close', function() {
//   // File completely read, do bulk insert
//   console.log(`Finished Reading Successfully!`);
//
//   // do something on finish here
//   // outputStream.write(JSON.stringify(json) + '\n');
//   // outputStream.close();
//
//   // Exit success
//   process.exit(0);
// });
