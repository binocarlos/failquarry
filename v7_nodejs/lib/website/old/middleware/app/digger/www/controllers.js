'use strict';

/* Controllers */

function DiggerCtrl($scope, quarry){

	/*
	
		the database connection
		
	*/
	var db = quarry.connect('/db/project');

	var suppliers = db.suppliers();

	$scope.project = suppliers;
	$scope.active = suppliers;

	$scope.$on('containerselect', function(e,container){

		console.log('-------------------------------------------');
		console.log('-------------------------------------------');
		console.log('selected');


		$scope.active = container;
  })

	function load_children(parent){
		if(parent.data('fixed')){
			return;
		}

		container('> *').ship(function(children){
			parent.addchildren(children);

			$scope.$apply();
		})
	}

	/*
	var project = quarry.new('project', {
		name:'Project'
	})

	db('> *').ship(function(topcontainers){
		project.append(topcontainers);
		
	})
*/

}

DiggerCtrl.$inject = ['$scope', 'quarry'];