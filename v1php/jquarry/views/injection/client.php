<?

	foreach($inline_javascripts as $url)
	{
		echo<<<EOT
	
	<script type="text/javascript" src="{$url}"></script>
		
EOT;
	}
	
?>

<script>
	
<?

	$view = View::factory('injection/bootstrap');
	
	$view->hostname = $hostname;
	$view->production = $production;
	$view->profile_json = $profile_json;
	
	echo $view->render();
	
?>	
	
</script>