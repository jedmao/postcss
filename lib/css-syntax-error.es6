const supportsColor = require('supports-color');
import warnOnce from './warn-once';
export default class CssSyntaxError {
    /**
     * The CSS parser throws this error for broken CSS.
     */
    constructor(
        /**
         * Contains full error text in the GNU error format.
         */
        message, 
        /**
         * Contains the source line of the error. PostCSS will use the input
         * source map to detect the original error location. If you wrote a
         * Sass file, compiled it to CSS and then parsed it with PostCSS,
         * PostCSS will show the original position in the Sass file. If you need
         * position in PostCSS input (e.g., to debug previous compiler), use
         * error.generated.line.
         */
        line, 
        /**
         * Contains the source column of the error. PostCSS will use the input
         * source map to detect the original error location. If you wrote a
         * Sass file, compiled it to CSS and then parsed it with PostCSS,
         * PostCSS will show the original position in the Sass file. If you
         * need position in PostCSS input (e.g., to debug previous compiler),
         * use error.generated.column.
         */
        column, 
        /**
         * Contains the source code of the broken file. PostCSS will use the
         * input source map to detect the original error location. If you wrote
         * a Sass file, compiled it to CSS and then parsed it with PostCSS,
         * PostCSS will show the original position in the Sass file. If you
         * need position in PostCSS input (e.g., to debug previous compiler),
         * use error.generated.source.
         */
        source, 
        /**
         * If parser's from option is set, contains the absolute path to the
         * broken file. PostCSS will use the input source map to detect the
         * original error location. If you wrote a Sass file, compiled it
         * to CSS and then parsed it with PostCSS, PostCSS will show the
         * original position in the Sass file. If you need the position in
         * PostCSS input (e.g., to debug previous compiler), use
         * error.generated.file.
         */
        file, 
        /**
         * Contains the PostCSS plugin name if the error didn't come from the
         * CSS parser.
         */
        plugin) {
        this.message = message;
        this.line = line;
        this.column = column;
        this.source = source;
        this.file = file;
        this.plugin = plugin;
        this.name = 'CssSyntaxError';
        this.reason = message;
        if (typeof line === 'undefined' || typeof column === 'undefined') {
            delete this.line;
            delete this.column;
        }
        this.setMessage();
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CssSyntaxError);
        }
    }
    setMessage() {
        this.message = this.plugin ? this.plugin + ': ' : '';
        this.message += this.file ? this.file : '<css input>';
        if (typeof this.line !== 'undefined') {
            this.message += ':' + this.line + ':' + this.column;
        }
        this.message += ': ' + this.reason;
    }
    /**
     * @param color Whether arrow should be colored red by terminal color codes.
     * By default, PostCSS will use process.stdout.isTTY and
     * process.env.NODE_DISABLE_COLORS.
     * @returns A few lines of CSS source that caused the error. If CSS has
     * input source map without sourceContent this method will return an empty
     * string.
     */
    showSourceCode(color) {
        if (!this.source)
            return '';
        let num = this.line - 1;
        let lines = this.source.split('\n');
        let prev = num > 0 ? lines[num - 1] + '\n' : '';
        let broken = lines[num];
        let next = num < lines.length - 1 ? '\n' + lines[num + 1] : '';
        let mark = '\n';
        for (let i = 0; i < this.column - 1; i++) {
            mark += ' ';
        }
        if (typeof color === 'undefined')
            color = supportsColor;
        if (color) {
            mark += '\x1B[1;31m^\x1B[0m';
        }
        else {
            mark += '^';
        }
        return '\n' + prev + broken + mark + next;
    }
    /**
     *
     * @returns Error position, message and source code of broken part.
     */
    toString() {
        return this.name + ': ' + this.message + this.showSourceCode();
    }
    /* istanbul ignore next */
    get generated() {
        warnOnce('CssSyntaxError#generated is deprecated. Use input instead.');
        return this.input;
    }
}
