'use strict';

var deepFreeze = function deepFreeze(o) {
  Object.freeze(o);

  var oIsFunction = typeof o === 'function';
  var hasOwnProp = Object.prototype.hasOwnProperty;

  Object.getOwnPropertyNames(o).forEach(function (prop) {
    if (hasOwnProp.call(o, prop)
    && (oIsFunction ? prop !== 'caller' && prop !== 'callee' && prop !== 'arguments' : true)
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

deepFreeze(filters);
deepFreeze(facets);

describe('Facetly Utils', function () {

  beforeEach(module('ngFacetly'));

  var Utils, log, q;

  beforeEach(inject(function (_FacetlyUtils_, _$log_, _$q_) {
    Utils = _FacetlyUtils_;
    log = _$log_;
    q = _$q_;
  }));

  it('should set facets', function () {
    var facetsAfter = facets.concat([{
          id: 'filterPromise',
          label: 'Filter promise',
          type: 'select',
          options: promise
        }]);
    var promise = function () {
      return $q.when([{ id: 'optionOne', title: 'Option 1' }]);
    };

    expect(Utils.setFacets(facetsAfter).length).toEqual(facets.length + 1);
  });

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

  it('should fail validation', function () {
    var newFilters = [
      {
        id: 'filterOne',
        type: 'text',
        label: 'Filter one',
        value: 'Value one',
        validation: {
          testValidation: function (value) {
            return false;
          }
        },
        validationMessages: {
          testValidation: 'Not valid'
        }
      }
    ];
    deepFreeze(newFilters);

    var filteredBy = Utils.updateModel(newFilters);
    var filtersAfter = Utils.validateValues(newFilters, filteredBy);

    var invalidFilters = _.map(newFilters, function (filter, index) {
      return index === 0 ? _.assign({}, filter, { isValid: false, messages: ['Not valid'] }) : filter;
    });

    expect(filtersAfter).toEqual(invalidFilters);
  });

  it('should pass validation', function () {
    var newFilters = [
      {
        id: 'filterOne',
        type: 'text',
        label: 'Filter one',
        value: 'Value one',
        validation: {
          testValidation: function (value) {
            return true;
          }
        },
        validationMessages: {
          testValidation: 'Valid'
        }
      }
    ];
    deepFreeze(newFilters);

    var filteredBy = Utils.updateModel(newFilters);
    var filtersAfter = Utils.validateValues(newFilters, filteredBy);
    var validFilters = newFilters.slice();

    expect(filtersAfter).toEqual(validFilters);
  });

  it('should collect validation errors', function () {
    var newFilters = [
      {
        id: 'filterOne',
        label: 'Filter one',
        value: 'Value one',
        messages: ['Not valid'],
        validation: {
          testValidation: function (value) {
            return false;
          }
        },
        validationMessages: {
          testValidation: 'Not valid'
        }
      }
    ];
    deepFreeze(newFilters);

    var validationErrors = Utils.collectValidationErrors(newFilters);

    expect(validationErrors).toEqual(['Filter one: Not valid']);
  });

  it('should get the title value from a text filter', function () {
    var filter = { id: 'filterOne', label: 'Filter one', value: 'test', type: 'text' };
    expect(Utils.getValueForFilterByType(filter)).toEqual('test');
  });

  it('should get the title value from a select filter', function () {
    var filter = { id: 'filterOne', label: 'Filter one', value: { id: '123', title: 'Test' }, type: 'select', options: [{ id: '123', title: 'Test' }] };
    expect(Utils.getValueForFilterByType(filter)).toEqual('Test');
  });

  it('should get the title value from a hierarchy filter', function () {
    var filter = {
      id: 'filterOne',
      label: 'Filter one',
      value: {
        id: '456',
        title: 'Category'
      },
      type: 'hierarchy',
      options: [
        {
          id: '123',
          title: 'Test',
          categories: [
            { id: '456',
              title: 'Category'
            }
          ]
        }
      ]
    };
    expect(Utils.getValueForFilterByType(filter)).toEqual('Category');
  });

  it('should get the title value from a multiselect filter', function () {
    var filter = {
      id: 'filterOne',
      label: 'Filter one',
      value: [
        {
          id: '123',
          title: 'Test'
        },
        {
          id: '456',
          title: 'Test 2'
        }
      ],
      type: 'select',
      options: [
        {
          id: '123',
          title: 'Test'
        },
        {
          id: '456',
          title: 'Test 2'
        }
      ],
      multiselect: true
    };
    expect(Utils.getValueForFilterByType(filter)).toEqual(['Test', 'Test 2']);
  });

  it('should update the applied filters', function () {
    var appliedFilters = Utils.updateAppliedFilters(filters);
    expect(appliedFilters).toEqual({ 'Filter one': 'Value one', 'Filter two': 'Value two' });
  });

});
