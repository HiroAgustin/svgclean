;(function (sax, path, fs)
{
  'use strict';

  module.exports = function (src, dst)
  {
    var saxStream = sax.createStream(false, {
          lowercasetags: true
        , trim: true
        })

      , writer = fs.createWriteStream(dst);

    saxStream.level = 0;
    saxStream.selfClosingTags = {};

    saxStream.engrave = function engrave (text)
    {
      writer.write(text);
      return this;
    };

    saxStream.levelUp = function levelUp ()
    {
      this.level++;
      return this;
    };

    saxStream.levelDown = function levelUp ()
    {
      this.level--;
      return this;
    };

    saxStream.nextLine = function nextLine ()
    {
      this.engrave('\n');
      return this;
    };

    saxStream.indent = function indent ()
    {
      for (var i = 0; i < this.level; i++)
      {
        this.engrave('\t');
      }

      return this;
    };

    saxStream
      .on('opentag', function (tag)
      {
        var value = null
          , attr = null
          , name = tag.name;

        if (this.isInvalid)
          return;

        if (name === 'metadata')
          return (this.isInvalid = true);

        this
          .nextLine()
          .indent()
          .levelUp()
          .engrave('<' + name);

        for (attr in tag.attributes)
        {
          if (~attr.indexOf('xml'))
            continue;

          value = decodeURI(
            encodeURI(tag.attributes[attr]).replace(/%0D|%0A|%09/gi, '')
          );

          this.engrave(' ' + attr + '="' + value + '"');
        }

        if (tag.isSelfClosing)
          this
            .engrave('/')
            .selfClosingTags[name] = true;

        this.engrave('>');
      })

      .on('closetag', function (tag)
      {
        if (tag === 'metadata')
          return (this.isInvalid = false);

        if (this.isInvalid)
          return;

        this.levelDown();

        if (!(tag in this.selfClosingTags))
        {
          this
            .nextLine()
            .indent()
            .engrave('</' + tag + '>');
        }
      })

      .on('comment', function (comment)
      {
        this
          .indent()
          .engrave('<!-- ' + comment + ' -->');
      });

    fs.createReadStream(path.join(process.cwd(), src), {
      encoding: 'utf8'
    })
    .pipe(saxStream);
  };

}(require('sax'), require('path'), require('fs')));
