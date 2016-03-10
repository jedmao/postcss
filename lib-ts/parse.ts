import LazyResult from './lazy-result';
import postcss    from './postcss';
import Parser     from './parser';
import Result     from './result';
import Input      from './input';
import Root       from './root';

/**
 * Parses source CSS.
 * @param css The CSS to parse.
 * @param options
 * @returns {} A new Root node, which contains the source CSS nodes.
 */
// ReSharper disable once UnusedLocals
function parse(
        css: string|{ toString(): string; }|LazyResult|Result,
        options?: {
            from?: string;
            map?: postcss.SourceMapOptions;
        }
    ) {
    /* istanbul ignore next */
    if (options && (<any>options).safe) {
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
module parse {
    export var parse: postcss.Syntax|postcss.Parse;
}

export default parse;
