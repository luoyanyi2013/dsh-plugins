window.__ModuleLoader__.load({
	id: "dk-chat-nav",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		let React = require("react");

		let DkCtx;
		// ── styles (data-plugin-css tag, idempotent) ────────────────────────────
		const CSS_TEXT = `
.dk-nav-hotspot {
  position: fixed; right: 0; top: 50%;
  transform: translateY(-50%);
  z-index: 9998;
  width: 72px; height: 40vh;
  pointer-events: auto;
}
.dk-nav {
  position: absolute; right: 8px; top: 50%;
  transform: translateY(-50%);
  display: flex; flex-direction: column;
  width: 24px;
  height: 224px;
  overflow-y: auto;
  padding: 8px 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 16px 4px 4px 16px;
  box-shadow: none;
  transition: width .22s ease, background .22s ease, border-color .22s ease, box-shadow .22s ease;
  scrollbar-width: none;
  scroll-snap-type: y mandatory;
}
.dk-nav::-webkit-scrollbar { display: none; }
.dk-nav-hotspot:hover .dk-nav {
  width: 272px;
  background: var(--dsw-alias-bg-base);
  border-color: var(--dsw-alias-border-l1);
  box-shadow: 0 6px 20px rgba(0,0,0,.35);
}
.dk-nav-row {
  display: flex; align-items: center; justify-content: flex-end; gap: 10px;
  width: 100%; height: 26px; flex: none;
  margin: 0; padding: 0 4px; border: none; background: transparent;
  cursor: pointer; border-radius: 6px;
  scroll-snap-align: start;
}
.dk-nav-row:hover { background: var(--dsw-alias-bg-layer-1); }
.dk-nav-text {
  flex: 1; min-width: 0;
  font-size: 12px; line-height: 26px; color: var(--dsw-alias-label-primary);
  text-align: right;
  white-space: nowrap; overflow: hidden;
  display: none;
}
.dk-nav-hotspot:hover .dk-nav-text { display: block; }
.dk-nav-text.dk-fade {
  -webkit-mask-image: linear-gradient(to right, #000 0%, #000 72%, transparent 100%);
  mask-image: linear-gradient(to right, #000 0%, #000 72%, transparent 100%);
}
.dk-nav-line {
  flex: none;
  width: 8px; height: 2px; border-radius: 1px;
  background: var(--dsw-alias-label-secondary);
  opacity: .1;
  transition: opacity .18s ease;
}
.dk-nav-hotspot:hover .dk-nav-line { opacity: .5; }
.dk-nav-row:hover .dk-nav-line { opacity: .85; }
.dk-nav-row.active .dk-nav-line {
  background: var(--dsw-alias-brand-primary);
  opacity: 1;
}
.dk-group-top {
  display: inline-flex; align-items: center; gap: 4px;
  position: absolute;
  right: 0;
  padding: 4px 6px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px; line-height: 1;
  cursor: pointer; pointer-events: auto;
}
.dk-group-top:hover { background: var(--dsw-alias-interactive-bg-hover-solid); color: var(--dsw-alias-label-primary); }
.dk-group-top svg { flex: none; }
.dk-group-top-text { flex: none; }
/* 操作栏行作为按钮的绝对定位上下文：按钮贴最右、与操作栏同排 */
[data-turn-tail] { position: relative; }
[data-turn-tail] [class*="_actions"] { width: 100%; }
.dk-question-float {
  position: fixed;
  z-index: 9997;
  width: 858px;
  max-width: 92vw;
  box-sizing: border-box;
  background: #f7f9fc;
  border: 1px solid #dbe4f0;
  border-radius: 0 0 6px 6px;
  padding: 10px 18px;
  box-shadow: var(--dsw-shadow-lv2);
  color: #1e3a6e;
  font-size: 16px; font-weight: 700; line-height: 1.5;
  pointer-events: none;
  word-break: break-word;
  white-space: normal;
  opacity: 0;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.dk-question-float.dark {
  background: var(--dsw-alias-bg-base);
  color: #ffffff;
}
.dk-question-text {
  flex: 1;
  min-width: 0;
  word-break: break-word;
}
.dk-question-toggle {
  flex: none;
  margin-top: 2px;
  font-size: 12px;
  font-weight: 600;
  color: #3b6fd4;
  cursor: pointer;
  pointer-events: auto;
  user-select: none;
  white-space: nowrap;
}
.dk-question-float.dark .dk-question-toggle { color: #7ea8ff; }
.dk-question-float.expanded {
  pointer-events: auto;
  max-height: 42vh;
  overflow-y: auto;
  scrollbar-width: thin;
}
/* 隐藏 DSH 自带的右侧「轮次导航」：它的悬停面板会同时列出提问和回答，
   与本插件的滚轮功能重复，只保留本插件的滚轮。 */
nav[aria-label="轮次导航"],
nav[aria-label="Turn navigation"],
nav:has(button[aria-label^="跳转到第"]),
nav:has(button[aria-label^="Jump to turn"]),
nav:has(button[aria-label^="Load and jump to turn"]),
nav[class*="eGxaPq_"] { display: none !important; }
`;
		const CSS_TAG = "dk-chat-nav/styles.css";
		if (typeof document !== "undefined") {
			// 始终复用同一个 style 标签并刷新内容：热更新后新样式能立刻生效
			let tag = document.querySelector("style[data-plugin-css=" + JSON.stringify(CSS_TAG) + "]");
			if (tag === null) {
				tag = document.createElement("style");
				tag.dataset.plugin = "dk-chat-nav";
				tag.dataset.pluginCss = CSS_TAG;
				document.head.appendChild(tag);
			}
			tag.textContent = CSS_TEXT;
		}

		// ── plugin body ─────────────────────────────────────────────────────────
		const registry = {
			messages: [],
			anchors: new Map(),
			running: false,
		};

		const extractText = (blocks) => {
			if (!blocks || !blocks.length) return '';
			const parts = [];
			for (const block of blocks) {
				if (!block) continue;
				// 兼容旧版 type:'text'（用户消息）与新版 kind:'text'（助手消息 blocks）
				if ((block.type === 'text' || block.kind === 'text') && typeof block.text === 'string') {
					parts.push(block.text);
				}
			}
			return parts.join(' ').replace(/\s+/g, ' ').trim();
		};

		// 对话节点的取数口：DSH 新版在 useChat().legacy.nodes，旧版在 useSession().nodes。
		// 两代都兼容，取到有内容的那一份。
		const pickNodes = (legacy, snapshot) => {
			if (legacy && Array.isArray(legacy.nodes) && legacy.nodes.length) return legacy.nodes;
			if (snapshot && Array.isArray(snapshot.nodes)) return snapshot.nodes;
			return [];
		};

		function TurnAnchor(props) {
			const snapshot = props.useSession((s) => s);
			const legacy = typeof props.useChat === 'function' ? props.useChat((s) => s.legacy) : null;
			const msgs = [];
			for (const n of pickNodes(legacy, snapshot)) {
				if (n && typeof n.seq === 'number') {
					msgs.push({ seq: n.seq, kind: n.kind, text: extractText(n.content) || extractText(n.blocks) });
				}
			}
			msgs.sort((a, b) => a.seq - b.seq);
			registry.messages = msgs;
			registry.running = !!(snapshot && snapshot.running);
			const anchor = React.createElement('span', {
				ref: (el) => {
					if (el) registry.anchors.set(props.seq, el);
					else registry.anchors.delete(props.seq);
				},
				'data-dk-seq': String(props.seq),
				style: { display: 'block', width: 0, height: 0 },
			});
			return anchor;
		}

		// 消息操作栏（复制/点赞那一行）里的"回到开头"按钮：
		// assistant-actions 只渲染在每组最后一条闭合回答上，天然=组末
		function GroupTopAction(props) {
			const snapshot = props.useSession((s) => s);
			const legacy = typeof props.useChat === 'function' ? props.useChat((s) => s.legacy) : null;
			const msgId = props.messageId;
			const [isGroupEnd, setIsGroupEnd] = React.useState(false);
			const [groupStartSeq, setGroupStartSeq] = React.useState(null);
			const [groupIndex, setGroupIndex] = React.useState(-1);
			const btnRef = React.useRef(null);

			// 按钮 absolute 定位：对齐到本组操作栏行的垂直位置（最右、同排）
			React.useEffect(() => {
				if (!isGroupEnd) return;
				const btn = btnRef.current;
				if (!btn) return;
				try {
					const tail = btn.closest('[data-turn-tail]');
					const actions = tail ? tail.querySelector('[class*="_actions"]') : null;
					if (tail && actions) {
						btn.style.top = (actions.offsetTop) + 'px';
					}
				} catch (e) { /* 忽略 */ }
			}, [isGroupEnd, groupStartSeq]);

			React.useEffect(() => {
				let seq = null;
				for (const n of pickNodes(legacy, snapshot)) {
					if (n && n.messageId === msgId && typeof n.seq === 'number') { seq = n.seq; break; }
				}
				if (seq === null) { setIsGroupEnd(false); return; }
				const groups = buildGroups(registry.messages);
				let found = false;
				for (let i = 0; i < groups.length; i++) {
					const g = groups[i];
					if (seq === g.endSeq) {
						setIsGroupEnd(true);
						setGroupStartSeq(g.startSeq);
						setGroupIndex(i);
						found = true;
						break;
					}
				}
				if (!found) setIsGroupEnd(false);
			}, [msgId, legacy, snapshot]);

			if (!isGroupEnd || groupStartSeq === null) return null;
			return React.createElement('button', {
				ref: btnRef,
				type: 'button',
				className: 'dk-group-top',
				title: '回到开头',
				onClick: () => {
					try {
						// 定位本组问题消息：取第 groupIndex 个 user 消息（DOM 顺序=消息顺序）
						let qEl = null;
						if (groupIndex >= 0) {
							const users = document.querySelectorAll('[data-chat-flow-kind="user"]');
							if (users[groupIndex]) qEl = users[groupIndex];
						}
						if (qEl) {
							// 回到本组问题：滚动到问题消息顶部
							qEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
						} else {
							// fallback：滚到问题前一条锚点（问题从顶显示）
							let target = null;
							let prevSeq = -Infinity;
							for (const [anchorSeq, el] of registry.anchors) {
								if (anchorSeq < groupStartSeq && anchorSeq > prevSeq) {
									prevSeq = anchorSeq;
									target = el;
								}
							}
							if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
						}
					} catch (e) { /* 忽略 */ }
				},
			},
				React.createElement('svg', {
					width: '14', height: '14', viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
				},
					React.createElement('path', { d: 'M8 13 L8 4' }),
					React.createElement('path', { d: 'M4 8 L8 4 L12 8' })
				),
				React.createElement('span', { className: 'dk-group-top-text' }, '回到开头')
			);
		}

		const buildGroups = (messages) => {
			const groups = [];
			let cur = null;
			for (const m of messages) {
				if (m.kind === 'user') {
					if (cur) groups.push(cur);
					const raw = m.text || '（提问）';
					const brief = raw.length > 20 ? raw.slice(0, 20) + '…' : raw;
					cur = { startSeq: m.seq, endSeq: m.seq, text: brief, fullText: raw };
				} else if (cur) {
					cur.endSeq = m.seq;
				}
			}
			if (cur) groups.push(cur);
			return groups;
		};

		function NavRail() {
			const ctx = DkCtx;
			const [, setTick] = React.useState(0);
			const [question, setQuestion] = React.useState(null);
			const [expanded, setExpanded] = React.useState(false);
			const [isDark, setIsDark] = React.useState(false);
			const rowEls = React.useRef(new Map());
			const textEls = React.useRef(new Map());
			const navEl = React.useRef(null);
			const qFloatEl = React.useRef(null);
			const groupsRef = React.useRef([]);
			const lastActiveRef = React.useRef(null);
			const snapTimerRef = React.useRef(null);
			const jumpLockRef = React.useRef(false);
			const jumpUnlockTimerRef = React.useRef(null);
			const questionRef = React.useRef(null);

			React.useEffect(() => {
				const theme = ctx.theme;
				const applyTheme = (snap) => {
					const scheme = snap && snap.active ? snap.active.colorScheme : 'light';
					setIsDark(scheme === 'dark');
				};
				if (theme && theme.getTheme) {
					applyTheme(theme.getTheme());
				}
				const off = ctx.on('theme/change', applyTheme);
				return off;
			}, []);

			const scrollNavTo = (startSeq) => {
				const nav = navEl.current;
				const row = rowEls.current.get(startSeq);
				if (!nav || !row) return;
				try {
					const target = row.offsetTop;
					nav.scrollTop = Math.max(0, Math.min(target, nav.scrollHeight - nav.clientHeight));
				} catch (e) { /* 忽略 */ }
			};

			const snapToRow = () => {
				const nav = navEl.current;
				if (!nav) return;
				try {
					let nearest = null;
					let min = Infinity;
					for (const el of rowEls.current.values()) {
						const d = Math.abs(el.offsetTop - nav.scrollTop);
						if (d < min) {
							min = d;
							nearest = el;
						}
					}
					if (nearest) {
						const target = nearest.offsetTop;
						nav.scrollTop = Math.max(0, Math.min(target, nav.scrollHeight - nav.clientHeight));
					}
				} catch (e) { /* 忽略 */ }
			};

			const refreshFades = () => {
				for (const el of textEls.current.values()) {
					if (!el) continue;
					try {
						const overflow = el.scrollWidth > el.clientWidth + 1;
						if (overflow) el.classList.add('dk-fade');
						else el.classList.remove('dk-fade');
					} catch (e) { /* 忽略 */ }
				}
			};

			const alignFloats = () => {
				try {
					const qf = qFloatEl.current;
					if (!qf) return;
					// 宽度对齐输入框卡片（data-composer-card），并左右各宽出一点
					const card = document.querySelector('[data-composer-card]');
					let placed = false;
					if (card) {
						const cr = card.getBoundingClientRect();
						if (cr.width > 0) {
							qf.style.width = (cr.width + 32) + 'px';
							qf.style.left = (cr.left + cr.width / 2) + 'px';
							qf.style.transform = 'translateX(-50%)';
							placed = true;
						}
					}
					if (!placed) {
						// 兜底：找不到输入框时，仍按"回到底部"按钮推算中心（CSS 里的 858px 宽度生效）
						const target = document.querySelector('[aria-label="回到底部"]');
						if (target) {
							const r = target.getBoundingClientRect();
							qf.style.left = (r.right - 374) + 'px';
							qf.style.transform = 'translateX(-50%)';
							placed = true;
						}
					}
					if (!placed) return;
					const header = document.querySelector('.wSkVaW_header');
					if (header) {
						qf.style.top = header.getBoundingClientRect().bottom + 'px';
					}
					qf.style.opacity = '1';
				} catch (e) { /* 忽略 */ }
			};

			React.useEffect(() => {
				if (question !== null) {
					alignFloats();
				}
			}, [question]);

			const refreshQuestion = () => {
				const groups = groupsRef.current;
				if (!groups.length) { setQuestion(null); return; }
				const lastGroup = groups[groups.length - 1];

				if (registry.running) {
					if (questionRef.current !== lastGroup.startSeq) {
						questionRef.current = lastGroup.startSeq;
						setQuestion(lastGroup.fullText || lastGroup.text);
					}
					return;
				}

				let prevSeq = -Infinity;
				let prevEl = null;
				for (const [seq, el] of registry.anchors) {
					if (seq < lastGroup.startSeq && seq > prevSeq) {
						prevSeq = seq;
						prevEl = el;
					}
				}
				if (prevEl) {
					let prevTop;
					try { prevTop = prevEl.getBoundingClientRect().top; } catch (e) { prevTop = 0; }
					if (prevTop < 0) {
						if (questionRef.current !== lastGroup.startSeq) {
							questionRef.current = lastGroup.startSeq;
							setQuestion(lastGroup.fullText || lastGroup.text);
						}
					} else {
						if (questionRef.current !== null) {
							questionRef.current = null;
							setQuestion(null);
						}
					}
				} else {
					if (questionRef.current !== null) {
						questionRef.current = null;
						setQuestion(null);
					}
				}
			};

			const onNavScroll = () => {
				if (snapTimerRef.current) snapTimerRef.current();
				snapTimerRef.current = ctx.timeout(snapToRow, 120);
			};

			React.useEffect(() => {
				const dispose = ctx.interval(() => {
					let activeSeq = null;
					let best = Infinity;
					for (const [seq, el] of registry.anchors) {
						let top = Infinity;
						try { top = el.getBoundingClientRect().top; } catch (e) { /* 忽略 */ }
						if (top >= 0 && top < best) {
							best = top;
							activeSeq = seq;
						}
					}
					let activeGroup = null;
					if (activeSeq !== null) {
						for (const g of groupsRef.current) {
							if (activeSeq >= g.startSeq && activeSeq <= g.endSeq) {
								activeGroup = g.startSeq;
								break;
							}
						}
					}
					if (activeGroup !== null && activeGroup !== lastActiveRef.current && !jumpLockRef.current) {
						lastActiveRef.current = activeGroup;
						scrollNavTo(activeGroup);
					}
					refreshFades();
					alignFloats();
					refreshQuestion();
					setTick((t) => t + 1);
				}, 400);
				return () => {
					dispose();
					if (snapTimerRef.current) snapTimerRef.current();
					if (jumpUnlockTimerRef.current) jumpUnlockTimerRef.current();
				};
			}, []);

			const messages = registry.messages;
			if (!messages.length) return null;
			const groups = buildGroups(messages);
			groupsRef.current = groups;

			let activeSeq = null;
			let best = Infinity;
			for (const [seq, el] of registry.anchors) {
				let top = Infinity;
				try { top = el.getBoundingClientRect().top; } catch (e) { /* 忽略 */ }
				if (top >= 0 && top < best) {
					best = top;
					activeSeq = seq;
				}
			}
			let activeGroup = null;
			for (const g of groups) {
				if (activeSeq !== null && activeSeq >= g.startSeq && activeSeq <= g.endSeq) {
					activeGroup = g.startSeq;
					break;
				}
			}

			const jumpTo = (startSeq, toAnswer) => {
				jumpLockRef.current = true;
				if (jumpUnlockTimerRef.current) jumpUnlockTimerRef.current();
				jumpUnlockTimerRef.current = ctx.timeout(() => {
					jumpLockRef.current = false;
					lastActiveRef.current = null;
				}, 1500);

				if (toAnswer) {
					// 跳到该组"回答开头"：滚到问题自身的尾部锚点，问题滚出视口，回答从顶开始
					const qAnchor = registry.anchors.get(startSeq);
					if (qAnchor) {
						try { qAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { /* 忽略 */ }
						return;
					}
				}

				let target = null;
				let bestAnchor = -Infinity;
				for (const [anchorSeq, el] of registry.anchors) {
					if (anchorSeq < startSeq && anchorSeq > bestAnchor) {
						bestAnchor = anchorSeq;
						target = el;
					}
				}
				if (target) {
					try { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { /* 忽略 */ }
				} else {
					const first = registry.anchors.size ? Math.min(...registry.anchors.keys()) : null;
					if (first !== null) {
						const el = registry.anchors.get(first);
						try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { /* 忽略 */ }
					}
				}
			};

			const rows = groups.map((g) => {
				const isActive = g.startSeq === activeGroup;
				return React.createElement('button', {
					key: g.startSeq,
					className: 'dk-nav-row' + (isActive ? ' active' : ''),
					ref: (el) => {
						if (el) rowEls.current.set(g.startSeq, el);
						else rowEls.current.delete(g.startSeq);
					},
					onClick: () => jumpTo(g.startSeq),
				},
					React.createElement('span', {
						className: 'dk-nav-text',
						ref: (el) => {
							if (el) textEls.current.set(g.startSeq, el);
							else textEls.current.delete(g.startSeq);
						},
					}, g.text),
					React.createElement('span', { className: 'dk-nav-line' })
				);
			});

			const questionEl = question === null ? null : (() => {
				const isLong = question.length > 140;
				const shown = isLong && !expanded ? question.slice(0, 140) + '…' : question;
				const toggle = isLong ? React.createElement('span', {
					className: 'dk-question-toggle',
					onClick: (e) => {
						e.stopPropagation();
						setExpanded(!expanded);
					},
				}, expanded ? '收起' : '展开全文') : null;
				return React.createElement('div', {
					ref: qFloatEl,
					className: 'dk-question-float' + (isDark ? ' dark' : '') + (expanded ? ' expanded' : ''),
				},
					React.createElement('span', { className: 'dk-question-text' }, shown),
					toggle
				);
			})();

			return React.createElement(React.Fragment, null,
				questionEl,
				React.createElement('div', { className: 'dk-nav-hotspot' },
					React.createElement('div', { className: 'dk-nav', ref: navEl, onScroll: onNavScroll }, ...rows)
				)
			);
		}

		exports.inject = ["slots", "timer", "theme"];
		exports.apply = function apply(ctx) {
			DkCtx = ctx;
			const slots = ctx.slots;
			if (slots === undefined) return;
			slots.inject('conversation.chat.turnTail', () => slots.register(
				{
					name: 'conversation.chat.turnTail',
					select: (owner) => ({ seq: owner.seq }),
				},
				(props) => React.createElement(TurnAnchor, {
					seq: props.matched.seq,
					useSession: props.useSession,
					useChat: props.useChat,
				})
			));
			slots.inject('conversation.chat.assistant-actions', () => slots.register(
				{
					name: 'conversation.chat.assistant-actions',
					id: 'dk-group-top',
					order: 100,
				},
				(props) => React.createElement(GroupTopAction, {
					messageId: props.messageId,
					useSession: props.useSession,
					useChat: props.useChat,
				})
			));
			slots.inject('shell.overlay', () => slots.register(
				{
					name: 'shell.overlay',
					id: 'dk-chat-nav',
				},
				NavRail
			));
		};
		return module.exports;
	}
});
