from PIL import Image
import os

input_path = "attached_assets/copilot_image_1762471524673_1766417058215.jpeg"
output_path = "attached_assets/generated_images/darkwave_token_transparent.png"

img = Image.open(input_path).convert("RGBA")
pixels = img.load()

width, height = img.size

for y in range(height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        brightness = (r + g + b) / 3
        if brightness < 50 and r < 80 and g < 60 and b < 60:
            pixels[x, y] = (r, g, b, 0)
        elif brightness < 35:
            pixels[x, y] = (r, g, b, 0)

img.save(output_path, "PNG")
print(f"Saved transparent image to: {output_path}")
