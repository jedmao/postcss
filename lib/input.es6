import CssSyntaxError from './css-syntax-error';
import PreviousMap from './previous-map';
import { resolve } from 'path';
let sequence = 0;
export default class Input {
    /**
     * Represents the source CSS.
     */
    constructor(css, opts = {}) {
        this.css = css.toString();
        if (this.css[0] === '\uFEFF' || this.css[0] === '\uFFFE') {
            this.css = this.css.slice(1);
        }
        if (opts.from)
            this.file = resolve(opts.from);
        let map = new PreviousMap(this.css, opts);
        if (map.text) {
            this.map = map;
            let file = map.consumer().file;
            if (!this.file && file)
                this.file = this.mapResolve(file);
        }
        if (!this.file) {
            sequence += 1;
            this.id = '<input css ' + sequence + '>';
        }
        if (this.map)
            this.map.file = this.from;
    }
    /**
     * The CSS source identifier. Contains input.file if the user set the "from"
     * option, or input.id if they did not.
     */
    get from() {
        return this.file || this.id;
    }
    error(message, line, column, opts = {}) {
        let result;
        let origin = this.origin(line, column);
        if (origin) {
            result = new CssSyntaxError(message, origin.line, origin.column, origin.source, origin.file, opts.plugin);
        }
        else {
            result = new CssSyntaxError(message, line, column, this.css, this.file, opts.plugin);
        }
        result.input = { line, column, source: this.css };
        if (this.file)
            result.input.file = this.file;
        return result;
    }
    /**
     * Reads the input source map.
     * @returns A symbol position in the input source (e.g., in a Sass file
     * that was compiled to CSS before being passed to PostCSS):
     */
    origin(line, column) {
        if (!this.map)
            return null;
        let consumer = this.map.consumer();
        let from = consumer.originalPositionFor({ line, column });
        if (!from.source)
            return null;
        let file = this.mapResolve(from.source);
        let result = {
            file,
            line: from.line,
            column: from.column,
            source: consumer.sourceContentFor(from.source)
        };
        if (!result.source)
            delete result.source;
        return result;
    }
    mapResolve(file) {
        return resolve(this.map.consumer().sourceRoot || '.', file);
    }
}
