const { Component, render, findDOMNode, Fragment } = wp.element;

const {
  RangeControl,
  Panel,
  PanelBody,
  ButtonGroup,
  Button,
  CheckboxControl
} = wp.components;

// https://www.npmjs.com/package/react-loader-spinner
import Loader from 'react-loader-spinner'
import axios from 'axios';

import logo from '../assets/proeditor.png';
import RotateSVG from '../assets/rotate.svg';

import PerfectScrollbar from 'react-perfect-scrollbar'
import NumericInput from 'react-numeric-input';

import { IMAGE_EDITOR_slider as Slider } from './slider.class.js';

import { IMAGE_EDITOR_isset as isset } from "./utils.js";

import { IMAGE_EDITOR_List } from "./list.js";

import {
  IMAGE_EDITOR_InstagramFilter as InstagramFilter,
  IMAGE_EDITOR_InstagramFilterList as InstagramFilterList
} from './instagram.filters.js';


const alias = 'ImageEditor-'
const image_block_wrapper = document.getElementById('AA_ImageEditor-wrapper');
class IMAGE_EDITOR_box extends Component {

  constructor(props) {
    super(props);

    this.defaultsFilters = {
      exposure: {
        brightness: '100%',
        contrast: '100%',
        saturate: '100%',
        grayscale: '0%',
        sepia: '0%',
        invert: '0%',
        blur: '0px',
      }
    }

    this.state = {
      open_menu: false,
      image_scale: 1,
      scaleX: 1,
      scaleY: 1,
      pos: {
        x: 0, y: 0
      },
      dragging: false,
      rotate: false,
      zoom_pointer_push: false,
      rotate_deg: 0,
      click_pos: null,
      image_initial_pos: null,
      xDirection: '',
      xOld: 0,
      rotateSpeed: 'normal',
      image_src: '',
      image_ready: false,
      current_image_size: 'thumbnail',
      current_image_size: 'original',
      loading: {
        show: true,
        msg: "loading image ..."
      },
      image_size: {
        width: 0,
        height: 0
      },

      notify: {
        show: false,
        type: 'success',
        msg: ''
      },
      faces_list: [],

      apply_instagram_filter: false,
      filters: {
        exposure: {
          brightness: this.defaultsFilters.exposure.brightness,
          contrast: this.defaultsFilters.exposure.contrast,
          saturate: this.defaultsFilters.exposure.saturate,
          grayscale: this.defaultsFilters.exposure.grayscale,
          sepia: this.defaultsFilters.exposure.sepia,
          invert: this.defaultsFilters.exposure.invert,
          blur: this.defaultsFilters.exposure.blur,
        }
      },

      resize: {
        width: 0,
        height: 0,
        aspect_ration: true,
        xScale: 100,
        yScale: 100
      },

      dragpointer: false,
      dragg_pos: false,

      crop: {
        width: 0,
        width_offset: 0,
        height: 0,
        height_offset: 0,
        aspect_ration: true
      },

      save_canvas: false,

      fd: {
        "qthresh": 5.0,
        "shiftfactor": 0.1,
        "minsize": 20,
        "maxsize": 500,
        "scalefactor": 1.2
      },

      before_save: 'new',

      history: []
    }

    this.where = image_block_wrapper.getAttribute('data-where');

    if( this.where == 'list' ){
      console.log( 'list' );
    }

    else{
      this.postObj = JSON.parse( image_block_wrapper.getAttribute('data-post') );
      this.imageObj = JSON.parse( image_block_wrapper.getAttribute('data-image') );

      //this.state.image_src = this.imageObj.file;
      this.state.image_src = this.imageObj.sizes['original'].file;

      this.fitToScreen = this.fitToScreen.bind(this);
      this.saveAsCopy = this.saveAsCopy.bind(this);
      this.saveAndOverwite = this.saveAndOverwite.bind(this);

      this.flipHorizontal = this.flipHorizontal.bind(this);
      this.flipVertical = this.flipVertical.bind(this);

      this.rotateLeft = this.rotateLeft.bind(this);
      this.rotateRight = this.rotateRight.bind(this);

      this.saveImage = this.saveImage.bind(this);
      this.restoreImage = this.restoreImage.bind(this);
      this.resetImage = this.resetImage.bind(this);
      this.resetImageAll = this.resetImageAll.bind(this);

      this.toggleFullscreen = this.toggleFullscreen.bind(this)

      this.faceDetector = this.faceDetector.bind(this);
      this.moveToFace = this.moveToFace.bind(this);

      // optimize by caching selectors
      this.the_image = false;
      this.the_image_size = false;
      this.the_image_ctx = false;
      this.image_orig = false;
      this.the_image_container = false;
      this.preview_canvas = false;
      this.ctx_canvas = false;

      this.preloadImage();

      this._face_detection_debug = false;

      this.rotate_deg_current = 0;

      this.instagram_eff_generated = false;
      this.instragramEffects = InstagramFilterList()
    }

    this.main_image_ref = React.createRef();

    // debug
    setTimeout( () => {

      //this.calculateNewSize( 'width', 600 );

      //const { filters } = this.state
      //this.setState({ 'filters': { ...filters, ['exposure']: { ...filters['exposure'], ['brightness'] : 1.8 } } })

      setTimeout( () => {
        //this.saveImage();
      }, 100)

      //this.calculateNewCrop( 'width', 600 );
      //this.calculateNewSize( 'width', 600 );
      //this.setState({ resize: { ...this.state.resize, width: 300, applyChanges: true } })
    }, 200 )
  }

  componentDidMount(props, state)
  {
    const { current_image_size, open_menu } = this.state

    if( this.where == 'editor' ){
      document.addEventListener('mousemove', this.onMouseMove.bind(this))
      document.addEventListener('mousedown', this.onMouseDown.bind(this))
      document.addEventListener('mouseup', this.onMouseUp.bind(this))
      document.onkeydown = this.onKeyDown.bind(this)
    }
  }

  saveAsCopy(e)
  {
    e.preventDefault();

    this.setState({
      loading: {
        show: true,
        msg: 'saving image and backup the old file ....'
      }
    })

    this.saveTheImage( 'copy' )
  }

  saveAndOverwite(e)
  {
    e.preventDefault();

    this.setState({
      loading: {
        show: true,
        msg: 'saving image and backup the old file ....'
      }
    })

    this.saveTheImage( 'save' )
  }

  saveTheImage( type )
  {
    const self = this

    axios.post( NIM.ajax_url, {
      attID: this.postObj.ID,
      imgBase64: this.state.save_canvas,
      size: this.state.current_image_size,
      sub_action: 'save_image',
      save_type: type
    })
    .then(res => {

      const { status, msg } = res.data
      const { image_url, new_size } = res.data.data

      if(status == 'valid' ){
        self.setState({
          'notify': {
            type: 'success',
            show: true,
            msg: <div>
              <a href={ `${image_url}?noCache=${ Math.floor(Math.random() * 20) }` } target="_blank">View saved image</a>
              <div>new file size: <strong>{new_size}</strong></div>
            </div>
          }
        })
      }else{
        self.setState({
          'notify': {
            type: 'error',
            show: true,
            msg: <div>{msg}</div>
          }
        })
      }

      self.setState({ save_canvas: false });

      self.setState({
        loading: {
          show: false
        }
      })
    })
  }

  calculateNewSize( prop, new_value )
  {
    const { resize } = this.state
    const { aspect_ration: ratio } = this.state.resize

    // cmon how want image lower than 10px ?
    if( new_value < 10 ) return;

    const new_resize = { ...resize }

    if( resize[prop] != new_value ){

      if( ratio == true ){
        const aspect_ration = this.the_image_size.width / this.the_image_size.height
        new_resize[prop] = new_value;

        // Make sure the width and height preserve the original aspect ratio and adjust if needed
        if( prop == 'width' ){
          new_resize['height'] = Math.floor(new_resize['width'] * (this.the_image_size.height / this.the_image_size.width));
        }
        else if( prop == 'height' ){
          new_resize['width'] = Math.floor(new_resize['height'] * (this.the_image_size.width / this.the_image_size.height));
        }
      }

      else{
        new_resize[prop] = new_value;
      }
    }

    // update the state ...
    this.setState({ resize: new_resize });
  }

  calculateNewCrop( prop, new_value )
  {
    const { crop } = this.state
    const { aspect_ration: ratio } = this.state.crop

    // cmon how want image lower than 10px ?
    if( new_value < 10 ) return;

    const new_crop = { ...crop }

    if( crop[prop] != new_value ){

      if( ratio == true ){
        const aspect_ration = this.the_image_size.width / this.the_image_size.height
        new_crop[prop] = new_value;

        // Make sure the width and height preserve the original aspect ratio and adjust if needed
        if( prop == 'width' ){
          new_crop['height'] = Math.floor(new_crop['width'] * (this.the_image_size.height / this.the_image_size.width));
        }
        else if( prop == 'height' ){
          new_crop['width'] = Math.floor(new_crop['height'] * (this.the_image_size.width / this.the_image_size.height));
        }

      }else{
        new_crop[prop] = new_value;
      }

      // update the state ...
      this.setState({ crop: new_crop });
    }
  }

  onKeyDown(e)
  {
    let step = 1;
    if( e.shiftKey ) step = 5;

    if (e.keyCode == '37') {
      this.setState({
        'pos': { ...this.state.pos, ['x']: (this.state.pos.x - step)}
      })
    }
    if (e.keyCode == '39') {
      this.setState({
        'pos': { ...this.state.pos, ['x']: (this.state.pos.x + step)}
      })
    }

    if (e.keyCode == '38') {
      this.setState({
        'pos': { ...this.state.pos, ['y']: (this.state.pos.y - step)}
      })
    }

    if (e.keyCode == '40') {
      this.setState({
        'pos': { ...this.state.pos, ['y']: (this.state.pos.y + step)}
      })
    }

    if( e.ctrlKey && e.keyCode == '96' ){
      this.setState({
        'image_scale': 1,
        pos: {
          x: this.the_image_container.offsetWidth / 2,
          y: this.the_image_container.offsetHeight / 2
        }
      })
    }
  }

  preloadImage()
  {
    let image = new Image();
    image.src = this.state.image_src;
    const self = this;

    image.onload = function() {
      if( self.the_image_container == false ){
        self.the_image_container = findDOMNode(self.refs.the_image_container);
      }

      self.setState({
        loading: {
          show: false
        },
        image_ready: true,
        image_size: {
          width: this.width,
          height: this.height
        },
        pos: {
          x: self.the_image_container.offsetWidth / 2,
          y: self.the_image_container.offsetHeight / 2
        },

        resize: { ...self.state.resize,
          'width': this.width,
          'height': this.height
         }
      })
    }
  }

  fitToScreen()
  {
    const { current_image_size } = this.state
    const extra_space = 150; // in px

    // image with
    const containerHeight = this.the_image_container.offsetHeight;
    const containerWidth = this.the_image_container.offsetWidth;

    let imageWidth = this.imageObj.sizes[current_image_size]['width'];
    let imageHeight = this.imageObj.sizes[current_image_size]['height'];

    let overflowScale = 0;
    if( ( imageWidth + extra_space ) > containerWidth ){
      overflowScale = (( imageWidth + extra_space ) - containerWidth) * 100 / imageWidth * 0.01;
    }
    else if( ( imageHeight + extra_space ) > containerHeight ){
      overflowScale = (( imageHeight + extra_space ) - containerHeight) * 100 / imageHeight * 0.01;
    }

    this.setState({
      image_scale: 1 - overflowScale
    })
  }

  onMouseDown(e)
  {
    // only left mouse button
    if (e.button !== 0) return

    let where_clicked = '';

    if ( e.target.classList.contains( `${alias}crop-middle` ) ){
      where_clicked = 'preview_canvas'
    }

    if ( e.target.classList.contains( `${alias}rotator-line-mask` ) ){
      where_clicked = 'rotate-box'
    }

    if ( e.target.classList.contains( `${alias}dragg-pointer` ) ){
      where_clicked = 'dragg-pointer'
    }

    if ( e.target.classList.contains( `${alias}the-image` ) ){
      where_clicked = 'on-image'
    }

    //console.log( e.target.classList );

    if( where_clicked == 'dragg-pointer' ){

      let newX = e.pageX - this.state.crop.width_offset;
      if( e.target.classList.contains( `${alias}handle-left-left` ) ){
        newX = e.pageX + this.state.crop.width_offset;
      }

      let newY = e.pageY - this.state.crop.height_offset;
      if( e.target.classList.contains( `${alias}handle-top-middle` ) ){
        newY = e.pageY + this.state.crop.height_offset;
      }


      this.setState({
        dragpointer: e.target.classList,
        click_pos: {
          x: newX,
          y: newY
        },
      });
    }

    if( where_clicked == 'preview_canvas' ){

      let rect = findDOMNode(e.target).getBoundingClientRect();

      this.setState({
        dragging: true,
        click_pos: {
          x: e.pageX,
          y: e.pageY
        },
        image_initial_pos: {
          x: this.state.pos.x,
          y: this.state.pos.y,
        }
      })
    }

    if( where_clicked == 'rotate-box' ){
      this.setState({
        rotate: true
      });
    }

    if( where_clicked != "" ){
      e.stopPropagation()
      e.preventDefault()
    }
  }

  onMouseUp(e)
  {
    this.setState({
      dragging: false,
      rotate: false,
      dragpointer: false
    })

    //e.stopPropagation()
    //e.preventDefault()
  }

  onMouseMove(e)
  {
    if( this.state.dragpointer ){

      let { crop } = this.state

      if( this.state.dragpointer.contains( `${alias}handle-right-right` ) ){
        crop.width_offset = ( e.pageX - this.state.click_pos.x );
      }
      else if( this.state.dragpointer.contains( `${alias}handle-left-left` ) ){
        crop.width_offset = -( e.pageX - this.state.click_pos.x );
      }
      else if( this.state.dragpointer.contains( `${alias}handle-top-middle` ) ){
        crop.height_offset = -( e.pageY - this.state.click_pos.y );
      }
      else if( this.state.dragpointer.contains( `${alias}handle-bottom-middle` ) ){
        crop.height_offset = ( e.pageY - this.state.click_pos.y );
      }

      this.setState({
        crop: crop
      })
    }

    if( this.state.dragging ){

      this.setState({
        pos: {
          x: this.state.image_initial_pos.x + ( e.pageX - this.state.click_pos.x ),
          y: this.state.image_initial_pos.y + ( e.pageY - this.state.click_pos.y )
        }
      })
    }

    if( this.state.rotate ){
      if (this.state.xOld < e.pageX) {
          this.setState({
            xDirection: "left",
          })
      } else {
          this.setState({
            xDirection: "right"
          })
      }
      this.state.xOld = e.pageX;

      this.setState({
        xOld: e.pageX,
        rotateSpeed: e.shiftKey ? 'fast' : 'normal'
      })
    }

    //e.stopPropagation()
    //e.preventDefault()
  }

  zoomWheel(e)
  {
    //e.preventDefault();

    const { current_image_size } = this.state
    if( current_image_size == 'original' ) return;

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
        image_scale: new_image_scale
    })
  }

  imageOverflowPreview()
  {
    const { current_image_size, open_menu, image_scale, crop, dragg_pos, dragpointer } = this.state;

    if( current_image_size == 'original' && open_menu != 'crop' ) return;

    const offsetWidth = this.the_image_container.offsetWidth
    const offsetHeight = this.the_image_container.offsetHeight

    let width = this.imageObj.sizes[current_image_size]['width'];
    let height = this.imageObj.sizes[current_image_size]['height'];

    if( current_image_size == 'original' && open_menu == 'crop' ){

      if( crop.width == 0 ){
        crop.width = width * image_scale
        crop.height = height * image_scale
      }

      width = crop.width + crop.width_offset
      height = crop.height + crop.height_offset

      // add to crop image scale
      width = width * image_scale
      height = height * image_scale
    }

    if( offsetWidth ){
      return <div className={ `${alias}crop-window` } onContextMenu={ e => { e.preventDefault() }}>
        <div className={ `${alias}crop-top` } style={{ width: `${width}px`, height: `calc( 100% / 2 - ${(height/2)}px)` }} ></div>
        <div className={ `${alias}crop-bottom` } style={{ width: `${width}px`, height: `calc( 100% / 2 - ${(height/2)}px)` }} ></div>
        <div className={ `${alias}crop-left` } style={{ width: `calc( 100% / 2 - ${(width/2)}px)` }}></div>
        <div className={ `${alias}crop-right` } style={{ width: `calc( 100% / 2 - ${(width/2)}px)` }}></div>
        <div className={ `${alias}crop-middle` } style={{ width: `${width}px`, height: `${height}px` }}>
          {
            current_image_size == 'original' ? <Fragment>
              <span className={ `${alias}handle-top-middle ${alias}dragg-pointer` }></span>
              <span className={ `${alias}handle-right-right ${alias}dragg-pointer` }></span>
              <span className={ `${alias}handle-bottom-middle ${alias}dragg-pointer` }></span>
              <span className={ `${alias}handle-left-left ${alias}dragg-pointer` }></span>
              </Fragment> : ''
          }
        </div>
      </div>
    }
  }

  rotateControl()
  {
    const { rotate_deg, current_image_size, open_menu } = this.state;

    if( current_image_size != 'original' || open_menu == 'crop' ){
       return <div className={ `${alias}rotate-control` }>
        <div className={ `${alias}rotator-line-mask` }>
          <span></span>
          <div className={ `${alias}rotator-line` } style={ { transform: `translateX(${rotate_deg / 2 }%)` } }>
            <svg viewBox="-90 -5 180 10" xmlns="http://www.w3.org/2000/svg"><circle fill="currentColor" cx="-88" cy="0" r="0.5"></circle><text fill="currentColor" x="-90.25" y="3.5">-90°</text><circle fill="currentColor" cx="-86.04444444444445" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-84.08888888888889" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-82.13333333333334" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-80.17777777777778" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-78.22222222222223" cy="0" r="0.5"></circle><text fill="currentColor" x="-80.47222222222223" y="3.5">-80°</text><circle fill="currentColor" cx="-76.26666666666667" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-74.31111111111112" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-72.35555555555555" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-70.4" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-68.44444444444444" cy="0" r="0.5"></circle><text fill="currentColor" x="-70.69444444444444" y="3.5">-70°</text><circle fill="currentColor" cx="-66.4888888888889" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-64.53333333333333" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-62.57777777777778" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-60.62222222222222" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-58.66666666666667" cy="0" r="0.5"></circle><text fill="currentColor" x="-60.91666666666667" y="3.5">-60°</text><circle fill="currentColor" cx="-56.71111111111111" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-54.75555555555556" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-52.800000000000004" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-50.84444444444445" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-48.88888888888889" cy="0" r="0.5"></circle><text fill="currentColor" x="-51.13888888888889" y="3.5">-50°</text><circle fill="currentColor" cx="-46.93333333333334" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-44.97777777777778" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-43.022222222222226" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-41.06666666666667" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-39.111111111111114" cy="0" r="0.5"></circle><text fill="currentColor" x="-41.361111111111114" y="3.5">-40°</text><circle fill="currentColor" cx="-37.15555555555556" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-35.2" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-33.24444444444445" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-31.28888888888889" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-29.333333333333336" cy="0" r="0.5"></circle><text fill="currentColor" x="-31.583333333333336" y="3.5">-30°</text><circle fill="currentColor" cx="-27.37777777777778" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-25.422222222222224" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-23.46666666666667" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-21.51111111111112" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-19.555555555555557" cy="0" r="0.5"></circle><text fill="currentColor" x="-21.805555555555557" y="3.5">-20°</text><circle fill="currentColor" cx="-17.60000000000001" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-15.644444444444446" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-13.688888888888897" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-11.733333333333334" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-9.777777777777786" cy="0" r="0.5"></circle><text fill="currentColor" x="-12.027777777777786" y="3.5">-10°</text><circle fill="currentColor" cx="-7.822222222222223" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-5.866666666666674" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-3.9111111111111114" cy="0" r="0.2"></circle><circle fill="currentColor" cx="-1.9555555555555628" cy="0" r="0.2"></circle><circle fill="currentColor" cx="0" cy="0" r="0.5"></circle><text fill="currentColor" x="-0.75" y="3.5">0°</text><circle fill="currentColor" cx="1.9555555555555486" cy="0" r="0.2"></circle><circle fill="currentColor" cx="3.9111111111111114" cy="0" r="0.2"></circle><circle fill="currentColor" cx="5.86666666666666" cy="0" r="0.2"></circle><circle fill="currentColor" cx="7.822222222222223" cy="0" r="0.2"></circle><circle fill="currentColor" cx="9.777777777777771" cy="0" r="0.5"></circle><text fill="currentColor" x="8.277777777777771" y="3.5">10°</text><circle fill="currentColor" cx="11.733333333333334" cy="0" r="0.2"></circle><circle fill="currentColor" cx="13.688888888888883" cy="0" r="0.2"></circle><circle fill="currentColor" cx="15.644444444444446" cy="0" r="0.2"></circle><circle fill="currentColor" cx="17.599999999999994" cy="0" r="0.2"></circle><circle fill="currentColor" cx="19.555555555555557" cy="0" r="0.5"></circle><text fill="currentColor" x="18.055555555555557" y="3.5">20°</text><circle fill="currentColor" cx="21.511111111111106" cy="0" r="0.2"></circle><circle fill="currentColor" cx="23.46666666666667" cy="0" r="0.2"></circle><circle fill="currentColor" cx="25.422222222222217" cy="0" r="0.2"></circle><circle fill="currentColor" cx="27.37777777777778" cy="0" r="0.2"></circle><circle fill="currentColor" cx="29.33333333333333" cy="0" r="0.5"></circle><text fill="currentColor" x="27.83333333333333" y="3.5">30°</text><circle fill="currentColor" cx="31.28888888888889" cy="0" r="0.2"></circle><circle fill="currentColor" cx="33.24444444444444" cy="0" r="0.2"></circle><circle fill="currentColor" cx="35.2" cy="0" r="0.2"></circle><circle fill="currentColor" cx="37.15555555555555" cy="0" r="0.2"></circle><circle fill="currentColor" cx="39.1111111111111" cy="0" r="0.5"></circle><text fill="currentColor" x="37.6111111111111" y="3.5">40°</text><circle fill="currentColor" cx="41.06666666666666" cy="0" r="0.2"></circle><circle fill="currentColor" cx="43.02222222222221" cy="0" r="0.2"></circle><circle fill="currentColor" cx="44.97777777777776" cy="0" r="0.2"></circle><circle fill="currentColor" cx="46.93333333333334" cy="0" r="0.2"></circle><circle fill="currentColor" cx="48.888888888888886" cy="0" r="0.5"></circle><text fill="currentColor" x="47.388888888888886" y="3.5">50°</text><circle fill="currentColor" cx="50.844444444444434" cy="0" r="0.2"></circle><circle fill="currentColor" cx="52.79999999999998" cy="0" r="0.2"></circle><circle fill="currentColor" cx="54.75555555555556" cy="0" r="0.2"></circle><circle fill="currentColor" cx="56.71111111111111" cy="0" r="0.2"></circle><circle fill="currentColor" cx="58.66666666666666" cy="0" r="0.5"></circle><text fill="currentColor" x="57.16666666666666" y="3.5">60°</text><circle fill="currentColor" cx="60.622222222222206" cy="0" r="0.2"></circle><circle fill="currentColor" cx="62.57777777777778" cy="0" r="0.2"></circle><circle fill="currentColor" cx="64.53333333333333" cy="0" r="0.2"></circle><circle fill="currentColor" cx="66.48888888888888" cy="0" r="0.2"></circle><circle fill="currentColor" cx="68.44444444444443" cy="0" r="0.5"></circle><text fill="currentColor" x="66.94444444444443" y="3.5">70°</text><circle fill="currentColor" cx="70.4" cy="0" r="0.2"></circle><circle fill="currentColor" cx="72.35555555555555" cy="0" r="0.2"></circle><circle fill="currentColor" cx="74.3111111111111" cy="0" r="0.2"></circle><circle fill="currentColor" cx="76.26666666666665" cy="0" r="0.2"></circle><circle fill="currentColor" cx="78.22222222222223" cy="0" r="0.5"></circle><text fill="currentColor" x="76.72222222222223" y="3.5">80°</text><circle fill="currentColor" cx="80.17777777777778" cy="0" r="0.2"></circle><circle fill="currentColor" cx="82.13333333333333" cy="0" r="0.2"></circle><circle fill="currentColor" cx="84.08888888888887" cy="0" r="0.2"></circle><circle fill="currentColor" cx="86.04444444444445" cy="0" r="0.2"></circle><circle fill="currentColor" cx="88" cy="0" r="0.5"></circle><text fill="currentColor" x="86.5" y="3.5">90°</text></svg>
          </div>
        </div>
      </div>
    }
  }

  changeZoomSize()
  {
    const { zoom_pointer_push , xOld, xDirection, current_image_size } = this.state

    if( current_image_size == 'original' ) return;

    if( zoom_pointer_push ){
      if( xDirection == 'left' || xDirection == 'right' ){
        let step_size = 0.05;
        let new_scale = 0;

        if( xDirection == 'right' ){
          new_scale = (this.state.image_scale - step_size);
        }

        if( xDirection == 'left' ){
          new_scale = (this.state.image_scale + step_size);
        }

        if( new_scale >= 0.1 && new_scale <= 5 ){
          this.state.image_scale = new_scale;
        }
      }
    }
  }

  rotateStyle()
  {
    const { rotate , xOld, xDirection } = this.state

    if( rotate ){
      if( xDirection == 'left' || xDirection == 'right' ){
        let step_size = 0.1;
        if( this.state.rotateSpeed == 'fast' ){
          step_size = 0.5;
        }

        if( xDirection == 'right' ){
          this.state.rotate_deg = this.state.rotate_deg - step_size;
        }

        if( xDirection == 'left' ){
          this.state.rotate_deg = this.state.rotate_deg + step_size;
        }
      }
    }

    return this.state.rotate_deg;
  }

  flipHorizontal( e )
  {
    e.preventDefault()
    this.setState({ scaleX: this.state.scaleX == 1 ? -1 : 1 })
  }

  flipVertical( e )
  {
    e.preventDefault()
    this.setState({ scaleY: this.state.scaleY == 1 ? -1 : 1 })
  }

  rotateLeft( e )
  {
    e.preventDefault()
    this.setState({ rotate_deg: this.state.rotate_deg - 90 })
  }

  rotateRight( e )
  {
    e.preventDefault()
    this.setState({ rotate_deg: this.state.rotate_deg + 90 })
  }

  resetImage( e )
  {
    e.preventDefault()

    this.setState({
      image_scale: 1,
      rotate_deg: 0
    })
  }

  restoreImage(e)
  {
    const self = this
    e.preventDefault()

    if( confirm("Are you sure you want to restore image to the backup version? This action is irreversible!") ){
      console.log( 'ceva' );

      this.setState({
        loading: {
          show: true,
          msg: 'Image restore in progress...'
        }
      })

       axios.post( NIM.ajax_url, {
        attID: this.postObj.ID,
        sub_action: 'restore_image'
      })
      .then(res => {
        const { status, msg } = res.data

        if( status == 'invalid' ){
          self.setState({
            'notify': {
              type: 'error',
              show: true,
              msg: <div>{msg}</div>
            },

            loading: {
              show: false
            }
          })
        }else{
          window.location.reload();
        }
      })
    }
  }

  saveImage(e)
  {
    const self = this
    //e.preventDefault()

    const { current_image_size, rotate_deg, scaleX, scaleY, resize, open_menu, crop } = this.state
    let { image_scale } = this.state

    let save_canvas = this.the_image;

    // save the main image but we need to add rotation and crop on it
    let width = this.imageObj.sizes[current_image_size]['width'];
    let height = this.imageObj.sizes[current_image_size]['height'];

    if( open_menu == "crop" ){
      image_scale = 1;
      width = crop.width + crop.width_offset;
      height = crop.height + crop.height_offset;
    }

    // if is resized use the resize value for width and height
    if( current_image_size == 'original' && open_menu != "crop" ){
      width = resize.width;
      height = resize.height;

      // recenter image before generate
      self.state.pos.x = self.the_image_container.offsetWidth / 2;
      self.state.pos.y = self.the_image_container.offsetHeight / 2;

      // check if rotated
      if( rotate_deg == 90 || rotate_deg == -90 ){
        width = resize.height;
        height = resize.width;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    let x = -( self.the_image_container.offsetWidth / 2 - self.state.pos.x ) - (self.the_image.width * image_scale / 2) + width / 2;
    let y = -( self.the_image_container.offsetHeight / 2 - self.state.pos.y ) - (self.the_image.height * image_scale / 2) + height / 2;

    const ctx = canvas.getContext("2d");

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    //ctx.globalAlpha = 0.4;

    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);

    if( scaleX == -1 ){
      ctx.translate( this.the_image.width, 0 );
      ctx.scale( -1, 1 );
    }

    if( scaleY == -1 ){
      ctx.translate( 0, this.the_image.height );
      ctx.scale( 1, -1 );
    }

    let posX = 0;
    let posY = 0;
    if( rotate_deg != 0 ){
      ctx.translate( width/2, height/2 );
      ctx.rotate( rotate_deg * (Math.PI / 180) );

      posX = x - width/2
      posY = y - height/2

    }else{
      posX = x
      posY = y
    }

    ctx.drawImage(
      this.the_image,
      posX,
      posY,
      self.the_image.width * image_scale,
      self.the_image.height * image_scale
    );

    ctx.restore();

    this.setState({ save_canvas: canvas.toDataURL() })
  }

  topPanelMenu()
  {
    const { current_image_size } = this.state

    const self = this

    return <div className={ `${alias}top-panel` }>

      <div className={ `${alias}preview-wrapper` }>
        <div className={ `${alias}preview` }>
          {/*<img src={ this.imageObj.sizes.thumbnail.url } />*/}
          <div>
            <div>
              <dd>Name:</dd>
              <dt>{ this.postObj.post_title }</dt>
            </div>
            <div>
              <dd>Size:</dd>
              <dt>{ this.imageObj.width }px / { this.imageObj.height }px</dt>
            </div>
            <div>
              <dd>Added date:</dd>
              <dt>{ this.postObj.post_date }</dt>
            </div>
          </div>
        </div>
      </div>

      <div className={ `${alias}change_size` }>
        <div>
          <h1>{ current_image_size }</h1>
          <h2>{ self.imageObj.sizes[current_image_size]['width'] }px / { self.imageObj.sizes[current_image_size]['height'] }px</h2>
          <span class="dashicons dashicons-arrow-down-alt2"></span>
        </div>
        <ul>
          {
            Object.keys(this.imageObj.sizes).map( (name, index) => {
              return <li key={ index } onClick={ () => self.setState({ current_image_size: name })}>
                <h1>{ name }</h1>
                <h2>{ self.imageObj.sizes[name]['width'] }px / { self.imageObj.sizes[name]['height'] }px</h2>
              </li>
            })
          }
        </ul>
      </div>

      {
        current_image_size == 'original' && self.imageObj.sizes[current_image_size].unmodified ? <div className={ `${alias}change_to_unmodified` }>
          <div>
            <p>This image has a backup. You can find the original image <a target="_blank" href={ self.imageObj.sizes[current_image_size].unmodified }>here</a></p>
            <Button isPrimary onClick={ this.restoreImage }>Restore Image</Button>
          </div>
        </div>: ''
      }

      <a href="#save" onClick={ this.saveImage } className={ `${alias}save-btn` }>Save Image</a>
    </div>
  }

  faceDetector()
  {
    const { current_image_size, image_scale, fd } = this.state
    const self = this;

    function rgba_to_grayscale(rgba, nrows, ncols) {
      var gray = new Uint8Array(nrows*ncols);
      for(var r=0; r<nrows; ++r)
        for(var c=0; c<ncols; ++c)
          // gray = 0.2*red + 0.7*green + 0.1*blue
          gray[r*ncols + c] = (2*rgba[r*4*ncols+4*c+0]+7*rgba[r*4*ncols+4*c+1]+1*rgba[r*4*ncols+4*c+2])/10;
      return gray;
    }

    this.setState({
      loading: {
        show: true,
        msg: 'Facefinder in progress...'
      }
    })

    let facefinder_classify_region = function(r, c, s, pixels, ldim) {return -1.0;};

    fetch(NIM.cascadeurl).then(function(response) {

      response.arrayBuffer().then(function(buffer) {
        var bytes = new Int8Array(buffer);
        facefinder_classify_region = pico.unpack_cascade(bytes);

        const the_image_ctx = self.the_image.getContext('2d');

        const image_width = self.state.image_size.width;
        const image_height = self.state.image_size.height;

        var rgba = the_image_ctx.getImageData(
          0, 0,
          image_scale * image_width,
          image_scale * image_height
        ).data;

        var image = {
          "pixels": rgba_to_grayscale(rgba, image_height, image_width),
          "nrows": image_height,
          "ncols": image_width,
          "ldim": image_width
        }

        var params = {
          "shiftfactor": fd.shiftfactor, // move the detection window by 10% of its size
          "minsize": fd.minsize,      // minimum size of a face (not suitable for real-time detection, set it to 100 in that case)
          "maxsize": fd.maxsize,    // maximum size of a face
          "scalefactor": fd.scalefactor // for multiscale processing: resize the detection window by 10% when moving to the higher scale
        }

        var dets = pico.run_cascade(image, facefinder_classify_region, params);
        dets = pico.cluster_detections(dets, 0.2); // set IoU threshold to 0.2

        // draw results
        var qthresh = 5.0 // this constant is empirical: other cascades might require a different one

        let facesListArray = []
        for(var i=0; i<dets.length; ++i){
          if(dets[i][3]>qthresh)
          {
            facesListArray.push({
              'x': dets[i][1],
              'y': dets[i][0],
              'size': dets[i][2],
              'q': dets[i][3]
            })

            if( self._face_detection_debug ){
              the_image_ctx.beginPath();
              the_image_ctx.rect(dets[i][1] - 5, dets[i][0] -5 , 10, 10);
              the_image_ctx.lineWidth = 1;
              the_image_ctx.strokeStyle = 'red';
              the_image_ctx.stroke();
            }
          }

          self.setState({ 'faces_list': facesListArray });
        }

        self.setState({
          loading: {
            show: false,
            msg: 'Face detection in progress...'
          }
        })
      })
    })
  }

  applyResize()
  {
    const { current_image_size, resize } = this.state

    // only for original image
    if( current_image_size == 'original' ) {
      this.the_image.width = resize.width;
      this.the_image.height = resize.height;
    }
  }

  componentDidUpdate()
  {
    const { current_image_size, image_scale, apply_instagram_filter, resize } = this.state
    let { rotate_deg } = this.state
    const self = this;

    function applyImageToCanvas()
    {
      // should rebuild the original image according new options, like resize / filters .. etc.
      if( self.the_image_ctx.shouldUpdate ){
        self.the_image_ctx.drawImage(
          self.image_orig,
          0,
          0,
          self.the_image.width,
          self.the_image.height
        );

        self.the_image_ctx.shouldUpdate = false;
      }
    }

    if( this.the_image == false ){
      this.the_image = findDOMNode(this.refs.the_image);

      this.image_orig = new Image();
      this.image_orig.src = this.the_image.getAttribute('src');
      this.image_orig.onload = function() {

        self.the_image.width = this.width
        self.the_image.height = this.height

        self.the_image_size = {
          width: this.width,
          height: this.height,
        }

        self.the_image_ctx = self.the_image.getContext('2d');
        self.the_image_ctx.shouldUpdate = true;

        applyImageToCanvas();
      }
    }

    else{
      self.applyResize();
      self.applyFilters();

      applyImageToCanvas();
    }

    // make selection, I put this here because we cached the filters list
    if( apply_instagram_filter ){

      var elems = document.querySelectorAll( `.${alias}instagram-filter-item` );
      [].forEach.call(elems, function(el) {
          el.classList.remove("is_selected_effect");
      });

      document.getElementById( `instagram-effect-${apply_instagram_filter}` ).className += " is_selected_effect";
    }
  }

  applyFilters()
  {

    if( this.state.apply_instagram_filter ){
      const attrs = {
        ctx: this.the_image_ctx,
        image: this.image_orig,
        x: (this.the_image.width - this.state.image_size.width) / 2,
        y: (this.the_image.height - this.state.image_size.height) / 2,
        width: this.state.image_size.width,
        height: this.state.image_size.height,
        scaleX: this.state.scaleX,
        scaleY: this.state.scaleY,
      }

      InstagramFilter( this.state.apply_instagram_filter, attrs );
    }
    else{

      const { filters } = this.state

      if( this.the_image_ctx ){

        let apply_filters = []

        Object.keys(this.defaultsFilters.exposure).forEach( key => {
          apply_filters.push( `${key}(${this.state.filters.exposure[key]})` );
        })

        this.the_image_ctx.filter = apply_filters.join(" ");
        this.the_image_ctx.shouldUpdate = true;
      }
    }
  }

  imageResizeOptions( prop )
  {
    const { current_image_size, image_size, resize } = this.state;
      if( image_size ){
        if( current_image_size == 'original' ) {
          return resize[prop]
        }else{
          return this.imageObj.sizes[current_image_size][prop]
        }
      }
      return 0
  }

  buildPreviewCanvas()
  {
    const { current_image_size, image_ready, resize } = this.state;

    if( image_ready ){
      let width = this.imageResizeOptions( 'width' );
      let height = this.imageResizeOptions( 'height' );

      return <canvas ref='preview_canvas' className={ `${alias}preview_canvas` } width={ width } height={ height } style={ {
        marginLeft: `-${width/2}px`,
        marginTop: `-${height/2}px`
      } }></canvas>
    }
  }

  showNotify()
  {
    const { notify } = this.state
    if( notify.show ){

      setTimeout(() => {
        this.setState({
          'notify': {
            show: false
          }
        })
      }, 5000 )
      return <div className={ `${alias}notify is_${notify.type}` } onClick={ (e) => {
        this.setState({
          'notify': {
            show: false
          }
        })
      }}>
        <h2>{notify.type}</h2>
        { notify.msg }
      </div>
    }
  }

  showLoading()
  {
    const { loading } = this.state

    if( loading.show ){
      return <div className={ `${alias}overlay-loading` }>
        <div>
          <Loader
            type="Puff"
            color="#00BFFF"
            height="100"
            width="100"
          />
          <h2>{ loading.msg }</h2>
        </div>
      </div>
    }
  }

  moveToFace(e)
  {
    const { image_scale, image_size } = this.state
    const face = JSON.parse( e.target.getAttribute('data-face') );

    let new_x = this.the_image_container.offsetWidth / 2;
    let new_y = this.the_image_container.offsetHeight / 2;

    new_x = new_x + (image_size.width / 2 - face.x) * image_scale - ( (this.state.image_size.width - this.the_image.width) / 2 )
    new_y = new_y + (image_size.height / 2 - face.y) * image_scale - ( (this.state.image_size.height - this.the_image.height) / 2 )

    this.setState({
      pos: {
        'x': new_x,
        'y': new_y
      }
    })

  }

  buildFaceList()
  {
    const { faces_list } = this.state
    const self = this

    if( faces_list.length > 0 ){

      const items = faces_list.map( (face, index) => {

        const canvas = document.createElement("canvas");
        canvas.width = face.size;
        canvas.height = face.size;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(
          this.the_image,
          -face.x + face.size / 2,
          -face.y + face.size / 2
        );

        ctx.restore();

        return <img data-face={ JSON.stringify(face) } src={ canvas.toDataURL("image/png") } onClick={ self.moveToFace } />;
      })

      return <Fragment>
        <div className={ `${alias}faces-list` } ref="faces_list">
          { items.length == 0 ? <div>No human face detected! Try to adjust the above settings!</div> : <h2>Results</h2> }
          { items.length ? <div className={ `${alias}faces-list-grid` }>{ items }</div> : '' }
        </div>
      </Fragment>
    }
  }

  toggleFullscreen( event )
  {
    event.preventDefault();
    let self = this

    let element = findDOMNode( this.refs.the_image_editor_wrapper );

    let isFullscreen = document.webkitIsFullScreen || document.mozFullScreen || false;

    element.requestFullScreen = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || function () { return false; };
    document.cancelFullScreen = document.cancelFullScreen || document.webkitCancelFullScreen || document.mozCancelFullScreen || function () { return false; };
    isFullscreen ? document.cancelFullScreen() : element.requestFullScreen();
    element.classList.toggle("isFullscreen")

    document.addEventListener('fullscreenchange', this.exitHandler.bind(this) );
    document.addEventListener('webkitfullscreenchange', this.exitHandler.bind(this) );
    document.addEventListener('mozfullscreenchange', this.exitHandler.bind(this) );
    document.addEventListener('MSFullscreenChange', this.exitHandler.bind(this) );

    this.setState({ open_menu: 'fullscreen' })
  }

  exitHandler( player ) {
      if (!document.fullscreenElement && !document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {
        player.srcElement.classList.remove("isFullscreen");
        this.setState({ open_menu: false })
      }
  }

  buildFastControls()
  {
    let { image_scale, rotate_deg, current_image_size, open_menu } = this.state

    image_scale = parseFloat(image_scale * 100).toFixed(2);
    if( current_image_size == 'original' && open_menu != 'crop' ) return;

    return <div className={ `${alias}fast-controls` }>

      <span className="react-icons-icon-moon-fit-to-screen" onClick={ this.fitToScreen }></span>

      <Slider
        label="Zoom"
        unit="%"
        value={ image_scale }
        std={ 100 }
        step={ 1 }
        max={ 200 }
        min={ 1 }
        onChange={ (val) => {
          const new_scale = parseFloat((parseFloat(val) * 0.01).toFixed(2));

          this.setState({
            image_scale: new_scale
          })
        } }
      />
    </div>
  }

  diagonalPx()
  {
    return Math.sqrt( Math.pow(this.state.image_size.width , 2) + Math.pow(this.state.image_size.height, 2) )
  }

  buildInstagramEffectPreview()
  {
    let image = new Image();
    image.src = this.imageObj.sizes.medium.url;
    const self = this;
    if( !self.instagram_eff_generated ){
      image.onload = function() {
        self.instagram_eff_generated = {
          image: this,
          width: this.width,
          height: this.height,
          loaded: false
        }
      }
    }

    if( self.instagram_eff_generated && !self.instagram_eff_generated.loaded ){
      const effects_html = Object.keys(self.instragramEffects).map( key => {

        let preview = document.createElement("canvas");
        preview.width = self.instagram_eff_generated.width
        preview.height = self.instagram_eff_generated.height / 1.3
        const center = self.instagram_eff_generated.height - preview.height;

        let ctx = preview.getContext("2d");
        ctx.drawImage(
          self.instagram_eff_generated.image,
          0,
          -( center )
        )
        ctx.restore();

        const attrs = {
          ctx: ctx,
          image: preview,
          x: 0,
          y: 0,
          width: self.instagram_eff_generated.width,
          height: preview.height
        }

        const status = InstagramFilter( key, attrs );
        //console.log( key, status );
        if( status ){
          return <div id={ `instagram-effect-${key}` } className={ `${alias}instagram-filter-item` } onClick={ (e) => {
            self.setState({ apply_instagram_filter: key })
          }}>
            <img src={ preview.toDataURL("image/png") } />
            <label>{ self.instragramEffects[key] }</label>
          </div>
        }

        return <Fragment></Fragment>
      })

      self.instagram_eff_generated['loaded'] = effects_html;

      return effects_html;
    }else{
      if( typeof(self.instagram_eff_generated.loaded) != "undefined" ){
        return self.instagram_eff_generated.loaded;
      }
    }
  }

  openMenu( menu, e )
  {
    e.preventDefault();

    const { open_menu } = this.state

    if( menu == open_menu ){
      this.setState({ open_menu: false })
    }
    else{
      this.setState({ open_menu: menu })
    }
  }

  buildBeforeSave()
  {
    const { current_image_size, before_save } = this.state

    if( this.state.save_canvas ){
      return <div className={ `${alias}before-save` }>
        <div className={ `${alias}before-save-content` }>
          <div className={ `${alias}images-wrapper` }>
            <Button className={ `${alias}orig-btn ${before_save == 'original' ? 'is_selected' : ''}` } onClick={ () => this.setState({ 'before_save': 'original' }) }>Original</Button>
            <Button className={ `${alias}new-btn ${before_save == 'new' ? 'is_selected' : ''}` } onClick={ () => this.setState({ 'before_save': 'new' }) }>New Image</Button>
            {
              before_save == 'original' ? <div>
                <PerfectScrollbar>
                  <img src={ this.imageObj.sizes[current_image_size].url } />
                </PerfectScrollbar>
              </div> : ''
            }

            {
              before_save == 'new' ? <div>
                <PerfectScrollbar>
                  <img src={ this.state.save_canvas } />
                </PerfectScrollbar>
              </div> : ''
            }
          </div>
          <form>
            <div>
              <Button className={ `${alias}btn-over-write` } onClick={ this.saveAndOverwite }>
                <span>Save</span>
              </Button>
              <p className={ `${alias}notice` }>Save this image and overwrite the original image.</p>
            </div>

            {
              /*
              current_image_size == 'original' ? <div>
                <Button className={ `${alias}btn-copy` } onClick={ this.saveAsCopy }>
                  <span>Save as Copy</span>
                </Button>
                <p className={ `${alias}notice` }>Save this image as a copy of original image. <span>You can rollback the original image anytime from main panel.</span></p>
              </div> : ''
              */
            }

            <div>
              <Button className={ `${alias}btn-cancel` } onClick={ () => this.setState({ save_canvas: false }) }>
                <span>Cancel</span>
              </Button>
              <p className={ `${alias}notice` }>Cancel, without any risk!</p>
            </div>
          </form>
        </div>
      </div>
    }
  }

  resetImageAll( e )
  {
    e.preventDefault();

    if( confirm("Are you sure do you want to reset image to default?") ){
      this.setState({
        image_scale: 1,
        rotate_deg: 0,
        apply_instagram_filter: 0,
        filters: {
          exposure: {
            brightness: this.defaultsFilters.exposure.brightness,
            contrast: this.defaultsFilters.exposure.contrast,
            saturate: this.defaultsFilters.exposure.saturate,
            grayscale: this.defaultsFilters.exposure.grayscale,
            sepia: this.defaultsFilters.exposure.sepia,
            invert: this.defaultsFilters.exposure.invert,
            blur: this.defaultsFilters.exposure.blur,
          }
        }}
      )
    }
  }

  render()
  {
    const { image_scale, dragging, image_ready, pos, rotate_deg, filters, open_menu, image_size, resize, current_image_size, fd, crop, magic } = this.state

    if( this.where == 'list' ){
      return <IMAGE_EDITOR_List />
    }

    { this.rotateStyle() }
    { this.changeZoomSize() }

    let image_pos_top = `${this.state.pos.y}px`;
    let image_pos_left = `${this.state.pos.x}px`;
    let image_margin_top = `-${ resize.height / 2 }px`;
    let image_margin_left = `-${ resize.width / 2 }px`;

    // current_image_size
    if( current_image_size == 'original' && 0 ){
      image_pos_top = '0px';
      image_pos_left = '0px';
      image_margin_top = '0px';
      image_margin_left = '0px';
    }

    return <div className={ `${alias}wrapper open-menu-${open_menu}` } ref='the_image_editor_wrapper'>

      { this.buildBeforeSave() }

      <div className={ `${alias}nav` }>
        <a href={ NIM.plugin_url } className={ `${alias}logo` }>
          <img src={ logo } />
        </a>
        <ul>
          <li className={ open_menu == 'exposure' ? `${alias}menu_is_open` : '' }>
            <a href="#" title="Adjust" onClick={ this.openMenu.bind(this, 'exposure' ) }><i className="react-icons-icon-moon-exposure"></i></a>
            <div className={ `${alias}wrapper-menu-block` }>
              <a href="#" onClick={ (e) => { e.preventDefault(); this.setState({ open_menu: false }) } } className={ `${alias}back-btn` }></a>

              <Slider
                label="Brightness"
                unit="%"
                value={ filters.exposure.brightness }
                std={ this.defaultsFilters.exposure.brightness }
                step={ 1 }
                max={ 400 }
                min={ 0 }
                onChange={ ( val ) => this.setState({ apply_instagram_filter: false, 'filters': { ...filters, ['exposure']: { ...filters['exposure'], ['brightness'] : val } } }) }
              />

              <Slider
                label="Contrast"
                unit="%"
                value={ filters.exposure.contrast }
                std={ this.defaultsFilters.exposure.contrast }
                step={ 1 }
                max={ 1000 }
                min={ 0 }
                onChange={ ( val ) => this.setState({ apply_instagram_filter: false, 'filters': { ...filters, ['exposure']: { ...filters['exposure'], ['contrast'] : val } } }) }
              />

              <Slider
                label="Saturate"
                unit="%"
                value={ filters.exposure.saturate }
                std={ this.defaultsFilters.exposure.saturate }
                step={ 10 }
                max={ 1000 }
                min={ 0 }
                onChange={ ( val ) => this.setState({ apply_instagram_filter: false, 'filters': { ...filters, ['exposure']: { ...filters['exposure'], ['saturate'] : val } } }) }
              />

              <Slider
                label="Grayscale"
                unit="%"
                value={ filters.exposure.grayscale }
                std={ this.defaultsFilters.exposure.grayscale }
                step={ 1 }
                max={ 100 }
                min={ 0 }
                onChange={ ( val ) => this.setState({ apply_instagram_filter: false, 'filters': { ...filters, ['exposure']: { ...filters['exposure'], ['grayscale'] : val } } }) }
              />

              <Slider
                label="Sepia"
                unit="%"
                value={ filters.exposure.sepia }
                std={ this.defaultsFilters.exposure.sepia }
                step={ 1 }
                max={ 100 }
                min={ 0 }
                onChange={ ( val ) => this.setState({ apply_instagram_filter: false, 'filters': { ...filters, ['exposure']: { ...filters['exposure'], ['sepia'] : val } } }) }
              />

              <Slider
                label="Blur"
                unit="px"
                value={ filters.exposure.blur }
                std={ this.defaultsFilters.exposure.blur }
                step={ 0.1 }
                max={ 10 }
                min={ 0 }
                onChange={ ( val ) => this.setState({ apply_instagram_filter: false, 'filters': { ...filters, ['exposure']: { ...filters['exposure'], ['blur'] : val } } }) }
              />

              <Slider
                label="Invert"
                unit="%"
                value={ filters.exposure.invert }
                std={ this.defaultsFilters.exposure.invert }
                step={ 1 }
                max={ 100 }
                min={ 0 }
                onChange={ ( val ) => this.setState({ apply_instagram_filter: false, 'filters': { ...filters, ['exposure']: { ...filters['exposure'], ['invert'] : val } } }) }
              />

            </div>
          </li>
          <li className={ open_menu == 'instragram' ? `${alias}menu_is_open` : '' }>
            <a href="#" title="Instagram Effects" onClick={ this.openMenu.bind(this, 'instragram' ) }><i className="react-icons-icon-moon-colors"></i></a>
            <div className={ `${alias}wrapper-menu-block ${alias}instragram` } >
              <a href="#" onClick={ (e) => { e.preventDefault(); this.setState({ open_menu: false }) } } className={ `${alias}back-btn` }></a>
              <h4 class="ImageEditor-menu-title">Instagram Filters</h4>
              <PerfectScrollbar>
                <div className={ `${alias}in-content` }>
                  { this.buildInstagramEffectPreview() }
                </div>
              </PerfectScrollbar>
            </div>
          </li>

          {
            current_image_size == 'original' ? <li className={ open_menu == 'resize' ? `${alias}menu_is_open` : '' }>
              <a href="#" title="Resize Image" onClick={ this.openMenu.bind(this, 'resize' ) }><i className="react-icons-icon-moon-resize"></i></a>
              <div className={ `${alias}wrapper-menu-block ${alias}resize` }>
                <a href="#" onClick={ (e) => { e.preventDefault(); this.setState({ open_menu: false }) } } className={ `${alias}back-btn` }></a>
                <div>
                  <h4 className={ `${alias}menu-title` }>Image Resize</h4>
                  <div>
                    <div>
                      <h2>Width</h2>
                      <div>
                        <NumericInput
                          min={ 1 }
                          value={ resize.width }
                          onChange={ (val) => this.calculateNewSize( 'width', val ) }
                        />
                        <span className={ `${alias}input-number-label` }>px</span>
                      </div>
                    </div>
                    <div>
                      <h2>Height</h2>
                      <div>
                        <NumericInput
                          min={ 1 }
                          value={ resize.height }
                          onChange={ (val) => this.calculateNewSize( 'height', val ) }
                        />
                        <span className={ `${alias}input-number-label` }>px</span>
                      </div>
                    </div>
                  </div>

                  <span>
                    <CheckboxControl
                      label="Lock Aspect Ratio"
                      checked={ resize.aspect_ration }
                      onChange={ (isChecked) => this.setState({ resize: { ...this.state.resize, aspect_ration: !resize.aspect_ration } }) }
                    />
                  </span>
                </div>
              </div>
            </li> : ''
          }

          {
            current_image_size == 'original' ? <li className={ open_menu == 'crop' ? `${alias}menu_is_open` : '' }>
              <a href="#" title="Crop Image" onClick={ this.openMenu.bind(this, 'crop' ) }><i className="react-icons-icon-moon-crop"></i></a>
              <div className={ `${alias}wrapper-menu-block ${alias}crop` }>
                <a href="#" onClick={ (e) => { e.preventDefault(); this.setState({ open_menu: false }) } } className={ `${alias}back-btn` }></a>
                <div>

                  <h4 className={ `${alias}menu-title` }>Image Crop</h4>
                  <div>
                    <div>
                      <h2>Width</h2>
                      <div>
                        <NumericInput
                          min={ 1 }
                          value={ crop.width + crop.width_offset }
                          onChange={ (val) => this.calculateNewCrop( 'width', val ) }
                        />
                        <span className={ `${alias}input-number-label` }>px</span>
                      </div>
                    </div>
                    <div>
                      <h2>Height</h2>
                      <div>
                        <NumericInput
                          min={ 1 }
                          value={ crop.height + crop.height_offset }
                          onChange={ (val) => this.calculateNewCrop( 'height', val ) }
                        />
                        <span className={ `${alias}input-number-label` }>px</span>
                      </div>
                    </div>
                  </div>

                  <span>
                    <CheckboxControl
                      label="Lock Aspect Ratio"
                      checked={ crop.aspect_ration }
                      onChange={ (isChecked) => this.setState({ crop: { ...this.state.crop, aspect_ration: !crop.aspect_ration } }) }
                    />
                  </span>
                </div>
              </div>
            </li> : ''
          }

          <li className={ open_menu == 'rotate' ? `${alias}menu_is_open` : '' }>
            <a href="#" title="Rotate Image" onClick={ this.openMenu.bind(this, 'rotate' ) }><i className="react-icons-icon-moon-rotate"></i></a>
            <div className={ `${alias}wrapper-menu-block ${alias}rotate` }>
              <a href="#" onClick={ (e) => { e.preventDefault(); this.setState({ open_menu: false }) } } className={ `${alias}back-btn` }></a>
                <h4 className={ `${alias}menu-title` }>Image Rotate</h4>
              <div>

                <div>
                  <h2>Rotate</h2>
                  <a href="#" onClick={ this.rotateLeft }><i className="react-icons-icon-moon-rotate-ccw"></i></a>
                  <a href="#" onClick={ this.rotateRight }><i className="react-icons-icon-moon-rotate-cw"></i></a>
                </div>
                <div>
                  <h2>Flip</h2>
                  <a href="#" onClick={ this.flipVertical }><i className="react-icons-icon-moon-flip-vertical3"></i></a>
                  <a href="#" onClick={ this.flipHorizontal }><i className="react-icons-icon-moon-flip-vertical4"></i></a>
                </div>
              </div>
            </div>
          </li>

          {
            image_scale != 1 || rotate_deg != 0 ?
              <li><a href="#" title="Reset image scale and rotation" onClick={ this.resetImage } ><i className="react-icons-icon-moon-reset"></i></a></li>
            : ''
          }

          {
            image_scale == 1 && rotate_deg == 0 && current_image_size != 'original' ?
              <li className={ open_menu == 'facedetector' ? `${alias}menu_is_open` : '' }>
                <a href="#" title="Faces detector" onClick={ this.openMenu.bind(this, 'facedetector' ) }><i className="react-icons-icon-moon-facial-recognition"></i></a>
                { this.state.faces_list.length > 0 ? <div className={ `${alias}faces-notify` }></div> : '' }

                <div className={ `${alias}wrapper-menu-block ${alias}facedetector` }>
                <a href="#" onClick={ (e) => { e.preventDefault(); this.setState({ open_menu: false }) } } className={ `${alias}back-btn` }></a>
                  <div>
                    <div>
                      <form>
                        <div>
                          <Slider
                            label="Shift factor"
                            unit="%"
                            value={ fd.shiftfactor }
                            std={ "0.1" }
                            step={ 0.01 }
                            max={ 1 }
                            min={ 0.01 }
                            onChange={ ( val ) => this.setState({ 'fd': { ...fd, ['shiftfactor']: parseFloat(val) } }) }
                          />
                          <p className={ `${alias}info` } >Move the detection window by <bold>X%</bold> of its size</p>
                        </div>

                        <div>
                          <Slider
                            label="Minimum Size"
                            unit="px"
                            value={ fd.minsize }
                            std={ 20 }
                            step={ 1 }
                            max={ 400 }
                            min={ 10 }
                            onChange={ ( val ) => this.setState({ 'fd': { ...fd, ['minsize']: parseFloat(val) } }) }
                          />
                          <p className={ `${alias}info` } >Minimum size of a face</p>
                        </div>

                        <div>
                          <Slider
                            label="Maximum Size"
                            unit="px"
                            value={ fd.maxsize }
                            std={ 20 }
                            step={ 1 }
                            max={ 400 }
                            min={ 10 }
                            onChange={ ( val ) => this.setState({ 'fd': { ...fd, ['maxsize']: parseFloat(val) } }) }
                          />
                          <p className={ `${alias}info` } >Maximum size of a face</p>
                        </div>

                        <div>
                          <Slider
                            label="Scale factor"
                            unit="%"
                            value={ fd.scalefactor }
                            std={ 1.2 }
                            step={ 0.01 }
                            max={ 5 }
                            min={ 0.1 }
                            onChange={ ( val ) => this.setState({ 'fd': { ...fd, ['scalefactor']: parseFloat(val) } }) }
                          />
                          <p className={ `${alias}info` } >For multiscale processing: resize the detection window by <bold>X%</bold> when moving to the higher scale</p>
                        </div>

                        <Button isPrimary onClick={ this.faceDetector }>
                          <span>Search for human faces</span>
                        </Button>
                      </form>
                      {
                        this.state.faces_list.length ? this.buildFaceList() : ''
                      }
                    </div>
                  </div>
                </div>
              </li>
            : ''
          }

          <li className={ open_menu == 'fullscreen' ? `${alias}menu_is_open` : '' }>
            <a href="#" onClick={ this.toggleFullscreen } title="Toggle Fullscreen"><i className="react-icons-icon-moon-fullscreen"></i></a>
          </li>

          <li className={ `${alias}reset-all-block` }>
            <a href="#" onClick={ this.resetImageAll } title="Reset image"><i className="dashicons dashicons-image-rotate"></i></a>
          </li>
        </ul>
      </div>
      <div className={ `${alias}content` } onWheel = {(e) => this.zoomWheel(e) }>

        { this.showLoading() }
        { this.showNotify() }

        { this.topPanelMenu() }
        <div className={ `${alias}main-wrapper` }>

          { this.rotateControl() }

          <div className={ `${alias}main-image` } ref="the_image_container">

            <PerfectScrollbar className={ `${alias}main-image-scroll` }>

              { this.imageOverflowPreview() }

              {
                !image_ready ?
                  <div>loader</div>
                :
                  <canvas ref='the_image' className={ `${alias}the-image` } src={ this.state.image_src } style={{
                    transform: `scale(${image_scale}) scaleX(${this.state.scaleX}) scaleY(${this.state.scaleY}) rotate(${rotate_deg}deg)`,
                    position: 'absolute',
                    left: image_pos_left,
                    top: image_pos_top,
                    marginLeft: image_margin_left,
                    marginTop: image_margin_top
                  }} />
              }

              { this.buildFastControls() }
            </PerfectScrollbar>
          </div>
        </div>
      </div>
    </div>
  }
}

wp.domReady( function() {
  if( image_block_wrapper ) render( <IMAGE_EDITOR_box />, image_block_wrapper );
} );
