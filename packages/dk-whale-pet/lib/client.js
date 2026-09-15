window.__ModuleLoader__.load({
	id: "dk-whale-pet",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		let React = require("react");

		let DkCtx;
		// ── styles (data-plugin-css tag, idempotent) ────────────────────────────
		const CSS_TEXT = `
.dk-whale-float {
  position: fixed;
  left: 60%; top: 40%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  pointer-events: none;
}
.dk-whale-drag-layer {
  position: fixed; inset: 0;
  z-index: 10000;
}
.dk-whale-btn {
  display: block; border: none; background: transparent; padding: 0;
  cursor: grab; pointer-events: auto;
  animation: dk-bob 4s ease-in-out infinite;
  filter: drop-shadow(0 10px 16px rgba(15,30,60,.30));
}
.dk-whale-btn:active { cursor: grabbing; }
.dk-whale-btn:hover { animation: dk-bob 1.6s ease-in-out infinite; }
.dk-whale-flip { display: block; }
.dk-whale-flip svg { width: 180px; height: auto; display: block; }
.dk-whale-btn.baby .dk-whale-flip svg { width: 90px; }
.dk-whale-tail {
  transform-box: fill-box;
  transform-origin: 0% 48%;
  animation: dk-tail 2.6s ease-in-out infinite;
}
.dk-whale-dorsal {
  transform-box: fill-box;
  transform-origin: 50% 100%;
  animation: dk-dorsal 2.8s ease-in-out infinite;
}
.dk-whale-flipper {
  transform-box: fill-box;
  transform-origin: 50% 0%;
  animation: dk-flipper 3s ease-in-out infinite;
}
.dk-whale-btn:hover .dk-whale-tail { animation: dk-tail 1s ease-in-out infinite; }
.dk-whale-btn:hover .dk-whale-dorsal { animation: dk-dorsal 1.2s ease-in-out infinite; }
.dk-whale-btn:hover .dk-whale-flipper { animation: dk-flipper 1.2s ease-in-out infinite; }
.dk-whale-tip {
  position: absolute; bottom: calc(100% + 14px); left: 50%;
  transform: translateX(-50%) translateY(4px);
  background: var(--dsw-alias-bg-overlay); color: var(--dsw-alias-label-primary); font-size: 14px; line-height: 1.5;
  padding: 6px 13px; border-radius: 14px; white-space: nowrap;
  box-shadow: 0 6px 18px rgba(0,0,0,.28); opacity: 0;
  pointer-events: none; transition: opacity .2s ease, transform .2s ease;
  border: 1px solid var(--dsw-alias-border-l1);
}
.dk-whale-tip.show { opacity: 1; transform: translateX(-50%) translateY(0); }
@keyframes dk-bob {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes dk-tail {
  0%,100% { transform: rotate(-9deg); }
  50% { transform: rotate(9deg); }
}
@keyframes dk-dorsal {
  0%,100% { transform: rotate(-4deg); }
  50% { transform: rotate(5deg); }
}
@keyframes dk-flipper {
  0%,100% { transform: rotate(-5deg); }
  50% { transform: rotate(6deg); }
}
`;
		const CSS_TAG = "dk-whale-pet/styles.css";
		if (typeof document !== "undefined") {
			// 始终复用同一个 style 标签并刷新内容：热更新后新样式能立刻生效
			let tag = document.querySelector("style[data-plugin-css=" + JSON.stringify(CSS_TAG) + "]");
			if (tag === null) {
				tag = document.createElement("style");
				tag.dataset.plugin = "dk-whale-pet";
				tag.dataset.pluginCss = CSS_TAG;
				document.head.appendChild(tag);
			}
			tag.textContent = CSS_TEXT;
		}

		// ── plugin body ─────────────────────────────────────────────────────────
		const momPhrases = ['咕噜～', 'DK 在呢！', '加油哦！', '有事找我呀？'];
		const babyPhrases = ['咕噜咕噜～', '妈妈妈妈！', '我要游游！', '嘿嘿～'];
		// 定时对话池：每对是 [妈妈台词, 宝宝回话]，轮换使用、各不相同
		const momBabyChats = [
			['宝贝，今天想去哪里玩呀？', '妈妈妈妈！去深海看亮晶晶的鱼！'],
			['好呀，跟紧妈妈哦。', '嗯嗯！我会紧紧跟着！'],
			['宝宝饿了吗？', '有一点～想吃小鱼虾！'],
			['来，妈妈教你喷水花。', '哇！咕噜咕噜～我也会了！'],
			['宝宝游累了吗？', '嘿嘿，有妈妈在就不累！'],
			['那边有好多小伙伴，去打个招呼吧。', '好呀好呀！我要交新朋友！'],
			['宝宝真乖，妈妈喜欢你。', '我也最喜欢妈妈啦！'],
			['天黑啦，该回家咯。', '好～明天再出来玩！'],
		];
		// 用户叫"鲸鱼妈妈"时妈妈的回应池（各不相同，轮换）
		const momReplyPhrases = [
			'咕噜～我在呢，找我什么事呀？',
			'来啦来啦，妈妈在这儿！',
			'嗯？宝贝叫我？我听着呢～',
			'咕噜咕噜～我一直都在哦！',
			'怎么啦？妈妈在这里呢！',
			'诶～听到啦！有什么想聊的吗？',
		];
		let momReplyIdx = 0;
		let pendingReply = null;
		let lastSeenUserSeq = -1;

		const buildWhale = () => React.createElement('svg',
			{ viewBox: '0 0 360 170', xmlns: 'http://www.w3.org/2000/svg' },
			React.createElement('defs', null,
				React.createElement('linearGradient', { id: 'dkbG', x1: '0', y1: '0', x2: '0', y2: '1' },
					React.createElement('stop', { offset: '0%', 'stop-color': '#22365e' }),
					React.createElement('stop', { offset: '50%', 'stop-color': '#41639c' }),
					React.createElement('stop', { offset: '100%', 'stop-color': '#7ba3d6' })
				)
			),
			React.createElement('path', { d: 'M24 98 Q18 76 34 64 Q52 54 76 52 Q106 50 136 50 Q166 49 196 52 Q204 55 212 60 Q244 62 270 65 Q294 67 308 70 L308 74 Q296 74 282 74 Q258 78 232 82 Q202 88 172 92 Q142 97 112 101 Q82 105 54 104 Q34 102 24 98 Z', fill: 'url(#dkbG)', stroke: '#16243f', 'stroke-width': '1.2' }),
			React.createElement('path', { className: 'dk-whale-dorsal', d: 'M206 54 Q222 38 230 42 Q238 56 226 63 Q216 62 206 54 Z', fill: 'url(#dkbG)', stroke: '#16243f', 'stroke-width': '1.2' }),
			React.createElement('path', { d: 'M26 96 Q42 104 66 106 Q96 108 126 103 Q156 97 186 92 Q216 86 244 81 Q270 77 292 73 Q280 70 254 74 Q226 79 196 85 Q164 92 132 98 Q100 104 70 104 Q44 103 28 97 Z', fill: '#e9f1fb', opacity: '.92' }),
			React.createElement('path', { className: 'dk-whale-tail', d: 'M306 72 Q322 56 336 42 Q330 62 318 72 Q330 86 344 104 Q326 94 310 80 Q304 78 306 72 Z', fill: 'url(#dkbG)', stroke: '#16243f', 'stroke-width': '1.2' }),
			React.createElement('g', { className: 'dk-whale-flipper' },
				React.createElement('path', { d: 'M112 98 Q100 116 92 138 Q108 144 124 134 Q134 118 134 100 Q124 102 112 98 Z', fill: 'url(#dkbG)', stroke: '#16243f', 'stroke-width': '1.2' }),
				React.createElement('circle', { cx: '100', cy: '122', r: '2', fill: '#22365e' }),
				React.createElement('circle', { cx: '96', cy: '130', r: '2', fill: '#22365e' }),
				React.createElement('circle', { cx: '94', cy: '136', r: '2', fill: '#22365e' })
			),
			React.createElement('circle', { cx: '52', cy: '56', r: '2.6', fill: '#1f3257' }),
			React.createElement('circle', { cx: '66', cy: '53', r: '2.2', fill: '#1f3257' }),
			React.createElement('circle', { cx: '80', cy: '52', r: '2.2', fill: '#1f3257' }),
			React.createElement('circle', { cx: '46', cy: '100', r: '2', fill: '#1f3257' }),
			React.createElement('circle', { cx: '66', cy: '82', r: '2.6', fill: '#0c1730' }),
			React.createElement('circle', { cx: '67', cy: '81', r: '0.9', fill: '#fff', opacity: '.8' }),
			React.createElement('path', { d: 'M24 98 Q36 104 58 105', stroke: '#1c2c4e', 'stroke-width': '1.2', fill: 'none', 'stroke-linecap': 'round' })
		);

		// 提取消息文本（content 是 content block 数组，新旧两代都兼容）
		const extractText = (content) => {
			if (!content || !content.length) return '';
			const parts = [];
			for (const block of content) {
				if (block && (block.type === 'text' || block.kind === 'text') && typeof block.text === 'string') {
					parts.push(block.text);
				}
			}
			return parts.join(' ').replace(/\s+/g, ' ').trim();
		};

		// 对话节点的取数口：DSH 新版在 useChat().legacy.nodes，旧版在 useSession().nodes。
		const pickNodes = (legacy, snapshot) => {
			if (legacy && Array.isArray(legacy.nodes) && legacy.nodes.length) return legacy.nodes;
			if (snapshot && Array.isArray(snapshot.nodes)) return snapshot.nodes;
			return [];
		};

		// 消息监视器：监听对话里的新消息，检测触发词"鲸鱼妈妈"，设置妈妈的回应
		function ChatWatcher(props) {
			const snapshot = props.useSession((s) => s);
			const legacy = typeof props.useChat === 'function' ? props.useChat((s) => s.legacy) : null;
			React.useEffect(() => {
				let latestUser = null;
				let maxSeq = -1;
				for (const n of pickNodes(legacy, snapshot)) {
					if (n && n.kind === 'user' && typeof n.seq === 'number' && n.seq > maxSeq) {
						maxSeq = n.seq;
						latestUser = n;
					}
				}
				if (latestUser === null) return;
				if (latestUser.seq === lastSeenUserSeq) return;
				lastSeenUserSeq = latestUser.seq;
				// 提取文本
				const txt = extractText(latestUser.content) || extractText(latestUser.blocks);
				if (txt.indexOf('鲸鱼妈妈') !== -1) {
					pendingReply = momReplyPhrases[momReplyIdx % momReplyPhrases.length];
					momReplyIdx += 1;
				}
			}, [legacy, snapshot]);
			return null;
		}

		function WhaleFamily() {
			const ctx = DkCtx;
			const [pos, setPos] = React.useState({ x: 60, y: 40 });
			const [dir, setDir] = React.useState(1);
			const [dragging, setDragging] = React.useState(false);
			const [momTip, setMomTip] = React.useState(null);
			const [babyTip, setBabyTip] = React.useState(null);
			const posRef = React.useRef({ x: 60, y: 40 });
			const hoverRef = React.useRef(false);
			const tipShownRef = React.useRef(false);
			const hideMomTipRef = React.useRef(null);
			const hideBabyTipRef = React.useRef(null);
			const momIdxRef = React.useRef(0);
			const babyIdxRef = React.useRef(0);
			const chatIdxRef = React.useRef(0);
			const chatBusyRef = React.useRef(false);
			const chatTimersRef = React.useRef([]);
			const dragRef = React.useRef(null);
			const draggingRef = React.useRef(false);
			const suppressClickRef = React.useRef(false);
			const layerRef = React.useRef(null);

			const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
			// 游走：约 80% 时间贴在左右两侧（对话区外），偶尔才进中间晃一下
			// 关键点：认准一侧游，不直接横穿；换边只在"回到两侧"时发生
			const edgeRef = React.useRef(true);
			const sideRef = React.useRef(Math.random() < 0.5 ? 'L' : 'R');
			React.useEffect(() => {
				const dispose = ctx.interval(() => {
					if (hoverRef.current || tipShownRef.current || draggingRef.current) return;
					const cur = posRef.current;
					let nx;
					let ny;
					const roll = Math.random();
					if (edgeRef.current) {
						if (roll < 0.82) {
							// 留在本侧边缘小幅漂移（不换边，避免横穿对话区）
							nx = sideRef.current === 'L'
								? clamp(cur.x + (Math.random() - 0.5) * 14, 3, 16)
								: clamp(cur.x + (Math.random() - 0.5) * 14, 84, 97);
						} else {
							// 偶尔进对话区
							edgeRef.current = false;
							nx = 30 + Math.random() * 40;
						}
					} else {
						if (roll < 0.15) {
							// 在对话区短暂逗留
							nx = clamp(cur.x + (Math.random() - 0.5) * 22, 26, 74);
						} else {
							// 尽快回到两侧（回去时可能换到对面那侧）
							edgeRef.current = true;
							if (Math.random() < 0.45) sideRef.current = sideRef.current === 'L' ? 'R' : 'L';
							nx = sideRef.current === 'L' ? 3 + Math.random() * 13 : 84 + Math.random() * 13;
						}
					}
					// 纵向整体靠上或靠下，避开中央太多
					ny = Math.random() < 0.7
						? clamp(cur.y + (Math.random() - 0.5) * 20, 8, 40)
						: clamp(cur.y + (Math.random() - 0.5) * 20, 55, 88);
					setDir(nx >= cur.x ? 1 : -1);
					posRef.current = { x: nx, y: ny };
					setPos({ x: nx, y: ny });
				}, 16000);
				return dispose;
			}, []);

			React.useEffect(() => () => {
				if (hideMomTipRef.current) hideMomTipRef.current();
				if (hideBabyTipRef.current) hideBabyTipRef.current();
			}, []);

			// 轮询用户的"鲸鱼妈妈"呼叫，妈妈回应
			React.useEffect(() => {
				const dispose = ctx.interval(() => {
					if (pendingReply === null) return;
					if (draggingRef.current || chatBusyRef.current) return;
					const reply = pendingReply;
					pendingReply = null;
					tipShownRef.current = true;
					if (hideMomTipRef.current) hideMomTipRef.current();
					setMomTip(reply);
					hideMomTipRef.current = ctx.timeout(() => {
						tipShownRef.current = false;
						setMomTip(null);
					}, 3000);
				}, 700);
				return dispose;
			}, []);

			const showTip = (isBaby) => {
				tipShownRef.current = true;
				const phrases = isBaby ? babyPhrases : momPhrases;
				const setTip = isBaby ? setBabyTip : setMomTip;
				const hideRef = isBaby ? hideBabyTipRef : hideMomTipRef;
				const idxRef = isBaby ? babyIdxRef : momIdxRef;
				setTip(phrases[idxRef.current % phrases.length]);
				idxRef.current += 1;
				if (hideRef.current) hideRef.current();
				hideRef.current = ctx.timeout(() => {
					tipShownRef.current = false;
					setTip(null);
				}, 1800);
			};

			// 妈妈和宝宝定时对话：妈妈先说，宝宝回话，内容各不相同
			const startChat = () => {
				if (chatBusyRef.current || draggingRef.current || hoverRef.current || tipShownRef.current) return;
				chatBusyRef.current = true;
				const pair = momBabyChats[chatIdxRef.current % momBabyChats.length];
				chatIdxRef.current += 1;
				// 妈妈先说
				tipShownRef.current = true;
				if (hideMomTipRef.current) hideMomTipRef.current();
				setMomTip(pair[0]);
				hideMomTipRef.current = ctx.timeout(() => {
					setMomTip(null);
					tipShownRef.current = false;
				}, 2600);
				// 1.4 秒后宝宝回话
				const t1 = ctx.timeout(() => {
					if (hideBabyTipRef.current) hideBabyTipRef.current();
					setBabyTip(pair[1]);
					hideBabyTipRef.current = ctx.timeout(() => {
						setBabyTip(null);
						chatBusyRef.current = false;
					}, 2600);
				}, 1400);
				chatTimersRef.current.push(t1);
			};

			// 定时触发对话（每 40 秒一次），挂在组件生命周期上
			React.useEffect(() => {
				const dispose = ctx.interval(() => {
					startChat();
				}, 40000);
				return () => {
					dispose();
					for (const t of chatTimersRef.current) t();
					chatTimersRef.current = [];
					if (hideMomTipRef.current) hideMomTipRef.current();
					if (hideBabyTipRef.current) hideBabyTipRef.current();
				};
			}, []);

			const onMomMouseDown = (e) => {
				e.preventDefault();
				suppressClickRef.current = false;
				draggingRef.current = true;
				setDragging(true);
				dragRef.current = {
					startX: e.clientX,
					startY: e.clientY,
					origX: posRef.current.x,
					origY: posRef.current.y,
					moved: false,
				};
			};

			const onLayerMouseMove = (e) => {
				const drag = dragRef.current;
				const layer = layerRef.current;
				if (!drag || !layer) return;
				const dx = e.clientX - drag.startX;
				const dy = e.clientY - drag.startY;
				if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true;
				const nx = Math.min(94, Math.max(4, drag.origX + dx / layer.clientWidth * 100));
				const ny = Math.min(90, Math.max(6, drag.origY + dy / layer.clientHeight * 100));
				posRef.current = { x: nx, y: ny };
				setPos({ x: nx, y: ny });
			};

			const endDrag = () => {
				draggingRef.current = false;
				setDragging(false);
				dragRef.current = null;
			};

			const onLayerMouseUp = () => {
				if (dragRef.current && dragRef.current.moved) suppressClickRef.current = true;
				endDrag();
			};

			const onMomClick = () => {
				if (suppressClickRef.current) return;
				showTip(false);
			};

			const babyX = pos.x - dir * 14;
			const babyY = pos.y + 4;

			const glide = 'left 13s cubic-bezier(.45,.05,.35,1), top 13s cubic-bezier(.45,.05,.35,1)';
			const momTransition = dragging ? 'none' : glide;
			const babyTransition = dragging
				? 'left .5s ease-in-out, top .5s ease-in-out'
				: glide;

			const momTipEl = momTip === null ? null : React.createElement('span', { className: 'dk-whale-tip show' }, momTip);
			const babyTipEl = babyTip === null ? null : React.createElement('span', { className: 'dk-whale-tip show' }, babyTip);

			return React.createElement(React.Fragment, null,
				React.createElement('div', {
					ref: layerRef,
					className: 'dk-whale-drag-layer',
					style: { pointerEvents: dragging ? 'auto' : 'none' },
					onMouseMove: onLayerMouseMove,
					onMouseUp: onLayerMouseUp,
					onMouseLeave: onLayerMouseUp,
				}),
				React.createElement('div', {
					className: 'dk-whale-float',
					style: { left: pos.x + '%', top: pos.y + '%', transition: momTransition },
				},
					momTipEl,
					React.createElement('button', {
						className: 'dk-whale-btn',
						title: 'DK 鲸鱼妈妈',
						onMouseDown: onMomMouseDown,
						onMouseEnter: () => { hoverRef.current = true; },
						onMouseLeave: () => { hoverRef.current = false; },
						onClick: onMomClick,
					},
						React.createElement('span', { className: 'dk-whale-flip', style: { transform: 'scaleX(' + dir + ')' } }, buildWhale())
					)
				),
				React.createElement('div', {
					className: 'dk-whale-float',
					style: { left: babyX + '%', top: babyY + '%', transition: babyTransition },
				},
					babyTipEl,
					React.createElement('button', {
						className: 'dk-whale-btn baby',
						title: 'DK 小鲸鱼',
						onMouseEnter: () => { hoverRef.current = true; },
						onMouseLeave: () => { hoverRef.current = false; },
						onClick: () => showTip(true),
					},
						React.createElement('span', { className: 'dk-whale-flip', style: { transform: 'scaleX(' + dir + ')' } }, buildWhale())
					)
				)
			);
		}

		exports.inject = ["slots", "timer"];
		exports.apply = function apply(ctx) {
			DkCtx = ctx;
			const slots = ctx.slots;
			if (slots === undefined) return;
			slots.inject("shell.overlay", () => slots.register(
				{
					name: "shell.overlay",
					id: "dk-whale-pet",
				},
				WhaleFamily
			));
			// 消息监视器：挂在 assistant-actions（list 类型，与其他 occupant 共存，渲染为空）
			slots.inject('conversation.chat.assistant-actions', () => slots.register(
				{
					name: 'conversation.chat.assistant-actions',
					id: 'dk-whale-chat-watcher',
					order: 1000,
				},
				(props) => React.createElement(ChatWatcher, {
					useSession: props.useSession,
					useChat: props.useChat,
				})
			));
		};
		return module.exports;
	}
});
