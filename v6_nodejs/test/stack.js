var io = require('../');
var fs = require('fs');
var eyes = require('eyes');
var mongo = require('../lib/vendor/server/mongo');
var async = require('async');

describe('stack', function(){

	this.timeout(2000);

	/*
	
		setups up the stack fresh each time so we have a new starting point for each test
		
	*/
	function stacktest(config){

		console.log('');

		var backupfile = config.backupfile;
		var testfn = config.testfn;
		var done = config.done;

		var old_eyes = eyes.inspect;
		eyes.inspect = function(){}
		var old_log = console.log;
		console.log = function(){}

		var folder = __dirname + '/fixtures/networks/basic/resources/files/xmlfiles/';
		var livefile = folder + 'cities.xml';
		var backupfile = folder + backupfile;//'cities2.xml';

		var livefile2 = folder + 'usacities.xml';
		var backupfile2 = folder + 'usacities2.xml';

		var content = fs.readFileSync(backupfile, 'utf8');
		fs.writeFileSync(livefile, content, 'utf8');

		old_log('created', livefile, 'from', backupfile);

		var content2 = fs.readFileSync(backupfile2, 'utf8');
		fs.writeFileSync(livefile2, content2, 'utf8');
		old_log('created', livefile2, 'from', backupfile2);

		async.series([
      function(next){
      	mongo({
          collection:'francecities'
        }, function(error, client){
          client.collection.drop(next);
        })
      },

      function(next){
      	io
					.network('development', {
						folder:__dirname+'/fixtures/networks/basic'
					})
					.start(function(network){
						network.warehouse('dev.jquarry.com', function(warehouse){

							testfn(warehouse, next);

						})
					})
      }
    ], function(){
    	console.log = old_log;
		eyes.inspect = old_eyes;
		done();
    })

	}
/*
	it('should be a function', function () {
		io.stack.should.be.a('function');
	})

	it('should find things', function(done){

		stacktest({
			backupfile:'cities2.xml',
			done:done,
			testfn:function(warehouse, callback){
				warehouse('folder')
					.ship(function(folder){
						folder('city[name^=b]')
							.ship(function(cities){
								cities.count().should.equal(2);
								cities.eq(0).attr('name').should.equal('Bristol');
								cities.eq(1).attr('name').should.equal('Birmingham');
								callback();
							})
					})
			}
		})
	})

	it('should branch mid-request', function(done){

		stacktest({
			backupfile:'citiesbranch.xml',
			done:done,
			testfn:function(warehouse, callback){
				warehouse('folder city')
					.ship(function(cities){
						cities.count().should.equal(10);
						callback();
					})
			}
		})
	})
*/
	it('should append things', function(done){

		stacktest({
			backupfile:'citiesbranch.xml',
			done:done,
			testfn:function(warehouse, callback){

				warehouse('folder city[name^=b]')
					
					.ship(function(cities){

						var area = io.new('area', {
							name:'Bishopston',
							population:387
						}).addClass('rich')

						cities.append(area).ship(function(appended){

							var house = io.new('house', {
								name:'Big House',
								population:3
							}).addClass('grand')

							appended.append(house)
							.ship(function(houses){
								warehouse('folder city[name^=b] area[name^=Bish] house').ship(function(houses){
									houses.count().should.equal(3);
									houses.eq(1).attr('name').should.equal('Big House');
									callback();
								})
							})
						})
					})
			}
		})
	})

	it('should save things', function(done){

		stacktest({
			backupfile:'citiesbranch.xml',
			done:done,
			testfn:function(warehouse, callback){
				warehouse('folder city[name^=b]')
					
					.ship(function(cities){

						cities.attr({
							'food':'Ice Cream'
						}).addClass('chocolate');

						cities.save().ship(function(saved){

							warehouse('folder city[name^=b]')

								.ship(function(cities2){
									cities2.attr('food').should.equal('Ice Cream');
									cities2.hasClass('chocolate').should.equal(true);
									callback();
								})
						})
					})
			}
		})
	})

	it('should delete things', function(done){

		stacktest({
			backupfile:'citiesbranch.xml',
			done:done,
			testfn:function(warehouse, callback){
				warehouse('folder city[name^=b]')
					
					.ship(function(cities){

						cities.count().should.equal(3);

						cities.delete().ship(function(){

							warehouse('folder city[name^=b]')

								.ship(function(cities2){
									cities2.count().should.equal(0);
									callback();
								})

						})
						
					})
			}
		})
	})

	it('should pour into QuarryDB', function(done){
		var clog = console.log;
		stacktest({
			backupfile:'citiesquarrybranch.xml',
			done:done,
			testfn:function(warehouse, callback){
				warehouse('folder').ship(function(folders){

					folders.find('#places')
						.select('city:tree')
						.ship(function(cities){

							folders.find('#quarrylink')
								.append(cities)
								.ship(function(appended){
									
									warehouse('#quarrylink area').ship(function(quarryareas){

										quarryareas.each(function(area){
											clog('area =', area.attr('name'));
										});
										quarryareas.count().should.equal(16);
										callback();
									})
								})
							
						})
					
				})
			}
		})
	})
/*
	it('should broadcast portals', function(done){

		stacktest({
			backupfile:'citiesbranch.xml',
			done:done,
			testfn:function(warehouse, callback){

				warehouse('folder city[name^=b]')
			
					.ship(function(cities){

						var area = io.new('area', {
							name:'Bishopston',
							population:387
						}).addClass('rich')

						cities.append(area).ship(function(appended){

							var portalcount = 0;

							appended.portal(function(message){
								portalcount++;
							})

							var house = io.new('house', {
								name:'Big House',
								population:3
							}).addClass('grand')

							appended.append(house)
							.ship(function(houses){
								portalcount.should.equal(3);
								callback();
							})
						})
					})
			}
		})
	})
*/
})
