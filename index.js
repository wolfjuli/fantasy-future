'use strict';

const fl = require('fantasy-land');

class Future {
  constructor(action) {
    this.action = action;
  }

  fork(err, succ) {
    this.action(err, succ);
  }

  [fl.map](fn) {
    return this.chain(x => Future.of(fn(x)));
  }

  [fl.ap](m) {
    return this.chain(fn => m.map(x => fn(x)));
  }

  [fl.chain](fn) {
    return new Future((reject, resolve) => 
      this.fork(e => reject(e),
                data => fn(data).fork(reject, resolve)));
  }

  static [fl.of](x) {
    return new Future((_, resolve) => resolve(x));
  }

  static all(futs) {
    return new Future((reject, resolve) => {
      let results = [];
      let count = 0;
      let done = false;

      futs.forEach((fut, i) => {
        fut.fork(
            error => {
              if(!done) {
                done = true;
                reject(error)
              }
            },
            result => {
              results[i] = result;
              count += 1;
              if (count === futs.length) {
                resolve(results);
              }
            })
      });

    });
  }
}

module.exports = {
  Future
};