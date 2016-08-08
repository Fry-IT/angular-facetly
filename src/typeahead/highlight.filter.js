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
