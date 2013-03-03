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
var async = require('async');
var utils = require('../utils');
var eyes = require('eyes');
var queries = require('../query/factory');
var Ticket = require('./ticket');
//var Proto = require('./proto');

module.exports = HoldingBay;


/*
  Quarry.io - HoldingBay
  ----------------------

  Keeps track of branching queries inside of the reception


 */

/*


  Constructor




 */

function HoldingBay(options){
  options || (options = {});
  this.id = options.id || utils.quarryid();
  this.tickets = {};
}

HoldingBay.prototype.process_message = function(message){
  if(!this[message.action]){
    throw new Error(message.action + ' was not found on the holdingbay');
  }

  return this[message.action].apply(this, [message]);
}

HoldingBay.prototype.ticket = function(mainres){
  var ticket = new Ticket({
    bay_id:this.id,
    res:mainres
  })
  this.tickets[ticket.id] = ticket;
  return ticket;
}

HoldingBay.prototype.completed = function(ticket){
  delete(this.tickets[ticket.id]);
  return this;
}

HoldingBay.prototype.redirect = function(req){
  var ticket = this.tickets[req.ticketid()];
  return ticket.replace(req);
}

HoldingBay.prototype.branch = function(req){
  var ticket = this.tickets[req.ticketid()];

  if(!ticket){
    eyes.inspect(_.keys(this.tickets));
    throw new Error('no ticket found: ' + req.ticketid());
  }

  return ticket.add(req);
}

