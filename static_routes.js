
var sendFileHandler = function(req) {
  var file = req.path();
  if (req.path() === '/') {
    file = '/index.html';
  }
  req.response.sendFile("web" + file);
};

rm.get('/[^/]*', sendFileHandler);
rm.get('/js/.*', sendFileHandler);
rm.get('/js3rdparty/.*', sendFileHandler);
rm.get('/css/.*', sendFileHandler);
rm.get('/fonts/.*', sendFileHandler);