const fs = require('fs');
const path = require('path');

const REACT_DIR = path.join(__dirname, '..', 'react');
const SUB_DIRS = ['central-line', 'central-solid', 'custom'];

const lines = SUB_DIRS
  .filter((dir) => fs.existsSync(path.join(REACT_DIR, dir)))
  .map((dir) => `export * from './${dir}';`);

fs.writeFileSync(path.join(REACT_DIR, 'index.ts'), lines.join('\n') + '\n');
