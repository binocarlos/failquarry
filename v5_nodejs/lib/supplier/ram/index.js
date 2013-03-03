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
    cacheFactory = require('./cache'),
    containerFactory = require('../../container'),
    Supplier = require('../../supplier'),
    async = require('async');

module.exports = RamSupplier;

/*
  Quarry.io RAM Supplier
  -------------------

  In memory supplier

  options
  -------

  {
    
  }

 */

function RamSupplier(options){
  Supplier.apply(this, [options]);

  console.log('-------------------------------------------');
  console.log('-------------------------------------------');
  console.log('new supplier');

}

util.inherits(RamSupplier, Supplier);

RamSupplier.prototype.select = function(packet, next){

}


function factory(options){

  var supplier = new RamSupplier(options);

  supplier.use(function(packet, next){

    if(packet.path()=='/select'){
      supplier.select(packet, next);
    }

  })

  return supplier;


    /*

        SELECT - searches for data based on a selector

     */
    warehouse.use('quarry', '/select', function(packet, next){

      console.log('-------------------------------------------');
      console.log('at select');
      var previous = packet.req.param('input');
      var selector = packet.req.body();
      var skeleton = packet.req.header('fields')=='skeleton';
      var tree = selector.modifier && selector.modifier.tree ? true : false;

      var results = cache.run_selector(previous, selector);

      var raw_results = warehouse.process_results(results, {
        skeleton:skeleton,
        tree:tree
      })

      console.log('-------------------------------------------');
      console.log('sending results');
      eyes.inspect(raw_results);

      packet.res.send(raw_results);
    })

    /*

        HEAD - get just the _meta for a single container

     */
    warehouse.use('quarry:///head', function(packet, next){

      var quarryid = packet.req.param('quarryid');
      var tree = !_.isEmpty(packet.req.param('tree'));

      var container = cache.by_id(quarryid);

      var raw_results = warehouse.process_results(container.toJSON(), {
        skeleton:true,
        tree:tree
      })

      packet.res.send(raw_results);
    })

    /*

        APPEND - add container data to another container's children

     */
    warehouse.use('quarry:///append', function(packet, next){

      var appenddata = packet.req.param('input');

      var changed_actions = cache.append(appenddata, packet.req.body());

      packet.res.send(changed_actions);
    })

    /*

        SAVE - add container data to another container's children

     */
    warehouse.use('quarry:///save', function(packet, next){

      var savedata = packet.req.param('input');

      var changed_actions = cache.save(savedata, packet.req.body());

      packet.res.send(changed_actions);
    })

    /*

        DELETE - remove containers

     */
    warehouse.use('quarry:///delete', function(packet, next){

      var previous = packet.req.param('input');

      var changed_actions = cache.delete(previous);

      packet.res.send(changed_actions);
    })

    ready_callback && ready_callback(null, cache);
  }

  return router;
}