'use strict';

const	topLogPrefix	= 'larvitbase-api: ./index.js: ',
	ReqParser	= require('larvitreqparser'),
	Router	= require('larvitrouter'),
	semver	= require('semver'),
	LBase	= require('larvitbase'),
	path	= require('path'),
	Lfs	= require('larvitfs'),
	fs	= require('fs'),
	LUtils	= require('larvitutils');

function Api(options) {
	const	logPrefix	= topLogPrefix + 'Api() - ',
		that	= this;

	let	controllersFullPath,
		lfs,
		altControllerPaths;

	that.routeCache = {};

	if ( ! options) {
		options	= {};
	}

	that.options	= options;

	if ( ! that.options.log) {
		const lUtils = new LUtils();
		that.options.log = new lUtils.Log();
	}
	that.log = that.options.log;


	if ( ! that.options.routerOptions)	{ that.options.routerOptions	= {};	}
	if ( ! that.options.routerOptions.controllersPath)	{ that.options.routerOptions.controllersPath	= 'controllers';	}
	if ( ! that.options.routerOptions.basePath)	{ that.options.routerOptions.basePath	= process.cwd();	}
	if ( ! Array.isArray(that.options.routerOptions.routes))	{ that.options.routerOptions.routes	= [];	}

	if ( ! that.options.baseOptions) that.options.baseOptions	= {};
	if ( ! Array.isArray(options.baseOptions.middleware)) {
		options.baseOptions.middleware	= [];
	}

	if (! that.options.reqParserOptions) { that.options.reqParserOptions = {}; }

	if (! that.options.baseOptions.log) { that.options.baseOptions.log = that.log; }
	if (! that.options.routerOptions.log) { that.options.routerOptions.log = that.log; }
	if (! that.options.reqParserOptions.log) { that.options.reqParserOptions.log = that.log; }

	that.middleware	= options.baseOptions.middleware;

	// Instantiate lfs
	lfs	= new Lfs({'basePath': that.options.routerOptions.basePath});

	altControllerPaths = lfs.getPathsSync('controllers');

	// Resolve apiVersions
	controllersFullPath	= path.join(that.options.routerOptions.basePath, that.options.routerOptions.controllersPath);
	if (fs.existsSync(controllersFullPath)) {
		that.apiVersions = fs.readdirSync(controllersFullPath).filter(function (file) {
			let	versionStr	= semver.clean(String(file) + '.0');

			if (
				fs.statSync(controllersFullPath + '/' + file).isDirectory()
				&& semver.valid(versionStr) !== null
			) {
				return true;
			} else {
				return false;
			}
		});
	} else {
		that.apiVersions	= [];
		that.log.info(logPrefix + 'No controllers folder detected');
	}

	// Sort apiVersions
	that.apiVersions.sort(function (a, b) {
		return semver.gt(a + '.0', b + '.0');
	});

	// Instantiate the router
	that.router	= new Router(that.options.routerOptions);

	// Instantiate the request parser
	that.reqParser	= new ReqParser(that.options.reqParserOptions);

	that.middleware.push(function (req, res, cb) {
		that.reqParser.parse(req, res, cb);
	});

	// Default to the latest version of the API
	that.middleware.push(function (req, res, cb) {
		if ( ! semver.valid(req.url.split('/')[1] + '.0') && that.apiVersions.length) {
			req.url	= '/' + that.apiVersions[that.apiVersions.length - 1] + req.url;
		}
		req.apiVersion	= req.url.split('/')[1];
		req.urlBase	= req.url.split('?')[0];
		cb();
	});

	// Route the request
	that.middleware.push(function (req, res, cb) {
		let	readmeFile	= false;

		// use cache first
		if (that.routeCache[req.urlBase]) {
			const rc = that.routeCache[req.urlBase];

			if (rc.type === 'readme') {
				res.setHeader('Content-Type', 'text/markdown; charset=UTF-8');
				res.end(rc.data);
				return;
			} else {
				req.routed = that.routeCache[req.urlBase];
				return cb();
			}
		}

		// clean cache if more than 1000 entries to avoid ddos or such
		if (Object.keys(that.routeCache).length > 1000) {
			that.routeCache = {};
		}

		// Check if url is matching a directory that contains a README.md

		// Request directly on root, existing README.md in root
		if (req.urlBase === '/' && lfs.getPathSync(path.join(that.options.routerOptions.basePath, '/README.md'))) {
			readmeFile	= path.join(that.options.routerOptions.basePath, '/README.md');

		// README exists on exactly the version URL requested
		} else if (lfs.getPathSync(path.join(req.urlBase, '/README.md').substring(1))) {
			readmeFile	= lfs.getPathSync(path.join(req.urlBase, '/README.md').substring(1));
		} else if (lfs.getPathSync(path.join('controllers/', req.urlBase, '/README.md'))) {
			readmeFile	= lfs.getPathSync(path.join('controllers/', req.urlBase, '/README.md'));

		// Get readme directly from root, if it is missing in version folders
		// AND requested url is exactly a version-url
		} else if (semver.valid(req.url.split('/')[1] + '.0') && lfs.getPathSync('README.md') && req.urlBase === '/' + req.urlBase.split('/')[1] + '/') {
			readmeFile	= lfs.getPathSync('README.md');

		// Get hard coded string if root or version-url is requested and README.md is missing
		// AND requested url is exactly a version-url
		} else if (req.urlBase === '/' || semver.valid(req.url.split('/')[1] + '.0') && req.urlBase === '/' + req.url.split('/')[1] + '/') {
			return res.end('API is up and running. This API contains no README.md');
		}

		// If a readme file is found, send that to the browser and end the request
		if (readmeFile) {
			res.setHeader('Content-Type', 'text/markdown; charset=UTF-8');
			return fs.readFile(readmeFile, function (err, data) {
				if (err) return cb(err);

				that.routeCache[req.urlBase] = {
					'type': 'readme',
					'data': data
				};
				res.end(data);
			});
		}
		that.router.resolve(req.urlBase, function (err, result) {
			if (err) return cb(err);

			// if nothing is found, check in the alternative controller paths
			if (Object.keys(result).length === 0) {
				for (let i = 0; altControllerPaths[i] !==  undefined; i ++) {
					let stat;

					if ( ! fs.existsSync(altControllerPaths[i])) continue;

					stat = fs.statSync(altControllerPaths[i]);

					if (stat.isDirectory()) {

						// check if file exists without version no in the controllers path
						if (fs.existsSync(path.join(altControllerPaths[i], req.urlBase) + '.js')) {
							req.routed = {
								'controllerFullPath': path.join(altControllerPaths[i], req.urlBase) + '.js',
								'controllerPath': req.urlBase
							};
							that.routeCache[req.urlBase] = req.routed; // add to cache
							break;
						}
					}
				}
			}

			if ( ! req.routed) {
				that.routeCache[req.urlBase] = result;
				req.routed = result;
			}

			cb();
		});
	});

	// Run controller
	that.middleware.push(function (req, res, cb) {
		if ( ! req.routed.controllerFullPath) {
			res.statusCode	= 404;
			res.data	= '"URL endpoint not found"';
			cb();
		} else {
			require(req.routed.controllerFullPath)(req, res, cb);
		}
	});

	// Output JSON to client
	that.middleware.push(function (req, res, cb) {
		let	sendData	= res.data;

		res.setHeader('Content-Type', 'application/json; charset=UTF-8');

		try {
			if (typeof sendData !== 'string' && ! Buffer.isBuffer(sendData)) {
				sendData	= JSON.stringify(sendData);
			}
		} catch (err) {
			return cb(err);
		}

		res.end(sendData);
		cb();
	});

	// Clean up if file storage is used by parser
	that.middleware.push(function (req, res, cb) {
		that.reqParser.clean(req, res, cb);
	});
};

Api.prototype.start = function start(cb) {
	const	that	= this;

	that.base	= new LBase(that.options.baseOptions);

	that.base.start(cb);

	that.base.on('error', function (err, req, res) {
		res.statusCode	= 500;
		res.end('"Internal server error: ' + err.message + '"');
	});
};

Api.prototype.stop = function (cb) {
	const	that	= this;
	that.base.httpServer.close(cb);
};


///----------The following are the driver---------------------///
// the following is an excerpt from lavitbase-api
const api = new Api({
        'baseOptions':  {'httpOptions': 8001},  // sent to larvitbase
        'routerOptions':        {},     // sent to larvitrouter
        'reqParserOptions':     {},     // sent to larvitReqParser
});

api.start(function (err) {});
