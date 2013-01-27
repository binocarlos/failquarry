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
  Quarry.io - Supplier
  --------------------

  wraps a supplier in a warehouse


 */

var Warehouse = require('./warehouse');
var Supplier = require('./supplier/factory');

module.exports = factory;

function factory(options, ready){

  var warehouse = Warehouse();

  warehouse.prepare(function(warehouseready){
    
    var supplier = Supplier(options, function(error){
      if(error){
        warehouse.use(function(req, res, next){
          res.sendError(error);
        })
      }
      else{
        warehouse.use(function(req, res, next){
          supplier.handle(req, res, next);
        })  
      }
      
      warehouseready();
      ready && ready();
    })  
  })

  return warehouse;  
}