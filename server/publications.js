Meteor.publish('list-rooms', function () {
  return Rooms.find({ black: "" }, { fields: { name: true, _id: true, white: true } });
});

Meteor.publish('own-room', function (userId) {
  if (!userId) {
    userId = "";
  }

  check(userId, String);

  var user = Meteor.users.findOne(this.userId);
  
  if (!user || user._id !== userId) {
    user = { username: "" };
  }

  return Rooms.find({ $or: [ { white: user.username }, { black: user.username } ] }, { fields: { name: true, _id: true, white: true, black: true } });
});

Meteor.publish('user', function () {
  return Meteor.users.find(this.userId, { fields: { username: true, roomId: true } });
});

Meteor.publish('actions', function (roomId) {
  check(roomId, String);

  return Actions.find({ roomId: roomId });
});

Rooms.allow({
  insert: function (userId, doc) {
    var user = Meteor.users.findOne(userId);

    return (user && doc.white === user.username && doc.black === "");
  },

  remove: function (userId, doc) {
    var user = Meteor.users.findOne(userId);

    return (user && (doc.white === user.username || doc.black === user.username));
  }
});

Rooms.after.insert(function (userId, doc) {
  Meteor.users.update(userId, { $set: { roomId: doc._id } });  
});

Rooms.after.remove(function (userId, doc) {
  Meteor.users.update({ username: doc.white }, { $set: { roomId: "" } });
  Meteor.users.update({ username: doc.black }, { $set: { roomId: "" } });
  Actions.remove({ roomId: doc._id });
});
