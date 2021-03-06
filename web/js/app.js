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

//TODO: Organize angular app better

var app = angular.module('vtoons', []);
app.controller("CartController",  ['$scope', '$filter', '$timeout', function($scope, $filter, $timeout) {

  $scope.items = [];
  $scope.orderSubmitted = false;
  $scope.username = '';
  $scope.password = '';
  $scope.loggedIn = false;

  var port = window.location.port;
  if (window.location.hostname.indexOf("rhcloud.com") != -1) {
    port = 8000;
  }
  var eb = new vertx.EventBus(window.location.protocol + '//' + window.location.hostname + ':' + port + '/eventbus');

  eb.onopen = function() {

    // Get the static data
    eb.send('vertx.mongopersistor', {action: 'find', collection: 'albums', matcher: {} },
      function(reply) {
        if (reply.status === 'ok') {
          $scope.albums = reply.results;
          $scope.$apply();
        } else {
          console.error('Failed to retrieve albums: ' + reply.message);
        }
      });

    eb.registerHandler("vertx.mongo.broadcast", function(message) {
      if ("save" === message.action) {
        var newAlbum = message.document;
        var index = $scope.indexOfAlbum(newAlbum._id);
        if (index != -1) {
          $scope.albums[index] = newAlbum;
        } else {
          $scope.albums.push(newAlbum);
        }
        $scope.$apply();
      } else if ("delete" === message.action) {
        var index = $scope.indexOfAlbum(message._id);
        if (index != -1) {
          $scope.albums.splice(index, 1);
          $scope.$apply();
        }
      } else {
        console.log("Invalid msg received: " + message);
      }
    })
  };

  eb.onclose = function() {
    eb = null;
  };

  $scope.indexOfAlbum = function(id) {
    for (var i=0; i < $scope.albums.length; i++) {
      if ($scope.albums[i]._id === id) {
        return i;
      }
    }
    return -1;
  };

  $scope.addToCart = function(album) {
    for (var i = 0; i < $scope.items.length; i++) {
      var compare = $scope.items[i];
      if (compare.album._id === album._id) {
        compare.quantity = compare.quantity + 1;
        return;
      }
    }
    var item = {
      album: album,
      quantity: 1
    };
    $scope.items.push(item);
  };

  $scope.removeFromCart = function(item) {
    $scope.items = $scope.items.filter( function(v) { return v.album._id !== item.album._id; });
  };

  $scope.total = function() {
    var tot = 0;
    for (var i = 0; i < $scope.items.length; i++) {
      var item = $scope.items[i];
      tot += item.quantity * item.album.price;
    }
    return tot;
  };

  $scope.orderReady = function() {
    return $scope.items.length > 0 && $scope.loggedIn;
  };

  $scope.submitOrder = function() {
    if (!$scope.orderReady()) {
      return;
    }

    var orderItems = $filter('json')($scope.items);
    var orderMsg = {
      action: "save",
      collection: "orders",
      document: {
        username: $scope.username,
        items: orderItems
      }
    };

    eb.send('vertx.mongopersistor', orderMsg, function(reply) {
      if (reply.status === 'ok') {
        $scope.orderSubmitted = true;
        // lets clear the cart now
        $scope.items = [];
        $scope.$apply();
        // Timeout the order confirmation box after 2 seconds
        $timeout(function() { $scope.orderSubmitted = false; }, 2000);
      } else {
        console.error('Failed to accept order');
      }
    });
  };

  $scope.login = function() {
    if ($scope.username.trim() != '' && $scope.password.trim() != '') {
      eb.login($scope.username, $scope.password, function(reply) {
        if (reply.status === 'ok') {
          $scope.loggedIn = true;
          $scope.$apply();
        } else {
          alert('invalid login');
          $scope.username = '';
          $scope.password = '';
        }
      });
    }
  };

  $scope.logout = function() {
    eb.logout(function(reply) {
      if (reply.status === 'ok') {
        $scope.loggedIn = false;
        $scope.username = '';
        $scope.password = '';
        $scope.$apply();
      } else {
        console.log("Error logging out. Reply: " + JSON.stringify(reply));
      }
    });
  };
}]);