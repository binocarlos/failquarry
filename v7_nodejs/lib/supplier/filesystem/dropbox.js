/*
  Copyright (c) 2012 All contributors as noted in the AUTHORS file

  This file is part of quarry.io

  quarry.io is free software; you can redistribute it and/or modify it under
  the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation; either version 3 of the License, or
  (at your option) any later version.

  quarry.io is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.

  You should have received a copy of the GNU Lesser General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/*
  Module dependencies.
*/

var utils = require('../../utils')
  , eyes = require('eyes')
  , _ = require('lodash');

var Container = require('../../container');
var Warehouse = require('../../warehouse');
var async = require('async');
var wrench = require('wrench');
var fs = require('fs');
var mime = require('mime');

var UserTokens = require('../middleware/usertokens');
var ContainerSupplier = require('../container');

/*
  Quarry.io - Dropbox Supplier
  ----------------------------

  Filesystem supplier that uses the dropbox OAuth key


 */

module.exports = function(options, network){

  var warehouse = Warehouse();
  var folderpath = options.folderpath;

  var supplier = ContainerSupplier(options);

  supplier.use(UserTokens('dropbox'));
  supplier.getwrapper(function(req, res, next){
    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log('DIRECTORY SUPPLIER: ' + folderpath);
    load(options, folderpath, req.url, function(error, data){
      if(error || !data){
        res.send404();
        return;
      }
      res.send(data);
    })
  })

  return supplier;
}