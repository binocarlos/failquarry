<?php defined('SYSPATH') or die('No direct script access.');
/**
 ********************************************************************************************************************************
 *
 * JQuarry Mongo Read Selector Stage Query - mongo query for getting data for a selector stage
 *
 *
 ********************************************************************************************************************************
 *
 * @filename   	classes/jquarry/mongoquery/read/selectorstage.php
 * @package    	JQuarry
 * @category   	component
 * @author     	Webkit Ltd
 * @copyright  	(c) 2005-2011 Webkit Ltd
 * @license    	http://dotxar.com/license
 *
 ******************************************************************************************************************************** 
 */
class Jquarry_Mongoquery_Read_Selectorstage extends Jquarry_Mongoquery_Read {
	
	protected $_required_options = array(
	
		"selector_stage"
	
	);
	
	// gets the fields to return for this read query
	protected function fields()
	{
		if($this->options["skeleton"]==true)
		{
			return array(
			
				"_meta" => true
				
			);	
		}
		
		return array();	
	}
	
	// gets the clause for the read query
	protected function query()
	{
		// the selector stage containing the query info we want to select
		$selector_stage = $this->options["selector_stage"];
		
		if(!$selector_stage)
		{
			throw new Kohana_Exception("Mongo Read Selector Stage needs a selector stage config");
		}
		
		$queryarray = array();
		
		if($selector_stage->has_type())
		{
			$queryarray[] = array(
			
				"_meta.type" => $selector_stage->type()
				
			);
		}
		
		if($selector_stage->has_modifier('all'))
		{
			// have to always return true - am too tired to work out this properly right now
			// we need a way of saying 'always'
			$queryarray[] = array(
			
				10 => array(
				
					'$gte' => 10
				
				)
			
			);
		}
		
		if($selector_stage->has_id())
		{
			$queryarray[] = array(
			
				'$or' => array(
				
					array(
						"_meta.selector_id" => $selector_stage->id()
					),
					array(
						"_id" => new MongoId($selector_stage->id())
					)
					
				)
				
			);
		}
		
		if($selector_stage->has_classnames())
		{
			$classnames_query = array();
			
			foreach($selector_stage->classnames() as $classname)
			{
				$classnames_query[] = array(
				
					"_meta.classnames" => $classname
				
				);
			}
			
			$queryarray[] = Jquarry_Mongoquery::mongo_conditional($classnames_query, 'or');
		}
		
		if($selector_stage->has_attributes())
		{
			$attributes_query = array();
			
			foreach($selector_stage->attributes() as $attribute)
			{
				$field = $attribute["field"];
				$operator = $attribute["operator"];
				$value = Tools_Php::auto_convert($attribute["value"]);
				
				// standard equals operator
				if($operator=='=')
				{
					$attributes_query[] = array(
				
						$field => array(
						
							'$regex' => '^'.preg_quote($value).'$',
							
							'$options' => 'i'
							
						)
						
					);
				}
				// not equals operator
				else if($operator=='!=')
				{
					$attributes_query[] = array(
				
						$field => array(
						
							'$not' => new MongoRegex('/^'.preg_quote($value).'$/i')
							
						)
					
					);
				}
				// starts with
				else if($operator=='^=')
				{
					$attributes_query[] = array(
				
						$field => array(
						
							'$regex' => '^'.preg_quote($value),
							
							'$options' => 'i'
							
						)
					
					);
				}
				// ends with
				else if($operator=='$=')
				{
					$attributes_query[] = array(
				
						$field => array(
						
							'$regex' => preg_quote($value).'$',
							
							'$options' => 'i'
							
						)
					
					);
				}
				// contains word
				else if($operator=='~=')
				{
					$attributes_query[] = array(
				
						$field => array(
						
							'$regex' => '\W'.preg_quote($value).'\W',
							
							'$options' => 'i'
							
						)
					
					);
				}
				// contains
				else if($operator=='*=')
				{
					$attributes_query[] = array(
				
						$field => array(
						
							'$regex' => preg_quote($value),
							
							'$options' => 'i'
							
						)
					
					);
				}
				// prefix (e.g. apple-)
				else if($operator=='|=')
				{
					$attributes_query[] = array(
				
						$field => array(
						
							'$regex' => '^'.preg_quote($value).'-',
							
							'$options' => 'i'
							
						)
					
					);
				}
				// property exists
				else if($operator=='exists')
				{
					$attributes_query[] = array(
				
						$field => array(
						
							'$exists' => true
							
						)
					
					);
				}
				// greater equals to
				else if($operator=='>=')
				{
					$attributes_query[] = array(
				
						$field => array(
						
							'$gte' => $value
							
						)
					
					);
				}
				// greater than
				else if($operator=='>')
				{
					$attributes_query[] = array(
				
						$field => array(
						
							'$gt' => $value
							
						)
					
					);
				}
				// less than equals to
				else if($operator=='<=')
				{
					$attributes_query[] = array(
				
						$field => array(
						
							'$lte' => $value
							
						)
					
					);
				}
				// less than
				else if($operator=='<')
				{
					$attributes_query[] = array(
				
						$field => array(
						
							'$lt' => $value
							
						)
					
					);
				}
				
				
			}
			
			$queryarray[] = Jquarry_Mongoquery::mongo_conditional($attributes_query, 'and');
		}
		
		// the previous collection that was built using the last stage
		$previous_collection = $this->options["previous_collection"];
		
		// the splitter between the previous collection and this query
		// i.e. how do we apply the previous tree encodings to this query
		$splitter = $this->options["splitter"];
		
		if($previous_collection && $splitter)
		{
			$tree_queries = array();
			
			// loop through each node in the last collection and get the tree query for the splitter
			foreach($previous_collection->nodes() as $node)
			{
				// get the query from the node driver
				$node_tree_queries = $node->tree_query($splitter);
				
				$tree_queries = array_merge($tree_queries, $node_tree_queries);
			}
			
			if(count($tree_queries)>0)
			{
				$queryarray[] = Jquarry_Mongoquery::mongo_conditional($tree_queries, 'or');
			}
		}
		
		$mainquery = Jquarry_Mongoquery::mongo_conditional($queryarray, 'and');
		
		return $mainquery;
	}
	
}
