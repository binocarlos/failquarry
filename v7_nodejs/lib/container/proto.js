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
var EventEmitter = require('events').EventEmitter;
var deepdot = require('./deepdot');
var async = require('async');
var inspectselect = require('./inspectselect');
var find = require('./find');
var search = require('./search');
var XML = require('./xml');
var utils = require('../utils');
var Contract = require('../contract');
var PortalWrapper = require('../portal/wrapper');
var Router = require('./router');
var eyes = require('eyes');

var Container = module.exports = function(){}

/*

  wrap up our selector resolver with the basic search function
  
*/
var finder = find(search.searcher);

/*

  quarry.io - container

  the main dude with data in innit


 */


/*




  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Factory
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------








 */

Container._ = _;
Container.factory = factory;
Container.new = factory;

Container.bigid = utils.quarryid;
Container.littleid = utils.littleid;

Container.request = Contract.request;
Container.response = Contract.response;

Container.fromskeleton = function(skeleton){
  var containerdata = [];

  if(skeleton){
    if(!_.isArray(skeleton)){
      skeleton = [skeleton];
    }

    containerdata = _.map(skeleton, function(data){
      return {
        meta:data
      }
    })
  }

  return factory(containerdata);
}

/*

  used to build containers that have a supplychain hooked up
  to somewhere on the backend
  
*/
Container.connect = function(supplychain, stackpath){

  var route = Router.url(stackpath);

  var container = Container.new('supplychain', {
    name:'Supply Chain: ' + route.department + ':' + route.url
  }).meta({
    tagname:'supplychain',
    supplychainroot:true,
    quarrydepartment:route.department,
    quarrysupplier:route.url
  })

  container.supplychain = supplychain;

  container.connect = function(path){
    return Container.connect(supplychain, path);
  }
  
  return container;
}

function extractdata(data, attr){

  var ensureids = false;

  if(_.isString(data)){
    // we assume XML
    if(data.match(/^\s*\</)){
      data = XML.parse(data);
      //data = [];
      ensureids = true;
    }
    // or JSON string
    else if(data.match(/^\s*[\[\{]/)){
      data = JSON.parse(data);
    }
    // we could do YAML here
    else{
      data = [{
        meta:{
          tagname:data
        },
        attr:attr || {}
      }]
      ensureids = true;
    }
  }
  else if(!_.isArray(data)){
    if(!data){
      data = {};
    }
    data = [data];
  }

  return {
    arr:data,
    ensureids:ensureids
  }
}

function factory(data, attr){
  
  data = extractdata(data, attr);

  var arr = data.arr;
  var ensureids = data.ensureids;

  function quarrycontainer(){
    return quarrycontainer.selector.apply(quarrycontainer, arguments);
  }

  _.extend(quarrycontainer, Container.prototype);
  _.extend(quarrycontainer, EventEmitter.prototype);
  _.extend(quarrycontainer, {
    create:factory,
    littleid:utils.littleid
  })

  quarrycontainer.initialize(arr);

  if(ensureids){
    quarrycontainer.ensure_ids();
  }

  return quarrycontainer;
}

/*

  these are used to get a warehouse environment set up inside a browser
  
*/
Container.prototype.bootstrapbrowser = require('./browser')(Container);

/*

  this outputs the html for the browser - you give it the warehouse config
  and a string that is the compiled container API

  TODO - the compilation should be done at app level - at the moment
  it is being done by the warehouse middleware
  
*/
Container.browserhtml = function(compileconfig, corecode){
  var code = 'this.$quarryconfig = ' + JSON.stringify(compileconfig) + ";\n\n";
  code += corecode;
  code += [
    "(function(window){",
    "   var Proto = require('/lib/container/proto');",
    "   window.$quarry = Proto.prototype.bootstrapbrowser(window.$quarryconfig);",
    "   window._ = Proto._;",
    "})(this)"
  ].join("\n");

  return code;
}

/*




  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Core
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------








 */


Container.prototype.initialize = function(data){
  var self = this;

  /*
  
    you can spawn a container that will be completed by a future action

    the promise is setup by the parent and when 'run' is run it will execute
    and clear the _promise
    
  */
  this._promise = null;
  this.models = _.map(data || [], function(model){
    model.meta || (model.meta = {
      classnames:[]
    })
    model.data || (model.data = {});
    model.children || (model.children = []);
    
    model.meta.quarryid || (model.meta.quarryid = utils.quarryid());

    return model;
  })

  /*
  
    supplychain we use to fulfill contracts

    invariably - this is connected back to a warehouse or reception somewhere
    
  */
  this.supplychain = null;  
  this.Proto = Container;

  return this;
}

/*

  make a copy with new ids (deep)
  
*/
Container.prototype.clone = function(new_ids){
  var ret = this.spawn(JSON.parse(JSON.stringify(this.toJSON())));

  if(new_ids){
    ret.recurse(function(container){
      container.replaceproperty('meta', {
        quarryid:utils.quarryid(),
        tagname:container.tagname(),
        classnames:container.classnames(),
        id:container.id()
      })
      delete(container.models[0]._id);
      delete(container.models[0].data);
    })    
  }
  
  return ret;
}

/*

  return a new container with the given data

  the container is hooked up to the same supply chains as the spawner
  
*/
Container.prototype.spawn = function(models){
  var self = this;
  if(arguments.length<=0 || models==null){
    models = []
  }
  else if(!_.isArray(models)){
    models = [models];
  }

  models = _.map(models, function(model){
    if(!model.meta){
      model = {
        meta:{},
        attr:{
          data:model
        },
        children:[]
      }
    }
    if(!model.meta.quarrysupplier){
      model.meta.quarrysupplier = self.quarrysupplier();
    }

    return model;
  })

  var ret = factory(models);
  ret.supplychain = this.supplychain;

  return ret;
}

Container.prototype.blank = function(){
  return this.spawn([]);
}

/*

  generate a fresh container based on this ones fields
  
*/
Container.prototype.blueprint = function(potential_parent){

  var ret = this.spawn(JSON.parse(JSON.stringify(this.toJSON())));

  ret.quarryid(utils.quarryid());
  ret.meta('quarrysupplier', potential_parent.quarrysupplier());
  ret.meta('quarrydepartment', potential_parent.quarrydepartment());

  ret.attr('name', '');

  return ret;
}

/*

  returns the list of fields that have been added to this containers core attributes


  
*/
Container.prototype.fieldlist = function(without_name){
  var fields = this.meta('fieldlist') || [];
  var foundfields = {};
  _.each(fields, function(field){
    foundfields[field.property] = true;
  })

  if(!foundfields['attr.name'] && !without_name){
    fields.unshift({
      title:'Name',
      property:'attr.name',
      type:'text'
    })
    foundfields['attr.name'] = true;
  }

  return fields;
}

/*

  return the first containers meta data
  
*/
Container.prototype.skeleton = function(){

  return this.models.length>0 ? this.models[0].meta : {};
  
}

/*

  ensure a quarryid for each container (deep)
  
*/
Container.prototype.ensure_ids = function(){
  this.recurse(function(container){
    _.each(container.models, function(model){
      model.meta || (model.meta = {});
      !model.meta.quarryid ? (model.meta.quarryid = utils.quarryid()) : null;
    })
  })
  return this;
}

/*

  return a copy of the models - for network transmission mostly
  
*/
Container.prototype.toJSON = function(){
  return JSON.parse(JSON.stringify(this.models));
}


/*

  string summary
  
*/
Container.prototype.summary = function(options){

  options || (options = {});

  var parts = [];

  var title = (this.attr('name') || this.attr('title') || '')
  if(title.length>0 && options.title!=false){
    parts.push(title + ': ');
  }

  parts.push(this.tagname());

  var id = this.id() || '';
  if(id.length>0){
    parts.push('#' + id);
  }

  var classnames = this.classnames() || [];
  if(classnames.length>0){
    parts = parts.concat(_.map(classnames, function(classname){
      return '.' + classname
    }))
  }



  return parts.join('');
}

Container.prototype.look = function(){
  console.log(this.peek());
}

Container.prototype.peek = function(depth){
  if(this.count()<=0){
    return 'no data to look at';
  }

  depth || (depth = 0);
  var st = '';
  function single(c){
    var indent = '';
    for(var i=0; i<=depth; i++){
      indent += '--';
    }
    st +=indent + c.summary() + "\n";
    c.children().each(function(child){
      st += child.peek(depth+1);
    })
  }
  this.each(single);
  return st;
}

/*




  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Properties Accessors
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */

/*

  generic wrapper function to handle our array of models via a single function

  
*/

function valuereader(model, name){
  return deepdot(model, name);
}
function valuesetter(models, name, value, silent){
  _.each(models, function(model){
    deepdot(model, name, value);
  })
}

function wrapper(key, options){

  options || (options = {});

  if(_.isString(options)){
    options = {
      leaf:options
    }
  }

  var leaf = options.leaf;
  var fullkey = leaf ? key + '.' + leaf : key;

  fullkey = fullkey.replace(/^\./, '');

  return function(){
    var self = this;

    /*
    
      READ
      -----
      wholesale getter of the object
      
    */
    if(arguments.length<=0){
      return valuereader(this.models[0], fullkey);
    }
    /*
    
      READ
      -----
      we are reading a first model value

    */
    else if(arguments.length==1 && _.isString(arguments[0]) && !leaf){
      return valuereader(this.models[0], [key, arguments[0]].join('.'));
    }
    /*
    
      WRITE
      -----
      we are setting an object
      
    */
    else if(arguments.length==1){
      var name = fullkey;
      valuesetter(this.models, fullkey, arguments[0], this._silent);
      return self;
    }
    /*
    
      WRITE
      -----
      we are setting a string value
      
    */
    else if(arguments.length>1){
      valuesetter(this.models, [fullkey, arguments[0]].join('.'), arguments[1], this._silent);
      return self;
    }
  }
  
}

function remove_wrapper(topprop){
  return function(prop){
    var self = this;
    if(arguments.length<=0){
      return this;
    }
    if(!_.isArray(prop)){
      prop = [prop];
    }
    _.each(prop, function(p){
      self[topprop](p, null);
    })
    return this;
  }
}
var attrwrapper = wrapper('attr');

/*

  a direct property injector that bypasses changed

  only works at the top level
  
*/
Container.prototype.replaceproperty = function(prop, val){
  _.each(this.models, function(model){
    model[prop] = val;
  })
  return this;
}

Container.prototype.full = function(){
  return !this.empty();
}

Container.prototype.empty = function(){
  return this.count()==0;
}

Container.prototype.attr = wrapper('attr');
Container.prototype.removeAttr = remove_wrapper('attr');

Container.prototype.get_value = function(field){
  var model = this.get(0);
  if(!model){
    return null;
  }

  return deepdot(model, field);
}

Container.prototype.set_value = function(field, value){
  var model = this.get(0);
  if(!model){
    return null;
  }

  deepdot(model, field, value);

  return this;
}

Container.prototype.meta = wrapper('meta');
Container.prototype.removeMeta = remove_wrapper('meta');

Container.prototype.data = wrapper('data');
Container.prototype.removeData = remove_wrapper('data');

Container.prototype.quarryid = wrapper('meta', 'quarryid');
Container.prototype.quarryportal = wrapper('meta', 'quarryportal');
Container.prototype.quarrysupplier = wrapper('meta', 'quarrysupplier');
Container.prototype.quarrydepartment = wrapper('meta', 'quarrydepartment');
Container.prototype.id = wrapper('meta', 'id');
Container.prototype.tagname = wrapper('meta', 'tagname');
Container.prototype.classnames = wrapper('meta', 'classnames');

Container.prototype.reset = function(field){
  this.attr(field, '');
  return this;
}

Container.prototype.icon = function(val){
  if(val){
    this.meta('icon', val);
    return this;
  }

  var ret = this.meta('icon') || 'default/container.png';
  if(!ret.match(/^\//)){
    ret = '/icons/' + ret;
  }
  return ret;
}

Container.prototype.title = function(){
  if(this.attr('name')){
    return this.attr('name');
  }
  else if(this.attr('title')){
    return this.attr('title');
  }
  else{
    return this.tagname();
  }
}

Container.prototype.events = wrapper('meta', 'events');

Container.prototype.addClass = function(classname){
  var self = this;
  _.each(this.models, function(model){
    var classnames = _.unique((deepdot(model, 'meta.classnames') || []).concat(classname));
    deepdot(model, 'meta.classnames', classnames);
  })
  return this;
}

Container.prototype.removeClass = function(classname){
  var self = this;
  _.each(this.models, function(model){
    var classnames = _.without((deepdot(model, 'meta.classnames') || []), classname);
    deepdot(model, 'meta.classnames', classnames);
  })
  return this;
}

Container.prototype.hasClass = function(classname){
   return _.contains((this.classnames() || []), classname);
}

Container.prototype.hasAttr = function(name){
  return !_.isEmpty(this.attr(name));
}

Container.prototype.clean = function(){
  return this;
}


/*




  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Model Array Iterators
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------








 */

/*

  model by index
  
*/
Container.prototype.get = function(index){
  return this.models[index];
}

/*

  container at index
  
*/
Container.prototype.eq = function(index){
  return this.spawn(this.get(index));
}

Container.prototype.first = function(index){
  return this.spawn(this.get(0));
}

Container.prototype.last = function(index){
  return this.spawn(this.get(this.count()-1));
}

Container.prototype.range = function(from, to){
  return this.spawn(this.models.slice(from, to));
}

/*

  get model by quarryid
  
*/
Container.prototype.byid = function(id){
  return _.find(this.models, function(model){
    return deepdot(model, 'meta.quarryid')==id;
  })
}

/*

  inject data into the existing container
  
*/
Container.prototype.inject = function(replacement){

  var selfmap = this.containermap(true);
  var replacemap = replacement.containermap(true);

  _.each(replacemap, function(replacecontainer, id){
    var selfcontainer = selfmap[id];

    var selfmodel = selfcontainer.get(0);
    var replacemodel = replacecontainer.get(0);

    var injectdata = _.clone(replacemodel);
    delete(replacemodel.children);
    utils.extend(selfmodel, replacemodel);
  })

  return this;
}


/*

  add the models from the given container into this model array
  
*/
Container.prototype.add = function(container, clear_first){
  var self = this;
  if(clear_first){
    this.models = [];
  }
  this.models = this.models.concat(container.models);
  return this;
}

/*

  the reverse of add i.e. we add these models to that
  
*/
Container.prototype.pourInto = function(target, clear_first){
  target.add(this, clear_first);
  return this;
}

/*

  how many models we have
  
*/
Container.prototype.count = function(){
  return this.models.length;
}





/*

  iterate fn over each container
  
  async mode indicates we want to not hurt node and want to be told when finished
*/
Container.prototype.each = function(fn, asyncfn){
  if(asyncfn){
    async.forEachSeries(this.containers(), function(container, next){
      fn(container);
      next()
    }, function(){
      asyncfn();
    })
  }
  else{
    _.each(this.containers(), fn);
  }
  
  return this;
}

/*

  iterate fn over each container
  
*/
Container.prototype.map = function(fn){
  return _.map(this.containers(), fn);
}

/*

  turn each model into it's own container (via spawn)
  and return the whole array
  
*/
Container.prototype.containers = function(){
  var self = this;
  return _.map(this.models, function(model){
    var ret = self.spawn(model);
    ret.parent = self.parent;
    return ret;
  })
}

/*

  return a map of this.containers() by their quarryid
  
*/
Container.prototype.containermap = function(deep){
  var map = {};
  if(deep){
    this.recurse(function(container){
      map[container.quarryid()] = container;
    })
  }
  else{
    this.each(function(container){
      map[container.quarryid()] = container;
    })  
  }
  
  return map;
}



/*




  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Tree
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------








 */

/*

  return container with the concatted contents of models.children
  
*/
Container.prototype.children = function(){
  var self = this;
  var all_models = [];
  _.each(this.models, function(model){

    var router = Router(model.meta);

    /*
    
      ensure that the children have the same route as us
      (unless they already have one of their own)
      
    */
    var children = _.map(model.children || [], function(childmodel){
      childmodel.quarrysupplier = model.meta.quarrysupplier;
      return childmodel;
    })
    all_models = all_models.concat(children);
  })
  var ret = this.spawn(all_models);
  ret.parent = this;
  return ret;
}

/*

  remove the models inside of the given container
  from our own child array
  
*/
Container.prototype.removechildren = function(removed){
  var self = this;
  var map = removed.containermap();
  _.each(this.models, function(model){
    model.children = _.filter(model.children, function(child_model){
      return map[child_model.meta.quarryid]==null;
    })
  })
  return this;
}


Container.prototype.addchildren = function(children){

  this.get(0).children = this.get(0).children.concat(children.models);

  return this;
}


Container.prototype.remove = function(removed){
  var self = this;
  var map = removed.containermap();
  this.models = _.filter(this.models, function(model){
    return map[model.meta.quarryid]==null;
  })
  return this;
}

/*

  recurse over children and self
  
*/
Container.prototype.recurse = function(fn, asyncfn){

  this.descendents().each(fn, asyncfn);
  
  return this;
}

/*

  return a flat array of all descendent containers
  
*/
Container.prototype.descendents = function(){
  var all_models = [];
  function find_model(model){
    all_models.push(model);
    _.each(model.children, find_model);
  }

  _.each(this.models, find_model);

  return this.spawn(all_models);
}

Container.prototype.mapdescendents = function(fn){

  return this.spawn(this.map(function(container){
    var newmodel = fn(container.clone()).get(0);

    newmodel.children = container.children().map(function(child){
      var newchild = child.mapdescendents(fn);

      return newchild;
    })

    return newmodel;
  }))
  
}


/*




  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Spawning & Promises
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------








 */


/*

  sync search through local container data matching selectors
  
*/
Container.prototype.find = function(){
  var selector_strings = _.toArray(arguments);
  var selectors = _.map(selector_strings, inspectselect);

  return finder(selectors, this);
}

var sortfns = {
  title:function(a, b){
    if ( a.title().toLowerCase() < b.title().toLowerCase() )
      return -1;
    if ( a.title().toLowerCase() > b.title().toLowerCase() )
      return 1;
    return 0;
  }
}
/*

  sync search through local container data matching selectors
  
*/
Container.prototype.sort = function(fn){
  if(!fn){
    fn = sortfns.title;
  }

  this.each(function(container){
    var newchildren = container.children().containers().sort(fn);
    var model = container.get(0);
    model.children = _.map(newchildren, function(container){
      return container.get(0);
    })
  })

  return this;
}

/*

  run the filter function over each container individually
  and return a container with the ones that passed (by return true classic filter style)
  
*/
Container.prototype.filter = function(filterfn){

  /*
  
    turn anything other than a function into the filter function

    the compiler looks after turning strings into selector objects
    
  */
  if(!_.isFunction(filterfn)){
    filterfn = search.compiler(filterfn);
  }

  var matching_container_array = _.filter(this.containers(), filterfn);

  var matching_models = [];
  _.each(matching_container_array, function(matching_container){
    matching_models = matching_models.concat(matching_container.models);
  })

  return this.spawn(matching_models);
}

/*

  clones the current models and passes each copy into the map function
  the container that is returned is then merged into an overall model
  array for returning

  this is useful for turning one bunch of containers into another
  bunch but only changing a couple of things
  
*/
Container.prototype.map = function(mapfn){

  return this.spawn(_.map(this.containers(), function(container){
    var mapped = mapfn(container);

    return mapped.models ? mapped.models[0] : mapped;
  }))

}

/*

  runs a single selector against this container to see if we have a match
  for ourselves - we always pluck the first model
  
*/
Container.prototype.match = function(selector){

  if(this.count()<=0){
    return false;
  }

  var results = this.filter(selector);

  return results.count()>0;
}


 /*

  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Async flow control
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */

/*

  what methods do we inject from async into a container to allow client side flow control
  
*/
_.each(['series', 'parallel', 'waterfall'], function(method_name){
  Container.prototype[method_name] = async[method_name];
})




/*

  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Network Interface
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */

 /*

  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Routes and Portals
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */

/*

  return a portal that is hooked up to the supplychain switchboard client

  (however it wants to look after the transport)
  
*/
Container.prototype.portal = function(fn){

  var portal = PortalWrapper.portal(this);

  fn && portal.sync(true, fn);

  return portal;

}

Container.prototype.radio = function(){

  return PortalWrapper.radio(this);

}


Container.prototype.get_switchboard = function(){
  if(!this.supplychain){
    return null;
  }
  return this.supplychain.switchboard || (this.supplychain.switchboardfactory ? this.supplychain.switchboardfactory() : null);
}

Container.prototype.router = function(){
  return Router(this.skeleton());
}

 
 /*

  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  API
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */


/*

  make a new contract that has the same supply chain handle
  as the container
  
*/
Container.prototype.contractfactory = function(){
  var contract = Contract.factory();
  contract.supplychain = this.supplychain;
  contract.container = this;
  return contract;
}

/*

  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  API - raw requests posted to each container

  the request that is sent is not assumed (unlike select, append etc)
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */

Container.prototype.api = function(query){

  query.headers || (query.headers = {});

  var self = this;

  var contract = this.contractfactory();

  /*
  
    it's a merge contract - all the results back into a slurp
    
  */
  contract.setType('merge');

  this.each(function(container){

    /*
    
      now create the append request for the merge contract
      
    */

    var raw = _.clone(query);
    
    raw.url = container.router().rpc();

    if(query.url && query.url!='/'){
      raw.url += query.url;
    }

    raw.url = raw.url.replace(/\/\//g, '/');

    var req = Contract.request(raw);

    if(!req.getHeader('content-type')){
      req.setHeader('content-type', 'quarry/request');
    }

    contract.add(req);
  })

  return contract;
}

/*

  directly load a single container from it's stack path string

  /database/db1d/32434
  
*/
Container.prototype.load = function(stackpath, callback){

  var self = this;

  var contract = this.contractfactory();

  /*
  
    it's a merge contract - all the results back into a slurp
    
  */
  contract.setType('merge');

  var req = Container.request({
    method:'get'
  })

  req.parseurl(stackpath);

  req.setHeader('content-type', 'quarry/request');

  contract.add(req);

  contract.map_response = function(res){
    return self.spawn(res.body);
  }

  return contract;
}

/*

  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Selector
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */

Container.prototype.selector = function(){
  
  var args = _.toArray(arguments);

  /*
  
    this allows direct REST API calls via the container function:

    container({
      method:'post',
      url:'/123'
    }).ship(etc)
    
  */
  if(!_.isString(args[0]) && _.isObject(args[0])){
    return this.api(args[0]);
  }
  /*
  
    this is a slash path which translate onto a get request
    with that as the url

    container('/file/a/b/c').ship()

    ---->

    container({
      method:'get',
      url:'/file/a/b/c'
    })
    
  */
  else if(_.isString(args[0]) && args[0].match(/^\//)){
    return this.api({
      method:'get',
      url:args[0]
    })
  }

  var selector_summary = args.reverse().join(" -> ");
  var json_selectors = _.map(args, function(selectorstring){
    return inspectselect(selectorstring);
  })

  var self = this;

  var contract = this.contractfactory();

  /*
  
    it's a merge contract - all the results back into a slurp
    
  */
  contract.setType('merge');

  /*
  
    we map multiparts and take their containers
    
  */
  contract.expect('containers');

  this.each(function(container){

    /*
    
      now create the append request for the merge contract
      
    */

    var req = Contract.request({
      method:'get',
      url:container.router().rpc()
    })

    req.setHeader('content-type', 'quarry/request');
    req.setHeader('x-quarry-department', container.quarrydepartment() || 'warehouse');

    req.setHeader('x-json-skeleton', [container.meta()])
    req.setHeader('x-selector-summary', selector_summary);
    req.setHeader('x-json-selectors', json_selectors);

    contract.add(req);
  })

  return contract;
}

/*

  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Append
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */

// ensure ids on appended models
function childmodelmap(childmodel){
  var ret = JSON.parse(JSON.stringify(childmodel));
  ret.meta.quarryid = utils.quarryid();
  return ret;
}

Container.prototype.append = function(childcontainers){

  var self = this;

  var appendto = this.eq(0);

  var ids = appendto.containermap(true);

  childcontainers = childcontainers.filter(function(container){
    return !ids[container.quarryid()];
  })

  var addedcontainers = {};

  var contract = this.contractfactory();
  contract.setType('merge');
  contract.expect('containers');

  var req = Contract.request({
    method:'post',
    url:appendto.router().rpc()    
  })

  if(childcontainers.empty()){
    return contract;
  }

  var appenddata = [];

  req.setHeader('content-type', 'quarry/containers');
  req.setHeader('x-quarry-department', appendto.quarrydepartment() || 'warehouse');

  /*
  
    it's a merge contract - they can all append at the same time
    
  */
  
  function addchildcontainer(child){
    child.supplychain = appendto.supplychain;

    child.recurse(function(descendent){
      delete(descendent.get(0).data);
      delete(descendent.get(0).meta.quarrysupplier);
      addedcontainers[descendent.quarryid()] = descendent;
    })

    appendto.models[0].children || (appendto.models[0].children = []);
    appendto.models[0].children = appendto.models[0].children.concat(child.models);

    appenddata = appenddata.concat(child.toJSON());
  }

  if(!_.isArray(childcontainers)){
    childcontainers = [childcontainers];
  }

  _.each(childcontainers, function(childcontainer){
    addchildcontainer(childcontainer);
  })

  req.body = appenddata;
  contract.add(req);

  contract.on('ship', function(mainres){

    if(mainres.hasError()){
      return;
    }

    var resultscontainers = self.spawn(mainres.body);
    resultscontainers.recurse(function(resultscontainer){
      var realcontainer = addedcontainers[resultscontainer.quarryid()];

      if(realcontainer){
        realcontainer.inject(resultscontainer);
      }
    })
  })

  return contract;
}
  
 /*

  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Save
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */

Container.prototype.save = function(){

  var self = this;

  var contract = this.contractfactory();

  /*
  
    it's a merge contract - they can all append at the same time
    
  */
  contract.setType('merge');

  /*
    
    now construct the contract representing what to add to each container
    
  */
  this.each(function(savecontainer){

    /*
    
      now create the append request for the merge contract
      
    */
    var req = Contract.request({
      method:'put',
      url:savecontainer.router().rpc(),
      body:savecontainer.models[0]
    })
    req.setHeader('x-quarry-department', savecontainer.quarrydepartment() || 'warehouse');
    req.setHeader('content-type', 'quarry/request');
    contract.add(req);

    
  })

  return contract;
}

 /*

  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Delete
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */

Container.prototype.delete = function(){

  var self = this;

  var contract = this.contractfactory();

  /*
  
    it's a merge contract - they can all append at the same time
    
  */
  contract.setType('merge');


  /*
    
    now construct the contract representing what to add to each container
    
  */
  this.each(function(deletecontainer){
    
    /*
    
      now create the append request for the merge contract
      
    */

    var req = Contract.request({
      method:'delete',
      url:deletecontainer.router().rpc()
    })
    req.setHeader('x-quarry-department', deletecontainer.quarrydepartment() || 'warehouse');
    req.setHeader('content-type', 'quarry/request');
    contract.add(req);
  })

  contract.on('complete', function(mainres){
    self.models = [];
  })

  this.emit('delete');
  this.models = [];

  return contract;
}

 /*

  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Events
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */

Container.prototype.addEvent = function(name, config){
  var events = this.events() || {};
  if(!events[name]){
    events[name] = [];
  }
  events[name].push(config);
  this.events(events);
  return this;
}

 /*

  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Branching
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */
Container.prototype.ghost = function(){
  var ghost = Container.new(this.tagname(), this.attr());
  ghost.id(this.id());
  ghost.meta('classnames', this.meta('classnames'));
  ghost.addEvent('select', {
    type:'branch',
    data:{
      id:this.quarryid(),
      supplier:this.quarrysupplier(),
      department:this.quarrydepartment(),
      url:this.router().rpc()
    }
  })
  return ghost;
}

 /*

  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  Contract Chaining
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------
  --------------------------------------------------------------------------------


 */

Container.prototype.merge = function(contracts){
  var contract = this.contractfactory();

  /*
  
    it's a merge contract - they can all append at the same time
    
  */
  contract.setType('merge');
  _.each(contracts, function(req){
    contract.add(req);
  })

  return contract;
}

Container.prototype.sequence = function(contracts){
  var contract = this.contractfactory();

  var results = [];
  
  return {
    ship:function(done){
      async.forEachSeries(contracts, function(contract, next){
        contract.ship(function(res){
          results.push(res);
          next();
        })
      }, function(error){
        done && done(results);
      })
    }
  }
}