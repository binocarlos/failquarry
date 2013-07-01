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
var express = require('express');
var passport = require('passport');
var fs = require('fs');
var log = require('logule').init(module, 'API Middleware');
var dye = require('dye');
var url = require('url');
var Contract = require('../../../contract');

/*

  quarry.io - warehouse middleware

  gives the browser access to a supplychain connected back to reception

  similar to the API middleware but over socket.io rather than HTTP
  and so it's a full warehouse (with switchboard) implementation
  
*/


module.exports = function(middlewareoptions, system){

  var supplychain = system.supplychain;
  var switchboard = system.switchboard;

  return {
    configure:function(app){
      log.info(dye.yellow('Warehouse Middleware config'));
    },

    mount:function(app, callback){

      fs.readFile(system.codepath('/core/browser.js'), 'utf8', function(error, corecode){

        var config = {
          protocol:'http://',
          hostname:app.options.hostnames[0],
          socketid:app.options.socketid,
          routes:middlewareoptions.routes
        }

        var route = middlewareoptions.mount;

        app.options.sockets.of('/' + app.options.socketid).on('connection', function(socket){

          var user = socket.handshake ? socket.handshake.user : null;

          var subscriptions = {};
          
          /*
          
            RECEPTION ENTRY POINT
            
          */
          socket.on('request', function(request, callback){
            request.headers["x-json-quarry-user"] = user;
            request.headers["x-json-quarry-projectroutes"] = middlewareoptions.routes.project;
            request.headers["x-quarry-department"] = 'api';
            var entrytime = new Date().getTime();
            supplychain.rpc(request, function(packet){
              var exittime = new Date().getTime();
              var takentime = exittime - entrytime;
              packet.headers["x-quarry-speed"] = takentime + 'ms';
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
            
          })
        })

        app.get(route + '/warehouse.js', function(req, res, next){

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

        /*
        
          inject the socket.io and core code ready for a page
          
        */
        app.get(route + '/core.js', function(req, res, next){


          var code = 'this.$quarryconfig = ' + JSON.stringify(config) + ";\n\n";
          code += corecode;
          code += [
            "(function(window){",
            "   var container = require('/lib/container/proto');",
            "   window.$quarry = container.prototype.bootstrapbrowser(window.$quarryconfig);",
            "})(this)"
          ].join("\n");

          res.header('Content-Type', 'application/javascript');
          res.send(code);
        })

        callback();

      })

    }
  }
  
}