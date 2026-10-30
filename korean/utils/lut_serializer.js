/**
 * Language Unit Tree (LUT) Reconstruction & Serialization Utilities
 *
 * Provides serialization, URL-safe base64 binary encoding/decoding of language unit IDs,
 * and tree reconstruction into natural Korean surface text.
 */

let dataModule;
if (typeof require !== 'undefined') {
	try {
		dataModule = require('../../data.js');
	} catch (e) {
		dataModule = typeof window !== 'undefined' ? window : {};
	}
} else {
	dataModule = typeof window !== 'undefined' ? window : {};
}

const { DATA_SCHEMA, getStem } = (typeof require !== 'undefined' ? require('../core/primitives.js') : window);

function flattenLanguageUnitTree(tree) {
	const ids = new Set();
	function traverse(node) {
		if (node === null || node === undefined) return;
		if (typeof node === 'number') { ids.add(node); return; }
		if (Array.isArray(node)) {
			for (let item of node) {
				if (typeof item === 'number') ids.add(item);
				else if (Array.isArray(item)) traverse(item);
			}
		}
	}
	traverse(tree);
	return Array.from(ids).sort((a, b) => a - b);
}

function encodeLanguageUnitIds(idsOrTree) {
	let ids = [];
	if (Array.isArray(idsOrTree) && idsOrTree.some(x => Array.isArray(x) || typeof x === 'string')) {
		ids = flattenLanguageUnitTree(idsOrTree);
	} else if (Array.isArray(idsOrTree)) {
		ids = Array.from(new Set(idsOrTree)).filter(x => typeof x === 'number').sort((a, b) => a - b);
	} else if (typeof idsOrTree === 'number') {
		ids = [idsOrTree];
	}

	const u16 = new Uint16Array(ids);
	const bytes = new Uint8Array(u16.buffer, u16.byteOffset, u16.byteLength);

	if (typeof Buffer !== 'undefined') {
		return Buffer.from(bytes).toString('base64url');
	}
	let binary = '';
	for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeLanguageUnitIds(token) {
	if (!token || typeof token !== 'string') return [];
	let b64 = token.replace(/-/g, '+').replace(/_/g, '/');
	while (b64.length % 4) b64 += '=';

	let bytes;
	if (typeof Buffer !== 'undefined') {
		bytes = new Uint8Array(Buffer.from(b64, 'base64'));
	} else {
		const binary = atob(b64);
		bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	}

	const count = Math.floor(bytes.byteLength / 2);
	const u16 = new Uint16Array(bytes.buffer, bytes.byteOffset, count);
	return Array.from(u16);
}

function reconstructFromLanguageUnitTree(tree, phraseBuilders = {}) {
	if (tree === null || tree === undefined) return "";
	if (typeof tree === 'string') return tree;
	const units = dataModule.KR_EN_languageUnits || (typeof window !== 'undefined' ? window.KR_EN_languageUnits : []);
	if (typeof tree === 'number') {
		const u = units ? units[tree] : null;
		return u ? u[DATA_SCHEMA.Korean] : String(tree);
	}
	if (!Array.isArray(tree) || tree.length === 0) return "";

	const grammarRef = tree[0];
	let children = tree.slice(1);
	let explicitFormulaIndex = null;
	if (children.length > 0 && typeof children[0] === 'string' && children[0].startsWith('@f:')) {
		const parsedIdx = parseInt(children[0].slice(3), 10);
		if (!isNaN(parsedIdx)) explicitFormulaIndex = parsedIdx;
		children = children.slice(1);
	}
	let template = "";

	if (typeof grammarRef === 'number') {
		const grammarUnit = units ? units[grammarRef] : null;
		if (grammarUnit && Array.isArray(grammarUnit[DATA_SCHEMA.Conjugation])) {
			const formulas = grammarUnit[DATA_SCHEMA.Conjugation];
			if (explicitFormulaIndex !== null && formulas[explicitFormulaIndex]) {
				template = formulas[explicitFormulaIndex];
			} else if (formulas.length === 1) {
				template = formulas[0];
			} else {
				const candidate = formulas.find(f => {
					const tokens = f.match(/\{[^}:]+(?::[^}]+)?\}/g) || [];
					if (tokens.length !== children.length) return false;
					for (let i = 0; i < tokens.length; i++) {
						const m = tokens[i].match(/^\{([^}:]+)/);
						if (!m) continue;
						const type = m[1], child = children[i];
						if (type === 'Clause' && !Array.isArray(child)) return false;
						const unitId = typeof child === 'number' ? child : (Array.isArray(child) && typeof child[0] === 'number' ? child[0] : null);
						const u = (unitId !== null && units) ? units[unitId] : null;
						if (type === 'Adv' && u && u[DATA_SCHEMA.PartofSpeech] !== 'Adverb') return false;
						if ((type === 'VP_AVst' || type === 'AVst') && u && u[DATA_SCHEMA.PartofSpeech] !== 'Action Verb') return false;
						if ((type === 'VP_DVst' || type === 'DVst') && u && u[DATA_SCHEMA.PartofSpeech] !== 'Descriptive Verb') return false;
					}
					return true;
				});

				if (candidate) {
					template = candidate;
				} else {
					const firstChild = children[0];
					const firstId = typeof firstChild === 'number' ? firstChild : (Array.isArray(firstChild) && typeof firstChild[0] === 'number' ? firstChild[0] : null);
					const u = (firstId !== null && units) ? units[firstId] : null;
					const isAV = u && u[DATA_SCHEMA.PartofSpeech] === 'Action Verb';
					const isDV = u && u[DATA_SCHEMA.PartofSpeech] === 'Descriptive Verb';
					template = isAV ? (formulas.find(f => f.includes('AVst')) || formulas[0])
						: isDV ? (formulas.find(f => f.includes('DVst')) || formulas[0])
							: formulas[0];
				}
			}
		} else {
			template = String(grammarRef);
		}
	} else {
		template = String(grammarRef);
	}

	let koResult = template;
	const tokenRegex = /\{([^}:]+)(?::([^}]+))?\}/g;
	let match, childIndex = 0;

	let morphologyMod = null;
	let classifierMod = null;
	let spatialMod = null;
	if (typeof require !== 'undefined') {
		try {
			morphologyMod = require('../core/morphology.js');
			classifierMod = require('../concord/classifier_concord.js');
			spatialMod = require('../concord/spatial_concord.js');
		} catch (e) {}
	}

	const buildAction = phraseBuilders.buildActionVerbPhrase || (morphologyMod && morphologyMod.buildActionVerbPhrase) || (typeof window !== 'undefined' ? window.buildActionVerbPhrase : null);
	const buildDescriptive = phraseBuilders.buildDescriptiveVerbPhrase || (morphologyMod && morphologyMod.buildDescriptiveVerbPhrase) || (typeof window !== 'undefined' ? window.buildDescriptiveVerbPhrase : null);
	const buildCounting = phraseBuilders.buildCountingPhrase || (classifierMod && classifierMod.buildCountingPhrase) || (typeof window !== 'undefined' ? window.buildCountingPhrase : null);
	const buildSpatial = phraseBuilders.buildSpatialPhrase || (spatialMod && spatialMod.buildSpatialPhrase) || (typeof window !== 'undefined' ? window.buildSpatialPhrase : null);
	const buildDeictic = phraseBuilders.buildDeicticPhrase || (spatialMod && spatialMod.buildDeicticPhrase) || (typeof window !== 'undefined' ? window.buildDeicticPhrase : null);

	while ((match = tokenRegex.exec(koResult)) !== null) {
		const token = match[0], tokenType = match[1], tag = match[2];
		const child = children[childIndex++];
		let replacement = "";

		if (tokenType === "VP_AVst" || tokenType === "AVst" || tokenType === "VP_DVst" || tokenType === "DVst") {
			const verbId = Array.isArray(child) ? child[0] : (typeof child === 'number' ? child : null);
			const nounId = (Array.isArray(child) && child.length > 1) ? child[1] : null;
			const verb = (verbId !== null && units) ? units[verbId] : null;
			const noun = (nounId !== null && units && typeof nounId === 'number') ? units[nounId] : (typeof nounId === 'string' ? nounId : null);

			if (verb) {
				let stem = getStem(verb[DATA_SCHEMA.Korean]);
				const conj = verb[DATA_SCHEMA.Conjugation];
				if (conj && conj !== "regular" && conj !== "") stem += `[${conj}]`;
				if (tokenType === "AVst" || tokenType === "DVst") {
					replacement = stem;
				} else {
					const isVerbAction = verb[DATA_SCHEMA.PartofSpeech] === 'Action Verb';
					const phrase = isVerbAction && buildAction ? buildAction(verb, stem, noun)
						: isVerbAction ? { text: stem }
						: buildDescriptive ? buildDescriptive(verb, stem, noun)
						: { text: stem };
					replacement = phrase.text;
				}
			} else {
				replacement = typeof child === 'string' ? child : "N/A";
			}
		} else if (tokenType === "Clause" || tokenType === "VP") {
			replacement = reconstructFromLanguageUnitTree(child, phraseBuilders);
		} else if ((tokenType === "CountPhrase" || tokenType === "Noun_Count") && Array.isArray(child) && buildCounting) {
			const noun = (typeof child[0] === 'number' && units) ? units[child[0]] : child[0];
			const count = typeof child[1] === 'number' ? child[1] : 1;
			const classifierUnit = (typeof child[2] === 'number' && units) ? units[child[2]] : null;
			const classifier = classifierUnit ? classifierUnit[DATA_SCHEMA.Korean] : (typeof child[2] === 'string' ? child[2] : '개');
			let particle = null;
			if (tag === "object" || tag === "AV" || /을|를/.test(token)) particle = "object";
			else if (tag === "subject" || tag === "DV" || /이|가/.test(token)) particle = "subject";
			else if (tag === "topic" || /은|는/.test(token)) particle = "topic";
			replacement = buildCounting(noun, count, { classifier, particle });
		} else if ((tokenType === "Spatial_Phrase" || tokenType === "Relational_Loc") && Array.isArray(child) && buildSpatial) {
			const ground = (typeof child[0] === 'number' && units) ? units[child[0]] : child[0];
			const posUnit = (typeof child[1] === 'number' && units) ? units[child[1]] : null;
			const posKo = posUnit ? posUnit[DATA_SCHEMA.Korean] : (typeof child[1] === 'string' ? child[1] : '위');
			let particleType = "location";
			if (tag === "static" || /에$/.test(token)) particleType = "location_static";
			else if (tag === "dynamic" || /에서$/.test(token)) particleType = "location_dynamic";
			else if (tag === "direction" || /로$/.test(token)) particleType = "direction";
			replacement = buildSpatial(ground, posKo, { particle: particleType });
		} else if (tokenType === "Deictic_NP" && Array.isArray(child) && buildDeictic) {
			const proximity = tag === "medial" ? "medial" : tag === "distal" ? "distal" : tag === "interrogative" ? "interrogative" : "proximal";
			const noun = (typeof child[1] === 'number' && units) ? units[child[1]] : child[1];
			replacement = buildDeictic(proximity, "noun", { noun });
		} else if (tokenType === "properNoun" && Array.isArray(child) && child.length === 2) {
			const ssiUnit = (typeof child[0] === 'number' && units) ? units[child[0]] : null;
			const ssiKo = ssiUnit ? ssiUnit[DATA_SCHEMA.Korean] : "씨";
			replacement = String(child[1] || "") + ssiKo;
		} else {
			if (typeof child === 'number' && units && units[child]) {
				replacement = units[child][DATA_SCHEMA.Korean];
			} else if (Array.isArray(child) && child.length === 1 && typeof child[0] === 'number' && units && units[child[0]]) {
				replacement = units[child[0]][DATA_SCHEMA.Korean];
			} else {
				replacement = String(child || "N/A");
			}
		}

		koResult = koResult.replace(token, replacement || "N/A");
		tokenRegex.lastIndex = 0;
	}
	return koResult;
}

const lutExports = {
	flattenLanguageUnitTree,
	encodeLanguageUnitIds,
	decodeLanguageUnitIds,
	reconstructFromLanguageUnitTree
};

if (typeof window !== 'undefined') {
	Object.assign(window, lutExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = lutExports;
}
