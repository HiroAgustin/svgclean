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

`svgclean image.svg image-clean.svg`

### As a Node.js module

    var svgclean = require('svgclean');

    // Modify existing file
    svgclean('image-1.svg');

    // Create new file
    svgclean('image-2.svg', 'image-2-clean.svg');

    // Passing a callback
    svgclean('image-3.svg', function ()
    {
      // Cleaning is done
    });

    svgclean('image-4.svg', 'image-4-clean.svg', function ()
    {
      // Cleaning is done
    });

## License and copyrights

This software is released under the terms of the [MIT license](https://github.com/HiroAgustin/svgclean/blob/master/LICENSE).

***

Inspired on (and works better with) [SVGO](https://github.com/svg/svgo).
