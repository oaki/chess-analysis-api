export const optionsGood = {
    ops: {
        interval: 10000
    },
    reporters: {
        myFileReporter: [{
            module: 'good-squeeze',
            name: 'Squeeze',
            args: [{
                ops: '*',
                error: '*',
                response: '*',
                request: '*'
            }]
        }, {
            module: 'good-squeeze',
            name: 'SafeJson'
        }, {
            module: 'good-file',
            args: ['./log/hapilog.log']
        }],
    }

};