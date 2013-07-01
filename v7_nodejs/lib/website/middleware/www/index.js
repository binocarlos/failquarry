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
var express = require('express');
var crypto = require('crypto');

var ImageSizer = require('../../tools/imagesizer');

/*

  quarry.io - bootstrap middleware

  delivers the quarry bootstrap API (a combo of Twitter Bootstrap and Google Angular)
  
*/

module.exports = function(options, network){

	var document_root = options.document_root;

	options = _.defaults(options, {
    tempfolder:'/tmp/quarry/cache'
  })

  wrench.mkdirSyncRecursive(options.tempfolder, 0777);

	return function(req, res, next){
		var pathname = url.parse(req.url).pathname;
		var localpath = document_root + pathname;

		fs.stat(localpath, function(error, stat){
			if(error){
				res.statusCode = 404;
				res.send(error);
			}
			else if(stat.isDirectory()){
				pathname += (pathname.substr(-1)=='/' ? '' : '/') + 'index.html';
				localpath = document_root + pathname;
				fs.stat(localpath, function(error, stat){
					if(error || !stat.isFile()){
						res.statusCode = 404;
						res.send('not found');
					}
					else{
						res.sendfile(localpath);
					}
				})
			}
			else{
				if(!req.query.size || !req.query.size.match(/^\d+$/)){
					res.sendfile(localpath);
					return;
				}
				else{

					ImageSizer({
						original:localpath,
						size:req.query.size
					}, function(error, output){
						res.sendfile(output);
					})

				}
			}
		})
	}
}