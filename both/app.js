
Meteor.startup(function () {
  if (Meteor.isClient) {
    var app = angular.module('timeplan',['angular-meteor']);
    app.controller("mainController", ["$scope", function($scope) {

    }]);
  }
});
