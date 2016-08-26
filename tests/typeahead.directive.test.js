'use strict';

describe('Facetly Typeahead Directive', function () {

  var compile, scope, isolatedScope, directiveElem;

  var facets = [{ id: 'filterOne', label: 'Filter one', type: 'text' }, { id: 'filterTwo', label: 'Filter two', type: 'text' }];

  beforeEach(function () {
    module('ngFacetly');
    module('facetly.templates');
  });

  beforeEach(function () {
    inject(function ($compile, $rootScope) {
      compile = $compile;
      scope = $rootScope.$new();

      scope.facets = facets;
      scope.query = 'custom';

      // scope.hideNotFound = false;
      // scope.placeholder = 'Search...';
      // scope.allowMultiselect = false;
      // scope.listMaxItems = 0;
      scope.onSelect = jasmine.createSpy('onSelect');
    });

    directiveElem = getCompiledElement();
    isolatedScope = directiveElem.isolateScope();
  });

  function getCompiledElement() {
    var elem = '<facetly-typeahead facets="facets" query="query" hide-not-found="hideNotFound" placeholder="placeholder" allow-multiselect="allowMultiselect" list-max-items="listMaxItems" on-select="onSelect(value)" />';
    var compiledDirective = compile(angular.element(elem))(scope);
    scope.$digest();
    return compiledDirective;
  }

  it('should have three required properties assigned', function () {
    expect(isolatedScope.facets).toBeDefined();
    expect(isolatedScope.query).toBeDefined();
    expect(isolatedScope.onSelect).toBeDefined();
  });

  it('should set the defaults', function () {
    expect(isolatedScope.showSuggestions).toBe(false);
    expect(isolatedScope.suggestions).toEqual(facets);
    expect(isolatedScope.selectedIndex).toEqual(-1);
  });

  it('should update the selected index', function () {
    isolatedScope.updateSelectedIndex(facets[0]);
    expect(isolatedScope.selectedIndex).toEqual(0);
  });

  it('should add a suggestion without multiselect', function () {
    isolatedScope.addSuggested('Filter one');

    expect(isolatedScope.showSuggestions).toBe(false);
    expect(scope.onSelect).toHaveBeenCalled();
  });

  it('should add a suggestion with multiselect', function () {
    isolatedScope.allowMultiselect = true;
    isolatedScope.selected = [];
    isolatedScope.addSuggested('Filter one');

    expect(isolatedScope.selected).toEqual(['Filter one']);
    expect(isolatedScope.showSelected).toBe(true);
    expect(isolatedScope.query).toEqual('');
    expect(scope.onSelect).toHaveBeenCalled();
  });

  it('should remove a suggestion from multiselect', function () {
    isolatedScope.allowMultiselect = true;
    isolatedScope.selected = [];
    isolatedScope.addSuggested('Filter one');
    isolatedScope.addSuggested('Filter two');
    isolatedScope.removeSelected('Filter one');

    expect(isolatedScope.selected).toEqual(['Filter two']);
  });

  it('onSelect should be a function', function () {
    expect(typeof isolatedScope.onSelect).toEqual('function');
  });

  it('should call onSelect method of scope when invoked from isolated scope', function () {
    isolatedScope.onSelect({ value: 'Test' });

    expect(scope.onSelect).toHaveBeenCalled();
  });

});
