/*

	(The MIT License)

	Copyright (C) 2005-2013 Kai Davenport

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */


/*
  Rational Nested Set Tree Encoder
  ------------------------------------------

	* Rational Nested Set Tree Encoder
	*
	* This Library is responsible for creating the [Rational Number](http://en.wikipedia.org/wiki/Rational_number)
	* keys for creating a nested set tree structure
	*
	* The big advantage over normal nested set is that insert speeds are much faster because you do not need to update
	* other encodings in the database
	*
	* The premise is that the left boundary of the [Nested Set Model](http://en.wikipedia.org/wiki/Nested_set_model)
	* is calculated as a rational number based upon a [Continued Fraction](http://en.wikipedia.org/wiki/Continued_fraction)
	* which uses an alternate sequence of relative node position and unity as it's values.
	*
	* The right boundary is assumed to be the left boundary of the nodes immediate sibling - this results in being able
	* to retrieve descendants and ancestors of a node with one SQL hit.
	*
	* Each boundary is represented as 2 integers - the numerator and denominator of the rational number and each node
	* will contain it's own numerator and denominator (as the left boundary) and that of it's immediate sibling (as the right boundary).
	*
	* This means if:
	*
	*		ln = left numerator, ld = left denominator
	*
	*		rn = right numerator, rd = right denominator
	*
	* then all descendants of this node can be retrieved using:
	*
	*		( this.ln / this.ld ) < ( descendant.ln / descendant.ld ) < ( this.rn / this.rd )
	*
	* and all ancestors of this node can be retrieved using:
	*
	*		( ancestor.ln / ancestor.ld ) < ( this.ln / this.ld ) < ( ancestor.rn / ancestor.rd )
	*
	* More importantly - inserting a new node into the tree becomes far more efficient because there are infinite rational numbers
	* that lie BETWEEN ( this.ln / this.ld ) and ( this.rn / this.rd )
	*
	* Using the classic nested set left and right singular values - an average of n/2 updates needed to be made just to insert one node!
	*
	* Using this method - a the left and right keys for a descendant can be calculated and are guaranteed to fall within the left and right 
	* boundaries of the parent node without having to affect the rest of the tree - making inserts a factor of 1 rather than averaging n/2.
	*
	* This is based upon the stirling work done by Dan Hazel (dan hazel@technologyonecorp.com) in his paper
	* [Using rational numbers to key nested sets](http://arxiv.org/abs/0806.3115) - all credit due to him : )
	*
	* This library makes use of the gmp extenstion to do large number arithmetic and and will return strings of those numbers
	* this is because larger numbers will fall over (32-bit limitations) and so we will pass these string values into MySQL
	* which will use the decimal field type to do it's internal calculations
	*
	
 */

/**
 * Module dependencies.
 */

var _ = require('underscore'),
		async = require('async');
		//bigint = require('bigint');

module.exports = exports = encode;


// Uses calculate_encoding_from_tree_position to calculate the left and right encoding for a given node
// It simply adds 1 to the last position in the array to get the encodings for its next sibling
function encode(position_array, callback){

	if(!_.isArray(position_array) || position_array.length<=0){
		throw new Error('Array of tree positions required');
	}	
	
	var left_position_array = _.map(position_array, function(v){return v;});
	var right_position_array = _.map(position_array, function(v){return v;});;

	// lets modify the last position in the right hand sequence so it is one more than the left
	var last_position = right_position_array.pop();
	
	last_position++;

	right_position_array.push(last_position);

	async.series({
		left:function(next){
			next(null, calculate_encoding_from_tree_position(left_position_array));
		},
		right:function(next){
			next(null, calculate_encoding_from_tree_position(right_position_array));
		}

	}, callback);
	
}

/**
	 * uses GMP to divide the numerator by the denominator and convert all values to string
	 *
	 * @access public
	 * @param object $data containing GMP numerator and denominator resources
	 * @return object $data containing refactored integer, numerator and denominator string properties
	 */
function get_parsed_encodings(data){

	return {
	
		numerator:data.numerator,
		
		denominator:data.denominator

	};
}

/**
	 * Inverses the current fraction by swapping the numerator and denominator
	 * This is the equivalent of:
	 *
	 *	1 / (n / d)
	 *
	 * @access public
	 * @param object $data containing numerator and denominator GMP resources
	 * @return object $data containing refactored numerator and denominator GMP resources
	 */
function inverse_fraction(data){
	var t = data.denominator;
	data.denominator = data.numerator;
	data.numerator = t;
	
	return data;
}

/**
	 * single step in the reduction of a continued fraction
	 * it uses the following reduction method:
	 *
	 * 		[ ... , a, b] = [ ... , a + 1/b ]
	 *
	 * where 'a' may equal 8 and where 'b' may equal 5/6 - therefore
	 *
	 *			    a   b             a           b                 a     b          
	 *		[ ... , 8, 5/6] = [ ... , 8 + ( 1 / (5/6) ) ] = [ ... , 8 + (6/5) ] = [ ... , 46/5 ]
	 *
	 * which basically says where b is a fraction - inverse it and then add a*denominator to the numerator
	 *
	 * this function is based on: [Converting a Continued Fraction to a single Fraction](http://www.maths.surrey.ac.uk/hosted-sites/R.Knott/Fibonacci/cfINTRO.html#tofract)
	 *
	 * the 'data' parameter must contain 3 arguments:
	 *
	 * 'integer' = the integer (in the above example, 'a')
	 *
	 * 'numerator' = the numerator of the fraction (in the above example, numerator of 'b')
	 *
	 * 'denominator' = the denominator of the fraction (in the above example, denominator of 'b')
	 *
	 * @access public
	 * @param object $data containing integer, numerator and denominator GMP resources
	 * @return object $data containing refactored integer, numerator and denominator GMP resources
	 */
function reduce_continued_fraction_step(data){		
	// do 1 divided by fraction
	data = inverse_fraction(data);
	
	// do integer + fraction (which is numerator += integer * denominator)
	//$multiple = Tools_Math::multiply($data['integer'], $data['denominator']);
	//var multiple = data.integer.mul(data.denominator);
	var multiple = data.integer * data.denominator;

	//$data['numerator'] = Tools_Math::add($data['numerator'], $multiple);
	//data.numerator = data.numerator.add(multiple);
	data.numerator = data.numerator + multiple;
	
	return data;
}

/**
	 * Calculates a finite continued fraction encoding of tree position returning a numerator and denominator representing the encoding
	 *
	 * The tree position is provided as an array of positions, so for example the 3rd element of the 7th element of the 2nd element is represented as:
	 *
	 *		// returns array('n' => 65, 'd' => 23)
	 *		// passed array represents root -> 2nd node -> 4th node -> 3rd node
	 *		//
	 *		Tree_Nestedsetencoder::calculate_encoding_from_tree_position(array(2, 4, 3));
	 *
	 * This will return a numerator and denominator in an object that can be saved to the database
	 *
	 * It reduces a continued fraction after alternating unity into the position array
	 *
	 * @access public
	 * @param array $tree_position_array (default: array()) an array of the numeric tree positions for the node to calculate an encoding for
	 * @return object and object containing 'numerator', 'denominator' and 'rational' string properties
	 */

function calculate_encoding_from_tree_position(position_array, callback){

	// if we have only one position then it means we have a root element (i.e. one at the top of the tree)
	// and this is an easy fraction to calculate (i.e. x / 1)
	if(position_array.length==1){
		return get_parsed_encodings({
		
			// the numerator is the position of the root element
			numerator:position_array[0],
			
			// the denominator is always 1
			denominator:1
			
		});
	}
	
	// initialize the data array we will work with
	var data = {
		parts:_.map(position_array, function(v){return v;}),
		unityparts:[]
	};
	
	// lets insert the alternate unity into the position array
	for(var i=0; i<data.parts.length; i++)
	{		
		// add the next element into the array
		// and as long as we are not the last element, insert unity
		
		data.unityparts.push(data.parts[i]);

		if(i<data.parts.length-1)
		{
			data.unityparts.push(1);
		}
	}
	
	// There will always be AT LEAST 3 elements in the array at this point
	// initialize values by purging the last element from the array as the initial numerator
	// the denominator will always start off as null because the first fraction will be just the last_element (i.e. last_element / 1)
	data.numerator = data.unityparts.pop();
	data.denominator = 1;
	
	// the integer starts off as 0 to deal with the not-possible event of if we only had 1 or 2 array elements
	data.integer = 0;
	
	// now lets start reducing the continued fraction!
	while(data.unityparts.length>0)
	{
		data.integer = data.unityparts.pop();

		data = reduce_continued_fraction_step(data);

		// this has just performed:
		// a,b -> a + 1 / b
	}
	
	return get_parsed_encodings(data);
}

