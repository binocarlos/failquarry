!function ($, $quarry) {

  "use strict"; // jshint ;_;

  var _ = $quarry._;

  var QuarryView = function (element, options) {
    this.element = $(element);

    this.options = _.defaults(options, {
      view:'normal',
      navbar:true
    })

    // the container we are currently rendering
    this.container = null;

    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log(this.options);
    
    this.build();
  }

  var templates = $quarry.templates({

    // the top navbar
    navbar:[
      '<ul id="nav" class="breadcrumb">',
        '<li id="add_button" class="dropdown">',

        '</li>',
        '<span class="divider" id="add_button_divider">/</span>',
        '<li id="view_button" class="dropdown">',
          '<a class="dropdown-toggle" data-toggle="dropdown" href="#">',
            'view <b class="caret"></b>',
          '</a>',

          '<ul id="quarryview-size-choose" class="dropdown-menu" role="menu">',
          '</ul>',
        '</li>',
      '</ul>'
    ],

    // the main results container
    main:[
      '<div id="quarryview-top">',
        '<div id="results">',
        
        '</div>',
      '</div>'
    ],

    
    floater:[
      '<div class="quarryview-item">',
        '<div id="icon"></div>',
        '<span id="title">{{title}}</span>',
      '</div>'
    ],

    
    list:[
      '<div class="quarryview-item">',
        '<div id="icon"></div>',
        '<span id="title">{{title}}</span>',
        '<span id="selector">{{selector}}</span>',
      '</div>'
    ]
  })

  function icon_renderer(elem, container, size){
    var icon = $quarry.icon(container)
      .use('size', size)
      .url()

    elem
      .width(size)
      .height(size)
      .css({
        'background-image':'url("' + icon + '")',
        'background-position':'center',
        'background-repeat':'no-repeat'
      })
  }

  function list_renderer(options){
    options || (options = {});

    _.defaults(options, {
      text:1,
      iconsize:24
    })

    return function(container){

      var div = $(templates.render('list', {
          title:container.title(),
          selector:container.selector_string()
        }))

      div
        .css({
          'font-size':options.text + 'em'
        })

      icon_renderer(div.find('#icon'), container, options.iconsize);
        
      div.find('#icon')
        .css({
          'float':'left',
          'margin-right':'10px'
        })

      div.find('#title')
       .css({
          'float':'left',
          'margin-right':'10px'
        })
        .width(200)

      return div;
    }
  }

  function float_renderer(options){

    options || (options = {});

    _.defaults(options, {
      size:100,
      text:1,
      iconsize:48
    })

    return function(container){

      var div = $(templates.render('floater', {
          title:container.title(),
          selector:container.selector_string()
        }))

      icon_renderer(div.find('#icon'), container, options.iconsize);

      div
        .css({
          'float':'left',
          'width':options.size + 'px',
          'height':options.size + 'px',
          'text-align':'center',
          'font-size':options.text + 'em'
        })
      
      div.find('#title')
        .css({
          'display':'block'
        })

      div.find('#icon')
        .css({
          'width':'100%'
        })

      return div;
    }
  }

  var renderers = {
    list:list_renderer({
      text:1,
      iconsize:16
    }),
    tiny:float_renderer({
      size:50,
      text:.65,
      iconsize:16
    }),
    small:float_renderer({
      size:70,
      text:.85,
      iconsize:32
    }),
    normal:float_renderer({
      size:100,
      text:1,
      iconsize:48
    }),
    large:float_renderer({
      size:150,
      text:1.2,
      iconsize:72
    }),
    huge:float_renderer({
      size:200,
      text:1.4,
      iconsize:128
    })

  }

  QuarryView.prototype = {

    constructor: QuarryView,

    build: function(){

      var $this = this.element;
      var options = this.options;

      var self = this;

      $this.html(templates.render('main', {
        
      }))

      /*
        The basic starting size
       */
      $this.find('#results').css({
        'font-size':'0.8em'
      })

      /*
        Build the top navbar

       */
      if(this.options.navbar){

        var $navbar = $(templates.render('navbar', {
        
        }))

        $navbar.insertBefore($this.find('#results'));

        if(this.options.add_button){

          var button_options = _.defaults(this.options.add_button, {
            name:'add'
          })
          // create the add button with the given config
          $navbar.find('#add_button')
            .diggerbutton(button_options)
            .bind('container', function(e, blueprint_container){
              $this.trigger('add', [blueprint_container]);
            })
        }
        
        self.toggle_add_button(false);
        
        /*
          Loop each of the renderers and offer up an option to re-paint
         */
        _.each(renderers, function(fn, name){
          var option = $('<li><a tabindex="-1" href="#">' + name + '</a></li>').css('display', 'block')

          option.find('a')
            .click(function(){
              self.change_view($(this).data('view'));
            })
            .data('view', name);

          $navbar.find('#quarryview-size-choose').append(option);

        })
      }

    },

    toggle_add_button:function(mode){
      var $this = this.element;

      mode ? $this.find('#add_button, #add_button_divider').show() : $this.find('#add_button, #add_button_divider').hide();
    },

    change_view: function(new_view){
      this.options.view = new_view;
      this.paint();
    },

    paint: function(){

      var $this = this.element;
      var self = this;
      var results_div = $this.find('#results');

      results_div.html('');

      var renderer = renderers[this.options.view];

      this.container.each(function(result){

        var elem = renderer(result);

        elem.data('container', result);

        results_div.append(elem);

      })
    },

    render: function(container){

      var $this = this.element;
      var self = this;
      var results_div = $this.find('#results');

      this.container = container;

      self.toggle_add_button(container.permissions().write ? true : false);

      this.paint();
    }
  }

  $.fn.quarryview = function (option, args) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('quarryview')
        , options = typeof option == 'object' ? option : {}
      if (!data) $this.data('quarryview', (data = new QuarryView(this, options)))
      if (typeof option == 'string') data[option](args)
    })
  }

  $.fn.quarryview.Constructor = QuarryView;

}(window.jQuery, window.quarryio)