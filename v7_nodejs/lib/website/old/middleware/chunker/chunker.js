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
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var dye = require('dye');
var url = require('url');
var cheerio = require('cheerio');
/*

  quarry.io - chunker middleware

  processes any HTML files for quarry tags that might be processed
  by a script server
  
*/

function repeat(){

  return {
    template:'',
    selector:''
  }
}

function parseattr(st){
  var attr = {};

  _.each(st.match(/(\w+)="([^"]*?)"/g), function(match){
    var parts = match.split('=');
    var key = parts[0];
    var value = parts[1].replace(/^"/, '').replace(/"$/, '');

    attr[key] = value;
  })

  return attr;
}

module.exports = Chunker;

function Chunker(warehouse){
  EventEmitter.call(this);
  this.warehouse = warehouse;

  

}

util.inherits(Chunker, EventEmitter);

/*

  prepare a function that will execute this HTML page as a quarry page

  (this fn can be cached later for opti-max-speed-done-ting)
  
*/
Chunker.prototype.compile = function(warehouse, html){

  return function(callback){

    var match = null;

    var chunks = [];
    var count = 0;

    while(match = html.match(/<warehouse.*?>(.|\n)*?<\/warehouse>/i)){
      var orig = match[0];

      var id = count++;
      chunks.push({
        id:id,
        html:orig
      })
      
      html = html.replace(orig, '<chunk' + id + '>');
    }

    var output = '' + html;

    async.forEach(chunks, function(chunk, nextchunk){

      var warehousematch = null;

      if(warehousematch = chunk.html.match(/<warehouse(.*?)>((.|\n)*?)<\/warehouse>/)){
        var attr = parseattr(warehousematch[1]);
        var content = warehousematch[2];

        if(!attr.ship){
          nextchunk();
          return;
        }

        var contentmatch = null;
        $ = cheerio.load(content);

        function process(repeat, container){

          var results = container.find(repeat.attr('selector'));

          var html = '';

          results.each(function(result){

            var copy = repeat.clone();

            function getnextrepeat(){
              return copy.find('repeat').length>0 ? copy.find('repeat').first() : null;
            }

            var current = getnextrepeat();
            while(current){
              process(current, result.clone());
              current = getnextrepeat();
            }

            var resulthtml = copy.html();

            resulthtml = resulthtml.replace(/\{\{(.*?)\}\}/, function(match, prop){
              return result.attr(prop.replace(/^\s+/, '').replace(/\s+$/, ''));
            })

            html += resulthtml;
          })

          repeat.replaceWith(html);
        }

        warehouse(attr.ship).ship(function(results){

          function getnextrepeat(){
            return $('repeat').length>0 ? $('repeat').first() : null;
          }

          var current = getnextrepeat();
          while(current){
            process(current, results.clone());
            current = getnextrepeat();
          }
          
          chunk.output = $.html();
          
          nextchunk();
        })
      }
      else{
        chunk.replace = chunk.html;
      }


    }, function(){

      _.each(chunks, function(chunk){
        output = output.replace('<chunk' + chunk.id + '>', chunk.output);
      })

      callback(null, output);
    })
  }

}