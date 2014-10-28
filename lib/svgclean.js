;(function (sax, path, fs, svgparse, svgwrite)
{
  'use strict';

  function SvgCleaner (src, dst, callback)
  {
    var cwd = process.cwd();

    if (dst && typeof dst === 'function')
    {
      callback = dst;
      dst = null;
    }

    if (!dst)
      dst = src;

    if (!callback || typeof callback !== 'function')
      callback = function (){};

    this.src = path.join(cwd, src);
    this.dst = path.join(cwd, dst);
    this.callback = callback;

    return this.init();
  }

  SvgCleaner.prototype = {

    init: function ()
    {
      this.currentTag = {
        children: []
      };

      this.readStream = fs.createReadStream(this.src, {
        encoding: 'utf8'
      });

      this.saxStream = sax.createStream(false, {
        lowercasetags: true
      , normalize: true
      , trim: true
      });

      this.listen().readStream.pipe(this.saxStream);

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

      return this;
    }

  , commentHandler: function commentHandler (comment)
    {
      this.currentTag.children.push({
        name: 'comment'
      , value: comment
      });

      return this;
    }

  , opentagHandler: function opentagHandler (tag)
    {
      var parent = tag.parent = this.currentTag;

      tag.children = [];

      if (parent)
        parent.children.push(tag);

      this.currentTag = tag;

      return this;
    }

  , closetagHandler: function closetagHandler ()
    {
      var tag = this.currentTag
        , children = tag.children
        , parent = tag.parent;

      if (tag.name === 'g' && !Object.keys(tag.attributes).length && children.length === 1)
        parent.children.splice(-1, 1, children[0]);

      this.currentTag = parent;

      return this;
    }

  , endHandler: function endHandler ()
    {
      svgwrite(
        this.dst
      , svgparse(this.currentTag.children)
      , this.callback
      );

      return this;
    }

  , errorHandler: function errorHandler (error)
    {
      console.error(error);

      return this;
    }
  };

  module.exports = function (src, dst, callback)
  {
    return new SvgCleaner(src, dst, callback);
  };

}(require('sax'), require('path'), require('fs'), require('./svgparse'), require('./svgwrite')));
