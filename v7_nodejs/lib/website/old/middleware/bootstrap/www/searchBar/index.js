'use strict';

/* Directives */

angular.module('quarry.searchBar', [])
.directive('searchBar', function(){
  return {
    templateUrl: 'searchBar/index.html',
    restrict: 'E',
    link: function (scope,element,attr) {

    	element.addClass('quarry-search-bar');

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