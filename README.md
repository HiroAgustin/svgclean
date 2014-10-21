# SVGclean

Cleans up exported svg files by:

1. Removing useless tags and attributes.
2. Creates CSS class names based on fill attributes.

## Install

From NPM for use as a command line app:

`npm install svgclean -g`

From NPM for programmatic use:

`npm install --save svgclean`

## Usage

### From the terminal

`svgclean image.svg`

or

`svgclean image.svg image.clean.svg`

### As a Node.js module

    ;(function (SvgClean)
    {
      var src = './fixtures/image-1.svg'
        , dest = './fixtures/image-1.min.svg'
        , cleaner = new Svgclean(src, dest);

    }(require('svgclean')))

## License and copyrights

This software is released under the terms of the [MIT license](https://github.com/HiroAgustin/svgclean/blob/master/LICENSE).

***

Inspired on (and works better with) [SVGO](https://github.com/svg/svgo).
