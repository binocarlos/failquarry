/*

  The Quarry Desktop App
  
*/

angular
  .module('quarrydesktop', ['quarry.core', 'quarry.ui', 'quarry.app.digger'])

  .config(['$stateProvider', '$routeProvider', '$urlRouterProvider',  

    function ($stateProvider, $routeProvider, $urlRouterProvider) {

      $urlRouterProvider
        //.when('/c?id', '/contacts/:id')
        .otherwise('/loading');

      $stateProvider
        .state('loading', {
          url: '/loading',
          templateUrl: 'views/loading.html',
          controller:
            ['$scope', '$state', '$location', function ($scope, $state, $location){
              $scope.init(function(){
                $location.path('/project/' + $scope.currentproject.id());
              })

            }]
        })
        .state('welcome', {
          url: '/welcome',
          templateUrl: 'views/welcome.html',
          controller:
            ['$scope', '$state', function ($scope, $state){
              
            }]
        })
        .state('project', {
          url: '/project/:projectid',
          templateUrl: 'views/project.html',
          controller:
            ['$scope', '$state', '$location', function ($scope, $state, $location){
              $scope.init(function(){

              })
            }]
        })
        .state('digger', {
          url: '/digger/:projectid',
          templateUrl: 'views/digger.html',
          controller:'DiggerCtrl'
        })


    }
  ])










  /*
  
    THE MAIN CONTROLLER
    
  */





  .controller('MainCtrl', ['$scope', '$warehouse', '$location', '$digger', function($scope, $warehouse, $location, $digger){

    /*
    
      warehouse and user
      
    */
    var warehouse = $scope.warehouse = $warehouse;
    var user = $scope.user = $warehouse.user;

    $scope.authurl = '/auth';
    $scope.hasuser = $scope.user.full();

    /*
    
      projects
      
    */
    var projects = $scope.projectlist = [];
    var projects_loaded = false;


    var projectdigger = $scope.projectdigger = $digger({

      $scope:$scope,
      
    })

    /*
    
      get things kicked off by loading the projects
      
    */
    $scope.init = function(done){
      if(!$scope.hasuser){
        $location.path('/welcome');
        return false;
      }

      if(projects_loaded){
        done && done(warehouse);
      }
      else{
        done && $scope.load_projects(done);  
      }

      projects_loaded = true;
      
      return true;
    }

    /*
    
      get the projects loaded for the topbar
      
    */
    $scope.load_projects = function(done){

      if(!$scope.user.full()){
        return;
      }



      $scope.user('project').ship(function(loadedprojects){
        $scope.$apply(function(){
          $scope.projectlist = loadedprojects.containers();
          var currentproject = loadedprojects.find('#' + $scope.user.attr('projectid'));

          if(!currentproject.full()){
            currentproject = loadedprojects.eq(0);
          }

          $scope.currentproject = currentproject;

          currentproject('blueprint').ship(function(blueprints){
            $scope.$apply(function(){
              $scope.projectblueprints = blueprints;
              done && done(warehouse);
            })
          })

        })
      })
    }

    $scope.$on('loadproject', function(ev, project){
      $scope.load_project(project);
    })

    $scope.load_projects();

  }])






  /*
  
    THE DIGGER CONTROLLER
    
  */






  .controller('DiggerCtrl', ['$scope', '$state', '$location', '$warehouse', '$http', '$templateCache', '$dialog', '$digger',  function ($scope, $state, $location, $warehouse, $http, $templateCache, $dialog, $digger){

    

    /*
    
      these can be augmented by project blueprints also
      
    */
    var baseblueprints = $warehouse.create([{
      meta:{
        tagname:'folder',
        icon:'box.png'
      },
      attr:{
        name:'Folder'
      }
    },{
      meta:{
        tagname:'container',
        icon:'container.png',
        leaf:true
      },
      attr:{
        name:'Container'
      }
    },{
      meta:{
        tagname:'blueprint',
        icon:'cube_molecule.png'
      },
      attr:{
        name:'Blueprint'
      }
    }])

    /*
    
      this loads the HTML from the external templates
      
    */
    baseblueprints.each(function(blueprint){
      if(blueprint.attr('path')){

        $http
          .get(blueprint.attr('path'), {cache:$templateCache})
          .success(function(data){

              blueprint.attr('html', data);  
            
          })
      }
    })

    var digger = $scope.digger = $digger({

      $scope:$scope,

      render:function(container){
        
        if(!container){
          return null;
        }

        return null;
      },

      create:function(container, done){
        console.log('-------------------------------------------');
        console.log('-------------------------------------------');
        console.log('-------------------------------------------');
        if(container.tagname()=='blueprint'){
          alert('blueprint')
        }
        done(container);
      },

      /*
      
        the blueprints we have for the digger
        
      */
      baseblueprints:baseblueprints
    })

    /*
    
      get the user loaded then assign the warehouse an ting
      
    */
    $scope.init(function(warehouse){

      /*
      
        get connected to the actual database the current project points to

      */
      var projectwarehouse = warehouse.connect('/project/' + $scope.currentproject.id());
      projectwarehouse.attr('name', $scope.currentproject.title());

      //var iconwarehouse = warehouse.connect('file:/icons');



      digger.setwarehouse(projectwarehouse);

    })
  }])




/*

  The icon factory
  
*/
$quarry.Proto.prototype.icon = function(){

  var icon = '/files/icon/'
  if(this.meta('icon')){
    return icon + this.meta('icon');
  }
  else{
    return '/files/icon/box.png';  
  }
  
}