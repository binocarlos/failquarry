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

var utils = {};

module.exports = utils;

/**
 * generate a new global id
 */

utils.quarryid = function(short_version){

  var pattern = short_version ? 'xxxxxx' : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  
	return pattern.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
	});
}

/**
 * takes a string and prepares it to be used in a RegExp itself
 */

utils.escapeRegexp = function(search){
  return search.replace(/([\!\$\(\)\*\+\.\/\:\=\?\[\\\]\^\{\|\}])/g, "\\$1");
}

/**
 * jQuery Deep extend
 */

utils.extend = extend;

function extend(){
  var options, name, src, copy, copyIsArray, clone, target = arguments[0] || {},
    i = 1,
    length = arguments.length,
    deep = false,
    toString = Object.prototype.toString,
    hasOwn = Object.prototype.hasOwnProperty,
    push = Array.prototype.push,
    slice = Array.prototype.slice,
    trim = String.prototype.trim,
    indexOf = Array.prototype.indexOf,
    class2type = {
      "[object Boolean]": "boolean",
      "[object Number]": "number",
      "[object String]": "string",
      "[object Function]": "function",
      "[object Array]": "array",
      "[object Date]": "date",
      "[object RegExp]": "regexp",
      "[object Object]": "object"
    },
    jQuery = {
      isFunction: function (obj) {
        return jQuery.type(obj) === "function"
      },
      isArray: Array.isArray ||
      function (obj) {
        return jQuery.type(obj) === "array"
      },
      isWindow: function (obj) {
        return obj != null && obj == obj.window
      },
      isNumeric: function (obj) {
        return !isNaN(parseFloat(obj)) && isFinite(obj)
      },
      type: function (obj) {
        return obj == null ? String(obj) : class2type[toString.call(obj)] || "object"
      },
      isPlainObject: function (obj) {
        if (!obj || jQuery.type(obj) !== "object" || obj.nodeType) {
          return false
        }
        try {
          if (obj.constructor && !hasOwn.call(obj, "constructor") && !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
            return false
          }
        } catch (e) {
          return false
        }
        var key;
        for (key in obj) {}
        return key === undefined || hasOwn.call(obj, key)
      }
    };
  if (typeof target === "boolean") {
    deep = target;
    target = arguments[1] || {};
    i = 2;
  }
  if (typeof target !== "object" && !jQuery.isFunction(target)) {
    target = {}
  }
  if (length === i) {
    target = this;
    --i;
  }
  for (i; i < length; i++) {
    if ((options = arguments[i]) != null) {
      for (name in options) {
        src = target[name];
        copy = options[name];
        if (target === copy) {
          continue
        }
        if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)))) {
          if (copyIsArray) {
            copyIsArray = false;
            clone = src && jQuery.isArray(src) ? src : []
          } else {
            clone = src && jQuery.isPlainObject(src) ? src : {};
          }
          // WARNING: RECURSION
          target[name] = extend(deep, clone, copy);
        } else if (copy !== undefined) {
          target[name] = copy;
        }
      }
    }
  }
  return target;
}