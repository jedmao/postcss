import postcss from './postcss';
import Node    from './node';

export default class Warning implements postcss.Warning {
    /**
     * Returns a string representing the node's type. Possible values are
     * root, atrule, rule, decl or comment.
     */
    type = 'warning';

    /**
     * Contains the name of the plugin that created this warning. When you
     * call Node#warn(), it will fill this property automatically.
     */
    plugin: string;

    /**
     * The CSS node that caused the warning.
     */
    node: Node;

    /**
     * The line in the input file with this warning's source.
     */
    line: number;

    /**
     * Column in the input file with this warning's source.
     */
    column: number;

    /**
     * Represents a plugin warning. It can be created using Node#warn().
     */
    constructor(
        /**
         * Contains the warning message.
         */
        public text: string,
        options: postcss.WarningOptions = {}
    ) {
        if ( options.node && options.node.source ) {
            let pos     = (<Node>options.node).positionBy(options);
            this.line   = pos.line;
            this.column = pos.column;
        }

        for (let opt in options) this[opt] = options[opt];
    }

    /**
     * @returns Error position, message.
     */
    toString() {
        if ( this.node ) {
            return this.node.error(this.text, { plugin: this.plugin }).message;
        } else if ( this.plugin ) {
            return this.plugin + ': ' + this.text;
        } else {
            return this.text;
        }
    }

}
