(function () {
  'use strict';

  function FacetlySelect(Utils) {

    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'facets/select.html',
      scope: {
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
          scope.query = _.isArray(suggestion) ? '' : suggestion;
          scope.onSelectChange({ value: Utils.getFacetIds(suggestion, scope.options) });
        };

      }
    };
  }

  FacetlySelect.$inject = ['FacetlyUtils'];

  angular.module('ngFacetly')
    .directive('facetlySelect', FacetlySelect);

})();
