const config = require('./config.json');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const User = require('./user');
const Rate = require('./rate');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/tax', {useNewUrlParser: true});

var db = mongoose.connection;
// Setup server port
var port = process.env.PORT || 8080;

//begin basic auth and routes
passport.use(new BasicStrategy(
      function(username, password, done) {
            User.findOne({ username: username }, function(err, user){
                  if (user && bcrypt.compareSync(password, user.password)){
                        return done(null, user);
                  }
                  return done(null, false);
            });
      }
));
//passport.authenticate('basic', {session: false}),
app.get('/rate', function(req, res){
      Rate.find({}).then(eachOne =>{
            console.log("got data");
            res.json(eachOne);
      });
});
app.get('/rate/:rate_short', passport.authenticate('basic', {session: false}), function(req, res){
      req.params.rate_short = req.params.rate_short.toUpperCase();
      Rate.find({'short': req.params.rate_short}).then(function(err, rate){
            if (err){
                  res.send(err)
            }
            //res.json(rate)
      });
});
app.get('/auth', passport.authenticate('basic', {session: false}), function (req, res){
            res.send('Authenticated ' + req.user.username);
      });
app.get('/', (req, res) => res.send('Tax Rates. Yay'));
app.get('/auth',
      passport.authenticate('basic', {session: false, successRedirect: '/rate'}), function (req, res){
            res.send('Authenticated ' + req.user.name);
      }
);
//end basic auth routes

//begin token auth and routes
//Check to make sure header is not undefined, if so, return Forbidden (403)
const checkToken = (req, res, next) => {
      const header = req.headers['authorization'];

      if(typeof header !== 'undefined') {
        const bearer = header.split(' ');
        const token = bearer[1];

        req.token = token;
        next();
      } else {
        //If header is undefined return Forbidden (403)
        res.sendStatus(403)
      }
}

app.get('/user/login', passport.authenticate('basic', {session: false}), function(req, res) {
      jwt.sign({User}, 'privatekey', { expiresIn: '1h' },(err, token) => {
          if(err) { console.log(err) }
          console.log('Success: key generated')

          res.send(JSON.stringify({"token": token}));
      });
})
app.get('/user/data', checkToken, (req, res) => {
    //verify the JWT token generated for the user
    jwt.verify(req.token, 'privatekey', (err, authorizedData) => {
        if(err){
            //If error send Forbidden (403)
            console.log('ERROR: Could not connect to the protected route');
            res.sendStatus(403);
        } else {
            //If token is successfully verified, we can send the autorized data
            Rate.find({}).then(eachOne =>{
                  res.json(eachOne);
            });
            console.log('SUCCESS: Connected to protected data route');
        }
    })
});
app.get('/user/data/:rate_short', checkToken, (req, res) => {
    //verify the JWT token generated for the user
    jwt.verify(req.token, 'privatekey', (err, authorizedData) => {
        if(err){
            //If error send Forbidden (403)
            console.log('ERROR: Could not connect to the protected route');
            res.sendStatus(403);
        } else {
            //If token is successfully verified, we can send the autorized data
            Rate.find({'short': req.params.rate_short}).then(function(err, rate){
                  if (err){
                        res.send(err)
                  }
                  //res.json(rate)
            });
            console.log('SUCCESS: Connected to protected specific data route');
        }
    })
});
//end token auth and routes

//uncomment section below and run once to hash password in database for user
//pretty jank, but it works
// var user = User.findOne({username: "Bray"}, function(err, user){
//       user.password = 'test';
//       user.save(function(err){
//             if(err){return console.log('not saved')}
//             console.log('saved')
//       })
// });

// Launch app to listen to specified port
app.listen(port, function () {
    console.log("Running on port " + port);
});
