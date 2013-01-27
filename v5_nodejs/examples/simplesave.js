var io = require('../index');
var eyes = require('eyes');
var fs = require('fs');
var Fs = require('meta-fs');

var origcities = __dirname + '/cities.xml';
    var outcities = __dirname + '/citiesout.xml';

    Fs.remove(outcities, function(){
      Fs.copy(origcities, outcities, function(){
        var xml_supplier = io.supplier('file/xml', {
          hostname:'xml.supplier',
          file:outcities
        })

        io
        .warehouse({
          hostname:'root.warehouse'
        })
        .use(xml_supplier)
        .ready(function(warehouse){

          warehouse('city[name^=bris]').ship(function(results){

            var area = io.new('area', {
              name:'Lockleaze',
              fruit:'apples',
              'sdfsdf.sdfsdf':'sdfsdf',
              dsdsfdsF:'sdfsdfsdf',
              population:150
            }).addClass('poor')


            results.append(area, true).ship(function(appended){
              
               warehouse('area.poor[name^=l]', 'city[name^=bris]').ship(function(results){
                    
                    eyes.inspect(results.toJSON());
                    
                  })
               /*
              var xml_supplier2 = io.supplier('file/xml', {
                hostname:'xml.supplier',
                file:outcities
              })
              io
                .warehouse({
                  hostname:'root.warehouse'
                })
                .use(xml_supplier2)
                .ready(function(warehouse2){
                  warehouse2('area.poor[name^=l]', 'city[name^=bris]').ship(function(results){
                    
                    eyes.inspect(results.toJSON());
                    
                  })
                })
              */
            })
            
          })
        })
      })
      
    })
