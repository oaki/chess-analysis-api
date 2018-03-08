export function pairValues(name, str) {
    const tmp = str.split(' ');

    const namePosition = tmp.indexOf(name);

    if (namePosition === -1) {
        return false;
    }

    if (name === 'pv') {
        const tmpArr = tmp.splice(namePosition + 1);
        return tmpArr.join(' ');
    }
    return tmp[namePosition + 1];
}

export function countPieces(fen:string){
    //example
    //3R4/6k1/5pP1/8/7P/8/r4PK1/8 b - h3 0 36
    // rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR
    const arr = fen.split(' ');
    const mainPart = arr[0];

    // 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'.match(/r|n|b|q|k|p|R|N|B|Q|K|P/g)
    return mainPart.match(/r|n|b|q|k|p|R|N|B|Q|K|P/g).length;

}


/*
export function parseLine(lineStr) {
    const obj = {};
    obj[LINE_MAP.mate] = pairValues('mate', lineStr); // mate
    obj[LINE_MAP.score] = parseFloat(pairValues('cp', lineStr)) / 100; //score
    obj[LINE_MAP.depth] = pairValues('depth', lineStr);
    obj[LINE_MAP.pv] = pairValues('pv', lineStr);
    // obj[LINE_MAP.multipv] = pairValues('multipv', lineStr);
    obj[LINE_MAP.nodes] = pairValues('nodes', lineStr);
    obj[LINE_MAP.time] = pairValues('time', lineStr);
    obj[LINE_MAP.nps] = pairValues('nps', lineStr);

    return obj;
}


export function parseResult(result) {
    // console.log('result', result);
    if (result.indexOf('info') === -1) {
        return false;
    }
    let lines = result.split('\n');
    lines = lines.filter(line => line.indexOf('info') !== -1 && line.indexOf('pv') !== -1);
    if (lines.length < 1) {
        return false;
    }

    const output = [];

    lines.forEach((line) => {
        const r = parseLine(line);
        output[parseInt(r.multipv, 10) - 1] = r;
    });
    return output;
}
*/

export function getFirstMove(pv) {
    return pv.substr(0, 4);
}
