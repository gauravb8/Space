var app = angular.module('myApp', ['ngMaterial','ngRoute','ngResource','angucomplete','btford.socket-io']);

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
          console.log($rootScope.current_user);
          $rootScope.user_id = data.user._id;
          $location.path('/main');
        }
        else
        {
          $rootScope.authenticated = false;
          $rootScope.current_user = '';
          $rootScope.user_id = '';
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
      templateUrl: 'login.html',
      controller: 'authController'
    })
    .when('/main', {
      templateUrl: 'main.html',
      controller: 'Ctrl as vm'
    })
    //the login display
    .when('/login', {
      templateUrl: 'login.html',
      controller: 'authController'
    })
    //the signup display
    .when('/register', {
      templateUrl: 'register.html',
      controller: 'authController'
    });
});

app.factory('mySocket', function (socketFactory) {
  return socketFactory();
})

app.controller('Ctrl', function($scope, $rootScope, $interval, $http, $timeout, $q, $log, mySocket) {
    $scope.homepage = 1;
    $scope.addMembers = 0;
    $scope.addName = 0;
    
    var self = this;

    //Autocomplete chips stuff..
    var pendingSearch, cancelSearch = angular.noop;
    var lastSearch;
    loadUsers();

    /**
     * Search for contacts; use a random delay to simulate a remote call
     */
    function querySearch (criteria) {
      return criteria ? self.allContacts.filter(createFilterFor(criteria)) : [];
    }

    /**
     * Async search for contacts
     * Also debounce the queries; since the md-contact-chips does not support this
     */
    function delayedQuerySearch(criteria) {
      if ( !pendingSearch || !debounceSearch() )  {
        cancelSearch();

        return pendingSearch = $q(function(resolve, reject) {
          // Simulate async search... (after debouncing)
          cancelSearch = reject;
          $timeout(function() {

            resolve( self.querySearch(criteria) );

            refreshDebounce();
          }, Math.random() * 500, true)
        });
      }

      return pendingSearch;
    }

    function refreshDebounce() {
      lastSearch = 0;
      pendingSearch = null;
      cancelSearch = angular.noop;
    }

    /**
     * Debounce if querying faster than 300ms
     */
    function debounceSearch() {
      var now = new Date().getMilliseconds();
      lastSearch = lastSearch || now;

      return ((now - lastSearch) < 300);
    }

    /**
     * Create filter function for a query string
     */
    function createFilterFor(query) {
      var lowercaseQuery = angular.lowercase(query);

      return function filterFn(contact) {
        return (contact._lowername.indexOf(lowercaseQuery) != -1);
      };
    }

    function loadUsers(){
      return $http.get('api/users').success(function(res){
        self.allContacts = [];
        for (var i = 3; i < res.length; i++) {
          res[i]._lowername = res[i].username.toLowerCase();
          self.allContacts.push(res[i]);
        }
        self.contacts = [self.allContacts[0]];
        self.asyncContacts = [];
        self.filterSelected = true;
        self.querySearch = querySearch;
        self.delayedQuerySearch = delayedQuerySearch;
      });
    }

    // var socket = io();
    //Do not show progress bar initially
    $scope.showBar = 0;
    $scope.currentGroupId = 0;
    $scope.selected = '';
    $scope.newMessage = '';
    console.log($rootScope.user_id);
    //Get Groups list..
    function getGroups(){
      $http.get('api/groups', { params : {user_id: $rootScope.user_id } }).success( function(res){
        $scope.groups = res;
      });
    }
    getGroups();

    $http.get('api/publicPosts').success(function(res){
      $scope.publicPosts = res;
    })

    //progress bar setup
    self.activated = true;
    self.determinateValue = 0;
    $interval(function() {
    }, 100, 0, true);

    $scope.createNewGroup = function(){
      $scope.addName = 0;
      $scope.homepage = 1;
      var usernames = [$rootScope.current_user],
          userids = [$rootScope.user_id];
      for (var i = 0; i < self.asyncContacts.length; i++) {
        usernames.push(self.asyncContacts[i].username);
        userids.push(self.asyncContacts[i]._id);
      }
      $http.post('/api/createGroup', {
        name: $scope.groupName,
        users: usernames,
        userids: userids
      }).success(function(res){
        console.log(res);
      });
      getGroups();
    }

    mySocket.on('recieveMsg', function(grpid){
      $scope.newMessage = grpid;
      // console.log('recieved group id : '+grpid);
      getGroups();
    });

    //To load posts specific to a group from DB...
    $scope.loadGroup = function(grpid){
      if (grpid==$scope.newMessage)
        $scope.newMessage = '';
      // console.log(self.asyncContacts);
      $scope.selected = "selected";
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
      formData.append('user', $rootScope.current_user);
      formData.append('groupid', $scope.currentGroupId);
      formData.append('user_id', $rootScope.user_id);
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
        $http.get('api/groups', { params : {user_id: $rootScope.user_id } }).success( function(res){
          $scope.groups = res;
        });
        mySocket.emit('sendMsg', $scope.currentGroupId);
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
        $rootScope.user_id = data.user._id;
        $location.path('/main');
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
        $rootScope.user_id = data.user._id;
        $location.path('/main');
      }
      else{
        $scope.error_message = data.message;
      }
    });
  };
});