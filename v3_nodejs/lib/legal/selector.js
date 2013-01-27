/*!
 * jQuarry: element
 * Copyright(c) 2012 jquarry.com
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var _ = require('underscore');

/**
 * selector prototype.
 */

var selector = {};

selector.init = function(){

  // the value map
  var map = {
    // the id given by #abc
    id:null,
    // the direct id pointer
    quarryid:null,
    // the tag name (product.onsale)
    tag:null,
    // the classnames (.red .cheap)
    class:{

    },
    // the modifiers (:last)
    modifier:{

    },
    // the attribute array with {field,operator,value} objs
    attr:[],
    // the splitter between this selector and the next in the phase
    splitter:null
  };

  var self = this;

  // lets us know if there has been anything added to this selector
  this._empty = true;

  this._last = false;

  this._skeletonMode = false;

  this.raw = function(){
    return map;
  }

  this.last = function(){
    return arguments.length>0 ? this._last = arguments[0] : this._last;
  }

  this.skeletonMode = function(){
    return arguments.length>0 ? this._last = arguments[0] : this._last;
  }

  this.initProperty('id', function(id){
    if(id){
      self._empty = false;
      map.id = id.replace(/^#/, '');
    }
    return map.id;
  });
  this.initProperty('quarryid', function(quarryid){
    if(quarryid){
      self._empty = false;
      map.quarryid = quarryid.replace(/^=/, '');
    }
    return map.quarryid;
  });
   this.initProperty('splitter', function(splitter){
    if(splitter){
      self._empty = false;
      map.splitter = splitter.replace(/\s+/g, '');
    }
    return map.splitter;
  });
  this.initProperty('tag', function(tag){
    if(tag){
      self._empty = false;
      map.tag = tag;
    }
    return map.tag;
  });
  this.initProperty('class', function(className){
    if(className){
      self._empty = false;
      className = className.replace(/^\./, '');
      map.class[className] = true;
    }
    return map.class;
  });
  this.initProperty('modifier', function(modifier){
    if(modifier){
      self._empty = false;
      modifier = modifier.replace(/^:/, '');
      map.modifier[modifier] = true;
    }
    return map.modifier;
  });
  this.initProperty('attr', function(attrString){
    if(attrString){
      self._empty = false;
      var match = attrString.match(/\[(.*?)([=><\^\|\*\~\$\!]+)["']?(.*?)["']?\]/);
      if(match){
        map.attr.push({
          field:match[1],
          operator:match[2],
          value:match[3]
        });
      }
      else {
        map.attr.push({
          field:attrString.replace(/^\[/, '').replace(/\]$/, '')
        });
      }
    }

    return map.attr;
  })
}

/**
 * builds setter methods for each type of CSS property
 * accepts a filter function to process the string
 */
selector.initProperty = function(property, filterFunction){
  var self = this;
  
  this[property] = filterFunction;
}


// adds a chunk to the current selector
selector.addChunk = function(chunk){
  if(!this[chunk.name]){
    return;
  }
  this[chunk.name].apply(this, [chunk.value]);
}

selector.has = function(property){
  if(!this[property]){
    return false;
  }

  var value = this[property]();

  return !_.isEmpty(value);
}

selector.hasModifier = function(modifier){
  var modifiers = this.modifier() || {};

  return modifiers[modifier];
}

selector.hasAttributes = function(){
  return this.attr().length>0;
}

selector.hasClassnames = function(){
  return _.keys(this.class()).length>0;
}

selector.isRoot = function(){
  return this.hasModifier('root');
}

selector.isWildcard = function(){
  return this.tag()=='*';
}

selector.isEmpty = function(){
  return this._empty;
}

selector.hasAttr = function(){
  return this.attr().length>0;
}

selector.isDescendent = function(){
  return this.splitter()!='>' && !this.modifier().root && this.tag()!='*';
}

selector.isChild = function(){
  return this.splitter()=='>';
}

selector.toString = function(){
  var parts = [];

  if(!_.isEmpty(this.tag())){
    parts.push(this.tag());
  }

  if(!_.isEmpty(this.id())){
    parts.push('#' + this.id());
  }

  _.each(_.keys(this.class()), function(className){
    parts.push('.' + className);
  });

 
  _.each(this.attr(), function(attr){
    if(attr.operator!=null){
      parts.push('[' + attr.field + ']');
    }
    else{
      parts.push('[' + attr.field + attr.operator + attr.value + ']'); 
    }
  });

  _.each(_.keys(this.modifier()), function(modifier){
    parts.push(':' + modifier);
  });

  return parts.join('');
}
/**
 * exposed factory
 */

var factory = function(){
	
	function selectorInstance(){}
	
	_.extend(selectorInstance, selector);

  selectorInstance.init();

  return selectorInstance;
}

exports = module.exports = factory;
