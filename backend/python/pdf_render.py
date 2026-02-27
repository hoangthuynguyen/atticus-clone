#!/usr/bin/env python3
"""
PDF Renderer using WeasyPrint
10x lighter than Puppeteer/Chrome - fits Render.com free tier (512MB RAM)
Supports 17 trim sizes for KDP/IngramSpark print-on-demand
"""

import sys
import json
import base64
from weasyprint import HTML, CSS


def render_pdf(html_content, trim_size, theme, settings):
    """
    Render HTML to print-ready PDF with specified trim size.

    Args:
        html_content: HTML string of the book
        trim_size: { width: "152.4mm", height: "228.6mm" }
        theme: { fontFamily, headingFont, fontSize, lineHeight, colorAccent, margins }
        settings: { orphanControl, mirrorMargins, dropCaps, sceneBreakSymbol }
    """

    width = trim_size.get("width", "152.4mm")
    height = trim_size.get("height", "228.6mm")

    margins = theme.get("margins", {})
    margin_top = margins.get("top", "1in")
    margin_bottom = margins.get("bottom", "1in")
    margin_inner = margins.get("inner", "1in")
    margin_outer = margins.get("outer", "0.75in")

    font_family = theme.get("fontFamily", "Georgia")
    heading_font = theme.get("headingFont", font_family)
    font_size = theme.get("fontSize", "11pt")
    line_height = theme.get("lineHeight", 1.6)
    color_accent = theme.get("colorAccent", "#333333")

    mirror = settings.get("mirrorMargins", False)
    orphan_control = settings.get("orphanControl", True)
    drop_caps = settings.get("dropCaps", False)
    scene_break = settings.get("sceneBreakSymbol", "* * *")

    # =========================================================================
    # Build print CSS
    # =========================================================================

    page_css = f"""
    /* === Page Setup === */
    @page {{
        size: {width} {height};
        margin-top: {margin_top};
        margin-bottom: {margin_bottom};
    }}
    """

    if mirror:
        page_css += f"""
    @page :left {{
        margin-left: {margin_outer};
        margin-right: {margin_inner};
        @bottom-left {{ content: counter(page); font-size: 9pt; color: #999; }}
    }}
    @page :right {{
        margin-left: {margin_inner};
        margin-right: {margin_outer};
        @bottom-right {{ content: counter(page); font-size: 9pt; color: #999; }}
    }}
    """
    else:
        page_css += f"""
    @page {{
        margin-left: {margin_inner};
        margin-right: {margin_outer};
        @bottom-center {{ content: counter(page); font-size: 9pt; color: #999; }}
    }}
    """

    # First page - no page number
    page_css += """
    @page :first {
        @bottom-center { content: none; }
        @bottom-left { content: none; }
        @bottom-right { content: none; }
    }
    """

    # Body typography
    page_css += f"""
    /* === Typography === */
    body {{
        font-family: '{font_family}', 'Times New Roman', serif;
        font-size: {font_size};
        line-height: {line_height};
        color: #1a1a1a;
        text-align: justify;
        hyphens: auto;
    }}

    p {{
        margin: 0 0 0.3em 0;
        text-indent: 1.5em;
    }}

    /* First para after heading - no indent */
    h1 + p, h2 + p, h3 + p, hr + p {{
        text-indent: 0;
    }}

    /* === Headings === */
    h1 {{
        font-family: '{heading_font}', serif;
        font-size: 2em;
        font-weight: bold;
        text-align: center;
        margin: 3em 0 1.5em 0;
        color: {color_accent};
        page-break-before: always;
        page-break-after: avoid;
    }}

    h1:first-of-type {{
        page-break-before: avoid;
    }}

    h2 {{
        font-family: '{heading_font}', serif;
        font-size: 1.4em;
        margin: 1.5em 0 0.8em 0;
        page-break-after: avoid;
    }}

    h3 {{
        font-family: '{heading_font}', serif;
        font-size: 1.15em;
        margin: 1.2em 0 0.6em 0;
        page-break-after: avoid;
    }}

    /* === Block Elements === */
    blockquote {{
        margin: 1em 2em;
        padding-left: 1em;
        border-left: 2px solid {color_accent};
        font-style: italic;
    }}

    img {{
        max-width: 100%;
        height: auto;
        display: block;
        margin: 1em auto;
    }}

    /* === Scene Breaks === */
    hr {{
        border: none;
        text-align: center;
        margin: 1.5em 0;
        page-break-after: avoid;
    }}
    hr::after {{
        content: '{scene_break}';
        letter-spacing: 0.3em;
        color: {color_accent};
    }}

    .scene-break {{
        text-align: center;
        margin: 1.5em 0;
        page-break-after: avoid;
    }}

    /* === Tables === */
    table {{
        width: 100%;
        border-collapse: collapse;
        margin: 1em 0;
        page-break-inside: avoid;
    }}
    td, th {{
        padding: 0.4em;
        border: 1px solid #ddd;
    }}
    """

    # Orphan/Widow control
    if orphan_control:
        page_css += """
    /* === Orphan/Widow Control === */
    p {
        orphans: 2;
        widows: 2;
    }
    h1, h2, h3 {
        page-break-after: avoid;
    }
    table, figure, img {
        page-break-inside: avoid;
    }
    """

    # Drop Caps
    if drop_caps:
        page_css += f"""
    /* === Drop Caps === */
    h1 + p::first-letter {{
        float: left;
        font-size: 3.5em;
        line-height: 0.8;
        padding: 0.05em 0.1em 0 0;
        font-weight: bold;
        color: {color_accent};
        font-family: '{heading_font}', serif;
    }}
    """

    # Text message bubbles for print
    page_css += f"""
    /* === Text Messages (Print) === */
    .text-msg {{
        margin: 0.3em 0;
        padding: 0.4em 0.8em;
        border: 1px solid #ccc;
        border-radius: 0.5em;
    }}
    .text-msg-sent {{
        margin-left: 20%;
        border-color: {color_accent};
    }}
    .text-msg-received {{
        margin-right: 20%;
    }}

    /* === Callout Boxes (Print) === */
    .callout-box {{
        border: 2px solid {color_accent};
        padding: 0.8em;
        margin: 1em 0;
        page-break-inside: avoid;
    }}
    """

    # =========================================================================
    # Render PDF
    # =========================================================================

    try:
        html = HTML(string=html_content)
        css = CSS(string=page_css)
        document = html.render(stylesheets=[css])
        pdf_bytes = document.write_pdf()
        page_count = len(document.pages)

        return {
            "pdf": base64.b64encode(pdf_bytes).decode("utf-8"),
            "page_count": page_count,
            "size": len(pdf_bytes),
        }

    except Exception as e:
        return {
            "error": str(e),
            "pdf": "",
            "page_count": 0,
            "size": 0,
        }


if __name__ == "__main__":
    try:
        input_data = json.loads(sys.stdin.read())

        result = render_pdf(
            input_data["html"],
            input_data["trimSize"],
            input_data["theme"],
            input_data["settings"],
        )

        if result.get("error"):
            print(json.dumps(result), file=sys.stderr)
            sys.exit(1)

        print(json.dumps(result))

    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON input: {e}"}), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
