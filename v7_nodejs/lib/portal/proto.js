/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */


/**
 * Module dependencies.
 */

var util = require('util');
var utils = require('../utils');
var EventEmitter = require('events').EventEmitter;
var inspectselect = require('../container/inspectselect');
var Router = require('../container/router');
var eyes = require('eyes');
var _ = require('lodash');
var Message = require('./message');
var Radio = require('./radio');

module.exports = Portal;

/*

  quarry.io - portal

  a wrapper representing events broadcast and subsrcibed for
  a container within a stack

  it manages the subscription keys via the routes property of the
  container's meta data

  supplier.portal.method

  
*/

function Portal(){
  EventEmitter.call(this);

  /*
  
    a register a portal routes against callbacks
    
  */
  this.stack = {};
  this.donemessages = {};
  this.depthmode = false;
}

util.inherits(Portal, EventEmitter);

/*

  attach this portal onto a switchboard client
  
*/
Portal.prototype.attachcontainer = function(container){

  this.container = container;
  this.spawn = _.bind(container.spawn, container);
  this.switchboard = container.get_switchboard();
  this.router = Router(container.skeleton());
}

/*

  attach a skeleton and a switchboard client
  
*/
Portal.prototype.attach = function(skeleton, switchboard){
  this.skeleton = skeleton;
  switchboard && (this.switchboard = switchboard);
  this.router = Router(this.skeleton);
}

function processselector(selectorstring, handler){
  var deepmode = false;
  var selector = null;
  if(selectorstring){
    var deepmode = true;
    if(selectorstring.indexOf('>')==0){
      selectorstring = selectorstring.substr(1);
      deepmode = false;
    }
    if(selectorstring.indexOf('.')==0){
      selector = {
        classname:selectorstring.substr(1)
      }
    }
    else{
      selector = {
        tagname:selectorstring
      }
    }
  }
    
  /*
  
    check we have a way of making containers without referencing the container back (circular deps)
    
  */
  var orighandler = handler;
  handler = function(message){
    orighandler(message, selector);
  }

  handler.deepmode = deepmode;

  return handler;
}

function matchselector(target, selector){
  if(!selector){
    return true;
  }
  else if(selector.tagname==target.tagname()){
    return true;
  }
  else if(selector.classname && target.hasClass(selector.classname)){
    return true;
  }
  else{
    return false;
  }
}

function targetportal(httpmethod){

  return function(selector, fn){
    var self = this;

    if(!fn){
      fn = selector;
      selector = null;
    }

    if(!this.spawn){
      throw new Error('saved cannot run added without a spawn function');
    }

    var handler = processselector(selector, function(message, selector){
      
      var target = message.get_target();

      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.log('TARGET PORTAL');
      eyes.inspect(target.toJSON());

      if(matchselector(target, selector)){
        fn(message.body, target);
      }

    })

    this._register(httpmethod, handler);
  }
}


function containerportal(httpmethod){

  return function(selector, fn){

    var self = this;

    if(!fn){
      fn = selector;
      selector = null;
    }

    if(!this.spawn){
      throw new Error('appended cannot run added without a spawn function');
    }

    var handler = processselector(selector, function(message, selector){
      
      var containers = message.get_containers();
      var target = message.get_target();

      if(!selector){
        fn(containers);
        return;
      }
      else{
        
        var test = handler.deepmode ? containers.descendents() : containers;
        var results = test.filter(function(container){
          return matchselector(container, selector);
        })
        results.count()>0 && fn(results, target);

      }
    })

    this._register(httpmethod, handler);

    return this;
  }
}

Portal.prototype.appended = containerportal('post');

Portal.prototype.saved = containerportal('put');

Portal.prototype.deleted = targetportal('delete');

var syncmethods = {
  post:function(container, message){
    

    var messagetarget = message.get_target();
    var messagecontainers = message.get_containers();

    /*
    
      in deep mode we look through the loaded data
      and match and appends to the ones we have loaded
      
    */
    if(message.deepmode){

      /*
      
        get a reference to the target within the container
        
      */
      var containertarget = container.find('=' + messagetarget.quarryid());


      if(containertarget.empty()){


        /*
        
          this is the hack for the fact supplychain warehouses do not have a registered id

          this should change in v2 (wow just I just say v2???!!!???)
          
        */
        if(messagetarget.tagname()=='supplychain' && container.tagname()=='supplychain'){

          /*
          
            the target is now to top level warehouse
            
          */
          containertarget = container;
        }
      }

      /*
      
        if there are no targets loaded then return
        
      */
      if(containertarget.count()>0){
        messagecontainers.full() && containertarget.append(messagecontainers);
      }
    }
    /*
    
      in shallow mode we are assuming that the target is the container
      
    */
    else{
      if(container.quarryid()==messagetarget.quarryid()){
        messagecontainers.full() && container.append(messagecontainers);
      }
    }
    
  },
  put:function(container, message){
    var messagetarget = message.get_target();
    /*
    
      in deep mode we look through the loaded data
      and match and appends to the ones we have loaded
      
    */
    if(message.deepmode){



      /*
      
        get a reference to the target within the container
        
      */
      var containertarget = container.find('=' + messagetarget.quarryid());
      var newcontainer = container.spawn(message.body);
      /*
      
        if there are no targets loaded then return
        
      */
      if(containertarget.count()>0){
        containertarget.inject(newcontainer);
      }
    }
    /*
    
      in shallow mode we are assuming that the target is the container
      
    */
    else{
      if(container.quarryid()==messagetarget.quarryid()){
        container.inject(message.body);
      }
    }
  },
  delete:function(container, message){
    var messagetarget = message.get_target();

    /*
    
      in deep mode we look through the loaded data
      and match and appends to the ones we have loaded
      
    */
    if(message.deepmode){

      console.log('-------------------------------------------');
      console.log('-------------------------------------------');
      console.dir(message);
      /*
      
        get a reference to the target within the container
        
      */
      var containerparent = container.find('=' + messagetarget.meta('parent_id'));

      if(containerparent.count()>0){
        containerparent.removechildren(messagetarget);
      }
      else{
        var directchildren = container.find('> =' + messagetarget.quarryid());
        if(directchildren.full()){
          container.removechildren(directchildren);
        }
      }
    }
    /*
    
      in shallow mode we are assuming that the target is the container
      
    */
    else{
      if(container.quarryid()==messagetarget.meta('parent_id')){
        container.removechildren(messagetarget);
      }
    }
  }
}
/*

  if the portal is linked to a container this will keep the local data in
  line with all deep changes
  
*/
Portal.prototype.sync = function(){
  var self = this;
  if(!this.container){
    return this;
  }

  var deepmode = false;
  var callback = null;

  if(arguments.length==1){
    if(_.isBoolean(arguments[0])){
      deepmode = arguments[0];
    }
    else if(_.isFunction(arguments[0])){
      callback = arguments[0];
    }
  }
  else if(arguments.length==2){
    deepmode = arguments[0];
    callback = arguments[1];
  }

  this.raw(deepmode, function(message){
    message.deepmode = deepmode;
    syncmethods[message.method] && syncmethods[message.method].apply(self, [self.container, message]);
    callback && callback(message, self.container);
  })

  return this;
}

Portal.prototype.raw = function(deepmode, fn){
  if(!fn){
    fn = deepmode;
    deepmode = false;
  }

  fn.deepmode = deepmode;

  this._register('*', fn);

  return this;
}

Portal.prototype.close = function(){
  var self = this;
  _.each(self.stack, function(route){
    _.each(self.stack[route], function(fn){
      self.switchboard.cancel(route, fn);
    })
  })
  this.stack = {};
  return this;
}

/*

  internal method as a proxy onto the actual switchboard
  
*/
Portal.prototype._register = function(httpmethod, fn){
  var self = this;

  var usemethod = httpmethod && httpmethod!='*';

  var routermethod = (fn.deepmode ? 'deep' : 'shallow') + (usemethod ? 'method' : '');
  var route = self.router[routermethod].apply(self.router, [httpmethod]);

  self._listen(route, function(messagedata){
    var message = new Message(messagedata, self.spawn);

    fn(message);
  })

  return this;
}

Portal.prototype.run_stack = function(route, message){
  var self = this;

  if(this.donemessages[message.id]){
    return;
  }

  this.donemessages[message.id] = true;

  setTimeout(function(){
    delete(self.donemessages[message.id]);
  }, 1000);

  _.each(this.stack[route], function(fn){

    fn && fn(message);
  })
}

Portal.prototype._listen = function(route, fn){
  return this._prependlisten('portal:/', route, fn);
}

Portal.prototype._cancel = function(route, fn){
  this.switchboard._cancel(route, fn);
  return this;
}

/*

  allows different protocols over the switchboard (like radio for instance)
  
*/
Portal.prototype._prependlisten = function(prepend, route, fn){
  var self = this;
  if(this.switchboard){
    if(!this.stack[route]){
      this.stack[route] = [fn];
      this.switchboard.listen(prepend + route, function(message){
        self.run_stack(route, message);
      })
    }
    else{
      this.stack[route].push(fn);
    }
  }
  return this;
}

/*

  
*/
Portal.prototype._broadcast = function(route, message){
  return this._prependbroadcast('portal:/', route, message);
}

/*

  allows different protocols over the switchboard (like radio for instance)
  
*/
Portal.prototype._prependbroadcast = function(prepend, route, message){
  var self = this;
  if(this.switchboard){
    this.switchboard.broadcast.apply(this.switchboard, [prepend + route, message]);
  }
  return this;
}
/*

  we have 4 routes:

    generic shallow:

      supplier.quarryid

    generic deep:

      supplier.a.b.c.d

    method shallow:

      method.supplier.quarryid

    method deep:

      method.supplier.a.b.c.d

  
*/
Portal.prototype.broadcastinstruction = function(instruction){
  var self = this;

  var doneroutes = {};

  /*
  
    we broadcast the event across the various channels

    this lets both shallow and deep listeners pick it up
    
  */
  _.each(['shallow', 'deep', 'shallowmethod', 'deepmethod'], function(routermode){

    var route = self.router[routermode].apply(self.router, [instruction.method]);

    if(!doneroutes[route]){
      doneroutes[route] = true;
      self._broadcast(route, instruction);
    }
  })

}

Portal.prototype.radio = function(){
  return new Radio(this);
}