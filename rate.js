const mongoose = require('mongoose');

//schema for sales tax rate that is stored in the db of rates
const rateSchema = mongoose.Schema({
      state: String,
      short: String,
      rate: Number
}, {
      collection: 'rates'
});

module.exports = Rate = module.exports = mongoose.model('rate', rateSchema);
