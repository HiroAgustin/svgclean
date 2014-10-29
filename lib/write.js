;(function (fs, path, mkdirp)
{
  'use strict';

  function SvgWriter (dst, tree, callback)
  {
    dst = path.join(process.cwd(), dst);

    mkdirp.sync(path.dirname(dst));

    this.level = 0;

    this.writeStream = fs.createWriteStream(dst);

    this.writeStream.on('finish', callback);

    tree.forEach(this.engraveTag.bind(this));

    // TODO: maybe this inmediate call is why large files not working
    this.writeStream.end();

    return this;
  }

  SvgWriter.prototype = {

    engrave: function (text)
    {
      this.writeStream.write(text);
      return this;
    }

  , levelUp: function ()
    {
      this.level++;
      return this;
    }

  , levelDown: function ()
    {
      this.level--;
      return this;
    }

  , nextLine: function ()
    {
      this.engrave('\n');
      return this;
    }

  , indent: function ()
    {
      for (var i = 0; i < this.level; i++)
      {
        this.engrave('\t');
      }

      return this;
    }

  , engraveAttributes: function (attributes)
    {
      // I want to write the classnames first.
      if (attributes.class)
        this.engrave(' class="' + attributes.class + '"');

      delete attributes.class;

      for (var attr in attributes)
        this.engrave(' ' + attr + '="' + attributes[attr] + '"');

      return this;
    }

  , engraveComment: function (comment)
    {
      return this.indent().engrave('<!-- ' + comment.value + ' -->');
    }

  , engraveStyles: function (colors)
    {
      var keys = Object.keys(colors).sort();

      if (keys.length)
      {
        this.nextLine().indent().levelUp().engrave('<style>');

        for (var index in keys)
          this.nextLine().indent()
            .engrave('.' + keys[index] + ' {fill: ' + colors[keys[index]] + ';}');

        this.nextLine().levelDown().indent().engrave('</style>');
      }

      return this;
    }

  , engraveTag: function (tag)
    {
      var name = tag.name;

      if (name === 'metadata')
        return;

      if (name === 'comment')
        return this.engraveComment(tag);

      if (name === 'style')
        return this.engraveStyles(tag.colors);

      this.nextLine().indent().levelUp()
        .engrave('<' + name).engraveAttributes(tag.attributes);

      if (tag.isSelfClosing)
        this.engrave('/>').levelDown();

      else
      {
        this.engrave('>');

        tag.children.forEach(this.engraveTag.bind(this));

        this.nextLine().levelDown().indent().engrave('</' + name + '>');
      }
    }
  };

  module.exports = function (dst, tree, callback)
  {
    return new SvgWriter(dst, tree, callback);
  };

}(require('fs'), require('path'), require('mkdirp')));
