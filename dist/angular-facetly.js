(function () {
  'use strict';

  angular.module('ngFacetly', ['angular-lodash']);

})();

(function () {
  'use strict';

  var defaultOptions = {
    placeholder: 'Search by...',
    listMaxItems: 0
  };

  angular.module('ngFacetly')
    .constant('DEFAULT_OPTIONS', defaultOptions);

})();

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

        scope.addDefaultFilter = function(value) {
          if (Utils.findFilterByKey(scope.filters, 'id', scope.options.defaultFacet) !== -1) {
            return;
          }

          var idx = Utils.findFilterByKey(scope.facets, 'id', scope.options.defaultFacet);
          if (idx !== -1) {
            scope.filters.push(_.assign(scope.facets[idx], { value: value.title }));
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

(function () {
  'use strict';

  function FacetlyUtils($log, $q) {

    var service = {};

    service.setFilters = function (filteredBy, facets) {
      var filters = [];

      if (_.isObject(filteredBy)) {
        filters = _.chain(facets)
                    .filter(function (facet) {
                      return _.keys(filteredBy).indexOf(facet.id) !== -1;
                    })
                    .filter(function (facet) {
                      return facet.isLoading === false;
                    })
                    .map(function (facet) {
                      return service.setFilter(filteredBy, facet);
                    })
                    .value();
      }

      return filters;
    };

    service.setFilter = function (filteredBy, facet) {
      if (!_.has(filteredBy, facet.id)) {
        return;
      }

      if (facet.type === 'select' || facet.type === 'hierarchy') {
        if (facet.multiselect) {
          return _.assign(
            {},
            facet,
            {
              value: _.map(filteredBy[facet.id], function (f) {
                return { id: f, title: _.find(facet.options, { id: f }).title };
              })
            }
          );
        } else {
          return _.assign(
            {},
            facet,
            {
              value: {
                id: filteredBy[facet.id],
                title: _.find(facet.options, { id: filteredBy[facet.id] }).title
              }
            }
          );
        }
      } else {
        return _.assign({}, facet, { value: filteredBy[facet.id] });
      }
    };

    service.setFacets = function (facets, facetLoadedCallback) {
      return _.map(facets, function (facet) {
        facet.isLoading = true;
        $q.when(typeof facet.options === 'function' ? facet.options() : facet.options)
          .then(function (results) {
            facet.options = results;
            facet.isLoading = false;
            if (_.isFunction(facetLoadedCallback)) {
              facetLoadedCallback(facet);
            }
          });

        return facet;
      });
    };

    service.findFilterByKey = function (filters, key, value) {
      //rewrite using _.find
      return _.findIndex(filters, function (filter) {
        return filter[key] === value;
      });
    };

    service.addFilter = function (filters, filter) {
      var idx = this.findFilterByKey(filters, 'id', filter.id);

      return idx === -1 ? filters.concat([filter]) : filters;
    };

    service.removeFilter = function (filters, key) {
      var idx = this.findFilterByKey(filters, 'id', key);

      return idx !== -1 ? filters.slice(0, idx).concat(filters.slice(idx + 1)) : filters;
    };

    service.removeAllFilters = function () {
      return [];
    };

    service.getValues = function (value, type) {
      if (type === 'select' || type === 'hierarchy') {
        if (_.isArray(value)) {
          value = _.map(value, function (v) {
            return v.id;
          });
        } else if (_.isObject(value)) {
          value = value.id;
        }
      }

      return value;
    };

    service.updateModel = function (filters) {
      var filteredBy = {};

      for (var i = 0; i < filters.length; i++) {
        if (!_.isUndefined(filters[i].value)) {
          filteredBy[filters[i].id] = service.getValues(filters[i].value, filters[i].type);
        }
      }

      return filteredBy;
    };

    service.updateAppliedFilters = function (filters) {
      var appliedFilters = {};

      for (var i = 0; i < filters.length; i++) {
        if (!_.isUndefined(filters[i].value)) {
          appliedFilters[filters[i].label] = this.getValueForFilterByType(filters[i]);
        }
      }

      return appliedFilters;
    };

    service.getValueForFilterByType = function (filter) {
      switch (filter.type) {
        case 'select':
          if (filter.multiselect) {
            return _.map(filter.value, function (v) { return v.title; });
          } else {
            return filter.value.title;
          }
          break;
        case 'hierarchy':
          if (filter.multiselect) {
            return _.map(filter.value, function (v) { return v.title; });
          } else {
            return filter.value.title;
          }
          break;
        default:
          return filter.value;
      }
    };

    service.flatten = function (array, flat) {
      flat = [] || flat;
      _.forEach(array, function (item) {
        flat.push({ id: item.id, title: item.title });

        if (item.categories && item.categories.length) {
          flat = flat.concat(service.flatten(item.categories, flat));
        }
      });

      return flat;
    };

    service.getFacetIds = function (value, available) {
      if (_.isArray(value)) {
        return value.map(function (v) {
          return _.find(available, { title: v }).id;
        });
      } else {
        return _.find(available, { title: value }).id;
      }
    };

    service.validateValues = function (filters, filteredBy) {
      return _.map(filters, function (filter) {
        filter = _.assign({}, filter);

        // Cleanup
        delete filter.isValid;
        delete filter.messages;

        if (filter.validation && filter.validationMessages) {
          _.forEach(filter.validation, function (func, key) {
            if (typeof func === 'function' && !_.isUndefined(filter.validationMessages[key]) && !func(filteredBy[filter.id])) {
              filter.isValid = false;
              filter.messages = filter.messages || [];
              filter.messages.push(filter.validationMessages[key]);
            }
          });
        }

        return filter;
      });
    };

    service.collectValidationErrors = function (filters) {
      return _.chain(filters)
              .filter(function (filter) {
                return filter.messages && filter.messages.length;
              })
              .map(function (filter) {
                var errors = [];
                _.forEach(filter.messages, function (message) {
                  errors.push(filter.label + ': ' + message);
                });

                return errors;
              })
              .flatten()
              .value();
    };

    return service;
  }

  FacetlyUtils.$inject = ['$log', '$q'];

  angular.module('ngFacetly')
    .service('FacetlyUtils', FacetlyUtils);

})();

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

        scope.typeaheadSuggestions = _.map(scope.options, function (option) {
          return option.title;
        });

        scope.addTypeaheadSuggestion = function (suggestion) {
          scope.onSelectChange({ value: suggestion });
        };

      }
    };
  }

  angular.module('ngFacetly')
    .directive('facetlySelect', FacetlySelect);

})();

(function () {
  'use strict';

  function FacetlyFilterDirective($timeout) {

    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'filter/filter.html',
      scope: {
        filter: '=',
        listMaxItems: '=?',
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
        });

        // Watch for focus
        scope.$watch(attrs.shouldFocus, function (value) {
          if (value === true) {
            element.find(tagName)[0].focus();
            scope[attrs.shouldFocus] = false;
          }
        });

        // Handle the filter update from a select/multiselect
        scope.updateFilterValue = function (value) {
          scope.filter.value = value;
          $timeout(function() {
            scope.onDoSearch();
          });
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

  FacetlyFilterDirective.$inject = ['$timeout'];

  angular.module('ngFacetly')
    .directive('facetlyFilter', FacetlyFilterDirective);

})();

(function () {
  'use strict';

  function FacetlyHighlight($sce, $injector, $log) {

    // Courtesy of https://github.com/angular-ui/bootstrap/blob/master/src/typeahead/typeahead.js
    var isSanitizePresent;
    isSanitizePresent = $injector.has('$sanitize');

    function escapeRegexp(query) {
      // Regex: capture the whole query string and replace it with the string that will be used to match
      // the results, for example if the capture is "a" the result will be \a
      return query.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1');
    }

    function containsHtml(value) {
      return /<.*>/g.test(value);
    }

    var filter = function (value, query) {
      if (!isSanitizePresent && containsHtml(value)) {
        $log.warn('Unsafe use of typeahead please use ngSanitize'); // Warn the user about the danger
      }

      value = query ? ('' + value).replace(new RegExp(escapeRegexp(query), 'gi'), '<strong>$&</strong>') : value; // Replaces the capture string with a the same string inside of a "strong" tag
      if (!isSanitizePresent) {
        value = $sce.trustAsHtml(value); // If $sanitize is not present we pack the string in a $sce object for the ng-bind-html directive
      }

      return value;
    };

    return filter;
  }

  FacetlyHighlight.$inject = ['$sce', '$injector', '$log'];

  angular.module('ngFacetly')
    .filter('facetlyHighlight', FacetlyHighlight);

})();

(function () {
  'use strict';

  function FacetlyTypeaheadDirective($timeout, $document) {

    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'typeahead/typeahead.html',
      scope: {
        query: '=',
        value: '=?',
        facets: '=',
        placeholder: '@?',
        allowMultiselect: '=?',
        doNotForceOptions: '@?',
        resetOnSelect: '@?',
        hideNotFound: '=?',
        listMaxItems: '=?',
        onSelect: '&'
      },
      link: function (scope, element) {
        // move this to a constants file
        var HOT_KEYS = [13, 38, 40, 32, 27, 9]; // arrows up(38) / down(40), enter(13), space(32), tab(9)

        var handleSuggestionSelect = function (value) {
          // Allow setting the value of a query
          if (_.isUndefined(value) && scope.doNotForceOptions) {
            scope.onSelect({ value: {title: scope.query }});
          } else {
            scope.onSelect({ value: value });
          }

          if (!scope.allowMultiselect) {
            scope.showSuggestions = false;
          }

          if (scope.resetOnSelect) {
            scope.query = '';
          } else {
            if (!_.isUndefined(value)) {
              scope.query = _.isArray(value) ? '' : value.title;
            }
          }
        };

        var addSuggestionToSelect = function (suggestion) {
          //check or uncheck
          var item = _.find(scope.selected, { id: suggestion.id });
          if (_.isUndefined(item)) {
            scope.selected = scope.selected.concat([suggestion]);
          } else {
            scope.selected = _.without(scope.selected, suggestion);
          }
        };

        var suggest = function (value, facets) {
          return _.chain(facets)
                  .filter(function (facet) {
                    if (value.length === 0) {
                      return true;
                    } else {
                      return facet.title.toLowerCase().indexOf(value.toLowerCase()) !== -1;
                    }
                  })
                  .value();
        };

        var updatePosition = function (idx) {
          var target = element.find('ul').children('li')[idx];
          $timeout(function () {
            element.find('ul')[0].scrollTop = target.offsetTop - target.offsetHeight;
          });
        };

        var updateSelected = function (selected) {
          if (_.isArray(selected) && selected.length > 0) {
            scope.selected = selected;
            scope.query = '';
            scope.showSelected = true;
          }
        };

        scope.suggestions = [];
        scope.selectedIndex = -1;

        if (scope.allowMultiselect) {
          scope.selected = [];
        }

        scope.showSuggestions = false;

        scope.addSuggested = function (suggestion) {
          if (scope.allowMultiselect) {
            addSuggestionToSelect(suggestion);
            handleSuggestionSelect(scope.selected);
            updateSelected(scope.selected);
          } else {
            handleSuggestionSelect(suggestion);
          }
        };

        scope.updateSelectedIndex = function (suggestion) {
          scope.selectedIndex = _.findIndex(scope.suggestions, { id: suggestion.id });
        };

        scope.removeSelected = function (value) {
          scope.selected = _.without(scope.selected, value);
          handleSuggestionSelect(scope.selected);
        };

        scope.isSelected = function (suggestion) {
          return _.findIndex(scope.selected, { id: suggestion.id }) !== -1;
        };

        // Watch for keydown events
        element.on('keydown', function (evt) {
          if (scope.suggestions.length === 0 || HOT_KEYS.indexOf(evt.which) === -1) {
            if (scope.query && scope.query.length > 0 && evt.which === 13) {
              handleSuggestionSelect();
              scope.$apply();
            }

            return;
          }

          // evt.stopPropagation();
          // evt.preventDefault();

          switch (evt.which) {
            case 38: // up arrow
              if (scope.selectedIndex > 0) {
                scope.selectedIndex--;
                updatePosition(scope.selectedIndex);
              }

              break;
            case 40: // down arrow
              if (scope.selectedIndex < scope.suggestions.length - 1) {
                scope.selectedIndex++;
                updatePosition(scope.selectedIndex);
              }

              break;
            case 32: // space bar
              if (scope.allowMultiselect) {
                scope.addSuggested(scope.suggestions[scope.selectedIndex]);
              }

              break;
            case 27: // esc
              scope.showSuggestions = false;

              break;

            case 9: //tab
              if (scope.allowMultiselect) {
                handleSuggestionSelect(scope.selected);
                updateSelected(scope.selected);
                scope.showSuggestions = false;
              }

              break;

            default:
              if (evt.which === 13) {
                // Is this a multiselect?
                if (scope.allowMultiselect && scope.selected.length > 0) {
                  updateSelected(scope.selected);
                  handleSuggestionSelect(scope.selected);
                } else if (!scope.allowMultiselect && scope.selectedIndex > -1) {
                  handleSuggestionSelect(scope.suggestions[scope.selectedIndex]);
                }
              }

              break;
          }

          scope.$apply();
        });

        // Watch the query
        scope.$watch('query', function (value, oldValue) {
          if (value !== oldValue || value === '') {
            // try to optimize how many letters to initiate the search after
            if (
              (scope.suggestions.length > 1000 && value.length > 5) ||
              (scope.suggestions.length > 500 && value.length > 3) ||
              (scope.suggestions.length > 100 && value.length > 2) ||
              (scope.suggestions.length <= 100 && value.length > -1)
            ) {
              scope.selectedIndex = -1;
              scope.suggestions = suggest(value, scope.facets);
              updateSelected(value);
            }
          }
        });

        // Watch the facets
        scope.$watch('facets', function (value) {
          scope.suggestions = value.slice();
        });

        scope.$watch('value', function (value) {
          if (!_.isUndefined(value)) {
            scope.suggestions = scope.facets.slice();
            if (_.isArray(value)) {
              scope.selected = [];
              _.forEach(value, function (v) {
                addSuggestionToSelect(v);
                handleSuggestionSelect(scope.selected);
                scope.showSelected = true;
              });
            } else {
              handleSuggestionSelect(scope.value);
            }
          }
        }, true);

        // Hide the typeahead when clicking outside of the input
        // this has to be delayed so that it doesn't react to clicks
        // before the typeahead is set up
        $timeout(function() {
          $document.on('click', function (evt) {
            if (evt.which !== 3 && element.find('input')[0] !== evt.target) {
              scope.showSuggestions = false;
              scope.$apply();
            }
          });
        });

        // Cleanup
        scope.$on('$destroy', function () {
          element.off('keydown');
        });
      }
    };
  }

  FacetlyTypeaheadDirective.$inject = ['$timeout', '$document'];

  angular.module('ngFacetly')
    .directive('facetlyTypeahead', FacetlyTypeaheadDirective);

})();

angular.module('ngFacetly').run(['$templateCache', function($templateCache) {$templateCache.put('angular-facetly.html','<div class="facetly">\n  <div class="facetly-search">\n    <div class="facetly-searchbox">\n      <ul class="facetly-filters">\n        <facetly-filter\n          ng-repeat="filter in filters"\n          filter="filter"\n          list-max-items="options.listMaxItems"\n          on-filter-remove="removeFilter(id)"\n          on-do-search="search()"\n          should-focus="filters.indexOf(filter) === focusIndex" />\n      </ul>\n\n      <facetly-typeahead\n        ng-show="filters.length !== facets.length"\n        query="query"\n        facets="typeaheadSuggestions"\n        hide-not-found="options.defaultFacet && !filters.length"\n        reset-on-select="true"\n        do-not-force-options="true"\n        on-select="addTypeaheadSuggestion(value)"\n        placeholder="{{options.placeholder}}" />\n    </div>\n\n    <div class="facetly-buttons">\n      <a href="" class="facetly-button facetly-button-success" ng-click="search()">Search</a>\n      <a class="facetly-button facetly-button-danger" href="" ng-if="filters.length" ng-click="removeAllFilters()">Remove all</a>\n    </div>\n  </div>\n\n  <p class="facetly-hint-text facetly-text-gray">Hint: You can use advanced search keywords to more easily find what you\u2019re looking for. <a href="" ng-click="showFacets=!showFacets">What keywords can I use?</a></p>\n\n  <p class="facetly-hint-text facetly-text-danger" ng-show="errors.length">\n    Please correct the following errors before continuing:\n    <ul>\n      <li ng-repeat="error in errors" ng-bind="error"></li>\n    </ul>\n  </p>\n\n  <ul class="facetly-facets" ng-show="showFacets">\n    <li ng-repeat="facet in facets | filter:availableFacets">\n      <a class="facetly-facet" href="" title="" ng-click="addFilter(facet)" ng-bind="facet.label"></a>\n    </li>\n  </ul>\n</div>\n');
$templateCache.put('facets/hierarchy.html','<div class="facetly-hierarchy">\n\n  <facetly-typeahead\n    allow-multiselect="allowMultiselect"\n    query="query"\n    facets="typeaheadSuggestions"\n    on-select="addTypeaheadSuggestion(value)"\n    list-max-items="listMaxItems"\n    placeholder="Start typing to filter..." />\n\n</div>\n');
$templateCache.put('facets/select.html','<div class="facetly-select">\n\n  <facetly-typeahead\n    allow-multiselect="allowMultiselect"\n    query="query"\n    value="value"\n    facets="options"\n    on-select="addTypeaheadSuggestion(value)"\n    list-max-items="listMaxItems"\n    placeholder="Start typing to filter..." />\n\n</div>\n');
$templateCache.put('filter/filter.html','<li ng-class="{\'facetly-validation-error\': filter.isValid === false}">\n  <span class="facetly-facet">\n    <a class="facetly-icon facetly-text-danger" href="" tabindex="-1" ng-click="remove()"> &times; </a>\n    {{::filter.label}}:\n  </span>\n  <span class="facetly-value" ng-switch="filter.type">\n    <facetly-select ng-switch-when="select" options="filter.options" allow-multiselect="filter.multiselect" on-select-change="updateFilterValue(value)" list-max-items="listMaxItems" value="filter.value" />\n    <facetly-hierarchy ng-switch-when="hierarchy" options="filter.options" allow-multiselect="filter.multiselect" on-select-change="updateFilterValue(value)" list-max-items="listMaxItems" value="filter.value" />\n    <input ng-switch-default type="text" class="facetly-form-control" ng-model="filter.value" />\n  </span>\n</li>\n');
$templateCache.put('typeahead/typeahead.html','<div class="facetly-typeahead">\n  <div class="facetly-typeahead-selected" ng-show="showSelected">\n    <span ng-repeat="value in selected">\n      <a class="facetly-icon facetly-text-danger" href="" tabindex="-1" ng-click="removeSelected(value)">&times;</a> {{value.title}}\n    </span>\n  </div>\n\n  <input\n    class="facetly-form-control"\n    type="text"\n    ng-model="query"\n    ng-focus="showSuggestions=true"\n    placeholder="{{placeholder}}">\n\n  <div class="facetly-typeahead-suggestions" ng-if="showSuggestions && (!listMaxItems || (listMaxItems && listMaxItems >= suggestions.length))">\n    <ul>\n      <li class="facetly-suggestion"\n        ng-class="{\'last\': $last, \'selected\': $index === selectedIndex}"\n        ng-repeat="suggestion in suggestions track by $index"\n        ng-mouseenter="updateSelectedIndex(suggestion)">\n          <a href="" ng-click="addSuggested(suggestion)">\n            <span ng-if="allowMultiselect && isSelected(suggestion)">&#10004;</span>\n            <span ng-bind-html="suggestion.title | facetlyHighlight:query"></span>\n          </a>\n      </li>\n      <li class="last" ng-show="query.length && !suggestions.length && !hideNotFound">\n        <span>No match found...</span>\n      </li>\n    </ul>\n  </div>\n</div>\n');}]);