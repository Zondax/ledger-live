const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const SVG_DIR = __dirname;
const REPORT_FILE = path.join(SVG_DIR, 'svg-validation-report.md');
const ALLOWED_ELEMENTS = [
  'svg', 'path', 'line', 'rect', 'ellipse', 'polyline', 'polygon', 'circle',
];
const FORBIDDEN_ATTRIBUTES = [
  'clip-path', 'mask', 'id', 'class', 'style', 'data', 'defs',
];
const COMPLIANT_DIR = path.join(SVG_DIR, "compliant");
const NEEDS_ACTION_DIR = path.join(SVG_DIR, "needs_action");

let reportLines = [];
let summary = {
  valid: [],
  autofixed: [],
  partial: [],
  invalid: [],
  error: [],
};

function logReport(line) {
  reportLines.push(line);
}

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir);
}

function copyFileTo(filePath, destDir) {
  const destPath = path.join(destDir, path.basename(filePath));
  fs.copyFileSync(filePath, destPath);
}

function writeSvgToFolder(svgContent, fileName, destDir) {
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);
  const destPath = path.join(destDir, base.toUpperCase() + ext.toLowerCase());
  fs.writeFileSync(destPath, svgContent, "utf8");
}

function validateAndFixSVG(filePath) {
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);
  const fileNameUpper = base.toUpperCase() + ext.toLowerCase();
  let content = fs.readFileSync(filePath, "utf8");
  const dom = new JSDOM(content, { contentType: "image/svg+xml" });
  const svg = dom.window.document.documentElement;
  let changed = false;
  let valid = true;
  let issues = [];
  let fixes = [];

  // Check width, height, viewBox
  let width = svg.getAttribute('width');
  let height = svg.getAttribute('height');
  let viewBox = svg.getAttribute('viewBox');

  // If width or height is missing but viewBox is present, set them from viewBox
  if ((!width || !height) && viewBox) {
    const vbMatch = viewBox.match(/^\s*0\s+0\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/);
    if (vbMatch) {
      const vbWidth = vbMatch[1];
      const vbHeight = vbMatch[2];
      if (!width) {
        svg.setAttribute('width', vbWidth);
        fixes.push(`Added missing width from viewBox: ${vbWidth}`);
        width = vbWidth;
        changed = true;
      }
      if (!height) {
        svg.setAttribute('height', vbHeight);
        fixes.push(`Added missing height from viewBox: ${vbHeight}`);
        height = vbHeight;
        changed = true;
      }
    }
  }

  if (!width || !height) {
    issues.push('Missing width or height attribute.');
    valid = false;
  }
  if (width !== height) {
    issues.push(`Width (${width}) and height (${height}) are not equal.`);
    valid = false;
  }
  if (width && height) {
    const expectedViewBox = `0 0 ${width} ${height}`;
    if (viewBox !== expectedViewBox) {
      fixes.push(`viewBox (${viewBox}) does not match width/height (${expectedViewBox}). Fixed.`);
      svg.setAttribute('viewBox', expectedViewBox);
      changed = true;
    }
  }

  // Check elements and forbidden attributes
  function checkNode(node) {
    const tag = node.tagName && node.tagName.toLowerCase();
    if (tag && !ALLOWED_ELEMENTS.includes(tag)) {
      issues.push(`Element <${tag}> is not allowed.`);
      valid = false;
    }
    // Remove forbidden attributes
    FORBIDDEN_ATTRIBUTES.forEach(attr => {
      if (node.hasAttribute && node.hasAttribute(attr)) {
        fixes.push(`Attribute '${attr}' found on <${tag}>. Removed.`);
        node.removeAttribute(attr);
        changed = true;
      }
    });
    // Recurse
    if (node.children) {
      Array.from(node.children).forEach(checkNode);
    }
  }
  checkNode(svg);

  // Write the (possibly fixed) SVG to the appropriate folder, using uppercase filename (not extension)
  let finalStatus = "";
  if (valid && !changed) {
    summary.valid.push(fileNameUpper);
    writeSvgToFolder(content, fileName, COMPLIANT_DIR);
    finalStatus = `Written to \`${path.basename(COMPLIANT_DIR)}/${fileNameUpper}\``;
    logReport(`### \`${fileNameUpper}\`\n- **Status:** ✅ Valid (no changes needed)\n- ${finalStatus}\n`);
  } else if (valid && changed) {
    summary.autofixed.push(fileNameUpper);
    writeSvgToFolder(dom.serialize(), fileName, COMPLIANT_DIR);
    finalStatus = `Written to \`${path.basename(COMPLIANT_DIR)}/${fileNameUpper}\``;
    logReport(`### \`${fileNameUpper}\`\n- **Status:** 🛠️ Auto-fixed\n- **Fixes:**\n${fixes.map(f => `  - ${f}`).join("\n")}\n- ${finalStatus}\n`);
  } else if (!valid && changed) {
    summary.partial.push(fileNameUpper);
    writeSvgToFolder(dom.serialize(), fileName, NEEDS_ACTION_DIR);
    finalStatus = `Written to \`${path.basename(NEEDS_ACTION_DIR)}/${fileNameUpper}\``;
    logReport(`### \`${fileNameUpper}\`\n- **Status:** ⚠️ Partially fixed\n- **Issues:**\n${issues.map(i => `  - ${i}`).join("\n")}\n- **Fixes:**\n${fixes.map(f => `  - ${f}`).join("\n")}\n- ${finalStatus}\n`);
  } else if (!valid && !changed) {
    summary.invalid.push(fileNameUpper);
    writeSvgToFolder(content, fileName, NEEDS_ACTION_DIR);
    finalStatus = `Written to \`${path.basename(NEEDS_ACTION_DIR)}/${fileNameUpper}\``;
    logReport(`### \`${fileNameUpper}\`\n- **Status:** ❌ Invalid (could not auto-fix)\n- **Issues:**\n${issues.map(i => `  - ${i}`).join("\n")}\n- ${finalStatus}\n`);
  }
}

function formatList(arr) {
  if (arr.length === 0) return "(none)";
  return arr.map(f => `  - \`${f}\``).join("\n");
}

function main() {
  reportLines = [];
  cleanDir(COMPLIANT_DIR);
  cleanDir(NEEDS_ACTION_DIR);
  const files = fs.readdirSync(SVG_DIR).filter(f => f.endsWith(".svg"));
  if (files.length === 0) {
    logReport("No SVG files found.");
  } else {
    files.forEach(f => {
      try {
        validateAndFixSVG(path.join(SVG_DIR, f));
      } catch (e) {
        const ext = path.extname(f);
        const base = path.basename(f, ext);
        const fUpper = base.toUpperCase() + ext.toLowerCase();
        summary.error.push(fUpper);
        writeSvgToFolder(fs.readFileSync(path.join(SVG_DIR, f), "utf8"), f, NEEDS_ACTION_DIR);
        logReport(`### \`${fUpper}\`\n- **Status:** ❌ Error\n- **Error:** ${e.message}\n- Written to \`${path.basename(NEEDS_ACTION_DIR)}/${fUpper}\``);
      }
    });
  }

  // Add summary at the top
  const summaryLines = [
    `# SVG Validation Report`,
    `*Generated: ${new Date().toISOString()}*`,
    "",
    `## Quick Summary`,
    `- ✅ **Valid:** ${summary.valid.length}`,
    formatList(summary.valid),
    `- 🛠️ **Auto-fixed:** ${summary.autofixed.length}`,
    formatList(summary.autofixed),
    `- ⚠️ **Partially fixed:** ${summary.partial.length}`,
    formatList(summary.partial),
    `- ❌ **Invalid:** ${summary.invalid.length}`,
    formatList(summary.invalid),
    `- ❌ **Error:** ${summary.error.length}`,
    formatList(summary.error),
    "",
    `### What to do:`,
    `- **Valid:** No action needed.`,
    `- **Auto-fixed:** Review changes if desired, but these are now compliant.`,
    `- **Partially fixed:** Review and manually fix remaining issues.`,
    `- **Invalid/Error:** Manual intervention required. See details below.`,
    "",
    `## Rules Checked`,
    "- Width and height must be present, equal, and match viewBox.",
    "- Only allowed elements: `svg`, `path`, `line`, `rect`, `ellipse`, `polyline`, `polygon`, `circle`.",
    "- Forbidden attributes: `clip-path`, `mask`, `id`, `class`, `style`, `data`, `defs`.",
    "",
    `---`,
    "",
    `## File Results`,
    "",
  ];

  fs.writeFileSync(REPORT_FILE, summaryLines.concat(reportLines).join("\n"), "utf8");
  console.log(`\nSVG validation markdown report written to: ${REPORT_FILE}`);
}

main();
