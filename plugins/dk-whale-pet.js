// DK 鲸鱼宠物 —— DeepSeek Harness 动态插件（浏览器半）
// 座头鲸妈妈 + 宝宝，全界面慢速漫游、可拖拽、点击对话
// 用法：在 Harness 中用 cordis_define 的 code.client 加载本函数体，然后 cordis_run

return {
  inject: ['timer'],
  apply(ctx) {
    // 取 slots 服务（界面席位注册表）；不存在就静默退出
    const slots = ctx.get('slots')
    if (slots === undefined) return

    // 动画样式（随插件停止自动清理）
    styles.insert(`
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
      /* 尾鳍/背鳍/胸鳍摇动 */
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
    `)

    const momPhrases = ['咕噜～', 'DK 在呢！', '加油哦！', '有事找我呀？']
    const babyPhrases = ['咕噜咕噜～', '妈妈妈妈！', '我要游游！', '嘿嘿～']

    // 座头鲸 SVG：无腹褶线条，其余特征保留
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
    )

    // 鲸鱼一家组件：妈妈慢速漫游+可拖拽，宝宝同步紧跟
    function WhaleFamily() {
      const [pos, setPos] = React.useState({ x: 60, y: 40 })
      const [dir, setDir] = React.useState(1)
      const [dragging, setDragging] = React.useState(false)
      const [momTip, setMomTip] = React.useState(null)
      const [babyTip, setBabyTip] = React.useState(null)
      const posRef = React.useRef({ x: 60, y: 40 })
      const hoverRef = React.useRef(false)
      const tipShownRef = React.useRef(false)
      const hideMomTipRef = React.useRef(null)
      const hideBabyTipRef = React.useRef(null)
      const momIdxRef = React.useRef(0)
      const babyIdxRef = React.useRef(0)
      const dragRef = React.useRef(null)
      const draggingRef = React.useRef(false)
      const suppressClickRef = React.useRef(false)
      const layerRef = React.useRef(null)

      // 慢悠悠漂移：每 16 秒在附近挪一小段，游 13 秒
      const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
      React.useEffect(() => {
        const dispose = ctx.interval(() => {
          if (hoverRef.current || tipShownRef.current || draggingRef.current) return
          const cur = posRef.current
          const nx = clamp(cur.x + (Math.random() - 0.5) * 30, 6, 94)
          const ny = clamp(cur.y + (Math.random() - 0.5) * 20, 8, 88)
          setDir(nx >= cur.x ? 1 : -1)
          posRef.current = { x: nx, y: ny }
          setPos({ x: nx, y: ny })
        }, 16000)
        return dispose
      }, [])

      // 卸载时清理未消失的气泡定时器
      React.useEffect(() => () => {
        if (hideMomTipRef.current) hideMomTipRef.current()
        if (hideBabyTipRef.current) hideBabyTipRef.current()
      }, [])

      const showTip = (isBaby) => {
        tipShownRef.current = true
        const phrases = isBaby ? babyPhrases : momPhrases
        const setTip = isBaby ? setBabyTip : setMomTip
        const hideRef = isBaby ? hideBabyTipRef : hideMomTipRef
        const idxRef = isBaby ? babyIdxRef : momIdxRef
        setTip(phrases[idxRef.current % phrases.length])
        idxRef.current += 1
        if (hideRef.current) hideRef.current()
        hideRef.current = ctx.timeout(() => {
          tipShownRef.current = false
          setTip(null)
        }, 1800)
      }

      const onMomMouseDown = (e) => {
        e.preventDefault()
        suppressClickRef.current = false
        draggingRef.current = true
        setDragging(true)
        dragRef.current = {
          startX: e.clientX,
          startY: e.clientY,
          origX: posRef.current.x,
          origY: posRef.current.y,
          moved: false,
        }
      }

      const onLayerMouseMove = (e) => {
        const drag = dragRef.current
        const layer = layerRef.current
        if (!drag || !layer) return
        const dx = e.clientX - drag.startX
        const dy = e.clientY - drag.startY
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true
        const nx = Math.min(94, Math.max(4, drag.origX + dx / layer.clientWidth * 100))
        const ny = Math.min(90, Math.max(6, drag.origY + dy / layer.clientHeight * 100))
        posRef.current = { x: nx, y: ny }
        setPos({ x: nx, y: ny })
      }

      const endDrag = () => {
        draggingRef.current = false
        setDragging(false)
        dragRef.current = null
      }

      const onLayerMouseUp = () => {
        if (dragRef.current && dragRef.current.moved) suppressClickRef.current = true
        endDrag()
      }

      const onMomClick = () => {
        if (suppressClickRef.current) return
        showTip(false)
      }

      // 宝宝跟在妈妈身后
      const babyX = pos.x - dir * 14
      const babyY = pos.y + 4

      // 妈妈和宝宝同速同步滑动
      const glide = 'left 13s cubic-bezier(.45,.05,.35,1), top 13s cubic-bezier(.45,.05,.35,1)'
      const momTransition = dragging ? 'none' : glide
      const babyTransition = dragging
        ? 'left .5s ease-in-out, top .5s ease-in-out'
        : glide

      const momTipEl = momTip === null ? null : React.createElement('span', { className: 'dk-whale-tip show' }, momTip)
      const babyTipEl = babyTip === null ? null : React.createElement('span', { className: 'dk-whale-tip show' }, babyTip)

      return React.createElement(React.Fragment, null,
        // 拖拽用全屏透明层
        React.createElement('div', {
          ref: layerRef,
          className: 'dk-whale-drag-layer',
          style: { pointerEvents: dragging ? 'auto' : 'none' },
          onMouseMove: onLayerMouseMove,
          onMouseUp: onLayerMouseUp,
          onMouseLeave: onLayerMouseUp,
        }),
        // 鲸鱼妈妈
        React.createElement('div', {
          className: 'dk-whale-float',
          style: { left: pos.x + '%', top: pos.y + '%', transition: momTransition },
        },
          momTipEl,
          React.createElement('button', {
            className: 'dk-whale-btn',
            title: 'DK 鲸鱼妈妈',
            onMouseDown: onMomMouseDown,
            onMouseEnter: () => { hoverRef.current = true },
            onMouseLeave: () => { hoverRef.current = false },
            onClick: onMomClick,
          },
            React.createElement('span', { className: 'dk-whale-flip', style: { transform: 'scaleX(' + dir + ')' } }, buildWhale())
          )
        ),
        // 鲸鱼宝宝
        React.createElement('div', {
          className: 'dk-whale-float',
          style: { left: babyX + '%', top: babyY + '%', transition: babyTransition },
        },
          babyTipEl,
          React.createElement('button', {
            className: 'dk-whale-btn baby',
            title: 'DK 小鲸鱼',
            onMouseEnter: () => { hoverRef.current = true },
            onMouseLeave: () => { hoverRef.current = false },
            onClick: () => showTip(true),
          },
            React.createElement('span', { className: 'dk-whale-flip', style: { transform: 'scaleX(' + dir + ')' } }, buildWhale())
          )
        )
      )
    }

    // 注册到全屏浮层（整个 UI 之上）
    slots.inject('shell.overlay', () => slots.register(
      {
        name: 'shell.overlay',
        id: 'dk-whale-pet',
      },
      () => React.createElement(WhaleFamily)
    ))
  },
}
