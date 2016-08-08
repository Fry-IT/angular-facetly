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

    service.validateValues = function (values) {
    };

    return service;
  }

  FacetlyUtils.$inject = ['$log'];

  angular.module('ngFacetly')
    .service('FacetlyUtils', FacetlyUtils);

})();
