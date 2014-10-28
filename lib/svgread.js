;(function (path, fs, sax)
{
  'use strict';

  function SvgReader (src, callback)
  {
    var readStream = fs.createReadStream(path.join(process.cwd(), src), {
          encoding: 'utf8'
        })

      , saxStream = sax.createStream(false, {
          lowercasetags: true
        , normalize: true
        , trim: true
        });

    this.currentTag = {
      children: []
    };

    saxStream
      .on('end', this.endHandler.bind(this, callback))
      .on('comment', this.commentHandler.bind(this))
      .on('opentag', this.opentagHandler.bind(this))
      .on('closetag', this.closetagHandler.bind(this));

    readStream.on('error', console.error);

    readStream.pipe(saxStream);
  }

  SvgReader.prototype = {

    commentHandler: function commentHandler (comment)
    {
      this.currentTag.children.push({
        name: 'comment'
      , value: comment
      , attributes: {}
      , children: []
      });
    }

  , opentagHandler: function opentagHandler (tag)
    {
      // Remove needless grouping
      if (tag.name === 'g' && !Object.keys(tag.attributes).length)
        return;

      var parent = tag.parent = this.currentTag;

      tag.children = [];

      if (parent)
        parent.children.push(tag);

      this.currentTag = tag;
    }

  , closetagHandler: function closetagHandler (name)
    {
      var currentTag = this.currentTag;

      if (currentTag.name !== name)
        return;

      this.currentTag = currentTag.parent;
    }

  , endHandler: function endHandler (callback)
    {
      callback(this.currentTag.children);
    }
  };

  module.exports = function (src, callback)
  {
    return new SvgReader(src, callback);
  };

}(require('path'), require('fs'), require('sax')));
