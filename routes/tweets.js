const express = require('express');
const router = express.Router();

const { check } = require('express-validator');

const Tweet = require('../models/tweet');
const autenticationMiddleware = require('../middlewares/auth');
const { checkValidation } = require('../middlewares/validation');


router.get('/', function(req, res, next) {
  Tweet.find({_parentTweet: null}).populate("_author", "-password").exec(function(err, tweets){
    if (err) return res.status(500).json({error: err});
    res.json(tweets);
  });
});

router.get('/:id', function(req, res, next) {
  Tweet.findOne({_id: req.params.id})
    .populate("_author", "-password")
    .exec(function(err, tweet){
      if (err) return res.status(500).json({error: err});
      if(!tweet) return res.status(404).json({message: 'Tweet not found'})
      res.json(tweet);
    });
});

router.get('/:id/comments', function(req, res, next){
  Tweet.find({_parentTweet: req.params.id}).populate("_author", "-password").exec(function(err, tweets){
    if (err) return res.status(500).json({error: err});
    res.json(tweets);
  });
});

router.post('/',autenticationMiddleware.isAuth, [
  check('tweet').isString().isLength({min: 1, max: 120})
], checkValidation, function(req, res, next) {
  const newTweet = new Tweet(req.body);
  newTweet._author = res.locals.authInfo.userId;
  newTweet.hashtag = myFunction(newTweet.tweet);
  newTweet.save(function(err){
    if(err) {
      return res.status(500).json({error: err});
    } 
    res.status(201).json(newTweet);
  });
});

router.put('/:id', autenticationMiddleware.isAuth, [
  check('tweet').isString().isLength({min: 1, max: 120})
], checkValidation, function(req, res, next) {
  Tweet.findOne({_id: req.params.id}).exec(function(err, tweet) {
    if (err) {
      return res.status(500).json({
        error: err,
        message: "Error reading the tweet"
      });
    }
    if (!tweet) {
      return res.status(404).json({
        message: "Tweet not found"
      })
    }
    if (tweet._author.toString() !== res.locals.authInfo.userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You are not the owner of the resource"
      });
    }
    tweet.tweet = req.body.tweet;
    tweet.save(function(err) {
      if(err) return res.status(500).json({error: err});
      res.json(tweet);
    });
  });
});

router.delete('/:id', autenticationMiddleware.isAuth, function(req, res, next) {
  Tweet.findOne({_id: req.params.id}).exec(function(err, tweet) {
    if (err) {
      return res.status(500).json({
        error: err,
        message: "Error reading the tweet"
      });
    }
    if (!tweet) {
      return res.status(404).json({
        message: "Tweet not found"
      })
    }
    if (tweet._author.toString() !== res.locals.authInfo.userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You are not the owner of the resource"
      });
    }
    
    if(tweet._parentTweet===null){
      //Rimozione di tutti i commenti al tweet
      Tweet.remove({_parentTweet: req.params.id}, function(err){
        if(err) {
          return res.status(500).json({error: err})
        }
        //Rimozione del tweet principale
        Tweet.remove({_id: req.params.id}, function(err) {
          if(err) {
            return res.status(500).json({error: err})
          }
          res.json({message: 'Tweet successfully deleted'})
        });
        
      });
    }

    
  });
});
/* --- GESTIONE DEI LIKES ---*/
//ADD
router.post('/:id/new_like', autenticationMiddleware.isAuth, function(req, res, next) {
  Tweet.findOne({_id: req.params.id}).exec(function(err, tweet) {
    if (err) {
      return res.status(500).json({
        error: err,
        message: "Error reading the tweet"
      });
    }
    if (!tweet) {
      return res.status(404).json({
        message: "Tweet not found"
      });
    }
    const index = tweet._likes.indexOf(res.locals.authInfo.userId);
    if(index===-1){
      tweet._likes.push(res.locals.authInfo.userId);
      tweet.save(function(err) {
        if(err) return res.status(500).json({error: err});
        res.json(tweet);
      });
    }
    else{
      return res.status(409).json('This like already exists');
    }

  });
});
//REMOVE
router.post('/:id/remove_like', autenticationMiddleware.isAuth, function(req, res, next) {
  Tweet.findOne({_id: req.params.id}).exec(function(err, tweet) {
    if (err) {
      return res.status(500).json({
        error: err,
        message: "Error reading the tweet"
      });
    }
    if (!tweet) {
      return res.status(404).json({
        message: "Tweet not found"
      });
    }
    const index = tweet._likes.indexOf(res.locals.authInfo.userId);
    if(index!==-1){
      tweet._likes.splice(index, 1);
      tweet.save(function(err) {
        if(err) return res.status(500).json({error: err});
        res.json(tweet);
      });
    }
    else{
      return res.status(404).json(`Like not found`);
    }


  });
});
/**
 * RICERCA HASHTAG
 */
router.get('/:hashtag/search', function(req, res, next){
  Tweet.find({hashtag: '#' + req.params.hashtag}).populate("_author", "-password").exec(function(err, tweets){
    if (err) return res.status(500).json({error: err});
    res.json(tweets);
  });
});
/**
 * myFunction
 */
function myFunction(str){
  var res = str.split(" ");
  var str1=[];
  var j=0;
  for(var i=0; i<res.length ;i++){
      if(res[i][0]=="#")
          str1[j++]= res[i];
          
  }
  return str1;
}

 







module.exports = router;
