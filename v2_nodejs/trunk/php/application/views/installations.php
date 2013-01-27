<form method="GET" action="/admin/installation" class="jNice">
<input type="submit" id="addInstallation" value="Add Installation" /><br /><br /><br /><br />
</form>
<?

	if(!empty($message))
	{
		echo<<<EOT
	
<div class="message">{$message}</div>
<div class="clear vgap"></div>
EOT;
	}

?>	
<table cellpadding="0" cellspacing="0">
	
<?
	$odd = true;
	
	foreach($installations as $installation)
	{
		$id = $installation->id;
		$odd = !$odd;
		$class = $odd ? 'odd' : '';
		
		echo<<<EOT
<tr class="{$class}">
	<td>{$installation->name}</td>
	<td class="action"><a href="/admin/installation/{$id}" class="view">Edit</a><a href="/admin/deleteinstallation/{$id}" class="delete">Delete</a></td>
</tr>                        
                            
EOT;
               
	}
	
?>

</table>