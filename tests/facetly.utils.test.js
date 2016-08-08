'use strict';

var deepFreeze = function deepFreeze(o) {
  Object.freeze(o);

  Object.getOwnPropertyNames(o).forEach(function (prop) {
    if (o.hasOwnProperty(prop)
    && o[prop] !== null
    && (typeof o[prop] === 'object' || typeof o[prop] === 'function')
    && !Object.isFrozen(o[prop])) {
      deepFreeze(o[prop]);
    }
  });

  return o;
};

var filters = [
  {
    id: 'filterOne',
    label: 'Filter one',
    type: 'text',
    value: 'Value one'
  },
  {
    id: 'filterTwo',
    label: 'Filter two',
    type: 'text',
    value: 'Value two'
  }
];

var filter = {
  id: 'filterThree',
  label: 'Filter three',
  type: 'text'
};

var facets = filters.concat([filter]).concat({ id: 'filterFour', label: 'Filter four', type: 'text' });

var filteredBy = {
  filterOne: 'Value one',
  filterTwo: 'Value two'
};

describe('Facetly Utils', function () {

  beforeEach(module('ngFacetly'));

  var Utils;

  deepFreeze(filters);
  deepFreeze(facets);

  beforeEach(inject(function (_FacetlyUtils_) {
    Utils = _FacetlyUtils_;
  }));

  it('should set filters', function () {
    var setFilters = Utils.setFilters(filteredBy, facets);
    expect(setFilters.length).toEqual(2);
  });

  it('should remove all filters', function () {
    var emptyFilters = Utils.removeAllFilters();
    expect(emptyFilters).toEqual([]);
  });

  it('should add a filter to the list', function () {
    var filtersAfter = Utils.addFilter(filters, filter);
    expect(filtersAfter.length).toEqual(filters.length + 1);
    expect(filtersAfter).toEqual(filters.concat([filter]));
  });

  it('should remove a filter from the list', function () {
    var filtersAfter = Utils.removeFilter(filters, filters[0].id);
    expect(filtersAfter.length).toEqual(filters.length - 1);
  });

  it('should find a filter by key', function () {
    var filterFound = Utils.findFilterByKey(filters, 'id', filters[0].id);
    expect(filterFound).toEqual(0);
  });

  it('should update the model', function () {
    var model = Utils.updateModel(filters);
    expect(model).toEqual(filteredBy);
  });

  it('should flatten an array', function () {
    var hierarchy = [
      {
        id: '1',
        title: 'Level 1',
        categories: [
          {
            id: '11',
            title: 'Level 1.1',
            categories: [
              {
                id: '12',
                title: 'Level 1.2'
              }
            ]
          }
        ]
      }
    ];
    var flat = Utils.flatten(hierarchy);
    expect(flat).toEqual([
      { id: '1', title: 'Level 1' },
      { id: '11', title: 'Level 1.1' },
      { id: '12', title: 'Level 1.2' }
    ]);
  });

  it('should get ID or IDS of a set of values', function () {
    var available = [
      { id: '1', title: 'Level 1' },
      { id: '11', title: 'Level 1.1' },
      { id: '12', title: 'Level 1.2' }
    ];
    var singleId = Utils.getFacetIds('Level 1', available);
    var multipleIds = Utils.getFacetIds(['Level 1', 'Level 1.1'], available);

    expect(singleId).toEqual('1');
    expect(multipleIds).toEqual(['1', '11']);
  });

});
