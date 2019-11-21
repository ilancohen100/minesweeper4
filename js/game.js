"use strict";
var MINE = "💣";
//var EMPTY = "0";
var FLAGED = "🚩";
var UNREVEALED = "⬜";
var SAD = "🤕";
var HAPPY = "😃";
var SUNGLASSES = "😎";
var MINES_AROUND = [" ", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣"];
var RED_HEART = "❤️";
//globals
//Matrix contains cell objects
//var cell = {isRevealed : false,isMine : false,isMarked: false}
var gBoard = [];
// This is an object by which the board size is set
//(in this case: 4*4), and how many mines to put
var gBoardBackupStr;
var gDOMBackupStr;
var gGameBackupStr;
var gLevelBackupStr;
// Support 3 levels of the game
// o Beginner (4*4 with 2 MINES)
// o Medium (8 * 8 with 12 MINES)
// o Expert (12 * 12 with 30 MINES)
var gLevels = [
  { name: "Beginner", SIZE: 4, MINES: 2 },
  { name: "Medium", SIZE: 8, MINES: 6 }, //12
  { name: "Expert", SIZE: 12, MINES: 30 },
  { name: "Ilan", SIZE: 24, MINES: 120 }
];

var gLevel = { name: "Beginner", SIZE: 4, MINES: 2 };
//This is an object in which you can keep and update the current game state: isOn – boolean, when true we let the user play shownCount: how many cells are shown markedCount: how many cells are marked (with a flag)
//secsPassed: how many seconds passed
var gGame = {
  isOn: false,
  shownCount: 0,
  markedCount: 0,
  secsPassed: 0,
  isHintMode: false,
  hintClicked: 0,
  hintsLeft: 3,
  lifeLeft: 3,
  timerInterval: null,
  manualSelection: false
};

// { minesAroundCount: 4, isShown: true, isMine: false, isMarked: true, }
// This is called when page loads
function levelSelected(value) {
  gLevel = gLevels[value];
  initGame();
}

function initGame() {
  clearInterval(gGame.timerInterval);
  gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    isHintMode: false,
    hintClicked: 0,
    hintsLeft: 3,
    lifeLeft: 3,
    timerInterval: null,
    safeClicksLeft: 3,
    manualSelection: false
  };
  gBoard = buildBoard();
  renderBoard(gBoard);
  document.querySelector(".lifeLeftContainer").innerHTML = getLifeLeftHtml();
  document.querySelector(".smiley").innerHTML = HAPPY;
  document.querySelector(".hintsCountContainer").innerHTML = gGame.hintsLeft;
  document.querySelector(".safeClicks-container").innerHTML =
    gGame.safeClicksLeft;
  document.querySelector(
    ".bestTime-container"
  ).innerHTML = localStorage.getItem(`level-${gLevel.name}`);
  var elManualButton = document.querySelector(".manualSelection");
  elManualButton.innerHTML = "Manually Select Mine Positions";
  elManualButton.disabled = false;
}

function loadDOM(){
  let parser = new DOMParser()
  document = parser.parseFromString(gDOMBackupStr, "application/xml")
}
function loadBoard(){
  let parser = new DOMParser()
  gBoard = parser.parseFromString(gBoardBackupStr, "application/xml")
}
function saveBoard(){
  var s = new XMLSerializer();
  gBoardBackupStr = s.serializeToString(gBoard);
}
function saveDOM()
{
  var s = new XMLSerializer();
  gDOMBackupStr = s.serializeToString(document);
}
function undo()
{
  // let parser = new DOMParser();
  // gGame = parcer.parseFromString(gGameBackupStr, "application/xml")
  // gLevel = parcer.parseFromString(gLevelBackupStr, "application/xml")
  // loadBoard();
  // loadDOM();
}
function saveBackup()
{
  //var s = new XMLSerializer();
  //gGameBackupStr = s.serializeToString(gGame);
  //gLevelBackupStr = s.serializeToString(gLevel);
  //saveDOM();
  //saveBoard();
}
function smileyClick() {
  initGame();
}
// Builds the board Set mines at random locations Call
// setMinesNegsCount() Return the created board
function buildBoard() {
  var board = [];
  for (var i = 0; i < gLevel.SIZE; i++) {
    board[i] = [];
    for (var j = 0; j < gLevel.SIZE; j++) {
      board[i][j] = {
        isRevealed: false,
        isMine: false,
        isFlaged: false,
        neighborsCount: 0,
        isHintRevealed: false
      };
    }
  }
  return board;
}
//gets 2 coordinates and check if they are next to each other
function checkIfNeighbors(i1, j1, i2, j2) {
  return (i1 - i2) * (i1 - i2) + (j1 - j2) * (j1 - j2) > 2 ? false : true;
}
//hides the selected locations
function manualSelection(elButton) {
  if (gGame.manualSelection === false) {
    gGame.manualSelection = true;
    elButton.innerText = "Finish planting and play";
  } else {
    gGame.manualSelection = false;
    elButton.disabled = true;
    var mines = document.querySelectorAll(".minePositioned");
    for (var i = 0; i < mines.length; i++) {
      mines[i].classList.remove("minePositioned");
      mines[i].classList.add("minePositionedHidden");
    }
    if (mines.length > 0) {
      gLevel = { name: "Manual", SIZE: gLevel.SIZE, MINES: mines.length };
    }
  }
}
//putting the mines on the board (random /manual choosed before )
function plantMines(board, isRandom, clickI, clickJ) {
  if (isRandom) {
    for (var i = 0; i < gLevel.MINES; i++) {
      var isRandomedPosOk = false;
      while (!isRandomedPosOk) {
        var iRand = getRandomIntInclusive(0, gLevel.SIZE - 1);
        var jRand = getRandomIntInclusive(0, gLevel.SIZE - 1);
        //make sure empty around
        if (
          !checkIfNeighbors(iRand, jRand, clickI, clickJ) &&
          board[iRand][jRand].isMine === false
        ) {
          isRandomedPosOk = true;
          board[iRand][jRand].isMine = true;
          console.log(iRand, ",", jRand);
        }
      }
    }
  } else {
    var mines = document.querySelectorAll(".minePositionedHidden");
    for (var i = 0; i < mines.length; i++) {
      mines[i].classList.remove("minePositionedHidden");
      board[mines[i].dataset.i][mines[i].dataset.j].isMine = true;
    }
  }
  return board;
}
//return how many mines arrond chosen position
function countNeighborsMines(board, iLoc, jLoc) {
  var counter = 0;
  var iStart = iLoc === 0 ? iLoc : iLoc - 1;
  var iEnd = iLoc === gLevel.SIZE - 1 ? iLoc : iLoc + 1;
  var jStart = jLoc === 0 ? jLoc : jLoc - 1;
  var jEnd = jLoc === gLevel.SIZE - 1 ? jLoc : jLoc + 1;
  for (var i = iStart; i < iEnd + 1; i++) {
    for (var j = jStart; j < jEnd + 1; j++) {
      if (i == iLoc && j == jLoc) {
        continue;
      } else {
        if (board[i][j].isMine) {
          counter++;
        }
      }
    }
  }
  return counter;
}
// Count mines around each cell and set the cell's minesAroundCount.
function setMinesNegsCount(board) {
  for (var i = 0; i < gLevel.SIZE; i++) {
    for (var j = 0; j < gLevel.SIZE; j++) {
      var negsCount = countNeighborsMines(board, i, j);
      board[i][j].neighborsCount = negsCount;
    }
  }
  return board;
}
// Render the board as a <table> to the page
function renderBoard(board) {
  var strHTML = '<table class = "board-table"><tbody>';
  for (var i = 0; i < gLevel.SIZE; i++) {
    strHTML += "<tr>";
    for (var j = 0; j < gLevel.SIZE; j++) {
      strHTML += renderCellString(i, j, board[i][j]);
    }
    strHTML += "</tr>";
  }
  strHTML += "</tbody></table>";
  var elContainer = document.querySelector(".board-container");
  elContainer.innerHTML = strHTML;
}
//called on renderboard
function renderCellString(i, j, cell) {
  var strHTML = "";
  var dataset = `data-i = ${i} data-j = ${j}`;
  var eventSt = `onmousedown = "cellClicked(this, ${i}, ${j},event)"`;
  strHTML += `<td ${eventSt} class= "cell cell-${i}-${j}" ${dataset} > ${UNREVEALED}</td>`;
  return strHTML;
}
//put right icon for a cell in the dom
function renderCell(elCell, i, j) {
  if (elCell === null) {
    elCell = document.querySelector(`.cell-${i}-${j}`);
  }

  if (!gBoard[i][j].isRevealed && !gBoard[i][j].isHintRevealed) {
    elCell.innerHTML = UNREVEALED;
    return;
  }
  if (gBoard[i][j].isMine) {
    elCell.innerHTML = MINE;
  } else {
    elCell.innerHTML = MINES_AROUND[gBoard[i][j].neighborsCount];
  }
}
//timer in secondes by setinterval
function updateTimer() {
  document.querySelector(".timer-container").innerHTML = Math.floor(
    Date.now() / 1000 - gGame.secsPassed
  );
}
//Called when a cell (td) is clicked
function cellClicked(elCell, i, j, e) {
  //any click
  saveBackup();
  if (gGame.isOn === false && !gGame.manualSelection) {
    gGame.secsPassed = Date.now() / 1000;
    //gGame.isOn = true;
    gGame.timerInterval = setInterval(updateTimer, 1000);
  }
  if (e.button === 0) {
    cellLeftClicked(elCell, i, j);
  }
  //rightclick
  else if (e.button === 2 && !gGame.manualSelection) {
    cellMarked(elCell, i, j);
  }
}
// what happens if mouse left click on a cell
function cellLeftClicked(elCell, i, j) {
  //make sure no mines on first click
  if (gGame.isOn === false && !gGame.manualSelection) {
    gGame.isOn = true;
    var isMinesPositioned =
      document.querySelector(".minePositionedHidden") === null ? false : true;
    gBoard = plantMines(gBoard, !isMinesPositioned, i, j);
    gBoard = setMinesNegsCount(gBoard);
    document.querySelector(".safeClick").disabled = false;
  } else if (gGame.isOn === false) {
    elCell.classList.toggle("minePositioned");
    return;
  }
  if (gGame.isHintMode === true && gGame.hintClicked === 0) {
    gGame.hintsClicked = 1;
    revealNegs(i, j);
    setTimeout(unRevealHint, 1000, i, j);
    return;
  }

  if (gBoard[i][j].isFlaged) return;
  if (gBoard[i][j].isMine) {
    steppedOnMine(elCell);
  } else {
    gBoard[i][j].isRevealed = true;
    gGame.shownCount++;
    renderCell(elCell, i, j);
    expandShown(gBoard, null, i, j);
  }
  checkGameOver();
}

// Called on right click to mark a cell (suspected to be a mine)
function cellMarked(elCell, i, j) {
  // Game ends when all mines are marked and all the other cells
  //  are shown gGame.isOn = true;
  if (gBoard[i][j].isRevealed) return;
  if (gBoard[i][j].isFlaged) {
    //unflag
    elCell.innerHTML = UNREVEALED;
    gBoard[i][j].isFlaged = false;
    gGame.markedCount--;
  } else {
    elCell.innerHTML = FLAGED;
    gBoard[i][j].isFlaged = true;
    gGame.markedCount++;
  }
  checkGameOver();
}
//checks if all mines detected and all other cells revealed
function checkGameOver() {
  console.log(
    "gGame.markedCount=",
    gGame.markedCount,
    " gGame.shownCount=",
    gGame.shownCount
  );
  if (
    gGame.markedCount === gLevel.MINES &&
    gGame.shownCount === gLevel.SIZE * gLevel.SIZE - gLevel.MINES
  ) {
    clearInterval(gGame.timerInterval);
    document.querySelector(".smiley").innerText = SUNGLASSES;
    updateBestTime();
  }
}
//return true if score was saved on local storage
function updateBestTime() {
  var elCurTimer = document.querySelector(".timer-container");
  var curTimer = elCurTimer.innerText;
  var savedTimer = localStorage.getItem(`level-${gLevel.name}`);
  if (savedTimer > curTimer || savedTimer === null) {
    localStorage.setItem(`level-${gLevel.name}`, curTimer);
    document.querySelector(".bestTime-container").innerText = curTimer;
    return true;
  }
  return false;
}
//reveal all cells on the board
function revealBoard(board) {
  for (var i = 0; i < gLevel.SIZE; i++) {
    for (var j = 0; j < gLevel.SIZE; j++) {
      board[i][j].isRevealed = true;
      renderCell(null, i, j);
    }
  }
}

function steppedOnMine(elCell) {
  var elLifeLeftContainer = document.querySelector(".lifeLeftContainer");
  gGame.lifeLeft--;
  if (gGame.lifeLeft === 0) {
    revealBoard(gBoard);
    document.querySelector(".smiley").innerText = SAD;
    elLifeLeftContainer.innerHTML = "GAME OVER";
    clearInterval(gGame.timerInterval);
  } else {
    elCell.innerHTML = MINE;
    gGame.markedCount++;
    elLifeLeftContainer.innerHTML = getLifeLeftHtml();
  }
}
//how many HEARTS to show on life panel
function getLifeLeftHtml() {
  var strHTML = "";
  for (var i = 0; i < gGame.lifeLeft; i++) {
    strHTML += RED_HEART;
  }
  return strHTML;
}
//called by timeout
function endSafeClick(iRand, jRand) {
  var elCell = document.querySelector(`.cell-${iRand}-${jRand}`);
  elCell.classList.remove("safeCell");
  elCell.innerHTML = UNREVEALED;
  if (gGame.safeClicksLeft > 0) {
    document.querySelector(".safeClick").disabled = false;
  }
}
//Bonus: Add support for “LIVES”:
// a. The user has 3 LIVES:
// b. When a MINE is clicked, there is an indication to the user that he clicked a mine.
// The LIVES counter decrease. The user can continue playing.
function safeClick() {
  if (gGame.safeClicksLeft > 0) {
    gGame.safeClicksLeft--;
    var isRandomedPosOk = false;
    while (!isRandomedPosOk) {
      var iRand = getRandomIntInclusive(0, gLevel.SIZE - 1);
      var jRand = getRandomIntInclusive(0, gLevel.SIZE - 1);
      //make sure empty around
      if (
        gBoard[iRand][jRand].isMine === false &&
        gBoard[iRand][jRand].isRevealed === false
      ) {
        isRandomedPosOk = true;
        var elCell = document.querySelector(`.cell-${iRand}-${jRand}`);
        elCell.innerHTML = MINES_AROUND[gBoard[iRand][jRand].neighborsCount];
        elCell.classList.add("safeCell");
        setTimeout(endSafeClick, 4000, iRand, jRand);
        console.log(iRand, ",", jRand);
      }
    }
    document.querySelector(".safeClick").disabled = true;
    document.querySelector(".safeClicks-container").innerText =
      gGame.safeClicksLeft;
  }
}

function hintClicked() {
  if (gGame.hintsLeft > 0) {
    gGame.hintsLeft--;
    gGame.isHintMode = true;
    document.querySelector(".hintSafeModeSpan").innerText =
      "Now its safe to click anywhere";
    document.querySelector(".hintsCountContainer").innerText = gGame.hintsLeft;
  }
}
function revealNegs(iLoc, jLoc) {
  var iStart = iLoc === 0 ? iLoc : iLoc - 1;
  var iEnd = iLoc === gLevel.SIZE - 1 ? iLoc : iLoc + 1;
  var jStart = jLoc === 0 ? jLoc : jLoc - 1;
  var jEnd = jLoc === gLevel.SIZE - 1 ? jLoc : jLoc + 1;
  for (var i = iStart; i < iEnd + 1; i++) {
    for (var j = jStart; j < jEnd + 1; j++) {
      gBoard[i][j].isHintRevealed = true;
      renderCell(null, i, j);
    }
  }
}
function unRevealHint(iLoc, jLoc) {
  var iStart = iLoc === 0 ? iLoc : iLoc - 1;
  var iEnd = iLoc === gLevel.SIZE - 1 ? iLoc : iLoc + 1;
  var jStart = jLoc === 0 ? jLoc : jLoc - 1;
  var jEnd = jLoc === gLevel.SIZE - 1 ? jLoc : jLoc + 1;
  for (var i = iStart; i < iEnd + 1; i++) {
    for (var j = jStart; j < jEnd + 1; j++) {
      gBoard[i][j].isHintRevealed = false;
      renderCell(null, i, j);
    }
  }
  gGame.isHintMode = false;
  gGame.hintsClicked = 0;
  document.querySelector(".hintSafeModeSpan").innerText = "Beware of Mines!!";
}

//When user clicks a cell with no mines around, we need to open
//  not only that cell, but also its neighbors. NOTE: start with
//  a basic implementation that only opens the non-mine 1st degree
//  neighbors BONUS: if you have the time later, try to work more like
//  the real algorithm (see description at the Bonuses section below)
//recursive call
function expandShown(board, elCell, iLoc, jLoc) {
  //stop if there are neighbors
  if (board[iLoc][jLoc].neighborsCount > 0) {
    return;
  }
  var iStart = iLoc === 0 ? iLoc : iLoc - 1;
  var iEnd = iLoc === gLevel.SIZE - 1 ? iLoc : iLoc + 1;
  var jStart = jLoc === 0 ? jLoc : jLoc - 1;
  var jEnd = jLoc === gLevel.SIZE - 1 ? jLoc : jLoc + 1;
  for (var i = iStart; i < iEnd + 1; i++) {
    for (var j = jStart; j < jEnd + 1; j++) {
      if (i == iLoc && j == jLoc) {
        continue;
      } else {
        if (board[i][j].neighborsCount >= 0) {
          if (board[i][j].isMine === false) {
            if (board[i][j].isRevealed === false) {
              board[i][j].isRevealed = true;
              gGame.shownCount++;
              renderCell(null, i, j);
              if (board[i][j].neighborsCount === 0) {
                expandShown(board, null, i, j);
              }
            }
          }
        }
      }
    }
  }
}
