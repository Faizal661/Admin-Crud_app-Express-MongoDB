var express = require('express')
var url = require('url')
var router = express.Router();
const User = require('../models/users')
const multer = require('multer')
const fs = require('fs')


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



//insert new user into db
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


//display all users --
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

//edit Users-page---

router.get('/edit/:id', (req, res) => {
    let id = req.params.id;
    User.findById(id)
        .then(user => {
            if (!user) {
                res.redirect('/');
            } else {
                res.render('admin/edit_users', {
                    title: 'Edit User',
                    user: user,
                });
            }
        })
        .catch(err => {
            console.error(err);
            res.redirect('/');
        });
})

//edit-user-route-----
router.post('/update/:id', upload, (req, res) => {
    let id = req.params.id;
    let new_image = '';
    if (req.file) {
        new_image = req.file.filename;
        try {
            fs.unlinkSync('./uploads/' + req.body.old_image);
        } catch (err) {
            console.log(err)
        }
    } else {
        new_image = req.body.old_image;
    }

    const updatedData = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        image: new_image, // Make sure `new_image` is defined in your code
    };

    User.findByIdAndUpdate(id, updatedData, { new: true })
        .then(result => {
            req.session.message = {
                type: 'success',
                message: 'User updated successfully'
            };
            res.redirect('/');
        })
        .catch(err => {
            res.json({ message: err.message, type: 'danger' });
        });
})


//delete -user-route

router.get('/delete/:id',(req,res)=>{
    let id=req.params.id;
    User.findByIdAndDelete(id).exec()
        .then(result => {
            if (result && result.image) {
                return fs.promises.unlink("./uploads/" + result.image)
                    .catch(err => {
                        console.log("Failed to delete image file: ", err);
                    });
            }
        })
        .then(() => {
            req.session.message = {
                type: "info",
                message: "User deleted successfully!",
            };
            res.redirect("/");
        })
        .catch(err => {
            res.json({ message: err.message });
        });
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
