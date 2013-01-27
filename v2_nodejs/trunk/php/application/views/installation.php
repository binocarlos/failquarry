<form method="POST" action="/admin/saveinstallation/<?= $installation->id ?>" class="jNice">

<fieldset>
	
	<div class="label">Id:</div><?= $installation->id ?>
	<div class="clear vgap"></div>
	<div class="label">Root:</div><?= $installation->root ?>
	<div class="clear vgap"></div>
	<div class="label">Name:</div><input type="text" class="text-long" name="name" value="<?= $installation->name ?>" />
	<div class="clear vgap"></div>
	
	<div class="label">Config:</div><textarea rows="1" cols="1" name="config"><?= $installation->config ?></textarea>
	<div class="clear vgap"></div>
	
<?

	if(!empty($installation->_error))
	{
		echo<<<EOT
	
<div class="error">{$installation->_error}</div>
<div class="clear vgap"></div>
EOT;
	}

?>	
	<input type="submit" id="saveInstallation" value="Save" />
	
</fieldset>

</form>