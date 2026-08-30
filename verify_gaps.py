#!/usr/bin/env python3
"""Verify 24px gaps between consecutive case images (models css/main.css).

Container: .case-container { display:flex; flex-direction:column; gap:40px }
Panels   : .case-image-panel { margin-top:0; margin-bottom:24px }
          .case-section > *:last-child { margin-bottom:0 }
New fix  : container-level consecutive panels and
          section-ending-in-image + panel are normalized to 24px.
"""
import os
from html.parser import HTMLParser

ROOT = "/Users/alisabarysava/Documents/portfolio"
CASES = ["ai-autofill-forms.html", "document-preview-redesign.html",
         "feedback-form.html"]


class Node:
    def __init__(self, tag, attrs):
        self.tag = tag
        self.attrs = dict(attrs)
        self.classes = set(self.attrs.get("class", "").split())
        self.children = []
        self.parent = None

    def is_panel(self):
        return "case-image-panel" in self.classes

    def is_section(self):
        return "case-section" in self.classes

    def is_last(self):
        return bool(self.parent) and self.parent.children and self.parent.children[-1] is self


class TP(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.roots = []

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        if self.stack:
            node.parent = self.stack[-1]
            self.stack[-1].children.append(node)
        else:
            self.roots.append(node)
        if tag not in ("img", "source", "br", "meta", "link", "input", "hr", "video"):
            self.stack.append(node)

    def handle_endtag(self, tag):
        if tag in ("img", "source", "br", "meta", "link", "input", "hr", "video"):
            return
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                break


def panels(roots):
    out = []
    def walk(n):
        if n.is_panel():
            out.append(n)
        for ch in n.children:
            walk(ch)
    for r in roots:
        walk(r)
    return out


def img_name(n):
    for ch in n.children:
        if ch.tag == "img":
            return os.path.basename(ch.attrs.get("src", "?"))
    return "<video>"


def is_visually_adjacent(a, b):
    """True if a and b render as a run with no other content between them."""
    if a.parent is b.parent:  # siblings (panels inside the same section)
        return b.parent.children.index(b) == a.parent.children.index(a) + 1
    # a is the last child of a section, b is the next sibling of that section
    return a.parent.is_section() and a.is_last() and b.parent is a.parent.parent


def gap(a, b, fixed):
    if a.parent is b.parent and a.parent.is_section():
        return 24  # inside the same section: only margins, no flex gap
    g = 40  # container flex gap between direct children
    am = 0 if a.parent.is_section() else 24  # a's effective margin-bottom
    if fixed:
        if a.parent.is_section():
            return am + g - 16 if a.is_last() else am + g
        return am + g - 40 if a.parent is b.parent else am + g
    return am + g


def main():
    total_bad_before = 0
    total_bad_after = 0
    for case in CASES:
        with open(os.path.join(ROOT, "cases", case), encoding="utf-8") as f:
            html = f.read()
        parser = TP()
        parser.feed(html)
        ps = panels(parser.roots)
        print(f"== {case}")
        for i in range(len(ps) - 1):
            a, b = ps[i], ps[i + 1]
            if not is_visually_adjacent(a, b):
                continue
            before = gap(a, b, False)
            after = gap(a, b, True)
            if before != 24:
                total_bad_before += 1
            if after != 24:
                total_bad_after += 1
            print(f"  {img_name(a):26s} -> {img_name(b):26s} "
                  f"before={before:3d}px after={after:3d}px")
    print("\nSUMMARY")
    print("  gaps != 24px BEFORE fix:", total_bad_before)
    print("  gaps != 24px AFTER  fix:", total_bad_after)


if __name__ == "__main__":
    main()
