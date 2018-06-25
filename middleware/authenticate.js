const auth_mdlwr = function auth_mdlwr() {
    return (req, res, next) => {
        // console.log(`
        // req.session.passport.user : ${JSON.stringify(req.session.passport)}
        // `);
        if (req.isAuthenticated()) return next();
        res.redirect('/login');
    }
}
module.exports = {auth_mdlwr};