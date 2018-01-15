var express = require('express');
var router = express.Router();
var DB = require('../src/db-util');
const rq = require("request-promise");
const moment = require('moment');
const schedule = require('node-schedule');
const INIT_MONEY = 1000000,
    USD_RATE = 6.41889723;

const { userCreate } = require('../src/user');
const { coinCreate } = require('../src/coin');
const { dealCreate } = require('../src/deal');
const { walletCreate } = require('../src/wallet');

var mySetInterval = function(task, millisec) {
    function interval() {
        task();
        setTimeout(interval, millisec);
    }
    setTimeout(interval, millisec)
}

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/api/userInfo', function(req, res, next) {
    var mongoose = DB.getDB(),
        db = mongoose.connection,
        openId = req.query.openId;
    db.once("open", function() {
        var User = userCreate(mongoose);
        var Wallet = walletCreate(mongoose);
        var Coins = coinCreate(mongoose);
        User.find({ openId: openId }, function(error, user) {
            if (error) res.send(error);
            if (user.length === 0) res.send(JSON.stringify({
                status: 'error',
                info: "User Not Found"
            }))
            if (user.length === 1) {
                user = user[0];
                Promise.all([
                    User.count({}),
                    User.count({
                        "wallet.amount": {
                            "$gt": user.wallet.amount
                        }
                    })
                ]).then((rank) => {
                    //计算收益
                    var totalProfit = user.wallet.amount,
                        todayProfit = 0,
                        todayWallet = 0;
                    Coins.find().sort({ timestamp: -1 }).limit(1).exec().then(coin => {
                        Wallet.find({
                            "day": moment().format("YYYY-MM-DD")
                        }).then(today => {
                            today = today[0];
                            ["bitCoin", "liteCoin", "dogCoin"].forEach((value) => {

                                totalProfit += (user.wallet[value] * coin[0][value]);
                                todayWallet += (today.wallet[value].amount * today.wallet[value].price)
                            })
                            todayWallet += today.wallet.amount
                            todayProfit = (totalProfit - todayWallet);
                            totalProfit -= INIT_MONEY;
                            console.log(todayWallet, todayProfit, totalProfit)
                            res.send(JSON.stringify({
                                openId: user.openId,
                                phoneNumber: user.phoneNumber,
                                nickName: user.nickName,
                                wallet: {
                                    amount: user.wallet.amount,
                                    bitCoin: user.wallet.bitCoin,
                                    liteCoin: user.wallet.liteCoin,
                                    dogCoin: user.wallet.dogCoin
                                },
                                profit: {
                                    today: todayProfit,
                                    total: totalProfit
                                },
                                rank: {
                                    current: rank[1] + 1,
                                    total: rank[0]
                                }
                            }));
                            db.close();
                        });
                    });
                })
            }
        })
    })
})


router.post('/api/userCreate', function(req, res, next) {
    var mongoose = DB.getDB(),
        db = mongoose.connection,
        data = req.body;
    db.once("open", function() {
        var User = userCreate(mongoose);
        var user = new User({
            openId: data.openId,
            phoneNumber: data.phoneNumber,
            nickName: data.nickName,
            wallet: {
                "amount": 1000000,
                "bitCoin": 0,
                "liteCoin": 0,
                "dogCoin": 0
            }
        })
        user.save((err, user) => {
            if (err) { console.log(err, "存储出错了") }
            var Wallet = walletCreate(mongoose);
            var Coins = coinCreate(mongoose);
            var data = req.body;
            var todayWallet = new Wallet({
                openId: data.openId,
                day: moment().format("YYYY-MM-DD"),
                wallet: {
                    "amount": 1000000,
                    "bitCoin": {
                        amount: 0,
                        price: 0
                    },
                    "liteCoin": {
                        amount: 0,
                        price: 0
                    },
                    "dogCoin": {
                        amount: 0,
                        price: 0
                    }
                }
            })
            todayWallet.save((err, wallet) => {
                if (err) res.send("err");
                db.close();
                res.send(JSON.stringify({
                    status: 'success'
                }))
            })
        });
    })
})

router.post('/api/coin', function(req, res, next) {

    var mongoose = DB.getDB(),
        db = mongoose.connection;
    db.once("open", function() {
        var Coin = coinCreate(mongoose)
        var data = req.body
        var coin = new Coin({
            timestamp: new Date(),
            bitCoin: data.bitCoin,
            liteCoin: data.liteCoin,
            dogCoin: data.dogCoin
        })
        coin.save((err, coin) => {
            if (err) {
                res.send(JSON.stringify({
                    status: 'error',
                    info: err.toString()
                }))
            }
            db.close();
            res.send(JSON.stringify({
                status: 'success'
            }))
        });
    })
})


router.get('/api/coinList', function(req, res, next) {
    var mongoose = DB.getDB(),
        db = mongoose.connection;
    db.once("open", function() {
        var Coins = coinCreate(mongoose);
        Coins.find({}, { _id: 0, __v: 0 }).sort({ timestamp: -1 }).limit(60 * 24).exec().then(coins => {
            res.send(JSON.stringify({
                satus: 'success',
                data: coins
            }))
            db.close();
        })
    })
})
//0点插表
router.post('/api/wallet', function(req, res, next) {
    var mongoose = DB.getDB(),
        db = mongoose.connection;
    db.once("open", function() {
        var Wallet = walletCreate(mongoose);
        var data = req.body;
        var wallet = new Wallet({
            openId: data.openId,
            day: data.day,
            wallet: {
                "amount": data.wallet.amount,
                "bitCoin": data.wallet.bitCoin,
                "liteCoin": data.wallet.liteCoin,
                "dogCoin": data.wallet.dogCoin
            }
        })
        wallet.save((err, wallet) => console.log(err, wallet))

    })
})

router.post('/api/present', function(req, res, next) {

    var mongoose = DB.getDB(),
        db = mongoose.connection;
    db.once("open", function() {
        var Deal = dealCreate(mongoose),
            User = userCreate(mongoose);
        Coin = userCreate(mongoose);
        var data = req.body
        var deal = new Deal({
            timestamp: data.timestamp,
            openId: data.openId,
            type: data.type,
            behavior: 'present'
        })
        //存储交易数据
        deal.save((err, deal) => {
            if (err) { console.log(err, "errLog") }
            //user更新购买后数据
            User.find({ openId: data.openId }).then((user) => {
                if (user.length === 1) { user = user[0] } else {
                    res.send(JSON.stringify({
                        status: 'error',
                        info: '用户openId重复'
                    }))
                }
                for (var key in data.type) {
                    user.wallet[key] += data.type[key].amount
                }
                user.save((err, user) => {
                    if (err) console.log(err)
                    db.close();
                })

                res.send(JSON.stringify({
                    status: 'success'
                }))
            })
        });
    })
})

router.post('/api/buy', function(req, res, next) {

    var mongoose = DB.getDB(),
        db = mongoose.connection;
    db.once("open", function() {
        var Deal = dealCreate(mongoose),
            User = userCreate(mongoose);
        Coin = userCreate(mongoose);
        var data = req.body
        var deal = new Deal({
            timestamp: data.timestamp,
            openId: data.openId,
            type: data.type,
            behavior: 'buy'
        })
        //存储交易数据
        deal.save((err, deal) => {
            if (err) { console.log(err, "errLog") }
            //user更新购买后数据
            User.find({ openId: data.openId }).then((user) => {
                if (user.length === 1) { user = user[0] } else {
                    res.send(JSON.stringify({
                        status: 'error',
                        info: '用户openId重复'
                    }))
                }
                for (var key in data.type) {
                    user.wallet[key] += data.type[key].amount
                    user.wallet.amount -= data.type[key].price * data.type[key].amount
                }
                user.save((err, user) => {
                    if (err) console.log(err)
                    db.close();
                })

                res.send(JSON.stringify({
                    status: 'success'
                }))
            })
        });
    })
})


router.post('/api/sell', function(req, res, next) {

    var mongoose = DB.getDB(),
        db = mongoose.connection;
    db.once("open", function() {
        var Deal = dealCreate(mongoose),
            User = userCreate(mongoose);
        Coin = userCreate(mongoose);
        var data = req.body
        var deal = new Deal({
            timestamp: data.timestamp,
            openId: data.openId,
            type: data.type,
            behavior: 'sell'
        })
        //存储交易数据
        deal.save((err, deal) => {
            if (err) { console.log(err, "errLog") }
            //user更新卖出后数据
            User.find({ openId: data.openId }).then((user) => {
                if (user.length === 1) { user = user[0] } else {
                    res.send(JSON.stringify({
                        status: 'error',
                        info: '用户openId重复'
                    }))
                }
                for (var key in data.type) {
                    if (user.wallet[key] < data.type[key].amount) res.send(JSON.stringify({
                        status: 'err',
                        info: '余额不足'
                    }));
                    user.wallet[key] -= data.type[key].amount
                    user.wallet.amount += data.type[key].price * data.type[key].amount
                }
                user.save((err, user) => {
                    if (err) console.log(err)
                    db.close();
                })

                res.send(JSON.stringify({
                    status: 'success'
                }))
            })
        });
    })
})

mySetInterval(() => {
    var BTC = rq({
            method: 'GET',
            url: `https://www.bitstamp.net/api/ticker/`,
            headers: {
                "content-type": "application/json"
            }
        }),
        Doge_LTC = rq({
            method: 'GET',
            url: `https://www.btctrade.com/ajax/imtickerall?t=135939180`,
            headers: {
                "content-type": "application/json"
            }
        })
    Promise.all([BTC, Doge_LTC]).then(values => {
        const btc = JSON.parse(values[0]);
        const d_l = JSON.parse(values[1]);
        var res = [];
        res.push(btc.bid,
            d_l.data.doge.sell_usd,
            d_l.data.ltc.sell_usd);
        console.log(res)
        var mongoose = DB.getDB(),
            db = mongoose.connection;
        db.once("open", function() {
            var Coin = coinCreate(mongoose);
            var coin = new Coin({
                timestamp: Date.now(),
                bitCoin: res[0],
                dogCoin: res[1] * USD_RATE,
                liteCoin: res[2] * USD_RATE
            })
            coin.save((err, log) => {
                if (err) console.log(err)
                db.close();
            })
        })
    })
}, 30000)


var j = schedule.scheduleJob('0 0 * * *', function() {
    var mongoose = DB.getDB(),
        db = mongoose.connection;
    db.once("open", function() {
        var Coin = coinCreate(mongoose),
            Wallet = walletCreate(mongoose),
            User = userCreate(mongoose);
        User.find().then(users => {
            Coin.find({
                timestamp: {
                    "$gte": new Date().setHours(0, 0, 0, 0) - 10000,
                    "$lte": new Date().setHours(0, 0, 0, 0) + 10000
                }
            }).then(coins => {
                var todayCoin = coins.map((coin) => {
                    coin.timestamp = Math.abs(coin.timestamp - new Date().setHours(0, 0, 0, 0));
                    return coin;
                }).sort((a, b) => a.timestamp - b.timestamp)[0];
                users.forEach((person) => {
                    var wallet = new Wallet({
                        day: moment().format("YYYY-MM-DD"),
                        openId: person.openId,
                        wallet: {
                            amount: person.wallet.amount,
                            dogCoin: {
                                amount: person.wallet.dogCoin,
                                price: todayCoin.dogCoin
                            },
                            liteCoin: {
                                amount: person.wallet.liteCoin,
                                price: todayCoin.liteCoin
                            },
                            bitCoin: {
                                amount: person.wallet.bitCoin,
                                price: todayCoin.bitCoin
                            }
                        }

                    });
                    wallet.save((err, wallet) => {
                        db.close();
                    })
                })
            })
        })

    })
});


module.exports = router;