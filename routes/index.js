var express = require('express');
var router = express.Router();
// var Schema = mongoose.Schema;
var DB = require('../src/db-util');
const rq = require("request-promise");
const { userCreate } = require('../src/user');
const { coinCreate } = require('../src/coin');
const { dealCreate } = require('../src/deal');
// db.connection.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function() {
// 	console.log(db.readyState)
//     // we're connected!
//     var kittySchema = mongoose.Schema({
//         name: String
//     });
//     kittySchema.methods.speak = function() {
//         var greeting = this.name ?
//             "Meow name is " + this.name :
//             "I don't have a name";
//         console.log(greeting);
//     }
//     var Kitten = mongoose.model('Kitten', kittySchema);
//     var fluffy = new Kitten({ name: 'fluffy' });
//     Kitten.remove({})
//         .then(() => {
//             console.log("必须双爆了")
//             fluffy.save().then(() => {
//             	fluffy.speak();
//                 Kitten.find(function(err, kittens) {
//                     if (err) return console.error(err);
//                     console.log(kittens, "我在寻找");
//                 })
//             });
//         });

// });



// var getValue = function(timestamp, type) {

// }

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
        User.find({ openId: openId }, function(error, user) {
            if (error) res.send(error);
            if (user.length === 1) {
                user = user[0]
                Promise.all([
                    User.count({}),
                    User.count({
                        "wallet.amount": {
                            "$gt": user.wallet.amount
                        }
                    })
                ]).then((rank) => {
                    console.log(rank);
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
                            today: 245.4,
                            total: 1344.32
                        },
                        rank: {
                            current: rank[1] + 1,
                            total: rank[0]
                        }
                    }));
                    db.close();
                })

            }
        })

        // var user = new User({
        //     openId: "AAAAFFFF",
        //     phoneNumber: "13122386760",
        //     nickName: "无知者在劫难逃",
        //     wallet: {
        //         "amount": 100,
        //         "bitCoin": 1,
        //         "liteCoin": 1,
        //         "dogCoin": 1
        //     }
        // })
        // user.save((err, user) => {
        //     if (err) { console.log(err, "存储出错了") }
        //     console.log(user);
        //     db.close();
        //     res.send("成功存储")
        // });
    })
})


router.post('/api/coin', function(req, res, next) {

    var mongoose = DB.getDB(),
        db = mongoose.connection;
    db.once("open", function() {
        var Coin = coinCreate(mongoose)
        var data = req.body
        var coin = new Coin({
            timestamp: parseInt(data.timestamp / 60000),
            bitCoin: data.bitCoin,
            liteCoin: data.liteCoin,
            dogCoin: data.dogCoin
        })
        coin.save((err, coin) => {
            if (err) { console.log(err, "errLog") }
            console.log(coin);
            db.close();
            res.send(JSON.stringify({
                status: 'success'
            }))
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
            type: data.type
        })

        deal.save((err, deal) => {
            if (err) { console.log(err, "errLog") }
            User.find({ openId: data.openId }).then((err, user) => {
                for (var key of data.type) {
                    user.wallet[key] += data.type[key]
                    user.wallet.amount += data.type[key] * data.type[key]
                }

            })
            console.log(deal);
            db.close();
            res.send(JSON.stringify({
                status: 'success'
            }))
        });
    })
})


router.post('/api/sell', function(req, res, next) {

    var mongoose = DB.getDB(),
        db = mongoose.connection;
    db.once("open", function() {
        var Coin = coinCreate(mongoose)
        var data = req.body
        var coin = new Coin({
            name: data.name,
            timestamp: Date.now(),
            value: data.value,
            history: data.history
        })
        coin.save((err, coin) => {
            if (err) { console.log(err, "errLog") }
            console.log(coin);
            db.close();
            res.send(JSON.stringify({
                status: 'success'
            }))
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
                liteCoin: res[1],
                dogCoin: res[2]
            })
            coin.save((err, log) => {
                if (err) console.log(err)
                db.close();
            })
        })
    })
}, 5000)

// then((res) => {
//     ["doge", "ltc"].forEach((value) => {
//         var value = res.data[value].sell_usd;
//         var mongoose = DB.getDB(),
//             db = mongoose.connection;
//         db.once("open", function() {
//             var Coin = coinCreate(mongoose);
//             var coin = new Coin({

//             })
//         })

//     })
// });


module.exports = router;