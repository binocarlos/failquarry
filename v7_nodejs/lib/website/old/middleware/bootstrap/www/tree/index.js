'use strict';

/* Directives */

angular.module('quarry.tree', [])
.directive('tree', function ($compile) {
  return {
    templateUrl: 'tree/index.html',
    restrict: 'E',
    scope: { node: '=' },
    link:function(scope, element, attrs) {
    	element.bind('click', function(event, ui){
    		alert('lcick')
    		$defer(function(){
    			scope.$emit("containerselect", event, scope.node);
    		})
    	})
      
    }
  } 
})