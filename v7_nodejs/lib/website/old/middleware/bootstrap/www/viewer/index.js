'use strict';

/* Directives */

angular.module('quarry.viewer', [])
.directive('viewer', function(){
  return {
    templateUrl: 'viewer/index.html',
    restrict: 'E',
    scope: { node: '=' },
    link: function (scope,element,attr) {

    	element.addClass('quarry-viewer');

    	/*
      scope.$watch('cat', function () {
        scope.pics = scope.$eval(attr.pics);
        $(element).carousel({
          interval: 0
        });
      });
			*/
    }
  } 
})