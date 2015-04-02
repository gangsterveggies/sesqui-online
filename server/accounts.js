Accounts.onCreateUser(function(options, user) {
  user.roomId = "";

  if (options.profile) {
    user.profile = options.profile;
  }

  return user;
});
