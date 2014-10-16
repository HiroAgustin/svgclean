;(function (sax, path, fs, mkdirp)
{
  'use strict';

  var SvgCleaner = function SvgCleaner (src, dst)
      {
        dst = dst || src;

        this.level = 0;
        this.events = {};
        this.selfClosingTags = {};

        this.readStream = fs.createReadStream(path.join(process.cwd(), src), {
          encoding: 'utf8'
        });

        this.saxStream = sax.createStream(false, {
          lowercasetags: true
        , normalize: true
        , trim: true
        });

        mkdirp(path.join(process.cwd(), path.dirname(dst)), this.init.bind(this, dst));

        return this;
      }

    , methods = {

        init: function (dst)
        {
          this.writer = fs.createWriteStream(dst);

          this.listen();

          this.readStream.pipe(this.saxStream);

          return this;
        }

      , on: function on (event, handler)
        {
          var events = this.events;

          if (!events.hasOwnProperty(event))
            events[event] = [];

          events[event].push(handler);

          return this;
        }

      , emit: function emit (event)
        {
          var events = this.events
            , args = Array.apply(null, arguments).slice(1);

          if (events.hasOwnProperty(event))
            events[event].forEach(this.callHandler.bind(this, args));

          return this;
        }

      , callHandler: function callHandler (args, handler)
        {
          handler.apply(this, args);

          return this;
        }

      , listen: function listen ()
        {
          this.saxStream
            .on('end', this.endHandler.bind(this))
            .on('error', this.errorHandler.bind(this))
            .on('comment', this.commentHandler.bind(this))
            .on('opentag', this.opentagHandler.bind(this))
            .on('closetag', this.closetagHandler.bind(this));

          this.readStream
            .on('error', this.errorHandler.bind(this));

          this.writer
            .on('finish', this.finishHandler.bind(this));

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

      , isSelfClosing: function isSelfClosing (tag)
        {
          return this.selfClosingTags.hasOwnProperty(tag);
        }

      , errorHandler: function errorHandler (error)
        {
          this.emit('error', error);

          throw error;
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

          if (!this.isSelfClosing(tag))
            this.nextLine().indent().engrave('</' + tag + '>');

          return this;
        }

      , endHandler: function endHandler ()
        {
          this.writer.end();

          return this;
        }

      , finishHandler: function finishHandler ()
        {
          this.emit('finish');

          return this;
        }
      };

  for (var method in methods)
    SvgCleaner.prototype[method] = methods[method];

  module.exports = SvgCleaner;

}(require('sax'), require('path'), require('fs'), require('mkdirp')));
