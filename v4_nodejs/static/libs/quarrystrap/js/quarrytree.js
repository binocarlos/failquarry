!function ($, $quarry) {

  "use strict"; // jshint ;_;

  var _ = $quarry._;

  var QuarryTree = function (element, options) {
    this.element = $(element);

    this.options = _.defaults(options, {
      selectfirst:false,
      container:$quarry.new()
    })

    this.root_container = this.options.container;
    
    this.build();
  }

  var templates = $quarry.templates({

    // the main button wrapper

    main:[
'<div id="results">',
  
'</div>'
    ],

    // a single container

    item:[
      '<div class="quarryview-item">',
        '<a href="#" id="title">',
        '<b id="caret" class="right-caret"></b>',
        '<div id="icon"></div>',
        '{{title}}',
        '</a>',
        '<div id="children">',
        '</div>',
      '</div>'
    ]
  })

  QuarryTree.prototype = {

    constructor: QuarryTree,

    build: function(){

      var $this = this.element;
      var options = this.options;

      var self = this;

      $this.html(templates.render('main', {
        
      }))

      this.render({
        container:this.root_container
      })
      
    },

    // called to add some children to a container once loaded
    expand: function(options){

      options || (options = {})

      var parent = options.parent;
      var results = options.results;

      var $this = this.element;
      var self = this;
      var results_div = $this.find('#results');

      var container_div = results_div.find('.quarryview-item[container_id="' + parent.quarryid() + '"]');

      container_div.find('#children').html('');

      this.render({
        container:results,
        to_div:container_div.find('#children')
      })

      container_div.find('#children').show().slideDown();
    },

    // called to apply the top-level container to this tree
    render: function(options){

      options || (options = {})

      var container = options.container;
      var to_div = options.to_div;
    
      var $this = this.element;
      var self = this;
      var results_div = to_div ? to_div : $this.find('#results');

      results_div.html('');

      container.each(function(result){

        var result_elem = $(templates.render('item', {
          title:result.title()
        }))

        var iconsize = 16;

        var icon = $quarry.icon(result)
          .use('size', iconsize)
          .url()

        result_elem.find('#icon')
          .width(iconsize)
          .height(iconsize)
          .css({
            'background-image':'url("' + icon + '")',
            'background-position':'center',
            'background-repeat':'no-repeat',
            'margin-right':'7px',
            'margin-top':'3px',
            'float':'left'
          })

        result_elem.find('#caret')
          .css({
            'margin-top':'7px',
            'margin-right':'5px'
          })

        result_elem.find('#children')
         .css({
            'margin-left':'15px'
          })

        result_elem
          .css({
            'display':'block',
            'overflow':'hidden',
            'cursor':'pointer',
            'white-space':'nowrap',
            'font-size':'.85em'
          })
          .attr('container_id', result.quarryid())
          .click(function(e){

            var current_state = $(this).data('expanded');
            if(!current_state){
              current_state = false;
            }

            if(current_state){
              $(this).find('#children *').remove();
            }
            else{
              console.log('LOADING');
              $this.trigger('container', [result]);
            }
            
            current_state = !current_state;
            $(this).data('expanded', current_state);

            e.stopImmediatePropagation();
            e.preventDefault();
          })          

        results_div.append(result_elem);
      })

    }


  }

  $.fn.quarrytree = function (option, args) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('quarrytree')
        , options = typeof option == 'object' ? option : {}
      if (!data) $this.data('quarrytree', (data = new QuarryTree(this, options)))
      if (typeof option == 'string') data[option](args)
    })
  }

  $.fn.quarrytree.Constructor = QuarryTree;

}(window.jQuery, window.quarryio)