#Salt

http://docs.saltstack.org/en/latest/topics/installation/ubuntu.html

	echo deb http://ppa.launchpad.net/saltstack/salt/ubuntu `lsb_release -sc` main | sudo tee /etc/apt/sources.list.d/saltstack.list
	sudo apt-get update

	apt-get install salt-master
	apt-get install salt-minion
	apt-get install salt-syndic


http://docs.saltstack.org/en/latest/topics/configuration.html