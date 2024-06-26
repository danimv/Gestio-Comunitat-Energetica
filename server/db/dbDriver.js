let sqlite3 = require('sqlite3').verbose(); //'server/controllers/comunitat.db';//
const fs = require('fs');                   //'server/controllers/comunitat_backup.db';//
const { nextTick } = require('process');
// const location = process.env.SQLITE_DB_LOCATION || 'server/controllers/comunitat.db';//'home/comunitat.db';
// const locationBackup = process.env.SQLITE_DB_LOCATION || 'server/controllers/comunitat_backup.db';//'home/comunitat_backup.db';
// const dirName = require('path').dirname(location);
// if (!fs.existsSync(dirName)) {
//   fs.mkdirSync(dirName, { recursive: true });
// }

function dbConnection(path) {
  path = path + '';
  let conn = new sqlite3.Database(path, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log('Connected to database.');
    }
  });
  return conn;
}
// function dbLocation() {    
//   return location;
// }
// function dbLocationBackup() {    
//   return locationBackup;
// }

exports.dbConnection = dbConnection; 
// exports.dbLocation = dbLocation; 
// exports.dbLocationBackup = dbLocationBackup; 