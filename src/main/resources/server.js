/*
 * Copyright 2011-2014 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var vertx = require('vertx');
var http   = require('vertx/http');
var console = require('vertx/console');
var container = require('vertx/container');

// Reference to the vertx event bus
var bus = vertx.eventBus;
var mongo_address = 'vertx.mongopersistor';     // Address mongo persistor uses
var mongo_proxy = 'vertx.mongo.proxy';          // Our mongo 'proxy' which will broadcast changes if necessary
var mongo_broadcast = 'vertx.mongo.broadcast';  // Our client address to broadcast changes to

// Setup mongo & init data
load('mongo.js');

// Setup our mongo_proxy event bus handler to broadcast changes real-time
bus.registerHandler(mongo_proxy, function(msg, replyTo) {
  var broadcast = {action: msg.action, collection: msg.collection};
  bus.send(mongo_address, msg, function(reply) {
    if (reply.status === 'ok') {
      if ("save" === msg.action) { // If we detect a save, we publish the new/updated document.
        broadcast.document = msg.document;
        if (reply._id) {
          broadcast.document._id = reply._id;
        }
        bus.publish(mongo_broadcast, broadcast);
      } else if ("delete" === msg.action) { // If we delete, we publish the id of the document deleted.
        broadcast._id = msg.matcher._id;
        bus.publish(mongo_broadcast, broadcast);
      }
    }
    replyTo(reply);
  })
});

// Handles sending message to mongo proxy, handling any errors when appropriate. This is used in album_routes.js
var send = function(json, req, handler) {
  //console.log('--------> ' + stringify(json));
  bus.send(mongo_proxy, json, function(msg) {
    //console.log('<-------- ' + stringify(msg));
    if (msg.status === 'ok') {
      handler(req, msg);
    } else {
      req.response.statusCode(500);
      req.response.end(JSON.stringify(msg));
    }
  });
};

// Helper method to pretty print json
var stringify = function(json) {
  return JSON.stringify(json, undefined, 2) + '\n';
};

// Create our route matcher
var rm = new http.RouteMatcher();

// Load our static route handlers
load('static_routes.js');

// Load the album route handlers
load('album_routes.js');

// Handle anything that doesn't match our registered routes
rm.noMatch(function(req) {
  req.response.statusCode(404);
  req.response.end('Resource not found for path ' + req.path() + '\n');
});

// Create the http server
var host = container.env['OPENSHIFT_VERTX_IP'] || '127.0.0.1';
var port = parseInt(container.env['OPENSHIFT_VERTX_PORT'] || '8080');
var server = http.createHttpServer();

server.requestHandler(rm);

load('sockjs_server.js');

server.listen(port, host, function(err) {
  if (!err) {
    console.log('OpenShift Quickstart started !');
  } else {
    console.log("OpenShift Quickstart failed to start: " + err);
  }
});