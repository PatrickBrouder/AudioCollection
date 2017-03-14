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
router.get('/create', function(req, res, next) {
  res.render('createAccount');
});

router.post('/newAccount', function(req, res, next){
  var dbConnection= mysql.createConnection(dbConnectionInfo);
  dbConnection.connect();

  dbConnection.on('error', function(err){
    if(err.code == 'PROTOCOL_SEQUENCE_TIMEOUT'){
      console.log('Got a PROTOCOL_SEQUENCE_TIMEOUT')
    } else {
      console.log('Got a db error ', err);
    }
  });

  var userInfo={}
  userInfo.username= req.body.username;
  userInfo.email= req.body.email;
  userInfo.password= req.body.password;
  dbConnection.query('INSERT INTO user(username, email, password) VALUES(?,?, ?)',[userInfo.username, userInfo.email, userInfo.password], function(err,results,fields){

      if(err){
          throw err;
      }
     // listItem.id = results.insertId;
      dbConnection.end();
      res.redirect('/home');
  });


});