Create = PUT with a new URI
         POST to a base URI returning a newly created URI
Read   = GET
Update = PUT with an existing URI
Delete = DELETE


Select = GET ://kai.quarry.io/xml/myfile.xml							
	headers:
		skeleton
	body:
		selector

Append = POST ://kai.quarry.io/xml/myfile.xml
	headers:
		skeleton
	body:
		data
		
Save = PUT ://kai.quarry.io/xml/myfile.xml/123
	body:
		data

Delete = DELETE ://kai.quarry.io/xml/myfile.xml/123


proto = quarry
hostname = kai.quarry.io
supplier = xml
resource = myfile.xml



