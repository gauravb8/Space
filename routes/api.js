var express = require('express');
var path = require('path');
var router = express.Router();
var mongoose = require( 'mongoose' );
var Post = mongoose.model('Post');
var Group = mongoose.model('Group');
var User = mongoose.model('User');
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
  Group.find(function(err, groups){
    if (err)
      return res.status(500).send(err);
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