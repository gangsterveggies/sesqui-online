(function(){for(var d=0,a=["ms","moz","webkit","o"],b=0;b<a.length&&!window.requestAnimationFrame;++b)window.requestAnimationFrame=window[a[b]+"RequestAnimationFrame"],window.cancelAnimationFrame=window[a[b]+"CancelAnimationFrame"]||window[a[b]+"CancelRequestAnimationFrame"];window.requestAnimationFrame||(window.requestAnimationFrame=function(b){var a=(new Date).getTime(),c=Math.max(0,16-(a-d)),e=window.setTimeout(function(){b(a+c);},c);d=a+c;return e;});window.cancelAnimationFrame||(window.cancelAnimationFrame=function(a){clearTimeout(a);});})();

var animCurrent, objectiveSquare, startAnim, anim, game;
var dx = [1, -1, 0, 0, 1, 1, -1, -1];
var dy = [0, 0, 1, -1, -1, 1, 1, -1];

function Square(a, b) {
  'use strict';

  // The coordinates
  this.a = a;
  this.b = b;
  this.filled = null;
}

function Piece(a, b, color) {
  'use strict';

  // The coordinates
  this.a = a;
  this.b = b;
  this.color = color;
}

Game = function () {
  'use strict';

  var settings = {
    size: 7,
    offset: 15,
    units: {
      span: 1 / 8,
      piece: 2 / 3
    },
    colors: { stroke: 'rgba(0,0,0,0.15)', square: '#EEE', piece: ['#FFFFFF', '#2B2E34'], piece_stroke: '#2B2E34', highlight: '#000' }
  };

  game = this;

  this.player = 0;
  this.size = settings.size;
  this.lineOffset = settings.offset;
  this.gameOver = false;

  // Graphical sizes based on a pattern unit (square + span = 1)
  this.units = settings.units;
  this.units.square = 1 - this.units.span;
  this.units.piece = this.units.piece / 2;

  this.board = [];

  // For all coordinates
  for (var a = 0; a <= this.size; a += 1) {
    this.board.push([]);
    for (var b = 0; b <= this.size; b += 1) {
      this.board[a].push(new Square(a, b));
    }
  }

  this.highlightSquares = [];
  this.pieces = [];
  this.highlightPiece = null;

/*  for (var a = 0; a < this.size; a += 1) {
    var new_piece = new Piece(0, a, 0);
    this.addPiece(new_piece);
  } */

  this.colors = settings.colors;
  this.canvas = document.getElementById('interface');
  this.ctx = this.canvas.getContext('2d');

  this.move = 0;

  Session.set("current", 0);
  Session.set("currentMove", 1);
  Session.set("currentPlace", 0);
};

Game.prototype.setSize = function () {
  'use strict';

  // Set the extremes, and calculate the size.
  var min = 200,
      max = $(window).width() - 100,
      size = $(window).height() - 250;

  // Responsive details
  if ($(window).width() < 980) { size -= 10; }

  // Restrict sizes to the extremes
  if (size < min) { size = min; } else if (size > max) { size = max; }

  // Resize the canvas
  $('figure').width(size + 60);
  this.canvas.width = size;
  this.canvas.height = size;

  // Resize the player's captions
  $('#players').css({'width': size, 'height': size});

  // For calculations sake, all sizes are defined in ratio of a pattern unit
  this.pattern = (size - this.lineOffset * 2) / (this.board.length - this.units.span);

  this.ctx.globalAlpha = 1;
  this.ctx.fillStyle = "#000";
  this.ctx.fillRect(0, this.lineOffset, this.lineOffset / 2, this.canvas.height - this.lineOffset * 2);
  this.ctx.fillRect(this.canvas.width - this.lineOffset / 2, this.lineOffset, this.lineOffset / 2, this.canvas.height - this.lineOffset * 2);
  this.ctx.fillStyle = "#FFF";
  this.ctx.fillRect(this.lineOffset, 0, this.canvas.width - this.lineOffset * 2, this.lineOffset / 2);
  this.ctx.fillRect(this.lineOffset, this.canvas.height - this.lineOffset / 2, this.canvas.width - this.lineOffset * 2, this.lineOffset / 2);

  // Render the interface with the new ratio
  this.render();
};

Game.prototype.render = function () {
  'use strict';

  var i, j, x, y,
      square = this.units.square * this.pattern,
      piece = this.units.piece * this.pattern;

  this.ctx.globalAlpha = 1;
  this.ctx.strokeStyle = this.colors.stroke;
  this.ctx.lineWidth = 1;

  // Clear the canvas
  this.ctx.clearRect(this.lineOffset - 1, this.lineOffset - 1, this.canvas.width - 2 * this.lineOffset + 1, this.canvas.height - 2 * this.lineOffset + 1);

  // Draw the squares
  this.ctx.fillStyle = this.colors.square;
  for (i = 0; i <= this.size; i += 1) {
    for (j = 0; j <= this.size; j += 1) {
      x = i * this.pattern;
      y = j * this.pattern;
      this.ctx.fillRect(this.lineOffset + x, this.lineOffset + y, square, square);
      this.ctx.strokeRect(this.lineOffset + x, this.lineOffset + y, square, square);
    }
  }

  this.ctx.lineWidth = 2;
  this.ctx.strokeStyle = this.colors.piece_stroke;

  // Draw the pawns
  for (i = 0; i < this.pieces.length; i += 1) {
    x = (this.pieces[i].a * this.pattern) + (square / 2);
    y = (this.pieces[i].b * this.pattern) + (square / 2);
    this.ctx.fillStyle = this.colors.piece[this.pieces[i].color];
    this.ctx.beginPath();
    this.ctx.arc(this.lineOffset + x, this.lineOffset + y, piece, 0, (Math.PI * 2), true);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  this.ctx.globalAlpha = 0.2;
  this.ctx.fillStyle = this.colors.highlight;
  for (i = 0; i < this.highlightSquares.length; i += 1) {
    x = this.highlightSquares[i].a * this.pattern;
    y = this.highlightSquares[i].b * this.pattern;
    this.ctx.fillRect(this.lineOffset + x, this.lineOffset + y, square, square);
  }

  if (this.highlightPiece) {
    this.ctx.globalAlpha = 0.4;

    x = (this.highlightPiece.a * this.pattern) + (square / 2);
    y = (this.highlightPiece.b * this.pattern) + (square / 2);
    this.ctx.fillStyle = this.colors.piece[1 - this.highlightPiece.color];
    this.ctx.beginPath();
    this.ctx.arc(this.lineOffset + x, this.lineOffset + y, (piece + 4), 0, (Math.PI * 2), true);
    this.ctx.closePath();
    this.ctx.fill();
  }

  if (this.gameOver) {
    this.ctx.globalAlpha = 0.2;
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(this.lineOffset - 1, this.lineOffset - 1, this.canvas.width - 2 * this.lineOffset + 1, this.canvas.height - 2 * this.lineOffset + 1);
    this.ctx.globalAlpha = 1;
    this.ctx.font="30px Arial";
    this.ctx.fillText("Game Over!", this.canvas.width / 2 - 80, this.canvas.height / 2);
  }
};

Game.prototype.click = function (position) {
  if (anim || this.gameOver) {
    return null;
  }

  var offset = $(this.canvas).offset(),
      pointer = {x: (position.x - offset.left - this.lineOffset) / this.pattern, y: (position.y - offset.top - this.lineOffset) / this.pattern};

  var square = this.getSquare(pointer), prevHigh;
  var action = -1, currentMove = this.move;

  if (this.highlightPiece) {
    prevHigh = { a: this.highlightPiece.a, b: this.highlightPiece.b };
  }

  if (!square) {
    return null;
  }

  if (square.filled) {
    action = this.highlight(square.filled) ? 0 : -1;
  } else {
    if (this.highlightPiece) {
      action = this.movePiece(square, false, true) ? 1 : -1;
    } else {
      action = this.placePiece(square, false, true) ? 2 : -1;
    }
  }

  if (action < 0) {
    this.clearHighlight();
    this.render();
  }

  if (action > 0) {
    var moveAction;

    if (action === 1) {
      moveAction = { type: "move", piece: square, moveTo: prevHigh, move: currentMove };
    } else {
      moveAction = { type: "place", piece: square, move: currentMove };
    }

    return moveAction;
  } else {
    return null;
  }
};

Game.prototype.setOver = function () {
  if (this.checkOver()) {
    this.gameOver = true;
  }
};

Game.prototype.checkOver = function () {
  var vboard = [], a, b, i, next, queue = [];

  // For all coordinates
  for (a = 0; a <= this.size; a += 1) {
    vboard.push([]);
    for (b = 0; b <= this.size; b += 1) {
      vboard[a].push(false);
    }
  }

  // Check white
  for (a = 0; a <= this.size; a += 1) {
    if (this.board[a][0].filled && this.board[a][0].filled.color === 0) {
      queue.push({ a: a, b: 0 });
    }
  }

  while (queue.length > 0) {
    next = queue.shift();

    if (next.b === this.size) {
      return true;
    }

    for (i = 0; i < 8; i++) {
      var pos = { a: next.a + dx[i], b: next.b + dy[i] };
      if (this.availablePosition(pos) && !vboard[pos.a][pos.b] && this.board[pos.a][pos.b].filled && this.board[pos.a][pos.b].filled.color === 0) {
        vboard[pos.a][pos.b] = true;
        queue.push(pos);
      }
    }
  }

  for (a = 0; a <= this.size; a += 1) {
    for (b = 0; b <= this.size; b += 1) {
      vboard[a][b] = false;
    }
  }

  // Check black
  for (a = 0; a <= this.size; a += 1) {
    if (this.board[0][a].filled && this.board[0][a].filled.color === 1) {
      queue.push({ a: 0, b: a });
    }
  }

  while (queue.length > 0) {
    next = queue.shift();

    if (next.a === this.size) {
      return true;
    }

    for (i = 0; i < 8; i++) {
      var pos = { a: next.a + dx[i], b: next.b + dy[i] };
      if (this.availablePosition(pos) && !vboard[pos.a][pos.b] && this.board[pos.a][pos.b].filled && this.board[pos.a][pos.b].filled.color === 1) {
        vboard[pos.a][pos.b] = true;
        queue.push(pos);
      }
    }
  }

  return false;
};

Game.prototype.placePiece = function (square, checkable, renderable) {
  if (!checkable && (Session.get("currentPlace") === 1 || !this.validPosition(square))) {
    return false;
  }

  var new_piece = new Piece(square.a, square.b, Session.get("current"));
  this.addPiece(new_piece);
  this.clearHighlight();

  this.setPlace();
  this.setOver();

  if (renderable) {
    this.render();
  }

  return true;
};

Game.prototype.movePiece = function (square, checkable, renderable) {
  if (!checkable && (!_.findWhere(this.highlightSquares, { a: square.a, b: square.b }) || Session.get("currentMove") === 1)) {
    return false;
  }

  this.board[this.highlightPiece.a][this.highlightPiece.b].filled = null;
  objectiveSquare = square;
  animCurrent = this.highlightPiece;

  this.clearHighlight();

  if (renderable) {
    startAnim = null;
    this.anim = requestAnimationFrame(this.animPiece);
  } else {
    animCurrent.a = objectiveSquare.a;
    animCurrent.b = objectiveSquare.b;
    game.board[animCurrent.a][animCurrent.b].filled = animCurrent;

    game.setMove();
    game.setOver();
  }

  return true;
};

Game.prototype.animPiece = function () {
  'use strict';

  if (!startAnim) {
    startAnim = Date.now();
  }

  var progress = (Date.now() - startAnim) / 400;
  animCurrent.a = animCurrent.a + (objectiveSquare.a - animCurrent.a) * progress;
  animCurrent.b = animCurrent.b + (objectiveSquare.b - animCurrent.b) * progress;

  game.render();

  if (progress < 1) {
    requestAnimationFrame(game.animPiece);
  } else {
    cancelAnimationFrame(anim);

    animCurrent.a = objectiveSquare.a;
    animCurrent.b = objectiveSquare.b;
    game.board[animCurrent.a][animCurrent.b].filled = animCurrent;

    game.setMove();
    game.setOver();
  }
};

Game.prototype.availablePosition = function (position) {
  return position.a >= 0 && position.a <= this.size && position.b >= 0 && position.b <= this.size;
};

Game.prototype.checkPosition = function (position) {
  var mcol = Session.get("current"),
      ocol = 1 - mcol,
      i;

  // Check:
  // xo
  // .x
  var dxD = [0, 1];
  var dyD = [1, 0];
  var dxE = [1];
  var dyE = [1];

  var fl = true;
  for (i = 0; i < 2; i++) {
    fl = fl && (this.availablePosition({ a: position.a + dxD[i], b: position.b + dyD[i] }) && this.board[position.a + dxD[i]][position.b + dyD[i]].filled && this.board[position.a + dxD[i]][position.b + dyD[i]].filled.color === ocol);
  }

  for (i = 0; i < 1; i++) {
    fl = fl && (this.availablePosition({ a: position.a + dxE[i], b: position.b + dyE[i] }) && this.board[position.a + dxE[i]][position.b + dyE[i]].filled && this.board[position.a + dxE[i]][position.b + dyE[i]].filled.color === mcol);
  }

  if (fl) {
    return false;
  }

  // Check:
  // x.
  // ox
  dxD = [0, -1];
  dyD = [-1, 0];
  dxE = [-1];
  dyE = [-1];

  fl = true;
  for (i = 0; i < 2; i++) {
    fl = fl && (this.availablePosition({ a: position.a + dxD[i], b: position.b + dyD[i] }) && this.board[position.a + dxD[i]][position.b + dyD[i]].filled && this.board[position.a + dxD[i]][position.b + dyD[i]].filled.color === ocol);
  }

  for (i = 0; i < 1; i++) {
    fl = fl && (this.availablePosition({ a: position.a + dxE[i], b: position.b + dyE[i] }) && this.board[position.a + dxE[i]][position.b + dyE[i]].filled && this.board[position.a + dxE[i]][position.b + dyE[i]].filled.color === mcol);
  }

  if (fl) {
    return false;
  }

  return true;
};

Game.prototype.validPosition = function (position) {
  if (!this.availablePosition(position)) {
    return false;
  }

  if (this.move < 3) {
    return true;
  }

  var found = false;
  for (var i = 0; i < 4; i++) {
    var pos = { a: position.a + dx[i], b: position.b + dy[i] };

    if (this.availablePosition(pos) && this.board[pos.a][pos.b].filled) {
      found = found || (this.board[pos.a][pos.b].filled.color === Session.get("current"));
    }
  }

  return found && this.checkPosition(position);
};

Game.prototype.highlight = function (piece) {
  if (this.highlightPiece === piece || Session.get("currentMove") === 1 || piece.color !== Session.get("current")) {
    return false;
  } else {
    this.highlightSquares = [];
    this.highlightPiece = piece;
    this.board[piece.a][piece.b].filled = null;

    for (var i = 0; i < 8; i++) {
      var pos = { a: piece.a + dx[i], b: piece.b + dy[i] };
      
      while (this.availablePosition(pos) && !this.board[pos.a][pos.b].filled && this.checkPosition(pos)) {
        this.highlightSquares.push(_.clone(pos));
        pos.a += dx[i];
        pos.b += dy[i];
      }
    }

    this.board[piece.a][piece.b].filled = piece;

    this.render();
    return true;
  }
};

Game.prototype.clearHighlight = function () {
  this.highlightPiece = null;
  this.highlightSquares = [];
  this.render();
};

Game.prototype.addPiece = function (piece) {
  this.board[Math.floor(piece.a)][Math.floor(piece.b)].filled = piece;
  this.pieces.push(piece);
};

Game.prototype.getSquare = function (pointer) {
  return this.board[Math.floor(pointer.x)][Math.floor(pointer.y)];
};

Game.prototype.setPlace = function () {
  Session.set("currentPlace", 1);
  this.setTotal();
};

Game.prototype.setMove = function () {
  Session.set("currentMove", 1);
  this.setTotal();
};

Game.prototype.setTotal = function () {
  if (Session.get("currentMove") === 1 && Session.get("currentPlace") === 1) {
    Session.set("currentPlace", 0);

    if (this.move > 1) {
      Session.set("currentMove", 0);
    }

    if (this.move !== 1) {
      Session.set("current", 1 - Session.get("current"));
    }

    if (this.callback) {
      this.callback();
    }

    this.callback = null;

    this.move += 1;
  }
};
