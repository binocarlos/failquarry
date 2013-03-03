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

var nested = require('../vendor/backbonenested');
var helpers = require('./helpers');
var utils = require('../utils');
var _ = require('underscore');

var eyes = require('eyes');

/*
  Quarry.io - Container Meta Model
  --------------------------------

  Model to look after the meta data for the container

 */

var Meta = nested.extend({

  /*
    ensure there is a quarryid for every container
   */
  initialize:function(){
    var classname_array = this.get('classnames') || [];

    var map = {};
    _.each(classname_array, function(classname){
      map[classname] = true;
    })
    
    this._classnames = map;

    var quarryid = this.get('quarryid');

    if(!quarryid){
      this.set({
        quarryid:utils.quarryid(true)
      },{
        silent:true
      })
    }
  },

  classname_array: function(){
    return _.keys(this._classnames);
  },

  classname_string: function(){
    return this.classname_array().join(' ');
  },

  classname_map: function(){
    return this._classnames;
  },

  hasClass:function(classname){
    return this._classnames[classname] ? true : false;
  },

  addClass:function(classname){
    this._classnames[classname] = true;
    this.set('classnames', this.classname_array());
    return this;
  },

  removeClass:function(classname){
    delete(this._classnames[classname]);
    this.set('classnames', this.classname_array());
    return this;
  },

  toJSON:function(){

    return _.clone(this.attributes);
    
  }

  
})

module.exports = Meta;