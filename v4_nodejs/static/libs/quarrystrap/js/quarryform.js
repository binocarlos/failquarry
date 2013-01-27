!function ($, $quarry) {

  "use strict"; // jshint ;_;

  var _ = $quarry._;

  var templates = $quarry.templates({

    // the main form with tabs

    main:[
      '<div class="tabbable">',
        '<ul id="tabnav" class="nav nav-tabs">',
          
        '</ul>',
        '<form class="form-horizontal">',
          '<fieldset>',
            '<div id="tabcontent" class="tab-content">',
              
            '</div>',
          '</fieldset>',
        '</form>',
      '</div>'
    ],

    tablink:'<li><a href="#{{id}}">{{title}}</a></li>',

    tabpane:'<div class="tab-pane" id="{{id}}"></div>',

    wrapper:[
      '<div class="control-group">',
        '<label class="control-label">{{title}}</label>',
        '<div class="controls">',
          
        '</div>',
      '</div>'
    ]

  })

  /*

      ////////////////////////////////////////////////////////////////////////////
      ////////////////////////////////////////////////////////////////////////////
      ////////////////////////////////////////////////////////////////////////////
      ////////////////////////////////////////////////////////////////////////////
      // Helpers
  */

  /*
    For labels
   */
  function ucwords(str){
    return (str + '').replace(/^([a-z])|\s+([a-z])/g, function ($1) {
        return $1.toUpperCase();
    });
  }

  function field_id(field, container){
    return container.quarryid() + '_' + field.field;
  }

  /*
    auto wrap in label horizontal style
   */

  function field_wrapper(elem, options){

    options || (options = {})

    var ret = $(templates.render('wrapper', options));

    if(elem){
      ret.find('.controls').append(elem);
    }

    return ret;
  }

  /*
    basic text field without wrapper
   */

  function rawtext(options){
    options || (options = {})
    var elem = $('<input />');

    elem
      .attr({
        'type':'text'
      })

    if(options.placeholder){
      elem.attr('placeholder', options.placeholder);
    }
      
    return elem;
  }

  /*
    time saver for text based fields
   */
  /*
    normal text field
   */
  function texttemplate(container, field, handlers){

    // the actual element we are inputting to
    var element = rawtext(field);

    var fieldname = field.field;

    handlers || (handlers = {});

    // turn the container value into a GUI one
    var flatten_handler = handlers.flatten || function(val){
      return val;
    }

    // turn the GUI value into a value for the container
    var parse_handler = handlers.parse || function(val){
      return val;
    }

    // write the container value onto the DOM
    var update_handler = function(){
      // start off with the value rendered
      element.val(flatten_handler(container.attr(fieldname)));
    }

    // the wrapper div to add into the form
    var wrapper = field_wrapper(element, {
      title:field.title
    })

    // hook up the binding events so we know when stuff has changed
    element.quarrybinding({
      container:container,
      field:field
    }).on('error', function(e, fields){
        wrapper.removeClass('success');
        wrapper.addClass('error');

        $('<span class="help error" style="color:#aa0000;font-size:0.7em;">&nbsp;' + fields.join(', ') + '</span>')
          .appendTo(element.parent());
      })
      // this is triggered when the value entered is correct
      .on('updated', function(){
        wrapper.removeClass('error');
        wrapper.addClass('success');

        element.parent().find('span.error').remove();

        update_handler();
      })

    // now the actual event triggers
    element.on('change', function(){      
      container.attr(fieldname, parse_handler(element.val()));
    })

    update_handler();

    return wrapper;
  }

  /*

      ////////////////////////////////////////////////////////////////////////////
      ////////////////////////////////////////////////////////////////////////////
      ////////////////////////////////////////////////////////////////////////////
      ////////////////////////////////////////////////////////////////////////////
      // Renderers
  */

  /*
    normal text field
   */
  function textrenderer(container, field){

    return texttemplate(container, field);

  }

  /*
    a text line with values split by space or comma
    the container value becomes an object with each value as a property set to true
   */
  function csvmap(container, field){

    return texttemplate(container, field, {

      flatten:function(val){
        if(!val){
          return '';
        }
        return _.keys(val).join(' ');
      },

      parse:function(val){
        var keys = val.split(/\s+|,/);
        var ret = {};
        _.each(keys, function(k){
          ret[k] = true;
        })
        return ret;
      }


    });
  }

  /*
    big text at the top of a tab
   */
  function legendrenderer(container, field){
    return $('<legend>' + field.title + '</legend>');
  }

  /*

      ////////////////////////////////////////////////////////////////////////////
      ////////////////////////////////////////////////////////////////////////////
      ////////////////////////////////////////////////////////////////////////////
      ////////////////////////////////////////////////////////////////////////////
      // Form def
  */

  var QuarryForm = function (options) {

    this.options = _.defaults(options, {
      container:$quarry.new()
    })
    // check for the container api
    this.container = this.options.container;

    this.build();
  }

  QuarryForm.prototype = {

    constructor: QuarryForm,

    renderers:{

      legend:legendrenderer,

      text:textrenderer,

      csvmap:csvmap

    },

    build: function(){

      
      var container = this.container;
      var options = this.options;

      var self = this;

      this.element = $(templates.render('main'));
      var $this = this.element;

      var blueprint = container.blueprint();

      // the standard tab layout
      var main_tab = {
        type:'tab',
        active:true,
        title:'Main',
        fields:[]
      }

      var selector_tab = {
        type:'tab',
        title:'Selector',
        fields:[{
          field:'_meta.tagname',
          title:'tagname'
        },{
          field:'_meta.id',
          title:'id'
        },{
          field:'_meta.classnames',
          title:'classnames',
          type:'csvmap'
        }]
      }

      var description_tab = {
        type:'tab',
        title:'Description',
        fields:[{
          field:'description',
          type:'textarea'
        }]
      }

      var icon_tab = {
        type:'tab',
        title:'Icon',
        fields:[{
          field:'icon',
          type:'image'
        }]
      }

      var tabs = [main_tab, selector_tab, description_tab, icon_tab];

      // now map in the blueprint onto tabs/attributes tab
      _.each(blueprint.fields(), function(field){
        if(field.type=='tab'){
          tabs.push(field);
        }
        else{
          main_tab.fields.push(field);
        }
      })

      // now build each tab
      _.each(tabs, _.bind(this.build_tab, this));

      // hook up the links to show the tab
      $this.find('#tabnav a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
      })
    
    },

    /*
      Build up a single tab with fields on
    */
    build_tab: function(tab, index){

      var self = this;
      var $this = this.element;
      var container = this.container;

      // now loop over and build the tabs
      var tabnav = $this.find('#tabnav');
      var tabcontent = $this.find('#tabcontent');

      var link_div = $(templates.render('tablink', {
        title:tab.title,
        id:index
      }))

      var tab_div = $(templates.render('tabpane', {
        title:tab.title,
        id:index
      }))

      if(index==0){
        link_div.addClass('active');
        tab_div.addClass('active');
      }

      // now loop the fields and build them up
      _.each(tab.fields, function(field){
        tab_div.append(self.build_field(field));
      })

      tabnav.append(link_div);
      tabcontent.append(tab_div);

    },

   

    /*
      Build up a single field on a tab
     */
    build_field: function(field){
      var $this = this.element;
      var container = this.container;

      field.type || (field.type='text');

      if(!field.title){
        field.title = field.field || '';
      }

      field.title = ucwords(field.title.replace(/[_\.]/g, ' '));

      var renderer = this.renderers[field.type] || this.renderers.text;

      return renderer.apply(this, [container, field]);
    }


  }

  $.extend({
    quarryform:function(options){
      var form = new QuarryForm(options);

      return form.element;
    }
  })

}(window.jQuery, window.quarryio)