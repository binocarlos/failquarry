!function ($, $quarry) {

  "use strict"; // jshint ;_;

  var _ = $quarry._;

  var DiggerButton = function (element, options) {
    this.element = $(element);

    this.options = _.defaults(options, {
      container:$quarry.new(),
      name:'dig'
    })
    // check for the container api
    this.container = this.options.container;

    this.build();
  }

  var templates = $quarry.templates({

    // the main button wrapper

        

    main:[
          '<a class="dropdown-toggle" id="quarryview-size" data-toggle="dropdown" href="#">',
            '{{name}} <b class="caret"></b>',
          '</a>',
          '<ul id="main_dropdown" class="dropdown-menu">',
          '</ul>'
/*    
'<div class="btn-group">',
  '<a class="btn dropdown-toggle btn-small btn-primary" data-toggle="dropdown" href="#">',
    '<span id="button_title">{{name}}&nbsp;</span>',
    '<span class="caret"></span>',
  '</a>',
  '<ul class="dropdown-menu" id="main_dropdown">',
  '</ul>',
'</div>'
*/
    ],

    // a single container

    item:[
      '<li>',
        '<a tabindex="-1" href="#">',
          '{{name}}',
        '</a>',
      '</li>'
    ]
  })

  DiggerButton.prototype = {

    constructor: DiggerButton,

    build: function(){

      var $this = this.element;
      var container = this.container;
      var options = this.options;

      var self = this;

      $this.html(templates.render('main', {
        name:this.options.name
      })).addClass('dropdown');

      var main_dropdown = $this.find('#main_dropdown');

      function container_loaded(){
        self.container.each(function(result){
          // load the root elements and build drop down item for them
          main_dropdown.append(self.buildMenuItemFromContainer(result));  
        })
      }

      // if the loader is passed in then our container is arriving async style
      if(!this.options.loader){
        container_loaded();
      }
      else{
        this.options.loader(function(container){
          self.container = container;

          console.log('********************************');
          console.log('ALL LOADED');
          console.log(JSON.stringify(container.raw(), null, 4));
          container_loaded();
        })
      }
      
      
      
    },

    buildMenuItemFromContainer: function(container){
    
      var $this = this.element;
      var self = this;
      var li = $(templates.render('item', container));
      var a = li.find('a');

      li.css({
        'display':'block'
      })
      // sub menu
      if(container.count()>0){

        var ul = $('<ul></ul>')
          .addClass('dropdown-menu');

        container.each(function(child){
          ul.append(self.buildMenuItemFromContainer(child));
        })

        li
          .addClass('dropdown-submenu')
          .append(ul);
      }

      a.data('container', container);

      a.click(function(){
        $this.trigger('container', [container]);
      })

      return li;
    }
  }

  $.fn.diggerbutton = function (option, args) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('diggerbutton')
        , options = typeof option == 'object' ? option : {}
      if (!data) $this.data('diggerbutton', (data = new DiggerButton(this, options)))
      if (typeof option == 'string') data[option](args)
    })
  }

  $.fn.diggerbutton.Constructor = DiggerButton;

}(window.jQuery, window.quarryio)