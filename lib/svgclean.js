;(function (sax, path, fs)
{
  'use strict';

  var SvgCleaner = function SvgCleaner (src, dst)
      {
        this.writer = fs.createWriteStream(dst);
        this.saxStream = sax.createStream(false, {
          lowercasetags: true
        , trim: true
        });

        this.level = 0;
        this.selfClosingTags = {};

        this.listen();

        fs.createReadStream(path.join(process.cwd(), src), {
          encoding: 'utf8'
        })
        .pipe(this.saxStream);
      }

    , methods = {

        listen: function ()
        {
          this.saxStream
            .on('comment', this.commentHandler.bind(this))
            .on('opentag', this.opentagHandler.bind(this))
            .on('closetag', this.closetagHandler.bind(this));

          return this;
        }

      , engrave: function engrave (text)
        {
          this.writer.write(text);
          return this;
        }

      , levelUp: function levelUp ()
        {
          this.level++;
          return this;
        }

      , levelDown: function levelUp ()
        {
          this.level--;
          return this;
        }

      , nextLine: function nextLine ()
        {
          this.engrave('\n');
          return this;
        }

      , indent: function indent ()
        {
          for (var i = 0; i < this.level; i++)
          {
            this.engrave('\t');
          }

          return this;
        }

      , commentHandler: function commentHandler (comment)
        {
          return this.indent().engrave('<!-- ' + comment + ' -->');
        }

      , opentagHandler: function opentagHandler (tag)
        {
          var value = null
            , attr = null
            , name = tag.name;

          if (this.isInvalid)
            return;

          if (name === 'metadata')
            return (this.isInvalid = true);

          this.nextLine().indent().levelUp().engrave('<' + name);

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
            this.engrave('/').selfClosingTags[name] = true;

          return this.engrave('>');
        }

      , closetagHandler: function closetagHandler (tag)
        {
          if (tag === 'metadata')
            return (this.isInvalid = false);

          if (this.isInvalid)
            return;

          this.levelDown();

          if (!(tag in this.selfClosingTags))
            this.nextLine().indent().engrave('</' + tag + '>');

          return this;
        }
      };

  for (var method in methods)
    SvgCleaner.prototype[method] = methods[method];

  module.exports = SvgCleaner;

}(require('sax'), require('path'), require('fs')));
