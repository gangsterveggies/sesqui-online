Meteor.methods({
  makeMove: function (action) {
    check(action, { type: String, piece: Match.Any, highlight: Match.Optional(Match.Any), move: Match.Integer, roomId: String });

    Actions.insert(action);
  },

  joinRoom: function (roomId) {
    check(roomId, String);

    var room = Rooms.findOne(roomId);

    if (!this.userId || !room || room.black) {
      return;
    }

    var user = Meteor.users.findOne(this.userId);

    if (!user) {
      return;
    }

    Rooms.update(roomId, { $set: { black: user.username } });
    Meteor.users.update(this.userId, { $set: { roomId: roomId } });
  }
});
