// .vscode/sync-roo.js
const fs = require("fs");
const path = require("path");

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

(function main() {
  const root = process.cwd();
  const configRoot = path.join(root, ".roo-config");

  // Copy .roomodes
  copyRecursive(path.join(configRoot, ".roomodes"), path.join(root, ".roomodes"));

  // Copy entire .roo folder from .roo-config to project root
  const rooSrcDir = path.join(configRoot, ".roo");
  const rooDestDir = path.join(root, ".roo");
  copyRecursive(rooSrcDir, rooDestDir);

  console.log("✅ Roo config synced from .roo-config/");
})();
