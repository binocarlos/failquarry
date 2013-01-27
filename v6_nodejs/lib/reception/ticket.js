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
var async = require('async');
var utils = require('../utils');
var eyes = require('eyes');
var queries = require('../query/factory');
//var Proto = require('./proto');

module.exports = Ticket;


/*
  Quarry.io - Ticket
  --------------------

  A single query that might branch into several queries to be
  merged at the end


 */

/*


  Constructor




 */

function Ticket(options){
  options || (options = {});
  this.id = utils.quarryid();
  this.bay_id = options.bay_id;
  this.branch_headers = {};
  this.requests = {};
  this.finished = {};
  this.res = options.res;
  if(!this.res){
    throw new Error('A ticket needs a res (response)');
  }
  this.res.multipart();
}

/*

  A message has been emitted to the holdingbay
  and we are to wait for the results of this
  request now as well as the current ones (a branch)

 */
Ticket.prototype.add = function(req){
  var self = this;
  req.ticketid(this.id);
  req.bayid(this.bay_id);
  this.requests[req.quarryid()] = req;
  return queries.response(function(res){
    self.finish(req, res);
  })
}

/*

  A message has been emitted to the holdingbay
  and we are to ignore the last request and replace
  it with this one

 */
Ticket.prototype.replace = function(req){
  var self = this;
  this.finished[req.quarryid()] = true;
  return this.add(req);
}

Ticket.prototype.remove_request = function(req){
  delete(this.requests[req.quarryid()]);
}

Ticket.prototype.get_remaining_request_ids = function(){
  var self = this;

  var check_ids = _.unique(_.keys(this.branch_headers).concat(_.keys(this.requests)));

  return _.filter(check_ids, function(id){
    return !self.finished[id];
  })

}

/*

  A request has come back finished for this ticket

  Lets remove the request from our collection
  and check to see if that means we have finished everything

 */
Ticket.prototype.finish = function(req, res){
  var self = this;

  this.res.addMultipart(res);

  this.finished[req.quarryid()] = true;

  _.each(_.keys(res.branches()), function(branch_id){
    self.branch_headers[branch_id] = true;
  })

  var remaining = this.get_remaining_request_ids(res.branches());

  if(remaining.length<=0){
    self.res.send();
  }  
  
}