var express = require('express')
var url = require('url')
var router = express.Router();
const User = require('../models/users')
const Admin = require('../models/admin')
const multer = require('multer')
const fs = require('fs');
const users = require('../models/users');

 


router.get('/', (req, res) => {
    // res.render('admin/admin_login',{title:'Login page'})
    res.render('signin', { title: 'Login page' })

})

//---------------------------------------Admin page--------------------------------

router.get('/admin', (req, res) => {
    res.render('admin/admin_login')
})


//handle admin login

router.post('/admin_login', async (req, res) => {
    console.log('sdfsdfsdf');
    const { username, password } = req.body;
    console.log(username,password);
    const admin = await Admin.findOne({ name: username });
    console.log(admin);
    if (admin && await admin.isValidPassword(password)) {
        req.session.adminId = admin._id;
        return res.redirect('/admin_home');
    } else {
        res.redirect('/admin')
    }
})

//admin homepage  //display all users 
router.get('/admin_home', adminrequireLogin, async (req, res) => {
    //console.log('adminfsdfs',req.session.adminId);
    if (req.session.adminId) {
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
    } else {
        res.render('404')
    }
})


router.get('/logoutadmin',adminrequireLogin, (req, res) => {
    req.session.destroy(function (err) {
        if (err) {
            console.log(err)
            res.send("Error")
        } else {
            // res.render('signin',{logout:"logout successfully...!"}) 
            res.redirect('/admin?logout')
        }
    })
})


router.get('/add_users',adminrequireLogin, (req, res) => {
    res.render('admin/add_users')
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
router.post('/add_new', upload,adminrequireLogin, (req, res) => {
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
            res.redirect('/admin_home');
        })
        .catch((err) => {
            req.session.message = {
                type: 'danger',
                message: err.message
            };
            res.redirect('/admin_home');
        });
});

//--------edit User  page

router.get('/edit/:id',adminrequireLogin, (req, res) => {
    let id = req.params.id;
    User.findById(id)
        .then(user => {
            if (!user) {
                res.redirect('/admin');
            } else {
                res.render('admin/edit_users', {
                    title: 'Edit User',
                    user: user,
                });
            }
        })
        .catch(err => {
            console.error(err);
            res.redirect('/admin');
        });
})

//edit-user-route-----
router.post('/update/:id', upload,adminrequireLogin, (req, res) => {
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
        image: new_image, 
    };

    User.findByIdAndUpdate(id, updatedData, { new: true })
        .then(result => {
            req.session.message = {
                type: 'success',
                message: 'User updated successfully'
            };
            res.redirect('/admin_home');
        })
        .catch(err => {
            res.json({ message: err.message, type: 'danger' });
        });
})


//delete user-route

router.get('/delete/:id',adminrequireLogin, (req, res) => {
    let id = req.params.id;
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
            res.redirect("/admin_home");
        })
        .catch(err => {
            res.json({ message: err.message });
        });
})


//------------------------------------- User Page  ------------------------- 

//------------signup route
router.get('/signup', (req, res) => {
    res.render('signup')
})


router.post('/register_new', upload, (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email, 
        phone: req.body.phone, 
        image: req.file.filename,
        password: req.body.password,
    });

    user.save()
        .then(() => {
            res.redirect('/?newuser')
        })
        .catch((err) => {
            console.log(err)
            res.redirect('/');
        });
});


// ---------- user login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    //console.log(username,password);
    const user = await User.findOne({ name: username });
    //console.log(user);
    if (user && await user.isValidPassword(password)) {
        req.session.userId = user._id;
        return res.redirect('/homepage');
    } else {
        res.redirect('/?invalid')
    }
});


//---------user homepage 
router.get('/homepage', requireLogin, async (req, res) => {
    if (req.session.userId) {
        const user = await User.findOne({ _id: req.session.userId });
        console.log(user);
        res.render('users/dashboard', { user: user.name, email: user.email, phone: user.phone, image: user.image })
    } else {
        res.render('users/dashboard', { msg: "Unauthorized User" })
    }
})

//---------user logout
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



//----------------------------------------------------



// Middleware to protect userId routes
function requireLogin(req, res, next) {
    if (!req.session.userId) {
        res.redirect('/');
    } else {
        next();
    }
}

// Middleware to protect adminId routes
function adminrequireLogin(req, res, next) {
    //console.log(req.session.adminId);
    if (!req.session.adminId) {
        res.redirect('/admin');
    } else {
        next();
    }
}




router.get('*', (req, res) => {
    res.render('404')
})


module.exports = router;
