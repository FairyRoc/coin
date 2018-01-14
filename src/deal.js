// 初始化deal表
var created = false;
module.exports = {
    dealCreate: function(mongoose) {
        if (created) return mongoose.model('Deal');
        var Schema = mongoose.Schema;
        var dealSchema = new Schema({
            timestamp: Number,
            openId: String,
            type: {
                bitCoin: Number,
                liteCoin: Number,
                dogCoin: Number
            }
        });
        created = true;
        return mongoose.model('Deal', dealSchema);

    }
}