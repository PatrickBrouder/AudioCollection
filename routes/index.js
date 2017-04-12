var express = require('express');
var mysql = require('mysql');
var router = express.Router();

/*
var dbConnectionInfo = {
  host : 'localhost',
  user : 'root',
  password : '12345',
  database : 'audio_1'
}
*/
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
  var userInfo={}
  userInfo.username= req.body.username;
  userInfo.email= req.body.email;
  userInfo.password= req.body.password;
  req.session.username=req.body.username;

  userInfo.username.trim();
  userInfo.email.trim();
  userInfo.password.trim();
  if(userInfo.username.length ==0 || userInfo.email.length ==0 ||userInfo.password.length ==0)
  {
    var errorMsgAccount= "All fields must be filled in"
    return res.render('createAccount',{ accountError: errorMsgAccount });
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
  dbConnection.query('SELECT id FROM user WHERE username=?',[req.session.username], function(err,results,fields){
      
      if(err){
          throw err;
      }
      
        req.session.userId=results[0].id;
        
      
      
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
    var errorMessagePlaylist="Playlist must have a name";
    return res.render('createPlaylist',{ playlistError: errorMessagePlaylist });
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

router.get('/listen/:id', function(req, res, next) {
  
  if (req.params.id) {
    req.session.currentPlaylist=req.params.id;
    res.redirect('/playlist');
  }

});
router.get('/playlist', function(req, res, next) {
  var dbConnection= mysql.createConnection(dbConnectionInfo);
  dbConnection.connect();

  dbConnection.on('error', function(err){
    if(err.code == 'PROTOCOL_SEQUENCE_TIMEOUT'){
      console.log('Got a PROTOCOL_SEQUENCE_TIMEOUT')
    } else {
      console.log('Got a db error ', err);
    }
  });
    var trackInPlaylist= new Array();
    var trackInfo = {};
    var playlistName=" ";
    dbConnection.query('SELECT name FROM playlists_table WHERE playlistId=?',[req.session.currentPlaylist], function(err,results,fields){
      
      if(err){
          throw err;
      }
       playlistName= results[0].name;
      
  });
    dbConnection.query('SELECT name, id FROM audio_links WHERE id IN(SELECT idaudio FROM audio_playlist WHERE playlistid=?) ',[req.session.currentPlaylist], function(err,results, fields) {
      if (err) {
        throw err;
      }
     
      if(results[0]!=null){
        for (var i=0; i<results.length; i++) {

          trackInfo.name = results[i].name;
          trackInfo.id = results[i].id;
          trackInPlaylist.push(trackInfo);
        }
      }
       dbConnection.end();
       res.render('playlist', { songsInPlaylist: trackInPlaylist, playName: playlistName  } );
    });
});
router.get('/addNewTrack', function(req, res, next) {
  res.render('addTrack');
});

router.post('/newTrack', function(req, res, next){
  var trackName = req.body.trackName;
  trackName.trim();
  var trackUrl = req.body.trackLink;
  trackUrl.trim();
  if(trackName.length ==0 ||trackUrl.length ==0)
  {
    var errorMessageTrack="both fields must contain something"
    return res.render('addTrack', { errorMsgTrack: errorMessageTrack });
  }
  
  var n = trackUrl.indexOf("soundcloud.com");
  if(n== -1){
    var errorMessageTrack2="track must be a soundcloud url"
    return res.render('addTrack', { errorMsgTrack: req.session.errorMessageTrack2 });
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

  var trackInfo={}
  trackInfo.trackN= req.body.trackName;
  trackInfo.trackLink= req.body.trackLink;
  dbConnection.query('INSERT INTO audio_links(name, url) VALUES(?,?)',[trackInfo.trackN, trackInfo.trackLink], function(err,results,fields){

      if(err){
          throw err;
      }
      
  });
  
  dbConnection.query('INSERT INTO audio_playlist(idaudio, playlistid) VALUES ((SELECT id FROM audio_links WHERE url=? && name=?),?)',[trackInfo.trackLink, trackInfo.trackN, req.session.currentPlaylist], function(err,results,fields){
      
      if(err){
          throw err;
      }
        dbConnection.end();
      res.redirect('/playlist');
  });
});

router.get('/playSong/:id', function(req, res, next) {
  
  if (req.params.id) {
    req.session.currentSong=req.params.id;
    res.redirect('/track');
  }

});

router.get('/track', function(req, res, next) {
  var dbConnection= mysql.createConnection(dbConnectionInfo);
  dbConnection.connect();

  dbConnection.on('error', function(err){
    if(err.code == 'PROTOCOL_SEQUENCE_TIMEOUT'){
      console.log('Got a PROTOCOL_SEQUENCE_TIMEOUT')
    } else {
      console.log('Got a db error ', err);
    }
  });
    
    dbConnection.query('SELECT name, url FROM audio_links WHERE id=?',[req.session.currentSong], function(err,results, fields) {
      if (err) {
        throw err;
      }
       var songPlaying= new Array();
      if(results[0]!=null){
        for (var i=0; i<results.length; i++) {
          var trackPlay= {};
          trackPlay.name = results[i].name;
          trackPlay.url = results[i].url;
          trackPlay.urlLink = "https://w.soundcloud.com/player?url="+trackPlay.url
          songPlaying.push(trackPlay);
        }
      }
       dbConnection.end();
       res.render('track', { playingNow: songPlaying });
    });
});

router.get('/deleteSong/:id', function(req, res, next) {
  
  if (req.params.id) {
    var dbConnection = mysql.createConnection(dbConnectionInfo);
    dbConnection.connect();

    
    dbConnection.on('error', function(err) {
      if (err.code == 'PROTOCOL_SEQUENCE_TIMEOUT') {
        console.log('Got a DB PROTOCOL_SEQUENCE_TIMEOUT Error ... ignoring ');
      } else {
        console.log('Got a DB Error: ', err);
      }
    });

    dbConnection.query('DELETE FROM audio_playlist WHERE idaudio=? && playlistId',[req.params.id, req.session.currentPlaylist], function(err,results, fields) {
      if (err) {
        throw err;
      }
       dbConnection.end();
       res.redirect('/playlist');
    });
  }

});

router.get('/deletePlaylist/:id', function(req, res, next) {
  
  if (req.params.id) {
    var dbConnection = mysql.createConnection(dbConnectionInfo);
    dbConnection.connect();

    
    dbConnection.on('error', function(err) {
      if (err.code == 'PROTOCOL_SEQUENCE_TIMEOUT') {
        console.log('Got a DB PROTOCOL_SEQUENCE_TIMEOUT Error ... ignoring ');
      } else {
        console.log('Got a DB Error: ', err);
      }
    });
    dbConnection.query('DELETE FROM audio_playlist WHERE playlistid=?',[req.params.id], function(err,results, fields) {
      if (err) {
        throw err;
      }
       
    });
    dbConnection.query('DELETE FROM playlists_table WHERE playlistId=?',[req.params.id], function(err,results, fields) {
      if (err) {
        throw err;
      }
       dbConnection.end();
       res.redirect('/userPlaylists');
    });
  }

});
module.exports = router;