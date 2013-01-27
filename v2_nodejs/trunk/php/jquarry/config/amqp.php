<?php defined('SYSPATH') or die('No direct access allowed.');

return array
(
	'require' => '/home/webkit/sites/quarrycore/php_modules/amqplib/demo/autoload.php',
	
	'connection' => array(
		'host' => 'localhost',
		'port' => 5672,
		'username' => 'guest',
		'password' => 'guest',
		'vhost' => '/'
	)
);