const Account = require('../models/account');
const risco = require('./risco');

const {check, body, validationResult, sanitizeBody} = require('express-validator');
//const {sanitizeBody} = require('express-validator/filter');

// Handle Account create on POST.
exports.account_create_post = function(req, res, next) {[
    // validate
    body('user', 'User must be specified').isLength({min: 1}).trim(),
    body('user_name', 'Username must be specified').isLength({min: 1}).trim(),
    body('password', 'Password must be specified').isLength({min: 1}).trim(),
    body('device_name', 'Device name must be specified').isLength({min: 1}).trim(),

    // sanetize
    sanitizeBody('user').trim().escape(),
    sanitizeBody('device_name').trim(),

    // process request
    async.waterfall([
        function(callback) {
            if (req.session.email) {
                User.findOne({ 'email': req.session.email }, function(err, user) {
                    callback(null, user);
                });
            } else {
                res.status(401)
                res.send("Unauthorized")
                return;
            }
        },
        async function(user, callback) {
            if (!user) {
                res.send({ title: 'Delete User', error: "User could not be found"});
                return;
            }

            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.send({ title: 'Create Account', errors: errors.array() })
            }
    
            updatedAccount = {
                user: user.id,
                user_name: req.body.user_name,
                password: req.body.password,
                additional_data: JSON.stringify(req.body.additional_data),
                device_name: req.body.device_name
            }
            
            const account = await Account.updateOne(
                {'user': user.id, 'device_name': req.body.device_name },
                updatedAccount,
                { upsert : true }
            );

            callback(null, { account: account })
        }
    ], function(err, results) {
        if (!results || !results.account) {
            res.send({ title: 'Create Account', error: "Could not create account."});
            return;
        }

        if (!results.account) {
            return res.send({ title: 'Create Account', errors: "Error while creating a device." });
        }

        return res.send({ title: 'Create Account', account: account });
    })
]};

// Display list of all Accounts.
exports.account_list = async function(req, res, next) {
    if (req.session.email === process.env.ADMIN_EMAIL) {
        // ADMIN
        Account.find()
        .sort([['account_type', 'ascending']])
        .exec(function(err, list_accounts) {
            if (err) { return next(err); }
            // successful
            res.send({ title: 'Account List', account_list: list_accounts });
        });
    }

    var user;
    if (req.session.email) {
        user = await User.findOne({ 'email': req.session.email });
    } else {
        res.status(401);
        res.send("Unauthorized");
        return;
    }

    Account.find({ 'user': user.id })
        .sort([['account_type', 'ascending']])
        .exec(function(err, list_accounts) {
            if (err) { return next(err); }
            // successful
            res.send({ title: 'Account List', account_list: list_accounts });
        });
};

// Handle Account delete on POST.
exports.account_delete_post = async function(req, res, next) {
    var user;
    if (req.session.email) {
        user = await User.findOne({ 'email': req.session.email });
    } else {
        res.status(401);
        res.send("Unauthorized");
        return;
    }

    Account.findByIdAndRemove(user.id, function(err) {
        if (err) { return next(err); }
        res.send({ title: 'Delete Account', account: req.body.id });
    });
};

// get the current state of the device
exports.account_get_state = async (req, res, next) => {
    if (req.session.email !== process.env.ADMIN_EMAIL) {
        res.status(401);
        res.send("Unauthorized");
        return;
    }

    // ADMIN
    Account.findById(req.body.device_id, async function(err, account) {
        if (err) { return next(err); }
        const riscoState = await risco.getState(null, account);
        if (!riscoState) {
            res.status(404);
            return res.send({ title: 'Get Device State', error: "Error while getting the device state" })
        }
        res.send({ title: 'Get Device State', state: riscoState });
    });
};

// set the state of the device
exports.account_set_state = async (req, res, next) => {
    if (req.session.email !== process.env.ADMIN_EMAIL) {
        res.status(401);
        res.send("Unauthorized");
        return;
    }

    // ADMIN
    Account.findById(req.body.device_id, async function(err, account) {
        if (err) { return next(err); }
        const riscoState = await risco.action(null, account, req.body.state);
        res.send({ title: 'Set Device State', state: riscoState });
    });
};