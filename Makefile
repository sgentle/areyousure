.PHONY: build watch

build:
	coffee -c .

watch:
	coffee -cw .

zip:
	rm -f ../areyousure.zip
	zip ../areyousure.zip *
