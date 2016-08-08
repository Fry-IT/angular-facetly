(function () {
  'use strict';

  function FacetlyFilterDirective() {

    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'filter/filter.html',
      scope: {
        filter: '=',
        onFilterRemove: '&',
        onDoSearch: '&'
      },
      link: function (scope, element, attrs) {

        var tagName;

        switch (scope.filter.type) {
          case 'select':
            tagName = 'input';
            break;
          default:
            tagName = 'input';
            break;
        }

        // Watch for keydown events
        element.on('keydown', function (event) {
          if (scope.filter.value === 0 || event.which !== 13 /* the enter key*/) {
            return;
          }

          event.preventDefault();

          scope.onDoSearch();
          scope.$apply();
        });

        // Watch for focus
        scope.$watch(attrs.shouldFocus, function (value, oldValue) {
          if (value === true) {
            element.find(tagName)[0].focus();
            scope[attrs.shouldFocus] = false;
          }
        });

        // Handle the filter update from a select/multiselect
        scope.updateFilterValue = function (value) {
          scope.filter.value = value;
        };

        // Handle the filter removal
        scope.remove = function () {
          scope.onFilterRemove({ id: scope.filter.id });
        };

        scope.$on('$destroy', function () {
          element.off('keydown');
        });

      }
    };
  }

  angular.module('ngFacetly')
    .directive('facetlyFilter', FacetlyFilterDirective);

})();
