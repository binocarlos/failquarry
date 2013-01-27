TESTS = test/*.js
REPORTER = spec
#REPORTER = dot

check: test

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--timeout 300 \
		--require should \
		--growl \
		$(TESTS)

install:
	npm install

build:
	browserify lib/client.js -o lib/server/www/jquarry/core.js

buildtest:
	browserify lib/client.js -w -o lib/server/www/jquarry/core.js

.PHONY: test