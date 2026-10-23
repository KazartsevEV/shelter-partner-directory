"""Trace the approved Bozzhyra panorama into the About banner's real SVG paths.

Requires ImageMagick and ``vtracer==0.6.11``. The approved WebP remains the
source of the scene; text and service cards remain separate HTML elements.
"""

from copy import deepcopy
from pathlib import Path
import subprocess
import tempfile
import xml.etree.ElementTree as ET

import vtracer


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "assets/nomad360-banners/about-bozzhyra-desktop-extended-20261019.webp"
DESTINATION = ROOT / "assets/nomad360-banners/about-moonlight-horizontal-only-3200x768.svg"
SVG = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG)


def element(name, **attributes):
    return ET.Element(f"{{{SVG}}}{name}", attributes)


def main():
    with tempfile.TemporaryDirectory() as temp_dir:
        png = Path(temp_dir) / "approved.png"
        traced = Path(temp_dir) / "traced.svg"
        # VTracer's direct WebP decoder drops the source colour channels.
        subprocess.run(["magick", str(SOURCE), str(png)], check=True)
        vtracer.convert_image_to_svg_py(
            str(png), str(traced), colormode="color", hierarchical="stacked",
            mode="spline", filter_speckle=2, color_precision=8,
            layer_difference=8, corner_threshold=90, length_threshold=2,
            max_iterations=15, splice_threshold=45, path_precision=2,
        )
        contours = list(ET.parse(traced).getroot())

    if len(contours) < 4000 or any(node.tag != f"{{{SVG}}}path" for node in contours):
        raise RuntimeError("Approved landscape tracing is incomplete")

    scene = element("svg", width="3200", height="768", viewBox="0 0 3200 768")
    scene.append(ET.Comment("Vector contours of the approved 1536x768 source; no raster image or text."))
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
    details = ET.SubElement(definitions, f"{{{SVG}}}g", id="aboutTracedDetails")
    for contour in contours:
        details.append(deepcopy(contour))
    # The photographic disc is circular. Tracing its silhouette as colour
    # clusters made the rim visibly stepped, even though the file was SVG.
    # Reconstruct the exact source circle with a native gradient and retain
    # the traced crater detail inside its smooth, resolution-independent rim.
    moon_clip = ET.SubElement(definitions, f"{{{SVG}}}clipPath", id="aboutMoonDisc")
    ET.SubElement(moon_clip, f"{{{SVG}}}circle", cx="1066", cy="170.5", r="50.5")
    moon = ET.SubElement(definitions, f"{{{SVG}}}radialGradient", id="aboutMoonLight", cx="65%", cy="35%", r="75%")
    for offset, color in (("0", "#f1f8fc"), ("0.65", "#d7e7f1"), ("1", "#a4c1d6")):
        ET.SubElement(moon, f"{{{SVG}}}stop", offset=offset, **{"stop-color": color})
    # A continuous native sky gradient replaces the broad posterised colour
    # bands in the text-safe left sky. Fade it before the moon and the cliffs;
    # retain their original contour detail and the panorama composition.
    sky = ET.SubElement(definitions, f"{{{SVG}}}linearGradient", id="aboutSky", gradientUnits="userSpaceOnUse", x1="0", x2="950", y1="0", y2="0")
    for offset, color, opacity in (("0", "#092d50", "1"), ("0.55", "#06274a", "0.95"), ("1", "#032044", "0")):
        ET.SubElement(sky, f"{{{SVG}}}stop", offset=offset, **{"stop-color": color, "stop-opacity": opacity})
    sky_fade = ET.SubElement(definitions, f"{{{SVG}}}linearGradient", id="aboutSkyFade", x1="0", x2="0", y1="0", y2="1")
    for offset, color in (("0", "white"), ("0.65", "white"), ("1", "black")):
        ET.SubElement(sky_fade, f"{{{SVG}}}stop", offset=offset, **{"stop-color": color})
    sky_mask = ET.SubElement(definitions, f"{{{SVG}}}mask", id="aboutSkyMask", x="0", y="0", width="950", height="425", maskUnits="userSpaceOnUse")
    ET.SubElement(sky_mask, f"{{{SVG}}}rect", width="950", height="425", fill="url(#aboutSkyFade)")
    central = ET.SubElement(definitions, f"{{{SVG}}}g", id="aboutCentralVector")
    ET.SubElement(central, f"{{{SVG}}}use", href="#aboutTracedDetails")
    ET.SubElement(central, f"{{{SVG}}}rect", width="950", height="425", fill="url(#aboutSky)", mask="url(#aboutSkyMask)")
    ET.SubElement(central, f"{{{SVG}}}circle", cx="1066", cy="170.5", r="50.5", fill="url(#aboutMoonLight)")
    ET.SubElement(central, f"{{{SVG}}}use", href="#aboutTracedDetails", opacity="0.72", **{"clip-path": "url(#aboutMoonDisc)"})

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
        ET.SubElement(layer, f"{{{SVG}}}use", href="#aboutCentralVector", transform=transform)
    ET.SubElement(scene, f"{{{SVG}}}rect", x="2368", width="832", height="768", fill="url(#aboutRightFade)")

    ET.ElementTree(scene).write(DESTINATION, encoding="utf-8", xml_declaration=True)
    # SVGO is a pinned development-only dependency, not a browser runtime.
    subprocess.run(["node", str(ROOT / "scripts/about/node_modules/svgo/bin/svgo.js"),
                    "--precision", "2", "-i", str(DESTINATION), "-o", str(DESTINATION)], check=True)
    print(f"{DESTINATION.relative_to(ROOT)}: {len(contours)} paths, {DESTINATION.stat().st_size} bytes")


if __name__ == "__main__":
    main()
