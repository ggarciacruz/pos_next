import os
from PIL import Image, ImageDraw, ImageFont

def generate_assets():
    out_dir = "/home/frappe/erpnext-bench/apps/pos_next/pos_next/public/pos"
    os.makedirs(out_dir, exist_ok=True)
    
    font_bold = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    font_reg = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

    # ─────────────────────────────────────────────────────────────
    # 1. GENERAR favicon.png (512x512) — Reemplaza al logo F de Frappe
    # ─────────────────────────────────────────────────────────────
    fav_size = 512
    fav = Image.new("RGBA", (fav_size, fav_size), (255, 255, 255, 255))
    draw_fav = ImageDraw.Draw(fav)
    
    # Fondo cuadrado redondeado azul MDX
    pad = 48
    draw_fav.rounded_rectangle(
        [pad, pad, fav_size - pad, fav_size - pad],
        radius=90,
        fill="#0050ff"
    )
    
    # Dibujar ícono de bolsa de compras MDX POS en blanco
    # Cuerpo de la bolsa
    bag_left = 150
    bag_right = 362
    bag_top = 220
    bag_bottom = 390
    draw_fav.rounded_rectangle(
        [bag_left, bag_top, bag_right, bag_bottom],
        radius=26,
        fill="#ffffff"
    )
    # Asa de la bolsa (arco / U invertida)
    handle_left = 200
    handle_right = 312
    handle_top = 135
    handle_bottom = 245
    draw_fav.arc(
        [handle_left, handle_top, handle_right, handle_bottom],
        start=180,
        end=0,
        fill="#ffffff",
        width=26
    )
    
    fav_path = os.path.join(out_dir, "favicon.png")
    fav.save(fav_path, format="PNG")
    print(f"+ Creado favicon oficial MDX POS: {fav_path} ({fav.size})")

    # ─────────────────────────────────────────────────────────────
    # 2. GENERAR mdx_pos_preview.png (1200x630) — Rich Preview WhatsApp/OG
    # ─────────────────────────────────────────────────────────────
    w, h = 1200, 630
    og = Image.new("RGBA", (w, h), "#0f172a")
    draw_og = ImageDraw.Draw(og)
    
    # Gradiente sutil
    for y in range(h):
        ratio = y / h
        r = int(15 + (30 - 15) * ratio)
        g = int(23 + (41 - 23) * ratio)
        b = int(42 + (59 - 42) * ratio)
        draw_og.line([(0, y), (w, y)], fill=(r, g, b))

    # Glow azul decorativo en la esquina superior izquierda
    # Icono grande en la tarjeta
    icon_box = [100, 160, 360, 420]
    draw_og.rounded_rectangle(icon_box, radius=55, fill="#0050ff")
    
    # Bolsa de compras en icono OG
    ibag_l, ibag_r = 175, 285
    ibag_t, ibag_b = 265, 385
    draw_og.rounded_rectangle([ibag_l, ibag_t, ibag_r, ibag_b], radius=16, fill="#ffffff")
    draw_og.arc([202, 205, 258, 280], start=180, end=0, fill="#ffffff", width=16)

    # Tipografía
    font_title = ImageFont.truetype(font_bold, 80)
    font_sub = ImageFont.truetype(font_bold, 30)
    font_pill = ImageFont.truetype(font_bold, 20)
    font_desc = ImageFont.truetype(font_reg, 26)

    # Textos principales
    draw_og.text((410, 165), "MDX POS", fill="#ffffff", font=font_title)
    draw_og.text((410, 265), "Punto de Venta de Alto Rendimiento", fill="#93c5fd", font=font_sub)
    draw_og.text((410, 320), "Operación continua offline ante cortes de internet", fill="#cbd5e1", font=font_desc)
    draw_og.text((410, 360), "Control de inventarios y sincronización en tiempo real", fill="#94a3b8", font=font_desc)

    # Badges / Pills inferiores
    # Pill 1: Modo Offline
    pill1_box = [410, 430, 710, 480]
    draw_og.rounded_rectangle(pill1_box, radius=25, fill="#1e3a8a")
    draw_og.text((435, 442), "✓ MODO OFFLINE ACTIVO", fill="#60a5fa", font=font_pill)

    # Pill 2: ERP Integrado
    pill2_box = [730, 430, 1010, 480]
    draw_og.rounded_rectangle(pill2_box, radius=25, fill="#14532d")
    draw_og.text((755, 442), "✓ SINCRONIZACIÓN ERP", fill="#4ade80", font=font_pill)

    og_path = os.path.join(out_dir, "mdx_pos_preview.png")
    og.save(og_path, format="PNG")
    print(f"+ Creada tarjeta Open Graph oficial MDX POS: {og_path} ({og.size})")

if __name__ == "__main__":
    generate_assets()
