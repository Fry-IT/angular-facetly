(function () {
  'use strict';

  function FacetlyDirective($timeout, Utils, DEFAULT_OPTIONS) {

    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'angular-facetly.html',
      scope: {
        options: '=?',
        filteredBy: '=ngModel',
        appliedFilters: '=',
        unformattedFacets: '=facets',
        doSearch: '&?'
      },
      link: function (scope) {

        var updateTypeaheadSuggestions = function (facets, filters) {
          return _.chain(facets)
                  .filter(function (facet) {
                    if (
                      facet.type === 'text' ||
                      (facet.type !== 'text' && _.isArray(facet.options))
                    ) {
                      return _.findIndex(filters, { id: facet.id }) === -1;
                    } else {
                      return false;
                    }
                  })
                  .map(function (facet) {
                    return { id: facet.id, title: facet.label };
                  })
                  .value();
        };

        scope.options = _.assign({}, DEFAULT_OPTIONS, scope.options);

        scope.facets = Utils.setFacets(scope.unformattedFacets, function(facet) {
          var filter = Utils.setFilter(scope.filteredBy, facet);
          if (!_.isUndefined(filter)) {
            scope.addFilter(filter);
            scope.appliedFilters = Utils.updateAppliedFilters(scope.filters);
          }
        });

        // This is not needed as each facet will setup itself
        // scope.filters = Utils.setFilters(scope.filteredBy, scope.facets);
        scope.filters = [];

        scope.typeaheadSuggestions = updateTypeaheadSuggestions(scope.unformattedFacets, scope.filters);

        scope.addFilter = function (facet) {
          scope.filters = Utils.addFilter(scope.filters, facet);
        };

        scope.removeFilter = function (key) {
          scope.filters = Utils.removeFilter(scope.filters, key);
          scope.search();
        };

        scope.removeAllFilters = function () {
          scope.filters = Utils.removeAllFilters();
          scope.search();
        };

        scope.availableFacets = function (facet) {
          var filters = scope.filters || [];
          return facet.isLoading !== true && _.findIndex(filters, { id: facet.id }) === -1;
        };

        scope.addDefaultFilter = function() {
          if (Utils.findFilterByKey(scope.filters, 'id', scope.options.defaultFacet) !== -1) {
            return;
          }

          $timeout(function() {
            var idx = Utils.findFilterByKey(scope.facets, 'id', scope.options.defaultFacet);
            if (idx !== -1) {
              scope.filters.push(_.assign(scope.facets[idx], { value: scope.query }));
              scope.query = '';
            }
          });
        };

        scope.search = function () {
          // Add default filter
          if (
            scope.filters.length === 0 && // no filters added
            scope.options.defaultFacet.length && // default Facet is present in options
            scope.query && scope.query.length // there is some query entered
          ) {
            scope.addDefaultFilter();
          }

          scope.query = '';

          // Perform validations

          var filteredBy, validationPassed;

          filteredBy = Utils.updateModel(scope.filters);
          scope.filters = Utils.validateValues(scope.filters, filteredBy);

          validationPassed = !_.isUndefined(_.find(scope.filters, { isValid: false })) ? false : true;

          scope.errors = Utils.collectValidationErrors(scope.filters);

          if (validationPassed && typeof scope.doSearch === 'function') {
            scope.filteredBy = filteredBy;
            scope.appliedFilters = Utils.updateAppliedFilters(scope.filters);
            $timeout(function () {
              scope.doSearch();
            });
            scope.typeaheadSuggestions = updateTypeaheadSuggestions(scope.facets, scope.filters);
          }
        };

        scope.addTypeaheadSuggestion = function (suggestion) {
          if (_.isUndefined(suggestion)) {
            scope.addDefaultFilter();
            return;
          }

          var idx = Utils.findFilterByKey(scope.facets, 'id', suggestion.id);
          if (idx !== -1) {
            scope.filters = Utils.addFilter(scope.filters, scope.facets[idx]);
            scope.focusIndex = scope.filters.indexOf(scope.facets[idx]);
            scope.query = '';
            scope.typeaheadSuggestions = updateTypeaheadSuggestions(scope.facets, scope.filters);
          }
        };

        // Wathc the facets
        scope.$watch('facets', function (value, oldValue) {
          if (value !== oldValue) {
            scope.typeaheadSuggestions = updateTypeaheadSuggestions(value, scope.filters);
          }
        }, true);

        // Watch the model
        scope.$watch('filteredBy', function (value, oldValue) {
          if (value !== oldValue) {
            scope.filters = Utils.setFilters(scope.filteredBy, scope.facets);
            scope.appliedFilters = Utils.updateAppliedFilters(scope.filters);
          }
        }, true);

      }
    };
  }

  FacetlyDirective.$inject = ['$timeout', 'FacetlyUtils', 'DEFAULT_OPTIONS'];

  angular.module('ngFacetly')
    .directive('facetly', FacetlyDirective);

})();
