/**
 * Created by Roman on 05.03.2015.
 */
var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var app = express();
var http = require('http');
var fs;
var port;
var server;
var config;
var session = require('express-session');
var MemoryStore = require('connect-redis')(session);
var knex;
var PostGre;
var Models;

//todo change
//process.env.NODE_ENV = 'development';
process.env.NODE_ENV = 'production';

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', __dirname + '/public/static');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

if (process.env.NODE_ENV === 'development') {
    console.log('-----Server start success in Development version--------');
    require('./config/development');
} else {
    console.log('-----Server start success in Production version--------');
    require('./config/production');
}

config = {
    db: 8,
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT) || 6379
};

app.use(session({
    name: 'WhatAboutNo',
    secret: '1q2w3e4r5tdhgkdfhgejflkejgkdlgh8j0jge4547hh',
    resave: true,
    saveUninitialized: true
    //store: new MemoryStore(config)
}));

knex = require('knex')({
    //debug: true,
    client: 'pg',
    connection: {
        host: process.env.RDS_HOSTNAME,
        user: process.env.RDS_USERNAME,
        password: process.env.RDS_PASSWORD,
        port: process.env.RDS_PORT,
        database: process.env.DATABASE
        //charset: 'utf8'
    }
});
PostGre = require('bookshelf')(knex);

fs = require('fs');

Models = require('./models/index');
Collections = require('./collections/index');

PostGre.Models = new Models(PostGre);
PostGre.Collections = new Collections(PostGre);

require('./routes/index')(app, PostGre);

port = parseInt(process.env.PORT) || 8081;
server = http.createServer(app);

server.listen(port, function () {
    console.log('Express start on port ' + port );
});