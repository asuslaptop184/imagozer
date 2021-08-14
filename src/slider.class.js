const { Component, render, findDOMNode, Fragment } = wp.element;

const {
  RangeControl
} = wp.components;

const alias = 'ImageEditor-'
class IMAGE_EDITOR_slider extends Component {

  constructor(props) {
    super(props);

    this.state = {
      value: parseFloat(this.props.value),
      std: this.props.std,
      step: this.props.step,
      min: this.props.min,
      max: this.props.max,
    }
  }

  change( val )
  {
    const { unit } = this.props
    val = parseFloat(parseFloat(val).toFixed(2))

    if( val > this.state.max ) val = this.state.max
    if( val < this.state.min ) val = this.state.min

    this.setState({ value: val})
    this.props.onChange( `${val}${unit}` )
  }

  render() {

    let { value, std, step, max, min } = this.state
    const { unit } = this.props

    if( this.props.value != value ){
     // value = this.props.value;
    }

    return <div className={ `${alias}slider-with-controls` }>
        <span className={ `${alias}slider-minus react-icons-icon-moon-minus3` } onClick={ () => this.change( value - step ) }></span>
        <RangeControl
          label={ <Fragment>
            <span>{ this.props.label }</span>
            <span className={ `${alias}value` }>{ value }{ unit }</span>
            { `${value}${unit}` != std ? <i className="react-icons-icon-moon-reset" onClick={ () => this.change( std ) }></i>: '' }
          </Fragment> }
          value={ value }
          onChange={ (val) => this.change( val ) }
          min={ min }
          step={ step }
          max={ max }
        />
        <span className={ `${alias}slider-plus react-icons-icon-moon-plus3` } onClick={ () => this.change( value + step ) }></span>
      </div>
  }
}

export { IMAGE_EDITOR_slider };