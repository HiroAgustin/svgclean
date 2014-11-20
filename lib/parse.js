;(function ()
{
  'use strict';

  function SvgParser (tree)
  {
    this.colors = {};

    tree
      .map(this.parse.bind(this))

      .map(this.group.bind(this))

      .filter(this.findSvg)[0]
        .children.unshift({
          name: 'style'
        , colors: this.colors
        });

    return tree;
  }

  SvgParser.prototype = {

    findSvg: function (tag)
    {
      return tag.name === 'svg';
    }

  , addColor: function (color, prefix)
    {
      var name = prefix + '-' + color.replace('#', '').toLowerCase();

      this.colors[name] = color;

      return name;
    }

  , parse: function (tag)
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

        else if  (attribute === 'fill' || attribute === 'stroke')
          classNames.push(this.addColor(value, attribute));

        else
          attributes[attribute] = value;
      }

      if (classNames.length)
        attributes.class = classNames.join(' ');

      if (attributes.fill)
        delete attributes.fill;

      if (attributes.stroke)
        delete attributes.stroke;

      tag.children.map(this.parse.bind(this));

      return tag;
    }

  , areRelated: function (arr1, arr2)
    {
      var i
        , found = false
        , length = arr1.length;

      for (i = 0; i < length && !found; i++)
        found = ~arr2.indexOf(arr1[i]);

      return found;
    }

  , getClassArray: function (tag)
    {
      var classNames = tag && tag.attributes.class;

      return classNames && classNames.split(' ') || [];
    }

  , removeClass: function (tag, name)
    {
      var classes = this.getClassArray(tag)
        , index = classes.indexOf(name);

      if (~index)
        classes.splice(index, 1);

      tag.attributes.class = classes.join(' ');

      return tag;
    }

  , group: function (tag)
    {
      var children = tag.children
        , grouped = []
        , index = 0
        , current
        , classes
        , child;

      while (children.length)
      {
        child = children.shift();

        child.children.map(this.group.bind(this));

        classes = this.getClassArray(child);
        current = grouped[index];

        if (current)
        {
          if (this.areRelated(classes, this.getClassArray(current)))
            current.children.push(this.removeClass(child, classes[0]));

          else
          {
            if (current.name === 'g' && current.children.length === 1)
              grouped[index] = current.children[0];

            index++;
          }
        }

        if (!grouped[index])
        {
          if (classes.length)
            grouped[index] = {
              name: 'g'
            , children: [this.removeClass(child, classes[0])]
            , attributes: {
                class: classes[0]
              }
            };

          else
            grouped[index] = child;
        }
      }

      tag.children = grouped;
      // tag.children = grouped.map(this.group.bind(this));

      return tag;
    }
  };

  module.exports = function (tree)
  {
    return new SvgParser(tree);
  };

}());
