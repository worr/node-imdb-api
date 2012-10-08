.PHONY: build test clean

libdir = lib

objects = $(libdir)/imdb.js

$(objects): %.js: %.ts
	tsc $<

build: $(objects)

test: build
	@npm install .
	@./node_modules/.bin/nodeunit test

clean: $(objects)
	rm $<
	rm -rf node_modules
