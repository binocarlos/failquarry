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