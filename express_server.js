const express = require("express");
const app = express();

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


function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}

const findUser = emailID => {
  for (const userID in users) {
    if (users[userID].email === emailID) {
      return users[userID];
    }
  }
  return false;
}

const registerNewUser = (email, password) => {
  const newUserID = generateRandomString();
  const id = newUserID
  users[newUserID] = { id, email, password };
  return users[newUserID];
}

// validatePassword(checkUserExists, email, password);
const validatePassword = (userObj, email, passwordToCheck) => {
  if (userObj.email === email && userObj.password === passwordToCheck) {
    return true;
  }
  return false;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    userID: req.cookies["user_id"],
    users: users,
    page: req.url
  };
  res.render("urls_index", templateVars);
});

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

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    userID: req.cookies["user_id"],
    users: users,
    page: req.url
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  let page = req.url;
  let templateVars = {
    urls: urlDatabase,
    userID: req.cookies["user_id"],
    users: users,
    page: page
  };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  let page = req.url;
  let templateVars = {
    urls: urlDatabase,
    userID: req.cookies["user_id"],
    users: users,
    page: page
  };
  res.render("login", templateVars);
});

app.get('*', function (req, res) {
  res.send("404 - Page not found. Try Again with a different page", 404);
});

app.post("/urls", (req, res) => {
  const shortString = generateRandomString();
  urlDatabase[shortString] = {};
  urlDatabase[shortString].longURL = req.body.longURL;
  urlDatabase[shortString].userIDforLink = req.cookies["user_id"];
  console.log(urlDatabase);
  res.redirect(`/urls/${shortString}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  let userID = req.cookies["user_id"]
  if (userID === urlDatabase[req.params.shortURL].userIDforLink) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.end("You are not authorized to delete this link\n");
  }
  console.log(urlDatabase);
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  console.log(urlDatabase);
  res.redirect('/urls');
});

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

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const checkUserExists = findUser(email);
  let newUser = "not yet regd";

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


app.post("/logout", (req, res) => {
  let userID = req.cookies["user_id"];
  
  for (let urls in urlDatabase) {
    if(urls.userIDforLink === userID){
      delete urlDatabase[urls];
    }
  }
  res.clearCookie('user_id');
  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
