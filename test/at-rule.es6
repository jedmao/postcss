import AtRule from '../lib/at-rule';
import parse  from '../lib/parse';

import expect from './sinon-chai';
import sinon  from 'sinon';

describe('AtRule', () => {

    it('initializes with properties', () => {
        let rule = new AtRule({ name: 'encoding', params: '"utf-8"' });

        expect(rule.name).to.eql('encoding');
        expect(rule.params).to.eql('"utf-8"');

        expect(rule.toString()).to.eql('@encoding "utf-8"');
    });

    describe('prepend()', () => {

        it('prepends child', () => {
            let rule = parse('@a { a: 1; b: 2 }').first;
            rule.prepend({ prop: 'c', value: '3' });
            expect(rule.toString()).to.eql('@a { c: 3; a: 1; b: 2 }');
            expect(rule.first.raws.before).to.eql(' ');
        });

        it('prepends a child w/o initial nodes', () => {
            let rule = new AtRule({ name: 'a' });
            rule.prepend({ prop: 'a', value: '1' });
            expect(rule.toString()).to.eql('@a {\n    a: 1\n}');
        });

    });

    describe('insertBefore()', () => {

        it('inserts a child', () => {
            let rule = parse('@a { a: 1; b: 2 }').first;
            rule.insertBefore(1, { prop: 'c', value: '3' });
            expect(rule.toString()).to.eql('@a { a: 1; c: 3; b: 2 }');
        });

        it('inserts a child w/o initial nodes', () => {
            let rule = new AtRule({ name: 'a' });
            rule.insertBefore(1, { prop: 'a', value: '1' });
            expect(rule.toString()).to.eql('@a {\n    a: 1\n}');
        });

    });

    describe('insertAfter()', () => {

        it('inserts a child', () => {
            let rule = parse('a { a: 1; b: 2 }').first;
            rule.insertAfter(0, { prop: 'c', value: '3' });
            expect(rule.toString()).to.eql('a { a: 1; c: 3; b: 2 }');
        });

        it('inserts a child w/o initial nodes', () => {
            let rule = new AtRule({ name: 'a' });
            rule.insertAfter(0, { prop: 'a', value: '1' });
            expect(rule.toString()).to.eql('@a {\n    a: 1\n}');
        });

    });

    describe('toString()', () => {

        it('inserts default spaces', () => {
            let rule = new AtRule({ name: 'page', params: 1, nodes: [] });
            expect(rule.toString()).to.eql('@page 1 {}');
        });

        it('clone spaces from another at-rule', () => {
            let root = parse('@page{}a{}');
            let rule = new AtRule({ name: 'page', params: 1, nodes: [] });
            root.append(rule);

            expect(rule.toString()).to.eql('@page 1{}');
        });

    });

    describe('deprecation warnings', () => {

        sinon.spy(console, 'warn');

        afterEach(() => {
            console.warn.reset();
        });

        after(() => {
            console.warn.restore();
        });

        it('warns afterName getter is deprecated', () => {
            const rule = new AtRule();
            rule.afterName;
            expect(console.warn).to.have.been.calledOnce.and.calledWithExactly(
                'AtRule#afterName was deprecated. Use AtRule#raws.afterName');
        });

        it('warns afterName setter is deprecated', () => {
            const rule = new AtRule();
            rule.afterName = 'foo';
            expect(console.warn).to.have.been.calledOnce.and.calledWithExactly(
                'AtRule#afterName was deprecated. Use AtRule#raws.afterName');
        });

        // it('warns afterName(val) is deprecated', () => {
        //     new AtRule().afterName('foo');
        //     expect(console.warn).to.have.been.calledWith(
        //         'AtRule#afterName was deprecated. Use AtRule#raws.afterName');
        // });

        // it('warns params() is deprecated', () => {
        //     new AtRule().params;
        //     expect(console.warn).to.have.been.calledWith(
        //         'AtRule#params was deprecated. Use AtRule#raws.params');
        // });

        // it('warns params(val) is deprecated', () => {
        //     new AtRule().params('foo');
        //     expect(console.warn).to.have.been.calledWith(
        //         'AtRule#params was deprecated. Use AtRule#raws.params');
        // });

    });

});
