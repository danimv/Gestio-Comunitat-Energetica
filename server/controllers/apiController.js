let sqlite3 = require('sqlite3').verbose();//'server/controllers/comunitat.db';//
const fs = require('fs');
var request = require('request');
var crypto = require('crypto');
var base64url = require('base64url');
const exportedC = require('../controllers/userController');
const exportedD = require('../db/dbDriver');
const { exit } = require('process');
// const location = exportedD.dbLocation();
// const locationBackup = exportedD.dbLocationBackup();
// let conn = exportedD.dbConnection();
var LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./scratch');

// Vinculació de comunitat amb servidor extern
exports.init = (req, res) => {
  var { idComunitat, nomComunitat, potenciaComunitat, comentaris } = req.body;
  const path = getLocation(idComunitat);
  // console.log(path)
  conn = exportedD.dbConnection(path);
  token = req.headers.authorization;
  data = exportedC.calcularData();
  message = "";
  tipus = "Dades comunitat";
  // backupDb();
  // deleteTable('comunitat');
  // Sqlite connexió 
  // exportedC.checkFileExists(location, function check(error) {
  // if (!error) {
  conn.all('SELECT * FROM comunitat ORDER BY id DESC LIMIT 1', (err, rows) => {
    if (!err) {
      if (rows.length == 0 || rows[0].mode == 0) {
        if (nomComunitat && idComunitat && potenciaComunitat) {          
          nomComunitat = nomComunitat.toUpperCase();
          conn.all('INSERT INTO comunitat(idComunitat, nomComunitat, potenciaComunitat, comentaris, sync,mode) VALUES (?,?,?,?,?,?)', [idComunitat, nomComunitat, potenciaComunitat, comentaris, 1, 0], (err, rows) => {
            if (!err) {    
              // console.log("ok");        
              message = 'Comunitat vinculada';
              httpResponse(req, res, 200, 'OK', message, insertApiTable);
            } else {
              message = 'Comunitat no vinculada. Error de base de dades: ' + err;
              httpResponse(req, res, 400, 'KO', message, insertApiTable);
            }
          });
        } else {
          message = 'Comunitat no vinculada. Falta idComunitat, nomComunitat o potenciaComunitat';
          httpResponse(req, res, 400, 'KO', message, insertApiTable);
        }
      } else {
        message = 'Mode Offline, no és possible actualitzar dades ';
        httpResponse(req, res, 400, 'KO', message, insertApiTable);
      }
    } else {
      message = 'Comunitat no vinculada. Error de base de dades: ' + err;
      httpResponse(req, res, 400, 'KO', message, insertApiTable);
    }
  });
}
// {"idComunitat":"1",
// "nomComunitat":"Cornella del Terri"}

// Vinculació dades del servidor extern
exports.update = (req, res) => {
  data = exportedC.calcularData();
  message = "";
  tipus = "Actualització usuaris";
  var { users, idComunitat } = req.body;
  const path = getLocation(idComunitat);
  const pathBackup = getLocationBackup(idComunitat);
  conn = exportedD.dbConnection(path);
  // console.log(req.headers);
  // console.log(req.headers.authorization);
  token = req.headers.authorization;
  conn.all('SELECT * FROM comunitat ORDER BY id DESC LIMIT 1', (err, rows) => {
    conn.all('SELECT * FROM usuari', (err, rows2) => {
      if (!err) {
        if (rows[0]) {
          if (rows[0].mode == 0) {
            if (idComunitat && users[0] && users[0].idUsuari) {
              if (rows[0] && rows[0].idComunitat == idComunitat) {
                backupDb(path, pathBackup);
                deleteTable('usuari');
                conn.serialize(function (err, rows) {
                  //let stmt = conn.prepare('INSERT INTO usuari(idUsuari, idConnexio, dataAlta, 
                  let stmt = conn.prepare('INSERT INTO usuari(idUsuari, dataAlta, dataActualitzacio, nom, coeficient, estat, vinculat, comentaris) VALUES(?,?,?,?,?,?,?,?)');
                  //(?,?,?,?,?,?,?,?,?)');
                  for (let i = 0; i < users.length; i++) {
                    var donatAlta = false;
                    if (rows2[0]) {
                      rows2.forEach(row2 => {
                        if (row2.idUsuari && users[i].idUsuari && row2.idUsuari == users[i].idUsuari && donatAlta == false) {
                          donatAlta = true;
                          dataAlta = row2.dataAlta;
                        }
                      });
                    }
                    if (users[i].coeficient) {
                      coeficient = users[i].coeficient;
                      coeficient = coeficient.replace(",", ".");
                    } else {
                      coeficient = 0.0;
                    }
                    if (!donatAlta) {
                      dataAlta = data;
                    }
                    stmt.run(users[i].idUsuari, dataAlta, data, users[i].nom, coeficient, users[i].estat, users[i].vinculat, users[i].comentaris);
                  }
                  stmt.finalize();
                  updateCoeficientsTable(data);
                  if (!err) {
                    // console.log("ok usuaris");
                    message = 'Usuaris actualitzats';
                    httpResponse(req, res, 200, 'OK', message, insertApiTable);
                  } else {
                    message = 'Usuaris no actualitzats. Error base de dades ' + err;
                    httpResponse(req, res, 400, 'KO', message, insertApiTable);
                    console.log(err);
                  }
                });
              } else {
                message = 'Usuaris no actualitzats. No coincideixen idComunitat';
                httpResponse(req, res, 400, 'KO', message, insertApiTable);
              }
            } else {
              message = 'Usuaris no actualitzats. Falta idComunitat o usuaris';
              httpResponse(req, res, 400, 'KO', message, insertApiTable);
            }
          } else {
            message = 'Mode Offline, no és possible actualitzar dades ';
            httpResponse(req, res, 400, 'KO', message, insertApiTable);
          }
        } else {
          message = 'Usuaris no actualitzats. La comunitat no està inicialitzada: ' + err;
          httpResponse(req, res, 400, 'KO', message, insertApiTable);
        }
      } else {
        message = 'Usuaris no actualitzats. Error a la base de dades: ' + err;
        httpResponse(req, res, 400, 'KO', message, insertApiTable);
      }
    });
  });
}
// { "idComunitat":"1",
//   "users":[
//   {"idUsuari":"1","nom":"A", "cognoms":"M", "telefon":"628611940", "coeficient":"0,755", "estat":"1", "vinculat":"1"},
//    {"idUsuari":"2","nom":"T", "cognoms":"C", "telefon":"64343423", "coeficient":"0.98","estat":"1","vinculat":"0"},
//    {"idUsuari":"3","nom":"J", "cognoms":"O", "telefon":"984432234", "coeficient":"0,33","estat":"1","vinculat":"0"}
//  ]
//  }

//Funcio backup db
function backupDb(path, pathBackup) {
  // File destination.txt will be created or overwritten by default.
  fs.copyFile(path, pathBackup, (err) => {
    if (err) console.log(err);
    console.log('Backup feta de comunitat.db');
  });
}

//Function write api message
function insertApiTable() {
  conn.all('INSERT INTO api (data, tipus, res) VALUES (?,?,?)', [data, tipus, message], (err, rows) => {
  });
}

//Esborrar usuaris de la taula
function deleteTable(table) {
  // Sqlite connexió 
  conn.all('DELETE FROM ' + [table], (err, rows) => {
    // Si no hi ha error 
    if (!err) {
      console.log('Dades usuaris borrades');
    } else {
      console.log(err);
    }
  });
}

// Comprovar si s'ha d'actualitzar la taula de coeficients
function updateCoeficientsTable(data) {
  let found = false;
  // Sqlite connexió 
  conn.all('SELECT * FROM usuari', (err, rows) => {
    conn.all('SELECT * FROM coeficient ORDER BY idCoeficient DESC', (err, rows2) => {
      rows.forEach(row => {
        rows2.forEach(row2 => {
          if (row.idUsuari === row2.idUsuari) {
            //Comprovar si aquest coef ja és l´últim que hi ha
            if (row.coeficient === row2.coeficient) {
              found = true;
              exit;
            // Comprovar si aquest mes té coeficient
            } else if (row2.data && data.substring(0, 6) === row2.data.substring(0, 6)) {
              conn.all('UPDATE coeficient SET coeficient = ?, data = ? WHERE idUsuari = ? AND data = ?', [row.coeficient, data, row.idUsuari, row2.data], (err, rows4) => {
              });
              found = true;
            }
          }
        });
        if (found == false) {
          conn.all('INSERT INTO coeficient(idUsuari, coeficient, data, comentaris, estat) VALUES (?,?,?,?,?)', [row.idUsuari, row.coeficient, data, row.comentaris, row.estat], (err, rows4) => {
            if (err) {
              console.log(err);
            }
          });
        }
        found = false;
      });
    });
  });
}

// Resposta http
function httpResponse(req, res, code, strResult, msg, callback) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  const body = {
    result: strResult,
    strMsg: msg,
    data: req.body,
  }
  headers = req.headers;
  method = req.method;
  url = req.url;
  const responseBody = { headers, method, url, body };
  // console.log(responseBody);
  res.write(JSON.stringify(responseBody));
  res.end();
  callback(msg);
}

// HTTP request a servidor extern
function httpRequest(postData, clientHost, clientContext, requestType, callback) {
  var clientServerOptions = {
    uri: 'http://' + clientHost + '' + clientContext,
    body: JSON.stringify(postData),
    method: requestType,
    headers: {
      'Content-Type': 'application/json',
      "Authorization": base64url(crypto.randomBytes(20))
    }
  }
  request(clientServerOptions, function (error, response) {
    // console.log(error, response.body);
    callback(response);
    return;
  });
}

function getLocation(idComunitat){
  // let path = 'server/db/'+ idComunitat + '/comunitat.db';
  let path = 'home/'+ idComunitat + '/comunitat.db';
  return path;
}

function getLocationBackup(idComunitat){
  // let path = 'server/db/'+ idComunitat + '/comunitat_backup.db';
  let path = 'home/'+ idComunitat + '/comunitat_backup.db';
  return path;
}