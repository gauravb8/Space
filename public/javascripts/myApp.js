var app = angular.module('myApp', ['ngMaterial','ngRoute','ngResource']);



app.controller('Ctrl', function($scope, $interval, $http) {
    // var socket = io();
    //Do not show progress bar initially
    $scope.showBar = 0;
    $scope.currentGroupId = 0;
    //Get Groups list..
    $http.get('/groups').success( function(res){
      $scope.groups = res;
    });

    //progress bar setup
    var self = this;
    self.activated = true;
    self.determinateValue = 0;
    $interval(function() {
    }, 100, 0, true);

    //To load posts specific to a group from DB...
    $scope.loadGroup = function(grpid){
      $scope.currentGroupId = grpid;
      console.log(grpid);
      $http.get('/groupPosts', { params : {id : grpid } }).success( function(res){
        $scope.posts = res;
      });
    }

    //Executes when file is submitted.
    $scope.uploadFile = function(){
      console.log(self.determinateValue);
  
      $scope.showBar = 1; // Show progress bar
      var formData = new FormData();
      var file = document.getElementById('myfile').files[0];
      formData.append('myfile', file);
      formData.append('user', 'gaurav');
      formData.append('groupid', $scope.currentGroupId);
      var xhr = new XMLHttpRequest();

      // your url upload
      xhr.open('post', '/upload', true);

      xhr.upload.onprogress = function(e) {
        if (e.lengthComputable) {
          self.determinateValue = (e.loaded / e.total) * 100;
          console.log(self.determinateValue + "%");
        }
      };

      xhr.onerror = function(e) {
        console.log('Error');
        console.log(e);
      };
      xhr.onload = function() {
        $scope.showBar = 0;
        self.determinateValue = 0;
        console.log(this.statusText);
        $http.get('/groupPosts', { params : {id : $scope.currentGroupId } }).success( function(res){
          $scope.posts = res;
          console.log($scope.posts.length);
        });
        $http.get('/groups').success( function(res){
          $scope.groups = res;
        });
      };
      xhr.send(formData);
    }
  });