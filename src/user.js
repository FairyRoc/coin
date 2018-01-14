// 初始化user表
var created = false;
module.exports = {
    userCreate: function(mongoose) {
        if (created) return mongoose.model('User');
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
            }
        });
        created = true;
        return mongoose.model('User', userSchema);

    }
}