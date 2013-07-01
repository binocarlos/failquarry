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
var inspectselect = require('../../container/inspectselect');
var eyes = require('eyes');

/*
  Quarry.io - Skeleton Extractor
  ------------------------------

  Middleware that extracts the context of a select query from the request

  /43543534534 ->

  {
    meta:{
      quarryid:43543534534
    }
  }




 */

module.exports = factory;

function factory(){

  return function(req, res, next){

    async.series([

        function(done){

        /*
        
           lets see if there is a skeleton passed as a JSON header
          
        */
        if(req.getHeader('x-json-skeleton')){
          next();
          return;
        }

        /*
        
          Lets see if there is an ID tacked onto the end of the path
          
        */

        var stack_path = req.getHeader('x-quarry-supplier') || '/';
        var pathname = req.url;

        /*
        
          chunk off the supplier path to leave either an id or nothing
          
        */

        if(pathname.indexOf(stack_path)==0){
          pathname = pathname.substr(stack_path.length);
        }
        else{
          pathname = pathname.substr(1);
        }

        /*
        
          this represents a container or the root
          
        */
        var quarryid = pathname;

        /*
        
          stack path is
          
        */
        var skeleton = {
          quarrysupplier:stack_path
        }

        if(!_.isEmpty(quarryid)){
          skeleton.quarryid = quarryid;

          if(req.method=='get' && !req.getHeader('x-json-selectors')){
            req.query.selector = '=' + quarryid;
            if(req.query.tree){
              req.query.selector += ':tree';
            }
          }
        }
        else{
          skeleton.supplychainroot = true;
        }

        req.setHeader('x-json-skeleton', [skeleton]);
        done();

      },

      function(done){

        if(req.method!='get'){
          done();
          return;
        }
        /*
    
           lets see if there is a skeleton passed as a JSON header
          
        */
        if(req.getHeader('x-json-selectors')){
          done();
          return;
        }

        /*
        
          Lets see if there is an ID tacked onto the end of the path
          
        */
        var selector_string = req.query.q || req.query.selector;
        selector_string && (req.setHeader('x-json-selectors', [inspectselect(selector_string)]));
        
        done();
      }
    ], next)
  }
}