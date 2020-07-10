const {findUser, findURLSByUser, generateFormattedDate, generateRandomString, registerNewUser, validatePassword} = require("./helpers");

//Defining constants required for app
const express = require("express");
const app = express();

const bcrypt = require('bcrypt');

var cookieSession = require('cookie-session')
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))

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


//route for /(homepage)
//redirects to login if no user logged in
//redirects user logged in to urls index
app.get("/", (req, res) => {
  let userID = req.session.user_id;
  let templateVars = {
    user: users[userID],
    // users: users,
    page: req.url
  }
  console.log("UID:", templateVars.userID);

  if (templateVars.userID === undefined) {
    res.redirect("/login");
  } else {
    res.redirect("/urls/new");
  }
});


app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});



//route for /urls
//renders calls urls_index page
app.get("/urls", (req, res) => {
  let userID = req.session.user_id;
  console.log("FROM URLS:", users);
  console.log("USERID", userID)

  if (users[userID]) {
    let templateVars = {
      urls: findURLSByUser(userID, urlDatabase),
      user: users[userID],
      // users: users,
      page: req.url
    };
    console.log(urlDatabase);
    console.log(templateVars.urls);

    res.render("urls_index", templateVars);
  } else {
    let templateVars = {
      error: "You are not logged in, please log in first.",
      // users: { userID: undefined },
      user: undefined,
      page: req.url,
      showLogIn: true,
      showRegister: true,
      showCreateURL: false
    }
    res.render("error", templateVars);
  }
});

//route for create new url page
//redirects to login is no user logged in
// else renders create new url page
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  let templateVars = {
    user: users[userID],
    // users: users,
    page: req.url
  }
  if (!users[userID]) {
    res.render("login", templateVars);
  } else {
    res.render("urls_new", templateVars);
  }
});

//individual post page for short urls
app.get("/urls/:shortURL", (req, res) => {
  const shorturl = req.params.shortURL;
  const userID = req.session.user_id;
  // if user logged in
  if (users[userID]) {
    //if logged in but no short url
    if (urlDatabase[shorturl] !== undefined && urlDatabase[shorturl].userIDforLink === userID) { // show url page
      // urlDatabase[shorturl].allVisits += 1;
      // if(!req.session.uniqueVisits) {
      //   urlDatabase[shorturl].uniqueVisits += 1;
      // }
      const longurl = urlDatabase[shorturl].longURL
      let templateVars = {
        shortURL: shorturl,
        longURL: longurl,
        user: users[userID],
        url: urlDatabase[shorturl],
        // users: users,
        page: req.url
      };
      res.render("urls_show", templateVars);
    } else if (urlDatabase[shorturl] !== undefined && urlDatabase[shorturl].userIDforLink !== userID) { // logged in but do not own url
      let templateVars = {
        error: "That link belongs to another user, you can create your own.",
        // users: users,
        user: users[userID],
        page: req.url,
        showLogIn: false,
        showRegister: false,
        showCreateURL: true
      }
      res.render("error", templateVars);
    } else { // show no url page
      let templateVars = {
        error: "That Short Link does not exist, you can create one below",
        // users: users,
        user: users[userID],
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
      user: undefined,
      page: req.url,
      showLogIn: true,
      showRegister: true,
      showCreateURL: false
    }
    res.render("error", templateVars);
  }
});

// redirect link for anyone to access through shorturl

app.get("/u/:shortURL", (req, res) => {
  const shorturl = req.params.shortURL;
  const userID = req.session.user_id;

  if (urlDatabase[shorturl]) {
    const longurl = urlDatabase[shorturl].longURL;
    if (req.session['uniqueVisits'] === undefined) {
      urlDatabase[shorturl].uniqueVisits += 1;
    }
    urlDatabase[shorturl].allVisits += 1;
    res.redirect(longurl); // if url exists redirect to long url
  } else { // show no url page
    let templateVars = {
      error: "That Short Link does not exist, you can create one below",
      user: users[userID],
      page: req.url,
      showLogIn: false,
      showRegister: false,
      showCreateURL: true
    }
    res.render("error", templateVars);
  }
});


//route for new user registration
app.get("/register", (req, res) => {
  const user = users[req.session.user_id];

  if (user) {
    res.redirect("/urls");
  } else {
    let page = req.url;
    let templateVars = {
      urls: urlDatabase,
      user: undefined,
      // users: users,
      page: page
    };
    res.render("register", templateVars);
  }
});


// route for login page
app.get("/login", (req, res) => {
  const user = users[req.session.user_id];

  if (user) {
    res.redirect("/urls");
  } else {
    let page = req.url;
    let templateVars = {
      urls: urlDatabase,
      user: user,
      // users: users,
      page: page
    };
    res.render("login", templateVars);
  }
});

// all other unknown/not-found pages show 404 error
app.get('*', function (req, res) {
  let templateVars = {
    error: "Are you sure you have the right address?",
    user: undefined,
    page: req.url,
    showLogIn: false,
    showRegister: false,
    showCreateURL: false
  }
  res.render("error", templateVars);
  // res.send("404 - Page not found. Try Again with a different page", 404);
});

// POST REQUESTS

// adds new short url in db with longurl and corresponding user id
app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (users[userID]) {
    const shortString = generateRandomString();
    urlDatabase[shortString] = {};
    urlDatabase[shortString].longURL = req.body.longURL;
    urlDatabase[shortString].userIDforLink = userID;
    urlDatabase[shortString].dateCreated = generateFormattedDate();
    req.session.uniqueVisits = "anything";
    urlDatabase[shortString].uniqueVisits = 0;
    urlDatabase[shortString].allVisits = 0;
    // console.log(urlDatabase);
    res.redirect(`/urls/${shortString}`);
  } else {
    let templateVars = {
      error: "You are not logged in, please log in first.",
      users: { userID: undefined },
      user: undefined,
      page: req.url,
      showLogIn: true,
      showRegister: true,
      showCreateURL: false
    }
    res.render("error", templateVars);
  }
});


app.post("/urls/:shortURL", (req, res) => {
  let userID = req.session.user_id;
  const user = users[userID];
  if (user) {
    if (userID === urlDatabase[req.params.shortURL].userIDforLink) {
      urlDatabase[req.params.shortURL].longURL = req.body.longURL;
      urlDatabase[req.params.shortURL].dateCreated = generateFormattedDate();
      urlDatabase[req.params.shortURL].uniqueVisits = 0;
      urlDatabase[req.params.shortURL].allVisits = 0;

      req.session.uniqueVisits = null;
      res.redirect('/urls');
    } else {
      let templateVars = {
        error: "You are not authorized to edit this link",
        users: { userID: undefined },
        user: user,
        page: req.url,
        showLogIn: false,
        showRegister: false,
        showCreateURL: true
      }
      res.render("error", templateVars);
    }
  } else {
    let templateVars = {
      error: "You are not logged in, please log in first.",
      users: { userID: undefined },
      user: undefined,
      page: req.url,
      showLogIn: true,
      showRegister: true,
      showCreateURL: false
    }
    res.render("error", templateVars);
  }
});

// deletes shorturl object from db if request is sent by user that created it
//else sends unauthorized message
app.post("/urls/:shortURL/delete", (req, res) => {
  let userID = req.session.user_id;
  const user = users[userID];
  if (user) {
    if (userID === urlDatabase[req.params.shortURL].userIDforLink) {
      delete urlDatabase[req.params.shortURL];
      res.redirect('/urls');
    } else {
      let templateVars = {
        error: "You are not authorized to delete this link",
        users: { userID: undefined },
        user: user,
        page: req.url,
        showLogIn: false,
        showRegister: false,
        showCreateURL: true
      }
      res.render("error", templateVars);
    }
  } else {
    let templateVars = {
      error: "You are not logged in, please log in first.",
      users: { userID: undefined },
      user: undefined,
      page: req.url,
      showLogIn: true,
      showRegister: true,
      showCreateURL: false
    }
    res.render("error", templateVars);
  }
});

// Logs in user after validating they exist and their password matches db record
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const checkUser = findUser(email, users);
  
  let userID = req.session.user_id;

  if (email === "" || password === "") {
    let templateVars = {
      error: "You tried to submit a blank email or password, please fill in these fields and try again.",
      users: { userID: undefined },
      user: undefined,
      page: req.url,
      showLogIn: true,
      showRegister: true,
      showCreateURL: false
    }
    res.status(403).render("error", templateVars);
  }

  if (checkUser) {
    const emailPasswordCheck = validatePassword(checkUser, email, password);

    if (emailPasswordCheck) {
      // let userID = checkUser.id;
      console.log(users);
        req.session.user_id = checkUser.id;
      res.redirect("/urls");
    } else {
      let templateVars = {
        error: "Your password does not match what we have, please try again.",
        users: { userID: undefined },
        user: undefined,
        page: req.url,
        showLogIn: true,
        showRegister: true,
        showCreateURL: false
      }
      res.status(403).render("error", templateVars);
    }
  } else {
    let templateVars = {
      error: "This email doesn't exist in the database, please try again with a different email.",
      users: { userID: undefined },
      user: undefined,
      page: req.url,
      showLogIn: true,
      showRegister: true,
      showCreateURL: false
    }
    res.status(403).render("error", templateVars);
  }
});


// checks if user exists, if not creates new user;
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const checkUserExists = findUser(email, users);
  let newUser = "not yet registered";

  if (email === "" || password === "") {
    let templateVars = {
      error: "You tried to submit a blank email or password, please fill in these fields and try again.",
      users: { userID: undefined },
      user: undefined,
      page: req.url,
      showLogIn: true,
      showRegister: true,
      showCreateURL: false
    }
    res.status(400).render("error", templateVars);
  }

  if (checkUserExists) {

    let templateVars = {
      error: "A user with this email already exists, please try to register again with a different email",
      users: { userID: undefined },
      user: undefined,
      page: req.url,
      showLogIn: false,
      showRegister: true,
      showCreateURL: false
    }
    res.status(400).render("error", templateVars);
  } else {
    newUser = registerNewUser(email, password, users);
  }

  req.session.user_id = newUser.id;

  res.redirect("/urls");
});

// clear cookies and redirects to url index page
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/urls");
});

//starts serves on specified port and logs message to server console.
app.listen(PORT, () => {
  // req.session.user_id = "some value";
  console.log(`Example app listening on port ${PORT}`);
});
