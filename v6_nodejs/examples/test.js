var express = require('express');
var fs = require('fs');
var _ = require('underscore');
var eyes = require('eyes');
var async = require('async');
var http = require('http');

var app = express();
var server = http.createServer(app);

app.configure(function(){


  app.use(express.static("/srv/node_modules/freddytest/www"));

  
	
})

server.listen(80);	