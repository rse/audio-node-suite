
test:
	@if [ ! -f tls-sv.crt ]; then sh ./tls.sh localhost 127.0.0.1; fi
	@if [ ! -d node_modules ]; then npm install; fi
	@echo "running sample under https://localhost:12345/sample.html"
	npx serve -n -u -d -l 12345 --ssl-cert tls-sv.crt --ssl-key tls-sv.key .

clean:
	-rm -f tls-*.*

distclean: clean
	-rm -rf node_modules

