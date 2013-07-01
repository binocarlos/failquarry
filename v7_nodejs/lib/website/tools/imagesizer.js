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
var async = require('async');
var eyes = require('eyes');
var url = require('url');
var fs = require('fs');
var wrench = require('wrench');
var path = require('path');

var crypto = require('crypto');
var im = require('imagemagick');
var ImageSizer = require('./imagesizer');

/*

  quarry.io - bootstrap middleware

  delivers the quarry bootstrap API (a combo of Twitter Bootstrap and Google Angular)
  
*/

var formats = {
	'.png':true,
	'.jpg':true,
	'.gif':true
}

var sizers = {

	size:function(packet, callback){

	  var size = packet.size;

	  // -resize 100x100
	  var option = size + 'x' + size + '\>';

	  im.convert([packet.filein, '-resize', option, packet.fileout], callback);
	},

	width:function(packet, callback){
	  var size = get_size_argument(packet.options);

	  // -resize 100x
	  var option = size + 'x\>';

	  im.convert([packet.filein, '-resize', option, packet.fileout], callback);
	},

	height:function(packet, callback){
	  var size = get_size_argument(packet.options);

	  // -resize x100
	  var option = 'x' + size + '\>';

	  im.convert([packet.filein, '-resize', option, packet.fileout], callback);
	}
}

module.exports = function(options, callback){

	options = _.defaults(options, {
    tempfolder:'/tmp/quarry/cache'
  })

  var original = options.original;
  var ext = path.extname(original);
  var size = options.size;

  if(!formats[ext]){
  	callback(null, original);
  }

	var id = original + '?size=' + size;
	var md5sum = crypto.createHash('md5');
	md5sum.update(id);
	var uid = md5sum.digest('hex');
	var cachepath = options.tempfolder + '/' + uid + ext;

	fs.stat(cachepath, function(error, stat){
		if(!error && stat.isFile()){
			callback(null, cachepath);
			return;
		}

		sizers.size({
			size:size,
			filein:original,
			fileout:cachepath
		}, function(error){
			callback(error, cachepath);
		})
	})
}