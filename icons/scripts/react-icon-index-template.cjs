const path = require('path');

const BASE_DIR = './icons/svgs';
const SUB_DIRS = ['central-line', 'central-solid', 'custom'];

/*
 * NOTE:
 * This dictionary maps icon component names to any additional aliases they should be
 * exported under. Name collisions are not allowed between icons of any subdirectory.
 */
const ALIASES = {
  Checkmark2SmallIcon: ['CheckIcon'],
  ChevronDownSmallIcon: ['ChevronIcon'],
  CircleInfoIcon: ['InfoIcon'],
  CircleXSolidIcon: ['CloseCircleIcon'],
  CrossLargeIcon: ['CloseIcon'],
  MagnifyingGlassIcon: ['SearchIcon'],
  SquareBehindSquare1Icon: ['CopyIcon'],
  ArrowOutOfBoxIcon: ['EgressIcon'],
  ArrowUpRightIcon: ['ExternalLinkIcon'],
  BarsThreeIcon: ['HamburgerIcon'],
  Filter2Icon: ['FilterIcon'],
};

function indexTemplate(files) {
  const exportEntries = files.map(({ path: file }) => {
    const basename = path.basename(file, path.extname(file));
    const aliases = (ALIASES[basename] || []).map((a) => `default as ${a}`).join(', ');
    return `export { default as ${basename}${aliases ? `, ${aliases}` : ''} } from './${basename}';`;
  });

  const assetDir = path.dirname(files[0].originalPath);
  if (assetDir === BASE_DIR) {
    for (const dir of SUB_DIRS) {
      exportEntries.unshift(`export * from './${dir}';`);
    }
  }

  return exportEntries.join('\n');
}

module.exports = indexTemplate;
