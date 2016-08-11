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
                    .map(function (facet) {
                      return _.assign({}, facet, { value: filteredBy[facet.id] });
                    })
                    .value();
      }

      return filters;
    };

    service.setFacets = function (facets) {
      return _.map(facets, function (facet) {
        facet = _.assign({}, facet);
        facet.isLoading = true;
        $q.when(typeof facet.options === 'function' ? facet.options() : facet.options)
          .then(function (results) {
            facet.options = results;
            facet.isLoading = false;
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
        filter = _.assign({}, filter);

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

  FacetlyUtils.$inject = ['$log', '$q'];

  angular.module('ngFacetly')
    .service('FacetlyUtils', FacetlyUtils);

})();
