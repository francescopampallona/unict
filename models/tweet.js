const mongoose = require('mongoose');

const tweetSchema = mongoose.Schema({
    _author: {type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User'},
    tweet: {type: String, minlenght: 1, maxlenght: 280},
    created_at: {type: Date, default: Date.now()},
    _likes: [{type: mongoose.Schema.Types.ObjectId, ref: "User", required: false}],
    _parentTweet: {type: mongoose.Schema.Types.ObjectId, required: false, default: null},
    hashtag: {type: [String], required: false, default: null}
});

const Tweet = mongoose.model('Tweet', tweetSchema);

module.exports = Tweet;
