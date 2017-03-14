var express = require('express');
var mysql = require('mysql');
var router = express.Router();

var dbConnectionInfo = {
  host : 'eu-cdbr-azure-west-d.cloudapp.net',
  user : 'b7ac63e92a8598',
  password : 'dde1f314',
  database : 'acsm_c027cee5201f6e7'
};

/* GET home page. */
