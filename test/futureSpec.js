'use strict';

const chai = require('chai');
const {Future} = require('../index.js');

const {expect} = chai;

describe('Future', function() {
  it('executes passed function only after a fork has been called', function(done){
    var executed = false;
    var f = new Future(function(reject, resolve) {
      executed = true;
      resolve(1);
    });

    expect(executed).to.equal(false);

    f.fork(function(e){ throw new Error('Error'); },
           function(data) {
             expect(data).to.equal(1);
             expect(executed).to.equal(true);
             done();
           });
  });

  it('maps with a function and returns another future, linking the forks', function(done) {
    var f = new Future(function(reject, resolve) {
      resolve(1);
    });

    var f2 = f.map((x) => x + 1);

    f2.fork((e) => {throw new Error('Error');},
            (data) => {
              expect(data).to.equal(2);
              done();
            });
  });

  it('can map arbitrarily', function(done) {
    var f = new Future(function(reject, resolve) {
      resolve(1);
    });

    var f2 = f.map(x => x + 1)
              .map(x => x * 2);

    f2.fork(e => {throw new Error('Error');},
            data => {
              expect(data).to.equal(4);
              done();
            });
  });

  it('can chain', function(done) {
    var f = new Future(function(reject, resolve) {
      resolve(1);
    });

    var f2 = f.map(x => x + 1)
              .chain(x => new Future(function(reject, resolve) { resolve(x + 1) }));

    f2.fork(e => {throw new Error('Error');},
            data => {
              expect(data).to.equal(3);
              done();
            });
  });

  it('is apply', function(done) {
    var f = Future.of(x => y => x + y).ap(Future.of(1)).ap(Future.of(2));
    f.fork(e => {throw new Error('Error')},
           data => {
             expect(data).to.equal(3);
             done();
           });
  });

  it('is applicative', function(done) {
    var f = Future.of(1);
    f.fork(e => {throw new Error('Error')},
           data => {
             expect(data).to.equal(1);
             done();
           });
  });

  it('can join multiple futures into a single one', function(done) {
    var fs = [Future.of(1), Future.of(2), Future.of(3)];

    var res = Future.all(fs);

    res.fork(e => {throw new Error('Error')},
             data => {
               expect(data).to.deep.equal([1, 2, 3]);
               done();
             });
  });

  it('rejects with first failure if calls Future.all and some future fails', function(done) {
    let rejects = (x, time) => new Future((reject, _) => setTimeout(() => reject(x), time));

    let fs = [Future.of(1), rejects(2, 100), rejects(3, 50)];
    let res = Future.all(fs);

    res.fork(e => {
      expect(e).to.deep.equal(3);
      done();
    },
      data => {throw new Error('Should be error')});

  });
});
