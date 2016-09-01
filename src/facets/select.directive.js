(function () {
  'use strict';

  function FacetlySelect() {

    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'facets/select.html',
      scope: {
        value: '=?',
        options: '=',
        allowMultiselect: '=?',
        listMaxItems: '=?',
        onSelectChange: '&'
      },
      link: function (scope) {

        scope.allowMultiselect = _.isUndefined(scope.allowMultiselect) ? false : scope.allowMultiselect;

        scope.addTypeaheadSuggestion = function (suggestion) {
          scope.onSelectChange({ value: suggestion });
        };

      }
    };
  }

  angular.module('ngFacetly')
    .directive('facetlySelect', FacetlySelect);

})();
