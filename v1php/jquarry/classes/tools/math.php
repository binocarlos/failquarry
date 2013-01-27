<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * General Math Utils for WidgetCloud which uses the GMP extension to deal with large numbers (i.e. > 32bit)
 *
 * IMPORTANT - every function in this library will return a GMP resource not a number so BE CAREFUL not to use this outside of GMP context
 * 
 * This uses the [GMP Functions](http://www.php.net/manual/en/ref.gmp.php)
 *
 * This uses the [BCMath Functions](http://php.net/manual/en/book.bc.php)
 *
 ********************************************************************************************************************************
 *
 * @filename   	widgetcloud/core/utils/math.php
 * @package    	WidgetCloud
 * @category   	Utils
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Tools_Math {

	/**
	 * Calculate the greatest common denominator from the 2 passed numbers - uses the [Euclidean Algorithm](http://en.wikipedia.org/wiki/Euclidean_algorithm)
	 *
	 * @access public
	 * @param integer $a First Number
	 * @param integer $b Second Number
	 * @return Resource Highest number that will divide both parameters with no remainder
	 */
	public static function greatest_common_denominator($a, $b)
	{
		// make sure we have gmp's
		$a = self::ensure_gmp($a);
		$b = self::ensure_gmp($b);
		
		return gmp_gcd($a, $b);
	}
	
	/**
	 * GMP multiply 2 numbers
	 *
	 * @access public
	 * @param mixed $a First Number
	 * @param mixed $b Second Number
	 * @return Resource Multiple of the 2 numbers
	 */
	public static function multiply($a, $b)
	{
		// make sure we have gmp's
		$a = self::ensure_gmp($a);
		$b = self::ensure_gmp($b);
		
		return gmp_mul($a, $b);
	}
	
	/**
	 * GMP add 2 numbers
	 *
	 * @access public
	 * @param mixed $a First Number
	 * @param mixed $b Second Number
	 * @return Resource Sum of the 2 numbers
	 */
	public static function add($a, $b)
	{
		// make sure we have gmp's
		$a = self::ensure_gmp($a);
		$b = self::ensure_gmp($b);
		
		return gmp_add($a, $b);
	}
	
	/**
	 * Make sure the passed argument is a GMP resource and if not, convert it
	 *
	 * @access public
	 * @param mixed $x Number to ensure is GMP
	 * @return Resource GMP number resource
	 */
	public static function ensure_gmp($x)
	{
		// if it's already a GMP number - return it
		if(is_resource($x))
		{
			return $x;
		}
		// if its a float, int or string containing either - create a GMP from it
		else if(is_numeric($x))
		{
			return gmp_init($x);	
		}
		else
		{
			throw new Kohana_Exception('Non numeric value passed to ensure_gmp :value', array(
				':value' => $x
			));
		}
	}
	
	/**
	 * Convert a GMP number to a string so it can be represented fully
	 *
	 * @access public
	 * @param Resource $x GMP Resource to convert to string
	 * @return string representation of the big number
	 */
	public static function convert_gmp_to_string($x)
	{
		// if it's not a GMP number then lets make it one
		$x = self::ensure_gmp($x);
		
		return gmp_strval($x);
	}
	
	/**
	 * uses bcmath to divide 2 number strings
	 */
	public static function bc_div($numerator, $denominator)
	{
		$result = bcdiv($numerator, $denominator, 60);
		
		return $result;
	}
	

}
