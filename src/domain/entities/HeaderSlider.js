import mongoose from 'mongoose'

const slideSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  offer: {
    type: String,
    required: true
  },
  buttonText1: {
    type: String,
    required: true
  },
  buttonText2: {
    type: String,
    required: true
  },
  buttonLink1: {
    type: String,
    default: ''
  },
  buttonLink2: {
    type: String,
    default: ''
  },
  imgSrc: {
    type: String,
    required: true
  }
})

const headerSliderSchema = new mongoose.Schema({
  slides: {
    type: [slideSchema],
    required: true
  }
}, {
  timestamps: true
})

// Si el modelo ya existe, usar el existente, sino crear uno nuevo
const HeaderSlider = mongoose.models.HeaderSlider || mongoose.model('HeaderSlider', headerSliderSchema)

export default HeaderSlider
