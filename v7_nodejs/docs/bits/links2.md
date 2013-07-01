Links
-----

Soft-links are redirects to another container.

The soft-link has it's own meta and attributes but cannot have any children.

When a contract resolver hits a soft-link it branches the request into the new location
for the remainder of the contract.

You update the soft-link and it's targets data seperately - this means you can create
multiple soft-links all to the same target.

Each soft link can contain different meta/attr and so it lets you compose a system
with pointers.

Hard links are full on replications of a tree structure elsewhere in the system from it's source.

When a container is hard-linked - all of it's descendents are marked with it's master twin.

Then - if a linked twin is updated - it will broadcast and update on the master twin route.

Each linked twin as well as the master all have a server-side sync portal onto the master id.

This means that you can replicate whole trees that listen to updates via sync portal but all 
pointing to the master