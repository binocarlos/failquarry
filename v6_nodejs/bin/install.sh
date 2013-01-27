#!/bin/sh
#
# @(#)$Id$
#
# Quarry.io install script
# 
# Install the base software for running on a machine

##########################################################################################
# shout this!
installlog()
{
  echo "-----------------------------------------------------------"
  echo $1
  echo "-----------------------------------------------------------"
  echo ""
}

##########################################################################################
# work out where we are running from

# where the code lives
quarryio_home="/srv/quarryio"

# where to download source for compiling
sources_folder="/root/.sources"

##########################################################################################
# This makes a temporary folder for us to download sources ready to compile
installlog "Making Temp Folder /root/.sources"
mkdir -p $sources_folder

##########################################################################################
# Pre Apt Setup - things to get done before apt-get kicks in

# Mongo apt-get keys
apt-key adv --keyserver keyserver.ubuntu.com --recv 7F0CEB10
echo "deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen" > /etc/apt/sources.list.d/10gen.list

echo deb http://ppa.launchpad.net/saltstack/salt/ubuntu `lsb_release -sc` main | sudo tee /etc/apt/sources.list.d/saltstack.list
wget -q -O- "http://keyserver.ubuntu.com:11371/pks/lookup?op=get&search=0x4759FA960E27C0A6" | sudo apt-key add -

# this is how to run the above normally using sudo
#echo "deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen" | sudo tee /etc/apt/sources.list.d/10gen.list

##########################################################################################
# This makes sure we have 'basic' packages like a build tool for a start
installlog "Installing Basic Apt Packages"
apt-get install python-software-properties -y
sudo apt-get update
apt-get install build-essential git curl -y

##########################################################################################
# Installing Redis via Apt (memcache with Disk backup)
installlog "Installing Most Recent Stable Redis"
apt-get -y install redis-server

##########################################################################################
# Installing Mongo via Apt (document database)
installlog "Installing Most Recent Stable Mongo"
apt-get install mongodb-10gen -y

##########################################################################################
# Installing GMP via Apt (big number using strings library)
installlog "Installing Most Recent Stable GMP"
apt-get install libgmp3-dev -y

##########################################################################################
# Installing ImageMagick via Apt (image filters)
installlog "Installing Most Recent Stable ImageMagick"
apt-get install imagemagick -y

##########################################################################################
# Installing netpbm via Apt (line by line image converter)
installlog "Installing Most Recent Stable netpbm"
apt-get install netpbm -y

##########################################################################################
# Installing salt
#installlog "Installing Most Recent Stable Salt Stack"
#apt-get install salt-master salt-minion -y

##########################################################################################
# Download and make, install ZeroMQ (networking stack)
zeromq_version="3.2.0"
zeromq_file="zeromq-$zeromq_version-rc1.tar.gz"
zeromq_url="http://download.zeromq.org/$zeromq_file"



if [ ! -d "$sources_folder/mon" ]; then

	(mkdir "$sources_folder/mon" && cd "$sources_folder/mon" && curl -L# https://github.com/visionmedia/mon/archive/master.tar.gz | tar zx --strip 1 && make install)

fi

if [ ! -d "$sources_folder/mongroup" ]; then

	(mkdir "$sources_folder/mongroup" && cd "$sources_folder/mongroup" && curl -L# https://github.com/jgallen23/mongroup/archive/master.tar.gz | tar zx --strip 1 && make install)

fi

# Only install ZeroMQ if it is not already installed
if [ ! -d "$sources_folder/zeromq-$zeromq_version" ]; then
	cd $sources_folder
	installlog "Downloading ZeroMQ version: $zeromq_version-rc1"
	curl -C - --progress-bar $zeromq_url -o "$zeromq_file"
	tar -xzf $zeromq_file
	cd "zeromq-$zeromq_version"
	installlog "building zeromq version: $zeromq_version"
	./configure
	make
	make install
else
	installlog "skipping ZeroMQ version: $zeromq_version already installed"	
fi

##########################################################################################
# Download and make, install node.js

nodejs_version="0.8.16"
nodejs_file="node-v$nodejs_version.tar.gz"
nodejs_url="http://nodejs.org/dist/v$nodejs_version/$nodejs_file"

# Only install node.js if it is not already installed
if [ ! -d "$sources_folder/node-v$nodejs_version" ]; then
	cd $sources_folder
	installlog "downloading node.js version: $nodejs_version"
	curl -C - --progress-bar $nodejs_url -o "$nodejs_file"
	tar -xzf $nodejs_file
	cd "node-v$nodejs_version"
	installlog "building node.js version: $nodejs_version"
	./configure
	make
	make install
else
	installlog "skipping node.js version: $nodejs_version already installed"
fi

##########################################################################################
# Install node.js modules from NPM - this reads ../package.json for dependencies
# The ZeroMQ npm is different - ask the Administrator

installlog "installing node modules"
cd $quarryio_home
npm install
ldconfig


exit