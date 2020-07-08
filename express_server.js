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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
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
    // username: req.cookies["username"],
    userID: req.cookies["user_id"],
    users: users,
    page: req.url
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    // username: req.cookies["username"],
    userID: req.cookies["user_id"],
    users: users,
    page: req.url
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    // username: req.cookies["username"],
    userID: req.cookies["user_id"],
    users: users,
    page: req.url
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  let user;
  let page = req.url;
  // req.cookie === undefined ? user = undefined : user = req.cookie["username"];
  let templateVars = {
    urls: urlDatabase,
    //  username: user,
    userID: req.cookies["user_id"],
    users: users,
    page: page
  };
  res.render("register", templateVars);
});

app.get('*', function (req, res) {
  res.send("404 - Page not found. Try Again with a different page", 404);
});

app.post("/urls", (req, res) => {
  const shortString = generateRandomString();
  urlDatabase[shortString] = req.body.longURL;
  console.log(urlDatabase);
  console.log(req.body);  // Log the POST request body to the console
  res.redirect(req.body.longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  console.log(urlDatabase);
  res.redirect('/urls');
});

app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL] = req.body.longURL;
  console.log(urlDatabase);
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  
  const checkUserExists = findUser(email);
  let newUser = "not yet regd";

  if (email === "" || password === ""){
    res.send("Bad Request. You tried to submit a blank email or password, please fill in these fields and try again.", 400);
  } 

  if (checkUserExists) {
    res.send("Bad Request. A user with this email already exists, please try again with a different email", 400);
  } else {
    newUser = registerNewUser(email, password);
  }
  console.log("NEW U:", newUser, "CHECK U", checkUserExists);
  
  res.cookie("user_id", newUser.id);

  res.redirect("/urls");
});


app.post("/logout", (req, res) => {
  res.clearCookie('user_id');

  for (let urls in urlDatabase) {
    delete urlDatabase[urls];
  }
  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
