var mongoose = require("mongoose");
require('mongoose-long')(mongoose);

var url = "mongodb://localhost/test";
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

module.exports = {
	getDB : function(){
		mongoose.connect(url)
		return mongoose;
	}
}