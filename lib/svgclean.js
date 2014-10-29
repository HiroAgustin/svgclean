;(function (read, parse, write)
{
  'use strict';

  function SvgCleaner (src, dst, callback)
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
  }

  module.exports = function (src, dst, callback)
  {
    return new SvgCleaner(src, dst, callback);
  };

}(require('./read'), require('./parse'), require('./write')));
