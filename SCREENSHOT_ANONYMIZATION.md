# Dashboard Screenshot Anonymization Guide

Before using the dashboard screenshot on the landing page, you need to anonymize it to remove personal information.

## Required Changes

### 1. User Profile Section (Top Left Sidebar)
- **Name**: Replace "Chaim" with "User" or "John Doe"
- **Email**: Replace "chaimpeer11@gmail.com" with "user@example.com" or "demo@smartrack.com"
- **Profile Picture**: Replace with a generic avatar or placeholder

### 2. Links and Content
- **Links**: Replace any personal/real links with generic examples:
  - Example: "Your customers are canceling..." → "How to improve customer retention"
  - Example: "Zero trust in action..." → "Understanding Zero Trust Architecture"
- **URLs**: Replace real URLs with placeholder URLs like:
  - `https://example.com/article-1`
  - `https://example.com/article-2`

### 3. Categories
- Keep category names generic (e.g., "Marketing", "Security", "Research")
- Or replace with examples like "Technology", "Business", "Design"

### 4. Dates
- Replace specific dates with generic ones:
  - "Oct 31, 2025" → "Jan 15, 2025" or "Recent"

## Steps to Anonymize

1. **Take a new screenshot** of your dashboard with:
   - Generic user profile (name: "User", email: "user@example.com")
   - Sample research links with generic content
   - Generic categories
   - No personal information

2. **Or edit the existing screenshot** using an image editor:
   - Use Photoshop, GIMP, or online tools like Photopea
   - Blur or replace text containing personal info
   - Replace profile picture with a generic avatar

3. **Save the image** as:
   - Filename: `dashboard-screenshot.png`
   - Location: `/public/dashboard-screenshot.png`
   - Format: PNG (recommended) or JPG
   - Recommended size: 1920x1080 or similar aspect ratio

## Image Requirements

- **Format**: PNG or JPG
- **Size**: Recommended 1920x1080px or similar (will be responsive)
- **File size**: Optimize to < 500KB for fast loading
- **Quality**: High quality, clear text and UI elements

## Tools for Anonymization

- **Image Editors**: Photoshop, GIMP, Photopea (free online)
- **Blur Tools**: Use blur tool to hide sensitive info
- **Text Replacement**: Use text tool to replace names/emails
- **Screenshot Tools**: Take a fresh screenshot with demo data

## Privacy Checklist

- [ ] User name anonymized
- [ ] Email address anonymized  
- [ ] Profile picture replaced
- [ ] Real links replaced with examples
- [ ] Real URLs replaced with placeholders
- [ ] Personal categories reviewed
- [ ] Dates made generic
- [ ] No sensitive information visible

## After Anonymization

Once you've created the anonymized screenshot:

1. Save it as `/public/dashboard-screenshot.png`
2. The landing page will automatically display it
3. If the image is missing, a placeholder will show instead

