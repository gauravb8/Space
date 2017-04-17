var express = require('express');
var path = require('path');
var router = express.Router();
var mongoose = require( 'mongoose' );
var Post = mongoose.model('Post');
var Group = mongoose.model('Group');
var User = mongoose.model('User');

var async = require('async');

function isAuthenticated (req, res, next) {
	if(req.method === "GET"){
		return next();
	}
	if (req.isAuthenticated()){
		return next();
	}
	return res.redirect('/#login');
};

router.use('/posts', isAuthenticated);

// Multer setup..
var multer = require('multer');
var storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, path.join(__dirname, '../public', 'store'));
  },
  filename: function(req, file, cb){
    cb(null, file.originalname);
  }
});

var upload = multer( {storage : storage} );

router.get('/posts', function(req, res, next){
  Post.find(function(err, posts){
    if (err)
      return res.status(500).send(err);
    return res.status(200).send(posts);
  });
});

router.get('/groups', function(req, res, next){
  var user_id = req.query.user_id;
  console.log(user_id);
  var group_ids = [],
      groups = [];

  var first = function(callback){
    //Retrieve group ids given user is a part of.
    User.findById(user_id, function(err, user){
      console.log('Finding user');
      if (err)
        return res.status(500).send(err);
      console.log('found user');
      group_ids = user.group_ids;
      console.log(group_ids);
      callback();
    });
    console.log('debug1');
  }

  var second = function(callback){
    //Retrieve group objects corresponding to ids.
    console.log('debug2');
    console.log(group_ids);
    for (var i = 0; i < group_ids.length; ++i)
    {
      id = group_ids[i];
      console.log(id);
      Group.findById(id, function(err, group){
        if (err)
          return res.status(500).send(err);
        groups.push(group);
        if (groups.length == group_ids.length)
          callback();
      });
    }
  }

  async.series( [first, second], function(err, results){
    if (err)
      return res.status(500).send(err);
    console.log(results);
    return res.status(200).send(groups);
  });

});

router.get('/groupPosts', function(req, res, next){
  var id = req.query.id;
  Post.find( { group : id }, function(err, posts){
    if (err)
      return res.status(500).send(err);
    return res.status(200).send(posts);
  });
});

router.get('/users', function(req, res, next){
  User.find({},'username', function(err, users){
    if (err)
      return res.status(500).send(err);
    return res.status(200).send(users);
  });
});

router.post('/createGroup', function(req, res, next){
  var newGroup = new Group( { name: req.body.name,
                              users: req.body.users,
                              userIds: req.body.userids,
                              latestPost: Date.now() 
                            });
  newGroup.save(function(err, newGroup){
    if (err)
      return res.status(500).send(err);
    return res.status(200).send("new group created");
  });
});

router.get('/exists', function(req, res, next){
  //Checks if a Post with given name and size already exists.
  Post.findOne( { name : req.query.name,
                  size : req.query.size }, function(err, posts){
                    if (err)
                      return res.status(500).send(err);
                    if (posts)
                      return res.status(200).send( {exists: true} );
                    return res.status(200).send( {exists: false} );
                  });
});

router.post('/createPost', function(req, res, next){
  var date = Date.now();
})

router.post('/upload', upload.single('myfile'), function(req, res, next){
  if (!req.file)
    return res.status(400).send('No files');
  console.log('creating post');
  var date = Date.now();
  // Create new post.
  var newPost = new Post({ name : req.file.originalname,
                           size : req.file.size,
                           path : 'store/' + req.file.originalname,
                           user : req.body.user,
                           user_id : req.body.user_id,
                           group : req.body.groupid,
                           created_at : date
  });
  console.log('new post created');
  // Save new post to database.
  newPost.save(function(err, newPost){
    if (err){
      console.log('Error occured');
      return console.error(err);
    }
    console.log('Post saved to DB');
  });
  console.log('file uploaded : '+req.file.originalname);
  // Update latestPost value for group.
  Group.update( { _id: req.body.groupid } , { latestPost : date }, {}, function(err, doc){
    if (err)
      return res.status(500).send(err);
    console.log('Group latestPost updated');
  });
  return res.status(200).send('uploaded and updated');
});

module.exports = router;