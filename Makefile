.PHONY: build test clean

libdir = lib

objects = lib/imdb.js

$(objects): lib/%.js: src/%.ts
	tsc -m commonjs $<
	mv $(<:ts=js) $@

build: $(objects)

test: build
	@npm install .
	@./node_modules/.bin/nodeunit test

clean: $(objects)
	rm $<
	rm -rf node_modules
