<?php defined('SYSPATH') or die('No direct access allowed.');
/**
 * @package    Kohana/Codebench
 * @category   Tests
 * @author     Geert De Deckere <geert@idoe.be>
 */
class Bench_Jquarryquery extends Codebench {

	public $description =
		'jquarry query test';

	public $loops = 1000;

	public $subjects = array
	(
		// Valid
		'*',
		'city',
		'country > city > area'
	);

	public function bench_normalquery($query)
	{
		$collection = Jquarry_Query::factory($query)->run();
	}


}