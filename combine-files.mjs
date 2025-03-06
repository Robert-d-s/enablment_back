import { promises as fs } from 'fs';
import path from 'path';

// Configuration
const TARGET_DIR = './';
const OUTPUT_FILE = 'project-context.txt';
const INCLUDE_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.css',
  '.json',
  '.prisma',
]);
const EXCLUDE_DIRS = new Set([
  'node_modules',
  '.next',
  'build',
  'dist',
  '__tests__',
  '__mocks__',
]);

const EXCLUDE_FILES = new Set([
  'package-lock.json',
  'project-context.txt',
  'combine-files.mjs',
  'readme.md',
  'next-env.d.ts',
]);

async function processFileContent(content) {
  return content
    .replace(/[^\S\r\n]+$/gm, '') // Remove trailing whitespace
    .replace(/\r?\n|\r/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n'); // Collapse 3+ newlines to 2
}

async function combineFiles() {
  let outputContent = '';
  const directoryQueue = [TARGET_DIR];

  try {
    while (directoryQueue.length > 0) {
      const currentDir = directoryQueue.shift();
      const files = await fs.readdir(currentDir, { withFileTypes: true });

      files.sort((a, b) =>
        a.isDirectory() === b.isDirectory() ? 0 : a.isDirectory() ? -1 : 1,
      );

      for (const dirent of files) {
        const fullPath = path.join(currentDir, dirent.name);

        if (dirent.isDirectory()) {
          if (!EXCLUDE_DIRS.has(dirent.name)) {
            directoryQueue.push(fullPath);
          }
        } else if (!EXCLUDE_FILES.has(dirent.name)) {
          const ext = path.extname(dirent.name);
          if (INCLUDE_EXTENSIONS.has(ext)) {
            try {
              let content = await fs.readFile(fullPath, 'utf8');
              content = await processFileContent(content);

              outputContent += `// ====== FILE: ${fullPath.replace(
                TARGET_DIR,
                '',
              )} ======\n\n`;
              outputContent += `${content}\n\n`;
            } catch (err) {
              console.error(
                `⚠️ Skipped ${path.relative(TARGET_DIR, fullPath)}: ${
                  err.message
                }`,
              );
            }
          }
        }
      }
    }

    // Final cleanup pass
    outputContent =
      outputContent
        .replace(/\n{3,}/g, '\n\n') // Ensure max 2 consecutive newlines
        .trim() + '\n'; // Remove trailing whitespace

    await fs.writeFile(OUTPUT_FILE, outputContent);
    console.log(`✅ Successfully created ${OUTPUT_FILE}`);
    console.log(
      `📁 Total files included: ${
        (outputContent.match(/FILE: /g) || []).length
      }`,
    );
    console.log(
      `📦 Final size: ${(outputContent.length / 1024 / 1024).toFixed(2)} MB`,
    );
  } catch (err) {
    console.error('🚨 Critical error:', err);
  }
}

combineFiles();
