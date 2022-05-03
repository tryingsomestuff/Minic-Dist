var board = null;
var game = new Chess();
var whiteSquareGrey = '#a9a9a9';
var blackSquareGrey = '#696969';
var engine = null;
var move_memory = []



//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                      ENGINE RELATED STUFF
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// engine settings
let engine_think_time = 1000;
let engine_threads    = 1;
let engine_hash       = 128;
let engine_side       = "None";   // which side the engine plays on, options: None, White, Black, Both
let engine_level      = 100;

let engine_uci_change = false;
let engine_multipv    = 1;
let ignore_bestmove   = true;

function setUCIOption(option, value){
    if(engine !== null){
        engine.postMessage(`setoption name ${option} value ${value}`);
        console.log(`setoption name ${option} value ${value}`);
    }
}
function setThreads(threads){
    engine_threads = threads;
    engine_uci_change = true;
}

function setLevel(level){
    engine_level = level;
    engine_uci_change = true;
}

function setHash(hash){
    engine_hash = hash;
    engine_uci_change = true;
}

function setThinkTime(think_time){
    engine_think_time = think_time;
}
function setMultiPV(multi){
    engine_multipv = multi;
}
function setSide(side){
    ignore_bestmove = true;
    engine_side = side;
    if(engine_side !== "None"){
        clear_arrows();
        
        document.getElementById("engine-output-score").innerText = ``;
        document.getElementById("engine-output-depth").innerText = ``;
        document.getElementById("engine-output-nnps").innerText = ``;
        document.getElementById("engine-output-hashfull").innerText = ``;
        document.getElementById("engine-output-pv").innerText = ``;
    }
    startEngineSearch();
}

function parseUciResult(uci_result, key) {
    const uci_array = uci_result.split(" ");
    let res_array = []
    let start_parsing = false;
    for (let i = 0; i < uci_array.length; i++) {
        // check when can start reading stuff
        if (key === uci_array[i]) {
            start_parsing = true;
            // skip the key itself
            continue;
        }
        if (start_parsing) {
            // check if we should stop parsing. this is true if any of the following values
            // which can be sent via the info string from uci engines is given.
            if (["info", "nodes", "hf", "text", "depth", "seldepth", "time", "nodes", "pv",
                "multipv", "score", "currmove", "currmovenumber", "hashfull",
                "nps", "tbhits", "cpuload", "string", "refutation", "currline"].includes(uci_array[i])) {
                return res_array;
            }
            res_array.push(uci_array[i]);
        }
    }
    return res_array;
}
function updateStaticEval(msg){
    if(engine_side === "White" || engine_side === "Black") return;

    const sideToMove = this.game.fen().includes(" w ") ? 1 : -1;
    msg = msg.replace("=", " ");
    const score = parseInt(parseUciResult(msg, "eval")[0]) * sideToMove;
    const formatted_score = (score / 100).toFixed(2)
    document.getElementById("engine-static-evaluation").innerText = `${formatted_score}`;
}
function updateName(msg){
    document.getElementById("engine-name").innerText = parseUciResult(msg, "name").join(" ");
}
function updateSearchInfo(msg){

    const depth = parseUciResult(msg, "depth")[0];
    const seldepth = parseUciResult(msg, "seldepth")[0];
    const nodes = parseUciResult(msg, "nodes")[0];
    const nps = parseUciResult(msg, "nps")[0];
    const hashfull = parseUciResult(msg, "hashfull")[0];
    const pv = parseUciResult(msg, "pv");
    const [scoreType, scoreText] = parseUciResult(msg, "score");

    // problem is that if we change the side, it will stop the search
    // but we need to ignore that best move.
    // we generally only accept best moves if we saw depth 1
    if(depth === "1"){
        ignore_bestmove = false;
    }

    const sideToMove = this.game.fen().includes(" w ") ? 1 : -1;
    const score = parseInt(scoreText, 10) * sideToMove;
    const formattedScore = scoreType === "cp"
        ? (score / 100).toFixed(2)
        : (score < 0 ? `-M${-score}` : `M${score}`);
    const formattedNodes = parseInt(nodes, 10).toLocaleString();
    const formattedNps = parseInt(nps, 10).toLocaleString();
    const formattedHf = parseInt(hashfull, 10) / 10;

    if(engine_side === "White" || engine_side === "Black") return;
    //
    document.getElementById("engine-output-score").innerText = `${formattedScore}`;
    document.getElementById("engine-output-depth").innerText = `[${depth};${seldepth}]`;
    document.getElementById("engine-output-nnps").innerText = `[${formattedNodes};${formattedNps}]`;
    document.getElementById("engine-output-hashfull").innerText = `${formattedHf}%`;
    document.getElementById("engine-output-pv").innerText = `${pv.join(' ')}`;
    // update the displayed arrows on the board
    clear_arrows();
    const engine_pv_depth = pv.length;
    for (let i = 0; i < Math.min(pv.length, engine_pv_depth); i++) {
        draw_move(pv[i], 1 - i / engine_pv_depth);
    }
}

function updateBestMove(msg){
    if (ignore_bestmove) return;
    if (engine_side === "None") return;
    if (engine_side === "Black" && game.turn() === 'w' ||
        engine_side === "White" && game.turn() === 'b') return;
    const uci_move = parseUciResult(msg, "bestmove")[0];
    let promo = 'q'
    if(uci_move.length > 4){
        promo = uci_move.charAt(4);
    }
    move(uci_move.substring(0,2), uci_move.substring(2,4), promo);
    update_fen_and_board();
    // start the next search after 500ms
    (async () => {
        await new Promise(r => setTimeout(r, 500));
        startEngineSearch();
    })();
}
function updatesUCIResults(msg) {
    console.log(msg);
    // read static evaluation
    if (msg.includes("eval=")) {
        updateStaticEval(msg);
    }
    // read uci engine name (especially version is interesting)
    if (msg.includes("id name")) {
        updateName(msg);
    }
    // read search results
    if (msg.startsWith("info")) {
        updateSearchInfo(msg);
    }
    // read search results
    if (msg.startsWith("bestmove")) {
        updateBestMove(msg);
    }
}
function startEngineSearch() {
    if (engine === null) return;
    engine.postMessage("stop");
    // dont do moves if its not the engines turn
    if (engine_side === "Black" && game.turn() === 'w' ||
        engine_side === "White" && game.turn() === 'b') {
        return;
    }
    clear_arrows();
    if(game.game_over()) return;
    if (engine != null) {
        // stop first
        engine.postMessage("stop");
        // check if we need to update uci options
        if(engine_uci_change){
            setUCIOption("Hash", engine_hash);
            setUCIOption("Threads", engine_threads);
            setUCIOption("Level", engine_level);
            engine_uci_change = false;
        }
        engine.postMessage(`position fen ${game.fen()}`);
        engine.postMessage("print")
        engine.postMessage("eval");
        if(engine_side === "None"){
            engine.postMessage("go infinite");
        }
        else{
            engine.postMessage(`go movetime ${engine_think_time}`);
        }
    }
}

(async () => {
    console.log("Loading Minic...");
    const k = await Minic();
    k.addMessageListener(msg => updatesUCIResults(msg));
    engine = k;
    await new Promise(r => setTimeout(r, 5000));
    console.log("...done");
    engine.postMessage("uci");
    engine.postMessage("setoption name Hash value 128");
    board.position(game.fen())
    update_fen();
    startEngineSearch();
})();

function removeGreySquares() {
    $('#myBoard .square-55d63').css('background', '')
}

function greySquare(square) {
    var $square = $('#myBoard .square-' + square);

    var background = whiteSquareGrey;
    if ($square.hasClass('black-3c85d')) {
        background = blackSquareGrey
    }

    $square.css('background', background)
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                      MOVE DRAG AND DROP  (update fen but dont reset the position)
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
$('#fenInput').on('onfocusout', function () {
    set_fen(document.getElementById("fenInput").value);
});
$("#fenInput").on('keyup', function (e) {
    set_fen(document.getElementById("fenInput").value);
});

function onDragStart(source, piece) {
    // do not pick up pieces if the game is over
    if (game.game_over()) return false;

    // or if it's not that side's turn
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false
    }
}

function onDrop(source, target) {
    // remove all highlighted gray squares
    removeGreySquares();
    // dont move if its the engines side
    if (engine_side === "Both" ||
        engine_side === "White" && game.turn() === 'w' ||
        engine_side === "Black" && game.turn() === 'b') return;
    // dont do anything if the we drop it on the same square
    if (source === target) return;
    // check if the move is legal, only if so update the fen
    if (move(source, target) !== null){
        update_fen();
        startEngineSearch();
    }
}

function move(sq_from, sq_to, promo='q') {
    let m = game.move({
        from: sq_from,
        to: sq_to,
        promotion: promo // NOTE: always promote to a queen for example simplicity
    });
    move_memory = []
    return m;
}

function set_fen(fen) {
    // set fen from the outside
    // if the fen is the same as the game fen, dont do anything
    if (fen === game.fen()) return;
    // update the game state
    game.load(fen);
    // update the board state
    board.position(fen);
    // start the engine
    startEngineSearch();
}

function update_fen() {
    // sets the fen from the game
    document.getElementById("fenInput").value = game.fen();
    document.getElementById("pgn-output").innerHTML = game.pgn();
}

function update_fen_and_board() {
    // update the board as well as the fen box
    board.position(game.fen())
    update_fen()
}

function onMouseoverSquare(square, piece) {
    // get list of possible moves for this square
    var moves = game.moves({
        square: square,
        verbose: true
    });
    // exit if there are no moves available for this square
    if (moves.length === 0) return;

    // highlight the square they moused over
    greySquare(square);

    // highlight the possible squares for this piece
    for (var i = 0; i < moves.length; i++) {
        greySquare(moves[i].to)
    }
}

function onMouseoutSquare(square, piece) {
    removeGreySquares()
}

function onSnapEnd() {
    board.position(game.fen())
}

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//                      MOVE DO AND UNDO MANAGEMENT FUNCTIONS
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

function undo_move(restart_search=true) {
    let prev_move = game.undo()
    if (prev_move != null) {
        self.move_memory.unshift(prev_move);
        update_fen_and_board();

        if(restart_search){
            ignore_bestmove = true;
            startEngineSearch();
        }
        // if(engine_side === "None" || engine_side === "Both")
        //     startEngineSearch();
    }
    return prev_move;
}
function undo_all() {
    while (undo_move(false) != null) {
    }
    ignore_bestmove = true;
    startEngineSearch();
}
function redo_move(restart_search=true) {
    if (self.move_memory.length > 0) {
        self.game.move(self.move_memory.shift())
        update_fen_and_board();
        if(restart_search){
            ignore_bestmove = true;
            startEngineSearch();
        }
        // if(engine_side === "None" || engine_side === "Both")
        //     startEngineSearch();
    }
}
function redo_all() {
    while (self.move_memory.length > 0) {
        redo_move(false);
    }
    ignore_bestmove = true;
    startEngineSearch();
}



document.getElementById("btn-cb-end").addEventListener('click', redo_all)
document.getElementById("btn-cb-start").addEventListener('click', undo_all)
document.getElementById("btn-cb-prev").addEventListener('click', undo_move)
document.getElementById("btn-cb-next").addEventListener('click', redo_move)

var config = {
    draggable: true,
    position: 'empty',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    onSnapEnd: onSnapEnd,
    moveSpeed: 'slow'
};

board = Chessboard('myBoard', config)
update_fen();
window.addEventListener('resize', board.resize);
