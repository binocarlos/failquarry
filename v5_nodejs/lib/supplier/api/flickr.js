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