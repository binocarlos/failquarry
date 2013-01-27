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
module.exports = factory;

/*

  Returns a factory function to create new containers

  This allows you to customize the container and model behaviour
  before they are instantiated

 */
function factory(options, ready){

  options || (options = {});

  // what driver api are we representing
  var driver = options.driver;

  if(!driver){
    throw new Error('Supplier factory needs a driver');
  }

  // load the api
  var api = require('./' + driver.replace(/\./g, '/'));

  var supplier = new api(options);

  supplier.prepare(function(error){
    ready(error);
  })

  return supplier;  
}