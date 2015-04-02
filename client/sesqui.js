var game, player;

Template.body.helpers({
  inRoom: function () {
    return Meteor.user().roomId;
  }
});

Template.roomList.helpers({
  rooms: function () {
    return Rooms.find({ });
  }
});

Template.roomList.events({
  'click .create-room': function (event) {
    event.preventDefault();

    var newRoom = {
      name: Meteor.user().username + "'s room",
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
  game = new Game();
  game.setSize();

  $(window).resize(function () {
    game.setSize();
  });

  var query = Actions.find({ roomId: Session.get("roomId") });
  var handle = query.observeChanges({
    added: function (id, move) {
      if (move.move < game.move || (move.move === game.move && Session.get("current") === player)) {
        return;
      }

      console.log(move);

      if (move.type === "move") {
        game.highlightPiece = game.pieces[move.highlight];
        game.movePiece(move.piece, true);
      } else {
        game.placePiece(move.piece, true);
      }

      game.render();
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
  }
});

Template.game.helpers({
  currentPlayer: function () {
    if (!Session.get("room")) {
      Session.set("room", { white: "", black: "" });
    }

    var player = Session.get("room").white + "'s turn";
    if (Session.get("current") === 1) {
      player = Session.get("room").black + "'s turn";
    }

    return player;
  },

  currentPlace: function () {
    return Session.get("currentPlace") === 0;
  },

  currentMove: function () {
    return Session.get("currentMove") === 0;
  }
});

Accounts.ui.config({
  passwordSignupFields: "USERNAME_ONLY"
});
