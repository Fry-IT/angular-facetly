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

    vm.placeholder = 'Search for items';
    vm.facets = [
      {
        id: 'keywords',
        label: 'Keywords',
        type: 'text'
      },
      {
        id: 'description',
        label: 'Description',
        type: 'text'
      },
      {
        id: 'username',
        label: 'Username',
        type: 'text'
      },
      {
        id: 'zip_code',
        label: 'Zip code',
        type: 'text'
      },
      {
        id: 'city',
        label: 'City',
        type: 'select',
        options: [
          {
            id: '04909235489',
            title: 'London'
          },
          {
            id: '46876342346',
            title: 'New York'
          },
          {
            id: '46876342346',
            title: 'Seattle'
          },
          {
            id: '46876342346',
            title: 'Vancouver'
          }
        ]
      },
      {
        id: 'country',
        label: 'Country',
        type: 'select',
        options: [
          {
            id: '328470521',
            title: 'United Kingdom'
          },
          {
            id: '57682534',
            title: 'United States of America'
          },
          {
            id: '6802534253',
            title: 'Germany'
          }
        ]
      },
      {
        id: 'email',
        label: 'Email',
        type: 'text'
      },
      {
        id: 'device',
        label: 'Devices owned',
        type: 'select',
        multiselect: true,
        options: [
          {
            id: '123123189002',
            title: 'iPhone'
          },
          {
            id: '123234613762783189002',
            title: 'iPad'
          },
          {
            id: '126789022378223',
            title: 'Mac'
          },
          {
            id: '4567583456467457',
            title: 'PC'
          }
        ]
      },
      {
        id: 'role',
        label: 'Role',
        type: 'hierarchy',
        // multiselect: true,
        options: [
          {
            id: '124158723975',
            title: 'Administrator',
            categories: [
              {
                id: '95436-1765',
                title: 'Super administrator'
              },
              {
                id: '3456982348675546',
                title: 'FIGO administrator'
              }
            ]
          },
          {
            id: '7857676576',
            title: 'Trainee',
            categories: [
              {
                id: '9543sadf6-1765',
                title: 'RCPCH trainee'
              },
              {
                id: '43565463778',
                title: 'FIGO trainee'
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
