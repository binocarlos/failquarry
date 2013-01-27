#Vagrant
It is VERY important when developing software systems that you can
break stuff without anyone caring.

Vagrant makes this happen by running a Virtual Machine(s) of your
quarry.io network.

This means you can break it all you like and the only person
who will notice is you (or anyone peering over your shoulder).

Once you have hacked away and it's not breaking anymore - you can
deploy your changes to the live Internet and Vagrant once again
has earnt it's soup bowl today.

#Installation
To get this up and running you need to install a few things:

 1. Virtualbox - https://www.virtualbox.org/

 2. Vagrant - http://vagrantup.com/

 3. Salty Vagrant - https://github.com/saltstack/salty-vagrant

Once this is done - open a command line and change directory to
the quarry.io root folder /vagrant /vagrantmulti

Then type:

	vagrant gem install vagrant-salt

On Windows you will probably first have to run:

C:\vagrant\vagrant\embedded\devkitvars.bat

This will set up the correct paths to the ruby build environment 
inside vagrant.

Now you are ready to go.

#Starting & Stopping

	vagrant up

	vagrant halt

	vagrant destroy


#Installing on a Mac

