const mongoose = require('mongoose');

const rateSchema = mongoose.Schema({
      state: String,
      short: String,
      rate: Number
}, {
      collection: 'rates'
});

module.exports = Rate = module.exports = mongoose.model('rate', rateSchema);
