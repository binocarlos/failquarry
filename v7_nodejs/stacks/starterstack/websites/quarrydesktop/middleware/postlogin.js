module.exports = function(options, network){
	var receptionfront = network.receptionfront;
  var users = receptionfront.connect('/user');
  var Container = network.Container;

	return function(req, res, next){
		if(!req.user){
			res.redirect('/');
			return;
		}

		users('=' + req.user.meta.quarryid).ship(function(user){
			if(user.empty()){
				res.redirect('/');
				return;
			}

			user('project').ship(function(projects){
				if(projects.empty()){
					var project = Container.new('project', {
						name:'Example Project'
					}).addClass('example').id(Container.littleid());

					user.sequence([
						user.attr('projectid', project.id()).save(),
						user.append(project)
					]).ship(function(){
						res.redirect('/');
					})
				}
				else{
					res.redirect('/');
				}
			})

		})

	}
}