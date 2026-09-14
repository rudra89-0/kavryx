from PIL import Image
import math

def remove_bg(img_path, out_path):
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    
    # We load the pixels
    pixels = img.load()
    
    # Background color from top-left
    bg_r, bg_g, bg_b, _ = pixels[0, 0]
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Use distance to background
            dist = math.sqrt((r - bg_r)**2 + (g - bg_g)**2 + (b - bg_b)**2)
            
            # The background in the image is somewhat uniform but could have noise
            # Thresholds:
            if dist < 20: 
                pixels[x, y] = (r, g, b, 0)
            elif dist < 50:
                # feather the alpha
                alpha = int((dist - 20) / 30.0 * 255)
                # clamp the alpha
                alpha = max(0, min(255, alpha))
                pixels[x, y] = (r, g, b, alpha)

    img.save(out_path, "PNG")

try:
    remove_bg(r"C:\Users\Black Thunder\.gemini\antigravity\brain\588eb586-2997-4c18-a8fa-bff3de22f333\media__1789394161585.png", r"c:\Users\Black Thunder\kavryx\assets\logo.png")
    print("Done")
except Exception as e:
    print(f"Error: {e}")
