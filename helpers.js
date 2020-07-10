// Helper Functions
const bcrypt = require('bcrypt');

// generates random 6 character alphanumeric strings; used for new url and new user
const generateRandomString = () => {
  return Math.random().toString(36).substring(2, 8);
}

const generateFormattedDate = () => {
  const date = new Date();
  return (date.toISOString().split("T")[0]);
}


// checks to see if user exists and returns the user object if found or falsy value
const findUser = (emailID, users) => {
  for (const userID in users) {
    if (users[userID].email === emailID) {
      return users[userID];
    }
  }
  return false;
}

// registers new user is database when called
const registerNewUser = (email, password, users) => {
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
const findURLSByUser = (userCookieID, urlDatabase) => {
  let usersURLs = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userIDforLink === userCookieID) {
      usersURLs[url] = urlDatabase[url];
      usersURLs[url].longURL = urlDatabase[url].longURL
    }
  }
  return usersURLs;
}

module.exports = {
  generateRandomString,
  generateFormattedDate,
  findUser,
  validatePassword,
  registerNewUser,
  findURLSByUser
}