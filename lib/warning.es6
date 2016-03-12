export default class Warning {
    /**
     * Represents a plugin warning. It can be created using Node#warn().
     */
    constructor(
        /**
         * Contains the warning message.
         */
        text, options = {}) {
        this.text = text;
        /**
         * Returns a string representing the node's type. Possible values are
         * root, atrule, rule, decl or comment.
         */
        this.type = 'warning';
        if (options.node && options.node.source) {
            let pos = options.node.positionBy(options);
            this.line = pos.line;
            this.column = pos.column;
        }
        for (let opt in options)
            this[opt] = options[opt];
    }
    /**
     * @returns Error position, message.
     */
    toString() {
        if (this.node) {
            return this.node.error(this.text, { plugin: this.plugin }).message;
        }
        else if (this.plugin) {
            return this.plugin + ': ' + this.text;
        }
        else {
            return this.text;
        }
    }
}
