#Vapour
How do we provision new servers?

The vapour library allows us to create new servers and give them to a stack.

There are drivers for the popular IaaS companies (Rackspace/Amazon etc).

To activate a driver you must provide the API keys and other details it requires.

A driver must provide:

 * manifest - provides data about the details needed to register and URLs etc (JSON file)
 * create - lets us create a new server
 * list - lets us see all of the servers with this account
 * delete - kill a server
 * run - execute code on a server(s)

 