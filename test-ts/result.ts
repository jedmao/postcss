///<reference path="../typings/tsd.d.ts" />
import LazyResult from '../lib-ts/lazy-result';
import Warning    from '../lib-ts/warning';
import postcss    from '../lib-ts/postcss';
import Result     from '../lib-ts/result';

import { expect } from 'chai';

describe('Result', () => {

    describe('toString()', () => {

        it('stringifies', () => {
            let result = new Result();
            result.css = 'a{}';
            expect('' + result).to.eql(result.css);
        });

    });

    describe('warn()', () => {

        it('adds warning', () => {
            let plugin = postcss.plugin('test-plugin', () => {
                return (css, res) => {
                    res.warn('test', { node: css.first });
                };
            });
            let result = (<LazyResult>postcss([plugin]).process('a{}')).sync();

            expect(result.messages).to.eql([
                new Warning('test', {
                    plugin: 'test-plugin',
                    node:   result.root.first
                })
            ]);
        });

        it('allows to override plugin', () => {
            let plugin = postcss.plugin('test-plugin', () => {
                return (css, res) => {
                    res.warn('test', { plugin: 'test-plugin#one' });
                };
            });
            let result = (<LazyResult>postcss([plugin]).process('a{}')).sync();

            expect(result.messages[0].plugin).to.eql('test-plugin#one');
        });

        it('allows Root', () => {
            let result = new Result();
            let root   = postcss.parse('a{}');
            result.warn('TT', { node: root });

            expect(result.messages[0].toString()).to.eql('<css input>:1:1: TT');
        });

    });

    describe('warnings()', () => {

        it('returns only warnings', () => {
            let result = new Result();
            result.messages = [{ type: 'warning', text: 'a' },
                               { type: 'custom' },
                               { type: 'warning', text: 'b' }];
            expect(result.warnings()).to.eql([{ type: 'warning', text: 'a' },
                                              { type: 'warning', text: 'b' }]);
        });

    });

});
