'use strict';

var value = 'My custom string';
var htmlValue = '<div>My custom string</div>';

describe('Facetly Typeahead Highlight Filter without ngSanitize', function () {

  beforeEach(module('ngFacetly'));

  var filter, sce, log;

  it('has a bool filter', inject(function ($filter) {
    expect($filter('facetlyHighlight')).not.toBeNull();
  }));

  beforeEach(inject(function ($injector, $sce, $log) {
    filter = $injector.get('$filter')('facetlyHighlight');
    sce = $sce;
    log = $log;
  }));

  it('should show a warning in the console that ngSanitize is not loaded', function () {
    var result = filter(htmlValue, 'custom');
    expect(log.warn.logs).toContain(['Unsafe use of typeahead please use ngSanitize']);
  });

  it('should highlight a string', function () {
    expect(sce.getTrustedHtml(filter(value, 'custom'))).toBe('My <strong>custom</strong> string');
    expect(sce.getTrustedHtml(filter(htmlValue, 'custom'))).toBe('<div>My <strong>custom</strong> string</div>');
  });

});

describe('Facetly Typeahead Highlight Filter with ngSanitize', function () {

  beforeEach(function () {
    module('ngFacetly');
    module('ngSanitize');
  });

  var filter;
  var value = 'My custom string';

  beforeEach(inject(function ($injector) {
    filter = $injector.get('$filter')('facetlyHighlight');
  }));

  it('should highlight a string', function () {
    expect(filter(value, 'custom')).toBe('My <strong>custom</strong> string');
    expect(filter(htmlValue, 'custom')).toBe('<div>My <strong>custom</strong> string</div>');
  });

});
