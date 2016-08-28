.PHONY: deps build test clean

libdir = lib
objects = $(libdir)/imdb.js

tsc := $(shell command -V tsc 2>/dev/null)
ifeq (, $(tsc))
tsc = ./node_modules/typescript/bin/tsc
endif

$(libdir)/%.js: src/%.ts
	$(tsc) -m commonjs --outDir $(libdir) $<

build: deps $(objects)

deps:
	@npm install .

test: build
	@npm install .
	@./node_modules/.bin/nodeunit test

clean: $(objects)
	rm -f $<
	rm -rf node_modules
