export enum LINE_MAP {
    mate = 'm',
    score = 's',
    depth = 'd',
    pv = 'p',
    multipv = 'u',
    nodes = 'n',
    time = 't',
    nps = 'c', //
    tbhits = 'h',
    import = 'i',
    fen = 'f',
}

export interface IWorkerResponse extends IEvaluation {
    userId: string,
    fen: string
}

export interface IEvaluation {
    [LINE_MAP.mate]: string | boolean;
    [LINE_MAP.score]: string;
    [LINE_MAP.depth]: number;
    [LINE_MAP.pv]: string;
    [LINE_MAP.nodes]?: number;
    [LINE_MAP.time]?: string;
    [LINE_MAP.multipv]?: string;
    [LINE_MAP.nps]?: string;
    [LINE_MAP.tbhits]?: string;
    [LINE_MAP.import]?: number;
}

