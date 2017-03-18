angular.module('myApp', ['ngMaterial'])
  .config(function($mdThemingProvider) {
  })
  .controller('Ctrl', function($scope, $interval, $http) {
    //Do not show progress bar initially
    $scope.showBar = 0;

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
    $scope.loadGroup = function(grpname){
      console.log(grpname);
      $http.get('/groupPosts', { params : {name : grpname } }).success( function(res){
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
        $http.get('/posts').success( function(res){
          $scope.posts = res;
          console.log($scope.posts.length);
        });
      };
      xhr.send(formData);
    }
  });