var botIP = "localhost:8000";

Meteor.methods({
  makeMove: function (action) {
    check(action, { type: String, piece: Match.Any, moveTo: Match.Optional(Match.Any), move: Match.Integer, roomId: String });

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
  },

  botMove: function () {
    var user = Meteor.users.findOne(this.userId);

    if (!user || !user.roomId) {
      return;
    }

    var room = Rooms.findOne(user.roomId);

    if (!room) {
      return;
    }

    this.unblock();

    var res = Actions.find({ roomId: room._id }).fetch();
    var dump = "",
        next_move = -1;

    _.each(res, function (act) {
      if (act.type === "move") {
        dump += "m|" + act.moveTo.a.toString() + "|" + act.moveTo.b.toString() + "|" + act.piece.a.toString() + "|" + act.piece.b.toString() + "$";
      } else {
        dump += "p|" + act.piece.a.toString() + "|" + act.piece.b.toString() + "$";
      }

      next_move = Math.max(next_move, act.move);
    });

    next_move += 1;

    var result = HTTP.get("http://" + botIP + "?board=" + dump);

    if (result.statusCode === 200) {
      var lmoves = JSON.parse(result.content);
//      var lmoves = JSON.parse("{\"moves\":[\"p|1|1\", \"p|1|2\"]}");
      for (var i = 0; i < lmoves.moves.length; i++) {
        var action = parseAction(lmoves.moves[i]);
        action.roomId = room._id;
        action.move = next_move + i;
        Actions.insert(action);
      }
    } else {
      console.log(result);
    }

/*    var action = parseAction("p|1|1");
    action.roomId = room._id;
    action.move = next_move;
    Actions.insert(action);

    action = parseAction("p|2|2");
    action.roomId = room._id;
    action.move = next_move + 1;
    Actions.insert(action);*/
  }
});

function parseAction(move) {
  var action = {};
  var lmoves = move.split('|');
  
  if (lmoves[0] === 'm') {
    action.type = "move";
    action.moveTo = { a: parseInt(lmoves[1]), b: parseInt(lmoves[2]) };
    action.piece = { a: parseInt(lmoves[3]), b: parseInt(lmoves[4]) };
  } else {
    action.type = "place";
    action.piece = { a: parseInt(lmoves[1]), b: parseInt(lmoves[2]) };
  }

  return action;
}
