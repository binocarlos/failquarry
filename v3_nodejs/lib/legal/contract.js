/*!
 * jQuarry: contract
 * Copyright(c) 2012 jquarry.com
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var _ = require('underscore'),
    phaseFactory = require('./phase');

// map of match positions against fieldnames
var chunkers = [
  {
    name:'class',
    regexp:/^\.\w+/
  },
  {
    name:'id',
    regexp:/^#\w+/
  },
  {
    name:'quarryid',
    regexp:/^=\w+/
  },
  {
    name:'modifier',
    regexp:/^:\w+/
  },
  {
    name:'attr',
    regexp:/^\[.*?["']?.*?["']?\]/
  },
  {
    name:'tag',
    regexp:/^(\*|\w+)/
  },
  {
    name:'splitter',
    regexp:/^[ ,<>]+/

  }
];

/**
 * Parse selector string into flat array of chunks
 *
 */
var parseChunks = function(selector){

  var lastMatch = null;
  var workingString = selector ? selector : '';
  var lastString = '';

  // this is a flat array of type, string pairs
  var chunks = [];

  var matchNextChunk = function(){

    lastMatch = null;

    for(var i in chunkers){

      var chunker = chunkers[i];

      if(lastMatch = workingString.match(chunker.regexp)){

        var chunk = {
          name:chunker.name,
          value:lastMatch[0]
        };

        chunks.push(chunk);

        workingString = workingString.replace(lastMatch[0], '');

        return true;
      }
    }
    
    return false;

  }
  
  // the main chunking loop happens here
  while(matchNextChunk()){
    
    // this is the sanity check in case we match nothing
    if(lastString==workingString){
      break;
    }
  }

  return chunks;
}

/**
 * Parse contract
 *
 * @api public
 */
var parseContract = function(selector, skeletonMode){

  var chunks = parseChunks(selector);

  var currentPhase = phaseFactory();
  var phases = [currentPhase];

  _.each(chunks, function(chunk){

    // this is a phase splitter
    if(chunk.name=='splitter' && chunk.value.match(/,/)){
      currentPhase.finish(skeletonMode);
      currentPhase = phaseFactory();
      phases.push(currentPhase);
    }
    // otherwise pass the chunk to the current phase/selector
    else{      
      currentPhase.addChunk(chunk);
    }
  });

  currentPhase.finish(skeletonMode);

  return phases;
}

/**
 * exposed factory - accepts a selector string and default drives - return an array of phases
 */

var factory = function(selector, skeletonMode){

  // we assume its already parsed
  if(_.isObject(selector)){
    return selector;
  }
  
  // first lets grab the phases from the selector
  var phases = parseContract(selector, skeletonMode);

  // this means we have an empty string and should ignore the first phase
  if(phases.length==1 && phases[0].isEmpty()){
    phases = [];
  }

  // lets wrap up a contract object
  var contractObject = {
    _phases:phases,
    _context:false,
    _string:selector,
    raw:function(){
      var ret = [];

      _.each(this._phases, function(phase){
        ret.push(phase.raw());
      });

      return ret;
    },
    toString:function(){
      return this._string;
    },
    isEmpty:function(){
      return phases.length<=0;
    },
    phase:function(index){
      return this._phases[index];
    },
    phases:function(){
      return this._phases;
    }
  }

  return contractObject;
}

exports = module.exports = factory;
