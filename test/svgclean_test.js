;(function (assert, fs, path, svgclean)
{
  'use strict';

  function joinPath (route)
  {
    return path.join(path.relative(process.cwd(), __dirname), route);
  }

  function readFileSync (route)
  {
    return fs.readFileSync(route, {encoding: 'utf-8'}).trim();
  }

  function compare (dest, expected, done)
  {
    assert.equal(readFileSync(dest), expected);

    done();
  }

  describe('svgclean', function ()
  {
    var src = joinPath('./fixtures/image-1.svg')
      , expected = readFileSync(joinPath('./expected/image-1.clean.svg'));

    after(function ()
    {
      fs.unlinkSync(joinPath('./fixtures/image-1.min.svg'));
      fs.unlinkSync(joinPath('./fixtures/test/image-1.min.svg'));
      fs.rmdirSync(joinPath('./fixtures/test/'));

      fs.writeFileSync(
        joinPath('./fixtures/image-1.svg')
      , fs.readFileSync(joinPath('./fixtures/image-1-copy.svg'))
      );
    });

    it('cleans svg files', function (done)
    {
      var dest = joinPath('./fixtures/image-1.min.svg');

      svgclean(src, dest, compare.bind(null, dest, expected, done));
    });

    it('creates the dest path if it doesn\'t exists', function (done)
    {
      var dest = joinPath('./fixtures/test/image-1.min.svg');

      svgclean(src, dest, compare.bind(null, dest, expected, done));
    });

    it('compresses src if no dst option', function (done)
    {
      svgclean(src, compare.bind(null, src, expected, done));
    });

    it('fails if src does not exists', function ()
    {
      assert.throws(
        svgclean('./fixtures/image-2.svg', './fixtures/image-2.min.svg')
      , Error
      );
    });
  });

}(require('assert'), require('fs'), require('path'), require('../lib/svgclean')));
