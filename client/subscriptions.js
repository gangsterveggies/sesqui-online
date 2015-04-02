Tracker.autorun(function () {
  Meteor.subscribe('list-rooms');
  Meteor.subscribe('own-room', Meteor.userId());
  Meteor.subscribe('user');

  if (!Session.get("roomId")) {
    Session.set("roomId", "");
  }

  Meteor.subscribe('actions', Session.get("roomId"));
});
