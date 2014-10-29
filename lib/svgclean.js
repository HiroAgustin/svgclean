;(function (read, parse, write)
{
  'use strict';

  module.exports = function (src, dst, callback)
  {
    if (typeof dst === 'function')
      callback = dst;

    if (!dst || typeof dst !== 'string')
      dst = src;

    if (!callback || typeof callback !== 'function')
      callback = function (){};

    read(src, function (tree)
    {
      write(
        dst
      , parse(tree)
      , callback
      );
    });
  };

}(require('./read'), require('./parse'), require('./write')));
