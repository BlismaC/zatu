// --- Helper Functions (General Utilities) ---

export function interpolateColor(color1, color2, factor) {
    const hexToRgb = hex => {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        return { r, g, b };
    };

    const rgbToHex = (r, g, b) => {
        const toHex = c => Math.min(255, Math.max(0, Math.round(c))).toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };

    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    const r = c1.r + factor * (c2.r - c1.r);
    const g = c1.g + factor * (c2.g - c1.g);
    const b = c1.b + factor * (c2.b - c1.b);
    return rgbToHex(r, g, b);
}

export function lerpAngle(start, end, amount) {
    let shortest_angle = ((((end - start) % (2 * Math.PI)) + (3 * Math.PI)) % (2 * Math.PI)) - Math.PI;
    return start + shortest_angle * amount;
}

export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Moomoo.io specific UTILS (simplified for this context)
export const UTILS = {
    randInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    randFloat: (min, max) => Math.random() * (max - min) + min
};

// --- Custom Drawing Helpers (from user's snippet) ---

// Adjusted renderCircle to match user's provided signature with dontStroke/dontFill
export function renderCircle(x, y, scale, ctxt, dontStroke, dontFill) {
    ctxt.beginPath();
    ctxt.arc(x, y, scale, 0, 2 * Math.PI);
    if (!dontFill) ctxt.fill();
    if (!dontStroke) ctxt.stroke();
}

// New renderLeaf function from user's snippet
export function renderLeaf(x, y, l, r, ctxt) {
    let endX = x + l * Math.cos(r);
    let endY = y + l * Math.sin(r);
    let width = l * 0.4;
    ctxt.moveTo(x, y); // This seems redundant with beginPath right after, typically moveTo is inside beginPath.
                      // Retaining user's original structure.
    ctxt.beginPath();
    ctxt.quadraticCurveTo((x + endX) / 2 + width * Math.cos(r + Math.PI / 2), (y + endY) / 2 + width * Math.sin(r + Math.PI / 2), endX, endY);
    ctxt.quadraticCurveTo((x + endX) / 2 - width * Math.cos(r + Math.PI / 2), (y + endY) / 2 - width * Math.sin(r + Math.PI / 2), x, y);
    ctxt.closePath();
    ctxt.fill();
    ctxt.stroke();
}


// Moomoo.io specific drawing helpers (original from previous versions, kept for other sprite generation)
export function renderStar(context, sides, outerRadius, innerRadius) {
    context.beginPath();
    for (let i = 0; i < sides * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI / sides) * i;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        if (i === 0) {
            context.moveTo(x, y);
        } else {
            context.lineTo(x, y);
        }
    }
    context.closePath();
}

// A more accurate renderBlob based on typical irregular polygon drawing (Moomoo.io style)
export function renderBlob(context, irregularity, outerRadius, innerRadius) {
    context.beginPath();
    const angleStep = (Math.PI * 2) / irregularity;
    let currentAngle = UTILS.randFloat(0, Math.PI * 2);

    let points = [];
    for (let i = 0; i < irregularity; i++) {
        const r = UTILS.randFloat(innerRadius, outerRadius);
        const x = r * Math.cos(currentAngle);
        const y = r * Math.sin(currentAngle);
        points.push({ x, y });
        currentAngle += angleStep;
    }

    context.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        const xc = (p1.x + p2.x) / 2;
        const yc = (p1.y + p2.y) / 2;
        context.quadraticCurveTo(p1.x, p1.y, xc, yc);
    }
    context.closePath();
}
