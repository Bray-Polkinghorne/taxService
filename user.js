const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

var Schema = mongoose.Schema;
const userSchema = new Schema({
      username: String,
      password: String
}, {
      collection: 'users'
});

userSchema.pre('save', function(next){
      var hash = bcrypt.hashSync(this.password, 8);
      this.password = hash;
      next();
})
module.exports = User = mongoose.model('user', userSchema);
