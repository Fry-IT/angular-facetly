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
