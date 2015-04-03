var game, player;

Template.body.helpers({
  inRoom: function () {
    return Meteor.user().roomId;
  }
});

Template.roomList.helpers({
  rooms: function () {
    return Rooms.find({ });
  },

  noRooms: function () {
    return Rooms.find({ }).count() === 0;
  }
});

Template.roomList.events({
  'submit .create-room': function (event) {
    event.preventDefault();

    var roomName = Meteor.user().username + "'s room";
    if ($(".room-name").val() !== "") {
      roomName = $(".room-name").val();
    }

    var newRoom = {
      name: roomName,
      white: Meteor.user().username
    };

    Rooms.insert(newRoom);
  }
});

Template.roomItem.events({
  'click .join-room': function (event) {
    event.preventDefault();

    Meteor.call("joinRoom", this._id);
  }
});

Template.game.rendered = function () {
  var room = Rooms.findOne(Meteor.user().roomId);
  Session.set("roomId", room._id);
  Session.set("room", room);
  Session.set("current", -1);
  player = 0;

  if (room.black == Meteor.user().username) {
    player = 1;
  }

  if (room.black !== "") {
    startGame();
  } else {
    var roomQuery = Rooms.find(Meteor.user().roomId);
    var roomHandle = roomQuery.observeChanges({
      changed: function (id, fields) {
        roomHandle.stop();

        Session.set("room", Rooms.findOne(Meteor.user().roomId));
        startGame();
      }
    });
  }
};

function startGame () {
  $(".wait-container").remove();

  $(window).on('focus', function() {
    document.title = "Sesqui Online";
  });

  game = new Game();

  console.log("T0");

  game.setSize();

  $(window).resize(function () {
    game.setSize();
  });

  console.log("T1");

  var query = Actions.find({ roomId: Session.get("roomId") });
  var res = query.fetch();

  console.log("T2");

  _.each(res, function (act) {
    console.log(act);
    if (act.type === "move") {
      game.highlightPiece = game.pieces[act.highlight];
      game.movePiece(act.piece, true, false);
    } else {
      game.placePiece(act.piece, true, false);
    }    
  });

  console.log("T3");

  var handle = query.observeChanges({
    added: function (id, move) {
      if (move.move < game.move || (move.move === game.move && Session.get("current") === player)) {
        return;
      }

      if (move.type === "move") {
        game.highlightPiece = game.pieces[move.highlight];
        game.movePiece(move.piece, true, true);
      } else {
        game.placePiece(move.piece, true, true);
      }

      game.render();

      if (!document.hasFocus()) {
        document.title = "Your move!";
      }
    }
  });
}

Template.game.events({
  'click #interface': function (event) {
    event.preventDefault();

    if (Session.get("current") === player) {
      var action = game.click({ x: event.pageX, y: event.pageY });
      if (action) {
        action.roomId = Session.get("roomId");
        Meteor.call('makeMove', action);
      }
    }
  },

  'click .exit-room': function (event) {
    event.preventDefault();

    Rooms.remove(Session.get("roomId"));
    Session.set("roomId", "");
  },

  'click .dump-moves': function (event) {
    event.preventDefault();

    var res = Actions.find({ roomId: Session.get("roomId") }).fetch();
    var dump = "";

    _.each(res, function (act) {
      if (act.type === "move") {
        dump += "m|" + game.pieces[act.highlight].a.toString() + "|" + game.pieces[act.highlight].b.toString() + "|" + act.piece.a.toString() + "|" + act.piece.b.toString() + "$";
      } else {
        dump += "p|" + act.piece.a.toString() + "|" + act.piece.b.toString() + "$";
      }
    });

    $("#dump-content").text(dump);
    $(".dump-modal").modal("show");
  }
});

Template.game.helpers({
  currentPlayer: function () {
    if (!Session.get("room")) {
      Session.set("room", { white: "", black: "" });
    }

    var cplayer = Session.get("room").white + " turn";
    if (Session.get("current") === 1) {
      cplayer = Session.get("room").black + " turn";
    }

    if (Session.get("current") === player) {
      cplayer = "Your turn";
    } else if (Session.get("current") === -1) {
      cplayer = "";
    }

    return cplayer;
  },

  currentPlace: function () {
    return Session.get("currentPlace") === 0;
  },

  currentMove: function () {
    return Session.get("currentMove") === 0;
  },

  roomName: function () {
    return Session.get("room").name;
  },

  player1Name: function () {
    return Session.get("room").white;
  },

  player2Name: function () {
    return Session.get("room").black || "???";
  }
});

Accounts.ui.config({
  passwordSignupFields: "USERNAME_ONLY"
});
