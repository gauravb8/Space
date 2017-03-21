var mongoose = require('mongoose');

// Mongo schemas..
mongoose.model('Post', { name : String,
                         size : Number,
	                	 path : String,
	                	 user : String,
	                	 group : String,
	                	 created_at : Date
});

mongoose.model('User', { name : String,
                         password : String,
                         groups : [String]
});

mongoose.model('Group', { name : String,
                          users : [String],
                          userIds : [String],
                          latestPost : Date
});