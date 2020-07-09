//Defining constants required for app
const express = require("express");
const app = express();

const bcrypt = require('bcrypt');

var cookieSession = require('cookie-session')
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))

// const cookieParser = require('cookie-parser');
// app.use(cookieParser());

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
    password: "$2y$10$wO4dTKIe4vPMImmWtKh.8e5d9NFKjnuIHfFQWklZboqaMFPS8LHR2"
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
  const id = newUserID;
  password = bcrypt.hashSync(password, 10);
  users[newUserID] = { id, email, password };
  return users[newUserID];
}

// validates user's email and password combination and return truthy/falsy
const validatePassword = (userObj, email, passwordToCheck) => {
  console.log("PWTC:", passwordToCheck);
  console.log(userObj);
  if (userObj.email === email && bcrypt.compareSync(passwordToCheck, userObj.password)) {
    return true;
  }
  return false;
}

// finds urls associated with a given userID
const findURLSByUser = (userCookieID) => {
  let usersURLs = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userIDforLink === userCookieID) {
      usersURLs[url] = urlDatabase[url];
      usersURLs[url].longURL = urlDatabase[url].longURL
    }
  }
  return usersURLs;
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

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});



//route for /urls
//renders calls urls_index page
app.get("/urls", (req, res) => {
  let userID = req.session.user_id;

  if (userID) {
    let templateVars = {
      urls: findURLSByUser(userID),
      user: users[userID],
      // users: users,
      page: req.url
    };

    console.log("UID", templateVars.userID)
    console.log("TEMPURLS:", templateVars.urls)
    res.render("urls_index", templateVars);
  } else {
    let templateVars = {
      error: "You are not logged in, please log in first.",
      // users: { userID: undefined },
      user: undefined,
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
  if (userID !== undefined) {
    //if logged in but no short url
    if (urlDatabase[shorturl] !== undefined) { // show url page
      const longurl = urlDatabase[shorturl].longURL
      let templateVars = {
        shortURL: shorturl,
        longURL: longurl,
        user: users[userID],
        // users: users,
        page: req.url
      };
      res.render("urls_show", templateVars);
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
      showLogIn: false,
      showCreateURL: true
    }
    res.render("error", templateVars);
  }
});

// redirect link for anyone to access through shorturl

app.get("/u/:shortURL", (req, res) => {
  const shorturl = req.params.shortURL;
  const userID = req.session.user_id;

  // if user logged in
  if (userID !== undefined) {
    //if logged in but no short url
    if (urlDatabase[shorturl] !== undefined) { // redirect to long url
      const longURL = urlDatabase[shorturl].longURL;
      res.redirect(longURL);
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
      // users: { userID: undefined },
      user: undefined,
      page: req.url,
      showLogIn: true,
      showCreateURL: false
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
  res.send("404 - Page not found. Try Again with a different page", 404);
});

// POST REQUESTS

// adds new short url in db with longurl and corresponding user id
app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  if (userID !== undefined) {

    const shortString = generateRandomString();
    urlDatabase[shortString] = {};
    urlDatabase[shortString].longURL = req.body.longURL;
    urlDatabase[shortString].userIDforLink = userID;
    // console.log(urlDatabase);
    res.redirect(`/urls/${shortString}`);
  } else {
    let templateVars = {
      error: "You are not logged in, please log in first.",
      users: { userID: undefined },
      user: undefined,
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
  let userID = req.session.user_id;
  const user = users[userID];
  if (user) {
    if (userID === urlDatabase[req.params.shortURL].userIDforLink) {
      delete urlDatabase[req.params.shortURL];
      res.redirect('/urls');
    } else {
      res.end("You are not authorized to delete this link\n");
    }
  } else {
    let templateVars = {
      error: "You are not logged in, please log in first.",
      users: { userID: undefined },
      user: undefined,
      page: req.url,
      showLogIn: true,
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
      res.redirect('/urls');
    } else {
      res.end("You are not authorized to delete this link\n");
    }
  } else {
    let templateVars = {
      error: "You are not logged in, please log in first.",
      users: { userID: undefined },
      user: undefined,
      page: req.url,
      showLogIn: true,
      showCreateURL: false
    }
    res.render("error", templateVars);
  }
});

// Logs in user after validating they exist and their password matches db record
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const checkUser = findUser(email);
  // let userID = req.session.user_id;

  if (email === "" || password === "") {
    res.status(40).send("Bad Request. You tried to submit a blank email or password, please fill in these fields and try again.");
  }

  if (checkUser) {
    const emailPasswordCheck = validatePassword(checkUser, email, password);

    if (emailPasswordCheck) {
      // let userID = checkUser.id;
      res.redirect("/urls");
    } else {
      res.status(403).send("Bad Request. Your password does not match what we have, please try again.");
    }
  } else {
    res.status(403).send("Bad Request. This email doesn't exist in the database, please try again with a different email.");
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
