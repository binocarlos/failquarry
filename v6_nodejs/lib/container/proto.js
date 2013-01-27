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

var _ = require('underscore');
var async = require('async');
var utils = require('../utils');
var helpers = require('./helpers');
var dataextractor = require('./dataextractor');
var xml = require('./filters/xml');
var Backbone = require('../vendor/backbone');
var BaseModel = require('./base');
var searcher = require('./search');
var queries = require('../query/factory');
var Transaction = require('../query/transaction');
var eyes = require('eyes');
var parseSelector = require('../query/selector');
var Request = require('../query/request');
var stare = eyes.inspector({maxLength:409600});

var Container = module.exports = {};

var BaseCollection = Backbone.Collection.extend({});

/*

  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Factory
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */

function factory(args, options){
  function instance(){
    return instance.select.apply(instance, _.toArray(arguments));
  }
  _.extend(instance, Container);
  _.extend(instance, Backbone.Events);
  instance.fill(args, options);
  return instance;
}

Container._is_quarry_container = true;
Container.factory = factory;

/*
  The base model used for the models array

  This can be overriden to use a different 'attr' model of the users choosing

 */
Container.basemodel = BaseModel;
Container.basecollection = BaseCollection;

/*

  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Model Array Accessors
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */

// set the backbone model to use for attr
Container.configure = function(options){
  options || (options = {});
  this.options = options;
  if(options.attrmodel){
    this.basemodel = BaseModel.extend({
      attrmodel:options.attrmodel
    })
    this.basecollection = BaseCollection.extend({
      model:this.basemodel
    })
  }
  return this;
}

// this is called with the arguments containing the model data
Container.fill = function(args, options){
  var self = this;
  /*
  
    if networkmode is set then we are running in reception mode
    
  */
  this.networkmode = null;
  this.stack = [];
  this.switchboards = [];
  this.errors = [];
  this.configure(options);
  this.models = new this.basecollection(dataextractor(args, self.basemodel));
  return this;
}

/*

  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Model Array Accessors
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */


// return the model at index
Container.get = function(index){
  //return this.models[index];
  return this.models.at(index);
}

Container.byid = function(id){
  return this.spawn(this.models.get(id));
}

// return a single model container at index
Container.eq = function(index){
  return this.spawn(this.get(index))
}

// make new containers based on the given raw data
// hook up the middleware too
Container.spawn = function(models){
  var ret = factory([], this.options);
  ret.models = new this.basecollection(_.isArray(models) ? models : (models ? [models] : []));
  // pass on the models & stack
  ret.networkmode = this.networkmode;
  ret.stack = this.stack;
  ret.switchboards = this.switchboards;
  ret.basemodel = this.basemodel;
  ret.basecollection = this.basecollection;
  return ret;
}

Container.basemodels = function(){
  return this.models.models;
}

Container.results = function(){
  var ret = factory(_.toArray(arguments), this.options);
  // pass on the models & stack
  ret.networkmode = this.networkmode;
  ret.stack = this.stack;
  ret.switchboards = this.switchboards;
  ret.basemodel = this.basemodel;
  ret.basecollection = this.basecollection;
  return ret;
}

// iterate over single model containers
Container.each = function(fn){
  var self = this;
  this.models.each(function(model){
    fn && fn(self.spawn(model));
  })
}

// append models onto this containers model array
Container.add = function(container){
  var self = this;
  container.models.each(function(model){
    self.models.add(model);
  })
  return this;
}

// add these models to the array of the target
Container.pourInto = function(target){
  target.add(this);
  return this;
}

Container.count = function(){
  return this.models.length;
}

/*

  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Model Array Iterators
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */

// return an array of single model containers
Container.containers = function(){
  var self = this;
  return this.models.map(function(model){
    return self.spawn(model);
  })
}

Container.containermap = function(){
  var map = {};
  _.each(this.containers(), function(container){
    map[container.quarryid()] = container;
  })
  return map;
}

// return an array of the raw backbone models inside of the outside model
Container.backbonemodels = function(){
  return this.models.map(function(model){
    return model.attr;
  })
}

// return a container with the models that passed the filter
// pass single model containers into the filter
Container.filter = function(fn){
  var containers = _.filter(this.containers(), fn);
  var models = _.map(containers, function(container){
    return container.get(0);
  })
  return this.spawn(models);
}

Container.map = function(fn){

  return _.map(this.containers(), fn);
}

Container.find = function(){
  return searcher(this, _.toArray(arguments));
}

/*

  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Children / Descendents
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */

// return a container merging all model children
Container.children = function(){
  var all_models = [];
  this.models.each(function(model){
    all_models = all_models.concat(model.getChildren());
  })
  return this.spawn(all_models);
}

// run a function over each descendent
Container.recurse = function(fn){
  this.descendents().each(fn);
  return this;
}

// return a flat array of all descendents including this level
Container.descendents = function(dev){
  var all_models = [];
  function find_model(model){
    all_models.push(model);
    model.children.each(find_model);
  }
  this.models.each(find_model);
  return this.spawn(all_models);
}


/*

  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Data Accessors
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */

Container.toJSON = function(){
  return this.models.map(function(model){
    return model.toJSON();
  })
}

Container.toXML = function(){
  return xml.toXML(this.toJSON());
}

/*
  
  return an array of the model skeletons

  This is an object always containing the meta.quarryid and meta.skeleton (which the supplier can map)

 */
Container.skeleton = function(options){
  return this.models.map(function(model){
    return model.skeleton(options);
  })
}

Container.ensureids = function(forsaving){
  this.recurse(function(container){
    container.models.each(function(model){
      model.ensureid(forsaving);
    })
  })
  return this;
}

/*

  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Property Accessors
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */
Container.is = function(tagname){
  return this.tagname()==tagname;
}

Container.attr = helpers.model('attr');
Container.meta = helpers.object('meta');

Container.quarryid = helpers.property('meta.quarryid');
Container.tagname = helpers.property('meta.tagname');
Container.id = helpers.property('meta.id');
Container.classnames = helpers.property('meta.classnames');

Container.frequency = helpers.fn('frequency');
Container.route = helpers.fn('route', true);
Container.router = helpers.fn('router');

Container.addClass = function(classname){
  var self = this;
  this.models.each(function(model){
    model.addClass(classname);
  })
  return this;
}

Container.removeClass = function(classname){
  var self = this;
  this.models.each(function(model){
    model.removeClass(classname);
  })
  return this;
}

Container.hasClass = function(classname){
   return this.models.length > 0 && this.get(0).hasClass(classname);
}

Container.hasAttr = function(name){
  return this.models.length > 0 && this.get(0).attr.has(name);
}

Container.removeAttr = function(name){
  this.models.each(function(model){
    model.attr.unset(name);
  })
  return this;
}



/*

  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Portals
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */

/*
  
  Add the given portal function to the warehouse that produced these containers

 */
Container.portal = function(fn){
  var self = this;

  self.models.each(function(model){
    var frequency = model.frequency();

    _.each(self.switchboards, function(switchboard){
      
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('listen');
      eyes.inspect(frequency);
      switchboard.listen('container', frequency, function(message){
        fn && fn.apply(self, [message]);
      })
    })
  })

  return this;
}

Container.removePortal = function(fn){
  var self = this;
  _.each(self.containers(), function(container){
    _.each(self.switchboards, function(switchboard){
      var frequency = container.frequency();
      switchboard.remove('container', frequency, fn);
    })
  })
  return this;
}

Container.removePortals = function(){
  var self = this;
  _.each(self.containers(), function(container){
    _.each(self.switchboards, function(switchboard){
      var frequency = container.frequency();
      switchboard.removeAll('container', frequency);
    })
  })
  return this;
}

/*

  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Stack
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */

// a basic version of the warehouse middleware stack
// this lets us have containers route to multiple warehouses (funky for later)
Container.use = function(fn){
  if ('undefined' != typeof fn.switchboard) {
    this.switchboards.push(fn.switchboard);
  }
  // have we been passed a whole warehouse or just a middleware function
  if ('function' == typeof fn.handle) {
    var server = fn;
    fn = function(req, res, next){
      server.handle(req, res, next);
    }
  }
  
  this.stack.push(fn);
  return this;
}

// run the packet through the stack in parallel - this is the client side stack
Container.handle = function(req, callback){
  var self = this;
  var finalres = queries.response(callback);
  async.forEach(this.stack, function(fn, complete){
    var res = queries.response(function(res){
      if(self.stack.length<=1){
        finalres.set(res.toJSON());
      }
      else{
        finalres.addMultipart(res);  
      }
      
      complete();
    })
    fn(req, res);
  }, function(){
    finalres.send();
  }) 
}

/*

  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Transactions
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */

/*

  The branch between local mode and network mode

  Network mode requests get sent to the reception server first


 */
Container.query_factory = function(query){
  var self = this;

  /*
  
    this means we are connecting to a reception server
    
  */
  if(self.networkmode){
 
    /*
    
      if the request itself is a skeleton - we send it wholesale
      to the reception and let it split apart the routes
      
    */
    if(query.contentType()=='quarry/skeleton'){
      query.skeletonmethod('put');
      query.method('post');
      query.path('/reception/transaction');
      return query;
    }
    /*
    
      otherwise we wrap the request in a blanket
      and the skeleton headers will be used to duplicate the request out
      
    */
    else{
      return new Request({
        method:'post',
        path:'/reception/transaction',
        body:query.toJSON()
      })  
    }
    
  
  }
  /*
  
    otherwise we are in single supplier mode
    
  */
  else{
    query.path('/');
    return query; 
  }
}

/*

  Request

  ----------------------------------------------------------------------------------------------------------------------------------
  ----------------------------------------------------------------------------------------------------------------------------------
  ----------------------------------------------------------------------------------------------------------------------------------

  Standard straight up request with no handling for containers or wot not

  returns the res directly to the callback

 */

Container.request = function(req, callback){
  
  req.path(this.route() + req.path());

  this.handle(req, callback);
  
  return this;
} 

/*

  SELECTOR

  ----------------------------------------------------------------------------------------------------------------------------------
  ----------------------------------------------------------------------------------------------------------------------------------
  ----------------------------------------------------------------------------------------------------------------------------------

  Turn the selectors into a JSON header

  Prepare a transaction with our skeleton as input

 */

Container.select = function(){
  var self = this;

  var selector_req = new Request({
    method:'get'
  })

  var selectors = _.map(_.toArray(arguments), function(arg){
    return _.isString(arg) ? parseSelector(arg) : arg;
  }).reverse();

  selector_req.selectors(selectors);

  // a selector routes 'into' containers
  selector_req.routermode('post');

  var transaction = new Transaction({
    container:this,

    /*
    
      the query factory - if we are hooked up to a stack
      then we post to the reception

      otherwise we route to the top ('/')
      
    */

    query_factory:function(){
      var ret = self.query_factory(selector_req);

      /*

        Here we bake the routes into the skeleton

        This means the skeleton contains the base data plus the route for this query

       */
      ret.skeleton(self.skeleton());

      return ret;
    },

    /*

      This function is called with the raw
      results from the selector

      We create containers and pass as the final results


     */

    filter:function(results){
      return self.results(results);
    }
  })

  return transaction;
}


/*

  APPEND

  ----------------------------------------------------------------------------------------------------------------------------------
  ----------------------------------------------------------------------------------------------------------------------------------
  ----------------------------------------------------------------------------------------------------------------------------------


   add the children onto the children of each model
   if a callback is given it means we want it to happen to the database too

 */



Container.append = function(append_containers){

  var self = this;

  /*

    You can pass an array of top-level containers

    We extract the model data from them all and merge them
    into one array of models to append to this container

   */
  if(!_.isArray(append_containers)){
    append_containers = [append_containers];
  }

  var children_models = [];

  _.each(append_containers, function(append_container){
    children_models = children_models.concat(append_container.basemodels());
  })

  _.each(children_models, function(children_model){
    children_model.resetid(true);
  })

  /*

    Keep a map of what was added to what

    Then we can study the errors back and decide
    what to undo

   */
  var rollbacks = {};

  /*

    This is the initial insertion of the containers client side

    The transaction is able to rollback upon return


   */

  this.models.each(function(parent_model){
    var appended_models = _.map(children_models, function(child_model){
      return new child_model.constructor(child_model.toJSON());
    })

    parent_model.append(appended_models);

    rollbacks[parent_model.quarryid()] = function(){
      parent_model.remove(appended_models);
    }
  })

  var model_ids = this.models.map(function(parent_model){
    return parent_model.quarryid();
  })

  var append_req = new Request({
    method:'post'
  })

  append_req.body(_.map(children_models, function(children_model){
    return children_model.toJSON();
  }))

  // a selector routes 'into' containers
  append_req.routermode('post');

  var committed_models = [];

  var transaction = new Transaction({
    container:this,

    /*
    
      the query factory - if we are hooked up to a stack
      then we post to the reception

      otherwise we route to the top ('/')
      
    */

    query_factory:function(){
      var ret = self.query_factory(append_req);

      /*

        Here we bake the routes into the skeleton

        This means the skeleton contains the base data plus the route for this query

       */
      ret.skeleton(self.skeleton());

      return ret;
    },

    filter:function(){
      return self.spawn(committed_models);
    }

  })

  transaction.on('commit', function(container, res){

    var message = res.body();
    var children = container.children();
    committed_models = committed_models.concat(children.basemodels());
    var original_ids = message.original_ids;
    _.each(message.data, function(resultdata, data_index){
      var original_id = original_ids[data_index];
      var child_model = children.models.get(original_id);
      if(!child_model){
        throw new Error('transaction commit model not found: ' + original_id)
      }
      child_model.set(resultdata);
      child_model.initialize();
    })
  })

  transaction.on('rollback', function(container, res){
    var rollback = rollbacks[container.quarryid()];

    if(!rollback){
      throw new Error('no rollback for: ' + container.quarryid());
    }

    rollback();
  })

  return transaction;

}

/*

  SAVE

  ----------------------------------------------------------------------------------------------------------------------------------
  ----------------------------------------------------------------------------------------------------------------------------------
  ----------------------------------------------------------------------------------------------------------------------------------


   send the changed attributes as a PUT request

   --- this does not do the children (yet)

 */



Container.save = function(){

  var self = this;

  /*

    Undo to the previousAttributes upon a rollback

   */
  var rollbacks = {};

  /*

    This is the initial insertion of the containers client side

    The transaction is able to rollback upon return


   */
  this.models.each(function(model){
    rollbacks[model.quarryid()] = function(){
      model.restorePrevious();
    }
  })

  var save_req = new Request({
    method:'put'
  })

  save_req.contentType('quarry/skeleton');
  save_req.routermode('put');

  save_req.body(this.skeleton({
    data:true
  }))

  var transaction = new Transaction({
    container:this,

    /*
    
      the query factory - if we are hooked up to a stack
      then we post to the reception

      otherwise we route to the top ('/')
      
    */

    query_factory:function(){

      var ret = self.query_factory(save_req);

      return ret;
    },

    filter:function(results){
      return results;
    }

  })

  return transaction;

}

/*

  delete

  ----------------------------------------------------------------------------------------------------------------------------------
  ----------------------------------------------------------------------------------------------------------------------------------
  ----------------------------------------------------------------------------------------------------------------------------------


   

 */



Container.delete = function(){

  var self = this;

  /*

    Keep a map of what was added to what

    Then we can study the errors back and decide
    what to undo

   */
  var rollbacks = {};

  /*

    This is the initial insertion of the containers client side

    The transaction is able to rollback upon return


   */

  this.models.each(function(model){

    var parent_model = model.parent;

    if(!parent_model){
      rollbacks[model.quarryid()] = function(){
      }
      return;
    }

    parent_model.remove([model]);

    rollbacks[model.quarryid()] = function(){
      parent_model.append([model]);  
    }
  })

  var model_ids = this.models.map(function(model){
    return model.quarryid();
  })

  var delete_req = new Request({
    method:'delete'
  })

  // a selector routes 'into' containers
  delete_req.routermode('delete');

  var committed_models = [];

  var transaction = new Transaction({
    container:this,

    /*
    
      the query factory - if we are hooked up to a stack
      then we post to the reception

      otherwise we route to the top ('/')
      
    */

    query_factory:function(){
      var ret = self.query_factory(delete_req);

      /*

        Here we bake the routes into the skeleton

        This means the skeleton contains the base data plus the route for this query

       */
      ret.skeleton(self.skeleton());

      return ret;
    },

    filter:function(results){
      return results;
    }

  })

  transaction.on('rollback', function(container, res){
    var rollback = rollbacks[container.quarryid()];

    if(!rollback){
      throw new Error('no rollback for: ' + container.quarryid());
    }

    rollback();
  })

  return transaction;

}