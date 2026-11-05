#!/usr/bin/env node
/**
 * ============================================================================
 * test/count_string_literals.js - String Literals Constants Linter & Frequency Analyzer
 * ============================================================================
 *
 * Provides two powerful modes:
 *
 * 1. DEFAULT MODE: Project Constants Linter (Dry-Run by default)
 *    - Scans project source files for string literals defined in constants.js.
 *    - Aggregates occurrences per file and reports total counts for each literal.
 *    - Recommends replacement with associated constant expressions (e.g. K.POS.ACTION_VERB, AV, etc.).
 *    - Supports automated search/replace via the `--fix` / `--replace` CLI option.
 *
 * 2. FREQUENCY ANALYSIS MODE (--analyze / --freq)
 *    - Counts every string literal in a file across all 3 JavaScript quote styles (', ", `).
 *    - Ranks repeating literals in descending order (filtered by count threshold > 4).
 *    - Provides memory and file-size savings analytics.
 *
 * ARCHITECTURAL DESIGN:
 *   - Schema Reflection: Uses JavaScript's Reflection API (Reflect.ownKeys) on K
 *     to automatically discover all categories (POS, CONJ, FORMALITY, TAG, SRC...),
 *     constant keys, values, and shorthand aliases dynamically at runtime.
 *   - Zero Schema Duplication: Modifying or expanding K in constants.js automatically
 *     updates all validation sets, categorizations, suggestions, and linter rules
 *     without requiring any changes in this file.
 *
 * USAGE:
 *   # Default Mode: Lint entire project against constants.js (Dry-Run)
 *   node test/count_string_literals.js
 *
 *   # Lint a specific file or directory:
 *   node test/count_string_literals.js data.js
 *   node test/count_string_literals.js korean/
 *
 *   # Filter recommendations by category (pos, conj, formality, tag, src):
 *   node test/count_string_literals.js --category pos
 *
 *   # Automatically perform search/replace across files:
 *   node test/count_string_literals.js --fix
 *   node test/count_string_literals.js data.js --fix --shorthand
 *
 *   # Frequency Analysis Mode (rank repeating literals in data.js):
 *   node test/count_string_literals.js --analyze
 *   node test/count_string_literals.js --analyze --top 30
 */

const fs = require('fs');
const path = require('path');
const { K } = require('../constants.js');

// ============================================================================
// 1. High-Precision JavaScript String Lexer
// ============================================================================

/**
 * Extracts all string literals from JavaScript source code.
 *
 * @param {string} sourceCode - Raw JavaScript source code
 * @returns {Array<{ value: string, raw: string, quote: "'"|'"'|'`', line: number, col: number, start: number, end: number, isTypeofComparison: boolean }>}
 */
function extractStringLiterals(sourceCode) {
  const literals = [];
  const len = sourceCode.length;
  let i = 0;

  let state = 'CODE'; // 'CODE', 'LINE_COMMENT', 'BLOCK_COMMENT', 'SINGLE_STRING', 'DOUBLE_STRING', 'TEMPLATE_STRING', 'REGEX'
  let currentString = '';
  let startLine = 1;
  let startCol = 1;
  let startIndex = 0;
  let line = 1;
  let col = 1;

  // Stack to track template literal interpolations `${...}`
  const templateStack = [];

  // Track previous non-whitespace character in CODE mode to disambiguate regex / vs division /
  let prevTokenChar = '';

  function checkTypeofContext(startIdx, endIdx) {
    const lineBefore = sourceCode.slice(Math.max(0, startIdx - 50), startIdx);
    if (/\btypeof\s+[^;,\n\(\)]*===?\s*$/.test(lineBefore) || /\btypeof\s+[^;,\n\(\)]*!==?\s*$/.test(lineBefore)) {
      return true;
    }
    const after = sourceCode.slice(endIdx, Math.min(len, endIdx + 50));
    if (/^\s*===?\s*typeof\b/.test(after) || /^\s*!==?\s*typeof\b/.test(after)) {
      return true;
    }
    return false;
  }

  while (i < len) {
    const ch = sourceCode[i];
    const nextCh = i + 1 < len ? sourceCode[i + 1] : '';

    if (state === 'CODE') {
      if (ch === '\n') {
        line++;
        col = 1;
        i++;
        continue;
      }
      if (ch === '\r') {
        i++;
        continue;
      }

      // Check for comments
      if (ch === '/' && nextCh === '/') {
        state = 'LINE_COMMENT';
        i += 2;
        col += 2;
        continue;
      }
      if (ch === '/' && nextCh === '*') {
        state = 'BLOCK_COMMENT';
        i += 2;
        col += 2;
        continue;
      }

      // Check for string starts
      if (ch === "'") {
        state = 'SINGLE_STRING';
        currentString = '';
        startLine = line;
        startCol = col;
        startIndex = i;
        i++;
        col++;
        continue;
      }
      if (ch === '"') {
        state = 'DOUBLE_STRING';
        currentString = '';
        startLine = line;
        startCol = col;
        startIndex = i;
        i++;
        col++;
        continue;
      }
      if (ch === '`') {
        state = 'TEMPLATE_STRING';
        currentString = '';
        startLine = line;
        startCol = col;
        startIndex = i;
        i++;
        col++;
        continue;
      }

      // Check if closing brace of template interpolation `${...}`
      if (ch === '}' && templateStack.length > 0) {
        const top = templateStack[templateStack.length - 1];
        if (top.braceDepth === 0) {
          templateStack.pop();
          state = 'TEMPLATE_STRING';
          currentString = '';
          startLine = line;
          startCol = col + 1;
          startIndex = i;
          i++;
          col++;
          continue;
        } else {
          top.braceDepth--;
        }
      } else if (ch === '{' && templateStack.length > 0) {
        templateStack[templateStack.length - 1].braceDepth++;
      }

      // Check for regex literal /pattern/flags vs division /
      if (ch === '/') {
        const isRegexStart = /[\(\=\:\,\[\!\&\|\?\;\+\-\*\{\~]/.test(prevTokenChar) || prevTokenChar === '' || prevTokenChar === '\n';
        if (isRegexStart) {
          state = 'REGEX';
          i++;
          col++;
          continue;
        }
      }

      if (!/\s/.test(ch)) {
        prevTokenChar = ch;
      }

      i++;
      col++;
    } else if (state === 'LINE_COMMENT') {
      if (ch === '\n') {
        state = 'CODE';
        line++;
        col = 1;
      } else {
        col++;
      }
      i++;
    } else if (state === 'BLOCK_COMMENT') {
      if (ch === '*' && nextCh === '/') {
        state = 'CODE';
        i += 2;
        col += 2;
      } else {
        if (ch === '\n') {
          line++;
          col = 1;
        } else {
          col++;
        }
        i++;
      }
    } else if (state === 'REGEX') {
      if (ch === '\\') {
        i += 2;
        col += 2;
      } else if (ch === '/') {
        state = 'CODE';
        prevTokenChar = '/';
        i++;
        col++;
      } else {
        if (ch === '\n') {
          line++;
          col = 1;
          state = 'CODE';
        } else {
          col++;
        }
        i++;
      }
    } else if (state === 'SINGLE_STRING') {
      if (ch === '\\') {
        currentString += sourceCode.slice(i, i + 2);
        i += 2;
        col += 2;
      } else if (ch === "'") {
        literals.push({
          raw: "'" + currentString + "'",
          value: unescapeJsString(currentString),
          quote: "'",
          line: startLine,
          col: startCol,
          start: startIndex,
          end: i + 1,
          isTypeofComparison: checkTypeofContext(startIndex, i + 1)
        });
        state = 'CODE';
        prevTokenChar = "'";
        i++;
        col++;
      } else {
        if (ch === '\n') {
          line++;
          col = 1;
        } else {
          col++;
        }
        currentString += ch;
        i++;
      }
    } else if (state === 'DOUBLE_STRING') {
      if (ch === '\\') {
        currentString += sourceCode.slice(i, i + 2);
        i += 2;
        col += 2;
      } else if (ch === '"') {
        literals.push({
          raw: '"' + currentString + '"',
          value: unescapeJsString(currentString),
          quote: '"',
          line: startLine,
          col: startCol,
          start: startIndex,
          end: i + 1,
          isTypeofComparison: checkTypeofContext(startIndex, i + 1)
        });
        state = 'CODE';
        prevTokenChar = '"';
        i++;
        col++;
      } else {
        if (ch === '\n') {
          line++;
          col = 1;
        } else {
          col++;
        }
        currentString += ch;
        i++;
      }
    } else if (state === 'TEMPLATE_STRING') {
      if (ch === '\\') {
        currentString += sourceCode.slice(i, i + 2);
        i += 2;
        col += 2;
      } else if (ch === '$' && nextCh === '{') {
        literals.push({
          raw: '`' + currentString + '`',
          value: currentString,
          quote: '`',
          isTemplateChunk: true,
          line: startLine,
          col: startCol,
          start: startIndex,
          end: i,
          isTypeofComparison: false
        });
        templateStack.push({ braceDepth: 0 });
        state = 'CODE';
        i += 2;
        col += 2;
      } else if (ch === '`') {
        literals.push({
          raw: '`' + currentString + '`',
          value: currentString,
          quote: '`',
          line: startLine,
          col: startCol,
          start: startIndex,
          end: i + 1,
          isTypeofComparison: checkTypeofContext(startIndex, i + 1)
        });
        state = 'CODE';
        prevTokenChar = '`';
        i++;
        col++;
      } else {
        if (ch === '\n') {
          line++;
          col = 1;
        } else {
          col++;
        }
        currentString += ch;
        i++;
      }
    }
  }

  return literals;
}

/**
 * Unescapes standard JS escape sequences in a string literal.
 */
function unescapeJsString(str) {
  if (!str.includes('\\')) return str;
  return str.replace(/\\([0-7]{1,3}|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|u\{[0-9a-fA-F]+\}|[\\'"bfnrtv0]|[\s\S])/g, (match, esc) => {
    if (esc === "'" || esc === '"' || esc === '`' || esc === '\\') return esc;
    if (esc === 'n') return '\n';
    if (esc === 'r') return '\r';
    if (esc === 't') return '\t';
    if (esc === 'b') return '\b';
    if (esc === 'f') return '\f';
    if (esc === 'v') return '\v';
    if (esc === '0') return '\0';
    if (esc.startsWith('x') || esc.startsWith('u')) {
      try {
        return String.fromCodePoint(parseInt(esc.slice(1).replace(/[\{\}]/g, ''), 16));
      } catch (e) {
        return match;
      }
    }
    return esc;
  });
}

// ============================================================================
// 2. JavaScript Reflection-Driven Schema Engine for K
// ============================================================================

/**
 * Dynamically analyzes the structure of K using JavaScript reflection.
 * Automatically discovers:
 *   - Category names (POS, CONJ, FORMALITY, TAG, SRC, and any future added categories)
 *   - Category validation Sets (posValues, conjValues, etc.)
 *   - Value-to-constant reverse mapping (value -> K.POS.ACTION_VERB)
 *   - Canonical names vs shorthand aliases (AV, DV, N, etc.)
 *
 * @param {object} [constantsRoot] - The root K object (defaults to imported K)
 * @returns {object} Reflected schema registry and category Sets
 */
function buildSchemaFromK(constantsRoot) {
  const root = constantsRoot || K;
  const categorySets = new Map();
  const valueToMetadata = new Map();

  const JS_RESERVED = new Set([
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
    'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
    'if', 'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch',
    'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
    'let', 'static', 'enum', 'await', 'implements', 'package', 'protected',
    'interface', 'private', 'public', 'null', 'true', 'false', 'NaN', 'Infinity', 'undefined'
  ]);

  // Reflect over all own keys of K to find category sub-objects
  const categoryNames = Reflect.ownKeys(root).filter(key => {
    if (typeof key !== 'string') return false;
    const val = root[key];
    return val && typeof val === 'object' && !Array.isArray(val);
  });

  // 1. Gather all keys and values per category
  const allEntries = [];
  const keyRegistry = new Map();

  for (const cat of categoryNames) {
    const subObj = root[cat];
    const valSet = new Set();
    categorySets.set(cat, valSet);

    // Reflect over properties of this category namespace
    const subKeys = Reflect.ownKeys(subObj).filter(k => typeof k === 'string');
    const valToKeys = new Map();

    for (const key of subKeys) {
      const v = subObj[key];
      if (typeof v === 'string') {
        valSet.add(v);
        if (!valToKeys.has(v)) valToKeys.set(v, []);
        valToKeys.get(v).push(key);

        if (!keyRegistry.has(key)) keyRegistry.set(key, []);
        keyRegistry.get(key).push({ cat, val: v });
      }
    }

    for (const [val, matchedKeys] of valToKeys.entries()) {
      matchedKeys.sort((a, b) => b.length - a.length || a.localeCompare(b));
      const canonicalKey = matchedKeys[0];
      const candidateShorthand = matchedKeys.length > 1 ? matchedKeys[matchedKeys.length - 1] : canonicalKey;
      allEntries.push({ cat, val, canonicalKey, candidateShorthand, matchedKeys });
    }
  }

  // Detect key collisions across categories where values differ (e.g. GRAMMAR / ADVERB)
  const collidingKeys = new Set();
  for (const [key, owners] of keyRegistry.entries()) {
    if (owners.length > 1) {
      const distinctVals = new Set(owners.map(o => o.val));
      if (distinctVals.size > 1) {
        collidingKeys.add(key);
      }
    }
  }

  // Also reflect over top-level own keys on K directly (e.g. K.AV, K.DV)
  for (const entry of allEntries) {
    for (const key of Reflect.ownKeys(root)) {
      if (typeof key !== 'string') continue;
      if (root[key] === entry.val && key.length < entry.candidateShorthand.length) {
        entry.candidateShorthand = key;
      }
    }
  }

  // 2. Collision detection and shorthand resolution
  const shorthandToEntries = new Map();
  for (const entry of allEntries) {
    const sh = entry.candidateShorthand;
    if (!shorthandToEntries.has(sh)) shorthandToEntries.set(sh, []);
    shorthandToEntries.get(sh).push(entry);
  }

  const safeShorthands = {};

  for (const entry of allEntries) {
    const recommended = `K.${entry.cat}.${entry.canonicalKey}`;
    let shorthand = entry.candidateShorthand;
    let hasCollision = false;

    // Check collision conditions:
    // a) Key collides across categories with differing values
    if (collidingKeys.has(entry.candidateShorthand) || (collidingKeys.has(entry.canonicalKey) && entry.candidateShorthand === entry.canonicalKey)) {
      hasCollision = true;
    }
    // b) Shorthand matches a JS reserved keyword
    if (JS_RESERVED.has(shorthand) || JS_RESERVED.has(shorthand.toLowerCase())) {
      hasCollision = true;
    }
    // c) Multiple entries share the same candidate shorthand with differing values
    const sharing = shorthandToEntries.get(shorthand) || [];
    if (sharing.length > 1) {
      const distinct = new Set(sharing.map(s => s.val));
      if (distinct.size > 1) {
        hasCollision = true;
      }
    }

    if (hasCollision) {
      // Prevent shorthand: fallback to namespaced K.{CAT}.{KEY}
      shorthand = recommended;
    } else {
      safeShorthands[shorthand] = entry.val;
    }

    valueToMetadata.set(entry.val, {
      value: entry.val,
      category: entry.cat,
      key: entry.canonicalKey,
      recommended,
      namespaced: recommended,
      shorthand,
      hasCollision
    });
  }

  // Handle empty string if present on root
  for (const key of Reflect.ownKeys(root)) {
    if (typeof key === 'string' && root[key] === '') {
      valueToMetadata.set('', {
        value: '',
        category: 'EMPTY',
        key: key,
        recommended: `K.${key}`,
        namespaced: `K.${key}`,
        shorthand: key,
        hasCollision: false
      });
    }
  }

  return {
    categoryNames,
    categorySets,
    valueToMetadata,
    safeShorthands,
    collidingKeys,
    getCategoryValues: (name) => categorySets.get(name) || new Set(),
    get posValues() { return categorySets.get('POS') || new Set(); },
    get conjValues() { return categorySets.get('CONJ') || new Set(); },
    get formalityValues() { return categorySets.get('FORMALITY') || new Set(); },
    get tagValues() { return categorySets.get('TAG') || new Set(); },
    get srcValues() { return categorySets.get('SRC') || new Set(); }
  };
}

// Global default schema reflected from constants.js
const defaultSchema = buildSchemaFromK(K);

/**
 * Loads constants.js dynamically and reflects its schema.
 *
 * @param {string} [customPath] - Path to constants.js
 * @returns {Map<string, { value: string, recommended: string, shorthand: string, category: string }>}
 */
function loadConstantsRegistry(customPath) {
  const rootDir = path.resolve(__dirname, '..');
  const constantsPath = customPath ? path.resolve(customPath) : path.join(rootDir, 'constants.js');

  if (!fs.existsSync(constantsPath)) {
    throw new Error(`Constants module not found at: ${constantsPath}`);
  }

  delete require.cache[require.resolve(constantsPath)];
  const mod = require(constantsPath);
  const constantsRoot = mod.K || mod;

  const reflected = buildSchemaFromK(constantsRoot);
  return reflected.valueToMetadata;
}

// ============================================================================
// 3. Project Source File Discovery
// ============================================================================

/**
 * Recursively locates all JavaScript source files in the project,
 * skipping archives, node_modules, .git, scratch, and constants.js itself.
 *
 * @param {string} targetPath - Root directory or specific file
 * @param {string[]} [fileList]
 * @returns {string[]} List of relative file paths
 */
function findProjectSourceFiles(targetPath, fileList = []) {
  const rootDir = path.resolve(__dirname, '..');
  const resolved = path.resolve(targetPath || rootDir);

  if (!fs.existsSync(resolved)) {
    throw new Error(`Target path does not exist: ${resolved}`);
  }

  const stat = fs.statSync(resolved);
  if (stat.isFile()) {
    const rel = path.relative(rootDir, resolved).replace(/\\/g, '/');
    return [rel];
  }

  const IGNORED_DIRS = new Set([
    'node_modules',
    '.git',
    'history',
    'scratch',
    'docs',
    '.gemini',
    'brain'
  ]);

  const IGNORED_FILES = new Set([
    'constants.js'
  ]);

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(currentDir, entry.name);
      const rel = path.relative(rootDir, full).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          walk(full);
        }
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        if (!IGNORED_FILES.has(rel)) {
          fileList.push(rel);
        }
      }
    }
  }

  walk(resolved);
  return fileList.sort();
}

// ============================================================================
// 4. Linter Logic (Audit & Automatic Search/Replace)
// ============================================================================

/**
 * Detects whether a string literal is an uncomputed object key (e.g. { "foo": 1 }).
 */
function isObjectKeyToken(sourceCode, token) {
  let afterIdx = token.end;
  while (afterIdx < sourceCode.length && /\s/.test(sourceCode[afterIdx])) {
    afterIdx++;
  }
  if (afterIdx >= sourceCode.length || sourceCode[afterIdx] !== ':') {
    return false;
  }
  // If followed by ':', ensure it's not a ternary operator branch
  let beforeIdx = token.start - 1;
  while (beforeIdx >= 0 && /\s/.test(sourceCode[beforeIdx])) {
    beforeIdx--;
  }
  if (beforeIdx >= 0 && sourceCode[beforeIdx] === '?') {
    return false;
  }
  return true;
}

/**
 * Lints a single file against the constants registry.
 *
 * @param {string} filePath - Path to file
 * @param {Map<string, object>} registry - Constants registry
 * @param {object} [options]
 * @returns {{ file: string, totalMatches: number, matches: Array<{ value: string, count: number, info: object, tokens: array }> }}
 */
function lintFile(filePath, registry, options = {}) {
  const rootDir = path.resolve(__dirname, '..');
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(rootDir, filePath);
  const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const tokens = extractStringLiterals(content);

  const matchedTokensMap = new Map();

  for (const token of tokens) {
    // Skip JS typeof comparisons (e.g. typeof x === "object")
    if (token.isTypeofComparison) continue;

    if (registry.has(token.value)) {
      const info = registry.get(token.value);
      if (options.category && info.category.toLowerCase() !== options.category.toLowerCase()) {
        continue;
      }

      if (!matchedTokensMap.has(token.value)) {
        matchedTokensMap.set(token.value, []);
      }
      matchedTokensMap.get(token.value).push(token);
    }
  }

  const matches = [];
  let totalMatches = 0;

  for (const [val, tokenList] of matchedTokensMap.entries()) {
    const info = registry.get(val);
    totalMatches += tokenList.length;
    matches.push({
      value: val,
      count: tokenList.length,
      info,
      tokens: tokenList
    });
  }

  matches.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

  return {
    file: relPath,
    fullPath,
    totalMatches,
    matches,
    rawContent: content
  };
}

/**
 * Lints project files against constants.js.
 *
 * @param {object} [options]
 * @returns {{ files: array, totalFilesScanned: number, totalFlaggedFiles: number, totalRecommendations: number }}
 */
function lintProject(options = {}) {
  const registry = loadConstantsRegistry(options.constantsPath);
  const filePaths = findProjectSourceFiles(options.targetPath);

  const flaggedFiles = [];
  let totalRecommendations = 0;

  for (const relPath of filePaths) {
    const result = lintFile(relPath, registry, options);
    if (result.totalMatches > 0) {
      flaggedFiles.push(result);
      totalRecommendations += result.totalMatches;
    }
  }

  flaggedFiles.sort((a, b) => b.totalMatches - a.totalMatches);

  return {
    files: flaggedFiles,
    totalFilesScanned: filePaths.length,
    totalFlaggedFiles: flaggedFiles.length,
    totalRecommendations,
    registrySize: registry.size
  };
}

/**
 * Automatically applies search/replace to substitute matched string literals with constant identifiers.
 * Replaces tokens in reverse offset order to maintain strict index integrity.
 *
 * @param {object} fileResult - Output from lintFile
 * @param {object} [options] - Options (e.g. shorthand: true)
 * @returns {{ modified: boolean, replacementCount: number, bytesBefore: number, bytesAfter: number }}
 */
function applyFixesToFile(fileResult, options = {}) {
  let content = fileResult.rawContent;
  const bytesBefore = Buffer.byteLength(content, 'utf8');

  // Flatten all matched tokens
  const allTokens = [];
  for (const match of fileResult.matches) {
    for (const token of match.tokens) {
      let replacement = match.info.recommended;
      if (options.shorthand && match.info.shorthand) {
        replacement = match.info.shorthand;
      }
      // If the string literal is an object key, wrap it in computed brackets: [K.POS.NOUN]: 'N'
      if (isObjectKeyToken(content, token)) {
        replacement = `[${replacement}]`;
      }
      allTokens.push({
        start: token.start,
        end: token.end,
        replacement
      });
    }
  }

  if (allTokens.length === 0) {
    return { modified: false, replacementCount: 0, bytesBefore, bytesAfter: bytesBefore };
  }

  // Sort descending by start offset
  allTokens.sort((a, b) => b.start - a.start);

  for (const tok of allTokens) {
    content = content.slice(0, tok.start) + tok.replacement + content.slice(tok.end);
  }

  // If fixing data.js, ensure universal constants and safe shorthand imports are present
  const isDataJs = fileResult.file === 'data.js' || fileResult.file.endsWith('/data.js');
  if (isDataJs && !content.includes("require('./constants.js')")) {
    const schema = buildSchemaFromK(K);
    const shorthandKeys = Object.keys(schema.safeShorthands);
    const importHeader =
      `// --- Universal Constants & Compact Shorthand Imports ---\n` +
      `const {\n` +
      `  K,\n  ` +
      shorthandKeys.join(', ') + `\n` +
      `} = (typeof require !== 'undefined') ? require('./constants.js') : (typeof window !== 'undefined' ? window : {});\n\n`;

    const schemaIdx = content.indexOf('const DATA_SCHEMA = {');
    if (schemaIdx !== -1) {
      content = content.slice(0, schemaIdx) + importHeader + content.slice(schemaIdx);
    } else {
      content = importHeader + content;
    }

    // Ensure K is also exported at the bottom of data.js if not already present
    if (!content.includes('K, DATA_SCHEMA') && !content.includes('DATA_SCHEMA, hasTag, K')) {
      content = content.replace(
        'module.exports = { KR_EN_languageUnits, addLearningUnit, getWords, rebuildCache, getPartOfSpeechCached, cache, DATA_SCHEMA, hasTag };',
        'module.exports = { KR_EN_languageUnits, addLearningUnit, getWords, rebuildCache, getPartOfSpeechCached, cache, DATA_SCHEMA, hasTag, K };'
      );
    }
  }

  fs.writeFileSync(fileResult.fullPath, content, 'utf8');
  const bytesAfter = Buffer.byteLength(content, 'utf8');

  return {
    modified: true,
    replacementCount: allTokens.length,
    bytesBefore,
    bytesAfter
  };
}

// ============================================================================
// 5. Terminal Reporting for Lint Mode
// ============================================================================

function renderLintTerminalReport(lintResult, options = {}) {
  const isDryRun = !options.fix;

  console.log(`\n` + `=`.repeat(100));
  console.log(`                     KONGBUHEY CONSTANTS LINTER & REFACTORING AUDIT                     `);
  console.log(`=`.repeat(100));
  console.log(`Execution Mode:           ${isDryRun ? 'DRY-RUN (Reporting recommendations only)' : 'AUTO-FIX (Applying replacements)'}`);
  console.log(`Constants Loaded:         ${lintResult.registrySize} registered constants from constants.js`);
  console.log(`Total Source Files:       ${lintResult.totalFilesScanned} files scanned`);
  console.log(`Files with Suggestions:   ${lintResult.totalFlaggedFiles} files flagged`);
  console.log(`Total Recommendations:    ${lintResult.totalRecommendations.toLocaleString()} replacement opportunities`);
  if (options.category) {
    console.log(`Category Filter:          "${options.category}"`);
  }
  console.log(`=`.repeat(100) + `\n`);

  if (lintResult.files.length === 0) {
    console.log(`✔ All scanned project files are clean! No bare string literals matching constants.js found.\n`);
    return;
  }

  for (let idx = 0; idx < lintResult.files.length; idx++) {
    const f = lintResult.files[idx];
    console.log(`[${idx + 1}/${lintResult.files.length}] File: ${f.file}`);
    console.log(`    Total Replacements: ${f.totalMatches.toLocaleString()} instances across ${f.matches.length} unique constants`);
    console.log(`    ` + `-`.repeat(92));
    console.log(`    ${'String Literal'.padEnd(28)} | ${'Count'.padStart(6)} | ${'Category'.padEnd(10)} | ${'Recommended Constant'.padEnd(25)} | ${'Alias'}`);
    console.log(`    ` + `-`.repeat(92));

    for (const m of f.matches) {
      const litDisplay = JSON.stringify(m.value);
      const truncatedLit = litDisplay.length > 27 ? litDisplay.slice(0, 24) + '...' : litDisplay;
      const countStr = String(m.count).padStart(6);
      const catStr = m.info.category.padEnd(10);
      const recStr = m.info.recommended.padEnd(25);
      const aliasStr = m.info.shorthand || '-';
      console.log(`    ${truncatedLit.padEnd(28)} | ${countStr} | ${catStr} | ${recStr} | ${aliasStr}`);
    }
    console.log(`    ` + `-`.repeat(92) + `\n`);
  }

  console.log(`=`.repeat(100));
  console.log(`LINTER AUDIT SUMMARY & NEXT STEPS:`);
  console.log(`-`.repeat(100));
  if (isDryRun) {
    console.log(`ℹ This was a DRY-RUN. No files were modified on disk.`);
    console.log(`  To automatically apply replacements across all files:`);
    console.log(`    node test/count_string_literals.js --fix\n`);
    console.log(`  To apply replacements to a single file (e.g. data.js):`);
    console.log(`    node test/count_string_literals.js data.js --fix\n`);
    console.log(`  To use ultra-compact shorthand aliases (e.g. AV, DV, N) for data rows:`);
    console.log(`    node test/count_string_literals.js data.js --fix --shorthand\n`);
  } else {
    console.log(`✔ Replacements applied successfully across ${lintResult.files.length} files.`);
  }
  console.log(`=`.repeat(100) + `\n`);
}

// ============================================================================
// 6. Reflection-Driven Categorization & Frequency Analytics
// ============================================================================

/**
 * Dynamically categorizes a string literal using schema reflection from K.
 *
 * @param {string} val - Literal string value
 * @param {object} [schema] - Reflected schema (defaults to defaultSchema)
 * @returns {string} Category name (POS, CONJ, FORMALITY, TAG, SRC, JSON, GRAMMAR_TEMPLATE, OTHER)
 */
function categorizeLiteral(val, schema = defaultSchema) {
  if (val === '') return 'EMPTY';

  // 1. Dynamic lookup against reflected schema from K
  if (schema.valueToMetadata.has(val)) {
    return schema.valueToMetadata.get(val).category;
  }

  // 2. Syntax/template/pattern fallbacks for non-constant literals
  if (/^SUOBI\d+$/.test(val) || /^class\d+$/.test(val) || val.startsWith('::2026')) return 'SOURCE';
  if (val.startsWith('{') && val.endsWith('}')) return 'JSON';
  if (val.includes('{Clause}') || val.includes('{N}') || val.includes('{AVst}') || val.includes('{DVst}')) return 'GRAMMAR_TEMPLATE';
  if (/^[a-z_0-9]+$/i.test(val) && val.length < 30) return 'TAG';
  return 'OTHER';
}

/**
 * Suggests constant identifier and alias using schema reflection from K.
 *
 * @param {string} val - Literal string value
 * @param {string} [category] - Optional category hint
 * @param {object} [schema] - Reflected schema (defaults to defaultSchema)
 * @returns {{ alias: string, namespaced: string }}
 */
function suggestConstantName(val, category, schema = defaultSchema) {
  if (val === '') return { alias: 'EMPTY', namespaced: 'K.EMPTY' };

  // If reflected in schema from K, return the exact reflected names
  if (schema.valueToMetadata.has(val)) {
    const meta = schema.valueToMetadata.get(val);
    return { alias: meta.shorthand, namespaced: meta.namespaced };
  }

  // Dynamic heuristic fallback for any unmapped repeating literals
  const sanitized = val.replace(/[^a-zA-Z0-9]+/g, '_').toUpperCase().slice(0, 24);
  const catPrefix = category && category !== 'OTHER' ? `K.${category}.` : 'K.STR.';
  return { alias: sanitized || 'STR', namespaced: `${catPrefix}${sanitized || 'STR'}` };
}

function countStringLiterals(literals) {
  const map = new Map();
  for (const tok of literals) {
    const key = tok.value;
    if (!map.has(key)) {
      map.set(key, { value: key, count: 0, singleQuotes: 0, doubleQuotes: 0, templateQuotes: 0, minLength: tok.raw.length });
    }
    const item = map.get(key);
    item.count++;
    if (tok.quote === "'") item.singleQuotes++;
    else if (tok.quote === '"') item.doubleQuotes++;
    else if (tok.quote === '`') item.templateQuotes++;
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

function analyzeFile(filePath, options = {}) {
  const resolvedPath = path.resolve(filePath || 'data.js');
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File does not exist: ${resolvedPath}`);
  }
  const sourceCode = fs.readFileSync(resolvedPath, 'utf8');
  const tokens = extractStringLiterals(sourceCode);
  const counted = countStringLiterals(tokens);
  const minCount = options.minCount !== undefined ? options.minCount : 5;

  const filtered = counted.filter(item => {
    if (item.count < minCount) return false;
    if (options.category) {
      const cat = categorizeLiteral(item.value);
      if (cat.toLowerCase() !== options.category.toLowerCase()) return false;
    }
    return true;
  });

  return {
    filePath: resolvedPath,
    fileSize: fs.statSync(resolvedPath).size,
    totalTokens: tokens.length,
    uniqueLiterals: counted.length,
    threshold: minCount,
    matchingCount: filtered.length,
    rankedLiterals: filtered
  };
}

function renderFrequencyReport(result, topLimit) {
  console.log(`\n` + `=`.repeat(100));
  console.log(`                  JAVASCRIPT STRING LITERAL FREQUENCY REPORT & CONSTANTS LINTER                     `);
  console.log(`=`.repeat(100));
  console.log(`Target File:              ${result.filePath}`);
  console.log(`Total String Tokens:      ${result.totalTokens.toLocaleString()}`);
  console.log(`Unique String Literals:   ${result.uniqueLiterals.toLocaleString()}`);
  console.log(`Threshold:                Count >= ${result.threshold} (appearing ${result.threshold}+ times)`);
  console.log(`Matching Literals:        ${result.matchingCount.toLocaleString()}`);
  console.log(`=`.repeat(100) + `\n`);

  const list = topLimit ? result.rankedLiterals.slice(0, topLimit) : result.rankedLiterals;
  console.log(`    # |  Count | Category   | String Literal                         | Recommended Constant`);
  console.log(`-`.repeat(100));

  list.forEach((item, idx) => {
    const rank = String(idx + 1).padStart(5);
    const count = String(item.count).padStart(6);
    const cat = categorizeLiteral(item.value).padEnd(10);
    const lit = (JSON.stringify(item.value).length > 38 ? JSON.stringify(item.value).slice(0, 35) + '...' : JSON.stringify(item.value)).padEnd(38);
    const names = suggestConstantName(item.value, cat);
    console.log(`${rank} | ${count} | ${cat} | ${lit} | ${names.namespaced}`);
  });
  console.log(`-`.repeat(100) + `\n`);
}

// ============================================================================
// 7. CLI Entry Point & Argument Dispatcher
// ============================================================================

function printHelp() {
  console.log(`
Kongbuhey Constants Linter & String Literal Analyzer
===================================================

DEFAULT MODE: Project Constants Refactoring Linter (Dry-Run by default)
  Audits project source files against constants.js to eliminate bare magic strings.
  Fully reflection-driven: inspects K at runtime with zero schema duplication.

USAGE:
  node test/count_string_literals.js [targetPath] [options]

ARGUMENTS:
  [targetPath]             File or directory to scan (default: entire project)

OPTIONS:
  -f, --fix, --replace     Automatically apply search/replace across matched files
  -s, --shorthand          Use short aliases (e.g. AV, DV, N) instead of K.POS.ACTION_VERB
  -c, --category <cat>     Filter by category: POS, CONJ, FORMALITY, TAG, SRC
  -j, --json               Output raw report in machine-readable JSON format
  -h, --help               Display this help guide

FREQUENCY ANALYSIS OPTIONS (Counting repeated literals):
  -a, --analyze, --freq    Run frequency counter mode (default file: data.js)
  -m, --min <n>            Minimum repetition threshold (default: 5, i.e. count > 4)
  -t, --top <n>            Limit frequency display to top N rows

EXAMPLES:
  # 1. Project-wide audit in dry-run mode (default):
  node test/count_string_literals.js

  # 2. Audit only data.js:
  node test/count_string_literals.js data.js

  # 3. Audit only Parts of Speech across the project:
  node test/count_string_literals.js --category pos

  # 4. Automatically replace bare strings in data.js with constants:
  node test/count_string_literals.js data.js --fix

  # 5. Run original frequency analysis on data.js:
  node test/count_string_literals.js --analyze --top 30
`);
}

function parseCliArgs(args) {
  const options = {
    targetPath: null,
    fix: false,
    shorthand: false,
    category: null,
    json: false,
    help: false,
    analyze: false,
    minCount: 5,
    topLimit: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--fix' || arg === '--replace' || arg === '-f') {
      options.fix = true;
    } else if (arg === '--shorthand' || arg === '-s') {
      options.shorthand = true;
    } else if (arg === '--json' || arg === '-j') {
      options.json = true;
    } else if (arg === '--category' || arg === '-c') {
      if (i + 1 < args.length) options.category = args[++i];
    } else if (arg === '--analyze' || arg === '--freq' || arg === '-a') {
      options.analyze = true;
    } else if (arg === '--min' || arg === '-m') {
      if (i + 1 < args.length) options.minCount = parseInt(args[++i], 10);
    } else if (arg === '--top' || arg === '-t') {
      if (i + 1 < args.length) options.topLimit = parseInt(args[++i], 10);
    } else if (!arg.startsWith('-')) {
      options.targetPath = arg;
    }
  }

  return options;
}

function runCli() {
  const args = process.argv.slice(2);
  const options = parseCliArgs(args);

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  try {
    // Mode 2: Frequency Analysis Mode
    if (options.analyze) {
      const targetFile = options.targetPath || 'data.js';
      const result = analyzeFile(targetFile, {
        minCount: options.minCount,
        category: options.category
      });

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
      }

      renderFrequencyReport(result, options.topLimit);
      process.exit(0);
    }

    // Mode 1: Default Mode -> Project Constants Linter
    const lintResult = lintProject(options);

    if (options.json) {
      console.log(JSON.stringify(lintResult, null, 2));
      process.exit(0);
    }

    if (options.fix) {
      console.log(`Applying automatic replacements across ${lintResult.files.length} flagged files...`);
      for (const fileResult of lintResult.files) {
        const fixStats = applyFixesToFile(fileResult, options);
        console.log(`  ✔ [${fileResult.file}] Replaced ${fixStats.replacementCount} occurrences.`);
      }
      console.log(`\nCompleted automatic search/replace.`);
      process.exit(0);
    }

    // Default: Terminal dry-run report
    renderLintTerminalReport(lintResult, options);

  } catch (err) {
    console.error(`\nError: ${err.message}`);
    process.exit(1);
  }
}

// Module exports for test runner, linter, and continuous integration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildSchemaFromK,
    defaultSchema,
    extractStringLiterals,
    unescapeJsString,
    loadConstantsRegistry,
    findProjectSourceFiles,
    lintFile,
    lintProject,
    applyFixesToFile,
    countStringLiterals,
    analyzeFile,
    categorizeLiteral,
    suggestConstantName
  };
}

// CLI invocation
if (typeof require !== 'undefined' && require.main === module) {
  runCli();
}
