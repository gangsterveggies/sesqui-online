Meteor.startup(function () {
  Rooms.remove({ });
  Meteor.users.update({ }, { $set: { roomId: "" } });
});
