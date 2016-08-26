(function () {
  'use strict';

  function FacetlySelect(Utils) {

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

        scope.typeaheadSuggestions = _.map(scope.options, function (option) {
          return option.title;
        });

        scope.addTypeaheadSuggestion = function (suggestion) {
          scope.onSelectChange({ value: suggestion });
        };

      }
    };
  }

  FacetlySelect.$inject = ['FacetlyUtils'];

  angular.module('ngFacetly')
    .directive('facetlySelect', FacetlySelect);

})();
