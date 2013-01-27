#Install A Development Machine

ALWAYS RUN DOS AS ADMINISTRATOR (or you will get the dreaded protocol error)

You must install 2 things first:

  1. VirtualBox - [Download](http://virtualbox.org)

  2. Vagrant - [Download](http://vagrantup.com)

##Start Vagrant

Open a DOS Command Prompt as Administrator

    Start -> type 'cmd' -> right click 'cmd.exe' -> click 'run as administrator'

change directory to wherever you have your SVN checkout:

    cd d:\camelot\src\trunk\camsimpleware\vagrant

type:

    vagrant up

it will take some time - go and make some tea - when it has finished and if everything worked - it will it obvious

if it did not work - contact the Administrator

**IMPORTANT NOTE FOR BERLIN DEVELOPERS**

The install script will try to install different node modules over https connections. If you get errors, just use putty to access the server like described below and type

	sudo npm config set https-proxy "http://10.0.0.2:3128"
	
This will use the berlin proxy for https connections. Then type

	sudo npm install
	
to install the node modules. This only has to be done once for the VM. The next time 'vagrant up' is called the modules are already installed. When you call 'vagrant destroy' you have to install the modules again.

##Using Once Setup
You now have a full Linux box running node.js, ZeroMQ and Camelot Online

###Accessing the system using SSH/SCP
This is the first thing because otherwise you cannot run commands to control the stack.

You need PUTTY (if you don't know what this is, ask someone).

With Putty you setup a new connection - call it Camelot Vagrant or some such, here are the settings:

    host: 127.0.0.1
    port: 2222

In the category 'Connection' use this as user name:

	vagrant

Last thing - in Putty on the left hand menu find:

    Connection -> SSH -> Auth

Click Browse next to 'Private key file for authentication'

Browse to the 'insecure_private_key.ppk' file that lives inside this folder (the /trunk/camsimpleware/vagrant folder)

Save this in Putty and click 'Connect'

Now type:

    cd /srv/camelot

And then:

    ls -la

You are now logged into Linux in the source folder of the development stack as the vagrant user

You can run Linux Shell commands - Google is your friend : )

You are currently the 'vagrant' user - to do something as root (like launch the stack - put sudo before the command:

  cd /srv/camelot
  sudo node stack/vagrant.js

##Starting and Stopping the Stack
Now you are on the command line - make sure you are in the source folder

    cd /srv/camelot

Now you can start the server ready to develop and test:

    sudo node stack/boot

This will start with the 'dev' client (inside of /webserver/clients/dev)

To start with another client - add the folder (which is the document_root for that client) after the command:

    sudo node stack/boot

You can change what client template to use:

    sudo node stack/boot --client dev
    sudo node stack/boot --client berlin

This relates to the folder in /webserver/clients

Stop the server by Ctrl+C

Running this way lets you do in the code and see the output

    console.log('hello');
    console.dir({a:10});

###Using a browser to look at it
Port 80 on the Linux machine is being forwarded to port 8080 on your windows machine.

This means you can type http://localhost:8080 (127.0.0.1:8080) into a browser on your windows box to see the site working.

To get other things (like iPads) looking at the dev stack you point them at the IP address of your windows machine

This is whatever your network is setup for - my windows machine (cmd -> ipconfig) is 192.168.1.5 right now so I type:

    192.168.1.5:8080

into the iPad Safari and it works    

##Changing Code
The code on your windows machine is mapped into the Linux box - you edit the code on Windows
it changes on Linux immediately you don't need to FTP/SCP/move files to Linux.

##Shutting Down

If you are going home for the night you type this:

    vagrant halt

This just 'pauses' things - when you come back next day - type:

    vagrant up

And the vagrant loop is complete - keep doing this cycle to have a virtual dev stack.

If you are going on holiday or have been told to 'upgrade your stack', you type this:

    vagrant destroy

Don't worry - nothing is destroyed - you can build it all again right away:

First do a SVN UPDATE (using Tortoise or whichever tool you use)

Then:

    vagrant up

Everything is back and up-to-date with the most recent installation version.

##The Symbolic Link Problem
Sorting out the bloody 'cannot make symlinks' issue.

ALL from within windows cmd.exe (as Administrator)

Make sure that VBoxManage can be run from cmd.exe

    PATH=%PATH%;c:\Program Files\Oracle\VirtualBox

To see installed boxes:

    VBoxManage list vms

To delete a box:

    VBoxManage unregistervm --delete vagrant_13435383838

(replace the number with the one you see from the list)

    vagrant up

Now login via SSH onto Linux and test the symlinks thing:

    ln -s /srv/camelot/.gitignore /srv/camelot/.test_symlink

If it complains - we still have a problem - if it does nothing it worked and you have to:

    rm /srv/camelot/.test_symlink



References:

  1. [virtual box forum](http://www.virtualbox.org/manual/ch08.html)
  2. [symlink error discussion](http://ahtik.com/blog/2012/08/16/fixing-your-virtualbox-shared-folder-symlink-error/)
  3. [serverfault](http://serverfault.com/questions/365423/how-to-run-vboxmanage-exe)