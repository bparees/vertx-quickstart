// Mongo config for local & openshift deployments
var mongoConfig = {
  host: container.env['OPENSHIFT_MONGODB_DB_HOST'] || '127.0.0.1',
  port: parseInt(container.env['OPENSHIFT_MONGODB_DB_PORT']) || 27017,
  db_name:   container.env["OPENSHIFT_APP_NAME"] || "vtoons",
  username: container.env['OPENSHIFT_MONGODB_DB_USERNAME'] || null,
  password: container.env['OPENSHIFT_MONGODB_DB_PASSWORD'] || null
}

// Deploy auth mgr
container.deployModule('io.vertx~mod-auth-mgr~2.0.0-final');

// Deploy the mongo-persistor module
container.deployModule('io.vertx~mod-mongo-persistor~2.0.0-final', mongoConfig, function() {
  // First delete albums
  bus.send(mongo_address, {action: 'delete', collection: 'albums', matcher: {}}, function() {
    // Insert each document
    for (var i = 0; i < albums.length; i++) {
      bus.send(mongo_address, {
        action: 'save',
        collection: 'albums',
        document: albums[i]
      });
    }
  });
  // Delete users
  bus.send(mongo_address, {action: 'delete', collection: 'users', matcher: {}}, function () {
    // And insert a user
    bus.send(mongo_address, {
      action: 'save',
      collection: 'users',
      document: {
        firstname: 'Demo',
        lastname: 'User',
        email: 'demo@example.com',
        username: 'demo',
        password: 'password'
      }
    });
  });
});

// Our initial starting data
var albums = [
  {
    artist: 'The Wurzels',
    genre: 'Scrumpy and Western',
    title: 'I Am A Cider Drinker',
    price: 0.99
  },
  {
    artist: 'Vanilla Ice',
    genre: 'Hip Hop',
    title: 'Ice Ice Baby',
    price: 0.01
  },
  {
    artist: 'Ena Baga',
    genre: 'Easy Listening',
    title: 'The Happy Hammond',
    price: 0.50
  },
  {
    artist: 'The Tweets',
    genre: 'Bird related songs',
    title: 'The Birdy Song',
    price: 1.20
  }
];