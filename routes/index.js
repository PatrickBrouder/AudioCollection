var express = require('express');
var mysql = require('mysql');
var nodemailer = require('nodemailer');
var router = express.Router();


var dbConnectionInfo = {
  host : 'localhost',
  user : 'root',
  password : '12345',
  database : 'audio_1'
}


/*

var dbConnectionInfo = {
  host : 'eu-cdbr-azure-west-d.cloudapp.net',
  user : 'b7ac63e92a8598',
  password : 'dde1f314',
  database : 'acsm_c027cee5201f6e7'
};
*/
router.get('/', function(req, res, next) {
  req.session.loggedIn = false;
  res.render('index');
});
router.get('/create', function(req, res, next) {
  res.render('createAccount');
});


router.post('/newAccount', function(req, res, next){

  req.session.username= req.body.username;
  req.session.email= req.body.email;
  req.session.password= req.body.password;

  req.session.username.trim();
  req.session.email.trim();
  req.session.password.trim();
  if(req.session.username.length ==0 || req.session.email.length ==0 ||req.session.password.length ==0)
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
  var nameUsedBefore=false;
  var emailUsedBefore=false;
  dbConnection.query('SELECT username, email FROM user', function(err,results,fields){
      
      if(err){
          throw err;
      }
      if(results[0]!=null){
       for(i=0; i<results.length; i++){
          if(results[i].username==req.body.username){
            nameUsedBefore=true;
            
          }
          if(results[i].email==req.body.email){
            emailUsedBefore=true;
            
          }
       }
      }
      if(nameUsedBefore==true){
        var errorMsgAccount= "User name used before"
        dbConnection.end();
        return res.render('createAccount',{ accountError: errorMsgAccount });
      }else if(emailUsedBefore==true){
        var errorMsgAccount= "Email already in use"
        dbConnection.end();
        return res.render('createAccount',{ accountError: errorMsgAccount });
      }else{
        dbConnection.end();
        return res.redirect('/addNewAccount');
      }
      
      
  });
  
  
  
  
});

router.get('/addNewAccount', function(req, res, next) {
  var dbConnection= mysql.createConnection(dbConnectionInfo);
  dbConnection.connect();

  dbConnection.on('error', function(err){
    if(err.code == 'PROTOCOL_SEQUENCE_TIMEOUT'){
      console.log('Got a PROTOCOL_SEQUENCE_TIMEOUT')
    } else {
      console.log('Got a db error ', err);
    }
  });
  dbConnection.query('INSERT INTO user(username, email, password) VALUES(?,?, ?)',[req.session.username, req.session.email, req.session.password], function(err,results,fields){

      if(err){
          throw err;
      }
     
  });
  var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'audiocollection1@gmail.com',
            pass: 'SSPassignment'
        }
    });
    var mailOptions = {
      from: '<audiocollection1@gmail.com',
      to: req.session.email, // list of receivers
      subject: 'Joined Audio Collection', 
      text: 'Hello ' +req.session.username+' thanks for joing audio collection' 
  	};
    transporter.sendMail(mailOptions, function(error, info){
    if(error){
        console.log(error);
        res.json({yo: 'error'});
    }else{
        console.log('Message sent: ' + info.response);
        res.json({yo: info.response});
    };
});
  dbConnection.query('SELECT id, email FROM user WHERE username=?',[req.session.username], function(err,results,fields){
      
      if(err){
          throw err;
      }
      
      req.session.userId=results[0].id;
      req.session.userEmail=results[0].email;
      dbConnection.end();
      req.session.loggedIn = true;
      res.redirect('/userPlaylists');
  });

   });
 

router.get('/userPlaylists', function(req, res, next) {
  if(req.session.loggedIn == false){
    return res.redirect('/');
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
  if(req.session.loggedIn == false){
    return res.redirect('/');
  }
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
  req.session.playlistName= req.body.playlistName;
  var playlistAlready=false;
  dbConnection.query('SELECT name FROM playlists_table WHERE userId=?',[req.session.userId], function(err,results,fields){

      if(err){
          throw err;
      }
      if(results[0]!=null){
       for(i=0; i<results.length; i++){
          if(results[i].name==req.body.playlistName){
            playlistAlready=true;
          }
       }
      }
      if(playlistAlready==true){
        var errorMsgPlay= "Playlist already exists"
        dbConnection.end();
        return res.render('createPlaylist',{ playlistError: errorMsgPlay });
      }else{
        dbConnection.end();
        return res.redirect('/addNewPlaylist');
      }
      
    });
});

router.get('/addNewPlaylist', function(req, res, next) {
  var dbConnection= mysql.createConnection(dbConnectionInfo);
  dbConnection.connect();

  dbConnection.on('error', function(err){
    if(err.code == 'PROTOCOL_SEQUENCE_TIMEOUT'){
      console.log('Got a PROTOCOL_SEQUENCE_TIMEOUT')
    } else {
      console.log('Got a db error ', err);
    }
  });
  var id=req.session.userId;
  dbConnection.query('INSERT INTO playlists_table(name, userId) VALUES(?, ?)',[req.session.playlistName, id], function(err,results,fields){

      if(err){
          throw err;
      }
     
      dbConnection.end();
      res.redirect('/userPlaylists');
  });
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
  dbConnection.query('SELECT password, id, email FROM user WHERE username=?',[req.session.username], function(err,results,fields){
      
      if(err){
          throw err;
      }
      if(results[0]==null){
        req.session.loggedIn = false;
        var errorMsgLogin="Wrong username must use username and not email"
        return  res.render('index',{ errorMsg:errorMsgLogin  });
      }else if(req.session.password == results[0].password){
        req.session.userId=results[0].id;
        req.session.userEmail=results[0].email;
        req.session.loggedIn = true;
        res.redirect('/userPlaylists');
      }else{
        req.session.loggedIn = false;
        var errorMsgLogin="Wrong password"
        return  res.render('index',{ errorMsg:errorMsgLogin  });
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
  if(req.session.loggedIn == false){
    return res.redirect('/');
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
  if(req.session.loggedIn == false){
    return res.redirect('/');
  }
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
  if(req.session.loggedIn == false){
    return res.redirect('/');
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

router.get('/logout', function(req, res, next) {
  req.session.destroy()

  res.redirect('/');
});
module.exports = router;






