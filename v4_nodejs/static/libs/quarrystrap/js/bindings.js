!function ($, $quarry) {

  "use strict"; // jshint ;_;

  var _ = $quarry._;

  $.event.special.destroyed = {
    remove: function(o) {
      if (o.handler) {
        o.handler()
      }
    }
  }

  var QuarryBinding = function(element, options) {
    this.element = $(element);

    this.options = _.defaults(options, {
      type:'field',
      container:$quarry.new(),
      field:{
        field:'name'
      }
    })

    this.field = this.options.field;
    this.container = this.options.container;

    this.bind();
    
  }

  QuarryBinding.prototype = {

    constructor: QuarryBinding,

    bind: function(){

      var self = this;

      var $this = this.element;
      var options = this.options;
      var container = this.container;
      var field = this.field;

      var change_handler = function(val){

        var validation_result = container.validate_field(field.field);

        if(validation_result!==true){
          $this.trigger('error', [validation_result]);
        }
        else{
          $this.trigger('updated');
        }
      }

      // the container has changed the field we are interested in!
      container.addListener('change.' + field.field, change_handler)

      container.on('error.' + field.field, function(validation_result){
        $this.trigger('error', [validation_result]);
      })

      $this.bind('destroyed', function(){
        container.removeListener('change.' + field.field, change_handler)
      })

    }
  }

  $.fn.quarrybinding = function (option, args) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('quarrybinding')
        , options = typeof option == 'object' ? option : {}
      if (!data) $this.data('quarrybinding', (data = new QuarryBinding(this, options)))
      if (typeof option == 'string') data[option](args)
    })
  }

  $.fn.quarrybinding.Constructor = QuarryBinding;

}(window.jQuery, window.quarryio)