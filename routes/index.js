var express = require('express');
var mysql = require('mysql');
var router = express.Router();

var dbConnectionInfo = {
  host : 'eu-cdbr-azure-west-d.cloudapp.net',
  user : 'b7ac63e92a8598',
  password : 'dde1f314',
  database : 'acsm_c027cee5201f6e7'
};
req.session.errorMessage ="";
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});
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

router.get('/home', function(req, res, next) {
  res.render('home');
});

router.post('/login', function(req, res, next){
  var dbConnection= mysql.createConnection(dbConnectionInfo);
  dbConnection.connect();

  dbConnection.on('error', function(err){
    if(err.code == 'PROTOCOL_SEQUENCE_TIMEOUT'){
      console.log('Got a PROTOCOL_SEQUENCE_TIMEOUT')
    } else {
      console.log('Got a db error ', err);
    }
  });
  
  req.session.username= req.body.username;
  req.session.password= req.body.password;
  dbConnection.query('SELECT password, id FROM user WHERE username=?',[req.session.username], function(err,results,fields){
      
      if(err){
          throw err;
      }
      if(results[0]==null){
        req.session.errorMessage ="Wrong username";
        res.redirect('/',{ errorMsg: req.session.errorMessage });
      }else if(req.session.password == results[0].password){
        req.session.id=results[0].id;
        res.redirect('/home');
      }else{
        req.session.errorMessage ="Wrong password";
        res.redirect('/',{ errorMsg: req.session.errorMessage });
      }
      
      dbConnection.end();
      
  });
});
module.exports = router;
