let sqlite3 = require('sqlite3').verbose(); //'server/controllers/comunitat.db';//
const fs = require('fs');
const { nextTick } = require('process');
const exportedD = require('../db/dbDriver');
// const location = exportedD.dbLocation();
let conn = exportedD.dbConnection();

// Vista comunitat
exports.view = (req, res) => {
  checkFileExists(location, function check(error) {
    if (!error) {
      crearBd();
      // Sqlite connexió 
      conn.all('SELECT * FROM comunitat ORDER BY id DESC LIMIT 1', (err, rows) => {
        if (!err && rows[0]) {
          mode = rows[0].mode;
          res.render('comunitat', { rows, mode });
        } else {
          res.render('comunitat');
          console.log(err);
        }
      });
    } else {
      res.render('inici');
    }
  });
}

exports.actualitzacions = (req, res) => {
  conn.all('SELECT * FROM api ORDER BY id DESC', (err, rows) => {
    if (!err && rows[0]) {
      res.render('actualitzacions', { rows });
    } else {
      res.render('actualitzacions');
    }
  });
}

exports.interrupcions = (req, res) => {
  conn.all('SELECT * FROM interrupcions ORDER BY id DESC', (err, rows) => {
    if (!err && rows[0]) {

      rows.forEach(row => {
        row.minuts = diff_minutes(row.data_inici, row.data_fi);
        // console.log(row.minuts);
      });
      res.render('interrupcions', { rows });
    } else {
      res.render('interrupcions');
    }
  });
}

// Canviar de mode online o offline --> 0=ONLINE, 1=OFFLINE
exports.mode = (req, res) => {
  let mode;
  // Sqlite connexió 
  conn.all('SELECT * FROM comunitat ORDER BY id DESC LIMIT 1', (err, row) => {
    // console.log(row.length);
    if (!err && row[0]) {
      if (row[0].mode == null) {
        mode = 1;
      } else {
        mode = row[0].mode + 1;
        if (mode > 1) mode = 0;
      }
      conn.all('UPDATE comunitat SET mode = ? WHERE id = ?', [mode, row[0].id], (err, rows4) => {
      });
      res.redirect('/comunitat/?mode=' + `${mode}`);
    } else {
      res.redirect('/comunitat/?mode=' + `0`);
    }
    // res.render('comunitat', { mode });
  });
  // res.redirect(req.get('referer'));
}

function crearBd() {
  conn.all(
    'CREATE TABLE IF NOT EXISTS usuari (idUsuari INTEGER, dataAlta TEXT, dataActualitzacio TEXT, nom TEXT, cognoms TEXT, email TEXT, telefon INTEGER, coeficient INTEGER, estat INTEGER, vinculat INTEGER, comentaris TEXT, PRIMARY KEY("idUsuari" AUTOINCREMENT))',
    (err, result) => {
      if (!err) {
        conn.all(
          'CREATE TABLE IF NOT EXISTS coeficient (idCoeficient INTEGER, idUsuari INTEGER, data TEXT, coeficient INTEGER, estat INTEGER, comentaris TEXT, PRIMARY KEY("idCoeficient" AUTOINCREMENT))',
          (err, result2) => {
            if (!err) {
              conn.all(
                'CREATE TABLE IF NOT EXISTS comunitat (id INTEGER, idComunitat INTEGER, nomComunitat TEXT, comentaris TEXT, sync INTEGER, mode INTEGER, PRIMARY KEY("id" AUTOINCREMENT))',
                (err, result3) => {
                  if (!err) {
                    console.log("Taules revisades");
                  }
                });
            } else {
              console.log(err);
            }
          });
      } else {
        console.log(err);
      }
    },
  );
}

function checkFileExists(filepath, callback) {
  return new Promise((resolve, reject) => {
    fs.access(filepath, fs.constants.F_OK, error => {
      if (error) {
        console.log("File NO exists");
      }
      callback(error)
    });
  });
}

function diff_minutes(dt1, dt2) {
  dt1c = new Date(dt1.substring(0, 4), (dt1.substring(4, 6)-1), dt1.substring(6, 8), dt1.substring(8, 10), dt1.substring(10, 12), dt1.substring(12, 14));
  if (dt2 == null) {
    dt2c = new Date();
    console.log(dt1c);
    console.log(dt2c);
  } else {
    dt2c = new Date(dt2.substring(0, 4), (dt2.substring(4, 6)-1), dt2.substring(6, 8), dt2.substring(8, 10), dt2.substring(10, 12), dt2.substring(12, 14));
  }
  var diff = (dt2c - dt1c) / 60000;
  return Math.abs(Math.round(diff));
}

exports.checkFileExists = checkFileExists; 