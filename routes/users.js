var express = require('express');
var router = express.Router();
var models = require('../models'); //<--- Add models
var authService = require('../services/auth'); //<--- Add authentication service

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});
// GET signup page when navigate to users/signup
router.get('/signup', function(req, res, next) {
  res.render('signup');
})
// Create new user if one doesn't exist
router.post('/signup', function(req, res, next) {
  models.users
    .findOrCreate({
      where: {
        Username: req.body.username
      },
      defaults: {
        FirstName: req.body.firstName,
        LastName: req.body.lastName,
        Email: req.body.email,
        Password: authService.hashPassword(req.body.password)
      }
    })
    .spread(function(result, created) {
      if (created) {
        res.send('User successfully created');
      } else {
        res.send('This user already exists');
      }
    });
});
router.get('/login', function (req, res, next) {
  res.render('login');
})
// Login user and return JWT as cookie
router.post('/login', function (req, res, next) {
  models.users.findOne({
    where: {
      Username: req.body.username
    }
  }).then(user => {
    if (!user) {
      console.log('User not found')
      return res.status(401).json({
        message: "Login Failed"
      });
    } else {
      let passwordMatch = authService.comparePasswords(req.body.password, user.Password);
      if (passwordMatch) {
        let token = authService.signUser(user);
        res.cookie('jwt', token);
        res.redirect('profile');
      } else {
        console.log('Wrong password');
        res.send('Wrong password');
      }
    }
  });
});

 //  GET profile page of user that's currently logged in
router.get("/profile", function(req, res, next) {
  let token = req.cookies.jwt;
  if (token) {
    authService.verifyUser(token).then(user => {
      if (user) {
        models.users
          .findAll({
            where: { UserId: user.UserId },
            include: [{ model: models.posts }]
          })
          .then(result => {
            console.log(result);
            res.render("profile", { user: result[0] });
          });
      } else {
        res.status(401);
        res.send("Invalid authentication token");
      }
    });
  } else {
    res.status(401);
    res.send("Must be logged in");
  }
});

//get logout screen!
router.get('/logout', function (req, res, next) {
  res.cookie('jwt', "", { expires: new Date(0) });
  res.render('logout');
  });

  // router.get('/profile/:id', auth.verifyUser, function(req, res, next) {
  //   // if (!req.isAuthenticated()) {
  //   //   return res.send('You are not authenticated');
  //   // }
  //   if (req.params.id !== String(req.user.UserId)) {
  //     res.send('This is not your profile');
  //   } else {
  //     let status;
  //     if (req.user.Admin) {
  //       status = 'Admin';
  //     } else {
  //       status = 'Normal user';
  //     }
  
  //     res.render('profile', {
  //       FirstName: req.user.FirstName,
  //       LastName: req.user.LastName,
  //       Email: req.user.Email,
  //       UserId: req.user.UserId,
  //       Username: req.user.Username,
  //       Status: status
  //     });
  //   }
  // });

  router.post('profile', function(req, res, next) {
    res.render('profile');
  })
  
module.exports = router;
