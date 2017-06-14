var express = require('express');
var router = express.Router();
var mongo = require('mongodb').MongoClient;
var assert = require('assert');

var url = 'mongodb://localhost:27017/Company';

/* GET home page. */
router.get('/', function(req, res, next) {
    mongo.connect(url, function (err, db) {
       assert.equal(null,err);
       db.collection('company').find().toArray(function (err, doc) {
           assert.equal(null, err);
           res.render('index', {company: doc});
           db.close();
       });
    });
  //res.render('index', { title: 'Express' });
});
router.get('/addCompany', function (req, res) {
    mongo.connect(url, function (err, db) {
        assert.equal(null, err);
        db.collection('company').find().toArray(function (err, result) {
            assert.equal(null, err);
            var names = [];
            var len = result.length;
            for (var i=0; i< len; i++) {
                names.push(result[i].name);
            }
            res.send(names);
        });
    })
});
router.post('/addCompany', function (req, res) {
    var company = {
      name: req.body.name,
      capital: +req.body.capital,
      type: req.body.type,
      childs: [],
      additionalCapital: 0,
      together: +req.body.capital,
      parent: null
    };
    if(company.type === 'Subsidiary') {
        company.parent = req.body.parent;
    }
    mongo.connect(url, function (err, db) {
        assert.equal(null, err);
        var collection = db.collection('company');
        collection.insertOne(company, function (err, result) {
            assert.equal(null, err);
            console.log('added');
        });
        if(company.type === 'Subsidiary') {
            collection.updateOne({name: company.parent}, {$push: {childs: company.name}}, function (err, result) {
                assert.equal(null, err);
            });
           /* collection.updateOne({name: company.parent}, { $inc: { together : +company.capital, additionalCapital: +company.capital }}, function (err, result) {
                assert.equal(null, err);
                console.log('increses');
            });*/
            res.redirect('/addCapital/'+ company.parent + '/' + company.capital);
            /*collection.findOne({name: company.name}, function (err, doc) {
                assert.equal(null, err);
                console.log(doc);
                var name = doc.parent;
                if(name != null) {
                    console.log('redir');
                    res.redirect('/addCapital/'+ name + '/' + company.capital);
                }
                else res.redirect('/')

            });*/
        }
        else {
            res.redirect('/');
        }
    });
   // res.redirect('/');
});
router.get('/addCapital/:name/:count', function (req, res) {
    var name = req.params.name;
    var count = req.params.count * 1;
    mongo.connect(url, function (err, db) {
        assert.equal(null, err);
        var collection = db.collection('company');
        collection.updateOne({name: name}, {$inc: {together: count, additionalCapital: count}}, function (err, result) {
            assert.equal(null, err);
        });
        collection.findOne({name: name}, function (err, doc) {
            assert.equal(null, err);
            if(doc.parent != null) {
               // res.send({parent: doc.parent, count: count});
                res.redirect('/addCapital/' + doc.parent + '/' + count);
            }
            else res.redirect('/');
        })
    })
});
router.get('/delete/Main/:name', function (req, res) {
    /*If i delete main company i will be delete all here subsidiary companies*/
    var name = req.params.name;
    mongo.connect(url, function (err, db) {
        assert.equal(null, err);
        var collection = db.collection('company');
        collection.findOne({name: name}, function (err, doc) {
            assert.equal(null, err);
            if(doc.childs.length > 0 ) {
                res.send(doc.childs);
            }
        });
        collection.removeOne({name: name});
        db.close();
    });
   // res.redirect('/');
});
router.get('/delete/Subsidiary/:name', function (req, res) {
    var name = req.params.name;
    mongo.connect(url, function (err, db) {
       assert.equal(null, err);
       var collection = db.collection('company');
       collection.updateOne({childs: name}, {$pull: {childs: name}}, function (err, doc) {
           assert.equal(null, err);
           console.log('deleted');
       });
       collection.findOne({name:name}, function (err, result) {
          assert.equal(null, err);
          var count = -result.together;
           res.redirect('/addCapital/' + name + '/' + count);
          // collection.removeOne({name: name});
       });
    });
});
router.post('/delete', function (req, res) {
    var result = req.body['arr[]'];
    if (typeof result != 'object') {
        result = [req.body['arr[]']];
    }
    mongo.connect(url, function (err, db) {
        assert.equal(null, err);
        db.collection('company').find({name: {$in: result}}).toArray(function (err, doc) {
            assert.equal(null, err);
            var len = doc.length;
            var arr = [];
            for(var i=0; i< len; i++) {
                for(var j=0; j < doc[i].childs.length; j++) {
                    arr.push(doc[i].childs[j]);
                }
            }
            if(arr.length > 0 ) {
                res.send(arr);
            }
            else res.send('end');
            res.end();
        });
        db.collection('company').removeMany({name: {$in: result}});
        db.close();
    });
});
router.get('/deleteTree', function (req, res) {
   mongo.connect(url, function (err, db) {
       assert.equal(null, err);
       var collection = db.collection('company');
       collection.findOne({additionalCapital: {$lt: 0}}, function (err, doc) {
          assert.equal(null, err);
          if(doc !== null && doc.childs.length > 0) {
              res.send(doc.childs);
              res.end();
          }
         else {
             res.send('end');
             res.end();
         }
       });
       collection.removeOne({additionalCapital: {$lt: 0}});
   })
});
router.get('/edit/:name/:capital', function (req, res) {
    var name = req.params.name;
    mongo.connect(url, function (err, db) {
        assert.equal(null, err);
        db.collection('company').findOne({name: name}, function (err, doc) {
            assert.equal(null, err);
            res.send(doc);
            res.end();
            db.close();
        });
    })
});
router.post('/edit/:name/:capital', function (req, res) {
    var name = req.params.name;
    var capital = req.params.capital * 1;
    var newName = req.body.name;
    var newCapital = req.body.capital *1;
    var difference = newCapital - capital;
    mongo.connect(url, function (err, db) {
        assert.equal(null, err);
        var collection = db.collection('company');
        collection.updateOne({childs: name}, {$push: {childs: newName}}, function (err, doc) {
            assert.equal(null, err);
        });
        collection.updateMany({parent: name},{$set : {parent: newName}}, function (err, doc) {
            assert.equal(null, err);
        });
        collection.updateOne({childs: name}, {$pull: {childs: name}}, function (err, doc) {
            assert.equal(null, err);
        });
        collection.updateOne({name: name}, {$set: {name: newName, capital: newCapital}, $inc: {together: difference}}, function (err, doc) {
            assert.equal(null, err);
        });
        collection.findOne({name: newName}, function (err, doc) {
            assert.equal(null, err);
            if(doc.parent != null) {
                res.redirect('/addCapital/' + doc.parent + '/' + difference);
            }
            else res.redirect('/');
        })

    });
});
router.get('/getTree', function (req, res) {
    mongo.connect(url, function (err, db) {
        assert.equal(null, err);
        db.collection('company').find().toArray(function (err, doc) {
            assert.equal(null, err);
            var str = '';
            for(var i=0; i< doc.length; i++) {
                if(doc[i].type == "Main") {
                    str += '-' + doc[i].name + '<br>';
                    str += GetTree(doc, doc[i].childs);
                }
            }
            res.send(str);
            db.close();
            res.end();
        });
    })
});
function GetTree(doc, arr) {
    var str = '-';
    if(arr.length > 0) {
        for (var i=0; i< doc.length; i++) {
           // str += '-';
            for (var j=0; j< arr.length; j++) {
                //str += '-';
                if(doc[i].name == arr[j]) {
                    str += '-' + doc[i].name + '|' + doc[i].capital + 'K$ ' + '|' + doc[i].together + 'K$' + '<br>';
                    str += GetTree(doc, doc[i].childs);
                }
            }
        }
    }
    return str;
}
module.exports = router;
