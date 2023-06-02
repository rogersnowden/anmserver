var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("anm");
  dbo.collection("session").drop(function(err, delOK) {
    if (err) throw err;
    if (delOK) console.log("Session collection dropped");
    db.close();
  });
}); 