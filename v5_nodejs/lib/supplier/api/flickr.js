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

var _ = require('underscore'),
    eyes = require('eyes'),
    async = require('async'),
    rest = require('restler');

module.exports = factory;

/*
  Quarry.io Flickr API Supplier
  -----------------------------

  API supplier for Flickr

  options
  -------

  {
    
  }

 */

function image_factory(data){

  return {
    _meta:{
      quarryid:'flickr' + data.owner + ':' + data.id,
      id:data.id,
      tagname:'image'
    },
    _attr:{
      name:data.title,
      image:'http://farm' + data.farm + '.staticflickr.com/' + data.server + '/' + data.id + '_' + data.secret + '.jpg',
      thumbnail:'http://farm' + data.farm + '.staticflickr.com/' + data.server + '/' + data.id + '_' + data.secret + '_s.jpg'
    },
    _children:[]
  }
} 

function factory(options){

  options || (options = {});

  var apikey = options.apikey;

  if(!apikey){
    throw new Error('api/flickr requires an api key');
  }

  function router(warehouse, ready_callback){

    /*

        SELECT - searches for data based on a selector

     */
    warehouse.use('/select', function(packet, next){
      var previous = packet.req.param('input');
      var selector = packet.req.body();
      var skeleton = packet.req.header('fields')=='skeleton';
      var tree = selector.modifier && selector.modifier.tree ? true : false;
      var selector = packet.req.body();

      function get_search(){
        var attr = selector.attr && selector.attr[0];

        if(attr){
          if(attr.field=='search'){
            return attr.value;
          }
          else{
            return '';
          }
        }
      }

      var query = '&tags=' + _.keys(selector.classnames || {}).join(',') + '&text=' + get_search();

      var url = 'http://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=' + apikey + '&format=json&nojsoncallback=1&extras=url_o&tag_mode=all&' + query;

      rest.get(url).on('complete', function(data){

        var results = _.map(data.photos.photo, image_factory);

        packet.res.send(results);

      })


//      

  
      /*

      flickr.photos.search({tags:'badgers'},  function(error, results) {
    sys.puts(sys.inspect(results));
});
      */

 
    })

    ready_callback && ready_callback();

    
    
  }

  return router;
}