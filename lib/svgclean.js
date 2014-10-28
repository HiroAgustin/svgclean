;(function (sax, path, fs, namer, svgwrite)
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
      this.colors = {};

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

  , addColor: function addColor (color)
    {
      var index = 0
        , colors = this.colors

        , names = namer(color, 'html')
        , name = names[index].name;

      while (colors[name] && colors[name] !== color)
        name = names[++index].name;

      colors[name] = color;

      return name;
    }

  , parse: function parse (tag)
    {
      var value = ''
        , attribute = ''
        , classNames = []
        , attributes = tag.attributes;

      for (attribute in attributes)
      {
        value = decodeURI(
          encodeURI(attributes[attribute]).replace(/%0D|%0A|%09/gi, '')
        ).trim();

        if (~attribute.indexOf('xml'))
          delete attributes[attribute];

        else if (attribute === 'class')
          classNames.concat(value.split(' '));

        else if  (attribute === 'fill')
          classNames.push(this.addColor(value));
        else
          attributes[attribute] = value;
      }

      if (classNames.length)
        attributes.class = classNames.join(' ');

      delete attributes.fill;

      tag.children.forEach(this.parse.bind(this));

      return this;
    }

    // TODO: Optimize the following function
  , group: function group (tag)
    {
      var children = tag.children

        , className = ''
        , colors = this.colors

        , groupedTags = []
        , currentParent = null;

      function newParent (className)
      {
        return (currentParent = {
          name: 'g'
        , children: []
        , attributes: {
            class: className
          }
        });
      }

      children.forEach(this.group.bind(this));

      children.forEach(function (child)
      {
        className = (child.attributes.class || '').split(' ').filter(function (clas)
        {
          return colors[clas];
        })[0];

        if (currentParent && currentParent.attributes.class === className)
        {
          delete child.attributes.class;
          currentParent.children.push(child);
        }
        else if (className)
        {
          if (currentParent)
          {
            if (currentParent.children.length === 1)
            {
              currentParent.children[0].attributes.class = currentParent.attributes.class;
              groupedTags.push(currentParent.children[0]);
            }
            else
              groupedTags.push(currentParent);
          }

          newParent(className).children.push(child);
          delete child.attributes.class;
        }
        else if (child.name === 'g')
        {
          groupedTags.push(child.children[0]);
        }
      });

      if (currentParent)
      {
        groupedTags.push(currentParent);
      }

      tag.children = groupedTags;

      return this;
    }

  , filterComments: function filterComments (tag)
    {
      return tag.name !== 'comment';
    }

  , findSvg: function findSvg (tag)
    {
      return tag.name === 'svg';
    }

  , endHandler: function endHandler ()
    {
      var children = this.currentTag.children;

      children
        .filter(this.filterComments.bind(this))
          .forEach(this.parse.bind(this));

      children
        .filter(this.filterComments.bind(this))
          .forEach(this.group.bind(this));

      children
        .filter(this.findSvg.bind(this))[0]
          .children.unshift({
            name: 'style'
          , colors: this.colors
          });

      svgwrite(this.dst, children, this.callback);

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

}(require('sax'), require('path'), require('fs'), require('color-namer'), require('./svgwrite')));
