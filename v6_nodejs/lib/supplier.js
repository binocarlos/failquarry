  /*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

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