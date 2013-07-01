/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

/*
  Module dependencies.
*/
var _ = require('lodash');
var Portal = require('./proto');
var EventEmitter = require('events').EventEmitter;

module.exports = {
  portal:portal,
  radio:radio
}

/*

  quarry.io - portal wrapper

  knows how to wrap an array of portals as one


 */
function portal(container){

  var ret = {};

  var portals = _.map(container.containers(), function(c){
    var portal = new Portal();
    portal.attachcontainer(c);
    /*
    
      attach events here
      
    */
    return portal;
  })

  function factory(method){
    return function(){
      var args = _.toArray(arguments);
      _.each(portals, function(portal){
        portal[method].apply(portal, args);
      })
      return this;
    }
  }
  _.each([
    'appended',
    'saved',
    'deleted',
    'sync',
    'raw',
    'broadcastinstruction',
    'radio',
    'close'
  ], function(method){
    ret[method] = factory(method);
  })

  _.extend(ret, EventEmitter.prototype);

  return ret;
}

function radio(container){

  var ret = {};

  var radios = _.map(container.containers(), function(c){
    var portal = new Portal();
    portal.attachcontainer(c);
    return portal.radio();
    /*
    
      attach events here
      
    */
  })

  function factory(method){
    return function(){
      var args = _.toArray(arguments);
      _.each(radios, function(radio){
        radio[method].apply(radio, args);
      })
      return this;
    }
  }
  _.each([
    'listen',
    'listenonce',
    'talk',
    'close'
  ], function(method){
    ret[method] = factory(method);
  })

  _.extend(ret, EventEmitter.prototype);

  return ret;
}