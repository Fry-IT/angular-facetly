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
