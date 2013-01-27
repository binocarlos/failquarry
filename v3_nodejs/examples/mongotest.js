// suggested shell cmd line to run this:
//
//   mongo --shell example2.js
// 
// Note: the { out : … } parameter is for mongodb 1.8+

db.things.insert( { _id : 1, tags : ['dog', 'cat'] } );
db.things.insert( { _id : 2, tags : ['cat'] } );
db.things.insert( { _id : 3, tags : ['mouse', 'cat', 'dog'] } );
db.things.insert( { _id : 4, tags : []  } );

// map function
m = function(){
    this.tags.forEach(
        function(z){
            emit( z , { count : 1 } );
        }
    );
};

// reduce function
r = function( key , values ){
    var total = 0;
    for ( var i=0; i<values.length; i++ )
        total += values[i].count;
    return { count : total };
};

res = db.things.mapReduce(m, r, { out : { inline : 1} } );

printjson(res);

print("try db.myoutput.find()");