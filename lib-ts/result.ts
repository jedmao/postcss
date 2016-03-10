import Processor from './processor';
import warnOnce  from './warn-once';
import Warning   from './warning';
import postcss   from './postcss';
import Root      from './root';

export default class Result implements postcss.Result {

    /**
     * A CSS string representing this Result's Root instance.
     */
    css: string;

    /**
     * An instance of the SourceMapGenerator class from the source-map library,
     * representing changes to the Result's Root instance.
     * This property will have a value only if the user does not want an inline
     * source map. By default, PostCSS generates inline source maps, written
     * directly into the processed CSS. The map property will be empty by default.
     * An external source map will be generated — and assigned to map — only if
     * the user has set the map.inline option to false, or if PostCSS was passed
     * an external input source map.
     */
    map: postcss.ResultMap;

    /**
     * Contains messages from plugins (e.g., warnings or custom messages).
     * Add a warning using Result#warn() and get all warnings
     * using the Result#warnings() method.
     */
    messages: postcss.ResultMessage[] = [];

    lastPlugin: postcss.Transformer;

    /**
     * Provides the result of the PostCSS transformations.
     */
    constructor(
        /**
         * The Processor instance used for this transformation.
         */
        public processor?: Processor,
        /**
         * Contains the Root node after all transformations.
         */
        public root?: Root,
        /**
         * Options from the Processor#process(css, opts) or Root#toResult(opts) call
         * that produced this Result instance.
         */
        public opts?: postcss.ResultOptions
    ) {
    }

    /**
     * Alias for css property.
     */
    toString() {
        return this.css;
    }

    /**
     * Creates an instance of Warning and adds it to messages.
     * @param message Used in the text property of the message object.
     * @param options Properties for Message object.
     */
    warn(message: string, options: postcss.WarningOptions = { }) {
        if ( !options.plugin ) {
            if ( this.lastPlugin && this.lastPlugin.postcssPlugin ) {
                options.plugin = this.lastPlugin.postcssPlugin;
            }
        }

        this.messages.push(new Warning(message, <any>options));
    }

    /**
     * @returns Warnings from plugins, filtered from messages.
     */
    warnings(): postcss.ResultMessage[] {
        return this.messages.filter( i => i.type === 'warning' );
    }

    /**
     * Alias for css property to use with syntaxes that generate non-CSS output.
     */
    get content() {
        return this.css;
    }

}
