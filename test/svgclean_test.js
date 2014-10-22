;(function (assert, fs, path, svgclean)
{
  'use strict';

  describe('svgclean', function ()
  {
    after(function (done)
    {
      fs.unlink('./fixtures/image-1.min.svg', function ()
      {
        fs.unlink('./fixtures/test/image-1.min.svg', function ()
        {
          fs.unlink('./fixtures/test/image-2.min.svg', function ()
          {
            fs.rmdir('./fixtures/test/', function ()
            {
              var readStream = fs.createReadStream('./fixtures/image-1-copy.svg')
                , writeStream = fs.createWriteStream('./fixtures/image-1.svg');

              readStream.on('error', done);
              writeStream.on('error', done);
              writeStream.on('close', done);

              readStream.pipe(writeStream);
            });
          });
        });
      });
    });

    it('cleans svg files', function (done)
    {
      var src = './fixtures/image-1.svg'
        , dest = './fixtures/image-1.min.svg'
        , expected = './expected/image-1.clean.svg';

      svgclean(src, dest, function ()
      {
        fs.readFile(dest, {encoding: 'utf-8'}, function (error, destData)
        {
          fs.readFile(expected, {encoding: 'utf-8'}, function (error, expectedData)
          {
            assert.equal(destData.trim(), expectedData.trim());
            done();
          });
        });
      });
    });

    it('creates the dest path if it doesn\'t exists', function (done)
    {
      var src = './fixtures/image-1.svg'
        , dest = './fixtures/test/image-1.min.svg'
        , expected = './expected/image-1.clean.svg';

      svgclean(src, dest, function ()
      {
        fs.readFile(dest, {encoding: 'utf-8'}, function (error, destData)
        {
          fs.readFile(expected, {encoding: 'utf-8'}, function (error, expectedData)
          {
            assert.equal(destData.trim(), expectedData.trim());
            done();
          });
        });
      });
    });

    it('compresses src if no dst option', function (done)
    {
      var src = './fixtures/image-1.svg'
        , expected = './expected/image-1.clean.svg';

      svgclean(src, function ()
      {
        fs.readFile(src, {encoding: 'utf-8'}, function (error, destData)
        {
          fs.readFile(expected, {encoding: 'utf-8'}, function (error, expectedData)
          {
            assert.equal(destData.trim(), expectedData.trim());
            done();
          });
        });
      });
    });

    it('fails if src does not exists', function ()
    {
      var src = './fixtures/image-2.svg'
        , dest = './fixtures/test/image-2.min.svg';

      assert.throws(svgclean(src, dest), Error);
    });
  });

}(require('assert'), require('fs'), require('path'), require('../lib/svgclean')));
