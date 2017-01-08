import MapGenerator from './map-generator';
import Processor    from './processor';
import stringify    from './stringify';
import warnOnce     from './warn-once';
import postcss      from './postcss';
import Result       from './result';
import parse        from './parse';
import Node         from './node';
import Root         from './root';

function isPromise(obj) {
    return typeof obj === 'object' && typeof obj.then === 'function';
}

export default class LazyResult implements postcss.LazyResult {

    private stringified = false;
    private processed = false;
    private result: Result;
    private error: Error;
    private plugin: number;
    private processing: Function;

    /**
     * A promise proxy for the result of PostCSS transformations.
     */
    constructor(
        processor: Processor,
        /**
         * String with input CSS or any object with toString() method, like a Buffer.
         * Optionally, send Result instance and the processor will take the existing
         * [Root] parser from it.
         */
        css: string|{ toString(): string; }|LazyResult|Result,
        opts: postcss.ProcessOptions = {}
    ) {
        this.stringified = false;
        this.processed   = false;

        let root;
        if ( typeof css === 'object' && (<Node>css).type === 'root' ) {
            root = css;
        } else if ( css instanceof LazyResult || css instanceof Result ) {
            root = css.root;
            if ( css.map ) {
                if ( typeof opts.map === 'undefined' ) opts.map = { };
                if ( !opts.map.inline ) opts.map.inline = false;
                opts.map.prev = css.map;
            }
        } else {
            let parser = parse;
            if ( opts.syntax )  parser = <any>opts.syntax.parse;
            if ( opts.parser )   parser = <any>opts.parser;
            if ( parser.parse ) parser = <any>parser.parse;

            try {
                root = parser(css, opts);
            } catch (error) {
                this.error = error;
            }
        }

        this.result = new Result(processor, root, opts);
    }

    /**
     * @returns A processor used for CSS transformations.
     */
    get processor() {
        return this.result.processor;
    }

    /**
     * @returns Options from the Processor#process(css, opts) call that produced
     * this Result instance.
     */
    get opts() {
        return this.result.opts;
    }

    /**
     * Processes input CSS through synchronous plugins and converts Root to a
     * CSS string. This property will only work with synchronous plugins. If
     * the processor contains any asynchronous plugins it will throw an error.
     * In this case, you should use LazyResult#then() instead.
     */
    get css() {
        return this.stringify().css;
    }

    /**
     * Alias for css property to use when syntaxes generate non-CSS output.
     */
    get content() {
        return this.stringify().content;
    }

    /**
     * Processes input CSS through synchronous plugins. This property will
     * only work with synchronous plugins. If the processor contains any
     * asynchronous plugins it will throw an error. In this case, you should
     * use LazyResult#then() instead.
     */
    get map() {
        return this.stringify().map;
    }

    /**
     * Processes input CSS through synchronous plugins. This property will only
     * work with synchronous plugins. If the processor contains any asynchronous
     * plugins it will throw an error. In this case, you should use
     * LazyResult#then() instead.
     */
    get root() {
        return this.sync().root;
    }

    /**
     * Processes input CSS through synchronous plugins. This property will only
     * work with synchronous plugins. If the processor contains any asynchronous
     * plugins it will throw an error. In this case, you should use
     * LazyResult#then() instead.
     */
    get messages() {
        return this.sync().messages;
    }

    /**
     * Processes input CSS through synchronous plugins and calls Result#warnings().
     * This property will only work with synchronous plugins. If the processor
     * contains any asynchronous plugins it will throw an error. In this case, you
     * You should use LazyResult#then() instead.
     */
    warnings() {
        return this.sync().warnings();
    }

    /**
     * Alias for css property.
     */
    toString() {
        return this.css;
    }

    /**
     * Processes input CSS through synchronous and asynchronous plugins.
     * @param onRejected Called if any plugin throws an error.
     */
    then(
        onFulfilled: (result: postcss.Result) => void,
        onRejected?: (error: Error) => void
    ): Function|any {
        return this.async().then(onFulfilled, onRejected);
    }

    /**
     * Processes input CSS through synchronous and asynchronous plugins.
     * @param onRejected Called if any plugin throws an error.
     */
    catch(onRejected: (error: Error) => void): Function|any {
        return this.async().catch(onRejected);
    }

    private handleError(error, plugin) {
        try {
            this.error = error;
            if ( error.name === 'CssSyntaxError' && !error.plugin ) {
                error.plugin = plugin.postcssPlugin;
                error.setMessage();
            } else if ( plugin.postcssVersion ) {
                let pluginName = plugin.postcssPlugin;
                let pluginVer  = plugin.postcssVersion;
                let runtimeVer = this.result.processor.version;
                let a = pluginVer.split('.');
                let b = runtimeVer.split('.');

                if ( a[0] !== b[0] || parseInt(a[1]) > parseInt(b[1]) ) {
                    warnOnce('Your current PostCSS version ' +
                             'is ' + runtimeVer + ', but ' + pluginName + ' ' +
                             'uses ' + pluginVer + '. Perhaps this is ' +
                             'the source of the error below.');
                }
            }
        } catch (err) {
            /* istanbul ignore next */
            if ( console && console.error ) console.error(err);
        }
    }

    private asyncTick(resolve, reject) {
        if ( this.plugin >= this.processor.plugins.length ) {
            this.processed = true;
            return resolve();
        }

        try {
            let plugin  = this.processor.plugins[this.plugin];
            let promise = this.run(plugin);
            this.plugin += 1;

            if ( isPromise(promise) ) {
                promise.then( () => {
                    this.asyncTick(resolve, reject);
                }).catch( error => {
                    this.handleError(error, plugin);
                    this.processed = true;
                    reject(error);
                });
            } else {
                this.asyncTick(resolve, reject);
            }

        } catch (error) {
            this.processed = true;
            reject(error);
        }
    }

    private async(): Function|any {
        if ( this.processed ) {
            return new Promise( (resolve, reject) => {
                if ( this.error ) {
                    reject(this.error);
                } else {
                    resolve(this.stringify());
                }
            });
        }
        if ( this.processing ) {
            return this.processing;
        }

        this.processing = <any>new Promise( (resolve, reject) => {
            if ( this.error ) return reject(this.error);
            this.plugin = 0;
            this.asyncTick(resolve, reject);
        }).then( () => {
            this.processed = true;
            return this.stringify();
        });

        return this.processing;
    }

    sync() {
        if ( this.processed ) return this.result;
        this.processed = true;

        if ( this.processing ) {
            throw new Error(
                'Use process(css).then(cb) to work with async plugins');
        }

        if ( this.error ) throw this.error;

        for ( let plugin of this.result.processor.plugins ) {
            let promise = this.run(plugin);
            if ( isPromise(promise) ) {
                throw new Error(
                    'Use process(css).then(cb) to work with async plugins');
            }
        }

        return this.result;
    }

    private run(plugin) {
        this.result.lastPlugin = plugin;

        try {
            return plugin(this.result.root, this.result);
        } catch (error) {
            this.handleError(error, plugin);
            throw error;
        }
    }

    stringify() {
        if ( this.stringified ) return this.result;
        this.stringified = true;

        this.sync();

        let opts = this.result.opts;
        let str  = stringify;
        if ( opts.syntax )      str = <any>opts.syntax.stringify;
        if ( opts.stringifier ) str = <any>opts.stringifier;
        if ( str.stringify )    str = <any>str.stringify;

        let map  = new MapGenerator(str, <any>this.result.root, this.result.opts);
        let data = map.generate();
        this.result.css = data[0];
        this.result.map = data[1];

        return this.result;
    }

}
