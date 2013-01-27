!function ($, $quarry) {

  "use strict"; // jshint ;_;

  var _ = $quarry._;

  var UserBar = function (element, options) {
    this.element = $(element);
    this.options = _.defaults(options, {
      container:$quarry.new()
    })
    // check for the container api
    this.user = this.options.user;
    
    // we do nothing is there is no user!
    if(this.user){
      this.build();  
    }
    
  }

  var templates = $quarry.templates({

    // the user bar with projects list and trigger

    main:[

            '<div class="nav pull-right">',

              '<p class="navbar-text nav pull-right" style="font-size:.8em;">',
                '<a class="navbar-link" style="cursor:pointer;" id="displayname">logged in as {{user_name}}</a>',
              '</p>',

              '<ul class="nav pull-right">',
                '<li class="dropdown" id="fat-menu">',
                  '<a data-toggle="dropdown" class="dropdown-toggle" role="button" id="drop3" href="#">{{current_project_name}} <b class="caret"></b></a>',
                  '<ul aria-labelledby="drop3" role="menu" class="dropdown-menu">',

                    '{{#projects}}',
                      '<li><a href="#" class="project_link" data-index="{{index}}" tabindex="-1">{{name}}</a></li>',
                    '{{/projects}}',

                    '<li class="divider"></li>',
                    '<li><a href="#" id="addproject" tabindex="-1">add project</a></li>',
                  '</ul>',
                '</li>',
              '</ul>',

            '</div>'
    ]
  })

  UserBar.prototype = {

    constructor: UserBar,

    build: function(){

      var $this = this.element;
      var user = this.user;
      var options = this.options;

      var self = this;
      
      var projects = user.projects || [];
      var current_project = projects[user.current_project_index];
      var current_project_name = current_project ? current_project.name : '';

      var $bar = $(templates.render('main', {
        user_name:user.name,
        current_project_name:current_project_name,
        projects:_.map(projects, function(project, index){
          project.index = index;
          return project;
        })
      }))

      $this.append($bar);

      $this.on('click', '#displayname', function(){
        $this.trigger('user');
      })

      $this.on('click', '#addproject', function(){
        $this.trigger('addproject');
      })

      $this.on('click', '.project_link', function(){
        
        var index = parseInt($(this).attr('data-index'));
        var project = projects[index];
        
        $this.trigger('project', [index, project]);
      })

    }
  }

  $.fn.userbar = function (option, args) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('userbar')
        , options = typeof option == 'object' ? option : {}
      if (!data) $this.data('userbar', (data = new UserBar(this, options)))
      if (typeof option == 'string') data[option](args)
    })
  }

  $.fn.userbar.Constructor = UserBar;

}(window.jQuery, window.quarryio)