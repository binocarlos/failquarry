<h3>Users</h3>

<table cellpadding="0" cellspacing="0">
	
<?
	$odd = true;
	
	foreach($users as $user)
	{
		$id = $user->id;
		$odd = !$odd;
		$class = $odd ? 'odd' : '';
		
		echo<<<EOT
<tr class="{$class}">
	<td>{$user->name}</td>
	<td class="action"><a href="/admin/user/{$installation->id}/{$id}" class="view">Edit</a><a href="/admin/deleteuser/{$id}" class="delete">Delete</a></td>
</tr>                        
                            
EOT;
               
	}
	
?>

</table>
<div class="clear vgap"></div>
<form method="GET" action="/admin/user/<?= $installation->id ?>" class="jNice">
<input type="submit" id="addUser" value="Add User" /><br /><br /><br /><br />
</form>