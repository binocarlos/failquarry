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

var bootstrap = require('./lib/tools/bootstrap');

bootstrap();

/*

	quarry.io main API expose
	
*/

module.exports = {

  /*
  
    constants
    
  */
  DEVELOPMENT:'development',
  LOCAL:'local',
  CLOUD:'cloud',

  /*
  
    modules
    
  */
	container:require('./lib/container').factory,
	new:require('./lib/container').factory,
	contract:require('./lib/contract'),
  request:require('./lib/contract').request,
  response:require('./lib/contract').response,
	warehouse:require('./lib/warehouse'),
	network:require('./lib/network'),
	supplier:require('./lib/supplier'),
	middleware:require('./lib/supplier').middleware,
  device:require('./lib/network/device'),
  endpoints:require('./lib/network/tools/endpointfactory')
}