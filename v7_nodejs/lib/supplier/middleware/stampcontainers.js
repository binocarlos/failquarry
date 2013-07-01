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

/*
  Quarry.io - Container Stamp
  ---------------------------

  Inject the route from the supplier into the returned container data

  this is setup as an event listener on the request

  you can also pass in an extra map function

 */

module.exports = factory;

function factory(options){

  options || (options = {});

  return function(req, res, next){

    /*
    
      hook up the container filter when the response is sent
      
    */
    res.on('beforesend', function(){

      var data = res.body;
      if(!_.isArray(data)){
        data = [data];
      }


      res.body = _.map(data, function(result){

        if(!result.meta && result.quarryid){
          result = {
            meta:result
          }
        }
        else if(!result.meta){
          return result;
        }
        
        /*
    
          the basic routing function is to inject the route into the container stamp
          
        */
        if(req.getHeader('x-quarry-supplier') && !result.meta.quarrysupplier){
          /*
            
            the base route is pointing to the supplier
            
          */
          result.meta.quarrysupplier = req.getHeader('x-quarry-supplier');
        }

        if(req.getHeader('x-quarry-department') && !result.meta.quarrydepartment){
          /*
            
            the department within which the route applies
            
          */
          result.meta.quarrydepartment = req.getHeader('x-quarry-department');
        }

        if(options.type){
          result.meta.contentType = options.type;
        }
        else{
          result.meta.contentType = 'quarry/containers';
        }

        options.mapper && mapper(result);

        return result;

      })
    })

    next();
  }
}