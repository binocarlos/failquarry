#Toolkit
The stuff we use to make our lives easier...

##Core
This is stuff that is part of the core quarry.io stack - i.e. browser & server side both

###General
Core things that make Javascript Uber darkness style:

####Underscore
Functional programming toolkit - saves lot of typing.

http://underscorejs.org/

We use the quicker drop in however:

https://github.com/bestiejs/lodash

####async
Async programming toolkit - saves a lot of nesting.

https://github.com/caolan/async

####Backbone
Events, Models and Collections - also gives us Views on the client

http://backbonejs.org/






###Browser
Added onto the core tools so we can operate in a browser environment


####jQuery
DOM library

http://jquery.com/

We use the much smaller drop in though:

http://zeptojs.com/

####Less CSS
How we re-style stuff

http://lesscss.org/

####Twitter Bootstrap
CSS framework - makes nice looking GUI quickly

http://twitter.github.com/bootstrap/


###Server
Stuff we use to make the data flow and the web-pages load

####express & connect
The classic middleware HTTP stack

http://expressjs.com/

####ZeroMQ
The generic networking co-ordination layer

http://www.zeromq.org/


###Sync
Stuff that bridges the gap between the browser and the server

####socket.io
The web-sockets library that we use

####Backbone.io
Gives us a backbone model sync over socket.io

https://github.com/scttnlsn/backbone.io