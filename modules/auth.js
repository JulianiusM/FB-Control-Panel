//Authentication module class with auth methods
module.exports = class Auth {
    constructor(clients) {
        this.dbClient = clients.getDbExecutor();
        this.bcrypt = clients.getBcrypt();
        this.renderer = clients.getRenderer();
    }

    /*-----------[LOGIN]----------*/

    showLogin(req, res) {
        //Only not authenticated users can log in
        if (this.checkNotAuthed(res, req.session.user)) {
            return;
        }

        this.renderer.render(res, "login");
    }

    login(req, res) {
        let user = req.body.username;
        let pass = req.body.password;
        let self = this;

        //check if fields are valid
        if (!this.checkFields(user, undefined, pass, "", false, false, res)) {
            return;
        }

        //Query DB for users with same username
        this.dbClient.getUsersByNameWithError(user, res, "login", {
            username: user
        }, function (dbResponse) {
            //Test if username is not found, but do not communicate it clearly (security concerns)
            if (dbResponse.rows.length == 0) {
                self.renderer.renderWithErrorData(res, "login", "Username and password do not match!", {
                    username: user
                });
                return;
            }

            //Compare encrypted passwords
            self.bcrypt.compare(pass, dbResponse.rows[0].password, function (error, result) {
                //Treat error
                if (error) {
                    self.treatBcryptError(res, "login", error, {
                        username: user
                    });
                    return;
                }

                //If successful, show logged in info
                if (result) {
                    req.session.userID = dbResponse.rows[0].id;
                    req.session.user = dbResponse.rows[0].username;
                    self.renderer.renderSuccessData(res, "Successfully logged in!", {
                        navUser: req.session.user
                    });
                    return;
                }

                //Passwords do not match, but do not communicate it clearly (security concerns)
                self.renderer.renderWithErrorData(res, "login", "Username and password do not match!", {
                    username: user
                });
            });
        });
    }

    /*-----------[REGISTER]----------*/

    showRegister(req, res) {
        //Only not authenticated users can register
        if (this.checkNotAuthed(res, req.session.user)) {
            return;
        }

        this.renderer.render(res, "register");
    }

    register(req, res) {
        let user = req.body.username;
        let pass = req.body.password;
        let repeatPass = req.body.password_repeat;
        let self = this;

        //Check if fields are valid
        if (!this.checkFields(user, undefined, pass, repeatPass, true, false, res)) {
            return;
        }

        //Query DB to find out if username is already taken
        this.dbClient.getUsersByNameWithError(user, res, "register", {
            username: user
        }, function (dbResponse) {
            //Username is not free, communicate as error
            if (dbResponse.rows.length != 0) {
                self.renderer.renderWithError(res, "register", "Username already taken");
                return;
            }

            //Hash password
            self.bcrypt.hash(pass, 10, function (error, hash) {
                //Treat error
                if (error) {
                    self.treatBcryptError(res, "profile", error, {
                        username: user
                    });
                    return;
                }

                //Store hashed password and username in DB
                self.dbClient.queryWithError('INSERT INTO "users" ("username", "password") VALUES ($1, $2)', [user, hash], res, "register", {
                    username: user
                }, function (dbResult) {
                    //Show success on registration page
                    self.renderer.renderWithSuccess(res, "register", "Registration successful! You can now log in!");
                    return;
                });
            });
        });
    }

    /*-----------[LOGOUT]----------*/

    logout(req, res) {
        let session = req.session;

        //Only authenticated users can log out
        if (session.userID) {
            session.destroy();
            this.renderer.renderSuccess(res, "Successfully logged out!");
            return;
        }

        this.renderer.renderInfo(res, "Not logged in!");
    }

    /*-----------[PROFILE]----------*/

    showProfile(req, res) {
        let session = req.session;
        let self = this;

        //Only authenticated users can show profile
        if (session.userID) {
            this.dbClient.getUsersWithError(session.userID, res, "message", {
                navUser: session.user
            }, function (dbResponse) {
                //See if dataset is distinct
                if (dbResponse.rows.length != 1) {
                    self.renderer.renderError(res, "An unexpected error occured!");
                    return;
                }

                //Render profile
                self.renderer.renderWithData(res, "profile", {
                    user: dbResponse.rows[0],
                    navUser: session.user
                });
            });
            return;
        }

        this.renderer.renderInfo(res, "Not logged in!");
    }

    processProfileSubmit(req, res) {
        let session = req.session;
        let pass = req.body.oldPassword;
        let newPass = req.body.newPassword;
        let newPassRepeat = req.body.newPasswordRepeat;
        let request = req.body.request;
        let self = this;

        //Only authenticated users can process profile
        if (session.userID) {
            this.dbClient.getUsersWithError(session.userID, res, "message", {
                navUser: session.user
            }, function (dbResponse) {
                //See if dataset is distinct
                if (dbResponse.rows.length != 1) {
                    self.renderer.renderError(res, "An unexpected error occured!");
                    return;
                }

                //Process data
                if (request === "changePassword") {
                    //Test input
                    if (!this.checkFields("not_req", session.user, newPass, newPassRepeat, false, true, res)) {
                        return;
                    }

                    console.log(pass, dbResponse.rows[0]);
                    self.bcrypt.compare(pass, dbResponse.rows[0].password, function (error, result) {
                        //Treat error
                        if (error) {
                            self.treatBcryptError(res, "profile", error, {
                                user: dbResponse.rows[0],
                                navUser: session.user
                            });
                            return;
                        }

                        //Compare was successfull
                        if (result) {
                            self.bcrypt.hash(newPass, 10, function (error1, hash) {
                                //Treat error
                                if (error1) {
                                    self.treatBcryptError(res, "profile", error, {
                                        user: dbResponse.rows[0],
                                        navUser: session.user
                                    });
                                    return;
                                }

                                //Update password in database
                                self.dbClient.queryWithError('UPDATE "users" SET "password"=$1 WHERE "id"=$2', [hash, session.userID], res, "profile", {
                                    user: dbResponse.rows[0],
                                    navUser: session.user
                                }, function (dbResponse1) {
                                    if (dbResponse1.rowCount > 0) {
                                        self.renderer.renderWithInfoData(res, "profile", "Password successfully changed!", {
                                            user: dbResponse.rows[0],
                                            navUser: session.user
                                        });
                                        return;
                                    }

                                    self.renderer.renderWithErrorData(res, "profile", "An unexpected error occured while changing passwords!", {
                                        user: dbResponse.rows[0],
                                        navUser: session.user
                                    });
                                });
                            });
                            return;
                        }

                        //Old password is wrong
                        self.renderer.renderWithErrorData(res, "profile", "Old password does not match!", {
                            user: dbResponse.rows[0],
                            navUser: session.user
                        });
                    });
                } else if (request === "delete") {
                    self.dbClient.queryWithError('DELETE FROM "users" WHERE "id"=$1', [session.userID], res, "message", undefined, function (dbResponse1) {
                        if (dbResponse1.rowCount > 0) {
                            session.destroy();
                            self.renderer.renderSuccess(res, "Account successfully deleted!");
                            return;
                        }

                        self.renderer.renderWithErrorData(res, "profile", "An unexpected error occured whilest deleting account!", {
                            user: dbResponse.rows[0],
                            navUser: session.user
                        });
                    });
                }
            });
        }
    }

    /*-----------[CHECK]----------*/

    checkFields(user, navUser, pass, repeatPass, isRegister, isProfile, res) {
        let page = isRegister ? "register" : (isProfile ? "profile" : "login");

        //Username is empty, communicate as error
        if (user == "") {
            this.renderer.renderWithErrorData(res, page, "Username cannot be empty!", {
                username: user,
                navUser: navUser
            });
            return false;
        }

        //Password is empty, communicate as error
        if (pass == "") {
            this.renderer.renderWithErrorData(res, page, "Password cannot be empty!", {
                username: user,
                navUser: navUser
            });
            return false;
        }

        if (isRegister || isProfile) {
            //Password does not meet requirements
            if (!(pass.length >= 8 && /[a-z,A-Z]/g.test(pass) && /\d/g.test(pass))) {
                this.renderer.renderWithErrorData(res, page, "Password does not meet requirements!", {
                    username: user,
                    navUser: navUser
                });
                return false;
            }

            //Password and repeated password do not match, communicate as error
            if (pass != repeatPass) {
                this.renderer.renderWithErrorData(res, page, "Passwords do not match!", {
                    username: user,
                    navUser: navUser
                });
                return false;
            }
        }

        return true;
    }

    checkNotAuthed(res, user) {
        if (user) {
            this.renderer.renderInfoData(res, "Already logged in!", {
                navUser: user
            });
            return true;
        }

        return false;
    }

    treatBcryptError(res, page, error, data) {
        console.log(error);
        this.renderer.renderWithErrorData(res, page, "Encryption error", data);
    }
}
