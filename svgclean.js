;(function (sax, path, fs)
{
  'use strict';

  // module.exports = function ()
  // {
    var writer = fs.createWriteStream(process.argv[3])

      , saxStream = sax.createStream(false, {
          lowercasetags: true
        , trim: true
        })

      , isInvalid = false

      , i = 0;

    saxStream.level = 0;

    saxStream.isSelfClosing = function isSelfClosing (tag)
    {
      return !~['svg', 'g'].indexOf(tag);
    };

    saxStream.indent = function indent ()
    {
      for (i = 0; i < this.level; i++)
      {
        writer.write('\t');
      }
    };

    saxStream.on('opentag', function (tag)
    {
      var value = null
        , attr = null
        , name = tag.name;

      if (isInvalid)
        return;

      if (name === 'metadata')
        return (isInvalid = true);

      writer.write('\n');
      this.indent();
      this.level++;

      writer.write('<' + name);

      for (attr in tag.attributes)
      {
        value = decodeURI(
          encodeURI(tag.attributes[attr])
          .replace(/%0D/gi, '')
          .replace(/%0A/gi, '')
          .replace(/%09/gi, '')
        );

        if (!~attr.indexOf('xml') && !(attr === 'id' && value === 'Layer_1'))
          writer.write(' ' + attr + '="' + value + '"');
      }

      if (this.isSelfClosing(name))
        writer.write('/');

      writer.write('>');
    });

    saxStream.on('closetag', function (tag)
    {
      if (tag === 'metadata')
        return (isInvalid = false);

      if (isInvalid)
        return;

      this.level--;

      if (!this.isSelfClosing(tag))
      {
        writer.write('\n');
        this.indent();
        writer.write('</' + tag + '>');
      }
    });

    saxStream.on('comment', function (comment)
    {
      this.indent();
      writer.write('<!-- ' + comment + ' -->');
    });

    fs.createReadStream(path.join(process.cwd(), process.argv[2]), {
      encoding: 'utf8'
    })
    .pipe(saxStream);
  // };

}(require('sax'), require('path'), require('fs')));
