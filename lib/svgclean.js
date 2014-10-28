;(function (svgread, svgparse, svgwrite)
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

    svgread(src, function (tree)
    {
      svgwrite(
        dst
      , svgparse(tree)
      , callback
      );
    });
  }

  module.exports = function (src, dst, callback)
  {
    return new SvgCleaner(src, dst, callback);
  };

}(require('./svgread'), require('./svgparse'), require('./svgwrite')));
