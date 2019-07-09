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
const prompts = require('prompts');

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

app.get('/rate', passport.authenticate('basic', {session: false}), function(req, res){
      Rate.find({}).then(eachOne =>{
            res.json(eachOne);
      });
});
app.get('/rate/:rate_short', passport.authenticate('basic', {session: false}), function(req, res){
      Rate.find({'short': req.params.rate_short}).then(function(err, rate){
            if (err){
                  res.send(err)
            }
            //res.json(rate)
      });
});
app.get('/auth',
      passport.authenticate('basic', {session: false, successRedirect: '/rate'}), function (req, res){
            res.send('Authenticated ' + req.user.username);
      }
);
app.get('/', (req, res) => res.send('Tax Rates. Yay'));
app.get('/auth',
      passport.authenticate('basic', {session: false, successRedirect: '/rate'}), function (req, res){
            res.send('Authenticated ' + req.user.name);
      }
);
//end basic auth routes
function findUser(data){
      User.findOne({username: data}, function(err, result){
            if(err) throw err;
            if(data === result.username){
                  return true;
            }
            else {
                  return false;
            }
      })
}

function findPass(data, done){
      User.findOne({password: data}, function(err, result){
            if(err) throw err;
            if(data === bcrypt.compareSync(password, result.password)){
                  return true;
            }
            else {
                  return false;
            }
      })
}

//begin token auth and routes
app.post('/user/login', function(req, res, next) {

      const { body } = req;
      const { username } = body;
      const { password } = body;

      //checking to make sure the user entered the correct username/password combo
      //
      if(findUser(username) && findPass(password)) {
            //if user log in success, generate a JWT token for the user with a secret key
            jwt.sign({User}, 'privatekey', { expiresIn: '1h' },(err, token) => {
                if(err) { console.log(err) }
                res.send(token);
            });
            }
      else {console.log('ERROR: Could not log in');}
      // console.log("test");

})
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
            console.log('SUCCESS: Connected to protected route');
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
            console.log('SUCCESS: Connected to protected route');
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
