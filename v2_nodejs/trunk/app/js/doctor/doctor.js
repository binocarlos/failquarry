/**
 * @class 		doctor
 * @filename   	doctor/doctor.js
 * @package    	quarryscript
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2012 Webkit Ltd
 * @license    	http://jquarry.com/license
 *
 * 
 * if a script is wrong - you take it to the doctor
 *
 * this will write out the offending script to a file with an exports.run wrapper
 *
 * it will then run the script using the external doctor script i.e. seperate process
 *
 * the diagnosis is returned as a JASON string
 * 
 *
 *
 */

define([

	'base',
	
	'underscore',
	
	'async',
	
	'system',
	
	'temp',
	
	'fs'
	
	
], function(

	base,
	
	_,
	
	async,
	
	systemClass,
	
	temp,
	
	fs
	
) {
	
	var system = systemClass.instance();
	
	var getStackMessage = function(diagnosis, source) {
	
		if(!diagnosis) {
			return 'there is no diagnosis';
		}
		
		return diagnosis;
		
	    var parts = source.split("\n");
		var stack = diagnosis.split("\n");
	    
	    var lineNumber = null;
	    var column = null;
	    
	    var lastLine = null;
	    var message = null;
	    var match;
	    
	    for(var i in stack) {
	    	var line = stack[i];

	    	if(match=line.match(/\.js:(\d+):(\d+)/)) {

	    		lineNumber = match[1];
	    		column = match[2];
	    		message = lastLine;
	    		break;
	    	}
	    	
	    	lastLine = line;
	    }
	    
	    if(lineNumber==null) {
	    	return 'no stack dump: ' + 	diagnosis;
	    }
	   		
	    var sourceLine = parts[lineNumber-1];
	    var previousLineNumber = lineNumber-2;
	    var nextLineNumber = lineNumber;
	    	
	    var prevs = [];
	    var nexts = [];
	    	
	    while(previousLineNumber>=0 && prevs.length<5) {
	    	prevs.push(parts[previousLineNumber]);
	    	previousLineNumber--;
	    };
	    	
	    while(nextLineNumber<parts.length-1 && nexts.length<5) {
	    	nexts.push(parts[nextLineNumber]);
	    	nextLineNumber++;
	    };
	    	
	    var previousLines = prevs.reverse().join("\n");
	    var nextLines = nexts.join("\n");
	    	
	    var spacesMatch = sourceLine.match(/^(\s+)/);
	    	
	    var spacesOffset = 0;
	    	
	    if(spacesMatch) {
	    	sourceLine = sourceLine.replace(/^(\s+)/, '');
	    	spacesOffset = spacesMatch[1].length;
	    }
	    		
	    var fullMessage = message + "\n---------------------------\n";
	    fullMessage += 'someoneSortOutThisFileName.js (line: ' + lineNumber + ', col: ' + column + ')';
	    fullMessage += "\n---------------------------\n";
	    fullMessage += previousLines + "\n";
	    fullMessage += "\n---------------------------\n";
	    fullMessage += sourceLine + "\n";
	    	
	    var spaces = '';
	    for(var i=0; i<(column-spacesOffset)-1; i++) {
	    	spaces += ' ';	
	    }
	    	
	    fullMessage += spaces + '^^^^^^^^^^^^';
	    fullMessage += "\n---------------------------\n";
	    fullMessage += nextLines + "\n";
	    
	    return fullMessage;
	};
	
	return base.extend({
		
		/*
		 * @static
		 * generic factory to make a new instance of the given class
	  	 */
		factory: function() {
			
			return new this.prototype.constructor();
			
		}
		
	}, {
		
		name:'Quarry Doctor',
		
		/*
		 * the code that is run first within the doctor script
		 * this exposes the sandbox so the diagnosed script has the samr environment as it was designed to run in
		 * (i.e. a quarryscript pool thread)
		 */
		_bootcode:null,
		
		init: function() {
			
		},
		
		/*
		 * patient is the source code to get error data for
		 */
		diagnose: function(patient, exception, finishedCallback) {
			
			var doctor = this;
			
			async.waterfall([

				// first up - lets load up the sandbox environment if we have one
				function(next) {
					if(patient.bootCodePath) {
						fs.readFile(patient.bootCodePath, 'utf8', function(error, bootCode) {
							if(error) {
								console.log('Error Reading Boot Code File');
								return;
							}
							
							next(null, bootCode);
						});
					}
					else {
						next();	
					}
				},
				
				// now we take a look at the patient and decide what to do
				function(bootCode, next) {
				
					var script = bootCode ? (bootCode + "\n") : '';
					
					if(patient.sickCode) {
						script = script.replace(/\/\/DOCTOR[\w\W]*?\/\/DOCTOR/i, patient.sickCode);
					}
					
					// boot the document
					script += [
						'this.thread.emit("parseDoctorDocument",',
							'"doctor",',
							JSON.stringify(patient.documentSource),
						');'
					].join("\n");
					
					// output whole thing to file
					system.tempFile({
						suffix:'.js'
					}, script, function(error, scriptPath) {
						
						// we have created the patient file - run the doctor script against it
						system.runProgram('doctor', [scriptPath], function(error, diagnosis, stderr) {
							
							var st = '' + (error || diagnosis);
							
							st += "\n" + exception;

							next(error, getStackMessage(st, script));
							
						});
						
						
					});
				}
				
			], finishedCallback);
		}
		
	});
	
});