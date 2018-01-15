// 初始化user表
var created = false;
module.exports = {
    walletCreate: function(mongoose) {
        if (created) return mongoose.model('Wallet');
        var SchemaTypes = mongoose.Schema.Types;
        var Schema = mongoose.Schema;
        var walletSchema = new Schema({
            openId: String,
            day: String,
            wallet: {
                "amount": Number,
                "bitCoin": {
                    "amount": Number,
                    "price": Number
                },
                "liteCoin": {
                    "amount": Number,
                    "price": Number
                },
                "dogCoin": {
                    "amount": Number,
                    "price": Number
                }
            }
        });
        created = true;
        return mongoose.model('Wallet', walletSchema);

    }
}