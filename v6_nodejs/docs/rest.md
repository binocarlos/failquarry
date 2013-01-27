We've already seen that the 201 Created status code indicates the successful creation of a resource. We'll need a handful of other useful codes both for this example and for Web-based integration in general:
200 OK - This is what we like to see: everything's fine; let's keep going. 201 Created - We've just created a resource and everything's fine.
202 Accepted - The service has accepted our request, and invites us to poll a URI in the Location header for the response. Great for asynchronous processing.
303 See Other - We need to interact with a different resource. We're probably still OK.
400 Bad Request - We need to reformat the request and resubmit it.
404 Not Found - The service is far too lazy (or secure) to give us a real reason why our request failed, but whatever the reason, we need to deal with it.
409 Conflict - We tried to update the state of a resource, but the service isn't happy about it. We'll need to get the current state of the resource (either by checking the response entity body, or doing a GET) and figure out where to go from there.
412 Precondition Failed - The request wasn't processed because an Etag, If-Match or similar guard header failed evaluation. We need to figure out how to make forward progress.
417 Expectation Failed - You did the right thing by checking, but please don't try to send that request for real.
500 Internal Server Error - The ultimate lazy response. The server's gone wrong and it's not telling why. Cross your fingers…