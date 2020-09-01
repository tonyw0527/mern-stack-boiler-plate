//Express
const express = require('express');
const app = express();
const PORT = 5000;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const config = require('./config/key');
// 토큰 인증
const { auth } = require('./middleware/auth');

// application/x-www-form-urlencoded 형태의 데이터를 parsing
app.use(bodyParser.urlencoded({extended: true}));
// application/json 형태의 데이터를 parsing
app.use(bodyParser.json());
app.use(cookieParser());

//MongoDB
const { User } = require('./models/User');
const mongoose = require('mongoose');
mongoose.connect(config.mongoURI, {
    useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false
})
.then(() => console.log('MongoDB Connected Now!..'))
.catch(err => console.log(err));

app.get('/', (req, res) => res.send('Hello World!'));

app.post('/api/users/register', (req, res) => {

    // 회원가입할때 필요한 정보들을 client에서 가져오면
    // 그것들을 데이터 베이스에 넣어준다.
    const user = new User(req.body);
    
    user.save((err, user) => {
        if(err) return res.json({ success: false, err});
        return res.status(200).json({
            success: true
        })
    });
});

app.post('/api/users/login', (req, res) => {

    // 요청된 이메일이 데이터베이스에 있는지 찾는다.
    User.findOne({ email: req.body.email}, (err, user) => {
        if(!user) {
            return res.json({
                loginSuccess: false,
                message: '제공된 이메일에 해당하는 유저가 없습니다.'
            });
        }
        // 요청된 이메일이 디비에 있다면 비밀번호가 맞는 비밀번호인지 확인.
        user.comparePassword(req.body.password, (err, isMatch) => {
            if(!isMatch) return res.json({ loginSuccess: false, message: '비밀번호가 틀렸습니다.'});
            
            // 비밀번호까지 맞다면 토큰을 생성하기.
            user.generateToken((err, user) => {
                if(err) return res.status(400).send(err);
                // 토큰을 저장한다. 어디에? 쿠키, 로컬저장소 등등
                // 여기서는 쿠키에 저장
                res.cookie('x_auth', user.token)
                .status(200)
                .json({ loginSuccess: true, userId: user._id});
            });
        });
    });
});

// 미들웨어 - endpoint에서 리퀘스트를 받은 다음에 콜백펑션을 실행하기 전에 중간에서 머를 하는 거.
app.get('/api/users/auth', auth, (req, res) => {
    //여기 까지 미들웨어를 통과해 왔다는 얘기는 Authentication이 True라는 뜻
    res.status(200).json({
        _id: req.user._id,
        isAdmin: req.user.role === 0 ? false : true,
        isAuth: true,
        email: req.user.email,
        name: req.user.name,
        lastname: req.user.lastname,
        role: req.user.role,
        image: req.user.imgae
    });
});

app.get('/api/users/logout', auth, (req, res) => {
    User.findOneAndUpdate({_id: req.user._id},
        { token: ""},
        (err, user) => {
            if(err) return req.json({ success: false, err});
            return res.status(200).send({
                success: true
            });
        });
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}!`));