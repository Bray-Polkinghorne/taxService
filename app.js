const config = require('./config.json');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
//const apiRoutes = require("./api-routes");
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

passport.use(new BasicStrategy(
      function(username, password, done) {
            User.findOne({ username: username }, function(err, user){
                  if (user && bcrypt.compareSync(password, user.password)){
                        //able to create token, but not able to return it
                        const token = jwt.sign({sub:user.id}, config.secret)
                        console.log(token);
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

// app.get('/api/rate/:rate_id', function(req, res){
//       Rate.findById(req.params.rate_id).then(function(err, rate){
//             if (err){
//                   res.send(err)
//             }
//             //res.json(rate)
//       });
// });

// app.get('/api/rate/:rate_state', function(req, res){
//       Rate.find({'state': req.params.rate_state}).then(function(err, rate){
//             if (err){
//                   res.send(err)
//             }
//             res.json(rate)
//       });
// });

app.get('/rate/:rate_short', passport.authenticate('basic', {session: false}), function(req, res){
      Rate.find({'short': req.params.rate_short}).then(function(err, rate){
            if (err){
                  res.send(err)
            }
            //res.json(rate)
      });
});

//uncomment section below and run once to hash password in database for user
//pretty jank, but it works

// var user = User.findOne({username: "Bray"}, function(err, user){
//       user.password = 'test';
//       user.save(function(err){
//             if(err){return console.log('not saved')}
//             console.log('saved')
//       })
// });

app.get('/auth',
      passport.authenticate('basic', {session: false, successRedirect: '/rate'}), function (req, res){
            res.send('Authenticated ' + req.user.username);
      }
);

// Send message for default URL
app.get('/', (req, res) => res.send('Tax Rates. Yay'));

app.get('/auth',
      passport.authenticate('basic', {session: false, successRedirect: '/rate'}), function (req, res){
            res.send('Authenticated ' + req.user.name);
      }
);

// Launch app to listen to specified port
app.listen(port, function () {
    console.log("Running on port " + port);
});
