Rooms = new Mongo.Collection('rooms');
Actions = new Mongo.Collection('actions');

Rooms.before.insert(function (userId, doc) {
  doc.black = "";
});
