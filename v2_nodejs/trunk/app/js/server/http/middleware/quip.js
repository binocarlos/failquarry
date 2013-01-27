// CommonJS -> AMD conversion wrapper
// this is the AMD conversion of the async async.js file
define(function(require, exports, module) {

var dev = require('dev');

// filter for use with Connect
var exports = module.exports = function(){
    return function(req, res, next){
        exports.update(res);
        next();
    };
};

exports.update = function(res){

    ///// private helper methods /////
    var withStatus = function(code){
        return function(data){
        	if(data && !res.getHeader('Content-Type')) {
        		res.setHeader('Content-Type', 'text/html');
        	}
        	
            return data ? res.status(code).end(data):
                          res.status(code);
        };
    };
    var redirection = function(code, message){
        return function(loc){
            res.setHeader('Location', loc);
            return res.status(code).end(
                '<html>' +
                    '<head>' +
                        '<title>' + code + ' ' + message + '</title>' +
                    '</head>' +
                    '<body>' +
                        '<p>' +
                            message + ': ' +
                            '<a href="' + loc + '">' + loc + '</a>' +
                        '</p>' +
                    '</body>' +
                '</html>'
            );
        };
    }
    var withType = function(type){
        return function(data){
            res.setHeader('Content-Type', type);
            return data ? res.end(data): res;
        }
    };

    ///// exported methods /////
    res.status = function(code){
        res.statusCode = code;
        return res;
    };
    res.headers = function(headers){
        for(var k in headers) res.setHeader(k, headers[k]);
        return res;
    };
    
    var withDev = function(type){
        return function(data){
            res.setHeader('Content-Type', type);
            return data ? res.end(dev.print_r(data)): res;
        }
    };

	res.dev = withDev('text/plain');
	
    // success
    res.ok = withStatus(200);
    res.created = withStatus(201);
    res.accepted = withStatus(202);

    // redirection
    res.moved = redirection(301, 'Moved Permanently');
    res.redirect = redirection(302, 'Found');
    res.found = res.redirect;
    res.notModified = function(){res.status(304).send();};

    // client error
    res.badRequest = withStatus(400);
    res.unauthorized = withStatus(401);
    res.forbidden = withStatus(403);
    res.notFound = withStatus(404);
    res.notAllowed = withStatus(405);
    res.conflict = withStatus(409);
    res.gone = withStatus(410);

    // server error
    res.error = withStatus(500, 'error');

    // mime types
    res.text = withType('text/plain');
    res.plain = res.text;
    res.html = withType('text/html');
    res.xhtml = withType('application/xhtml+xml');
    res.css = withType('text/css');
    res.xml = withType('text/xml');
    res.atom = withType('application/atom+xml');
    res.rss = withType('application/rss+xml');
    res.javascript = withType('text/javascript');
    res.json = withType('application/json');

    // JSONP is a special case that should always respond with a 200,
    // there is no reliable way to reveive a JSONP result on the
    // client-side if the HTTP status-code is not 200!
    res.jsonp = function(callback, data){
        if(typeof data == 'object') data = JSON.stringify(data);
        data = callback + '(' + data + ');';
        return res.ok().javascript(data);
    };

    return res;

};


});