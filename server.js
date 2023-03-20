const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const app = express();
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({ extended : true }));
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));

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
        console.log(result);
        res.render('edit.ejs', {post : result});
    });
});

app.put('/edit', function(req, res){
    db.collection('post').updateOne({ _id: parseInt(req.body.id) }, { $set : { title: req.body.title, date: req.body.date } }, function(error, result){
        console.log('수정완료');
        res.redirect('/list');
   });
});