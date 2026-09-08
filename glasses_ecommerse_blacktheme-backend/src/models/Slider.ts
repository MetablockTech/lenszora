import mongoose from 'mongoose';

const sliderSchema = new mongoose.Schema({
  title: { type: String },
  subtitle: { type: String },
  image: { type: String, required: true },
  bannerType: { type: String, default: 'Main Banner' },
  resourceType: { type: String, default: 'Custom' },
  resourceId: { type: String },
  buttonText: { type: String, default: 'Shop Now' },
  buttonLink: { type: String, default: '/' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  targetPage: { type: String, default: '/' },
  delaySeconds: { type: Number, default: 1 }
}, {
  timestamps: true
});

export const Slider = mongoose.model('Slider', sliderSchema);
