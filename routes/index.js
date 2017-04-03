var express = require('express');
var mysql = require('mysql');
var router = express.Router();

var dbConnectionInfo = {
  host : 'eu-cdbr-azure-west-d.cloudapp.net',
  user : 'b7ac63e92a8598',
  password : 'dde1f314',
  database : 'acsm_c027cee5201f6e7'
};


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
      req.session.loggedIn = true;
      res.redirect('/userPlaylists');
  });
});

router.get('/userPlaylists', function(req, res, next) {
  if(req.session.loggedIn == false){
    res.redirect('/');
  }
  var dbConnection= mysql.createConnection(dbConnectionInfo);
  dbConnection.connect();

  dbConnection.on('error', function(err){
    if(err.code == 'PROTOCOL_SEQUENCE_TIMEOUT'){
      console.log('Got a PROTOCOL_SEQUENCE_TIMEOUT')
    } else {
      console.log('Got a db error ', err);
    }
  });
 
  dbConnection.query('SELECT name, playlistId FROM playlists_table WHERE userId=?',[req.session.userId], function(err,results,fields){

      if(err){
          throw err;
      }
      var allPlaylists = new Array();
      if(results[0]!=null){
        for (var i=0; i<results.length; i++) {
          var playlist = {};
          playlist.name = results[i].name;
          playlist.playId = results[i].playlistId;
          allPlaylists.push(playlist);
        }
      }
     // listItem.id = results.insertId;
      dbConnection.end();
      res.render('userPlaylists', { playlists: allPlaylists });
  });
  
});

router.get('/createNewPlaylist', function(req, res, next) {
  res.render('createPlaylist');
});

router.post('/newPlaylist', function(req, res, next){
  var playlistName = req.body.playlistName;
  playlistName.trim();
  if(playlistName.length ==0)
  {
    res.redirect('/createNewPlaylist');
  }
  var dbConnection= mysql.createConnection(dbConnectionInfo);
  dbConnection.connect();

  dbConnection.on('error', function(err){
    if(err.code == 'PROTOCOL_SEQUENCE_TIMEOUT'){
      console.log('Got a PROTOCOL_SEQUENCE_TIMEOUT')
    } else {
      console.log('Got a db error ', err);
    }
  });
  var playlistInfo={}
  playlistInfo.playlistName= req.body.playlistName;
  playlistInfo.useId= req.session.userId;
  
  dbConnection.query('INSERT INTO playlists_table(name, userId) VALUES(?, ?)',[playlistInfo.playlistName, playlistInfo.useId ], function(err,results,fields){

      if(err){
          throw err;
      }
     
      dbConnection.end();
      res.redirect('/userPlaylists');
  });
});

router.get('/loginError', function(req, res, next) {
  res.render('loginError',{ errorMsg: req.session.errorMessage });
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
        req.session.loggedIn = false;
        res.redirect('/loginError');
      }else if(req.session.password == results[0].password){
        req.session.userId=results[0].id;
        req.session.loggedIn = true;
        res.redirect('/userPlaylists');
      }else{
        req.session.errorMessage ="Wrong password";
        req.session.loggedIn = false;
        res.redirect('/loginError');
      }
      
      dbConnection.end();
      
  });
});


module.exports = router;
