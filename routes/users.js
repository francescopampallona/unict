const crypto = require('crypto');
const express = require('express');
const router = express.Router();

const { check } = require('express-validator');

const User = require('../models/user');
const autenticationMiddleware = require('../middlewares/auth');
const { checkValidation } = require('../middlewares/validation');

router.get('/', function(req, res, next) {
  User.find({}, ["-password", "-_favourites"], function(err, users){
    if (err) return res.status(500).json({error: err});
    res.json(users);
  });
});

router.get('/:id', function(req, res, next) {
  User.findOne({_id: req.params.id}, ["-password", "-_favourites"], function(err, user){
    if (err) return res.status(500).json({error: err});
    if(!user) return res.status(404).json({message: 'User not found'})
    res.json(user);
  });
});

router.post('/', [
  check('name').isString(),
  check('surname').isString(),
  check('email').isEmail(),
  check('password').isString().isLength({ min: 5 })
], checkValidation, function(req, res, next) {
  const newUser = new User(req.body);
  newUser.password = new Buffer(
      crypto.createHash('sha256').update(req.body.password, 'utf8').digest()
    ).toString('base64');
  newUser.save(function(err){
    if(err) {
      if (err.code === 11000) {
        return res.status(409).json(
          {
            error: "Invalid email",
            message: "This email is already taken"
          }
        );
      }
      return res.status(500).json({error: err});
    } 
    res.status(201).json(newUser);
  });
});

router.put('/:id', autenticationMiddleware.isAuth, function(request, response, next) {
  if (response.locals.authInfo.userId !== request.params.id) {
    return response.status(401).json({
      error: "Unauthorized",
      message: "You are not the owner of the resource"
    });
  }
  User.findOne({_id: request.params.id})
  .exec(function(err, user) {
    if(err) return response.status(500).json({error:err});
    if(!user) return response.status(404).json({message: 'User not found'});
    user.name = request.body.name;
    user.surname = request.body.surname;
    user.email = request.body.email;
    user.save(function(err) {
      if(err) return response.status(500).json({error: err});
      response.json(user);
    });
  });
});

router.delete('/:id', autenticationMiddleware.isAuth, function(req, res, next) {
  if (res.locals.authInfo.userId !== req.params.id) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "You are not the owner of the resource"
    });
  }
  User.findOne({_id: req.params.id})
    .exec(function(err, user) {
      if(err) return res.status(500).json({error: err});
      if(!user) return res.status(404).json({message: 'User non found'});
      User.remove({_id: req.params.id}, function(err) {
        if(err) return res.status(500).json({error: err})
        res.json({message: 'User successfully deleted'})
      });
    });
});
/* --- GESTIONE FAVORITI ---*/
//ADD
router.post('/:id/new_favourite', autenticationMiddleware.isAuth, function(request, response, next) {
  if (response.locals.authInfo.userId !== request.params.id) {
    return response.status(401).json({
      error: "Unauthorized",
      message: "You are not the owner of the resource"
    });
  }
  User.findOne({_id: request.params.id})
  .exec(function(err, user) {
    if(err) return response.status(500).json({error:err});
    if(!user) return response.status(404).json({message: 'User not found'});
    const index = user._favourites.indexOf(request.body.favourite);
    if(index===-1){
      user._favourites.push(request.body.favourite);
      user.save(function(err) {
      if(err) return response.status(500).json({error: err});
      response.json(user);
    });
   }
   else{
     return response.status(409).json('The resource already exists');
   }
  });
});
//REMOVE
router.post('/:id/remove_favourite', autenticationMiddleware.isAuth, function(req, res, next) {
  if (res.locals.authInfo.userId !== req.params.id) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "You are not the owner of the resource"
    });
  }
  User.findOne({_id: req.params.id})
    .exec(function(err, user) {
      if(err) return res.status(500).json({error: err});
      if(!user) return res.status(404).json({message: 'User non found'});
      const index = user._favourites.indexOf(req.body.favourite);
      if(index!==-1){
        user._favourites.splice(index, 1);
        user.save(function(err) {
          if(err) return res.status(500).json({error: err});
          res.json(user);
        });
      }
      else{
        return res.status(404).json(`Favourite not found`);
      }
    });
  });

  


module.exports = router;
