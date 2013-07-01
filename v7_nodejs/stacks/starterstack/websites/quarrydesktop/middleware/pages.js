module.exports = function(options, network){
	var receptionfront = network.receptionfront;
  var users = receptionfront.connect('/user');
  var Container = network.Container;

  return {
  	mount:function(app, done){

      Container._.each([
        '/welcome',
        '/project/:id',
        '/digger',
        '/guide'
      ], function(route){
    		app.get(route, function(req, res, next){
    			req.url = '/';
    			next();
    		})
      })

  		done();
  	}
  }
}