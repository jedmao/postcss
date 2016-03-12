import Parser from './parser';
import Input from './input';
/**
 * Parses source CSS.
 * @param css The CSS to parse.
 * @param options
 * @returns {} A new Root node, which contains the source CSS nodes.
 */
// ReSharper disable once UnusedLocals
function parse(css, options) {
    /* istanbul ignore next */
    if (options && options.safe) {
        throw new Error('Option safe was removed. ' +
            'Use parser: require("postcss-safe-parser")');
    }
    let input = new Input(css, options);
    let parser = new Parser(input);
    parser.tokenize();
    parser.loop();
    return parser.root;
}
// ReSharper disable once InconsistentNaming
var parse;
(function (parse_1) {
})(parse || (parse = {}));
export default parse;
