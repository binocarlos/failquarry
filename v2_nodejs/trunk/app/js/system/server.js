/*
 * @class system.server
 * @filename   	system/server.js
 * @package    	system
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * server system - knows how to do the colonel stuff from the server
 *
 */

define([

	'bootlace',
	
	'./server/utils',
	
	'config',
	
	'fs',
	
	'sequelize',
	
	'underscore',
	
	'async',
	
	'node-uuid',
	
	'child_process',
	
	'wrench',
	
	'temp'
	
], function(

	bootlace,
	
	utils,
	
	configLoader,
	
	fs,
	
	Sequelize,
	
	_,
	
	async,
	
	uuid,
	
	child_process,
	
	wrench,
	
	temp
	
) {
	
	// the singleton bootstrap for the server system
	function bootstrapSystem()
	{
		var _instance;
		
		 return {
	        instance: function (options) {
	        
	        	 if(_instance==null) {
	        	 	
	        	 	_instance = new theSystemClass(options);
	        	 	
	        	 }
	        	 
	        	 return _instance;
	        	
	        }
	    };
	}
	
	var theSystemClass = bootlace.extend(
	/*
	 ****************************************************************************
	 * STATIC
	 ****************************************************************************
	 */
	{
		
		
		
	},
	/*
	 ****************************************************************************
	 * INSTANCE
	 ****************************************************************************
	 */
	{
		
		mode:'server',
		
		name:'Server System',
		
		// are we in dev mode
		_dev:false,
		
		// a reference to the database connection
		_database:null,
		
		// a reference to the switchboard singleton
		_switchboard:null,
		
		/**
		 * @constructor
		 */
		init: function(options) {
			
			this._silent = options && options.silent;
			this._dev = options && options.development;
			
			this._super(options);
			
		},
		
		dev: function() {
			return this._dev;
		},
		
		production: function() {
			return !this.dev();
		},
		
		/**
		 * get the server system config
		 *
		 */
		getConfigFiles: function() {
			
			var ret = this._super();
			
			ret.push('system');
			ret.push('system.server');

			return ret;
			
		},
		
		getObjectSetupFunctions: function() {
			
			// get the base setup functions
			var ret = this._super();
			
			var system = this;
			
			// load the mysql database
			ret.push(function(callback) {
				
				// once the database is setup - load the dependent things
				system.setupDatabase(callback);
				
			});
			
			// load the switchboard reference and setup listeners
			ret.push(function(callback) {
				
				// once the database is setup - load the dependent things
				system.setupSwitchboard(callback);
				
			});
			
			return ret;
		},
		
		/**
		 * return what database connection we have set in the config
		 *
		 */
		getDatabaseConfig: function() {
		
			var useDriver = this.config('database.activeDriver');
			
			return this.config('database.' + useDriver);
			
		},
		
		/**
		 * setup the mysql database connection
		 *
		 */
		setupDatabase: function(callback) {
			
			var system = this;
			
			var config = system.getDatabaseConfig();
			
			this.message('header', 'Loading MySQL');
			this.message('event', 'connect', config.username + ':' + config.password + '@' + config.host + '/' + config.database + ':' + config.port);
			
			var sequelize = new Sequelize(config.database, config.username, config.password, {
				host: config.host,
				port: config.port,
				logging: false,
				maxConcurrentQueries: config.concurrent_queries,
				dialect: 'mysql',
				define: { timestamps: false },
				pool: config.pool
			});
			
			system._database = sequelize;
			
			system.message('event', 'connect', 'MySQL connected');
			
			callback(null, sequelize);
					
		},
		
		/**
		 * grab a reference to the switchboard
		 *
		 */
		setupSwitchboard: function(finishedCallback) {
			
			var system = this;
			
			system.message('header', 'Loading Switchboard For ' + this.name);
			
			require(['switchboard'], function(switchboardClass) {
				
				switchboardClass.instance(function(error, switchboard) {
					
					// switchboard is ready
					system._switchboard = switchboard;
				
					finishedCallback(null, system);
					
				});
								
			});
			
		},
		
		/**
		 * get the database
		 *
		 */
		database: function() {
			
			return this._database;
			
		},
		
		/**
		 * get the switchboard
		 *
		 */
		switchboard: function() {
			
			return this._switchboard;
			
		},
		
		/**
		 * converts drive notation to a folder that is usable
		 * the server will return a fullpath
		 * the client will return an alias to that path
		 *
		 * 	core:/
		 * 	user:USERNAME:/
		 * 	author:AUTHORNAME:/
		 *  installations:/
		 */

		path: function(path) {
			return this.resolvePath(path);
		},
		
		resolvePath: function(path) {
		
			if(_.isEmpty(path)) {
				
				return null;
				
			}
			
			// if we start with a slash then we have a full path
			if(path.match(/^\//)) { return path; }
			
			// test for a drive - assume core if none found
			if(!path.match(/^\w+:/)) {
				path = 'core:' + path;
			}
			
			var match;
			
			while(match = path.match(/^(\w+):/)) {
			
				var tag = match[1];
				
				path = path.replace(/^\w+:/, this.drive(tag));
				
			}

			return path;
		},
		
		/**
		 * converts the name of a drive into a path from the config
		 */
		drive: function(name) {
			
			return this.config('drives.' + name);
			
		},
		
		/**
		 * returns a local path for a drive name - based on the system config
		 *
		 */
		getDrivePath: function(name) {
			
			var config = this._super(name);
			
			return config.folder;
			
		},
		
		/**
		 * uses requirejs to load the filecontents over the network
		 */
		readFile: function(path, callback) {
			
			fs.readFile(path, 'utf8', callback);
			
		},
		
		/**
		 * generates a temp file with the given contents
		 */
		tempFile: function(options, contents, callback) {
			
			_.defaults(options || {}, {
				suffix:'.json',
				prepend:'quarry'
			});
			
			var system = this;
			
			temp.open(options, function(err, info) {
				
				var tempPath = info.path;
				fs.write(info.fd, contents);
				fs.close(info.fd, function(err) {
					
					// the temp file now exists with the contents
					callback(err, tempPath);
					
				});
				
			});
		},
		
		/**
		 * tells you if there is such a file
		 *
		 * 
		 */
		fileExists: function(path, callback) {
			
			this.stat(path, function(err, stat) {
				
				callback(err, !err && stat!=null);
				
			});
			
		},
		
		/**
		 * uses requirejs to load the filecontents over the network
		 */
		stat: function(path, callback) {
			
			fs.stat(path, callback);
			
		},
		
		/*
		 * copy 2 files once you have processed their paths
		 */
		copyFile: function(from, to, callback) {
			var system = this;
			
			from = this.resolvePath(from);
			to = this.resolvePath(from);
			
			var newFile = fs.createWriteStream(to);
			var oldFile = fs.createReadStream(from);
			
			newFile.once('open', function(fd){
    			require('util').pump(oldFile, newFile, function() {
    				fs.chown(to, system.config('system_uid'), system.config('system_gid'), function() {
						
						callback();
							
					});
    			});
			});
			
		},
		
		removeFile: function(path, callback) {
			
			fs.unlink(path, callback);
			
		},
		
		clearDirectory: function(path, callback) {
			
		},
		
		/**
		 * changes ownership of a file
		 *
		 * 
		 */
		chmod: function(fullPath, callback) {
			
			var system = this;
			
			fs.chown(fullPath, system.config('system_uid'), system.config('system_gid'), function() {
						
				fs.chmod(fullPath, 0775, function() {
					callback();
				});
							
			});
			
		},
		
		/**
		 * changes ownership of whole directory to the system users
		 *
		 * 
		 */
		chmodDir: function(path, callback) {
			
			var system = this;
			
			wrench.chownSyncRecursive(path, system.config('system_uid'), system.config('system_gid'));
			wrench.chmodSyncRecursive(path, 0755);
			
			callback();
		},
		
		resetDir: function(name, callback) {
			var system = this;
			
			system.rmDir(name, function() {
				
				system.mkDir(name, callback);
				
			});	
		},
		
		/**
		 * this will only accept a name not a path
		 *
		 * 
		 */
		rmDir: function(name, callback) {
			
			if(name=='crusher') {
				wrench.rmdirSyncRecursive(this.resolvePath('crusher:/'));
			}
			
			callback();
		},
		
		/**
		 * this will only accept a name not a path
		 *
		 * 
		 */
		mkDir: function(name, callback) {
			if(name=='crusher') {
				wrench.mkdirSyncRecursive(this.resolvePath('crusher:/'));
			}
			
			callback();
		},
		
		/**
		 * tells you if there is such a file
		 *
		 * 
		 */
		ensurePathExists: function(path, callback) {
			
			var system = this;
			
			var fullPath = this.resolvePath(path);
			
			this.stat(fullPath, function(err, stat) {
				
				var exists = !err && stat!=null;
				
				// if it exists then don't make it
				if(exists) {
					callback();
				} else {
					fs.mkdir(fullPath, 0777, function (err) {
						
						fs.chown(fullPath, system.config('system_uid'), system.config('system_gid'), function() {
						
							fs.chmod(fullPath, 0775, function() {
								callback(err);
							});
							
						});
						
		            });
				}
				
			});
			
		},
		
		/*
		 * exec the given string and return the stdout
		 */
		runProgram: function(command, args, finishedCallback) {
			
			var programPath = this.resolvePath('root:/trunk/app/' + command);
			
			var argsString = args.join(' ');
			
			var command = programPath + ' ' + argsString;
			
			this.message('flash', 'program', command);

			child_process.exec(command, finishedCallback);
		},
		
		uuid: function(small) {
			
			var ret = uuid.v4();
			
			if(small) {
				ret = ret.split('-')[0];
			}
			
			return ret;
			
		},
		
		configFactory: function(configs, mainCallback) {
		
			var system = this;
			
			var newFiles = [];
			
			async.forEachSeries(configs, function(file, callback) {
			
				var actualFile = _.isString(file) ? configLoader.filePath(file) : file;
				
				system.message('event', 'config', actualFile);
				newFiles.push(actualFile);
				callback();
				
			}, function() {
				
				require(['ronfig'], function(ronfig) {
					ronfig.factory(newFiles, function(err, conf) {
							
						mainCallback(err, conf);
						
					});
				});
			
			});
			
		},
		
		/**
		 * bootstraps the given server module and runs it
		 *
		 */
		runServer: function(name, config) {
			
			this.message('header', 'Loading Server');
			this.message('event', 'server', name);
			
			require([name], function(serverClass) {
				
				var server = serverClass.factory(config);
				
				server.bind('ready', function() {
					
					server.run();
					
				});
				 
			});
			
		},
		
		
		message: function(type, title, text) {
			
			if(this._silent) { return; }
			
			if(process.env.NODE_ENV=='production') { return; }
			
			return utils.message(type, title, text);
			
		},
		
		log: function(data) {
			
			if(this._silent) { return; }
			
			if(process.env.NODE_ENV=='production') { return; }
			
			console.log(data);
		},
		
		baseDomain: function() {
			return this.config('domain');
		}
	
		
	});
	
	return bootstrapSystem();
	
});