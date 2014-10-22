;(function (sax, path, fs, mkdirp, namer)
{
  'use strict';

  var SvgCleaner = function SvgCleaner (src, dst, callback)
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

    , methods = {

        init: function ()
        {
          this.level = 0;
          this.events = {};
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

      , engrave: function engrave (text)
        {
          this.writeStream.write(text);
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

      , createWriteStream: function createDest ()
        {
          mkdirp.sync(path.dirname(this.dst));

          return (this.writeStream = fs.createWriteStream(this.dst));
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

            , groupedTags = []
            , currentParent = null

            , newParent = function newParent (className)
              {
                return (currentParent = {
                  name: 'g'
                , children: []
                , attributes: {
                    class: className
                  }
                });
              };

          children.forEach(this.group.bind(this));

          children.forEach(function (child)
          {
            className = child.attributes.class;

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

      , engraveAttributes: function engraveAttributes (attributes)
        {
          // I want to write the classnames first.
          if (attributes.class)
            this.engrave(' class="' + attributes.class + '"');

          delete attributes.class;

          for (var attr in attributes)
            this.engrave(' ' + attr + '="' + attributes[attr] + '"');

          return this;
        }

      , engraveComment: function engraveComment (comment)
        {
          return this.indent().engrave('<!-- ' + comment.value + ' -->');
        }

      , engraveStyles: function engraveStyles (colors)
        {
          var index = 0
            , keys = Object.keys(colors).sort();

          if (keys.length)
          {
            this.nextLine().indent().levelUp().engrave('<style>');

            for (index in keys)
              this.nextLine().indent()
                .engrave('.' + keys[index] + ' {fill: ' + colors[keys[index]] + ';}');

            this.nextLine().levelDown().indent().engrave('</style>');
          }

          return this;
        }

      , engraveTag: function engraveTag (tag)
        {
          var name = tag.name;

          if (name === 'metadata')
            return;

          if (name === 'comment')
            return this.engraveComment(tag);

          if (name === 'style')
            return this.engraveStyles(this.colors);

          this.nextLine().indent().levelUp()
            .engrave('<' + name).engraveAttributes(tag.attributes);

          if (tag.isSelfClosing)
            this.engrave('/>').levelDown();

          else
          {
            this.engrave('>');

            tag.children.forEach(this.engraveTag.bind(this));

            this.nextLine().levelDown().indent()
              .engrave('</' + name + '>');
          }

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

          this.createWriteStream().on('finish', this.callback.bind(this));

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
              });

          children
            .forEach(this.engraveTag.bind(this));

          this.writeStream.end();

          return this;
        }

      , errorHandler: function errorHandler (error)
        {
          console.error(error);

          return this;
        }
      };

  for (var method in methods)
    SvgCleaner.prototype[method] = methods[method];

  module.exports = function (src, dst, callback)
  {
    return new SvgCleaner(src, dst, callback);
  };

}(require('sax'), require('path'), require('fs'), require('mkdirp'), require('color-namer')));
