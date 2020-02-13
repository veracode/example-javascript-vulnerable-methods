'use strict';

const	http     = require('http'),
        algoserv = require('algo-httpserv'),
	fs	 = require('fs'),
        yaml     = require('js-yaml'),
	yamlTo   = require('to'),
        yamlConf = require('node-yaml-config');// the vunlerable library is include to check whether we have false postives


///----------The following are the driver---------------------///

// call vulnerable method js-yaml.load directly
// js-yaml.load is vulnerable to code execution in yaml file 
const data = yaml.load(fs.readFileSync('./data/yaml-exploit.yml', 'utf-8'));
console.log(data);

// transitive vulnerable method, 
// the to lib uses js-yaml.load which is vulnerable
const data2 = yamlTo.load('./data/yaml-exploit.yml');
console.log(data2);

// pass the vulnerable method as a callback
const server = http.createServer(algoserv.serve);

// pass an callback which calls vulnerable method 
algoserv.on('/api/', (request, response, url) => {
    response.writeHead(200, {'Content-Type': 'application/json'});
    const data3 = yaml.load(fs.readFileSync('./data/yaml-exploit.yml', 'utf-8'));
    console.log(data3);
    response.write(JSON.stringify(data3));
    response.end();
});

server.listen(8001);


