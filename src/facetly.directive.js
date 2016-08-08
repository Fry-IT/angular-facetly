(function () {
  'use strict';

  function FacetlyDirective(Utils) {

    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'angular-facetly.html',
      scope: {
        options: '=?',
        filteredBy: '=ngModel',
        facets: '=',
        doSearch: '&?'
      },
      link: function (scope) {

        var updateTypeaheadSuggestions = function (facets, filters) {
          return _.chain(facets)
                  .filter(function (facet) {
                    return _.findIndex(filters, { id: facet.id }) === -1;
                  })
                  .map(function (facet) {
                    return facet.label;
                  })
                  .value();
        };

        scope.options = _.assign({}, scope.options);

        scope.filters = Utils.setFilters(scope.filteredBy, scope.facets);

        scope.typeaheadSuggestions = updateTypeaheadSuggestions(scope.facets, scope.filters);

        scope.addFilter = function (facet) {
          scope.filters = Utils.addFilter(scope.filters, facet);
        };

        scope.removeFilter = function (key) {
          scope.filters = Utils.removeFilter(scope.filters, key);
        };

        scope.removeAllFilters = function () {
          scope.filters = Utils.removeAllFilters();

          // FIXME: Duplication
          if (typeof scope.doSearch === 'function') {
            scope.filteredBy = Utils.updateModel(scope.filters);
            scope.doSearch();
          }
        };

        scope.availableFacets = function (facet) {
          var filters = scope.filters || [];
          return _.findIndex(filters, { id: facet.id }) === -1;
        };

        scope.search = function () {
          // Add default filter
          if (
            scope.filters.length === 0 && // no filters added
            scope.options.defaultFacet.length && // default Facet is present in options
            scope.query.length // there is some query entered
          ) {
            var idx = Utils.findFilterByKey(scope.facets, 'id', scope.options.defaultFacet);
            if (idx !== -1) {
              scope.filters = [_.assign({}, scope.facets[idx], { value: scope.query })];
            }
          }

          scope.query = '';

          if (typeof scope.doSearch === 'function') {
            scope.filteredBy = Utils.updateModel(scope.filters);
            scope.doSearch();
          }
        };

        scope.addTypeaheadSuggestion = function (suggestion) {
          var idx = Utils.findFilterByKey(scope.facets, 'label', suggestion);
          if (idx !== -1) {
            scope.filters = Utils.addFilter(scope.filters, scope.facets[idx]);
            scope.focusIndex = scope.filters.indexOf(scope.facets[idx]);
            scope.query = '';
            scope.typeaheadSuggestions = updateTypeaheadSuggestions(scope.facets, scope.filters);
          }
        };

        // Watch the model
        scope.$watch('filteredBy', function (value, oldValue) {
          if (value !== oldValue) {
            scope.filters = Utils.setFilters(scope.filteredBy, scope.facets);
          }
        });

      }
    };
  }

  FacetlyDirective.$inject = ['FacetlyUtils'];

  angular.module('ngFacetly')
    .directive('facetly', FacetlyDirective);

})();
