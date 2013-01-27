/*
 * Connect - staticProvider
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * MIT Licensed
 */

/*
 * Upgraded for jQuarry for the website static server
 */
 
/*
 * Module dependencies.
 */

// CommonJS -> AMD conversion wrapper
// this is the AMD conversion of the async async.js file
define(function(require, exports, module) {
	
var fs = require('fs')
  , path = require('path')
  , join = path.join
  , basename = path.basename
  , normalize = path.normalize
  , utils = require('connect/lib/utils.js')
  , Buffer = require('buffer').Buffer
  , parse = require('url').parse
  , mime = require('connect/node_modules/mime');

/**
 * Static:
 *
 *   Static file server with the given `root` path.
 *
 * Examples:
 *
 *     var oneDay = 86400000;
 *
 *     connect()
 *       .use(connect.static(__dirname + '/public'))
 *
 *     connect()
 *       .use(connect.static(__dirname + '/public', { maxAge: oneDay }))
 *
 * Options:
 *
 *    - `maxAge`   Browser cache maxAge in milliseconds. defaults to 0
 *    - `hidden`   Allow transfer of hidden files. defaults to false
 *    - `redirect`   Redirect to trailing "/" when the pathname is a dir
 *
 * @param {String} root
 * @param {Object} options
 * @return {Function}
 * @api public
 */


/**
 * Attempt to tranfer the requested file to `res`.
 *
 * @param {ServerRequest}
 * @param {ServerResponse}
 * @param {Function} next
 * @param {Object} options
 * @api private
 */

exports = module.exports = function() {

	return function(req, res, next){
  
  var options = {
  	getOnly:true,
  	redirect:true,
  	maxAge:0
  };
  
  // load the path from the req - this needs to have been populated
  var path = req.quarryFile;
  var requestPath = req.quarryPath;
  
  if (!path) throw new Error('path required');

  // setup
  var maxAge = options.maxAge || 0
    , ranges = req.headers.range
    , head = 'HEAD' == req.method
    , get = 'GET' == req.method
    , redirect = false === options.redirect ? false : true
    , getOnly = options.getOnly
    , done;

  // ignore non-GET requests
  if (getOnly && !get && !head) return next();

  var type;

  fs.stat(path, function(err, stat){
    // mime type
    type = mime.lookup(path);

    // ignore ENOENT
    if (err) {
      return ('ENOENT' == err.code || 'ENAMETOOLONG' == err.code)
        ? next()
        : next(err);
    // redirect directory in case index.html is present
    } else if (stat.isDirectory()) {
      if (!redirect) return next();
      res.statusCode = 301;
      res.setHeader('Location', requestPath + '/');
      res.end('Redirecting to ' + requestPath + '/');
      return;
    }

    // header fields
    if (!res.getHeader('Date')) res.setHeader('Date', new Date().toUTCString());
    if (!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', 'public, max-age=' + (maxAge / 1000));
    if (!res.getHeader('Last-Modified')) res.setHeader('Last-Modified', stat.mtime.toUTCString());
    if (!res.getHeader('Content-Type')) {
      var charset = mime.charsets.lookup(type);
      res.setHeader('Content-Type', type + (charset ? '; charset=' + charset : ''));
    }
    res.setHeader('Accept-Ranges', 'bytes');

    // conditional GET support
    if (utils.conditionalGET(req)) {
      if (!utils.modified(req, res)) {
        req.emit('static');
        return utils.notModified(res);
      }
    }

    var opts = {}
      , len = stat.size;

    // we have a Range request
    if (ranges) {
      ranges = utils.parseRange(len, ranges);

      // valid
      if (ranges) {
        opts.start = ranges[0].start;
        opts.end = ranges[0].end;

        // unsatisfiable range
        if (opts.start > len - 1) {
          res.setHeader('Content-Range', 'bytes */' + stat.size);
          return next(utils.error(416));
        }

        // limit last-byte-pos to current length
        if (opts.end > len - 1) opts.end= len - 1;

        // Content-Range
        len = opts.end - opts.start + 1;
        res.statusCode = 206;
        res.setHeader('Content-Range', 'bytes '
          + opts.start
          + '-'
          + opts.end
          + '/'
          + stat.size);
      }
    }

    res.setHeader('Content-Length', len);

    // transfer
    if (head) return res.end();

    // stream
    var stream = fs.createReadStream(path, opts);
    req.emit('static', stream);
    req.on('close', stream.destroy.bind(stream));
    stream.pipe(req.outputStream ? req.outputStream : res);

	stream.on('error', function(err){
		if (res.headerSent) {
			console.error(err.stack);
			req.destroy();
		} else {
			next(err);
		}
	});
    
  });
  
  
};


};

});