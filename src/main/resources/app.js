/*
 This verticle contains the configuration for our application and co-ordinates
 start-up of the verticles that make up the application.
 */

var vertx = require('vertx');
var container = require('vertx/container');

// Our application config - you can maintain it here or alternatively you could
// stick it in a conf.json text file and specify that on the command line when
// starting this verticle

// Configuration for the web server
var webServerConf = {

  // Normal web server stuff
  host: container.env['OPENSHIFT_VERTX_IP'] || '127.0.0.1',
  port: parseInt(container.env['OPENSHIFT_VERTX_PORT']) || 8080,
  ssl: false,

  // Configuration for the event bus client side bridge
  // This bridges messages from the client side to the server side event bus
  bridge: true,
  route_matcher: true,

  // This defines which messages from the client we will let through
  // to the server side
  inbound_permitted: [
    // Allow calls to login and authorise
    {
      address: 'vertx.basicauthmanager.login'
    },
    // Allow calls to get static album data from the persistor
    {
      address : 'vertx.mongopersistor',
      match : {
        action : 'find',
        collection : 'albums'
      }
    },
    // And to place orders
    {
      address : 'vertx.mongopersistor',
      requires_auth : true,  // User must be logged in to send let these through
      match : {
        action : 'save',
        collection : 'orders'
      }
    }
  ],

  // This defines which messages from the server we will let through to the client
  outbound_permitted: [
    {
      address: 'vertx.mongo.broadcast'
    }
  ]
};

// Now we deploy the modules that we need

// Deploy a MongoDB persistor module
var mongoConfig = {
  host: container.env['OPENSHIFT_MONGODB_DB_HOST'] || '127.0.0.1',
  port: parseInt(container.env['OPENSHIFT_MONGODB_DB_PORT']) || 27017,
  db_name:   "vtoons",
  username: container.env['OPENSHIFT_MONGODB_DB_USERNAME'] || null,
  password: container.env['OPENSHIFT_MONGODB_DB_PASSWORD'] || null
}

container.deployModule('io.vertx~mod-mongo-persistor~2.0.0-final', mongoConfig, function() {

  // And when it's deployed run a script to load it with some reference
  // data for the demo
  load('static_data.js');
});

// Deploy an auth manager to handle the authentication

container.deployModule('io.vertx~mod-auth-mgr~2.0.0-final');

// Start the web server, with the config we defined above

//container.deployModule('io.vertx~mod-web-server~2.0.0-final', webServerConf);

// Deploy realtime data binding verticle
container.deployVerticle("io.vertx.example.DefaultWebServer", webServerConf);