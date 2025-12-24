const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', '.output', 'public');

function fixUrlsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(outputDir, filePath);
  const depth = relativePath.split(path.sep).length - 1; // -1 because index.html is at depth 0

  let modified = content;

  // Определяем префикс для относительных путей
  const prefix = depth > 0 ? '../'.repeat(depth) : './';

  // Заменяем href="/section/index.html" на относительные пути
  modified = modified.replace(/href="\/([^"]+\.html)"/g, (match, url) => {
    // Пропускаем если это уже относительный путь или внешний URL
    if (url.startsWith('http') || url.startsWith('./') || url.startsWith('../')) {
      return match;
    }
    return `href="${prefix}${url}"`;
  });

  // Заменяем href="/" на относительный путь к главной
  if (depth > 0) {
    modified = modified.replace(/href="\/"/g, 'href="../index.html"');
  } else {
    modified = modified.replace(/href="\/"/g, 'href="./index.html"');
  }

  // Заменяем src="/_nuxt/..." на относительные пути
  modified = modified.replace(/src="\/_nuxt\/([^"]+)"/g, (match, url) => {
    return `src="${prefix}_nuxt/${url}"`;
  });

  if (modified !== content) {
    fs.writeFileSync(filePath, modified, 'utf8');
    console.log(`Fixed URLs in: ${relativePath}`);
    return true;
  }
  return false;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      fixedCount += processDirectory(filePath);
    } else if (file.endsWith('.html')) {
      if (fixUrlsInFile(filePath)) {
        fixedCount++;
      }
    }
  }

  return fixedCount;
}

console.log('Starting URL fixes...');
const count = processDirectory(outputDir);
console.log(`\nFixed ${count} HTML file(s).`);

