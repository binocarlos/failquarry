/*

  skeleton network config
  
*/
module.exports = {
  name:"quarry.io Network",
  comment:"The first network ting",
  flavour:'development',
  stackfolders:[],
  systemhome:'/home/vagrant/projects/quarrytmp',
  systemfolders:[
    'builds',
    'run',
    'cache'
  ],
  httpport:17778,
  /*
  
    the core servers used on database nodes
    
  */
  servers:{
    hq:{
      hostname:'127.0.0.1'
    },
    redis:{
      hostname:"127.0.0.1",
      port:6379
    },
    mongo:{
      hostname:"127.0.0.1",
      port:27017
    }
  },
  /*
  
    the overrides into the core config for the different flavours
    
  */
  flavours:{
    development:{
      reset:true
    },
    local:{
      reset:false
    },
    cloud:{
      reset:false
    }  
  }
}