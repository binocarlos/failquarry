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
var async = require('async');
var eyes = require('eyes');
var fs = require('fs');
var url = require('url');

var Contract = require('../../../contract');
var Container = require('../../../container');

/*

  quarry.io - warehouse middleware

  gives the browser access to a supplychain connected back to reception

  similar to the API middleware but over socket.io rather than HTTP
  and so it's a full warehouse (with switchboard) implementation
  
*/


module.exports = function(options, network){

  var io = network.io;
  var hq = network.hq;
  var receptionfront = network.receptionfront;
  var switchboard = receptionfront.switchboard;
  var warehouse = receptionfront.connect('/');
  var httproute = options.route;
  var stackfolder = hq.attr('stack.corefolder');
  var route = options.route;

  return {

    mount:function(app, callback){

      var appoptions = app.get('options');

      fs.readFile(stackfolder + '/browser.js', 'utf8', function(error, corecode){

        var config = {
          protocol:'http://',
          hostname:appoptions.hostnames[0],
          socketid:appoptions.socketid
        }

        io.of('/' + config.socketid).on('connection', function(socket){

          var user = socket.handshake ? socket.handshake.user : null;

          var subscriptions = {};

          socket.on('request', function(routing_packet, request, callback){
            request.headers["x-json-quarry-user"] = user;
            var start = new Date().getTime();
            receptionfront.rpc(routing_packet, request, function(packet){
              packet || (packet = {
                headers:{},
                body:'null resposnse'
              })
              packet.headers["x-quarry-responsetime"] = ((new Date().getTime()) - start) + 'ms';
              callback(packet);
            })
          })

          socket.on('subscription', function(routingkey, callback){
            if(subscriptions[routingkey]){
              return;
            }
            subscriptions[routingkey] = true;
            switchboard.listen(routingkey, function(message){
              socket.emit('broadcast', routingkey, message);
            })
          })

          socket.on('cancelsubscription', function(routingkey, callback){
            delete(subscriptions[routingkey]);
          })

          socket.on('broadcast', function(req, callback){
            switchboard.broadcast(req.routing_key, req.packet);
          })
        })

        app.get(route + '/quarry.js', function(req, res, next){

          var socketscript = [config.protocol, config.hostname, "/socket.io/socket.io.js"].join('');
          var corescript = [config.protocol, config.hostname, route, '/core.js'].join('');

          var files = [socketscript, corescript];

          var code = '';

          _.each(files, function(file){
            code += 'document.write(\'<script type="text/javascript" src="' + file + '"></script>\');';
          })

          res.header('Content-Type', 'application/javascript');
          res.send(code);
          
        })


        app.get(route + '/core.js', function(req, res, next){
          var user = req.user || null;
          if(user){
            delete(user.attr.tokens)
          }
          var compileconfig = _.extend({}, config, {
            user:user
          })
          
          var browserhtml = Container.browserhtml(compileconfig, corecode);

          res.header('Content-Type', 'application/javascript');
          res.send(browserhtml);
        })

        callback();

      })
    }
  }

}