/*
 * @class switchboard.message
 * @extends base
 * @filename   	switchboard/message.js
 * @package    	jquarry
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * message
 * 
 * 
 *
 */

define([

	'base',
	
	'underscore',
	
	'async'
	
	
], function(

	base,
	
	_,
	
	async
	
) {
	
	// here is where we have special components that live elsewhere
	var typeShortcuts = {
		
		
		
	};
	
	return base.extend({
		
		/*
		 * the base message factory
		 *
		 */
		factory: function(rawdata, callback) {
			
			var messageType = 'blank';
			
			// then we assume the rawdata to be the type
			if(_.isString(rawdata)) {
				messageType = rawdata;
			}
			// we assume the object to contain the type
			else if(_.isObject(rawData)) {
				if(rawData.messageType!=null) {
					messageType = rawData.messageType;	
				}
			}
			
			messageType = typeShortcuts[messageType]!=null ? typeShortcuts[messageType] : messageType;
			
			var requirePath = './message/' + messageType;
			
			require([requirePath], function(messageClass) {
				
				var message = new messageClass(messageType, rawdata);
				
				async.nextTick(function() { callback(null, message); });
				
			});
			
		}
		
	}, {
		
		/*
		 * the type of the message
		 */
		_type: null,
		
		/*
		 * the robject with the message data
		 */
		_data: null,
		
		init: function(type, data) {
			
			this._type = type;
			this._data = data || {};
			
			this._data.messageType = type;
				
		},
		
		/*
		 * this will overidden by the subclass message
		 */
		exchange: function() {
			return '';
		},
		
		/*
		 * this will overidden by the subclass message
		 */
		routingKey: function() {
			return '';
		},
		
		/*
		 * this will overidden by the subclass message
		 */
		id: function() {
			return [this.exchange(),this.type(),this.routingKey()].join(' : ');
		},
		
		type: function() {
			return this._type;
		},
		
		get: function(key) {
			return this._data[key];	
		},
		data: function() {
			return this._data;
		}
		
	});
	
});