'use strict';
/* global sinon:false */
/* jshint expr: true */

describe('Controller: ProfileCtrl', function () {
  // load the controller's module
  beforeEach(module('openhimWebui2App'));

  var scope, createController, httpBackend;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope,$httpBackend) {

    httpBackend = $httpBackend;

    httpBackend.when('GET', new RegExp('.*/authenticate/test@user.org')).respond({
      salt: 'test-salt',
      ts: 'test-ts'
    });


    httpBackend.when('GET', new RegExp('.*/users')).respond({
      '__v': 0,
      '_id': '539846c240f2eb682ffeca4b',
      'email': 'test@user.org',
      'firstname': 'test',
      'passwordAlgorithm': 'sha512',
      'passwordHash': '7d0d1a30d16f5343e3390fe9ef1dd61539a7f797267e0d2241ed22390dfc9743091244ddb2463df2f1adf6df3c355876ed34c6523f1e8d3b7f16f4b2afc8c160',
      'passwordSalt': 'test-salt',
      'surname': 'test',
      'groups': [
        'test',
        'other'
      ]
    });

    httpBackend.when('PUT', new RegExp('.*/users')).respond('user has been successfully updated');

    createController = function() {
      scope = $rootScope.$new();
      scope.consoleSession = {};
      scope.consoleSession.sessionUser = 'test@user.org';
      scope.user = {
        $update: sinon.spy()
      };
      return $controller('ProfileCtrl', {
        $scope: scope
      });
    };

  }));

  afterEach(function() {
    httpBackend.verifyNoOutstandingExpectation();
    httpBackend.verifyNoOutstandingRequest();
  });

  it('should fetch a user profile', function () {

    httpBackend.expectGET(new RegExp('.*/users'));
    createController();
    httpBackend.flush();

    scope.user.should.have.property('email', 'test@user.org');
    scope.user.should.have.property('firstname', 'test');
    scope.user.should.have.property('surname', 'test');
    scope.user.groups.should.have.length(2);

  });

  it('should test for all validation and return TRUE - hasErrors', function() {
    createController();

    // only admin can edit profile groups
    scope.userGroupAdmin = true;

    scope.user.firstname = '';
    scope.user.surname = '';
    scope.user.msisdn = '2712';
    scope.user.groups = [];
    scope.temp.password = 'password';

    // Should check all form validations and create object ngError.hasErrors with value true.
    scope.validateFormProfile();
    scope.ngError.should.have.property('hasErrors', true);
    scope.ngError.should.have.property('firstname', true);
    scope.ngError.should.have.property('surname', true);
    scope.ngError.should.have.property('msisdn', true);
    scope.ngError.should.have.property('groups', true);
    scope.ngError.should.have.property('passwordConfirm', true);

    httpBackend.flush();
  });

  it('should test for all validation and return FALSE - hasErrors', function() {
    createController();

    // only admin can edit profile groups
    scope.userGroupAdmin = true;

    // Should check all form validations and create object ngError.hasErrors with value true.
    scope.user.firstname = 'John';
    scope.user.surname = 'Doe';
    scope.user.msisdn = '27123456789';
    scope.user.groups = ['group1', 'group2'];

    scope.validateFormProfile();
    scope.ngError.should.have.property('hasErrors', false);

    httpBackend.flush();
  });

  it('should save the user profile with updated details', function() {
    createController();

    scope.user.email = 'test@user.org';
    scope.user.firstname = 'Jane';
    scope.user.surname = 'Doe';
    scope.user.msisdn = '27123456789';
    scope.user.groups = ['group1', 'group2'];
    scope.temp.password = 'password';
    scope.temp.passwordConfirm = 'password';

    // Should submit the form with supplied values annd save the user with new password salt/hash
    scope.submitFormProfile();
    scope.user.$update.should.be.called;
    scope.ngError.should.have.property('hasErrors', false);

    scope.user.should.have.property('passwordSalt' );
    scope.user.should.have.property('passwordHash');
    scope.user.should.have.property('firstname', 'Jane');
    scope.user.should.have.property('surname', 'Doe');
    scope.user.should.have.property('msisdn', '27123456789');
    scope.user.groups.should.have.length(2);

    httpBackend.flush();

  });

});