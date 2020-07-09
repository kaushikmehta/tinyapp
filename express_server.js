//Defining constants required for app
const express = require("express");
const app = express();

const bcrypt = require('bcrypt');

const cookieParser = require('cookie-parser');
app.use(cookieParser());

const bodyParser = require("body-parser");
const e = require("express");
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = 8080;
app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userIDforLink: "userRandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userIDforLink: "userRandomID" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

// Helper Functions

// generates random 6 character alphanumeric strings; used for new url and new user
function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}

// checks to see if user exists and returns the user object if found or falsy value
const findUser = emailID => {
  for (const userID in users) {
    if (users[userID].email === emailID) {
      return users[userID];
    }
  }
  return false;
}

// registers new user is database when called
const registerNewUser = (email, password) => {
  const newUserID = generateRandomString();
  const id = newUserID
  users[newUserID] = { id, email, password };
  return users[newUserID];
}

// validates user's email and password combination and return truthy/falsy
const validatePassword = (userObj, email, passwordToCheck) => {
  if (userObj.email === email && userObj.password === passwordToCheck) {
    return true;
  }
  return false;
}

// finds urls associated with a given userID
const findURLSByUser = (userCookieID) => {
  let usersURLs = {};
  for (const url in urlDatabase) {
    console.log("singe:", urlDatabase[url])
    if (urlDatabase[url].userIDforLink === userCookieID) {
      usersURLs[url] = urlDatabase[url];
      usersURLs[url].longURL = urlDatabase[url].longURL
    }
  }
  console.log("obj:", usersURLs);
  return usersURLs;
}

//route for /(homepage)
//redirects to login if no user logged in
//redirects user logged in to urls index
app.get("/", (req, res) => {
  let templateVars = {
    userID: req.cookies["user_id"],
    users: users,
    page: req.url
  }
  if (templateVars.userID === undefined) {
    res.render("login", templateVars);
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});



//route for /urls
//renders calls urls_index page
app.get("/urls", (req, res) => {
  const userCookieID = req.cookies["user_id"];

  if (userCookieID) {
    let templateVars = {
      urls: findURLSByUser(userCookieID),
      userID: req.cookies["user_id"],
      users: users,
      page: req.url
    };
    // console.log("TEMPURLS:", templateVars.urls)
    res.render("urls_index", templateVars);
  } else {
    let templateVars = {
      error: "You are not logged in, please log in first.",
      users: { userID: undefined },
      userID: undefined,
      page: req.url,
      showLogIn: true,
      showCreateURL: false
    }
    res.render("error", templateVars);
  }
});

//route for create new url page
//redirects to login is no user logged in
// else renders create new url page
app.get("/urls/new", (req, res) => {
  let templateVars = {
    userID: req.cookies["user_id"],
    users: users,
    page: req.url
  }
  if (templateVars.userID === undefined) {
    res.render("login", templateVars);
  } else {
    res.render("urls_new", templateVars);
  }
});

//individual post page for short urls
app.get("/urls/:shortURL", (req, res) => {
  const shorturl = req.params.shortURL;

  // if user logged in
  if (req.cookies["user_id"] !== undefined) {
    //if logged in but no short url
    if (urlDatabase[shorturl] !== undefined) { // show url page
      const longurl = urlDatabase[shorturl].longURL
      let templateVars = {
        shortURL: shorturl,
        longURL: longurl,
        userID: req.cookies["user_id"],
        users: users,
        page: req.url
      };
      res.render("urls_show", templateVars);
    } else { // show no url page
      let templateVars = {
        error: "That Short Link does not exist, you can create one below",
        users: users,
        userID: req.cookies["user_id"],
        page: req.url,
        showLogIn: false,
        showCreateURL: true
      }
      res.render("error", templateVars);
    }
  } else { // show please log in page
    let templateVars = {
      error: "You are not logged in, please log in first.",
      users: { userID: undefined },
      userID: undefined,
      page: req.url,
      showLogIn: false,
      showCreateURL: true
    }
    res.render("error", templateVars);
  }
});

// redirect link for anyone to access through shorturl

app.get("/u/:shortURL", (req, res) => {

  const shorturl = req.params.shortURL;
  // if user logged in
  if (req.cookies["user_id"] !== undefined) {
    //if logged in but no short url
    if (urlDatabase[shorturl] !== undefined) { // redirect to long url
      const longURL = urlDatabase[req.params.shortURL].longURL;
      res.redirect(longURL);
    } else { // show no url page
      let templateVars = {
        error: "That Short Link does not exist, you can create one below",
        users: users,
        userID: req.cookies["user_id"],
        page: req.url,
        showLogIn: false,
        showCreateURL: true
      }
      res.render("error", templateVars);
    }
  } else { // show please log in page
    let templateVars = {
      error: "You are not logged in, please log in first.",
      users: { userID: undefined },
      userID: undefined,
      page: req.url,
      showLogIn: true,
      showCreateURL: false
    }
    res.render("error", templateVars);
  }

});


//route for new user registration
app.get("/register", (req, res) => {
  const cookieUserID = req.cookies["user_id"];

  if (cookieUserID !== undefined) {
    res.redirect("/urls");
  } else {
    let page = req.url;
    let templateVars = {
      urls: urlDatabase,
      userID: undefined,
      users: users,
      page: page
    };
    res.render("register", templateVars);
  }
});


// route for login page
app.get("/login", (req, res) => {
  const cookieUserID = req.cookies["user_id"];

  if (cookieUserID !== undefined) {
    res.redirect("/urls");
  } else {
    let page = req.url;
    let templateVars = {
      urls: urlDatabase,
      userID: req.cookies["user_id"],
      users: users,
      page: page
    };
    res.render("login", templateVars);
  }
});

// all other unknown/not-found pages show 404 error
app.get('*', function (req, res) {
  res.send("404 - Page not found. Try Again with a different page", 404);
});

// POST REQUESTS

// adds new short url in db with longurl and corresponding user id
app.post("/urls", (req, res) => {
  const cookieUserID = req.cookies["user_id"];
  if (cookieUserID !== undefined) {
    
    const shortString = generateRandomString();
    urlDatabase[shortString] = {};
    urlDatabase[shortString].longURL = req.body.longURL;
    urlDatabase[shortString].userIDforLink = req.cookies["user_id"];
    console.log(urlDatabase);
    res.redirect(`/urls/${shortString}`);
  } else {
    let templateVars = {
      error: "You are not logged in, please log in first.",
      users: { userID: undefined },
      userID: undefined,
      page: req.url,
      showLogIn: true,
      showCreateURL: false
    }
    res.render("error", templateVars);
  }
});

// deletes shorturl object from db if request is sent by user that created it
//else sends unauthorized message
app.post("/urls/:shortURL/delete", (req, res) => {
  let userID = req.cookies["user_id"];
  if (userID === urlDatabase[req.params.shortURL].userIDforLink) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.end("You are not authorized to delete this link\n");
  }
  console.log(urlDatabase);
});

//TO UPDATE!!!!
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  console.log(urlDatabase);
  res.redirect('/urls');
});

// Logs in user after validating they exist and their password matches db record
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const checkUser = findUser(email);

  if (email === "" || password === "") {
    res.send(400, "Bad Request. You tried to submit a blank email or password, please fill in these fields and try again.");
  }

  if (checkUser) {
    const emailPasswordCheck = validatePassword(checkUser, email, password);

    if (emailPasswordCheck) {
      res.cookie("user_id", checkUser.id);
      res.redirect("/urls");
    } else {
      res.send(403, "Bad Request. Your password does not match what we have, please try again.");
    }
  } else {
    res.send(403, "Bad Request. This email doesn't exist in the database, please try again with a different email.");
  }

});


// checks if user exists, if not creates new user;
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const checkUserExists = findUser(email);
  let newUser = "not yet registered";

  if (email === "" || password === "") {
    res.send(400, "Bad Request. You tried to submit a blank email or password, please fill in these fields and try again.");
  }

  if (checkUserExists) {
    res.send(400, "Bad Request. A user with this email already exists, please try again with a different email");
  } else {
    newUser = registerNewUser(email, password);
  }

  res.cookie("user_id", newUser.id);

  res.redirect("/urls");
});

// clear cookies and redirects to url index page
app.post("/logout", (req, res) => {
  let userID = req.cookies["user_id"];

  // for (let urls in urlDatabase) {
  //   if(urls.userIDforLink === userID){
  //     delete urlDatabase[urls];
  //   }
  // }
  res.clearCookie('user_id');
  res.redirect("/urls");
});

//starts serves on specified port and logs message to server console.
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
