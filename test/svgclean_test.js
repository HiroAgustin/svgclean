;(function (assert, fs, path, svgclean)
{
  'use strict';

  describe('svgclean', function ()
  {
    var src = './fixtures/image-1.svg'
      , expected = fs.readFileSync('./expected/image-1.clean.svg').toString().trim();

    after(function ()
    {
      fs.unlinkSync('./fixtures/image-1.min.svg');
      fs.unlinkSync('./fixtures/test/image-1.min.svg');
      fs.rmdirSync('./fixtures/test/');

      fs.writeFileSync('./fixtures/image-1.svg', fs.readFileSync('./fixtures/image-1-copy.svg'));
    });

    it('cleans svg files', function (done)
    {
      var dest = './fixtures/image-1.min.svg';

      svgclean(src, dest, function ()
      {
        assert.equal(fs.readFileSync(dest).toString().trim(), expected);

        done();
      });
    });

    it('creates the dest path if it doesn\'t exists', function (done)
    {
      var dest = './fixtures/test/image-1.min.svg';

      svgclean(src, dest, function ()
      {
        assert.equal(fs.readFileSync(dest).toString().trim(), expected);

        done();
      });
    });

    it('compresses src if no dst option', function (done)
    {
      svgclean(src, function ()
      {
        assert.equal(fs.readFileSync(src).toString().trim(), expected);
        done();
      });
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
