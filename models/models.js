var mongoose = require('mongoose');

// Mongo schemas..
mongoose.model('Post', { name : String,
                         size : Number,
    	                	 path : String,
    	                	 user : String,
                         user_id : String,
    	                	 group : String,
    	                	 created_at : Date
});

mongoose.model('User', { username : String,
                         password : String,
                         group_ids : [String]
});

mongoose.model('Group', { name : String,
                          users : [String],
                          userIds : [String],
                          latestPost : Date
});