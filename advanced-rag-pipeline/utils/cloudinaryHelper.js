import { cloudinary } from '../config/cloudinary.js';

export function getSignedCloudinaryUrl(url) {
    if (!url || !url.includes('res.cloudinary.com')) return url;
    try {
        const parts = url.split('/upload/');
        if (parts.length < 2) return url;
        const publicId = parts[1].replace(/^s--[^/]+--\//, '').replace(/^v\d+\//, '');
        return cloudinary.url(publicId, { resource_type: 'raw', sign_url: true, secure: true });
    } catch (err) {
        console.error('Error signing Cloudinary URL:', err);
        return url;
    }
}
