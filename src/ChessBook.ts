const fs = require('fs');
const ChessTools = require('./libs/polyglot');
// import ChessTools from './libs/polyglot';
// const ChessTools = require('chess-tools');


// const ECO = require("chess-tools/eco");


// const chesslib = require('chesslib').PGN;


class ChessBook {

    constructor() {

        /*const fileContent = fs.readFileSync(__dirname + '/asm_fish_051117_64-bit_4cpu.pgn').toString();
        const parts = fileContent.split('[Event');

        parts.forEach((part) => {
          if (part.length > 0) {
            let pgn = `[Event${part}`;
            const r = chesslib.parse(pgn);

          }
        })
          */


        // const r = chesslib.parse(fileContent);
        // console.log(r[0]);
        /*
            const chess = new chessjs.Chess();
            chess.load_pgn(pgn);
            console.log('chessjs',chess.ascii());
            console.log('header',chess.header());
            console.log('moves',chess.moves({ verbose: true }));
        */
        // chess.ascii();

        // console.log(chess.load_pgn(pgn.join('\n')));
        // const OpeningBook = ChessTools.OpeningBooks.Polyglot;
        // const OpeningBook = ECO;
        // console.log("OpeningBook", OpeningBook);
        const book = new ChessTools();
        // console.log('OpeningBook', OpeningBook);
        // const book = new OpeningBook();
        // book.load_stream(fs.createReadStream(__dirname + '/asm_fish_051117_64-bit_4cpu.pgn'));
        // this.book.load_book(fs.createReadStream(__dirname + '/gm2001.bin'));


        // if (isDev()) {
        //     // book.load_book(fs.createReadStream(__dirname + '/books/gm2001.bin'));
        // } else {
        //     // book.load_book(fs.createReadStream(__dirname + '/books/book.bin'));
        // }

        // book.load_book(fs.createReadStream(__dirname + '/books/gm2001.bin'));
        book.on('loaded', () => {
            let entries = '';
            // let entries = book.find('rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq d6 0 2');
            // console.log('entries', entries);

            entries = book.find('rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1');
            console.log('entries', entries);
            // for (let entry of entries) {
            //   //See entry.ts for each module to manage data.
            // }
        });
    }

    find(fen) {

    }
}

new ChessBook();

module.exports = ChessBook;