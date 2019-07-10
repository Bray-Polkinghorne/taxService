const mongoose = require('mongoose');

//may have to change schema to match DI names in NW
//this also means changing the structure in mongodb to match
const rateSchema = mongoose.Schema({
      state: String,
      short: String,
      rate: Number
}, {
      collection: 'rates'
});

module.exports = Rate = module.exports = mongoose.model('rate', rateSchema);
