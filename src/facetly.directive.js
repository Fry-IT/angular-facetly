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
        doSearch: '&?',
        doRemoveAll: '&?'
      },
      link: function (scope) {

        var updateTypeaheadSuggestions = function (facets, filters) {
          return _.chain(facets)
                  .filter(function (facet) {
                    if (
                      facet.type === 'text' ||
                      (facet.type !== 'text' && _.isArray(facet._options))
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
          $timeout(function () {
            scope.doRemoveAll();
            scope.search();
          });
        };

        scope.availableFacets = function (facet) {
          var filters = scope.filters || [];
          return facet.isLoading !== true && _.findIndex(filters, { id: facet.id }) === -1;
        };

        scope.addDefaultFilter = function(value) {
          if (Utils.findFilterByKey(scope.filters, 'id', scope.options.defaultFacet) !== -1) {
            return;
          }

          var idx = Utils.findFilterByKey(scope.facets, 'id', scope.options.defaultFacet);
          if (idx !== -1) {
            scope.filters.push(_.assign({}, scope.facets[idx], { value: value.title }));
          }
        };

        scope.search = function () {
          // Add default filter
          if (
            scope.query && scope.query.length // there is some query entered
          ) {
            scope.addDefaultFilter({title: scope.query});
          }

          // Perform validations

          var filteredBy, validationPassed;

          filteredBy = Utils.updateModel(scope.filters, scope.facets, scope.filteredBy);
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
            return;
          }

          // If id is not defined, it is just a query,
          // lets add the default filter if possible
          if (_.isUndefined(suggestion.id)) {
            scope.addDefaultFilter(suggestion);
            scope.search();
            return;
          }

          var idx = Utils.findFilterByKey(scope.facets, 'id', suggestion.id);
          if (idx !== -1) {
            var filter = angular.copy(scope.facets[idx]);
            scope.filters = Utils.addFilter(scope.filters, filter);
            scope.focusIndex = scope.filters.indexOf(filter);
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
          scope.showRemoveAll = !_.isEmpty(value);
          if (value !== oldValue) {
            // Hack - this does not really work.. as as the filteredBy change is triggered from inside too
            scope.focusIndex = -2;
            scope.filters = Utils.setFilters(scope.filteredBy, scope.facets);
            scope.appliedFilters = Utils.updateAppliedFilters(scope.filters);
            scope.typeaheadSuggestions = updateTypeaheadSuggestions(scope.facets, scope.filters);
          }
        }, true);

      }
    };
  }

  FacetlyDirective.$inject = ['$timeout', 'FacetlyUtils', 'DEFAULT_OPTIONS'];

  angular.module('ngFacetly')
    .directive('facetly', FacetlyDirective);

})();
