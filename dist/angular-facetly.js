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

        scope.options = _.assign({}, DEFAULT_OPTIONS, scope.options);

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

          // Perform validations
          scope.filters = Utils.validateValues(scope.filters);
          var validationPassed = !_.isUndefined(_.find(scope.filters, { isValid: false })) ? false : true;

          scope.errors = Utils.collectValidationErrors(scope.filters);

          if (validationPassed && typeof scope.doSearch === 'function') {
            scope.filteredBy = Utils.updateModel(scope.filters);
            $timeout(function () {
              scope.doSearch();
            });
            scope.typeaheadSuggestions = updateTypeaheadSuggestions(scope.facets, scope.filters);
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

  FacetlyDirective.$inject = ['$timeout', 'FacetlyUtils', 'DEFAULT_OPTIONS'];

  angular.module('ngFacetly')
    .directive('facetly', FacetlyDirective);

})();

(function () {
  'use strict';

  function FacetlyUtils($log) {

    var service = {};

    service.setFilters = function (filteredBy, facets) {
      var filters = [];

      if (_.isObject(filteredBy)) {
        filters = _.chain(facets)
                    .filter(function (facet) {
                      return _.keys(filteredBy).indexOf(facet.id) !== -1;
                    })
                    .map(function (facet) {
                      return _.assign({}, facet, { value: filteredBy[facet.id] });
                    })
                    .value();
      }

      return filters;
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

    service.updateModel = function (filters) {
      var filteredBy = {};

      for (var i = 0; i < filters.length; i++) {
        if (!_.isUndefined(filters[i].value)) {
          filteredBy[filters[i].id] = filters[i].value;
        }
      }

      return filteredBy;
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

    service.validateValues = function (filters) {
      return _.map(filters, function (filter) {
        // Cleanup
        delete filter.isValid;
        delete filter.messages;

        if (filter.validation && filter.validationMessages) {
          _.forEach(filter.validation, function (func, key) {
            if (typeof func === 'function' && !_.isUndefined(filter.validationMessages[key]) && !func(filter.value)) {
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

  FacetlyUtils.$inject = ['$log'];

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

(function () {
  'use strict';

  function FacetlyFilterDirective() {

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
        facets: '=',
        placeholder: '@?',
        allowMultiselect: '=?',
        hideNotFound: '=?',
        listMaxItems: '=?',
        onSelect: '&'
      },
      link: function (scope, element) {
        // move this to a constants file
        var HOT_KEYS = [13, 38, 40, 32, 27, 9]; // arrows up(38) / down(40), enter(13), space(32), tab(9)

        var handleSuggestionSelect = function (value) {
          scope.onSelect({ value: value });
          if (!scope.allowMultiselect) {
            scope.showSuggestions = false;
          }
        };

        var addSuggestionToSelect = function (suggestion) {
          //check or uncheck
          var idx = scope.selected.indexOf(suggestion);
          if (idx === -1) {
            scope.selected = scope.selected.concat([suggestion]);
          } else {
            scope.selected.splice(idx, 1);
          }
        };

        var suggest = function (value, facets) {
          return _.chain(facets)
                  .filter(function (facet) {
                    if (value.length === 0) {
                      return true;
                    } else {
                      return facet.toLowerCase().indexOf(value.toLowerCase()) !== -1;
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

        scope.updateSelectedIndex = function (index) {
          scope.selectedIndex = index;
        };

        scope.removeSelected = function (value) {
          var idx = scope.selected.indexOf(value);
          scope.selected.splice(idx, 1);
        };

        // Watch for keydown events
        element.on('keydown', function (evt) {
          if (scope.suggestions.length === 0 || HOT_KEYS.indexOf(evt.which) === -1) {
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
                addSuggestionToSelect(scope.suggestions[scope.selectedIndex]);
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
            scope.selectedIndex = -1;
            scope.suggestions = suggest(value, scope.facets);
            updateSelected(value);
          }
        });

        // Watch the facets
        scope.$watch('facets', function (value) {
          scope.suggestions = value.slice();
        });

        // Hide the typeahead when clicking outside of the input
        $document.on('click', function (evt) {
          if (evt.which !== 3 && element.find('input')[0] !== evt.target) {
            scope.$apply(function () {
              scope.showSuggestions = false;
            });
          }
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

angular.module("ngFacetly").run(["$templateCache", function($templateCache) {$templateCache.put("angular-facetly.html","<div class=\"facetly\">\n  <div class=\"facetly-search\">\n    <div class=\"facetly-searchbox\">\n      <ul class=\"facetly-filters\">\n        <facetly-filter\n          ng-repeat=\"filter in filters\"\n          filter=\"filter\"\n          list-max-items=\"options.listMaxItems\"\n          on-filter-remove=\"removeFilter(id)\"\n          on-do-search=\"search()\"\n          should-focus=\"filters.indexOf(filter) === focusIndex\" />\n      </ul>\n\n      <facetly-typeahead\n        ng-show=\"filters.length !== facets.length\"\n        query=\"query\"\n        facets=\"typeaheadSuggestions\"\n        hide-not-found=\"options.defaultFacet && !filters.length\"\n        on-select=\"addTypeaheadSuggestion(value)\"\n        placeholder=\"{{options.placeholder}}\" />\n    </div>\n\n    <div class=\"facetly-buttons\">\n      <a href=\"\" class=\"facetly-button facetly-button-success\" ng-click=\"search()\">Search</a>\n      <a class=\"facetly-button facetly-button-danger\" href=\"\" ng-if=\"filters.length\" ng-click=\"removeAllFilters()\">Remove all</a>\n    </div>\n  </div>\n\n  <p class=\"facetly-hint-text facetly-text-gray\">Hint: You can use advanced search keywords to more easily find what you’re looking for. <a href=\"\" ng-click=\"showFacets=!showFacets\">What keywords can I use?</a></p>\n\n  <p class=\"facetly-hint-text facetly-text-danger\" ng-show=\"errors.length\">\n    Please correct the following errors before continuing:\n    <ul>\n      <li ng-repeat=\"error in errors\" ng-bind=\"error\"></li>\n    </ul>\n  </p>\n\n  <ul class=\"facetly-facets\" ng-show=\"showFacets\">\n    <li ng-repeat=\"facet in facets | filter:availableFacets\">\n      <a class=\"facetly-facet\" href=\"\" title=\"\" ng-click=\"addFilter(facet)\" ng-bind=\"facet.label\"></a>\n    </li>\n  </ul>\n</div>\n");
$templateCache.put("facets/hierarchy.html","<div class=\"facetly-hierarchy\">\n\n  <facetly-typeahead\n    allow-multiselect=\"allowMultiselect\"\n    query=\"query\"\n    facets=\"typeaheadSuggestions\"\n    on-select=\"addTypeaheadSuggestion(value)\"\n    list-max-items=\"listMaxItems\"\n    placeholder=\"Start typing to filter...\" />\n\n</div>\n");
$templateCache.put("facets/select.html","<div class=\"facetly-select\">\n\n  <facetly-typeahead\n    allow-multiselect=\"allowMultiselect\"\n    query=\"query\"\n    facets=\"typeaheadSuggestions\"\n    on-select=\"addTypeaheadSuggestion(value)\"\n    list-max-items=\"listMaxItems\"\n    placeholder=\"Start typing to filter...\" />\n\n</div>\n");
$templateCache.put("filter/filter.html","<li ng-class=\"{\'facetly-validation-error\': filter.isValid === false}\">\n  <span class=\"facetly-facet\">\n    <a class=\"facetly-icon facetly-text-danger\" href=\"\" tabindex=\"-1\" ng-click=\"remove()\"> &times; </a>\n    {{::filter.label}}:\n  </span>\n  <span class=\"facetly-value\" ng-switch=\"filter.type\">\n    <facetly-select ng-switch-when=\"select\" options=\"filter.options\" allow-multiselect=\"filter.multiselect\" on-select-change=\"updateFilterValue(value)\" list-max-items=\"listMaxItems\" />\n    <facetly-hierarchy ng-switch-when=\"hierarchy\" options=\"filter.options\" allow-multiselect=\"filter.multiselect\" on-select-change=\"updateFilterValue(value)\" list-max-items=\"listMaxItems\" />\n    <input ng-switch-default type=\"text\" class=\"facetly-form-control\" ng-model=\"filter.value\" />\n  </span>\n</li>\n");
$templateCache.put("typeahead/typeahead.html","<div class=\"facetly-typeahead\">\n  <div class=\"facetly-typeahead-selected\" ng-show=\"showSelected\">\n    <span ng-repeat=\"value in selected\">\n      <a class=\"facetly-icon facetly-text-danger\" href=\"\" tabindex=\"-1\" ng-click=\"removeSelected(value)\">&times;</a> {{value}}\n    </span>\n  </div>\n\n  <input\n    class=\"facetly-form-control\"\n    type=\"text\"\n    ng-model=\"query\"\n    ng-focus=\"showSuggestions=true\"\n    ng-click=\"showSuggestions=true\"\n    placeholder=\"{{placeholder}}\">\n\n  <div class=\"facetly-typeahead-suggestions\" ng-show=\"showSuggestions && (!listMaxItems || (listMaxItems && listMaxItems >= suggestions.length))\">\n    <ul>\n      <li class=\"facetly-suggestion\" ng-repeat=\"suggestion in suggestions\"\n        ng-class=\"{\'selected\': suggestions.indexOf(suggestion) === selectedIndex}\"\n        ng-mouseenter=\"updateSelectedIndex(suggestions.indexOf(suggestion))\">\n          <a href=\"\" ng-click=\"addSuggested(suggestion)\">\n            <span ng-if=\"allowMultiselect && selected.indexOf(suggestion) !== -1\">&#10004;</span>\n            <span ng-bind-html=\"suggestion | facetlyHighlight:query\"></span>\n          </a>\n      </li>\n      <li ng-show=\"query.length && !suggestions.length && !hideNotFound\">\n        <span>No match found...</span>\n      </li>\n    </ul>\n  </div>\n</div>\n");}]);