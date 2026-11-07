"""Build-time selector alternatives for older TV WebViews, with no runtime work.

Keep modern rules last so their original specificity remains authoritative.
Only positive, top-level :is()/:where() selectors can be distributed safely.
"""
import re


def split_selectors(value):
    parts, start, depth, quote = [], 0, 0, None
    escaped = False
    for i, char in enumerate(value):
        if escaped:
            escaped = False
            continue
        if char == '\\':
            escaped = True
            continue
        if quote:
            if char == quote:
                quote = None
        elif char in "\"'":
            quote = char
        elif char in '([':
            depth += 1
        elif char in ')]':
            depth -= 1
        elif char == ',' and depth == 0:
            parts.append(value[start:i].strip())
            start = i + 1
    parts.append(value[start:].strip())
    return parts


def expand(selector):
    match = re.search(r':(?:is|where)\(', selector)
    if not match:
        return [selector]
    # Nested logical negation needs a different transformation; do not change it.
    before = selector[:match.start()]
    if before.count('(') != before.count(')'):
        return []
    depth, quote, escaped = 1, None, False
    for i in range(match.end(), len(selector)):
        char = selector[i]
        if escaped:
            escaped = False
            continue
        if char == '\\':
            escaped = True
        elif quote:
            if char == quote:
                quote = None
        elif char in "\"'":
            quote = char
        elif char == '(':
            depth += 1
        elif char == ')':
            depth -= 1
            if not depth:
                branches = split_selectors(selector[match.end():i])
                result = []
                for branch in branches:
                    result.extend(expand(before + branch + selector[i + 1:]))
                return result
    return []


def selector_fallbacks(css):
    """Add fallback style rules without touching declarations, URLs or at-rules."""
    # CSS braces inside quoted strings and comments must not become rule boundaries.
    boundary = re.compile(r'/\*.*?\*/|"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|[{}]', re.S)
    out, cursor, header_start = [], 0, 0
    for token in boundary.finditer(css):
        if token.group() == '}':
            header_start = token.end()
        elif token.group() == '{':
            header = css[header_start:token.start()]
            plain = re.sub(r'/\*.*?\*/', '', header, flags=re.S).strip()
            if not plain.startswith('@') and re.search(r':(?:is|where)\(|:focus-visible', plain):
                # Find the matching end of this declaration block (quoted strings ignored).
                end = next((t.start() for t in boundary.finditer(css, token.end()) if t.group() in '{}'), None)
                if end is not None and css[end] == '}':
                    selectors = []
                    for selector in split_selectors(plain):
                        if ':has(' not in selector:
                            selectors.extend(expand(selector.replace(':focus-visible', ':focus')))
                    if selectors:
                        out.append(css[cursor:header_start])
                        out.append(','.join(selectors) + css[token.start():end + 1])
                        cursor = header_start
            header_start = token.end()
    out.append(css[cursor:])
    return ''.join(out)
