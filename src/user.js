// 初始化user表
var created = false;
module.exports = {
    userCreate: function(mongoose) {
        if (created) return mongoose.model('User');
        var SchemaTypes = mongoose.Schema.Types;
        var Schema = mongoose.Schema;
        var userSchema = new Schema({
            openId: String,
            phoneNumber: String,
            nickName: String,
            wallet: {
                "amount": Number,
                "bitCoin": Number,
                "liteCoin": Number,
                "dogCoin": Number
            },
            "profit": {
                "today": Number,
                "total": Number
            },
            "rank": {
                "current": Number,
                "total": Number
            }
        });
        created = true;
        return mongoose.model('User', userSchema);

    }
}