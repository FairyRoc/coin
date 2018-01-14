// 初始化coin表
var created = false;
module.exports = {
    coinCreate: function(mongoose) {
        if (created) return mongoose.model('Coin');
        var Schema = mongoose.Schema;
        var coinSchema = new Schema({
            timestamp: Number,
            bitCoin: Number,
            liteCoin: Number,
            dogCoin: Number
        });
        created = true;
        return mongoose.model('Coin', coinSchema);

    }
}