<form method="POST" action="/admin/saveuser/<?= $installation->id ?>/<?= $user->id ?>" class="jNice">

<fieldset>
	
	<div class="label">Id:</div><input readonly=true type="text" class="text-long" name="id" value="<?= $user->id ?>" />
	<div class="clear vgap"></div>
	<div class="label">Name:</div><input type="text" class="text-long" name="name" value="<?= $user->name ?>" />
	<div class="clear vgap"></div>
	<div class="label">Avatar:</div><input type="text" class="text-long" name="name" value="<?= $user->avatar ?>" />
	<div class="clear vgap"></div>
	<div class="label">Username:</div><input type="text" class="text-long" name="name" value="<?= $user->username ?>" />
	<div class="clear vgap"></div>
	<div class="label">Password:</div><input type="text" class="text-long" name="name" value="<?= $user->password ?>" />
	<div class="clear vgap"></div>
	<div class="label">Facebook:</div><input type="text" class="text-long" name="name" value="<?= $user->facebook ?>" />
	<div class="clear vgap"></div>
	<div class="label">Twitter:</div><input type="text" class="text-long" name="name" value="<?= $user->twitter ?>" />
	<div class="clear vgap"></div>
	
	<input type="submit" id="saveUser" value="Save" />
	
</fieldset>

</form>