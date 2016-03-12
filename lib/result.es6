import Warning from './warning';
export default class Result {
    /**
     * Provides the result of the PostCSS transformations.
     */
    constructor(
        /**
         * The Processor instance used for this transformation.
         */
        processor, 
        /**
         * Contains the Root node after all transformations.
         */
        root, 
        /**
         * Options from the Processor#process(css, opts) or Root#toResult(opts) call
         * that produced this Result instance.
         */
        opts) {
        this.processor = processor;
        this.root = root;
        this.opts = opts;
        /**
         * Contains messages from plugins (e.g., warnings or custom messages).
         * Add a warning using Result#warn() and get all warnings
         * using the Result#warnings() method.
         */
        this.messages = [];
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
    warn(message, options = {}) {
        if (!options.plugin) {
            if (this.lastPlugin && this.lastPlugin.postcssPlugin) {
                options.plugin = this.lastPlugin.postcssPlugin;
            }
        }
        this.messages.push(new Warning(message, options));
    }
    /**
     * @returns Warnings from plugins, filtered from messages.
     */
    warnings() {
        return this.messages.filter(i => i.type === 'warning');
    }
    /**
     * Alias for css property to use with syntaxes that generate non-CSS output.
     */
    get content() {
        return this.css;
    }
}
