describe('Resrc', function() {
  [window.resrc, window.imgix].forEach(resrc => { 
    describe('api', function() {

      it('defines resrc', function() {
        expect(resrc).to.exist;
      });

      it('defines resrc.run', function() {
        expect(resrc.run).to.be.instanceof(Function);
      });

      it('defines resrc.setImageUrl', function() {
        expect(resrc.run).to.be.instanceof(Function);
      });

    });

    describe('resrc.run()', function() {

      beforeEach(function() {
        this.elem = document.createElement('img');
        this.elem.setAttribute('data-src', 'http://www.image.com/1.jpg');
      });

      it('sets the image source', function() {
        imgObj = resrc.getResrcImageObject(this.elem);
        resrc.run(this.elem);
        expect(this.elem.src).to.equal(imgObj.resrcImgPath);
      });

      it('resets the image source after data-src was changed', function() {
        resrc.run(this.elem);
        this.elem.setAttribute('data-src', 'http://www.image.com/2.jpg');
        imgObj = resrc.getResrcImageObject(this.elem);
        resrc.run(this.elem);
        expect(this.elem.src).to.equal(imgObj.resrcImgPath);
      });

    });


    describe('resrc.setImageUrl()', function() {

      beforeEach(function() {
        this.elem = document.createElement('img');
        this.elem.setAttribute('data-src', 'http://www.image.com/1.jpg');
      });

      it('sets the data-src attribute', function() {
        resrc.setImageUrl(this.elem, 'http://www.image.com/1.jpg');
        expect(this.elem.getAttribute('data-src')).to.equal('http://www.image.com/1.jpg');
      });

      it('sets the src attribute', function() {
        resrc.setImageUrl(this.elem, 'http://www.image.com/1.jpg');
        imgObj = resrc.getResrcImageObject(this.elem);
        expect(this.elem.src).to.equal(imgObj.resrcImgPath);
      });


      it('resets the data-src when called repeatedly', function() {
        resrc.setImageUrl(this.elem, 'http://www.image.com/1.jpg');
        resrc.setImageUrl(this.elem, 'http://www.image.com/2.jpg');
        expect(this.elem.getAttribute('data-src')).to.equal('http://www.image.com/2.jpg');
      });


      it('resets the src when called repeatedly', function() {
        resrc.setImageUrl(this.elem, 'http://www.image.com/1.jpg');
        resrc.setImageUrl(this.elem, 'http://www.image.com/2.jpg');
        imgObj = resrc.getResrcImageObject(this.elem);
        expect(this.elem.src).to.equal(imgObj.resrcImgPath);
      });

    });
  })  
});
