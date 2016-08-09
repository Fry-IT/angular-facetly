(function () {
  'use strict';

  function FacetlyHierarchy(Utils) {

    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'facets/hierarchy.html',
      scope: {
        options: '=',
        allowMultiselect: '=?',
        listMaxItems: '=?',
        onSelectChange: '&'
      },
      link: function (scope) {

        var flatOptions = Utils.flatten(scope.options);

        scope.allowMultiselect = _.isUndefined(scope.allowMultiselect) ? false : scope.allowMultiselect;

        scope.typeaheadSuggestions = _.map(flatOptions, function (option) {
          return option.title;
        });

        scope.addTypeaheadSuggestion = function (suggestion) {
          scope.query = _.isArray(suggestion) ? '' : suggestion;
          scope.onSelectChange({ value: Utils.getFacetIds(suggestion, flatOptions) });
        };

      }
    };
  }

  FacetlyHierarchy.$inject = ['FacetlyUtils'];

  angular.module('ngFacetly')
    .directive('facetlyHierarchy', FacetlyHierarchy);

})();
