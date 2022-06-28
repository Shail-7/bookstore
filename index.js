const express = require("express");
const app = express();
const hbs = require("hbs");
const path = require("path");
const mysql = require('./connection').con;
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');

const partialsPath = path.join(__dirname, 'views/partials');
console.log(partialsPath);

// Setting the view engine
app.set("view engine", "hbs");

// body parser
app.use(bodyParser.urlencoded({ extended: true }));

// Session and Cookie-parser 
app.use(cookieParser());
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    // cookie: { secure: true }
}));

// Partials
hbs.registerPartials(partialsPath);

//registering helpers
hbs.handlebars.registerHelper('multiply', function (a, b) {
    return a * b;
})

hbs.handlebars.registerHelper('comparefb', function (a, opts) {
    if (a == null) {
        console.log("In if")
        return opts.fn(this);
    } else {
        console.log("In else")
        return opts.inverse(this);
    }
});

hbs.handlebars.registerHelper('viewfb', function (a, opts) {
    if (a != null) {
        console.log("In if")
        return opts.fn(this);
    } else {
        console.log("In else")
        return opts.inverse(this);
    }
});


// Routing 

const getAllData = (page, req, res) => {
    const selQry = "select * from books_table";
    mysql.query(selQry, [], (err, results) => {
        if (err) {
            console.log(err);
            res.redirect(page);
        } else {
            if (results != "") {
                res.render(page, { results: results });
            }
            else {
                res.render(page, { msg: "No Books to Read!" });
            }
        }
    })
}

app.get("/", (req, res) => {
    // res.render("home");
    getAllData('home', req, res);

});
app.get("/register", (req, res) => {
    res.render("registrationform");
})
app.get("/login", (req, res) => {
    if (req.session.useremail) {
        console.log(`login ${req.session.useremail}`);
        if (req.session.userType == 'admin') {
            res.redirect("admin")
        } else if (res.session.userType == 'user') {
            res.redirect("user");
        }
    } else {
        res.render("login")
    }
})

app.post("/logindata", (req, res) => {
    // res.send(req.body.email);
    selQry = "select * from user_tbl where user_email=?";
    mysql.query(selQry, [req.body.email], (err, results) => {


        if (err) {
            console.log(err);
            throw err;
        } else {
            if (results == "") {
                res.render("login", { invaliduser: true });
            } else {


                bcrypt.compare(req.body.password, results[0].user_password, (err, result) => {
                    if (err) {
                        console.log(err);
                        res.render('login', { invaliduser: true });
                    } else {
                        console.log(`Compare:${result}`);

                        if (result == true) {
                            //Setting session Data.
                            req.session.useremail = results[0].user_email;
                            req.session.userType = results[0].user_type;
                            req.session.username = results[0].user_name;
                            req.session.userid = results[0].user_id;
                            req.session.userphone = results[0].user_phone;
                            req.session.useraddress = results[0].user_address;
                            req.session.save();
                            console.log(`.....${req.session.useremail}`);
                            // res.send("Login Successful!")
                            // console.log(results[0].)
                            if (results[0].user_type == 'admin') {
                                res.redirect("admin");
                            } else if (results[0].user_type == 'user') {
                                res.redirect("user");
                            }
                        } else {
                            res.render('login', { invaliduser: true });
                        }
                    }
                });
            }
        }
    })
})

const checkSessionAdmin = (page, req, res) => {
    if (req.session.useremail) {
        getAllData(page, req, res);
        // res.render(page);
    } else {
        // console.log("blah")
        res.render('login');
    }
}

app.get('/admin/createbook', (req, res) => {
    // res.render('createbook');
    checkSessionAdmin('createbook', req, res);
});

app.get('/admin', (req, res) => {
    console.log(`-----${req.session.useremail}`);
    if (req.session.userType) {
        if (req.session.userType == 'admin') {
            checkSessionAdmin('admin', req, res);
        } else {
            res.render('login');
        }
    } else {
        res.render('login')
    }
})

app.post('/addbook', (req, res) => {
    // res.send(req.body.booktitle);
    let insQry = "insert into books_table(books_title,books_genre,books_author,books_year,books_desc,books_cover,books_isbn,books_pages,books_price) values(?,?,?,?,?,?,?,?,?)";

    // res.send(req.body.bookyear);
    mysql.query(insQry, [req.body.booktitle, req.body.bookgenre, req.body.bookauthor, req.body.bookyear, req.body.bookdesc, req.body.bookcover, req.body.bookisbn, req.body.bookpages, req.body.bookprice], (err, results) => {
        if (err) {
            console.log(err);
            res.redirect('admin')
            throw err;
        } else {
            console.log("Insertion success");
            res.redirect('admin');
        }
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/')
})

app.get('/bookdetails', (req, res) => {

    const selQry = "select * from books_table where books_id=?";
    // res.send(req.query.bid);
    mysql.query(selQry, [req.query.bid], (err, results) => {
        // req.query.favmsgf = true;
        if (err) {
            console.log(err);
            getAllData(req, res);
            throw err;
        }
        else {
            if (results != "") {
                if (req.query.usertype == 'home') {
                    res.render('bookdetails', { results: results, home: true });
                } else if (req.query.usertype == 'user') {

                    if (req.session.username) {
                        var favMsgT, favMsgF;
                        let selQry = "select * from favourite_table where fav_user_id=? and fav_book_id=?";
                        mysql.query(selQry, [req.session.userid, req.query.bid], (error, result) => {

                            if (error) {
                                throw error;
                            } else {
                                if (result == "") {
                                    // [favMsgT] = true;
                                    res.render('bookdetails', { results: results, user: true, bid: req.query.bid, favmsgt: false, favmsgf: true });

                                    console.log("In if");
                                    // let insQry = "insert into favourite_table(fav_user_id,fav_book_id) values(?,?)";
                                    // mysql.query(insQry, [req.session.userid, req.query.bid], (err, results) => {

                                    //     if (err) {
                                    //         throw err;
                                    //     } else {
                                    //         console.log("Favourite tbl insertion success");
                                    //         favMsgT = true;
                                    //         // res.redirect(`/bookdetails?bid=${req.query.bid}&usertype=user&favmsgt=${true}`);
                                    //     }
                                    // })
                                } else {
                                    // [favMsgF] = true;
                                    console.log("in else")
                                    res.render('bookdetails', { results: results, user: true, bid: req.query.bid, favmsgt: true, favmsgf: false });
                                    // let delQry = "delete from favourite_table where fav_user_id=? and fav_book_id=?";
                                    // mysql.query(delQry, [req.session.userid, req.query.bid], (err, results) => {
                                    //     if (err) {
                                    //         throw err;
                                    //     } else {
                                    //         favMsgF = true;
                                    //         // res.redirect(`/bookdetails?bid=${req.query.bid}&usertype=user&favmsgf=${true}`);
                                    //     }
                                    // })
                                }
                            }
                        })

                        console.log(`favMsgT: ${favMsgT} favMsgF: ${favMsgF}`);
                    } else {
                        res.redirect('/login')
                    }
                } else if (req.query.usertype == 'admin') {
                    if (req.session.username) {
                        res.render('bookdetails', { results: results, admin: true })
                    } else {
                        res.redirect('/login');
                    }
                }
            } else {
                console.log('No data found');
                getAllData(req, res);
            }
        }
    });

    // res.render('bookdetails');
});

const searchFn = (page, req, res) => {
    const selQry = "select * from books_table where books_title like ? or books_genre like ? or books_author like ? or books_isbn like ?";
    mysql.query(selQry, [`%${req.query.searchbox}%`, `%${req.query.searchbox}%`, `%${req.query.searchbox}%`, `%${req.query.searchbox}%`], (err, results) => {
        if (err) {
            console.log(err);
            console.log('Error in searching');
            throw err;
        } else {
            if (results != "") {
                // res.send(results);
                res.render(page, { results: results, backHome: true });
            } else {
                res.render(page, { noresults: true, backHome: true });
            }
        }
    })
}

app.get('/search', (req, res) => {
    if (req.query.user == 'home') {
        searchFn(`home`, req, res);
    } else if (req.query.user == 'admin') {
        // res.send('hi');
        searchFn('admin', req, res);
    } else if (req.query.user == 'user') {
        // res.send('hi');
        searchFn('user', req, res);
    }
})

app.post('/adduser', (req, res) => {

    const insQry = 'insert into user_tbl(user_name,user_email,user_password,user_type,user_phone,user_address) values(?,?,?,?,?,?)';

    // Encrypting Password
    const encryption = async () => {

        await bcrypt.hash(req.body.password, 12, function (err, hash) {

            if (err) {
                console.log(err);
                throw err;
            } else {
                console.log(hash.length);
                // return hash;
                mysql.query(insQry, [req.body.username, req.body.email, hash, 'user', req.body.phone, req.body.address], (err, results) => {
                    if (err) {
                        console.log(err);
                        console.log("Error in adding the user");
                        throw err;
                    } else {
                        console.log("User Insertion Success");
                        // res.send('insertion success')
                        res.redirect('/user');
                    }
                });
            }
        });
    }
    encryption();
    // var encryptedPassword = encryption();
    // console.log(`hash ${encryptedPassword}`);



    // mysql.query(insQry, [req.body.username, req.body.email, encryptedPassword, 'user', req.body.phone, req.body.address], (err, results) => {
    //     if (err) {
    //         console.log(err);
    //         console.log("Error in adding the user");
    //         throw err;
    //     } else {
    //         console.log("User Insertion Success");
    //         // res.send('insertion success')
    //         res.redirect('/user');
    //     }
    // });
})

app.get('/user', (req, res) => {
    if (req.session.userType) {
        if (req.session.userType == 'user') {
            checkSessionAdmin('user', req, res);
        } else {
            res.render('login');
        }
    } else {
        res.redirect('login');
    }
})


app.get('/addtocart', (req, res) => {
    if (req.session.useremail) {
        const selQry = "select * from cart_table where cart_user_id=? and cart_book_id=?";

        mysql.query(selQry, [req.session.userid, req.query.bookid], (error, result) => {

            if (error) {
                console.log(error);
                console.log("Error in getting user's same book data from cart");
                throw error;
            } else {
                if (result != "") {
                    let cartQty = result[0].cart_qty + 1;
                    const insQry = "update cart_table set cart_user_id=?,cart_book_id=?,cart_qty=? where cart_id=?";
                    mysql.query(insQry, [req.session.userid, req.query.bookid, cartQty, result[0].cart_id], (err, results) => {
                        if (err) {
                            console.log(err);
                            console.log("Error in inserting the item in cart");
                        } else {
                            res.redirect('/cart');
                        }
                    })

                } else {
                    const insQry = "insert into cart_table(cart_user_id,cart_book_id,cart_qty) values(?,?,?)";
                    mysql.query(insQry, [req.session.userid, req.query.bookid, 1], (err, results) => {
                        if (err) {
                            console.log(err);
                            console.log("Error in inserting the item in cart");
                        } else {
                            res.redirect('/cart');
                        }
                    });
                }
            }
        })

    } else {
        // res.send('oops! Login again');
        res.render('/login');
    }
    // res.send(req.session.useremail);
    // console.log(req.session.useremail)
})
app.get('/cart', (req, res) => {
    if (req.session.userid) {

        const selQry = 'select * from cart_table where cart_user_id=?';
        mysql.query(selQry, [req.session.userid], (err, results) => {
            if (err) {
                console.log(err);
                console.log('Error in displaying cart data');
                throw err;
            } else {
                if (results != "") {
                    let qry = "select * from books_table b, cart_table c WHERE b.books_id=c.cart_book_id AND c.cart_user_id=?";
                    mysql.query(qry, [req.session.userid], (err, result) => {
                        if (err) {
                            console.log(err);
                            console.log("Unable to retrive user books");
                            throw err;
                        } else {
                            if (result != "") {
                                let totalPrice = 0;
                                let totalQty = 0;
                                for (i = 0; i < result.length; i++) {
                                    totalPrice += result[i].books_price * result[i].cart_qty;
                                    totalQty += result[i].cart_qty;
                                }
                                console.log(totalPrice);
                                res.render('cart', { result: result, totalPrice: totalPrice, totalQty: totalQty });
                            } else {
                                console.log("No data found in books tbl for user cart");
                                res.render('user');
                            }
                        }
                    })

                    // res.render('cart', { results: results });

                } else {
                    res.render('cart', { msg: true })
                }
            }
        })
    } else {
        res.render('login');

    }
    // res.render('cart');
})

app.get('/delcartitem', (req, res) => {
    // res.send(req.body.cartid);
    const delQry = "delete from cart_table where cart_id=?";
    mysql.query(delQry, [req.query.cartid], (err, results) => {
        if (err) {
            console.log(err);
            console.log("Error in deleting the cart item.");
            throw err;
        } else {
            res.redirect('/cart');
        }
    })
})

app.get('/minusqty', (req, res) => {
    const selQry = "select * from cart_table where cart_id=?";
    mysql.query(selQry, [req.query.cartid], (err, results) => {

        if (err) {
            console.log("Error in minus Qty");
            console.log(err);
            throw err;

        } else {
            if (results != "") {

                if (results[0].cart_qty <= 1) {
                    res.redirect(`/delcartitem?cartid=${req.query.cartid}`);

                } else {
                    let cartQty = results[0].cart_qty - 1;
                    let updQry = "update cart_table set cart_qty=? where cart_id=?";
                    mysql.query(updQry, [cartQty, req.query.cartid], (error, result) => {
                        if (error) {
                            console.log(error);
                            throw error;
                        } else {
                            console.log("Qty of item in cart decreased successfully!");
                            res.redirect('/cart');
                        }
                    })


                }

            } else {
                console.log("Unable to find the item in cart");
                res.redirect('/cart');
            }
        }
    })
})

app.get('/checkout', (req, res) => {

    if (req.session.username) {

        res.render('checkout', { totitems: req.query.totitems, totprice: req.query.totprice, username: req.session.username, address: req.session.useraddress, phone: req.session.userphone, userid: req.session.userid });

    } else {
        res.redirect('login');
    }
    // res.render('checkout')

})

app.post('/order', (req, res) => {
    if (req.session.username) {

        const selQry = "select * from cart_table where cart_user_id=?";
        mysql.query(selQry, [req.session.userid], (err, results) => {
            if (err) {
                console.log(err);
                throw err;
            } else {
                if (results != "") {
                    let bookids = "";
                    results.map((elem) => {
                        console.log(typeof bookids)
                        bookids += elem.cart_book_id;
                        bookids += " ";
                        // bookids.append(elem.cart_book_id);
                        console.log(elem.cart_book_id);
                    })
                    console.log(bookids.trim());

                    var orderId;
                    const insQry = "insert into order_table(order_date,order_user_id,order_items,order_total,order_status) values(?,?,?,?,?)";

                    // Getting Current Date and Time.
                    const date = new Date();
                    let time = date.toString(); //converting the current date and time into string
                    console.log(`time ${time}`)
                    let timeArr = time.split(' '); //splitting string into the array 
                    let hrMins = timeArr[4].split(':');
                    let listTime = `${timeArr[1]} ${timeArr[2]} ${hrMins[0]}:${hrMins[1]} `;
                    console.log("time....." + listTime)   //getting time and date , convertion them into the string.

                    mysql.query(insQry, [listTime, req.session.userid, req.body.totitem, req.body.totprice, "pending"], (error, result) => {
                        if (error) {
                            console.log(error);
                            throw error;
                        } else {
                            orderId = result.insertId;
                            console.log(result.insertId);
                            console.log('Insertion Success!');


                            let values = [];
                            const insOrderItems = "insert into order_items_table(order_id,order_book_id,order_book_qty) values ?";

                            results.map((elem) => {
                                console.log(typeof bookids)

                                values.push([result.insertId, elem.cart_book_id, elem.cart_qty]);
                                // bookids += elem.cart_book_id;
                                // bookids += " ";
                                // bookids.append(elem.cart_book_id);
                                // console.log(elem.cart_book_id);
                            })
                            // console.log(`values array ${values[0]}`);

                            mysql.query(insOrderItems, [values], (prblm, results) => {
                                if (prblm) {
                                    console.log(prblm);
                                    throw prblm;
                                } else {
                                    orderId = results.insertId;
                                    console.log("insertion Success in Order items tbl");
                                }
                            })




                            const delQry = "delete from cart_table where cart_user_id=?";
                            mysql.query(delQry, [req.session.userid], (err, results) => {
                                if (err) {
                                    console.log(err);
                                    throw err;
                                } else {
                                    console.log("Cart emptied after user put an order.");
                                    res.redirect("ordersuccess");
                                }
                            })
                        }
                    });

                } else {
                    console.log('No items in cart!');
                    res.redirect('/cart');
                }
            }
        })
    } else {
        res.redirect('/login');
    }
})

var booksArr = [];

const getSingleBook = (req, res, bId) => {
    const selQry = "select * from books_table where books_id=?";
    mysql.query(selQry, [bId], (err, results) => {
        if (err) {
            throw err;
        } else {
            if (results != "") {
                console.log("Got result");
                console.log(results[0]);
                booksArr.push(results[0]);
                return results[0];
            } else {
                console.log("GOt no result")
            }
        }

    })
}
app.get('/myorders', (req, res) => {
    if (req.session.username) {
        const selQry = "select * from order_table where order_user_id=?";
        mysql.query(selQry, [req.session.userid], (err, results) => {
            if (err) {
                console.log(err);
            } else {
                if (results != "") {
                    let orderObj = results;
                    console.log(`feedback.... ${results[1].order_feedback}`);
                    // const selFB = "select * from feedback_table where feedback_order_id=?";
                    // mysql.query(selFB, [results[0].order_id], (error, result) => {
                    //     if (err) {
                    //         throw err;
                    //     } else {
                    //         if (result != "") {
                    //             orderObj.hideFB = true;
                    //         } else {
                    //             orderObj.hideFB = false;
                    //         }
                    //     }
                    // })
                    res.render('orders', { results: results });

                } else {
                    res.render('orders', { msg: true });
                }
            }
        });
    } else {
        res.redirect('/login');
    }
})

app.get('/ordersummary', (req, res) => {
    if (req.session.username) {

        let oId = req.query.oid;
        const selQry = "select * from order_items_table oi, books_table b where oi.order_id=? and b.books_id=oi.order_book_id";
        mysql.query(selQry, [oId], (err, results) => {

            if (err) {
                console.log(err);
            } else {
                if (results != "") {

                    res.render('ordersummary', { results: results });
                } else {
                    res.render('ordersummary', { msg: true });
                }
            }
        })
    } else {
        res.redirect('/login');
    }
})

app.get('/addfav', (req, res) => {
    if (req.session.username) {
        let selQry = "select * from favourite_table where fav_user_id=? and fav_book_id=?";
        mysql.query(selQry, [req.session.userid, req.query.bid], (error, result) => {

            if (error) {
                throw error;
            } else {
                if (result == "") {
                    let insQry = "insert into favourite_table(fav_user_id,fav_book_id) values(?,?)";
                    mysql.query(insQry, [req.session.userid, req.query.bid], (err, results) => {

                        if (err) {
                            throw err;
                        } else {
                            console.log("Favourite tbl insertion success");
                            res.redirect(`/bookdetails?bid=${req.query.bid}&usertype=user&favmsgt=${true}`);
                        }
                    })
                } else {
                    let delQry = "delete from favourite_table where fav_user_id=? and fav_book_id=?";
                    mysql.query(delQry, [req.session.userid, req.query.bid], (err, results) => {
                        if (err) {
                            throw err;
                        } else {
                            res.redirect(`/bookdetails?bid=${req.query.bid}&usertype=user&favmsgf=${true}`);
                        }
                    })
                }
            }
        })
    } else {
        res.redirect('/login');
    }
})


app.get('/myfavourites', (req, res) => {
    if (req.session.username) {
        let selQry = "select * from favourite_table f,books_table b where f.fav_user_id=? and f.fav_book_id=b.books_id;";
        mysql.query(selQry, [req.session.userid], (err, results) => {
            if (err) {
                throw err;
            } else {
                if (results != "") {

                    res.render('favourite', { results: results })
                } else {
                    res.render('favourite', { msg: true });
                }
            }
        })
    } else {
        res.redirect('/login');
    }
})

app.post('/delfav', (req, res) => {
    if (req.session.username) {

        let delQry = "delete from favourite_table where fav_user_id=? and fav_book_id=?";
        mysql.query(delQry, [req.session.userid, req.body.bid], (err, results) => {
            if (err) {
                throw err;
            } else {
                res.redirect('/myfavourites');
            }
        })
    } else {
        req.redirect('/login');

    }
})

app.get('/ordersuccess', (req, res) => {
    res.render('ordersuccess');
})

app.get('/profile', (req, res) => {
    if (req.session.userType) {
        let selQry = "select * from user_tbl where user_id=?";
        mysql.query(selQry, [req.session.userid], (err, results) => {
            if (err) {
                throw err;
            } else {
                if (results != "") {

                    if (results[0].user_type == "admin") {
                        res.render('profile', { results: results, admin: true, updmsg: req.query.updmsg });
                    }
                    else if (results[0].user_type == "user") {
                        res.render('profile', { results: results, user: true, updmsg: req.query.updmsg });
                    }
                } else {
                    res.render('profile', { msg: true });
                }
            }
        })
        // if (res.session.userType == 'user') {


        // } else if (res.session.usertype == 'admin') {

        // }

    } else {
        res.redirect('/login');
    }
    // res.render('profile');
})

app.post('/profilechanges', (req, res) => {
    if (req.session.userid) {

        const updQuery = "update user_tbl set user_name=?,user_email=?,user_phone=?,user_address=? where user_id=?";

        mysql.query(updQuery, [req.body.username, req.body.useremail, req.body.userphone, req.body.useraddress, req.session.userid], (err, results) => {
            if (err) {
                throw err;
            } else {
                res.redirect(`profile?updmsg=${true}`);
            }
        });


    } else {
        res.redirect('/login');
    }
})
app.post('/feedback', (req, res) => {
    const updQry = "update order_table set order_feedback=? where order_id=?";

    mysql.query(updQry, [req.body.feedbackdesc, req.body.oid], (err, results) => {
        if (err) {
            throw err;
        } else {
            res.redirect(`/myorders`);
        }
    });
})


app.get('/editbook', (req, res) => {
    if (req.session.username) {

        const selQry = "select * from books_table where books_id=?";
        mysql.query(selQry, [req.query.bid], (err, results) => {
            if (err) {
                throw err;
            } else {
                if (results != "") {
                    console.log(results[0].books_author);
                    res.render('editbook', { results: results, author: results[0].books_author });
                } else {
                    console.log("book not found");
                }
            }

        });
    } else {
        res.redirect('/login');
    }
})

app.post('/editb', (req, res) => {
    const updQry = "update books_table set books_title=?,books_genre=?,books_author=?,books_year=?,books_desc=?,books_cover=?,books_isbn=?,books_pages=?,books_price=? where books_id=?";

    mysql.query(updQry, [req.body.booktitle, req.body.bookgenre, req.body.bookauthor, req.body.bookyear, req.body.bookdesc, req.body.bookcover, req.body.bookisbn, req.body.bookpages, req.body.bookprice, req.body.bookid], (err, results) => {

        if (err) {
            throw err;
        } else {
            console.log("blah")
            res.redirect(`/admin`);
        }
    })
})

app.get('/*', (req, res) => {
    if (req.session.userType == "admin") {
        res.render("errorpage", { userAdmin: true });
    } else if (req.session.userType == "user") {
        res.render("errorpage", { userUser: true });
    } else {
        res.render("errorpage", { userHome: true });
    }
})


// Server
app.listen(8000, () => {
    console.log("Server is running at port no 8000");
})