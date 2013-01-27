<form method="POST" action="/admin/savewebsite/<?= $installation->id ?>/<?= $website->id ?>" class="jNice">

<fieldset>
	
	<div class="label">Id:</div><input readonly=true type="text" class="text-long" name="id" value="<?= $website->id ?>" />
	<div class="clear vgap"></div>
	<div class="label">Name:</div><input type="text" class="text-long" name="name" value="<?= $website->name ?>" />
	<div class="clear vgap"></div>
	<div class="label">Root:</div><input type="text" class="text-long" name="root" value="<?= $website->root ?>" />
	<div class="clear vgap"></div>
	<div class="label">Domains:</div><textarea rows="1" cols="1" name="domains"><?= $website->domains ?></textarea>
	<div class="clear vgap"></div>
	<div class="label">Config:</div><textarea rows="1" cols="1" name="config"><?= $website->config ?></textarea>
	<div class="clear vgap"></div>
	
	<input type="submit" id="saveWebsite" value="Save" />
	
</fieldset>

</form>