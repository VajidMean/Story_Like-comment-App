const express = require('express');
const router = express.Router();
const { User } = require('../models/user');
const { Story } = require('../models/story');
const _ = require('lodash');
const expressValidator = require('express-validator');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const passport = require('passport');
const middleware = require('../middleware/authenticate');
const ObjectId = require('mongodb').ObjectID;


// comman api
router.get('/', (req, res) => {
    let current_user = req.user;
    let isauth_user = req.isAuthenticated();
    res.render('home', { title: "home", c_user: current_user, auth_user: isauth_user });
});
router.get('/registration', (req, res) => {
    if (!req.isAuthenticated()) {
        res.render('registration', { title: "Registration" });
    } else {
        res.redirect('/profile');
    }

});

router.post('/registration', (req, res) => {
    req.checkBody('username', 'username Field must not be empty !').notEmpty();
    // req.checkBody('username', 'User name must between 4 to 15 character long!').len(4, 15);
    req.checkBody('email', 'The email you entered is not valid !').isEmail();
    req.checkBody('password', 'Password must be between 4 to 25 character !').len(4, 10);
    // req.checkBody("password","Password must include One lowercase , one uppercase, a number, and a special character !").matches(/^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/,"i");
    req.checkBody('confirm_password', 'password not same').equals(req.body.password);
    const err = req.validationErrors();
    if (err) {
        res.render('registration', { title: "Registration ERROR", error: err, userData: req.body });
    } else {
        bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
            let user = new User({
                username: req.body.username,
                email: req.body.email,
                password: hash
            });
            user.save().then((user) => {
                const userID = user._id;
                req.login(userID, () => {
                    res.redirect('/profile');
                });
            }, (e) => {
                res.render("error", { error: e })
            })
        });
    }
});

router.get('/login', (req, res) => {
    if (!req.isAuthenticated()) {
        res.render("login", { title: "Login", message: req.flash('blockedMsg') })
    } else {
        res.redirect('/profile');
    }

});
router.post('/login', (req, res) => {
    console.log(req.body);
    User.findOne({ email: req.body.email }).then((user) => {
        if (!user) {
            res.render("login", { email_err: "wrong email", title: "Login" });

        } else {
            bcrypt.compare(req.body.password, user.password, (err, result) => {
                if (result) {
                    if (user.isblocked) {
                        req.flash('blockedMsg', 'You are blocked by admin !');
                        res.redirect("login");
                        return;
                    }
                    req.login(user._id, () => {
                        req.flash('info', 'Login successfull !')
                        res.redirect('/profile');

                    });
                } else {
                    console.log("wrong password ");
                    res.render("login", { pass_err: "wrong password", title: "Login", entered_email: req.body.email });
                }
            })
        }
    });
});
router.get('/profile', middleware.auth_mdlwr(), (req, res) => {

    if (req.user.isadmin) {
        res.render("adminDashbord", { title: "Profile Page", auth_user: req.isAuthenticated(), user: req.user, message: req.flash('info') })
    } else {
        res.render("userDashbord", { title: "Profile Page", auth_user: req.isAuthenticated(), user: req.user, message: req.flash('info') })
    }

});


// admin api
router.get('/admindashbord', (req, res) => {
    res.render("adminDashbord");
})
router.get('/adminUser', async (req, res, next) => {
    try {
        let uCount = 0
        const countUsers = await User.count({ isadmin: false }).then((count) => {
            uCount = count;
        });
        const totalUsers = await User.find({ isadmin: false }).then((users) => {
            res.render("adminUsers", {
                title: "User Page", auth_user: req.isAuthenticated(),
                user: req.user, message: req.flash('info'), userCount: uCount, userDetail: users
            })
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' })
    }


})
router.get("/blockuser/:id", (req, res) => {
    let id = req.params.id;
    User.findByIdAndUpdate({ _id: id }, { $set: { isblocked: true } }, { new: true }).then((user) => {
        res.redirect("/adminuser")
    }, (e) => {
        res.send(e);
    })
});
router.get("/unblockuser/:id", (req, res) => {
    let id = req.params.id;
    User.findByIdAndUpdate({ _id: id }, { $set: { isblocked: false } }, { new: true }).then((user) => {
        res.redirect("/adminuser")
    }, (e) => {
        res.send(e);
    })
});
router.get("/deleteuser/:id", (req, res) => {
    let id = req.params.id;
    User.findOneAndRemove({ _id: id }).then((user) => {
        res.redirect("/adminuser")
    }, (e) => {
        res.send(e);
    })
});
router.get("/updateuser/:id", (req, res) => {
    let id = req.params.id;
    User.findOne({ _id: id }).then((user) => {
        res.render("Adminupdateuser", { "title": "UpdateUser", "username": user.username, "user_email": user.email, "user_pass": user.password, "_id": user._id });
    }, (e) => {
        res.send(e);
    })
});

router.post("/updateUser", (req, res) => {
    let u_body = _.pick(req.body, ['username', 'email']);
    User.findOneAndUpdate({ _id: req.body.hidden_id }, { $set: u_body }, { new: true }).then((user) => {
        res.redirect("/adminuser")
    }, (e) => {
        res.send(e);
    })

});
router.get('/adminStorydlt/:id', (req, res) => {
    let id = req.params.id;
    Story.findOneAndRemove({ _id: id }).then((result) => {
        if (result) {
            res.redirect('/adminstories')
        }
    });
})
router.get('/adminstories', async (req, res, next) => {
    try {
        let privateCount = 0;
        let publicCount = 0;
        let privateStories, publicStories;

        const privateStory = await Story.count({ type: "private" }).then((count) => {
            privateCount = count;
        });
        const publicStory = await Story.count({ type: "public" }).then((count) => {
            publicCount = count;
        });


        const totalprivateStory = await Story.find({ type: "private" }).then((stories) => {
            privateStories = stories;
        })

        const totalPublicStory = await Story.find({ type: "public" }).then((stories) => {

            res.render("adminStories", {
                title: "AdminStory Page", auth_user: req.isAuthenticated(),
                user: req.user, message: req.flash('info'),
                privateCount: privateCount, publicCount: publicCount, privateStories: privateStories, publicStories: stories
            })
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' })
    }



    // res.render("adminStories", { title: "Story Page", auth_user: req.isAuthenticated(), user: req.user, message: req.flash('info') })
})


// user api
router.get('/mystory', async (req, res, next) => {
    try {
        let storyCount = 0
        const countStory = await Story.count({ _creator: req.user._id }).then((count) => {
            storyCount = count;
        });
        const totalStory = await Story.find({ _creator: req.user._id }).then((stories) => {
            res.render("myStory", {
                title: "mystory Page", auth_user: req.isAuthenticated(),
                user: req.user, message: req.flash('info'), storyMessage: req.flash('newStory'), storyCount: storyCount, myStory: stories
            })
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' })
    }

})
router.get('/publicStories', async (req, res, next) => {
    try {
        let pStoryCount = 0
        const countPublicStory = await Story.count({ $and: [{ type: "public" }, { _creator: { $ne: req.user._id } }] }).then((count) => {
            pStoryCount = count;
        });

        const totalPublicStory = await Story.find({ $and: [{ type: "public" }, { _creator: { $ne: req.user._id } }] }).then((allStories) => {

            res.render("publicStories", {
                title: "publicStories Page", auth_user: req.isAuthenticated(),
                user: req.user, message: req.flash('info'), storyCount: pStoryCount, allStories: allStories, userID: req.user._id,
                cmntmsg: req.flash('cmntMSG')
            })
        })
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' })
    }

    // res.render("publicStories",{user:req.user});
});
router.get('/createStory', (req, res) => {
    res.render("createStory", { user: req.user });
});

router.post('/newStory', (req, res) => {
    console.log(req.body);
    let userID = req.body.userID
    let story_type;
    if (!req.body.checkbox) {
        story_type = "public";
    } else {
        story_type = "private";
    }

    let story = new Story({
        storyText: req.body.storyText,
        type: story_type,
        _creator: userID,
        _creatorName: req.body.creatorName
    })
    story.save().then((story) => {
        req.flash('newStory', 'Your Story is Posted .!')
        res.redirect('/mystory');
    }, (e) => {
        res.send(e);
    })

})

router.get('/likeStory/:id', async (req, res, next) => {
    let id = req.params.id;
    let likeByUserID = req.user._id;
    let likeByUserName = req.user.name;

    const findUserlike = await Story.findOne({ _id: id }).then((story) => {
        let StoryLiked = story.likeby.indexOf(likeByUserID);

        if (StoryLiked >= 0) {
            // console.log("liked by this user");
            Story.findOneAndUpdate(
                { _id: id },
                { $pull: { likeby: likeByUserID }, $inc: { likes: -1 } },
                { new: true }
            ).then((user) => {
                res.redirect("/publicStories")
            }, (e) => {
                res.send(e);
            })
            return
        } else {
            // console.log("not liked by this user");
            Story.findOneAndUpdate(
                { _id: id },
                { $push: { likeby: likeByUserID }, $inc: { likes: 1 } },
                { new: true }
            ).then((user) => {
                res.redirect("/publicStories");
            }, (e) => {
                res.send(e);
            })
            return
        }
        console.log("story not found");

    });

})
router.get('/deleteStory/:id', (req, res) => {
    let storyId = req.params.id;
    Story.findOneAndRemove({ _id: storyId }).then((story) => {
        res.redirect('/mystory');
    }, (e) => {
        res.send(e);
    })
})
router.get('/updateStory/:id', (req, res) => {
    let id = req.params.id;
    Story.findOne({ _id: id }).then((story) => {
        let isPrivate = false
        if (story.type === "private") {
            isPrivate = true
        }
        res.render("updateStory", { story: story, auth_user: req.isAuthenticated(), type: isPrivate })
    })
});
router.post('/updateStory', (req, res) => {
    console.log(req.body);
    let story_type;
    if (!req.body.checkbox) {
        story_type = "public";
    } else {
        story_type = "private";
    }
    Story.findOneAndUpdate({ _id: req.body.storyId }, { $set: { storyText: req.body.storyText, type: story_type } }, { new: true }).then((story) => {
        if (story) {
            res.redirect("mystory");
            return
        }
        res.send("story not updated")
    }, (e) => {
        res.send(e);
    })
})

router.get('/comment/:id', (req, res) => {
    // res.send(`called  ${req.params.id}`);
    let id = req.params.id;
    // console.log(id);
    Story.findOne({ _id: id }).then((story) => {
        if (story) {
            res.render("comment", { story: story, auth_user: req.isAuthenticated(), user: req.user, cmntMsg: req.flash('cmntMSG') });
            return
        }
        res.send("Story not found");
    })
})

router.post('/addnewComment', (req, res) => {
    // let commentBody = _.pick(req.body['commentorId','commentText','commentorName']);
    let commentDate = new Date();
    Story.findOneAndUpdate(
        { _id: req.body.storyID },
        {
            $push:
                {
                    comment: {
                        commentorId: req.body.commentorId,
                        commentText: req.body.commentText,
                        commentorName: req.body.commentorName,
                        commentDate: commentDate
                    }
                },
            $inc: { commentCount: 1 }
        },
        { new: true }
    ).then((story) => {
        if (story) {
            req.flash('cmntMSG', 'Your Comment posted !');
            res.redirect('back');
            return
        }
        res.send("Comment post api error");
    })
    // res.send(req.body);    
});
router.get('/mystorycomment/:id', (req, res) => {
    let id = req.params.id;
    // console.log(id);
    Story.findOne({ _id: id }).then((story) => {
        if (story) {
            res.render("mystorycomment", { story: story, auth_user: req.isAuthenticated(), user: req.user, cmndltMsg: req.flash('cmntdlt') });
            return
        }
        res.send("Story not found");
    })
})
router.get('/admincomment/:id', (req, res) => {
    let id = req.params.id;
    // console.log(id);
    Story.findOne({ _id: id }).then((story) => {
        if (story) {
            res.render("admincomment", { story: story, auth_user: req.isAuthenticated(), user: req.user, cmndltMsg: req.flash('cmntdlt') });
            return
        }
        res.send("Story not found");
    })
})

router.get('/deleteCmnt/:id', async (req, res, next) => {

    let id = req.params.id;
    let storyId;
    let getStoryId = await Story.findOne({ 'comment._id': id }).then((story) => {
        if (story) {
            storyId = story._id;
            return
        }
        res.send("Story not found for given commentId");
    });

    let updateStory = await Story.update({ _id: storyId },
        { $pull: { comment: { _id: ObjectId(id) } }, $inc: { commentCount: -1 } },
        { new: true }).then((result) => {
            if (result) {
                req.flash('cmntdlt', 'Comment deleted !')
                res.redirect('back');
                return
            }
            res.send("error in comment delete logic");
        })
    // res.send(id);
})


// comman api
router.post('/checkname', (req, res) => {
    if (req.body.username) {
        let name = req.body.username;
        User.findOne({ username: name }).then((user) => {
            res.send(user)
        })
    }
});
router.post('/checkMail', (req, res) => {

    if (req.body.email) {
        let uEmail = req.body.email;
        User.findOne({ email: uEmail }).then((user) => {
            res.send(user)
        })
    }
})
router.get('/logout', (req, res) => {
    req.logout();
    req.session.destroy();
    res.redirect('/');
})

router.post('/cmnt', (req, res) => {
    // let body = req.body;
    if (req.body.demo) {
        res.send(body)
    } else {
        res.send("body not found")
    }
})

//Authentication functions
passport.serializeUser(function (userID, done) {
    done(null, userID);
});

passport.deserializeUser(function (userID, done) {
    User.findById(userID, function (err, userID) {
        done(err, userID);
    });
});

router.get('/table', (req, res) => {
    res.render("table");
})

module.exports = router;