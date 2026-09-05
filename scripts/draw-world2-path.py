#!/usr/bin/env python3
"""
Draw any world's enemy path as a white line on its corresponding map image.

Usage:
  python3 draw-world2-path.py          # world 1 (Serpentine North, LAIMap1)
  python3 draw-world2-path.py 2        # world 2 (South Detour, LAIMap2)
  python3 draw-world2-path.py 3        # world 3 (North Corridor, LAIMap3)

Produces: public/assets/maps/tower-defense/LAIMap<N>_path.png (1600x900)
"""
import sys
from PIL import Image, ImageDraw

BASE_W, BASE_H   = 1000, 600
BOARD_W, BOARD_H = 1600, 900
MAP_COUNT        = 12

def sx(v): return v / BASE_W * BOARD_W
def sy(v): return v / BASE_H * BOARD_H

MAP_OFFSET_Y  = sy(10)
PLAYFIELD_TOP = sy(98) + MAP_OFFSET_Y
PLAYFIELD_BOT = BOARD_H - sy(104)
PLAYFIELD_H   = PLAYFIELD_BOT - PLAYFIELD_TOP
MAP_CX        = BOARD_W // 2
MAP_CY        = int(PLAYFIELD_TOP + PLAYFIELD_H / 2)

WORLDS = [
    {"name": "Serpentine North", "points": [
        (28,170),(48,152),(87,112),(152,96),(192,96),(212,127),(208,161),
        (195,186),(174,215),(154,244),(136,289),(136,305),(143,334),(154,377),
        (204,422),(294,435),(365,386),(438,323),(514,264),(595,253),(676,283),
        (703,327),(741,391),(759,404),(804,373),(867,386),(910,397),(937,411),(975,436),
    ]},
    {"name": "South Detour", "points": [
        (384,0),(376,7),(370,15),(363,24),(356,33),(348,40),(340,45),(331,51),
        (323,56),(315,61),(306,67),(297,74),(289,80),(283,87),(276,96),(271,104),
        (266,114),(263,123),(257,132),(249,139),(241,144),(232,149),(221,155),(209,160),
        (199,164),(189,168),(178,172),(171,177),(160,184),(153,189),(143,196),(136,203),
        (130,212),(123,220),(117,231),(115,242),(114,252),(114,262),(114,274),(116,287),
        (118,298),(120,308),(123,321),(125,330),(128,339),(132,348),(138,359),(145,367),
        (153,376),(160,382),(167,388),(177,394),(184,401),(191,407),(200,412),(210,416),
        (218,420),(228,425),(236,429),(246,433),(255,437),(263,442),(271,446),(280,450),
        (291,453),(299,456),(308,458),(320,458),(332,459),(343,460),(352,460),(362,461),
        (371,461),(383,461),(392,463),(401,466),(411,470),(421,477),(427,484),(433,492),
        (440,501),(447,510),(451,519),(457,529),(463,537),(469,544),(478,551),(485,556),
        (494,561),(503,563),(513,565),(524,566),(535,566),(544,566),(555,566),(564,565),
        (575,561),(585,555),(592,549),(600,543),(609,535),(616,528),(621,517),(624,507),
        (624,497),(624,485),(632,477),(639,468),(643,460),(652,451),(659,447),(668,440),
        (675,431),(684,424),(693,418),(702,414),(714,410),(724,409),(733,409),(743,409),
        (753,409),(764,408),(773,408),(783,409),(792,416),(802,422),(811,428),(820,431),
        (830,435),(838,440),(846,446),(854,452),(862,458),(872,463),(881,467),(892,470),
        (901,471),(910,473),(919,475),(928,477),(939,480),(948,480),(957,480),(966,478),
        (975,475),(985,469),(995,464),
    ]},
    {"name": "North Corridor", "points": [
        (40,145),(230,145),(230,96),(610,96),(610,330),(820,330),(820,424),(960,424),
    ]},
    {"name": "Midline Zigzag", "points": [
        (40,145),(96,145),(96,356),(318,356),(318,226),(564,226),(564,426),(960,426),
    ]},
    {"name": "Spiral Path", "points": [
        (40,285),(280,285),(280,96),(540,96),(540,450),(800,450),(800,200),(960,200),
    ]},
    {"name": "Twin Peaks", "points": [
        (40,200),(180,200),(180,120),(380,120),(380,320),
        (560,320),(560,140),(780,140),(780,380),(960,380),
    ]},
]

def base_to_board(bx, by):
    return (sx(bx), sy(by) + MAP_OFFSET_Y)

def draw_world(world_number):
    idx        = world_number - 1
    map_number = (idx % MAP_COUNT) + 1
    if idx >= len(WORLDS):
        print(f"World {world_number} not supported (1-{len(WORLDS)} only)")
        sys.exit(1)
    world    = WORLDS[idx]
    map_file = f"public/assets/maps/tower-defense/LAIMap{map_number}.jpg"
    out_file = f"public/assets/maps/tower-defense/LAIMap{map_number}_path.png"
    print(f"World {world_number}: {world['name']}  |  Map: LAIMap{map_number}.jpg")
    img = Image.open(map_file).convert("RGB")
    tw, th = img.size
    cov    = max(BOARD_W / tw, BOARD_H / th)
    dw, dh = int(tw*cov), int(th*cov)
    scaled = img.resize((dw, dh), Image.LANCZOS)
    px, py = MAP_CX - dw//2, MAP_CY - dh//2
    canvas = Image.new("RGB", (BOARD_W, BOARD_H), (8,12,20))
    canvas.paste(scaled, (px, py))
    ov   = Image.new("RGBA", (BOARD_W, BOARD_H), (0,0,0,0))
    draw = ImageDraw.Draw(ov)
    pts  = [base_to_board(x, y) for x, y in world["points"]]
    for i in range(len(pts)-1):
        draw.line([pts[i], pts[i+1]], fill=(255,255,255,230), width=6)
    for bx, by in pts:
        r = 8
        draw.ellipse([(bx-r,by-r),(bx+r,by+r)], fill=(255,210,30,255))
    Image.alpha_composite(canvas.convert("RGBA"), ov).save(out_file)
    print(f"Saved: {out_file}  ({BOARD_W}x{BOARD_H})")

if __name__ == "__main__":
    draw_world(int(sys.argv[1]) if len(sys.argv) > 1 else 1)
