/*!
 * jQuarry: element
 * Copyright(c) 2012 jquarry.com
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var _ = require('underscore'),
    selectorFactory = require('./selector');

/**
 * phase prototype.
 */

var phase = {};

phase.init = function(){
  this._currentSelector = selectorFactory();
  this._selectors = [this._currentSelector];
}

phase.raw = function(){
  var ret = [];

  _.each(this.selectors(), function(selector){
    ret.push(selector.raw());
  });

  return ret;
} 


phase.selector = function(index){
  return this._selectors[index];
}

phase.selectors = function(){
  return _.map(this._selectors, function(val){return val});
}

// adds a chunk to the current phase / selector
phase.addChunk = function(chunk){
  if(chunk.name=='splitter'){

    if(!this._currentSelector.isEmpty()){
      this._currentSelector = selectorFactory();
      this._selectors.push(this._currentSelector);
    }

    this._currentSelector.addChunk(chunk);
  }
  else{
    this._currentSelector.addChunk(chunk);
  }
}

phase.isEmpty = function(){
  if(this._selectors.length<=0) { return true; }
  return this._selectors.length==1 && this._selectors[0].isEmpty();
}

// tell the last selector it is the last one
phase.finish = function(skeletonMode){
  if(this._selectors.length>0){
    this._selectors[this._selectors.length-1].last(true);
  }

  if(skeletonMode){
    _.each(this.selectors, function(selector){
      selector.skeletonMode(true);
    })
  }
  return this;
  
}
phase.finalize = function(){
  if(this._selectors.length<=0) { return true; }
  return this._selectors.length==1 && this._selectors[0].isEmpty();
}

/**
 * exposed factory
 */

var factory = function(){
	
	function phaseInstance(){}
	
	_.extend(phaseInstance, phase);

  phaseInstance.init();

  return phaseInstance;
}

exports = module.exports = factory;
