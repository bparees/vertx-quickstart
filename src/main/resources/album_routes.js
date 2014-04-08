// Used to handle saves (POST & PUT) from HTTP request
var saveHandler = function(req) {
  req.bodyHandler(function(data) {
    var album = JSON.parse(data);
    var error = validateAlbum(album);
    if (error) {
      req.response.statusCode(400);
      req.response.end(error + '\n');
    } else {
      var id = req.params().get('id');
      if (id != undefined) {
        album._id = id;
      }
      var json = {action: "save", collection: "albums", document: album};
      send(json, req, function(req) {
        req.response.end();
      });
    }
  });
};

// Validates data from POST & PUT requests
var validateAlbum = function(album) {
  if (album.artist == undefined) {
    return "artist required";
  }
  if (album.title == undefined) {
    return "title required";
  }
  if (album.genre == undefined) {
    return "genre required";
  }
  if (album.price == undefined) {
    return "price required";
  }

  return null;
};

//------------------------------ API Routes ------------------------------//

// Find all albums
rm.get('/api/albums/?', function(req) {
  var json = {action: 'find', collection: 'albums', matcher: {}};
  send(json, req, function(req, msg) {
    req.response.end(stringify(msg.results));
  });
});

// Find one album
rm.get('/api/albums/:id/?', function(req) {
  var id = req.params().get('id'); // Retrieve the :id field from the route matcher
  var json = {action: 'find', collection: 'albums', matcher: {_id: id}};
  send(json, req, function(req, msg) {
    if (msg.results[0]) {
      req.response.end(stringify(msg.results[0]));
    } else {
      req.response.end();
    }
  })
});

// Save album
rm.post('/api/albums/?', saveHandler);
rm.put('/api/albums/:id/?', saveHandler);

// Delete album
rm.delete('/api/albums/:id/?', function(req) {
  var id = req.params().get('id'); // Retrieve the :id field from the route matcher
  if (id) {
    var json = {action: 'delete', collection: 'albums', matcher: {_id: id}};
    send(json, req, function(req, msg) {
      if (msg.number == 1) {
        req.response.end();
      } else {
        req.response.statusCode(404);
        req.response.end('No document found for id ' + id + '\n');
      }
    });
  } else {
    req.response.statusCode(400);
    req.response.end('id is required');
  }
});