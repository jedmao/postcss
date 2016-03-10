import LazyResult  from './lazy-result';
import postcss     from './postcss';
import Result      from './result';

export default class Processor implements postcss.Processor {

    /**
     * Contains the current version of PostCSS (e.g., "5.0.19").
     */
    version: '5.0.19';

    /**
     * Contains plugins added to this processor.
     */
    plugins: postcss.Plugin<any>[];

    constructor(plugins: (typeof postcss.acceptedPlugin)[] = []) {
        this.plugins = this.normalize(plugins);
    }

    /**
     * Adds a plugin to be used as a CSS processor. Plugins can also be
     * added by passing them as arguments when creating a postcss instance.
     */
    use(plugin: typeof postcss.acceptedPlugin) {
        this.plugins = this.plugins.concat(this.normalize([plugin]));
        return this;
    }

    /**
     * Parses source CSS. Because some plugins can be asynchronous it doesn't
     * make any transformations. Transformations will be applied in LazyResult's
     * methods.
     * @param css Input CSS or any object with toString() method, like a file
     * stream. If a Result instance is passed the processor will take the
     * existing Root parser from it.
     */
    process(
        css: string|{ toString(): string; }|Result,
        options: postcss.ProcessOptions = {}
    ) {
        return new LazyResult(this, css, options);
    }

    private normalize(plugins: (typeof postcss.acceptedPlugin)[]) {
        let normalized = [];
        for (let i of plugins) {
            if ((<postcss.Plugin<any>>i).postcss) {
                i = (<postcss.Plugin<any>>i).postcss;
            }

            if (typeof i === 'object' && Array.isArray((<Processor>i).plugins)) {
                normalized = normalized.concat((<Processor>i).plugins);
            } else if ( typeof i === 'function' ) {
                normalized.push(i);
            } else {
                throw new Error(`${i} is not a PostCSS plugin`);
            }
        }
        return normalized;
    }

}
