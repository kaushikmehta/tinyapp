const { assert } = require('chai');

const { findUser } = require('../helpers.js');

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

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = findUser("user@example.com", users)
    const expectedOutput = "userRandomID";
    assert.equal(user.id, expectedOutput);
  });
  it('should return a user with valid email', function() {
    const user = findUser("whodis@whatmail.com", users)
    const expectedOutput = undefined;
    assert.equal(user.id, expectedOutput);
  });

});