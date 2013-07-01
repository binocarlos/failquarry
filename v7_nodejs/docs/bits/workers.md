Workers
-------
There are a few types of worker

How and where you mount them is up to you.

##File
This worker knows about the location of files on a filesystem.

It is not concerned as to what is in the files (like Warehouses are) -
it exists to give you access to the contents.

The HTTP interface is about serving the file.

The Quarry interface is about representing the filesystem as container data.

##Warehouse
This worker has knowledge about the databases it will connect to and
knows how to process quarry requests

The HTTP interface is a raw conversion into Quarry reqest

The Quarry interface is about representing the filesystem as container data.

##Web
This worker 