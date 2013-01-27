<form method="POST" action="/admin/createinstallation" class="jNice">

This form allows you to add a new installation to the system.<br /><br />
A blank website and user will also be create to emulate the sign up process.<br /><br />

<fieldset>
	
	<div class="label">Primary Subdomain:</div><input type="text" class="text-long" name="subdomain" value="<?= $_POST['subdomain'] ?>" /> <span style="font-size:0.8em;">e.g. bob ( -> becomes bob.jquarry.com)</span>
	<div class="clear vgap"></div>
	
	<div class="label">User Fullname:</div><input type="text" class="text-long" name="fullname" value="<?= $_POST['fullname'] ?>" />
	<div class="clear vgap"></div>
	
	<div class="label">User Email:</div><input type="text" class="text-long" name="username" value="<?= $_POST['username'] ?>" />
	<div class="clear vgap"></div>
	
	<div class="label">User Password:</div><input type="text" class="text-long" name="password" value="<?= $_POST['password'] ?>" />
	<div class="clear vgap"></div>
	
<?

	if(!empty($error))
	{
		echo<<<EOT
	
<div class="error">{$error}</div>
<div class="clear vgap"></div>
EOT;


	}

?>	
	<input type="submit" id="saveInstallation" value="Create" />
	
</fieldset>

</form>