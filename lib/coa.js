;(function (coa, fs, PKG, Svgclean)
{
  'use strict';

  module.exports = coa.Cmd()
    .name(PKG.name).title(PKG.description)
    .helpful()
    .opt()
      .name('version').title('Version')
      .short('v').long('version')
      .only().flag()
      .act(function ()
      {
        return PKG.version;
      })
      .end()
    .opt()
      .name('input').title('Input file')
      .short('i').long('input')
      .val(function (val)
      {
        return val || this.reject('Option --input must have a value.');
      })
      .end()
    .opt()
      .name('output').title('Output file (by default the same as the input)')
      .short('o').long('output')
      .val(function (val)
      {
        return val || this.reject('Option --output must have a value.');
      })
      .end()
    .arg()
      .name('input').title('Alias to --input')
      .end()
    .arg()
      .name('output').title('Alias to --output')
      .end()
    .act(function (opts, args)
    {
      var input = args && args.input ? args.input : opts.input
        , output = args && args.output ? args.output : opts.output;

      new Svgclean().clean(input, output);
    });

}(require('coa'), require('fs'), require('../package.json'), require('./svgclean')));
