/**
* based on: https://github.com/picturepan2/instagram.css/tree/master/src

**/


export function IMAGE_EDITOR_InstagramFilterList(){
  return {
      0: 'NO FILTER',
      '1977': '1977',
      aden: 'Aden',
      amaro: 'Amaro',
      ashby: 'Ashby',
      brannan: 'Brannan',
      brooklyn: 'Brooklyn',
      charmes: 'Charmes',
      clarendon: 'Clarendon',
      crema: 'Crema',
      dogpatch: 'Dogpatch',
      earlybird: 'Earlybird',
      gingham: 'Gingham',
      ginza: 'Ginza',
      hefe: 'Hefe',
      helena: 'Helena',
      hudson: 'Hudson',
      inkwell: 'Inkwell',
      kelvin: 'Kelvin',
      juno: 'Juno',
      lark: 'Lark',
      lofi: 'Lo-Fi',
      ludwig: 'Ludwig',
      maven: 'Maven',
      mayfair: 'Mayfair',
      moon: 'Moon',
      nashville: 'Nashville',
      perpetua: 'Perpetua',
      poprocket: 'Poprocket',
      reyes: 'Reyes',
      rise: 'Rise',
      sierra: 'Sierra',
      skyline: 'Skyline',
      slumber: 'Slumber',
      stinson: 'Stinson',
      sutro: 'Sutro',
      toaster: 'Toaster',
      valencia: 'Valencia',
      vesper: 'Vesper',
      walden: 'Walden',
      willow: 'Willow',
      'xpro-ii': 'X-Pro II',
    }
}

export function IMAGE_EDITOR_InstagramFilter( filter, attrs ) {

  let ctx_filter = ''
  let need_update = false
  let blend = ''
  let before = false
  let before_type = 'rect'
  let fillStyle = ''

  if( filter == 0 ){
    ctx_filter = 'sepia(0)'
  }
  else if( filter == '1977' ){
    ctx_filter = 'sepia(.5) hue-rotate(-30deg) saturate(1.4)'
  }
  else if( filter == 'aden' ){
    ctx_filter = 'sepia(.2) brightness(1.15) saturate(1.4)'
    blend = 'multiply'
    fillStyle = 'rgb(125, 105, 24, .1)'
    before = true
  }
  else if( filter == 'amaro' ){
    ctx_filter = 'sepia(.35) contrast(1.1) brightness(1.2) saturate(1.3)'
    blend = 'overlay'
    fillStyle = 'rgb(125, 105, 24, .2)'
    before = true
  }
  else if( filter == 'ashby' ){
    ctx_filter = 'sepia(.5) contrast(1.2) saturate(1.8)'
    blend = 'lighten'
    fillStyle = 'rgba(125, 105, 24, .35)'
    before = true
  }
  else if( filter == 'brannan' ){
    ctx_filter = 'sepia(.4) contrast(1.25) brightness(1.1) saturate(.9) hue-rotate(-2deg)'
  }
  else if( filter == 'brooklyn' ){
    ctx_filter = 'sepia(.25) contrast(1.25) brightness(1.25) hue-rotate(5deg)'
    blend = 'overlay'
    fillStyle = 'rgba(127, 187, 227, .2)'
    before = true
  }
  else if( filter == 'charmes' ){
    ctx_filter = 'sepia(.25) contrast(1.25) brightness(1.25) saturate(1.35) hue-rotate(-5deg)'
    blend = 'darken'
    fillStyle = 'rgba(125, 105, 24, .25)'
    before = true
  }

  // !!!!
  else if( filter == 'clarendon' ){
    ctx_filter = 'sepia(.15) contrast(1.25) brightness(1.25) hue-rotate(5deg)'
    blend = 'overlay'
    fillStyle = 'rgba(127, 187, 227, .4)'
    before = true
  }
  else if( filter == 'crema' ){
    ctx_filter = 'sepia(.5) contrast(1.25) brightness(1.15) saturate(.9) hue-rotate(-2deg)'
    blend = 'multiply'
    fillStyle = 'rgba(125, 105, 24, .2)'
    before = true
  }
  else if( filter == 'dogpatch' ){
    ctx_filter = 'sepia(.35) saturate(1.1) contrast(1.5)'
  }
  else if( filter == 'gingham' ){
    ctx_filter = 'contrast(1.1) brightness(1.1)'
    blend = 'soft-light'
    fillStyle = 'rgba(230, 230, 230)'
    before = true
  }
  else if( filter == 'ginza' ){
    ctx_filter = 'sepia(.25) contrast(1.15) brightness(1.2) saturate(1.35) hue-rotate(-5deg)'
    blend = 'darken'
    fillStyle = 'rgba(125, 105, 24, .15)'
    before = true
  }
  else if( filter == 'helena' ){
    ctx_filter = 'sepia(.5) contrast(1.05) brightness(1.05) saturate(1.35)'
    blend = 'overlay'
    fillStyle = 'rgba(158, 175, 30, .25)'
    before = true
  }
  else if( filter == 'inkwell' ){
    ctx_filter = 'brightness(1.25) contrast(.85) grayscale(1)'
  }
  else if( filter == 'juno' ){
    ctx_filter = 'sepia(.35) contrast(1.15) brightness(1.15) saturate(1.8)'
    blend = 'overlay'
    fillStyle = 'rgba(127, 187, 227, .2)'
    before = true
  }
  else if( filter == 'lark' ){
    ctx_filter = 'sepia(.25) contrast(1.2) brightness(1.3) saturate(1.25)'
  }
  else if( filter == 'lofi' ){
    ctx_filter = 'saturate(1.1) contrast(1.5)'
  }
  else if( filter == 'ludwig' ){
    ctx_filter = 'sepia(.25) contrast(1.05) brightness(1.05) saturate(2)'
    blend = 'overlay'
    fillStyle = 'rgba(125, 105, 24, .1)'
    before = true
  }
  else if( filter == 'maven' ){
    ctx_filter = 'sepia(.35) contrast(1.05) brightness(1.05) saturate(1.75)'
    blend = 'darken'
    fillStyle = 'rgba(158, 175, 30, .25)'
    before = true
  }
  else if( filter == 'moon' ){
    ctx_filter = 'brightness(1.4) contrast(.95) saturate(0) sepia(.35)'
  }
  else if( filter == 'reyes' ){
    ctx_filter = 'sepia(.75) contrast(.75) brightness(1.25) saturate(1.4)'
  }
  else if( filter == 'skyline' ){
    ctx_filter = 'sepia(.15) contrast(1.25) brightness(1.25) saturate(1.2)'
  }
  else if( filter == 'slumber' ){
    ctx_filter = 'sepia(.35) contrast(1.25) saturate(1.25)'
    blend = 'darken'
    fillStyle = 'rgba(125, 105, 24, .2)'
    before = true
  }
  else if( filter == 'stinson' ){
    ctx_filter = 'sepia(.35) contrast(1.25) brightness(1.1) saturate(1.25)'
    blend = 'lighten'
    fillStyle = 'rgba(125, 105, 24, .45)'
    before = true
  }
  else if( filter == 'valencia' ){
    ctx_filter = 'sepia(.25) contrast(1.1) brightness(1.1)'
    blend = 'lighten'
    fillStyle = 'rgba(230, 193, 61, .1)'
    before = true
  }
  else if( filter == 'vesper' ){
    ctx_filter = 'sepia(.35) contrast(1.15) brightness(1.2) saturate(1.3)'
    blend = 'overlay'
    fillStyle = 'rgba(125, 105, 24, .25)'
    before = true
  }
  else if( filter == 'walden' ){
    ctx_filter = 'sepia(.35) contrast(.8) brightness(1.25) saturate(1.4)'
    blend = 'darken'
    fillStyle = 'rgba(229, 240, 128, .5)'
    before = true
  }
  else if( filter == 'willow' ){
    ctx_filter = 'brightness(1.2) contrast(.85) saturate(.05) sepia(.2)'
  }

  if( ctx_filter == "" ){
    return false;
  }

  if( ctx_filter != "" ){
    attrs.ctx.filter = ctx_filter


    attrs.ctx.drawImage( 
      attrs.image, 
      attrs.x, 
      attrs.y
    );

    /** bug 
    if( attrs.scaleX == -1 ){
      attrs.ctx.translate( attrs.width, 0 );
      attrs.ctx.scale( -1, 1 );
    }

    if( attrs.scaleY == -1 ){
      attrs.ctx.translate( 0, attrs.height );
      attrs.ctx.scale( 1, -1 );
    }
    */
  }

  if( before ){

    attrs.ctx.globalCompositeOperation = blend;

    if( before_type == 'rect' ){
      attrs.ctx.beginPath();
      attrs.ctx.fillStyle = fillStyle;

      attrs.ctx.rect(
        attrs.x, 
        attrs.y,
        attrs.width, 
        attrs.height
      );
      attrs.ctx.fill();
    }


    // not working yet ...
    else if( before_type == 'radial-gradient1' ){

      const grd = attrs.ctx.createRadialGradient(
        attrs.width, 
        attrs.height, 
        0, 
        attrs.width, 
        attrs.height, 
        attrs.height
      );

      grd.addColorStop(0, "rgba(25, 62, 167, .25)");
      grd.addColorStop(1, "white");

      /*var grd = attrs.ctx.createRadialGradient(
        attrs.x, 
        attrs.width / 2, 
        attrs.height, 
        90, 
        60, 
        attrs.height
      );
      grd.addColorStop(0, "red");
      grd.addColorStop(1, "white");*/

      attrs.ctx.fillStyle = grd;
      attrs.ctx.fillRect(
        attrs.x, 
        attrs.y,
        attrs.width, 
        attrs.height
      );
    }

    attrs.ctx.globalCompositeOperation = 'normal';
  }

  return true;
}