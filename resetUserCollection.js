// reset user collection
// delete all docs (records) and create new collection, with index
const mongoose = require('mongoose');
const User = require('./app/models/user.model'); 

mongoose.connect('mongodb://localhost:27017/anm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', function() {
  console.log("Connected to the database...");
  resetUserCollection();
});

function resetUserCollection() {
  db.dropCollection('users')
    .then(() => {
      console.log('Dropped users collection');
      return User.createCollection();
    })
    .then(() => {
      console.log('Created users collection');
      return User.collection.createIndex({ username: 1 }, { unique: true });
    })
    .then(() => {
      console.log('Index created on username');
    })
    .catch((err) => {
      if (err.code === 26) {
        console.log("Collection doesn't exist. Creating new one.");
        return User.createCollection().then(() => {
          return User.collection.createIndex({ username: 1 }, { unique: true });
        });
      } else {
        console.log('Error:', err);
      }
    })
    .finally(() => {
      db.close();
    });
}


