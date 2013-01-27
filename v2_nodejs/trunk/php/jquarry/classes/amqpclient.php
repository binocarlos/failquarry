<?php

$path = Kohana::$config->load('amqp.require');
		
require_once($path);
		
use PhpAmqpLib\Connection\AMQPConnection;
use PhpAmqpLib\Message\AMQPMessage;
		
// class to bootstrap the symphony amqpclient module
class Amqpclient {

	/**
	 ********************************************************************************************************************************
	 *
	 * Factory
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	public static function factory()
	{
		return new Amqpclient(Kohana::$config->load('amqp.connection'));
	}
	
	/**
	 ********************************************************************************************************************************
	 *
	 * Instance
	 *
	 *
	 ********************************************************************************************************************************
	*/
	
	protected $connection;
	protected $channel;
	
	protected function __construct($config)
	{
		$this->connection = new AMQPConnection($config['host'], $config['port'], $config['username'], $config['password'], $config['vhost']);
		$this->channel = $this->connection->channel();
		
	}
	
	public function send($options)
	{
		$exchange = $options['exchange'];	
		$message = $options['message'];
		$routingKey = $options['routingKey'];
		
		$msg = new AMQPMessage(json_encode($message), array('content_type' => 'application/json'));
		
		$this->channel->basic_publish($msg, $exchange, $routingKey);
	}
}