# Container

The container is the main building block of a quarry system.

Main methods:

## Properties

  id - the global quarry ID for this container
  done

  tag - the type the container has been given
  done

  class, hasClass, addClass, removeClass - class manipulators
  done

  attr - object access to properties saved via the supplier functions
  done

  data - object access to temporal data structure
  done

## Tree:

  append - add a container as a child

  appendTo - add this container as a child of another

  detatch - remove the given container as a child of this

  children - return an array of top level containers in this one

  descendents - return an array of all children within this one

  parent - return the containers this one lives inside of

  ancestors - return the containers right to the top

## Children Access:

  each - run the given function for each top-level container

  at - return the root container at the given index

  first - return the first root container

  last - return the last root container

## Middleware:

  use - add a function that any container added into this one will be run through

## Loading:

  find - find elements that are already loaded in memory - returns a container

  ship - triggers a fresh database load using this container as the starting point - returns a container
  
## Persistence:

  save - save this element and any changed children back to the supplier
  
  delete - delete this element and all children from the supplier

## Events:

  save
  delete
  append
  appendTo


  

  

  




