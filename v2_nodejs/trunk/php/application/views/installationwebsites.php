<h3>Websites</h3>

<table cellpadding="0" cellspacing="0">
	
<?
	$odd = true;
	
	foreach($websites as $website)
	{
		$id = $website->id;
		$odd = !$odd;
		$class = $odd ? 'odd' : '';
		
		echo<<<EOT
<tr class="{$class}">
	<td>{$website->name}</td>
	<td class="action"><a href="/admin/website/{$installation->id}/{$id}" class="view">Edit</a><a href="/admin/deletewebsite/{$id}" class="delete">Delete</a></td>
</tr>                        
                            
EOT;
               
	}
	
?>

</table>
<div class="clear vgap"></div>
<form method="GET" action="/admin/website/<?= $installation->id ?>" class="jNice">
<input type="submit" id="addWebsite" value="Add Website" /><br /><br /><br /><br />
</form>