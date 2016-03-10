///<reference path="../typings/tsd.d.ts" />
import LazyResult from '../lib-ts/lazy-result';
import Processor  from '../lib-ts/processor';

const    mozilla = require('source-map');
import { expect }  from 'chai';

let processor = new Processor();

describe('LazyResult', () => {

    describe('root', () => {

        it('contains AST', () => {
            let result = new LazyResult(processor, 'a {}', { });
            expect(result.root.type).to.eql('root');
        });

    });

    describe('css', () => {

        it('will be stringified', () => {
            let result = new LazyResult(processor, 'a {}', { });
            expect(result.css).to.eql('a {}');
        });

        it('stringifies', () => {
            let result = new LazyResult(processor, 'a {}', { });
            expect('' + result).to.eql(result.css);
        });

    });

    describe('content', () => {

        it('is alias for css', () => {
            let result = new LazyResult(processor, 'a {}', { });
            expect(result.content).to.eql('a {}');
        });

    });

    describe('map', () => {

        it('exists only if necessary', () => {
            let result = new LazyResult(processor, '', { });
            expect(result.map).to.not.exist;

            result = new LazyResult(processor, '', { });
            expect(result.map).to.not.exist;

            result = new LazyResult(processor, '', { map: { inline: false } });
            expect(result.map).to.be.a.instanceOf(mozilla.SourceMapGenerator);
        });

    });

    describe('opts', () => {

        it('contains AST', () => {
            let result = new LazyResult(processor, 'a {}', { to: 'a.css' });
            expect(result.opts).to.eql({ to: 'a.css' });
        });

    });

    describe('warnings()', () => {

        it('contains warnings', () => {
            let result = new LazyResult(processor, 'a {}', { });
            expect(result.warnings()).to.eql([]);
        });

    });

    describe('messages', () => {

        it('contains messages', () => {
            let result = new LazyResult(processor, 'a {}', { });
            expect(result.messages).to.eql([]);
        });

    });

});
