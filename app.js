/*globals messaging_events:true i:true sender:true responseToRequest messageData:true*/
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var app = express();

var dotenv = require('dotenv');
var estafeta = require('./src/routes/estafeta');
var test_pi = require('./src/routes/test_pi');
var validator = require('./src/validators/encuesta');

/**
 * Config
 */
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('./public'));
dotenv.config();

/**
 * CORS
 */
app.use(/* @callback */ function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

/**
 * Routes
 */
app.post('/search', validator.curp, estafeta.search);
app.post('/encuesta', validator.encuesta, estafeta.store);
app.get('/test', test_pi.test);

/**
 * Server
 */
var host = process.env.VCAP_APP_HOST || 'localhost';
var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port, host);