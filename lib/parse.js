;(function (namer)
{
  'use strict';

  function SvgParser (tree)
  {
    this.colors = {};

    tree
      .map(this.parse.bind(this))

      .map(this.group.bind(this))

      .filter(this.findSvg.bind(this))[0]
        .children.unshift({
          name: 'style'
        , colors: this.colors
        });

    return tree;
  }

  SvgParser.prototype = {

    addColor: function (color)
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

        else if  (attribute === 'fill')
          classNames.push(this.addColor(value));

        else
          attributes[attribute] = value;
      }

      if (classNames.length)
        attributes.class = classNames.join(' ');

      delete attributes.fill;

      tag.children.map(this.parse.bind(this));

      return tag;
    }

    // TODO: optimize this function, maybe split into multiple
  , group: function (tag)
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

      return tag;
    }

  , findSvg: function (tag)
    {
      return tag.name === 'svg';
    }
  };

  module.exports = function (tree)
  {
    return new SvgParser(tree);
  };

}(require('color-namer')));
