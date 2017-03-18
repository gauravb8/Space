var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var multer = require('multer');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/mydb');

var storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, path.join(__dirname, 'public', 'store'));
  },
  filename: function(req, file, cb){
    cb(null, file.originalname);
  }
});

var postSchema = mongoose.Schema({
  name : String,
  size : Number,
  dest : String,
  path : String,
  user : String,
  group : String
});

var User = mongoose.model('User', { name : String,
                                    password : String,
                                    groups : [String]
});

var Group = mongoose.model('Group', { name : String,
                                      users : [String]
});

// var gaurav = new User({ name : 'Gaurav',
//                         password : 'password',
//                         groups : [ '2k17', 'Birla']
// })
// gaurav.save( function(err, gaurav){
//   if (err)
//     console.log('Error saving user');
//   console.log('User Saved');
// });

var Post = mongoose.model('Post', postSchema);

var upload = multer( {storage : storage} );

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res, next){
	res.sendFile(path.join(__dirname, 'public','index.html'));
});

app.get('/posts', function(req, res, next){
  Post.find(function(err, posts){
    if (err)
      return res.status(500).send(err);
    return res.status(200).send(posts);
  });
});

app.get('/groups', function(req, res, next){
  Group.find(function(err, groups){
    if (err)
      return res.status(500).send(err);
    return res.status(200).send(groups);
  });
});

app.get('/groupPosts', function(req, res, next){
  var grp = req.query.name;
  console.log(grp);
  Post.find( { group : grp }, function(err, posts){
    if (err)
      return res.status(500).send(err);
    return res.status(200).send(posts);
  });
});

app.post('/upload', upload.single('myfile'), function(req, res, next){
  if (!req.file)
    return res.status(400).send('No files');
  console.log('creating post');
  var newPost = new Post({ name : req.file.originalname,
                           size : req.file.size,
                           dest : req.file.destination,
                           path : 'store/' + req.file.originalname,
                           user : 'Gaurav',
                           group : '2k17'
  });
  console.log('new post created');
  newPost.save(function(err, newPost){
    if (err){
      console.log('Error occured');
      return console.error(err);
    }
    console.log('Post saved to DB');
  });
  console.log('file uploaded : '+req.file.originalname);
  return res.status(200).send('uploaded');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
