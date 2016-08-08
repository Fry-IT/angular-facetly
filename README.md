angular-facetly
=============================

Enhance ordinary search boxes with the autocomplete faceted search. No jQuery.

[![Build Status](https://travis-ci.org/tricinel/angular-facetly.svg)](https://travis-ci.org/tricinel/angular-facetly)

#### Features:

* Faceted search queries
* Autocomplete for facets and facet options
* Multiple facet types, e.g. text, select, multiselect, hierarchies
* Keyboard/Mouse navigation

##### Usage:

Get the binaries of angular-facetly with any of the following ways.

```sh
bower install angular-facetly --save
```

Make sure to load the scripts in your html.
```html
<link rel="stylesheet" href="../dist/angular-facetly.css">
<script type="text/javascript" src="../dist/angular-facetly.js"></script>
```

And Inject the sortable module as dependency.

```
angular.module('myApp', ['ngFacetly']);
```

###### Html Structure:
You can also check out the [demo](./demo) folder.

```javascript
function MainController() {
  var vm = this;

  vm.model = {};

  vm.options = {
    defaultFacet: 'keywords',
    placeholder: 'Search here...'
  };

  vm.facets = [
    {
      id: 'keywords',
      label: 'Keywords',
      type: 'text'
    },
    {
      id: 'city',
      label: 'City',
      type: 'select',
      options: [
        {
          id: 'ny',
          title: 'New York'
        },
        {
          id: 'sf',
          title: 'San Francisco'
        },
      ]
    },
  ];

  vm.doSearch = function() {
    console.log(vm.model);
  };
}
```

```html
<div data-ng-controller="MainController as vm">
  <facetly facets="vm.facets" options="vm.options" ng-model="vm.model" do-search="vm.doSearch()"></facetly>
</div>
```

##### Coming next

* Validation for inputs

##### License

MIT, see [LICENSE.md](./LICENSE.md).
