"""Render NSIS branding from approved Morph Launcher artwork."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]

def render(destination):
    destination = Path(destination)
    destination.mkdir(parents=True, exist_ok=True)
    scale = 3
    canvas = Image.new('RGB', (164 * scale, 314 * scale))
    draw = ImageDraw.Draw(canvas)
    for y in range(canvas.height):
        fraction = y / canvas.height
        draw.line((0, y, canvas.width, y), fill=(int(10 + 12*fraction), int(23 + 20*fraction), int(46 + 28*fraction)))
    draw.ellipse((48*scale, 65*scale, 206*scale, 223*scale), outline=(39, 73, 107), width=scale)
    draw.ellipse((-64*scale, 166*scale, 116*scale, 346*scale), outline=(35, 57, 93), width=scale)
    logo = Image.open(ROOT/'tv-project/app/assets/morph-launcher-wordmark.png').convert('RGBA')
    logo.thumbnail((142*scale, 68*scale), Image.Resampling.LANCZOS)
    canvas.paste(logo, ((canvas.width-logo.width)//2, 113*scale), logo)
    font_path = Path('C:/Windows/Fonts/segoeui.ttf')
    font = ImageFont.truetype(str(font_path), 10*scale) if font_path.exists() else ImageFont.load_default()
    small = ImageFont.truetype(str(font_path), 8*scale) if font_path.exists() else font
    draw.line((24*scale, 179*scale, 140*scale, 179*scale), fill=(68, 165, 203), width=scale)
    draw.text((82*scale, 194*scale), 'Your screen. More possibilities.', font=small, anchor='mt', fill=(203, 219, 237))
    draw.text((82*scale, 279*scale), 'morph-tv.com', font=font, anchor='mt', fill=(107, 204, 229))
    canvas.resize((164, 314), Image.Resampling.LANCZOS).save(destination/'installerSidebar.bmp')
    header = Image.new('RGB', (150*scale, 57*scale), 'white')
    header_logo = Image.open(ROOT/'tv-project/app/assets/morph-launcher-wordmark.png').convert('RGBA')
    header_logo.thumbnail((140*scale, 45*scale), Image.Resampling.LANCZOS)
    # The approved white wordmark needs a dark panel to preserve contrast.
    header.paste((15, 29, 51), (0, 0, header.width, header.height))
    header.paste(header_logo, ((header.width-header_logo.width)//2, (header.height-header_logo.height)//2), header_logo)
    header.resize((150, 57), Image.Resampling.LANCZOS).save(destination/'installerHeader.bmp')

if __name__ == '__main__':
    render(ROOT/'pc-app/build')
