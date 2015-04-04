Rooms = new Mongo.Collection('rooms');
Actions = new Mongo.Collection('actions');

Rooms.before.insert(function (userId, doc) {
  if (!doc.bot) {
    doc.black = "";
  } else {
    doc.black = "BOT1";
  }
});
