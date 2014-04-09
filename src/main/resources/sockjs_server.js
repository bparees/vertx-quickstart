// This defines which messages the server will allow clients to send
inbound = [
  // Allow calls to login and authorise
  {
    address: 'vertx.basicauthmanager.login'
  },
  // Allow calls to logout
  {
    address: 'vertx.basicauthmanager.logout'
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
];

// This defines which messages from the server we will let through to the client
outbound = [
  {
    address: 'vertx.mongo.broadcast'
  }
];

var sockJSServer = vertx.createSockJSServer(server);
// I think js mod should return false by default so we don't have to do this
sockJSServer.on('authorize', function() {
  return false;
});
sockJSServer.bridge({prefix : '/eventbus'}, inbound, outbound);