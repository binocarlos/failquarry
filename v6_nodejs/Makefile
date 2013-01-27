TESTS = test/*.js
REPORTER = spec
#REPORTER = dot

check: test

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--timeout 1000 \
		--require should \
		--growl \
		$(TESTS)

devtest:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--reporter $(REPORTER) \
		--timeout 1000 \
		--require should \
		--growl \
		--bail \
		test/stack.js

build:
	#browserify -o lib/container.browser.built.js lib/container.browser.js

install:
	npm install
	#browserify container.browser.js -o container.browser.built.js

.PHONY: test