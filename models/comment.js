const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
    _author: {type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User'},
    comment: {type: String, minlenght: 1, maxlenght: 280},
    created_at: {type: Date, default: Date.now()},
    
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;