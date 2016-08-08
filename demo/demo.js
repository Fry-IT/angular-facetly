(function () {
  'use strict';

  function MainController($timeout) {
    var vm = this;

    // $timeout(function () {
    //   vm.model = { keywords: 'test keyword overwritten' };
    // }, 3000);

    // vm.model = {
    //   keywords: 'test keyword initial'
    // };

    vm.model = {};

    vm.options = {
      defaultFacet: 'keywords',
      placeholder: 'Filter your events by...'
    };

    vm.doSearch = function () {
      vm.showModel = true;
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
        validation: function (value) {
          return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value);
        }
      },
      {
        id: 'eventType',
        label: 'Event type',
        type: 'select',
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
            id: '46876342346',
            title: 'Reflection'
          },
          {
            id: '46876342346',
            title: 'MINI-CEX'
          }
        ]
      },
      {
        id: 'eventState',
        label: 'Event state',
        type: 'select',
        multiselect: true,
        options: [
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
        ]
      },
      {
        id: 'blueprint',
        label: 'Blueprint',
        type: 'hierarchy',
        options: [
          {
            id: '124158723975',
            title: 'Curriculum items',
            categories: [
              {
                id: '95436-1765',
                title: 'CI - Item one'
              },
              {
                id: '3456982348675546',
                title: 'CI - Item two'
              }
            ]
          },
          {
            id: '7857676576',
            title: 'Domains of competence',
            categories: [
              {
                id: '9543sadf6-1765',
                title: 'DoC - Item one'
              },
              {
                id: '43565463778',
                title: 'DoC - Item two'
              }
            ]
          }
        ]
      }
    ];
  }

  MainController.$inject = ['$timeout'];

  var app = angular.module('facetlyDemo', ['ngFacetly']);

  app.controller('MainController', MainController);

})();
