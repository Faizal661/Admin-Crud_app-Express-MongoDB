var express = require('express')
var url = require('url')
var router = express.Router();
const User = require('../models/users')
const multer = require('multer')


const credentials = {
    username: 'a',
    password: 's'
}


// router.get('/',(req,res)=>{
//     res.render('admin/home',{title:'Login page'})
//     // res.render('signin',{title:'Login page'})

// })

//-----------------Admin page------------

router.get('/add_users', (req, res) => {
    res.render('admin/add_users')
})

router.get('/logoutadmin', (req, res) => {
    res.render('signin')
})

//image upload
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
    },

})

var upload = multer({
    storage: storage,
}).single('image');

//insert an user into db
router.post('/add_new', upload, (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        image: req.file.filename,
        password: req.body.password,
    });

    user.save()
        .then(() => {
            req.session.message = {
                type: 'success',
                message: 'User added successfully!'
            };
            res.redirect('/');
        })
        .catch((err) => {
            req.session.message = {
                type: 'danger',
                message: err.message
            };
            res.redirect('/');
        });
});

//get all users --
router.get('/', (req, res) => {
    const data = User.find()
    User.find()
        .then((data) => {
            res.render('admin/home', {
                title: 'Home Page',
                users: data,

            })

        })
        .catch(() => {
            res.render('admin/home')
        })
})



//---------------------


//login
router.post('/login', (req, res) => {
    if (req.body.username == credentials.username && req.body.password == credentials.password) {
        req.session.user = req.body.username;
        res.redirect('/homepage')
    } else {
        //res.render('signin',{invalid:'Incorrect Usename and password'})
        res.redirect('/?invalid')
    }
});


// Middleware to protect routes
function requireLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect('/');
    } else {
        next();
    }
}

//blocking authorised user going back to loginpage
// function blockBackGoing(req,res,next){
//     if(req.session.user){
//         res.render('homepage',{user:req.session.user})
//     }
// }

//homepage 
router.get('/homepage', requireLogin, (req, res) => {
    if (req.session.user) {
        res.render('homepage', { user: req.session.user })
    } else {
        res.render('homepage', { msg: "Unauthorized User" })
    }
})

//logout
router.get('/logout', requireLogin, (req, res) => {
    req.session.destroy(function (err) {
        if (err) {
            console.log(err)
            res.send("Error")
        } else {
            // res.render('signin',{logout:"logout successfully...!"}) 
            res.redirect('/?logout')
        }
    })
})



router.get('*', (req, res) => {
    res.render('404')
})

module.exports = router;
