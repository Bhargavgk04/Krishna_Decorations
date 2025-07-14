# Event Images Folder Structure

This folder contains all event decoration images organized by event type.

## Folder Structure

```
public/images/
├── wedding/          # Wedding decoration images
├── engagement/       # Engagement party images
├── Haldi/            # Haldi function images
├── Birthday/         # Birthday celebration images
├── Baby shower/      # Baby shower celebration images
├── Naam Karan/       # Naam Karan ceremony images
├── Miravnuk/         # Miravnuk ceremony images
├── Selfie points/    # Selfie point decoration images
└── toran/            # Toran decoration images
```

## Image Guidelines

### File Naming Convention
- Use descriptive names: `wedding-stage-decor-1.jpg`
- Use lowercase letters and hyphens
- Include event type in filename: `engagement-mandap-setup.jpg`
- Number multiple images: `haldi-ceremony-1.jpg`, `haldi-ceremony-2.jpg`

### Image Specifications
- **Recommended size**: 1200x800 pixels or larger
- **Format**: JPG, PNG, or WebP
- **File size**: Keep under 2MB for optimal loading
- **Quality**: High quality, professional photos

### Usage in Code
Images can be referenced in your React components like this:
```javascript
// Example usage in Gallery component
const weddingImages = [
  {
    src: '/images/wedding/IMG_20240630_003430879_HDR_AE.jpg',
    alt: 'Elegant Wedding Stage Decoration',
    category: 'Wedding'
  }
];
```

## Adding New Images

1. Place your images in the appropriate event folder
2. Follow the naming convention
3. Update the Gallery component to include new images
4. Test the website to ensure images load correctly

## Supported Event Types

- **Wedding**: Traditional and modern wedding decorations
- **Engagement**: Engagement party and ring ceremony setups
- **Haldi**: Haldi ceremony with yellow theme decorations
- **Birthday**: Birthday party decorations and themes
- **Baby Shower**: Baby shower celebration decorations
- **Naam Karan**: Naam Karan ceremony decorations
- **Miravnuk**: Miravnuk ceremony decorations
- **Selfie Points**: Selfie point and photo booth decorations
- **Toran**: Traditional toran decorations for various events

## Current Image Count

- **Wedding**: 80+ images
- **Engagement**: 20+ images
- **Haldi**: 60+ images
- **Birthday**: 80+ images
- **Baby Shower**: 9 images
- **Naam Karan**: 10+ images
- **Miravnuk**: 15+ images
- **Selfie Points**: 7 images
- **Toran**: 9 images

## Notes

- All images are now properly integrated into the website
- The slideshow features the best images from each category
- The portfolio section displays all images organized by category
- Image names and categories are always visible
- Fallback images are available if local images fail to load 