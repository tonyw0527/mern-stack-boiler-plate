const mongoose = require('mongoose');
const config = require('../config/dev');
// 암호화
const bcrypt = require('bcrypt');
const saltRounds = 10;
// jwt
const jwt = require('jsonwebtoken');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        maxlength: 50
    },
    email: {
        type: String,
        trim: true
    },
    password: {
        type: String,
        minlength: 5
    },
    role: {
        type: Number,
        default: 0
    },
    image: String,
    token: {
        type: String
    },
    tokenExp: {
        type: Number
    }
});

userSchema.pre('save', function( next ){
    var user = this;

    if (user.isModified('password')) {
        //save가 실행되기 전에 비밀번호를 암호화한다.
        bcrypt.genSalt(saltRounds, function(err, salt){
            if(err) return next(err);

            bcrypt.hash(user.password, salt, function(err, hash){
                if(err) return next(err);
                user.password = hash;
                next();
            })
        })
    } else {
        next();
    }
});

userSchema.methods.comparePassword = function(plainPassword, cb) {
    // plain password와 db에 있는 암호된 비밀번호롤 비교
    bcrypt.compare(plainPassword, this.password, function(err, isMatch){
        if(err) return cb(err);
        return cb(null, isMatch);
    });
};

userSchema.methods.generateToken = function(cb) {
    const user = this;
    
    // json web token을 이용해서 token을 생성하기.
    const token = jwt.sign(user._id.toHexString(), config.jwtSecret);

    user.token = token;
    user.save(function(err, user){
        if(err) return cb(err);
        cb(null, user);
    });
};

userSchema.statics.findByToken = function (token, cb) {
    const user = this;

    // 토큰을 decode 한다.
    jwt.verify(token, config.jwtSecret, function(err, decoded) {
        // 유저 아이디를 이용해서 유저를 찾은 다음에
        // 클라이언트에서 가져온 token과 DB에 보관된 토큰이 일치하는지 확인

        user.findOne({"_id": decoded, "token": token}, function(err, user){
            if(err) return cb(err);
            cb(null, user);
        });
    })
}

const User = mongoose.model('User', userSchema);

module.exports = { User }