#!/usr/bin/env python3
import os
from PIL import Image, ImageDraw, ImageFont

def create_test_image(filename, text, size=(300, 300)):
    """Create a test image with text"""
    # Create a new image with white background
    img = Image.new('RGB', size, color='white')
    draw = ImageDraw.Draw(img)
    
    # Try to use a default font, fallback to basic if not available
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 24)
    except:
        font = ImageFont.load_default()
    
    # Get text size for centering
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Calculate position to center text
    x = (size[0] - text_width) // 2
    y = (size[1] - text_height) // 2
    
    # Draw text
    draw.text((x, y), text, fill='black', font=font)
    
    # Save image
    img.save(filename, 'JPEG', quality=95)
    print(f"Created {filename} ({size[0]}x{size[1]})")

if __name__ == "__main__":
    # Create uploads directory if it doesn't exist
    os.makedirs("uploads/headshots", exist_ok=True)
    
    # Create test images
    create_test_image("uploads/headshots/test-headshot-1.jpg", "Shariq Hafizi\nFounder", (300, 300))
    create_test_image("uploads/headshots/test-headshot-2.jpg", "Hazyk Obaid\nCo-Founder", (300, 300))
    
    print("Test images created successfully!")
