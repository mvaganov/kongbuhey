/**
 * webapp/text_importer.js
 *
 * Browser-Pure UI View & Passage Decomposition Controller for Kongbuhey.
 *
 * Responsibilities:
 *   1. Reads Korean passage text (scripts, book excerpts, lyrics, subtitles).
 *   2. Invokes koreanAnalyzer.analyzePassage to decompose into sentences & tokens.
 *   3. Automatically includes all recognized language units into the Practice Set (InSet = true).
 *   4. Identifies and presents all missing vocabulary & grammar patterns.
 *   5. Generates scaffolded JSON and CLI instructions for ingest.js & select.js tooling.
 *
 * Zero external dependencies; 100% browser-safe (file:// and HTTP compatible).
 */

class TextImporterView {
	constructor(options = {}) {
		this.engine = options.engine;
		this.onStateChange = options.onStateChange || (() => {});

		this.container = null;
		this.lastResult = null;
		this.sourceName = 'custom_passage';
		this.inputText = '';
	}

	mount(containerElement) {
		this.container = containerElement;
		this.render();
	}

	render() {
		if (!this.container) return;
		this.container.innerHTML = `
			<div class="importer-pane">
				<header class="importer-header">
					<div class="importer-title-group">
						<h2>📖 Korean Text Ingestion &amp; Passage Analysis</h2>
						<p class="importer-subtitle">
							Paste any Korean text (study passage, drama script, lyrics, web article) to automatically
							recognize vocabulary &amp; grammar, add them to your Practice Set, and discover curriculum gaps.
						</p>
					</div>
				</header>

				<section class="importer-input-card">
					<div class="importer-input-header">
						<div class="importer-source-field">
							<label for="importer-source-input">Curriculum Source / Passage Tag:</label>
							<input type="text" id="importer-source-input" class="importer-text-input-field"
								value="${this.sourceName}" placeholder="e.g. drama_ep1, kpop_lyrics, book_ch3">
						</div>
						<div class="importer-actions-cluster">
							<button type="button" id="btn-importer-analyze" class="btn btn-primary" title="Analyze passage and add recognized units to Set">
								🔍 Analyze &amp; Add to Set
							</button>
							<button type="button" id="btn-importer-clear" class="btn btn-ghost" title="Clear text input and results">
								Clear
							</button>
						</div>
					</div>

					<div class="importer-textarea-wrapper">
						<textarea id="importer-text-input" class="importer-textarea" rows="7"
							placeholder="Paste Korean text here... (e.g. 우리는 오늘 학교에 갑니다. 그리고 밥을 맛있게 먹었어요.)">${this.inputText}</textarea>
					</div>
				</section>

				<section id="importer-results-container" class="importer-results-section">
					${this.lastResult ? this._renderResultsHtml(this.lastResult) : ''}
				</section>
			</div>
		`;

		this._bindEvents();
	}

	_bindEvents() {
		const analyzeBtn = this.container.querySelector('#btn-importer-analyze');
		const clearBtn = this.container.querySelector('#btn-importer-clear');
		const srcInput = this.container.querySelector('#importer-source-input');
		const txtInput = this.container.querySelector('#importer-text-input');

		if (srcInput) {
			srcInput.addEventListener('input', () => {
				this.sourceName = srcInput.value.trim() || 'custom_passage';
			});
		}

		if (txtInput) {
			txtInput.addEventListener('input', () => {
				this.inputText = txtInput.value;
			});
		}

		if (analyzeBtn) {
			analyzeBtn.addEventListener('click', async () => {
				const text = txtInput ? txtInput.value.trim() : '';
				if (!text) {
					alert('Please enter or paste Korean text to analyze.');
					return;
				}
				const src = (srcInput ? srcInput.value.trim() : '') || 'custom_passage';
				await this.analyzePassageText(text, src);
			});
		}

		if (clearBtn) {
			clearBtn.addEventListener('click', () => {
				this.inputText = '';
				this.lastResult = null;
				this.render();
			});
		}

		this._bindResultsEvents();
	}

	_bindResultsEvents() {
		const scaffoldBtn = this.container.querySelector('#btn-generate-tooling-scaffold');
		if (scaffoldBtn) {
			scaffoldBtn.addEventListener('click', () => {
				this._toggleScaffoldOutput();
			});
		}

		const copyAgentPromptBtn = this.container.querySelector('#btn-copy-agent-prompt');
		if (copyAgentPromptBtn) {
			copyAgentPromptBtn.addEventListener('click', async () => {
				const promptText = `Please review scratch/new_units_${this.sourceName}.json: normalize words to dictionary base forms (infinitives for verbs), verify Part of Speech against the 9 canonical types, add accurate English definitions and semantic tags, and ingest them using: node ingest.js --draft scratch/new_units_${this.sourceName}.json --source ${this.sourceName}`;
				try {
					if (navigator.clipboard && navigator.clipboard.writeText) {
						await navigator.clipboard.writeText(promptText);
					}
					copyAgentPromptBtn.textContent = '✓ Copied Prompt!';
					setTimeout(() => { copyAgentPromptBtn.textContent = '📋 Copy Agent Prompt'; }, 2000);
				} catch (_) {}
			});
		}

		const copyBtn = this.container.querySelector('#btn-copy-scaffold-json');
		if (copyBtn) {
			copyBtn.addEventListener('click', async () => {
				const textarea = this.container.querySelector('#importer-scaffold-output');
				if (textarea && textarea.value) {
					try {
						if (navigator.clipboard && navigator.clipboard.writeText) {
							await navigator.clipboard.writeText(textarea.value);
						} else {
							textarea.select();
							document.execCommand('copy');
						}
						copyBtn.textContent = '✓ Copied!';
						setTimeout(() => { copyBtn.textContent = '📋 Copy JSON'; }, 2000);
					} catch (_) {
						textarea.select();
					}
				}
			});
		}

		const downloadBtn = this.container.querySelector('#btn-download-scaffold-json');
		if (downloadBtn) {
			downloadBtn.addEventListener('click', () => {
				const textarea = this.container.querySelector('#importer-scaffold-output');
				if (!textarea || !textarea.value) return;
				const blob = new Blob([textarea.value], { type: 'application/json;charset=utf-8' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `new_units_${this.sourceName}.json`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			});
		}
	}

	async analyzePassageText(text, sourceName) {
		this.inputText = text;
		this.sourceName = sourceName;

		const analyzer = (typeof window !== 'undefined' && window.koreanAnalyzer)
			? window.koreanAnalyzer
			: (typeof require !== 'undefined' ? require('../korean/analyzer/index.js') : null);

		if (!analyzer || typeof analyzer.analyzePassage !== 'function') {
			console.error('[TextImporterView] koreanAnalyzer subsystem is not available.');
			return null;
		}

		const result = analyzer.analyzePassage(text, sourceName);
		this.lastResult = result;

		// Automatically add all recognized Language Units to the Practice Set (InSet = true)
		const recognizedIds = new Set();
		if (Array.isArray(result.knownVocab)) {
			for (const v of result.knownVocab) {
				if (v.unit && v.unit[0] !== undefined) recognizedIds.add(Number(v.unit[0]));
			}
		}
		if (Array.isArray(result.knownGrammar)) {
			for (const g of result.knownGrammar) {
				if (g.unit && g.unit[0] !== undefined) recognizedIds.add(Number(g.unit[0]));
			}
		}

		const idList = Array.from(recognizedIds);
		if (idList.length > 0 && this.engine && typeof this.engine.setBulkColumnValue === 'function') {
			await this.engine.setBulkColumnValue(idList, 'InSet', true);
		}

		this.onStateChange({
			type: 'importer-passage-analyzed',
			source: sourceName,
			addedCount: idList.length,
			missingVocabCount: result.missingVocab?.length || 0,
			missingGrammarCount: result.missingGrammar?.length || 0
		});

		const resultsContainer = this.container ? this.container.querySelector('#importer-results-container') : null;
		if (resultsContainer) {
			resultsContainer.innerHTML = this._renderResultsHtml(result, idList.length);
			this._bindResultsEvents();
		}

		return { result, addedUnitIds: idList };
	}

	_renderResultsHtml(result, addedCount = null) {
		const totalSentences = result.totalSentences || (result.sentences ? result.sentences.length : 0);
		const knownVocab = result.knownVocab || [];
		const knownGrammar = result.knownGrammar || [];
		const missingVocab = result.missingVocab || [];
		const missingGrammar = result.missingGrammar || [];
		const addedTotal = addedCount !== null ? addedCount : (knownVocab.length + knownGrammar.length);

		const totalMissing = missingVocab.length + missingGrammar.length;

		return `
			<!-- Summary Telemetry Cards -->
			<div class="importer-telemetry-grid">
				<div class="importer-stat-card stat-emerald">
					<div class="stat-number">${addedTotal}</div>
					<div class="stat-meta">Recognized Units Added to Practice Set</div>
					<div class="stat-sub">${knownVocab.length} Vocab · ${knownGrammar.length} Grammar</div>
				</div>
				<div class="importer-stat-card ${totalMissing > 0 ? 'stat-amber' : 'stat-slate'}">
					<div class="stat-number">${totalMissing}</div>
					<div class="stat-meta">Missing Curriculum Gaps</div>
					<div class="stat-sub">${missingVocab.length} Vocab · ${missingGrammar.length} Grammar</div>
				</div>
				<div class="importer-stat-card stat-blue">
					<div class="stat-number">${totalSentences}</div>
					<div class="stat-meta">Total Sentences Decomposed</div>
					<div class="stat-sub">${result.summary?.disambiguationsCount || 0} Disambiguations</div>
				</div>
			</div>

			<!-- Dual Decomposition Grid -->
			<div class="importer-breakdown-grid">
				<!-- Left: Recognized Language Units -->
				<div class="importer-section-pane recognized-pane">
					<div class="section-pane-header">
						<h3>✓ Recognized Units (Added to Set)</h3>
						<span class="badge-count">${knownVocab.length + knownGrammar.length}</span>
					</div>
					<div class="recognized-scroll-list">
						${this._renderRecognizedUnitsList(knownVocab, knownGrammar)}
					</div>
				</div>

				<!-- Right: Missing Units & Tooling Assistance -->
				<div class="importer-section-pane missing-pane">
					<div class="section-pane-header">
						<h3>⚠️ Missing Units (Curriculum Gaps)</h3>
						<span class="badge-count badge-amber">${totalMissing}</span>
					</div>

					<div class="missing-scroll-list">
						${this._renderMissingUnitsList(missingVocab, missingGrammar)}
					</div>

					${totalMissing > 0 ? `
						<div class="importer-tooling-box">
							<div class="tooling-box-header">
								<div>
									<strong>Tooling Assistance for Missing Units</strong>
									<p class="tooling-desc">Generate scaffolded JSON and CLI instructions to import these units via <code>select.js</code> or <code>ingest.js</code>.</p>
								</div>
								<button type="button" id="btn-generate-tooling-scaffold" class="btn btn-primary btn-sm">
									📋 Generate Tooling Scaffold
								</button>
							</div>

							<div id="importer-scaffold-area" class="scaffold-area hidden">
								<div class="scaffold-instructions">
									<div class="scaffold-workflow-card agent-workflow">
										<div class="workflow-card-header">
											<strong>🤖 Option A: Agentic LLM Workflow (Recommended)</strong>
											<button type="button" id="btn-copy-agent-prompt" class="btn btn-secondary btn-sm">📋 Copy Agent Prompt</button>
										</div>
										<p>Save this scaffold to <code>scratch/new_units_${this.sourceName}.json</code> (or click Download below), then ask your AI assistant to normalize and enrich it:</p>
										<pre class="cli-cmd-preview"><code>Please review scratch/new_units_${this.sourceName}.json: normalize words to dictionary base forms, assign canonical POS, enrich English definitions, and ingest via: node ingest.js --draft scratch/new_units_${this.sourceName}.json --source ${this.sourceName}</code></pre>
									</div>

									<div class="scaffold-workflow-card manual-workflow">
										<strong>⚙️ Option B: Manual Curation &amp; Direct CLI Ingestion</strong>
										<p>⚠️ <em>Do not insert raw scaffolds directly with select.js.</em> Ensure all <code>"Unknown"</code> parts of speech are replaced with one of the 9 canonical types and English definitions are curated before running:</p>
										<pre class="cli-cmd-preview"><code>node ingest.js --draft scratch/new_units_${this.sourceName}.json --source ${this.sourceName}</code></pre>
									</div>
								</div>
								<textarea id="importer-scaffold-output" class="importer-scaffold-textarea" rows="10" readonly>${this._generateScaffoldJson(missingVocab, missingGrammar)}</textarea>
								<div class="scaffold-actions">
									<button type="button" id="btn-copy-scaffold-json" class="btn btn-secondary btn-sm">📋 Copy JSON</button>
									<button type="button" id="btn-download-scaffold-json" class="btn btn-emerald btn-sm">💾 Download JSON</button>
								</div>
							</div>
						</div>
					` : `
						<div class="importer-tooling-box success-box">
							<p>🎉 <strong>Complete Curriculum Coverage!</strong> All words and grammatical patterns in this passage are already cataloged in <code>data.js</code>.</p>
						</div>
					`}
				</div>
			</div>
		`;
	}

	_renderRecognizedUnitsList(knownVocab, knownGrammar) {
		if (knownVocab.length === 0 && knownGrammar.length === 0) {
			return '<p class="empty-list-notice">No existing language units recognized in this text.</p>';
		}

		const items = [];
		for (const v of knownVocab) {
			const u = v.unit;
			if (!u) continue;
			items.push({
				id: u[0],
				ko: u[1],
				en: u[2],
				pos: u[3] || 'Noun',
				count: v.count || 1,
				isGrammar: false
			});
		}
		for (const g of knownGrammar) {
			const u = g.unit;
			if (!u) continue;
			items.push({
				id: u[0],
				ko: u[1],
				en: u[2],
				pos: u[3] || 'Grammar',
				count: g.count || 1,
				isGrammar: true
			});
		}

		return items.map(item => `
			<div class="recognized-item-row">
				<span class="rec-id">#${item.id}</span>
				<strong class="rec-ko">${item.ko}</strong>
				<span class="rec-en">${item.en}</span>
				<span class="rec-pos-badge ${item.isGrammar ? 'badge-grammar' : 'badge-vocab'}">${item.pos}</span>
				<span class="rec-count">×${item.count}</span>
			</div>
		`).join('');
	}

	_renderMissingUnitsList(missingVocab, missingGrammar) {
		if (missingVocab.length === 0 && missingGrammar.length === 0) {
			return '<p class="empty-list-notice empty-success">0 gaps! Every word and grammar pattern is present in data.js.</p>';
		}

		const rows = [];
		for (const m of missingVocab) {
			const ctx = (m.contexts && m.contexts[0]) ? m.contexts[0] : '';
			rows.push(`
				<div class="missing-item-row">
					<div class="missing-main-info">
						<strong class="missing-text">${m.text}</strong>
						<span class="missing-pos-badge badge-vocab">${m.pos || 'Noun'}</span>
						<span class="missing-count">×${m.count || 1}</span>
					</div>
					${ctx ? `<div class="missing-context-line">${ctx}</div>` : ''}
				</div>
			`);
		}

		for (const g of missingGrammar) {
			const ctx = (g.contexts && g.contexts[0]) ? g.contexts[0] : '';
			rows.push(`
				<div class="missing-item-row">
					<div class="missing-main-info">
						<strong class="missing-text">${g.text}</strong>
						<span class="missing-pos-badge badge-grammar">${g.pos || 'Grammar'}</span>
						<span class="missing-count">×${g.count || 1}</span>
					</div>
					${ctx ? `<div class="missing-context-line">${ctx}</div>` : ''}
				</div>
			`);
		}

		return rows.join('');
	}

	_toggleScaffoldOutput() {
		const area = this.container.querySelector('#importer-scaffold-area');
		if (area) {
			area.classList.toggle('hidden');
		}
	}

	_generateScaffoldJson(missingVocab, missingGrammar) {
		const scaffoldList = [];
		const seenWords = new Set();

		for (const m of missingVocab) {
			const word = String(m.text || '').trim();
			if (!word || seenWords.has(word)) continue;
			seenWords.add(word);

			let pos = m.pos || 'Noun';
			let conj = '';
			let tags = ['general'];

			if (word.endsWith('하다')) {
				pos = 'Action Verb';
				conj = 'hada';
				tags = ['action', 'general'];
			} else if (word.endsWith('다')) {
				pos = 'Action Verb';
				conj = '{AVst}';
				tags = ['action', 'general'];
			}

			scaffoldList.push({
				Korean: word,
				English: m.gloss || `<English definition of "${word}">`,
				PartofSpeech: pos,
				SemanticTags: tags,
				Disambiguation: '',
				Conjugation: conj,
				Source: this.sourceName,
				PriorityScore: 1,
				FormalityLevel: 'Universal',
				HonorificRules: '',
				SemanticVector: JSON.stringify({ domain: 'concept', type: 'general' }),
				SyntaxFrame: ''
			});
		}

		for (const g of missingGrammar) {
			const word = String(g.text || '').trim();
			if (!word || seenWords.has(word)) continue;
			seenWords.add(word);

			scaffoldList.push({
				Korean: word,
				English: g.gloss || `<Grammar description of "${word}">`,
				PartofSpeech: 'Grammar',
				SemanticTags: ['grammar'],
				Disambiguation: '',
				Conjugation: '{VP_AVst}',
				Source: this.sourceName,
				PriorityScore: 1,
				FormalityLevel: 'Universal',
				HonorificRules: '',
				SemanticVector: JSON.stringify({ domain: 'grammar', type: 'verb_ending' }),
				SyntaxFrame: ''
			});
		}

		return JSON.stringify(scaffoldList, null, 2);
	}
}

if (typeof window !== 'undefined') {
	window.TextImporterView = TextImporterView;
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = { TextImporterView };
}
