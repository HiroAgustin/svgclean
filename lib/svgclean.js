;(function (sax, path, fs)
{
  'use strict';

  module.exports = function (src, dst)
  {
    var writer = fs.createWriteStream(dst || src)

      , saxStream = sax.createStream(false, {
          lowercasetags: true
        , trim: true
      })

      , selfClosingTags = {}

      , isInvalid = false

      , i = 0;

    saxStream.level = 0;

    saxStream.engrave = function engrave (text)
    {
      return writer.write(text);
    };

    saxStream.nextLine = function nextLine ()
    {
      this.engrave('\n');
    };

    saxStream.indent = function indent ()
    {
      for (i = 0; i < this.level; i++)
      {
        this.engrave('\t');
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

      this.nextLine();
      this.indent();
      this.level++;

      this.engrave('<' + name);

      for (attr in tag.attributes)
      {
        if (~attr.indexOf('xml') || attr === 'id')
          continue;

        value = decodeURI(
          encodeURI(tag.attributes[attr])
          .replace(/%0D/gi, '')
          .replace(/%0A/gi, '')
          .replace(/%09/gi, '')
        );

        this.engrave(' ' + attr + '="' + value + '"');
      }

      if (tag.isSelfClosing)
      {
        selfClosingTags[name] = true;
        this.engrave('/');
      }

      this.engrave('>');
    });

    saxStream.on('closetag', function (tag)
    {
      if (tag === 'metadata')
        return (isInvalid = false);

      if (isInvalid)
        return;

      this.level--;

      if (!(tag in selfClosingTags))
      {
        this.nextLine();
        this.indent();
        this.engrave('</' + tag + '>');
      }
    });

    saxStream.on('comment', function (comment)
    {
      this.indent();
      this.engrave('<!-- ' + comment + ' -->');
    });

    fs.createReadStream(path.join(process.cwd(), src), {
      encoding: 'utf8'
    })
    .pipe(saxStream);
  };

}(require('sax'), require('path'), require('fs')));
