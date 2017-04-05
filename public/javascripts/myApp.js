var app = angular.module('myApp', ['ngMaterial','ngRoute','ngResource']);

app.run(function($rootScope, $http, $location) {
  $rootScope.authenticated = false;
  $rootScope.current_user = '';
  
  $rootScope.signout = function(){
      $http.get('auth/signout');
      $rootScope.authenticated = false;
      $rootScope.current_user = '';
  };

  $rootScope.loggedIn = function()
    {
      $http.post('/auth/isloggedIn').success(function(data)
      {
        console.log(data.state);
        if(data.state == 'success')
        {
          $rootScope.authenticated = true;
          $rootScope.current_user = data.user.username;
          $location.path('/');
        }
        else
        {
          $rootScope.authenticated = false;
          $rootScope.current_user = '';
          $location.path('/');
        }
      });
    };

  $rootScope.loggedIn();
});

app.config(function($routeProvider){
  $routeProvider
    //the timeline display
    .when('/', {
      templateUrl: 'main.html',
      controller: 'Ctrl as vm'
    })
    //the login display
    // .when('/login', {
    //   templateUrl: 'login.html',
    //   controller: 'authController'
    // })
    //the signup display
    .when('/register', {
      templateUrl: 'register.html',
      controller: 'authController'
    });
});

app.controller('Ctrl', function($scope, $interval, $http) {
    // var socket = io();
    //Do not show progress bar initially
    $scope.showBar = 0;
    $scope.currentGroupId = 0;
    //Get Groups list..
    $http.get('api/groups').success( function(res){
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
      $http.get('api/groupPosts', { params : {id : grpid } }).success( function(res){
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
      xhr.open('post', 'api/upload', true);

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
        $http.get('api/groupPosts', { params : {id : $scope.currentGroupId } }).success( function(res){
          $scope.posts = res;
          console.log($scope.posts.length);
        });
        $http.get('api/groups').success( function(res){
          $scope.groups = res;
        });
      };
      xhr.send(formData);
    }
  });

app.controller('authController', function($scope, $http, $rootScope, $location){
  $scope.user = {username: '', password: ''};
  $scope.error_message = '';

  $scope.login = function(){
    $http.post('/auth/login', $scope.user).success(function(data){
      if(data.state == 'success'){
        $rootScope.authenticated = true;
        $rootScope.current_user = data.user.username;
        $location.path('/');
      }
      else{
        $scope.error_message = data.message;
      }
    });
  };

  $scope.register = function(){
    console.log('Calling...\tusername : '+$scope.user.username+'\tpassword : '+ $scope.user.password);
    $http.post('/auth/signup', $scope.user).success(function(data){
      console.log("registering : "+data.state);
      if(data.state == 'success'){
        $rootScope.authenticated = true;
        $rootScope.current_user = data.user.username;
        $location.path('/');
      }
      else{
        $scope.error_message = data.message;
      }
    });
  };
});