// DK 对话导航 —— DeepSeek Harness 动态插件（浏览器半）
// 功能：右侧滚轮（按组导航）+ 向上翻一组按钮 + 顶部问题悬浮窗（AI 回答中即显示）
// 用法：在 Harness 中用 cordis_define 的 code.client 加载本函数体，然后 cordis_run

return {
  inject: ['timer'],
  apply(ctx) {
    const slots = ctx.get('slots')
    if (slots === undefined) return

    styles.insert(`
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
      .dk-scroll-up {
        position: fixed;
        z-index: 9998;
        border: 1px solid var(--dsw-alias-border-l2);
        width: 34px; height: 34px;
        color: var(--dsw-alias-label-primary);
        background: var(--dsw-alias-button-floating-fill);
        box-shadow: var(--dsw-shadow-lv2);
        cursor: pointer; pointer-events: auto;
        border-radius: 100px;
        display: flex; justify-content: center; align-items: center;
        padding: 0;
      }
      .dk-scroll-up:hover { background: var(--dsw-alias-interactive-bg-hover-solid); }
      .dk-scroll-up svg { flex: none; }
      /* 悬浮窗：浅色浅底暗蓝字；深色深底白字 */
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
      }
      .dk-question-float.dark {
        background: var(--dsw-alias-bg-base);
        color: #ffffff;
      }
    `)

    const registry = {
      messages: [],
      anchors: new Map(),
      running: false,
    }

    const extractText = (content) => {
      if (!content || !content.length) return ''
      const parts = []
      for (const block of content) {
        if (block && block.type === 'text' && typeof block.text === 'string') {
          parts.push(block.text)
        }
      }
      return parts.join(' ').replace(/\s+/g, ' ').trim()
    }

    function TurnAnchor(props) {
      const snapshot = props.useSession((s) => s)
      const msgs = []
      if (snapshot) {
        for (const n of snapshot.nodes) {
          if (n && typeof n.seq === 'number') {
            msgs.push({ seq: n.seq, kind: n.kind, text: extractText(n.content) })
          }
        }
        msgs.sort((a, b) => a.seq - b.seq)
        registry.messages = msgs
        registry.running = !!snapshot.running
      }
      return React.createElement('span', {
        ref: (el) => {
          if (el) registry.anchors.set(props.seq, el)
          else registry.anchors.delete(props.seq)
        },
        'data-dk-seq': String(props.seq),
        style: { display: 'block', width: 0, height: 0 },
      })
    }

    const buildGroups = (messages) => {
      const groups = []
      let cur = null
      for (const m of messages) {
        if (m.kind === 'user') {
          if (cur) groups.push(cur)
          const raw = m.text || '（提问）'
          const brief = raw.length > 20 ? raw.slice(0, 20) + '…' : raw
          cur = { startSeq: m.seq, endSeq: m.seq, text: brief, fullText: raw }
        } else if (cur) {
          cur.endSeq = m.seq
        }
      }
      if (cur) groups.push(cur)
      return groups
    }

    const upIcon = React.createElement('svg', {
      width: '14', height: '14', viewBox: '0 0 14 14', fill: 'none', xmlns: 'http://www.w3.org/2000/svg',
    },
      React.createElement('path', {
        d: 'M2.15137 8.5L2.57617 8.07617L5.30273 5.34863C5.55843 5.09294 5.78438 4.86618 5.98828 4.70215C6.20088 4.53117 6.44405 4.38244 6.75 4.33398C6.91565 4.30778 7.08435 4.30778 7.25 4.33398C7.55595 4.38244 7.79912 4.53117 8.01172 4.70215C8.21561 4.86618 8.44157 5.09294 8.69727 5.34863L11.4238 8.07617L11.8486 8.5L11 9.34863L10.5762 8.92383L7.84863 6.19727C7.57405 5.92269 7.40124 5.75152 7.25977 5.6377C7.12709 5.53096 7.07728 5.52187 7.0625 5.51953C7.02105 5.51297 6.97895 5.51297 6.9375 5.51953C6.92272 5.52187 6.87291 5.53096 6.74023 5.6377C6.59876 5.75152 6.42595 5.92268 6.15137 6.19727L3.42383 8.92383L3 9.34863L2.15137 8.5Z',
        fill: 'currentColor',
      })
    )

    function NavRail() {
      const [, setTick] = React.useState(0)
      const [question, setQuestion] = React.useState(null)
      const [isDark, setIsDark] = React.useState(false)
      const rowEls = React.useRef(new Map())
      const textEls = React.useRef(new Map())
      const navEl = React.useRef(null)
      const upBtnEl = React.useRef(null)
      const qFloatEl = React.useRef(null)
      const groupsRef = React.useRef([])
      const lastActiveRef = React.useRef(null)
      const snapTimerRef = React.useRef(null)
      const jumpLockRef = React.useRef(false)
      const jumpUnlockTimerRef = React.useRef(null)
      const questionRef = React.useRef(null)

      React.useEffect(() => {
        const theme = ctx.get('theme')
        const applyTheme = (snap) => {
          const scheme = snap && snap.active ? snap.active.colorScheme : 'light'
          setIsDark(scheme === 'dark')
        }
        if (theme && theme.getTheme) {
          applyTheme(theme.getTheme())
        }
        const off = ctx.on('theme/change', applyTheme)
        return off
      }, [])

      const scrollNavTo = (startSeq) => {
        const nav = navEl.current
        const row = rowEls.current.get(startSeq)
        if (!nav || !row) return
        try {
          const target = row.offsetTop
          nav.scrollTop = Math.max(0, Math.min(target, nav.scrollHeight - nav.clientHeight))
        } catch (e) { /* 忽略 */ }
      }

      const snapToRow = () => {
        const nav = navEl.current
        if (!nav) return
        try {
          let nearest = null
          let min = Infinity
          for (const el of rowEls.current.values()) {
            const d = Math.abs(el.offsetTop - nav.scrollTop)
            if (d < min) {
              min = d
              nearest = el
            }
          }
          if (nearest) {
            const target = nearest.offsetTop
            nav.scrollTop = Math.max(0, Math.min(target, nav.scrollHeight - nav.clientHeight))
          }
        } catch (e) { /* 忽略 */ }
      }

      const refreshFades = () => {
        for (const el of textEls.current.values()) {
          if (!el) continue
          try {
            const overflow = el.scrollWidth > el.clientWidth + 1
            if (overflow) el.classList.add('dk-fade')
            else el.classList.remove('dk-fade')
          } catch (e) { /* 忽略 */ }
        }
      }

      const alignFloats = () => {
        try {
          const qf = qFloatEl.current
          const btn = upBtnEl.current
          const target = document.querySelector('[aria-label="回到底部"]')
          const vw = window.innerWidth || document.documentElement.clientWidth
          const vh = window.innerHeight || document.documentElement.clientHeight
          if (!target) return
          const r = target.getBoundingClientRect()
          if (btn) {
            btn.style.right = (vw - r.right) + 'px'
            btn.style.bottom = (vh - r.top + 42) + 'px'
          }
          if (qf) {
            const center = r.right - 374
            qf.style.left = center + 'px'
            qf.style.transform = 'translateX(-50%)'
            qf.style.opacity = '1'
            const header = document.querySelector('.wSkVaW_header')
            if (header) {
              const hb = header.getBoundingClientRect().bottom
              qf.style.top = hb + 'px'
            }
          }
        } catch (e) { /* 忽略 */ }
      }

      React.useEffect(() => {
        if (question !== null) {
          alignFloats()
        }
      }, [question])

      const refreshQuestion = () => {
        const groups = groupsRef.current
        if (!groups.length) { setQuestion(null); return }
        const lastGroup = groups[groups.length - 1]

        // AI 回答中：立即显示最后一个问题
        if (registry.running) {
          if (questionRef.current !== lastGroup.startSeq) {
            questionRef.current = lastGroup.startSeq
            setQuestion(lastGroup.fullText || lastGroup.text)
          }
          return
        }

        // 非回答中：按"问题滚出视口"显示
        let prevSeq = -Infinity
        let prevEl = null
        for (const [seq, el] of registry.anchors) {
          if (seq < lastGroup.startSeq && seq > prevSeq) {
            prevSeq = seq
            prevEl = el
          }
        }
        if (prevEl) {
          let prevTop
          try { prevTop = prevEl.getBoundingClientRect().top } catch (e) { prevTop = 0 }
          if (prevTop < 0) {
            if (questionRef.current !== lastGroup.startSeq) {
              questionRef.current = lastGroup.startSeq
              setQuestion(lastGroup.fullText || lastGroup.text)
            }
          } else {
            if (questionRef.current !== null) {
              questionRef.current = null
              setQuestion(null)
            }
          }
        } else {
          if (questionRef.current !== null) {
            questionRef.current = null
            setQuestion(null)
          }
        }
      }

      const onNavScroll = () => {
        if (snapTimerRef.current) snapTimerRef.current()
        snapTimerRef.current = ctx.timeout(snapToRow, 120)
      }

      React.useEffect(() => {
        const dispose = ctx.interval(() => {
          let activeSeq = null
          let best = Infinity
          for (const [seq, el] of registry.anchors) {
            let top = Infinity
            try { top = el.getBoundingClientRect().top } catch (e) { /* 忽略 */ }
            if (top >= 0 && top < best) {
              best = top
              activeSeq = seq
            }
          }
          let activeGroup = null
          if (activeSeq !== null) {
            for (const g of groupsRef.current) {
              if (activeSeq >= g.startSeq && activeSeq <= g.endSeq) {
                activeGroup = g.startSeq
                break
              }
            }
          }
          if (activeGroup !== null && activeGroup !== lastActiveRef.current && !jumpLockRef.current) {
            lastActiveRef.current = activeGroup
            scrollNavTo(activeGroup)
          }
          refreshFades()
          alignFloats()
          refreshQuestion()
          setTick((t) => t + 1)
        }, 400)
        return () => {
          dispose()
          if (snapTimerRef.current) snapTimerRef.current()
          if (jumpUnlockTimerRef.current) jumpUnlockTimerRef.current()
        }
      }, [])

      const messages = registry.messages
      if (!messages.length) return null
      const groups = buildGroups(messages)
      groupsRef.current = groups

      let activeSeq = null
      let best = Infinity
      for (const [seq, el] of registry.anchors) {
        let top = Infinity
        try { top = el.getBoundingClientRect().top } catch (e) { /* 忽略 */ }
        if (top >= 0 && top < best) {
          best = top
          activeSeq = seq
        }
      }
      let activeGroup = null
      for (const g of groups) {
        if (activeSeq !== null && activeSeq >= g.startSeq && activeSeq <= g.endSeq) {
          activeGroup = g.startSeq
          break
        }
      }

      const jumpTo = (startSeq) => {
        jumpLockRef.current = true
        if (jumpUnlockTimerRef.current) jumpUnlockTimerRef.current()
        jumpUnlockTimerRef.current = ctx.timeout(() => {
          jumpLockRef.current = false
          lastActiveRef.current = null
        }, 1500)

        let target = null
        let bestAnchor = -Infinity
        for (const [anchorSeq, el] of registry.anchors) {
          if (anchorSeq < startSeq && anchorSeq > bestAnchor) {
            bestAnchor = anchorSeq
            target = el
          }
        }
        if (target) {
          try { target.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch (e) { /* 忽略 */ }
        } else {
          const first = registry.anchors.size ? Math.min(...registry.anchors.keys()) : null
          if (first !== null) {
            const el = registry.anchors.get(first)
            try { el.scrollIntoView({ behavior: 'smooth', block: 'end' }) } catch (e) { /* 忽略 */ }
          }
        }
      }

      const scrollUpOne = () => {
        if (!groups.length) return
        const lastGroup = groups[groups.length - 1]
        if (activeGroup === lastGroup.startSeq) {
          jumpTo(lastGroup.startSeq)
        } else {
          const idx = groups.findIndex((g) => g.startSeq === activeGroup)
          const target = idx > 0 ? groups[idx - 1] : groups[0]
          jumpTo(target.startSeq)
        }
      }

      const rows = groups.map((g) => {
        const isActive = g.startSeq === activeGroup
        return React.createElement('button', {
          key: g.startSeq,
          className: 'dk-nav-row' + (isActive ? ' active' : ''),
          ref: (el) => {
            if (el) rowEls.current.set(g.startSeq, el)
            else rowEls.current.delete(g.startSeq)
          },
          onClick: () => jumpTo(g.startSeq),
        },
          React.createElement('span', {
            className: 'dk-nav-text',
            ref: (el) => {
              if (el) textEls.current.set(g.startSeq, el)
              else textEls.current.delete(g.startSeq)
            },
          }, g.text),
          React.createElement('span', { className: 'dk-nav-line' })
        )
      })

      const questionEl = question === null ? null : React.createElement('div', {
        ref: qFloatEl,
        className: 'dk-question-float' + (isDark ? ' dark' : ''),
      }, question)

      return React.createElement(React.Fragment, null,
        questionEl,
        React.createElement('div', { className: 'dk-nav-hotspot' },
          React.createElement('div', { className: 'dk-nav', ref: navEl, onScroll: onNavScroll }, ...rows)
        ),
        React.createElement('button', {
          type: 'button',
          ref: upBtnEl,
          className: 'dk-scroll-up',
          title: '向上翻一组',
          onClick: scrollUpOne,
        }, upIcon)
      )
    }

    slots.inject('conversation.chat.turnTail', () => slots.register(
      {
        name: 'conversation.chat.turnTail',
        select: (owner) => ({ seq: owner.seq }),
      },
      (props) => React.createElement(TurnAnchor, {
        seq: props.matched.seq,
        useSession: props.useSession,
      })
    ))

    slots.inject('shell.overlay', () => slots.register(
      {
        name: 'shell.overlay',
        id: 'dk-chat-nav',
      },
      () => React.createElement(NavRail)
    ))
  },
}
