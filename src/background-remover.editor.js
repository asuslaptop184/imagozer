const { Component, render, findDOMNode, Fragment } = wp.element;

import Parser from 'html-react-parser';
import PerfectScrollbar from 'react-perfect-scrollbar'

const alias = 'ImageEditor-BR-'
class IMAGE_EDITOR_Background_Remover extends Component {

  constructor(props) {
    super(props);

    this.state = {
      original: {
        canvas: false,
        ctx: false,
        container: false,
        size: {
          width: 0,
          height: 0
        }
      },

      edit: {
        canvas: false,
        ctx: false,
      },

      tolerance: 5,
      border: 10,
      allDrawArr: [],

      zoom: 1,

      extendedSelCanvas: false
    }
  }

  componentDidMount(props, state) 
  {
    document.addEventListener('mousedown', this.onMouseDown.bind(this))
    document.addEventListener('mousemove', this.onMouseMove.bind(this))
    document.addEventListener('mouseup', this.onMouseUp.bind(this))
    document.onkeydown = this.onKeyDown.bind(this)

    if( this.state.original.container == false ){
      this.state.original.container = findDOMNode(this.refs.original_container);

      this.setState({
        original: { ...this.state.original, ['size']: {
          width: this.state.original.canvas.width,
          height: this.state.original.canvas.height
        }}
      })

      this.state.edit.canvas = findDOMNode(this.refs.edit_canvas);
      this.setState({
        edit: { ...this.state.edit, ['ctx']: this.state.edit.canvas.getContext('2d') }
      })
    }
  }

  componentDidUpdate()
  {
    const { original, edit, image_scale, allDrawArr } = this.state

    if( original.container ){

      edit.ctx.drawImage( original.canvas, 0, 0 );

      if( allDrawArr.length ){
        allDrawArr.forEach( elm => {

          if( elm.show ){
            edit.ctx.drawImage( elm.canvas, 0, 0 );
          }
        })
      }

      /*if( allDrawArr ){
        edit.ctx.drawImage( extendedSelCanvas, 0, 0 );
      }*/
    }
  }

  onMouseDown(e)
  {
    if ( e.target.classList.contains( `${alias}edit-canvas` ) ){
      this.wandSelectionCanvas( e.pageX, e.pageY );
    }
  }

  onMouseMove(e)
  {

  }

  onMouseUp(e)
  {

  }

  onKeyDown(e)
  {

  }

  wandSelectionCanvas( x, y ) 
  {
    const { edit, tolerance } = this.state;

    const tol = tolerance / 100;

    const w = edit.canvas.width;
    const h = edit.canvas.height;

    const ctx = edit.canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    const selCanvas = document.createElement("canvas");
    selCanvas.width = w;
    selCanvas.height = h;

    const selCtx = selCanvas.getContext("2d");
    const selectionImageData = selCtx.getImageData(0, 0, w, h);
    const sData = selectionImageData.data;

    const refColorPos = (y * w + x) * 4;
    const refColor = [data[refColorPos], data[refColorPos + 1], data[refColorPos + 2], data[refColorPos + 3]];
    const refColorGray = this.rgbToFloat(data[refColorPos], data[refColorPos + 1], data[refColorPos + 2]);

    let count = 0;
    const stack = [{x, y}];

    while (stack.length > 0) {
      const p = stack.pop();

      var x = p.x;
      var y = p.y;

      count++;
      if (count > 100000000)
          break;

      const pos = (y * w + x) * 4;

      if (sData[pos] != 0 || sData[pos + 1] != 0) {
          continue;
      }

      const newColorGray = this.rgbToFloat(data[pos], data[pos + 1], data[pos + 2]);

      if (refColorGray < newColorGray + tol && refColorGray > newColorGray - tol) {
          sData[pos + 1] = 255;
          sData[pos + 3] = 255;
      } else {
          sData[pos] = 255;
          sData[pos + 3] = 255;
          continue;
      }

      if (x > 0) {
          stack.push({x: x - 1, y});
      }
      if (y > 0) {
          stack.push({x, y: y - 1});
      }
      if (x < w - 1) {
          stack.push({x: x + 1, y});
      }
      if (y < h - 1) {
          stack.push({x, y: y + 1});
      }
    }

    selectionImageData.data.set( sData );
    selCtx.putImageData(selectionImageData, 0, 0);

    this.setState( { allDrawArr: [ ...this.state.allDrawArr, {
        'canvas': this.extendBorder( selCanvas, [255, 0, 0, 255], [255, 255, 0, 150] ),
        'pos': {
          x, y
        },
        'type': 'mw',
        'show': true,
        'zoom': this.state.zoom
      }
    ] });
  }

  extendBorder(canvas, targetColor, selColor)
  {
    const { border } = this.state;

    const dif = parseInt( border / 2);
    const width = canvas.width;
    const height = canvas.height;

    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const selCanvas = document.createElement("canvas");
    selCanvas.width = width;
    selCanvas.height = height;

    const selCtx = selCanvas.getContext("2d");
    const selectionImageData = selCtx.getImageData(0, 0, width, height);
    const sData = selectionImageData.data;

    let pos;
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {

        pos = (y * width + x) * 4;
        if (data[pos] != targetColor[0] || data[pos + 1] != targetColor[1] || data[pos + 2] != targetColor[2]) {
          continue;
        }

        for (let xx = Math.max(0, x - dif), xxTo = Math.min(x + dif + 1, width); xx < xxTo; xx++) {
          for (let yy = Math.max(0, y - dif), yyTo = Math.min(y + dif + 1, height); yy < yyTo; yy++) {
            pos = (yy * width + xx) * 4;
            sData[pos] = selColor[0];
            sData[pos + 1] = selColor[1];
            sData[pos + 2] = selColor[2];
            sData[pos + 3] = selColor[3];
          }
        }
      }
    }

    selectionImageData.data.set( sData );
    selCtx.putImageData(selectionImageData, 0, 0);

    return selCanvas;
  }

  rgbToFloat(r, g, b) {
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }

  zoomWheel(e) 
  {
    //e.preventDefault();

    let step_size = 0.01;
    if( e.shiftKey ){
      step_size = 0.1;
    }

    let new_image_scale = this.state.image_scale;
    let direction = 'up';
    if (e.deltaY < 0) {
      new_image_scale = new_image_scale + step_size;
    }
    if (e.deltaY > 0) {
      new_image_scale = new_image_scale - step_size;
      direction = 'down';
    }

    if( direction == 'down' && new_image_scale <= 0.1 ){
      new_image_scale = 0.1;
    }

    if( direction == 'up' && new_image_scale >= 5 ){
      new_image_scale = 5;
    }

    this.setState({
        zoom: new_image_scale
    })
  }

  buildPanels()
  {
    const { original, zoom, allDrawArr } = this.state;

    return <div className={ `${alias}side-by-side` }>
      <div className={ `${alias}original` } ref="original_container">
        <PerfectScrollbar>
          <canvas className={ `${alias}edit-canvas` } ref="edit_canvas" width={ original.size.width } height={ original.size.height }/>
        </PerfectScrollbar>
      </div>
      <div className={ `${alias}export` }>2</div>
      <div className={ `${alias}history` }>
        <h1>History Actions</h1>

        <ul>
          { 
            allDrawArr.map( ( elm, index ) => {
              let nice_name = 'Magic wand tool';
              if( elm.type == 'a' ){
              }

              return <li className={ elm.show ? '__is_show' : '__is_hidden' } onClick={ (e) => {
                e.preventDefault();
                allDrawArr[index]['show'] = !allDrawArr[index]['show'];
                this.setState({ allDrawArr })
              } }><a href="#"><span class={ `dashicons ${ elm.show ? 'dashicons-visibility' : 'dashicons-hidden' }` }></span></a><span>{ nice_name }</span></li>
            })
          }
        </ul>

        <div>
          <a href="#"><span class="dashicons dashicons-undo"></span></a>
          <a href="#"><span class="dashicons dashicons-redo"></span></a>
        </div>
      </div>
    </div>
  }

  buildControls()
  {
    const { original_canvas } = this.state;

    return <div className={ `${alias}controls` }>
        aaaaaaaaa
    </div>
  }

  render() 
  {
    let { canvas } = this.state.original;

    if( canvas === false ){
      this.state.original.canvas = this.props.the_image;
      this.state.original.ctx = this.state.original.canvas.getContext('2d');
    }

    return <div className={ `${alias}wrapper` } onWheel = {(e) => this.zoomWheel(e) }>
      { this.state.original.canvas ? this.buildControls() : '' }
      { this.state.original.canvas ? this.buildPanels() : '' }
    </div>
  }
}

export { IMAGE_EDITOR_Background_Remover };