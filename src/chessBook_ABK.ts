const fs = require("fs");
// const ChessTools = require('./libs/polyglot');
import {Polyglot} from "./libs/polyglot";

const ChessTools = require("chess-tools");

const polyglot = new Polyglot();
const fen = "rnbqkbnr/pp2pppp/2p5/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3";

const hash = polyglot.generate_hash(fen);
console.log({hash});


setTimeout(() => {

    const OpeningBookABK = ChessTools.OpeningBooks.ABK;
    const OpeningBookCTG = ChessTools.OpeningBooks.CTG;
    const book = new OpeningBookABK();


    const fileContent = fs.createReadStream(__dirname + "/books/Perfect2018.abk");


    const bookCTG = new OpeningBookCTG();
    const fileContentCTG = fs.createReadStream(__dirname + "/books/Perfect2018.ctg");

    bookCTG.load_book(fileContentCTG);
    bookCTG.on("loaded", () => {

        console.log("On loaded CTG");

        let entries = bookCTG.find(fen);
        console.log(entries.book_moves);
        console.log(entries.ratings);
        // for (let entry of entries) {
        //     console.log(entry);
        //     //See entry.js for each module to manage data.
        // }
    });


    // console.log('load_book');
    // book.load_book(fileContent);
    //
    // book.on("loaded", ()=> {
    //
    //     console.log('On loaded');
    //
    //     let entries = book.find(fen);
    //     console.log({entries});
    //     // for (let entry of entries) {
    //     //     console.log(entry);
    //     //     //See entry.js for each module to manage data.
    //     // }
    // });

// const ECO = require("chess-tools/eco");


// const chesslib = require('chesslib').PGN;


}, 10000);
