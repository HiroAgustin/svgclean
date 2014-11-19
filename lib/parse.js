;(function ()
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

    addColor: function (color, prefix)
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

      delete attributes.fill;
      delete attributes.stroke;

      tag.children.map(this.parse.bind(this));

      return tag;
    }

    // TODO: RE WRITE URGENT!
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
        var classes = (child.attributes.class || '').split(' ');

        className = classes.filter(function (clas)
        {
          return colors[clas];
        })[0];

        if (currentParent && currentParent.attributes.class === className)
        {
          var index = classes.indexOf(className);

          if (index >= 0)
          {
            classes.splice(index, 1);
            child.attributes.class = classes.join(' ');
          }

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

}());
