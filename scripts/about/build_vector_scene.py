"""Compose the approved photograph in SVG without changing its image bytes.

Python standard library only. The owner approved the same photographic
approach as the Consulting banner. Text remains separate localized HTML.
"""

import base64
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "assets/nomad360-banners/about-bozzhyra-desktop-extended-20261019.webp"
DESTINATION = ROOT / "assets/nomad360-banners/about-moonlight-horizontal-only-3200x768.svg"
SVG = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG)


def element(name, **attributes):
    return ET.Element(f"{{{SVG}}}{name}", attributes)


def main():
    scene = element("svg", width="3200", height="768", viewBox="0 0 3200 768")
    scene.append(ET.Comment("Approved original 1536x768 photograph in an SVG composition; live text remains in HTML."))
    definitions = ET.SubElement(scene, f"{{{SVG}}}defs")
    for clip_id, x, width in (
        ("aboutLeft", "0", "832"),
        ("aboutRightA", "2368", "336"),
        ("aboutRightB", "2704", "336"),
        ("aboutRightC", "3040", "160"),
    ):
        clip = ET.SubElement(definitions, f"{{{SVG}}}clipPath", id=clip_id)
        ET.SubElement(clip, f"{{{SVG}}}rect", x=x, y="0", width=width, height="768")
    fade = ET.SubElement(
        definitions, f"{{{SVG}}}linearGradient", id="aboutRightFade",
        gradientUnits="userSpaceOnUse", x1="2368", x2="3200", y1="0", y2="0",
    )
    for offset, opacity in (("0", "0"), ("1", "1")):
        stop = ET.SubElement(fade, f"{{{SVG}}}stop", offset=offset)
        stop.set("stop-color", "#173B58")
        stop.set("stop-opacity", opacity)
    # Store the approved photograph exactly once. SVG use elements extend
    # only the scenery at the edges; no tracing, resampling or re-encoding.
    ET.SubElement(definitions, f"{{{SVG}}}image", id="aboutCentralScene",
                  width="1536", height="768", preserveAspectRatio="xMidYMid meet",
                  href="data:image/webp;base64," + base64.b64encode(SOURCE.read_bytes()).decode("ascii"))

    ET.SubElement(scene, f"{{{SVG}}}rect", width="3200", height="768", fill="#173B58")
    # Mirror only the lowlands on the left. On the right continue the outer
    # 336px of cliffs: mirroring the entire panorama would add a second moon.
    for clip_id, transform in (
        ("aboutLeft", "translate(832 0) scale(-1 1)"),
        (None, "translate(832 0)"),
        ("aboutRightA", "translate(3904 0) scale(-1 1)"),
        ("aboutRightB", "translate(1504 0)"),
        ("aboutRightC", "translate(4576 0) scale(-1 1)"),
    ):
        layer = ET.SubElement(scene, f"{{{SVG}}}g")
        if clip_id:
            layer.set("clip-path", f"url(#{clip_id})")
        ET.SubElement(layer, f"{{{SVG}}}use", href="#aboutCentralScene", transform=transform)
    ET.SubElement(scene, f"{{{SVG}}}rect", x="2368", width="832", height="768", fill="url(#aboutRightFade)")

    ET.ElementTree(scene).write(DESTINATION, encoding="utf-8", xml_declaration=True)
    print(f"{DESTINATION.relative_to(ROOT)}: original WebP stored once, {DESTINATION.stat().st_size} bytes")


if __name__ == "__main__":
    main()
