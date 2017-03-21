var express = require('express');
var app = express();
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');

//Mongoose setup..
require('./models/models');
var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Group = mongoose.model('Group');
var User = mongoose.model('User');

mongoose.connect('mongodb://localhost/mydb');

// Socket.io setup..
var io = require('socket.io')();
app.io = io;

// Multer setup..
var multer = require('multer');
var storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, path.join(__dirname, 'public', 'store'));
  },
  filename: function(req, file, cb){
    cb(null, file.originalname);
  }
});

var upload = multer( {storage : storage} );

// Routing APIs. Not used currently..
var routes = require('./routes/index');
var users = require('./routes/users');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', function(socket){
  console.log('New user connected');
});

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
  var id = req.query.id;
  Post.find( { group : id }, function(err, posts){
    if (err)
      return res.status(500).send(err);
    return res.status(200).send(posts);
  });
});

app.post('/upload', upload.single('myfile'), function(req, res, next){
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
