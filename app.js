const express = require('express');
const hbs = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const index = require('./routes/index');
const { User } = require('./models/user');
const { Story } = require('./models/story');
const { mongoose } = require('./db/mongodb');
const expressValidator = require('express-validator');
const cookieParser = require('cookie-parser');


// authentication
const session = require('express-session');
var passport = require('passport');
// const LocalStrategy = require('passport-local').Strategy;
const MongoStore = require('connect-mongo')(session);
const flash = require('connect-flash');

let app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(expressValidator());

//session & passport
app.use(session({
    secret: 'session secret key',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
    // cookie: { secure: true }
}))
app.use(passport.initialize());
app.use(passport.session());
// passport.use(new LocalStrategy(
//     function (email, password, done) {
//         console.log("called..");

//         return done(null, user);
//     }
// ));
app.use(flash());


app.engine('hbs', hbs({ defaultLayout: 'layout', extname: 'hbs', layoutsDir: __dirname + '/views/layouts/' }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use('/', index);



app.listen('4000', () => {
    console.log("server is runing on 4000");
})
