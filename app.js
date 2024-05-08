const express = require('express');
let sqlite3 = require('sqlite3').verbose();
require('dotenv').config();
const exphbs = require('express-handlebars');
const session = require('express-session');
let alert = require('alert');
const app = express();
const port = process.env.PORT || 5010;

// Parsing middleware
// app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: true })); // New

// Parse application/json
// app.use(bodyParser.json());
app.use(express.json()); // New

// Static Files
app.use(express.static(__dirname + '/public'));

// Templating Engine
const handlebars = exphbs.create({ extname: '.hbs', defaultLayout: 'main_initial.hbs' });
app.engine('.hbs', handlebars.engine);
app.set('view engine', '.hbs');

const rutesInici = require('./server/routes/inici');
const rutesComunitat = require('./server/routes/comunitat');
const rutesUsuari = require('./server/routes/usuaris');
const rutesApi = require('./server/routes/api');

app.use(session({
    secret: 'prosum',
    resave: false,
    saveUninitialized: false,
    cookie: {
        // Session expires. 60000=1min
        expires: 600000
    }
}))

// middleware to test if authenticated
function isAuthenticated(request, res, next) {
    try {
        if (request.session.user) {
            next();
        } else {
            // res.status(400).send('Falta autenticació');
            res.redirect('/');
        }
    } catch (err) {
        next('route');
    }
}

// Recursos i rutes
app.use('/', rutesInici, function (req, res, next) {
    req.app.locals.layout = 'main_initial';
    next();
});
app.use('/comunitat', isAuthenticated, rutesComunitat, function (req, res, next) {
    req.app.locals.layout = 'main';
    next();
});
app.use('/usuaris', isAuthenticated, rutesUsuari, function (req, res, next) {
    req.app.locals.layout = 'main';
    next();
});
app.use('/api', rutesApi, function (req, res, next) {
    req.app.locals.layout = 'main';
    next();
});

app.listen(port, () => console.log(`Listening on port ${port}`));

app.post('/auth', function (request, response) {
    // Capture the input fields
    let username = request.body.username;
    let password = request.body.password;
    if (username && password) {
        // //Connexió a Sqlite
        // let conn = new sqlite3.Database('server/controllers/comunitat.db', sqlite3.OPEN_READWRITE, (err) => {
        //     if (err) {
        //         console.error(err.message);
        //     }
        //     console.log('Connected to database.');
        // });
        // conn.all('SELECT * FROM credencial WHERE nomUsuari = ? AND contrasenya = ?', [username, password], function (error, results, fields) {
        //     if (error) throw error;
        //     if (results.length > 0)

        request.session.regenerate(function (err) {
            if (err) next(err)
            if (username == 'admin' && password == '8zN5Ir7lny5HBcbvjAou') {
                request.session.user = username;

                // save the session before redirection
                request.session.save(function (err) {
                    if (err) return next(err)
                    try {
                        response.redirect('/comunitat');
                    } catch (err) {
                        next('route');
                    }
                })
            } else {
                var message = true;
                // response.redirect(`/?message=${message}`);// + `${message}`);                
                response.render('inici', { message });
                // alert("USUARI O CONTRASENYA INCORRECTE");
            }
        })
    } else {
        response.send('Introdueix l`usuari i la contrasenya!');
        response.end();
    }
});

app.get('/', (req, res) => {
    res.render('inici');
});

//Logout
app.get('/logout', function (req, res, next) {
    req.app.locals.layout = 'main_initial';
    next();
}, function (req, res) {
    req.session.destroy();
    res.redirect('/');
});