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
const cors = require('cors');

app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/tax', {useNewUrlParser: true});

var db = mongoose.connection;
// Setup server port
var port = process.env.PORT || 8080;

//begin basic auth and routes
      //authenticate user via passport.
      //Get username and password from input
      //then compare with the username and password in 'users' database
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
// use 'passport.authenticate('basic', {session: false})' to make a route require Basic auth

//allow any site to access api calls
// app.use(function (req, res, next){
//       res.setHeader("Access-Control-Allow-Origin", "*");
//       next();
// });

app.use(cors());

app.get('/rate', function(req, res){
      Rate.find({}).then(eachOne =>{
            console.log("got data");
            res.json(eachOne);
      });
});
app.get('/rate/:rate_short', function(req, res){
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
//checkToken to verify correct token is being given
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
//first using same basic auth to verify user to give token
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
            //If token is successfully verified, we can send the autorized data of all states sales tax in db
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
            //If token is successfully verified, we can send the autorized data of specified state sales tax
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

//TO HASH A NEW USERS PASSWORD
//uncomment below section and run file once. Then recomment.
//I know it's not efficent, but it works
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
