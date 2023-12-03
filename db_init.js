const mongoose = require('mongoose');

const dbConfig = require("./app/config/db.config");
console.log("dbConfig: ");
console.log(dbConfig.HOST);
console.log(dbConfig.PORT);
console.log(dbConfig.DB);

const db = require("./app/models");
const Role = require('./app/models/role.model');  // Import the Role model
const Session = db.session;

db.mongoose
  .connect(`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Successfully connected to MongoDB.");
    dropAndInitializeRoles();  // Call the function to drop and initialize roles
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit();
  });

// Function to drop and initialize roles
function dropAndInitializeRoles() {
  mongoose.connection.db.dropCollection('roles')
    .then(() => {
      console.log("Role collection dropped successfully");
      return initializeRoles();
    })
    .catch(err => {
      if (err.code === 26) {
        console.log("Role collection does not exist. Initializing new roles...");
        return initializeRoles();
      } else {
        throw err;
      }
    });
}

// Function to initialize roles
function initializeRoles() {
  const roles = ['user', 'admin', 'super'];
  const rolePromises = roles.map(roleName => new Role({ name: roleName }).save());
  
  return Promise.all(rolePromises)
    .then(() => {
      console.log("Roles initialized successfully");
    })
    .catch(err => {
      console.error("Error initializing roles:", err);
    });
}

// Define other schemas and models here as needed...
