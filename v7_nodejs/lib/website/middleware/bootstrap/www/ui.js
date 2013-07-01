/*

  (The MIT License)

  Copyright (C) 2005-2013 Kai Davenport

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

'use strict';

/*

  Quarry Bootstrap Application

  ties together all of the quarry bootstrap directives so you can trigger anything from the
  page this is included upon

  This assumes that the following are included on the page also:

    AngularJS
    Bootstrap CSS
    Bootstrap Angular Directives
  
*/

/* Controllers */

angular
  .module('quarry.ui', [
    
    'ui.bootstrap',
    'ui.router',
    'ui.compat',

    'quarry.core',
    'quarry.ui.summary',
    'quarry.ui.page',
    'quarry.ui.auth',
    'quarry.ui.tree',
    'quarry.ui.containermenu',
    'quarry.ui.renderer',
    'quarry.ui.children',
    'quarry.ui.blueprint',
    'quarry.ui.widgets'

  ])


angular.module('quarry.ui.page', [])


  .controller('NodeHTMLWindowCtrl', ['$scope', 'dialog', 'node', function($scope, dialog, node){

    $scope.node = node;
    $scope.confirmtitle = 'Save ' + node.tagname();

    $scope.confirm = function(){
      console.log('-------------------------------------------');
      console.log('SAVING');
      dialog.close(true);
    }

    $scope.close = function(){
      dialog.close(false);
    }

  }])

  .factory('$nodehtmlwindow', function(){
    
    return function(options){
      var node = options.node;
      var html = options.html;

      var d = $dialog.dialog({
        backdrop: true,
        keyboard: true,
        backdropClick: true,
        template: html,
        resolve:{
          node:function(){
            return node;
          }
        },
        controller: 'NodeHTMLWindowCtrl'
      })

      d.open().then(function(result){

        container.data('modal', false);

        if(result)
        {
          options.done && options.done(result);
          
        }
      })
    }

  })





/*

  ICON
  
*/
angular.module('quarry.ui.containericon', [])

  .directive('containericon', function(){
    return{
      restrict: 'A',
      link:function($scope, $element, attrs){
        if($scope.node){
          $element.attr('src', $scope.node.icon() + '?size=' + attrs.size);
        }
      }
    }
  })

  .directive('containericon2', function(){
    return{
      restrict: 'A',
      scope:{
        node:'='
      },
      link:function($scope, $element, attrs){
        if($scope.node){
          $element.attr('src', $scope.node.icon() + '?size=' + attrs.size);
        }
      }
    }
  })


/*






  AUTH





  
*/

angular.module('quarry.ui.auth', [])

  .directive('authBar', function(){
    return{
      restrict: 'EA',
      templateUrl:'template/auth/bar.html',
      replace:true,
      controller:'AuthCtrl'
    }
  })
  /*
  
    Login Button directive
    
  */
  .directive('loginButton', function(){
    return{
      restrict: 'EA',
      templateUrl:'template/auth/loginbutton.html',
      replace:true
    }
  })

  /*
  
    Project Button directive
    
  */
  .directive('projectButton', function(){
    return{
      restrict: 'EA',
      templateUrl:'template/auth/projectbutton.html',
      replace:true
    }
  })

  .controller('AuthCtrl', ['$scope', function($scope){

    var user = $scope.user;
    var buttontitle = $scope.buttontitle = user.full() ? user.title() : 'Login';
    var active = $scope.active = user.full() ? user.attr('active') || {} : {};
    var usericon = $scope.usericon = user.attr('image');
    var notactivelist = $scope.notactivelist = [];
    var activelist = $scope.activelist = [];
    
    _.each([
      'facebook',
      'twitter',
      'google',
      'github',
      'dropbox'
    ], function(name){
      var user_profile = user.attr(name + '_profile');
      if(active[name]){
        activelist.push({
          id:name,
          name:name.replace(/^\w/, function(st){
            return st.toUpperCase();
          }),
          image:user_profile.image
        })
      }
      else{
        notactivelist.push({
          id:name,
          name:name.replace(/^\w/, function(st){
            return st.toUpperCase();
          }),
          image:user_profile && user_profile.image ? user_profile.image : "/img/" + name + ".png?size=16"
        })
      }
    })


    $scope.loginwith = function(name){
      document.location = $scope.authurl + '/' + name;
    }

    $scope.logout = function(){
      document.location = $scope.authurl + '/logout';
    }
  }])

  .run(["$templateCache", function($templateCache){

    /*
    
      Auth Bar
      
    */
  $templateCache.put("template/auth/bar.html",
    [
'<div class="quarry-auth pull-right" ng-cloak>',
'  <div project-button class="project-button"></div>',
'  <div login-button class="login-button"></div>',
'</div>'
    ].join("\n")
    );

  /*
  
    Login Button
    
  */
  $templateCache.put("template/auth/loginbutton.html",
    [
'<div class="btn-group">',
'  <button class="btn dropdown-toggle"><img ng-show="hasuser" style="border:1px solid #999;margin-right:3px;" ng-src="{{usericon}}" width="16"> {{buttontitle}}</button>',
'  <button class="btn dropdown-toggle" data-toggle="dropdown">',
'    <span class="caret"></span>',
'  </button>',
'  <ul class="dropdown-menu">',
'    <li class="sectiontitle" ng-show="notactivelist.length>0">login with:</li>',
'    <li class="divider" ng-show="notactivelist.length>0"></li>',
'    <li ng-repeat="provider in notactivelist">',
'      <a ng-click="loginwith(provider.name);" ng-href="#">',
'        <img class="icon" ng-src="{{provider.image}}" /> {{provider.name}}',
'      </a>',
'    </li>',
'    <li class="divider" ng-show="hasuser"></li>',
'    <li class="sectiontitle" ng-show="hasuser">connected to:</li>',
'    <li class="divider" ng-show="hasuser"></li>',
'    <li ng-repeat="provider in activelist">',
'      <a ng-click="loginwith(provider.name);" ng-href="#">',
'        <img class="icon" ng-src="{{provider.image}}" /> {{provider.name}}',
'      </a>',
'    </li>',
'    <li class="divider" ng-show="hasuser"></li>',
'    <li ng-show="hasuser">',
'      <a ng-click="logout();" ng-href="#">logout</a>',
'    </li>',
'  </ul>',
'</div>'
    ].join("\n")
    );

  /*
  
    Project button
    
  */
  $templateCache.put("template/auth/projectbutton.html",
    [
'<div class="btn-group" ng-show="user.full()">',
'  <button class="btn btn-mini dropdown-toggle"><i class="icon-hdd icon-black" style="margin-right:4px;"></i> {{currentproject.title()}}</button>',
'  <button class="btn btn-mini dropdown-toggle" data-toggle="dropdown">',
'    <span class="caret"></span>',
'  </button>',
'  <ul class="dropdown-menu">',
'    <li ng-repeat="project in projectlist">',
'      <a ng-click="edit(project);">',
'        {{project.title()}}',
'      </a>',
'    </li>',
'    <li class="divider"></li>',
'    <li>',
'      <a ng-click="create();">new</a>',
'    </li>',
'  </ul>',
'</div>'
    ].join("\n")
    );

}]);








/*






  TREE





  
*/

angular.module('quarry.ui.tree', ['quarry.ui.containericon'])


  /*
  
    Button directive
    
  */
  .directive('tree', function(){
    return{
      restrict: 'EA',      
      scope: { 
        node: '=',
        openstates: '=',
        activecontainer: '=',
        loadfn:'&',
        openfn:'&'

      },
      templateUrl:'template/tree/tree.html',
      replace:true,
      controller:function($scope){

        $scope.sortContainer = function(container){
          return container.title().toLowerCase();
        }

        $scope.loadcontainer = function(node){
          $scope.openfn({
            node:node
          })
        }

        $scope.toggleopen = function(node){
          
          if($scope.openstates[node.quarryid()]=='root'){
            return;
          }
          
          var val = $scope.openstates[node.quarryid()] || false;
          val = $scope.openstates[node.quarryid()] = !val;

          if(val){
            $scope.openfn({
              node:node
            })
          }
        }
      }
    }
  })

  .run(["$templateCache", function($templateCache){

    /*
    
      Recursive tree view
      
    */
  $templateCache.put("template/tree/tree.html",
    [
'<div class="quarry-tree">',
'<div>',
' <div ng-show="!node.attr(\'root\')" ng-click="toggleopen(node);" class="treetoggle"> ',
'   <div ng-hide="openstates[node.quarryid()]">+</div>',
'   <div ng-show="openstates[node.quarryid()]">-</div>',
'</div>',
'<div class="treetitle" ng-class="{treeactive:activecontainer.quarryid()==node.quarryid()}" ng-click="loadcontainer(node);">',
' <img ng-show="!node.attr(\'root\')" class="icon" ng-src="{{ node.icon() + \'?size=16\' }}" size="16" />',
' <small>{{node.title()}}</small>',
'</div>',
'</div>',
'<div ng-show="openstates[node.quarryid()]">',
'<div class="tree">',
' <div ng-repeat="node in node.children().containers() | orderBy:sortContainer" ng-include="\'template/tree/tree.html\'"></div>',
'</div>',
'</div>',
'</div>'
    ].join("\n")
    );

}]);







/*






  SUMMARY





  
*/

angular.module('quarry.ui.summary', ['quarry.ui.containericon'])

  /*
  
    The viewer is the panel of icons representing the contents of a container / results from a search
    
  */
  .directive('summary', function(){
    return{
      restrict: 'EA',
      scope:{
        node:'=',
        selection:'=',
        history:'=',
        cancelfn:'&',
        savefn:'&',
        editfn:'&',
        deletefn:'&'
      },
      templateUrl:'template/summary/summary.html',
      replace:true,
      link:function($scope){

        $scope.editmode = false;
        $scope.$watch('node.data()', function(){
          if(!$scope.node){
            return;
          }
          $scope.editmode = $scope.node.data('editmode') || $scope.node.data('fresh');
        })

        $scope.$watch('node.models[0]', function(){

          if(!$scope.node){
            return;
          }



          var fields = $scope.node.fieldlist(true);
          var props = $scope.node.attr();

          $scope.attrlist = _.map(fields, function(field){

            var property = field.property;
            var title = property.split('.').pop();

            return {
              title:title.replace(/^(\w)/, function(c){
                return c.toUpperCase();
              }),
              value:$scope.node.get_value(property)
            }

          })

        }, true);
      }

    }
  })

  .directive('breadcrumbs', function(){
    return {
      restrict: 'EA',
      scope:{
        node:'=',
        ancestorfn:'&',
        openfn:'&'
      },
      templateUrl:'template/summary/breadcrumbs.html',
      replace:true
    }
  })

  .directive('instructionSummary', function(){
    return {
      restrict: 'EA',
      scope:{
        user:'=',
        instruction:'='
      },
      templateUrl:'template/summary/instructionsummary.html',
      replace:true,
      link:function($scope){

        if(!$scope.instruction){
          return;
        }

        var titlemap = {
          'post':'created',
          'put':'saved',
          'delete':'deleted'
        }

        $scope.actiontitle = titlemap[$scope.instruction.method];
        $scope.counter = $scope.instruction.body.length;
        $scope.summary = 'container' + ($scope.instruction.body.length==1 ? '' : 's');
        $scope.usericon = $scope.user.attr('image');
      }
    }
  })

  .directive('metaSummary', function(){
    return{
      restrict: 'EA',
      templateUrl:'template/summary/meta.html',
      replace:true
      
    }
  })
  
  .run(["$templateCache", function($templateCache){

    /*
    
      main view
      
    */
  $templateCache.put("template/summary/summary.html",
    [
'<div class="well quarry-summary" style="padding-top:5px;">',

'   <div>',
'   <img ng-src="{{ (node.icon() || \'/icons/default/folder.png\') + \'?size=48\' }}" size="48" style="float:right;" />',
'   <h6 class="title">{{node.title()}}</h6>',
'   <div ng-hide="node.tagname()==\'supplychain\'">',

'  <button ng-hide="editmode" type="button" class="btn btn-mini" ng-click="editfn({node:node})"><i class="icon-pencil"></i> Edit</button>',
'  <button style="margin-bottom:5px;" ng-show="editmode" type="button" class="btn btn-mini" ng-click="savefn({node:node})"><i class="icon-ok"></i> Save</button>',
'  <button ng-show="editmode" type="button" class="btn btn-mini" ng-click="cancelfn({node:node})"><i class="icon-remove"></i> Cancel</button>',
'<hr />',
'   </div>',

'   <div meta-summary>',
'   </div>',

'   <div ng-show="selection.length>0" style="height:10px;"></div>',

'   <div ng-show="selection.length>0" style="font-size:.65em;"><u>selection:</u></div>',

'   <div style="font-size:.65em;" ng-repeat="node in selection">{{ node.summary() }}</div>',

'</div>'
    ].join("\n")
    );

            
    /*
    
      breadcrumbs
      
    */
  $templateCache.put("template/summary/breadcrumbs.html",
    [

'<ul class="breadcrumb" style="margin-bottom:10px;">',
'  <li ng-repeat="ancestor in ancestorfn({node:node})"><a href="" style="cursor:pointer;" ng-click="openfn({node:ancestor});"><small>{{ancestor.title()}}</small></a> <span class="divider">/</span></li>',
'  <li class="active"><small>{{node.title()}}</small></li>',
'</ul>'

    ].join("\n")
    );



    /*
    
      instruction view
      
    */
  $templateCache.put("template/summary/instructionsummary.html",
    [

'<div style="font-size:0.85em;">',
'<img ng-src="{{ usericon }}" width=32 style="border:1px solid #999;float:left;margin:5px;margin-right:10px;" />',
'{{ user.title() }} <br /><b>{{ actiontitle }}</b> <small>{{ counter }} {{ summary }}</small>',
'<small>',
'</div>'

    ].join("\n")
    );

  $templateCache.put("template/summary/meta.html",
    [
'<div>',
'   <div ng-show="node.tagname()">',
'     <small>{{node.tagname()}}</small>',
'   </div>',
'   <div ng-show="node.id()">',
'     <small>#{{node.id()}}</small>',
'   </div>',
'   <div ng-show="node.classnames()">',
'     <small>',
'     <ul style="margin-bottom:0px;">',
'       <li ng-repeat="classname in node.classnames()">',
'         {{classname}}',
'       </li>',
'     </ul></small>',
'   </div>',
'   <div style="margin-top:10px;" ng-repeat="property in attrlist">',
'     <small><i>{{property.title}}</i>: {{property.value}}</small>',
'   </div>',
'</div>'
    ].join("\n")
    );


}]);




/*






  DROPDOWN
  






*/
angular.module('quarry.ui.containermenu', [])

  .directive('containerMenu', function(){
    return{
      restrict: 'EA',
      scope:{
        node:'=',
        title:'@',
        trigger:'&'
      },
      replace:true,
      templateUrl:'template/containermenu/menu.html'
    }
  })
  
  .run(["$templateCache", function($templateCache){

    /*
    
      Menu
      
    */
  $templateCache.put("template/containermenu/menu.html",
    [

'<div class="btn-group" ng-show="node.full()">',
'  <button class="btn btn-mini dropdown-toggle" data-toggle="dropdown">',
'   {{title}}',
'    <span class="caret"></span>',
'  </button>',
'  <ul class="dropdown-menu">',
'     <div class="quarrydropdown-menu" ng-repeat="node in node.containers()" ng-include="\'template/containermenu/menuitem.html\'"></div>',
'  </ul>',
'</div>'

    ].join("\n")
    );

  /*
  
    Item
    
  */
  $templateCache.put("template/containermenu/menuitem.html",
    [

'  <li ng-class="{\'dropdown-submenu\': node.children().full()}">',
'    <a style="cursor:pointer;" ng-click="trigger({node:node})"><img containericon size="16" /> {{node.title()}}</a>',
'    <ul ng-show="node.children().full()" class="dropdown-menu">',
'      <div class="quarrydropdown-menu" ng-repeat="node in node.children().containers()" ng-include="\'template/containermenu/menuitem.html\'"></div>',
'    </ul>',
'  </li>',

    ].join("\n")
    );

}]);





/*











  CHILDREN VIEW











  
*/

angular.module('quarry.ui.children', [])

  .directive('childrenView', function(){
    return{
      restrict: 'EA',
      templateUrl:'template/children/view.html',
      replace:true

    }
  })
  /*
  
    The viewer is the panel of icons representing the contents of a container / results from a search
    
  */
  .directive('childrenGrid', function(){
    return{
      restrict: 'EA',
      templateUrl:'template/children/grid.html',
      replace:true,
      scope:{
        openfn:'=',
        node:'=',
        selection:'='
      },
      link:function($scope, $element, $attr){

        function update_selection(){
          if(!$scope.node){
            return;
          }
          $scope.node.children().data('selected', false);

          console.log('-------------------------------------------');
          console.log('-------------------------------------------');
          console.log('-------------------------------------------');
          console.dir($scope.selection);
          _.each($scope.selection, function(selected){
            selected.data('selected', true);
          })
        }

        $scope.$watch('selection', update_selection);

        $scope.sortContainer = function(container){
          return container.title().toLowerCase();
        }

        $scope.opencontainer = function(container){
          $scope.openfn({
            node:container
          })
        }

        $scope.selectcontainer = function(container, ctrlKey){
          var selection = $scope.selection;

          function is_in_selection(){
            return _.some($scope.selection, function(selected){
              return selected.quarryid()==container.quarryid();
            })
          }

          function remove_from_selection(){
            var selected_index = -1;

            _.each($scope.selection, function(selected, index){
              if(selected.quarryid() == container.quarryid()){
                selected_index = index;
                return false;
              }
            })

            if(selected_index>=0){
              $scope.selection.splice(selected_index, 1);
            }
          }

          function clear_selection(){
            $scope.selection.splice(0, $scope.selection.length);
          }

          function add_to_selection(){
            if(!is_in_selection()){
              $scope.selection.push(container);
            }
          }

          /*
          
            TOGGLE
            
          */
          if(ctrlKey){
            if(is_in_selection()){
              remove_from_selection();
            }
            else{
              add_to_selection();
            }
          }
          /*
          
            ADD
            
          */
          else{
            clear_selection();
            add_to_selection();
          }

          $scope.$emit('newselection', selection);
          update_selection();
        }

        $scope.deselect = function(){
          $element.removeClass('open');  
        }

        $scope.closedropdown = function(){
          $element.removeClass('open');
        }
      }
    }
  })

  .directive('containerbox', function(){
    return{
      restrict: 'EA',
      templateUrl:'template/children/containerbox.html',
      replace:true,
      scope:true,
      link:function($scope, $element, $attrs){

        /*
        
          lets not have the tooltip if no jQuery
          
        */
        var hastooltip = false;

        if($ && $($element).tooltip){

          hastooltip = true;
          $($element).tooltip({
            html:true,
            title:'<div>' + $scope.node.summary({
              title:false
            }) + '</div>',
            container:'.quarry-viewer',
            trigger:'manual'
          })
        }

/*
        $($element).popover({
          html:true,
          content:'<div>popover</div>',
          container:'.quarry-viewer',
          trigger:'manual'
        })
*/
        $element.bind('contextmenu', function(event){
          event.preventDefault();
          $scope.$apply(function(){
            $scope.selectcontainer($scope.node, event.ctrlKey)  
          })
          
          return false;
        })

        var hovering = false;

        $scope.show_tooltip = function(){
          if(!hastooltip){
            return;
          }

          hovering = true;

          setTimeout(function(){
            if(hovering){
              $($element).tooltip('show');    
            }
          }, 500)
          
        }

        $scope.hide_tooltip = function(){
          if(!hastooltip){
            return;
          }

          hovering = false;
          $($element).tooltip('hide');
        }
      }
    }
  })

  .directive('navbar', function(){
    return{
      restrict: 'EA',
      templateUrl:'template/children/navbar.html',
      replace:true,
      controller:function($scope){
        $scope.triggercreate = function(container, installer_mode){
          $scope.createfn({
            node:container,
            mode:installer_mode ? 'installer' : 'blueprint'
          })
        }

        $scope.triggeropen = function(){
          if($scope.selection.length<0){
            return;
          }

          $scope.openfn({
            node:$scope.selection[0]
          })
        }

        $scope.confirmdelete = function(){
          $scope.deletefn();
        }

        $scope.selectall = function(){
          $scope.selection = $scope.node.children().containers();
        }

        $scope.selectnone = function(){
          $scope.selection = [];
        }
      },
      link:function($scope, $element){
        if(!$scope.blueprintfn){
          return;
        }

        $scope.blueprintnode = $scope.blueprintfn({
          node:$scope.node
        })

        $scope.installernode = $scope.installerfn({
          node:$scope.node
        })

        $scope.ancestors = $scope.ancestorfn({node:$scope.node});

        
      }
    }
  })


  .run(["$templateCache", function($templateCache){

  /*
  
    Main view
    
  */
  $templateCache.put("template/children/view.html",
    [

'     <div class="children-view">',
'      <div class="row-fluid" id="nav">',
'       <div class="span12">',
'         <div navbar></div>',
'       </div>',
'      </div>',
'      <div class="row-fluid">',
'       <div class="span9" id="renderer">',
'         <children-grid node="node" selection="selection" openfn="openfn" />',
'       </div>',
'      </div>',
'     </div>'
    ].join("\n")
    );

  $templateCache.put("template/children/grid.html",
    [

'         <div class="quarry-viewer">',
'             <div ng-repeat="node in node.children().containers() | orderBy:sortContainer">',
'               <div containerbox node="node">',
'               </div>',
'             </div>',
'         </div>'

    ].join("\n")
    );

  /*
  
    Navbar
    
  */
  $templateCache.put("template/children/navbar.html",
    [
'<div>',




'   <div class="row-fluid">',
'     <div class="span12">',
'       <div class="input-append" style="width:100%;">',
'       <input class="span10" id="appendedInputButton" type="text">',
'       <button class="btn" type="button"><i class="icon-search"></i> Go Selecta</button>',
'       </div>',
'     </div>',
'   </div>',

'   <div class="row-fluid">',
'     <div class="span12">',

'       <div container-menu title="Install" node="installernode" trigger="triggercreate(node, true);"></div>',
'       <div container-menu title="Add" node="blueprintnode" trigger="triggercreate(node);"></div>',

'       <button class="btn btn-mini" ng-show="selection.length>0" ng-click="triggeropen();">Open</button>',

        '<div class="btn-group" ng-show="selection.length>0" >',
        '  <a class="btn btn-mini dropdown-toggle" data-toggle="dropdown">',
        '    Delete',
        '    <span class="caret"></span>',
        '  </a>',
        '  <ul class="dropdown-menu">',
        '    <li><a tabindex="-1" ng-click="confirmdelete();">Confirm</a></li>',
        '  </ul>',
        '</div>',

'       <button style="margin-left:20px;" class="btn btn-mini" ng-click="upfn();"><i class="icon-arrow-up"></i> Up</button>',
'       <button class="btn btn-mini" ng-click="selectall();"><i class="icon-plus-sign"></i> Select All</button>',
'       <button class="btn btn-mini" ng-click="selectnone();"><i class="icon-minus-sign"></i> Select None</button>',

'     </div>',
'   </div>',

'</div>'
    ].join("\n")
    );


  /*
  
    Container box
    
  */
  $templateCache.put("template/children/containerbox.html",
    [
'   <div class="container containerbox" ng-class="{selected:node.data(\'selected\')}" ng-cloak ng-mouseenter="show_tooltip();" ng-mouseleave="hide_tooltip();" ng-click="hide_tooltip();selectcontainer(node, $event.ctrlKey);" ng-dblclick="opencontainer(node);">',
'     <div class="viewer-elem">',
'       <img containericon size="48" /><br />',
'       <small>{{node.title()}}</small>',
'     </div>',
'   </div>'
    ].join("\n")
    );

}]);




/*






  FORM





  
*/

angular.module('quarry.ui.blueprint', [])


  /*
  
    a generic field list showing all attr properties (with add button)
    
  */
  .directive('attrView', function(){
    return {
      restrict: 'EA',
      replace:true,
      transclude:true,
      scope:true,
      templateUrl:"template/blueprint/fieldlist.html",
      link:function($scope){

        $scope.showappend = true;
        $scope.showbuttons = $scope.node ? $scope.node.data('modal')!=true : true;

        $scope.$watch('node.models[0].meta.fieldlist', function(){

          if(!$scope.node){
            return;
          }

          $scope.formfields = $scope.node.fieldlist();

        })

        $scope.addfield = function(type){
          var title = $scope.newfieldtitle;

          $scope.newfieldtitle = '';

          if(!title || !title.match(/\w/)){
            return;
          }

          var fieldname = title.replace(/\W/g, '').toLowerCase();

          var newfield = {
            title:title.replace(/^(\w)/, function(c){
              return c.toUpperCase();
            }),
            property:'attr.' + fieldname,
            type:type
          }

          if(!$scope.node){
            return;
          }

          var model = $scope.node.get(0);
          var meta = model.meta;

          var existingfields = meta.fieldlist || [];
          
          existingfields = existingfields.concat([newfield]);

          meta.fieldlist = existingfields;          
        }
      }
    }
  })

  /*
  
    a preset field list showing the core meta (with add button)
    
  */
  .directive('metaView', function(){
    return {
      restrict: 'EA',      
      replace:true,
      transclude:true,
      scope:true,
      templateUrl:"template/blueprint/fieldlist.html",
      controller:function($scope){
        $scope.showappend = false;
        $scope.showbuttons = $scope.node ? $scope.node.data('modal')!=true : true;
        $scope.formfields = [{
          title:'Tagname',
          type:'text',
          property:'meta.tagname'
        },{
          title:'ID',
          type:'text',
          property:'meta.id'
        },{
          title:'Class',
          type:'list',
          property:'meta.classnames'
        }]
      }
    }
  })


  /*
  
    transclusion for inserting a form element inside a Twitter bootstrap form control
    
  */
  .directive('fieldControl', function(){
    return {
      restrict: 'EA',
      transclude:true,
      templateUrl:"template/blueprint/fieldcontrol.html",
      link:function($scope, $elem, $attrs){
        $scope.title = $attrs.title;
      }
    }
  })

  /*
  
    transclusion for inserting a form element inside a Twitter bootstrap form control
    
  */
  .directive('fieldRender', function(){

    return {
      restrict: 'EA',
      controller:function($scope, $compile){
        $scope.compile = function(html){
          return $compile(html)($scope);
        }
      },
      link:function($scope, $element){
        var html = '<' + $scope.field.type + '-field />';
        var elem = $scope.compile(html);
        $element.append(elem);
      }
    }
  })

  .directive('textField', function(){
    return {
      restrict: 'EA',
      replace:true,
      templateUrl:"template/blueprint/text.html",
      link:function($scope, $element){
        if(!$scope.node || !$scope.field){
          return;
        }

        var fieldparts = $scope.field.property.split('.');
        var lastfield = fieldparts.pop();
        var model = $scope.node.get_value(fieldparts.join('.'));

        $scope.value = model[lastfield];

        $scope.handlechange = function(){

          model[lastfield] = $scope.value;
        }

      }
    }
  })

  /*
  
    text field that manipulates an array
    
  */
  .directive('listField', function(){
    return {
      restrict: 'EA',
      replace:true,
      templateUrl:"template/blueprint/text.html",
      link:function($scope, $element){
        if(!$scope.node || !$scope.field){
          return;
        }

        var fieldparts = $scope.field.property.split('.');
        var lastfield = fieldparts.pop();
        var model = $scope.node.get_value(fieldparts.join('.'));
        
        var arr = model[lastfield];

        if(!arr){
          arr = model[lastfield] = [];
        }

        $scope.value = arr.join(' ');

        $scope.handlechange = function(){
          var text = ('' + $scope.value);
          var parts = text.replace(/^\s+/, '').replace(/\s+$/, '').split(/\s+/);
          var filterparts = _.filter(parts, function(part){
            return part.match(/\w/);
          })
          model[lastfield] = filterparts;
        }
      }
    }
  })

  .directive('numberField', function(){
    return {
      restrict: 'EA',      
      replace:true,
      templateUrl:"template/blueprint/number.html"
    }
  })

  .directive('checkField', function(){
    return {
      restrict: 'EA',      
      replace:true,
      templateUrl:"template/blueprint/check.html"
    }
  })

  .directive('valueField', function(){
    return {
      restrict: 'EA',
      replace:true,
      templateUrl:"template/blueprint/value.html"
    }
  })

  .run(["$templateCache", function($templateCache){


  /*
  
    attr list

    Generic form that loops every attribute

    
  */
  $templateCache.put("template/blueprint/fieldlist.html",
[

'<ng-form class="form-horizontal">',

'<div ng-repeat="field in formfields">',

'<field-control>',

'     <field-render />',

'</field-control>',

'</div>',

'<div ng-transclude></div>',



'     <div class="control-group newfieldgroup" ng-show="showappend" style="padding-bottom:150px;">',
'       <label class="control-label" for="newfield"><small>New Field Title: </small></label>',
'       <div class="controls">',

          '<div class="input-append">',
          '  <input style="width:65%;" id="appendedDropdownButton" type="text" ng-model="newfieldtitle" />',
          '  <div class="btn-group">',
          '    <button class="btn dropdown-toggle" data-toggle="dropdown">',
          '      <small>add type</small>',
          '      <span class="caret"></span>',
          '    </button>',
          '    <ul class="dropdown-menu">',
          '    <li><a ng-click="addfield(\'text\');">text</a></li>',
          '    <li><a ng-click="addfield(\'number\');">number</a></li>',
          '    <li><a ng-click="addfield(\'check\');">checkbox</a></li>',
          '    <li><a ng-click="addfield(\'list\');">list</a></li>',
          '   </ul>',
          '   </div>',
          '  </div>',
          '</div>',

'     </div>',



'<div class="form-actions" ng-show="showbuttons">',

'  <button type="button" class="btn btn-mini" ng-click="cancel()" ng-show="modalwindow">Cancel</button>',
'  <button type="button" class="btn btn-mini" ng-click="savefn({node:node})">Save</button>',

'</div>',






'</ng-form>',

].join("\n")
    );


  /*
  
    Field control
    
  */

  $templateCache.put("template/blueprint/fieldcontrol.html",
[

'     <div class="control-group">',
'       <label class="control-label" for="{{ field.property }}"><small>{{ field.title }}</small></label>',
'       <div class="controls" ng-transclude>',

'       </div>',
'     </div>'

].join("\n")
    );

  /*
  
    Text Field
    
  */
  $templateCache.put("template/blueprint/text.html",
[

'    <input type="text" id="{{field.property}}" ng-change="handlechange();" ng-model="value">'


].join("\n")
    );

  /*
  
    Number Field
    
  */
  $templateCache.put("template/blueprint/number.html",
[

'    <input type="number" id="{{field.property}}" ng-change="handlechange();" ng-model="value">'


].join("\n")
    );

  /*
  
    Checkbox Field
    
  */
  $templateCache.put("template/blueprint/check.html",
[

'    <input type="checkbox" id="{{field.property}}" ng-model="value">'


].join("\n")
    );

  /*
  
    value Field
    
  */
  $templateCache.put("template/blueprint/value.html",
[

'     <div ng-bind="value"></div>'


].join("\n")
    );


}]);





/*










  MINI DIGGER

  connects to the warehouse service using the given path

  this lets a digger exist in isolation buried inside another digger (as a form component)

  you've gotta love Angular JS to do this : )

  
*/

angular.module('quarry.ui.widgets', [])

  .filter('removeext', function(){
    return function(val){
      return val.replace(/\.\w+$/, '');
    }
  })

  .directive('iconDigger', function(){
    return {
      restrict: 'EA',
      replace:true,
      templateUrl:'template/widgets/icondigger.html',
      scope:{
        /*
        
          this is the URL that points to the back-end warehouse

          we use $warehouse.connect(url) to get a container pointing to it
          
        */
        path:'@',
        title:'@',
        container:'='
      },
      controller:['$scope', '$warehouse', function($scope, $warehouse){
        $scope.warehouse = $warehouse.connect($scope.path);
        $scope.currentresults = $scope.warehouse.blank();
        //$scope.allresults = $scope.warehouse.blank();
        //$scope.page = 0;
        //$scope.pagesize = 100;

        $scope.select = function(node){
          console.log('-------------------------------------------');
          console.log('-------------------------------------------');
          console.dir(node.toJSON());
          $scope.container.meta('icon', node.meta('icon'));
        }

        $scope.showpage = function(page){
          var from = page * $scope.pagesize;
          var to = from + $scope.pagesize;

          $scope.currentresults = $scope.allresults.range(from, to);
        }
      }],
      link:function($scope){

        $scope.warehouse.attr('name', $scope.title);
          
        $scope.warehouse('>*')

          .ship(function(results, res){

            $scope.$apply(function(){
              $scope.currentresults = results;
            })

          })

      }
    }
  })

 .run(["$templateCache", function($templateCache){

    /*
    
      Menu
      
    */
  $templateCache.put("template/widgets/icondigger.html",
    [

'<div class="row-fluid digger" ng-show="warehouse.full()" ng-cloak>',
'       <div class="span12">',

  '<img size="48" ng-src="{{ container.icon() + \'?size=48\' }}" style="float:left;" /><br /><br />',

'   <hr />',
'         <div class="quarry-viewer">',
'             <div ng-repeat="child in currentresults.containers()">',


'   <div class="container iconcontainerbox" ng-cloak ng-click="select(child);">',
'     <div class="viewer-elem">',
'       <img size="24" ng-src="{{ \'/files/icon/\' + child.id() + \'?size=24\' }}" /><br />',
'       <div style="width:50px;overflow:hidden;font-size:0.7em;">{{ child.title() | removeext }}</span>',
'     </div>',
'   </div>',

'       </div>',
'      </div>',
    
'   </div>',
   
'</div>'
    ].join("\n")
    );


}]);



/*










  GENERAL RENDERER










  
*/

angular.module('quarry.ui.renderer', ['quarry.ui.page'])

  .directive('renderer', function(){
    return {
      restrict: 'EA',
      replace:true,
      scope:{
        node:'=',
        selection:'=',
        ancestorfn:'&',
        createfn:'&',
        openfn:'&',
        deletefn:'&',
        savefn:'&',
        renderfn:'&',
        blueprintfn:'&',
        installerfn:'&',
        upfn:'&'
      },
      controller:function($scope, $compile){

        $scope.editmode = false;

        $scope.compile = function(html){

          return $compile(html)($scope);
        }

        /*
        
          the default blueprint with children (optional), attr & meta
          
        */


      },
      link:function($scope, $element){

        $scope.rendercontainer = function(){
          var html = $scope.renderfn($scope.node, $scope.editmode) || 'no renderer HTML given';

          console.log('-------------------------------------------');
          console.log('-------------------------------------------');
          console.dir(html);

          var el = $scope.compile(html);

          $element.children().remove();
          $element.append(el);
        }

        $scope.$watch('node.data("editmode")', function(){
          $scope.rendercontainer();
        })

        /*
        
          this calls the render fn which will return HTML to compile into the view
          
        */
        $scope.$watch('node.quarryid()', function($ev){
          if(!$scope.node){
            return;
          }
          $scope.node.data('editmode', $scope.editmode);
          $scope.rendercontainer();
        })
      }
    }
  })