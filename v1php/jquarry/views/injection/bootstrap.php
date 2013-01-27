
	if($quarry)
	{
		$bootstrap({
		
			hostname:'<?= $hostname ?>',
			
			production:<?= $production ? 'true' : 'false' ?>,
			
			profile:<?= $profile_json ?>
				
		});
	}
