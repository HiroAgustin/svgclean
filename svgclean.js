;(function (sax, path, fs)
{
  'use strict';

  // module.exports = function ()
  // {
    var writer = fs.createWriteStream(process.argv[3])

      , printer = sax.createStream(false, {
          lowercasetags: true
        , trim: true
        })

      , inavlidTags = ['metadata', 'sfw', 'slices', 'slicesourcebounds']

      , i = 0;

    printer.level = 0;

    printer.indent = function indent ()
    {
      for (i = 0; i < this.level; i++)
      {
        writer.write('  ');
      }
    };

    printer.on('opentag', function (tag)
    {
      var value = null
        , attr = null;

      if (~inavlidTags.indexOf(tag.name))
        return;

      this.indent();
      this.level++;

      writer.write('<' + tag.name);

      for (attr in tag.attributes)
      {
        value = tag.attributes[attr];

        if (!~attr.indexOf('xml') && !(attr === 'id' && value === 'Layer_1'))
          writer.write(' ' + attr + '="' + value + '"');
      }

      writer.write('>\n');
    });

    printer.on('closetag', function (tag)
    {
      if (~inavlidTags.indexOf(tag))
        return;

      this.level--;
      this.indent();
      writer.write('</' + tag + '>\n');
    });

    fs.createReadStream(path.join(process.cwd(), process.argv[2]), {
      encoding: 'utf8'
    })
    .pipe(printer);
  // };

}(require('sax'), require('path'), require('fs')));
