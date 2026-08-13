import { v2 as cloudinary } from 'cloudinary'
import { config } from './config.js'


if (config.CLOUDINARY_URL) {
    cloudinary.config({
        cloudinary_url: config.CLOUDINARY_URL,
        secure: true,
    })
} else {
    cloudinary.config({
        cloud_name: config.CLOUDINARY_CLOUD_NAME,
        api_key: config.CLOUDINARY_API_KEY,
        api_secret: config.CLOUDINARY_API_SECRET,
        secure: true,
    })
}

export { cloudinary }