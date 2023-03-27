const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const app = express();
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({ extended : true }));
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));
app.use(session({secret: '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

var db;

MongoClient.connect('mongodb+srv://admin:qwer1234@cluster0.0sp7tde.mongodb.net/todoapp?retryWrites=true&w=majority', function (에러, client) {

    if (에러) return console.log(에러);
    
    db = client.db('todoapp');

    //5000번 포트로 서버 연결, 서버 연결시 실행할 코드 : function()
    app.listen(5000, function () {
        console.log('listening on 5000');
    });
})

app.get('/', function(req, res){
    res.render('index.ejs');
});

app.get('/write', function(req, res){
    res.render('write.ejs');
});

app.post('/add', function(req, res){
    res.send('전송완료');

    //counter 콜렉션에 있는 name이 '게시물갯수'인 항목을 불러오고
    //totalArticles 에 총 게시물갯수인 totalPost 값 저장
    db.collection('counter').findOne( {name: '게시물갯수'}, function(error, result) {
        if(error) {return console.log(error)};

        console.log(result.totalPost);
        const totalArticles = result.totalPost;

        //tltie, date 를 post 콜렉션에 저장
        db.collection('post').insertOne({ _id: totalArticles + 1, title: req.body.title, date: req.body.date}, function(error, result){
            console.log('저장완료');

            //counter 콜렉션에 있는 totalPost 값 1증가 (수정)
            db.collection('counter').updateOne({name:'게시물갯수'}, { $inc : {totalPost:1} }, function(error, result){
                if(error) {return console.log(error)};

            });
        });
    });
});


app.get('/list', function(req, res){
    
    db.collection('post').find().toArray(function(error, result){
        console.log(result);
        res.render('list.ejs', { posts : result} );
    }); 
});

app.delete('/delete', function(req, res){
    console.log(req.body);
    //req.body._id를 int형으로 변환
    req.body._id = parseInt(req.body._id);
    db.collection('post').deleteOne(req.body, function(error, result){
        if(error) {return console.log(error)};
        console.log('삭제완료');
        res.status(200).send({ message: '성공했습니다' }); //요청 성공 400: 실패
    });
});

app.get('/detail/:id', function(req, res){
    db.collection('post').findOne({ _id: parseInt(req.params.id) }, function(error, result) {
        if(error) {return console.log(error)};

        console.log(result);
        res.render('detail.ejs', { data : result });
    })
})

app.get('/edit/:id', function(req, res){
    db.collection('post').findOne({ _id: parseInt(req.params.id) }, function(error, result){
        if(error) {return console.log(error)};
        
        console.log(result);
        res.render('edit.ejs', {post : result});
    });
});

app.put('/edit', function(req, res){
    db.collection('post').updateOne({ _id: parseInt(req.body.id) }, { $set : { title: req.body.title, date: req.body.date } }, function(error, result){
        if(error) {return console.log(error)};

        console.log('수정완료');
        //다른 페이지로 이동하는 코드 list 페이지로 이동함
        res.redirect('/list');
   });
});

app.get('/login', function(req, res){
    res.render('login.ejs');
});

app.post('/login', passport.authenticate('local', {
    //실패하면 fail페이지로 이동
    failureRedirect : '/fail'
 }), function(req, res){
    //성공하면 보낼 페이지
    res.redirect('/');
});

app.get('/mypage', checklogin, function(req, res){
    console.log(req.user); //deserializeUser에서 찾은 유저의 정보
    res.render('mypage.ejs', { User : req.user});
});

//미들웨어
function checklogin(req, res, next) {
    if(req.user) { // 로그인 후 세션이 있으면 req.user가 항상 있음
        next()
    } else {
        res.send('로그인이 필요합니다.');
    }
}

//login 페이지에서 post 요청 할시 실행하는 코드
passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true, // 세션 저장할 것인지
    passReqToCallback: false, // 아이디, 비번 말고도 다른정보 검증할시 true로
  }, function (입력한아이디, 입력한비번, done) {
    console.log(입력한아이디, 입력한비번);
    db.collection('login').findOne({ id: 입력한아이디 }, function (error, result) { //아이디부터 검사
      if (error) return done(error)
  
      if (!result) return done(null, false, { message: '존재하지않는 아이디요' }) // DB에 일치하는 아이디가 없을때 * done( (서버에러), (성공시사용자DB데이터), {에러메시지} )
      if (입력한비번 == result.pw) { //DB에 일치하는 아이디가 있으면 pw 비교
        return done(null, result)
      } else {
        return done(null, false, { message: '비번틀렸어요' }) //비번틀렸을때
      }
    })
  }));
//id를 이용해서 세션을 저장시키는 코드 (로그인 성공시 발동)
//                   위 코드 result가 user로 들어감
passport.serializeUser(function (user, done) {
    done(null, user.id) // 세션 데이터를 만들고 세션의 id 정보를 쿠키로 보냄
});
//이 세션 데이터를 가진 사람을 DB에서 찾아주세요 (마이페이지 접속시 발동)
passport.deserializeUser(function (id, done) {
    //DB에서 위에있는 user.id로 유저를 찾은 뒤에 유저 정보를
    db.collection('login').findOne({id: id}, function(error, result){
      if (error) return done(error)

        done(null, result)
    //          여기에 넣음
    });
});