(function () {
  'use strict';

  function MainController($timeout, $q) {
    var vm = this;

    vm.model = {};

    $timeout(function () {
      // vm.model = { keywords: 'test keyword overwritten' };
      // vm.model.eventType = ['04909235489', '46876342346'];
    }, 2000);

    // vm.model = {
    //   keywords: 'test keyword initial'
    // };

    // vm.model = {};
    vm.appliedFilters = {};

    vm.options = {
      defaultFacet: 'keywords',
      placeholder: 'Filter your events by...',
      listMaxItems: 50
    };

    vm.doSearch = function () {
      vm.showModel = true;
    };

    var promise = function (delay) {
      return $timeout(function () {
        return [
          {
            id: '123123189002',
            title: 'Complete'
          },
          {
            id: '123234613762783189002',
            title: 'In progress'
          },
          {
            id: '126789022378223',
            title: 'Draft'
          },
          {
            id: '4567583456467457',
            title: 'Submitted'
          }
        ];
      }, delay || 3000);
    };

    vm.facets = [
      {
        id: 'keywords',
        label: 'Full text search',
        type: 'text'
      },
      {
        id: 'email',
        label: 'Email',
        type: 'text',
        validation: {
          validEmail: function (value) {
            return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value);
          },
          notEmpty: function (value) {
            return value && value.length > 0;
          }
        },
        validationMessages: {
          validEmail: 'This must be a valid email!',
          notEmpty: 'This field cannot be empty!'
        }
      },
      {
        id: 'eventType',
        label: 'Event type',
        type: 'select',
        validation: {
          notEmpty: function (value) {
            return value && value.length > 0;
          }
        },
        validationMessages: {
          notEmpty: 'This field cannot be empty!'
        },
        options: [
          {
            id: '04909235489',
            title: 'MSF'
          },
          {
            id: '46876342346',
            title: 'ARCP'
          },
          {
            id: '46876342346123412',
            title: 'Reflection'
          },
          {
            id: '468763423462134123',
            title: 'MINI-CEX'
          }
        ]
      },
      {
        id: 'eventState',
        label: 'Event state',
        type: 'select',
        multiselect: true,
        // options: promise(3000)
        options: promise
      },
      {
        id: 'blueprint',
        label: 'Blueprint',
        type: 'hierarchy',
        options: [
          {
            id: '124158723975514',
            title: 'Curriculum items',
            categories: [
              {
                id: '95436-1765596',
                title: 'Item one'
              },
              {
                id: '3456982348675546123',
                title: 'Item two'
              }
            ]
          },
          {
            id: '7857676576123',
            title: 'Domains of competence',
            categories: [
              {
                id: '9543sadf6-1765123123',
                title: 'Item one'
              },
              {
                id: '43565463778123213132',
                title: 'DoC - Item two'
              }
            ]
          }
        ]
      }
    ];
  }

  MainController.$inject = ['$timeout', '$q'];

  var app = angular.module('facetlyDemo', ['ngFacetly']);

  app.controller('MainController', MainController);

})();
