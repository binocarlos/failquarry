
var io = require('../');
var eyes = require('eyes');

var path = __dirname + '/../stacks/starterstack';

/*
io.network()
  .teststack(path, function(error){
    if(error){
      console.dir(error);
    }
    else{
      console.log('stack booted: testing stack -> ' + path);
    }
  })
*/

var warehouse = io.supplier('quarry.quarrydb', {
	id:'tester',
	collection:'tester'
})

var db = warehouse.connect('/');

db('*').ship(function(results){
  console.log('-------------------------------------------');
  eyes.inspect(results.count());
})

setInterval(function(){

}, 100);

/*

setInterval(function(){
  var test = io.new('test', {
    name:'hello2'
  })

  var test2 = io.new('test2', {
    name:'sub'
  }).addClass('apples')

  var test3 = io.new('test3', {
    name:'subsub'
  }).addClass('oranges')

  var test4 = io.new('test4', {
    name:'subsubsub'
  }).addClass('pears')

  test3.append(test4);
  test2.append(test3);
  test.append(test2);

  db.append(test).ship(function(){
    console.log('-------------------------------------------');
    console.log('-------------------------------------------');
    console.log('appended');
    eyes.inspect(test.toJSON());
  })
}, 10);

*/