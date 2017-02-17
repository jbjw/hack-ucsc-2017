//

'use strict';

var url = require('url');
var path = require('path');
var fs = require('fs');
var http = require('http');
var express = require('express');

const args = process.argv;
const httpPort = args[args.indexOf("-p") + 1 || args.indexOf("--port") + 1 || -1] || 80; // bleh, fix

const app = express();

function log( req, res, next ) {
	req.time = Date.now(); // new Date();
	console.log( `${req.time} ${req.method} ${req.headers.host} ${req.url} ${req.secure ? 'https' : 'http' }` );

	next(); return;
}

app.use( log );
app.use( express.static( __dirname, {index: 'webvr_vive_paint.html'} ) );

app.listen( httpPort, function () {
	console.log( `Example app listening on port ${httpPort}` );
} );

// const httpServer = http.createServer( app );
// httpServer.listen( httpPort, function () {
// 	console.log( `http server listening on port ${httpPort}` );
// } );
