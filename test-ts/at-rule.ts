///<reference path="../typings/tsd.d.ts" />
import AtRule from '../lib-ts/at-rule';
import parse  from '../lib-ts/parse';

import { expect } from 'chai';

describe('AtRule', () => {

    it('initializes with properties', () => {
        let rule = new AtRule({ name: 'encoding', params: '"utf-8"' });

        expect(rule.name).to.eql('encoding');
        expect(rule.params).to.eql('"utf-8"');

        expect(rule.toString()).to.eql('@encoding "utf-8"');
    });

    describe('each()', () => {

        it('does not fall on childless at-rule', () => {
            let rule = new AtRule();
            expect(rule.each( i => i )).to.be.an('undefined');
        });

    });

    describe('prepend()', () => {

        it('creates nodes property', () => {
            let rule = new AtRule();
            expect(rule.nodes).to.not.exist;

            rule.prepend('color: black');
            expect(rule.nodes).to.have.length(1);
        });

    });

    describe('append()', () => {

        it('creates nodes property', () => {
            let rule = new AtRule();
            expect(rule.nodes).to.not.exist;

            rule.append('color: black');
            expect(rule.nodes).to.have.length(1);
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

});
