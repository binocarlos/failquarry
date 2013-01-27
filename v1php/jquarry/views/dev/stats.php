<?
	if(!empty($load_average))
	{
		echo<<<EOT
<!--
load: {$load_average}
memory: {$memory_usage}
time: {$execution_time}

-->		
EOT;
	}
	
?>