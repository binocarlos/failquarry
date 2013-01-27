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