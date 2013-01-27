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
var Mustache = require('./templates/mustache');

module.exports = factory;

/*
  Quarry.io Templates
  -------------------

  wrapper for some HTML that contain some

    <script name="NAME" type="quarry/template">
        ...
    </script>

  it auto-detects the template type by regexping <% OR {{

 */    

var Template = function(html){
  this.html = html;
  this.mode = html.match(/<%/) ? 'ejs' : 'mustache';

  if(this.mode=='ejs'){
    this._compiled = _.template(html);
  }
  else{
    this._compiled = Mustache.compile(html);
  }
}

Template.prototype.render = function(data){

  data || (data = {});

  // convert containers to raw data
  if(_.isFunction(data)){
    data = data.raw();
  }

  return this._compiled(data);
}

var Templates = function(html){

  var self = this;

  var templates = {};

  if(_.isString(html)){
    this.html = html;
  
    var regexp = /<script name="(.*?)" type="quarry.*?">([\w\W]*?)<\/script>/gi;

    var match = null;

    while(match = regexp.exec(html)){

      var template_name = match[1];
      var template_text = match[2];

      templates[template_name] = new Template(template_text);
    }  
  }
  else if(_.isObject(html)){
    _.each(html, function(template_text, template_name){

      if(_.isArray(template_text)){
        template_text = template_text.join('');
      }
      templates[template_name] = new Template(template_text);
    })
  }

  this.templates = templates;
  
}

Templates.prototype.render = function(name, data){
  var template = this.templates[name];

  return template.render(data);
}

function factory(html){
  return new Templates(html);
}