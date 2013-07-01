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
var Portal = require('../../portal/proto');
var Container = require('../../container');
var eyes = require('eyes');

/*
  Quarry.io - Security Middleware
  -----------------------------

  Checks the config of the supplier for access rules
  and filters the input skeleton and stamped containers
  and plucks them

  {
    "profile.twitter":{
      read:true,
      write:false
    },
    ""
  }

 */

module.exports = factory;

function factory(options){

  var defaultaccess = options.default;
  var resultaccess = _.extend({}, defaultaccess);
  var selectors = options.selectors;

  return function(req, res, next){

    function determineaccess(accessobj){
      if(!accessobj.read){
        blockcontent();
        return;
      }
      else if(req.method!='get' && !accessobj.write){
        blockcontent();
        return; 
      }
      else{
        next();
      }
    }

    function blockcontent(){
      res.statusCode = 403;
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('access blocked');
      eyes.inspect(req.toJSON());
      res.error('resource not accessible by that user');
      return;
    }

    var rawuser = req.getHeader('x-json-quarry-user');

    if(!rawuser){
      determineaccess(defaultaccess);
      return;
    }

    var user = Container.new([rawuser]);

    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log('before');
    eyes.inspect(user.toJSON());
    eyes.inspect(defaultaccess);

    async.forEach(_.keys(selectors), function(selector, next_selector){

      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('run selector');
      eyes.inspect(selector);

      if(!user.find(selector).count()>0){
        next_selector();
        return;
      }

      var access = selectors[selector];

            console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('merge resuts selector');
      eyes.inspect(access);

      _.each(access, function(val, prop){
        if(val!=defaultaccess[prop]){
          resultaccess[prop] = val;
        }
      })

      console.log('-------------------------------------------');
      eyes.inspect(resultaccess);

      next_selector();

    }, function(error){

      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('after access');
      eyes.inspect(resultaccess);

      determineaccess(resultaccess);
      
    })

  }
}