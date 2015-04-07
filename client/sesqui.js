var game, player;
Session.set("room", {name: "", white: "", black: ""});

Template.body.helpers({
  inRoom: function () {
    return Meteor.user().roomId;
  },

  currentUsername: function () {
    return Meteor.user().username;
  }
});

Template.body.rendered = function() {
  changeSignIn();
};

function signIn() {
  var password = $('#password').val();
  var uname = $('#username').val();

  Meteor.loginWithPassword(uname, password, function(error) {
    if (error) {
      throwError(error.reason);
    }
  });
}

function signUp() {
  var password = $('#password').val();
  var password_confirmation = $('#password-confirmation').val();
  var uname = $('#username').val();

  if (password !== password_confirmation) {
    throwError('Passwords don\'t match!');
    return;
  } else if (!password) {
    throwError('You need to set the password up.');
    return;
  }

  Accounts.createUser({
    username: uname,
    password: password
  }, function(error) {
    if (error) {
      throwError(error.reason);
    } else {
      Meteor.loginWithPassword(uname, password);
      changeSignIn();
    }
  });
}

function throwError (message) {
  alert(message);
}

function changeSignIn() {
  $('#pass-confirm-div').fadeOut('medium');
  $('#sign-text').text('Sign In');
  $('.submit-button').text('Sign In');
  $('#sign-changer').text('Register');
  $('#sign-changer').attr('id','register-changer');
  $('#sign-type').val('sign-in');
}

function changeSignUp() {
  $('#pass-confirm-div').fadeIn('medium');
  $('#sign-text').text('Sign Up');
  $('.submit-button').text('Register');
  $('#register-changer').text('Sign In');
  $('#register-changer').attr('id','sign-changer');
  $('#sign-type').val('sign-up');
}

Template.body.events({
  'click .logout-button': function () {
    Meteor.logout();
  },

  'submit #loginformtag': function(event) {
    event.preventDefault();

    var sign_type = $("#sign-type").val();
    if (sign_type == "sign-in") {
      signIn();
    } else {
      signUp();
    }
  },

  'click #register-changer': function(event) {
    event.preventDefault();
    changeSignUp();
  },

  'click #sign-changer': function(event) {
    event.preventDefault();
    changeSignIn();
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
  },

  'click .play-bot': function (event) {
    event.preventDefault();

    var roomName = Meteor.user().username + "'s room";
    if ($(".room-name").val() !== "") {
      roomName = $(".room-name").val();
    }

    var newRoom = {
      name: roomName,
      bot: true,
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
        if (!document.hasFocus()) {
          document.title = "Game started!";
        }
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
  game.player = player;

  $(window).resize(function () {
    game.setSize();
  });

  console.log("T1");

  var query = Actions.find({ roomId: Session.get("roomId") }, { $sort: { move: 1 } });
  var res = query.fetch();

  console.log("T2");

  _.each(res, function (act) {
    if (act.type === "move") {
      game.highlightPiece = _.find(game.pieces, function(piece) { return piece.a === act.moveTo.a && piece.b === act.moveTo.b; });
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
        console.log(move.moveTo);
        game.highlightPiece = _.find(game.pieces, function(piece) { return piece.a === move.moveTo.a && piece.b === move.moveTo.b; });
        game.movePiece(move.piece, true, true);
      } else {
        game.placePiece(move.piece, true, true);
      }

      game.render();

      if (!document.hasFocus()) {
        if (Session.get("current") === player) {
          document.title = "Your move!";
        } else {
          document.title = "Your opponent moved!";
        }
      }
    }
  });

  if (Session.get("room").bot && Session.get("current") !== player) {
    Meteor.call('botMove');
  }
}

Template.game.events({
  'click #interface': function (event) {
    event.preventDefault();

    if (Session.get("current") === player) {
      var callback = function () {
        if (Session.get("room").bot && Session.get("current") !== player) {
          Meteor.call('botMove');
        }
      };

      game.callback = null;
      var action = game.click({ x: event.pageX, y: event.pageY });

      if (action) {
        action.roomId = Session.get("roomId");
        Meteor.call('makeMove', action);
        game.callback = callback;
      }

      if (Session.get("room").bot && Session.get("current") !== player) {
        game.callback = null;
        Meteor.call('botMove');
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

    var res = Actions.find({ roomId: Session.get("roomId") }, { $sort: { move: 1 } }).fetch();
    var dump = "";

    _.each(res, function (act) {
      if (act.type === "move") {
        dump += "m|" + act.moveTo.a.toString() + "|" + act.moveTo.b.toString() + "|" + act.piece.a.toString() + "|" + act.piece.b.toString() + "$";
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
