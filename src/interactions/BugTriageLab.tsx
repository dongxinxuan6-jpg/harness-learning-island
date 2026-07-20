import { RotateCcw, ShieldAlert } from 'lucide-react'
import { useRef, useState } from 'react'
import gsap from 'gsap'

type Lane = 'low' | 'medium' | 'high'

const issues: Array<{ id: string; label: string; correct: Lane; context: string; rationale: string }> = [
  { id: 'style', label: '移动端按钮错位', correct: 'low', context: '某型号手机上，帮助按钮向右偏移了八个像素。', rationale: '只涉及展示样式，有截图测试和快速回退。' },
  { id: 'order', label: '订单金额显示异常', correct: 'medium', context: '结算页显示金额与订单详情偶尔不一致。', rationale: '可能影响用户判断，需要工程师确认数据来源后批准。' },
  { id: 'auth', label: '登录权限泄露', correct: 'high', context: '少数用户可能读取不属于自己的账户数据。', rationale: '涉及身份认证和用户数据，安全优先于速度，必须深度审核。' },
]

const lanes: Array<{ id: Lane; label: string; detail: string }> = [
  { id: 'low', label: '低风险自动修复', detail: '速度最快，适合可验证、可回退且影响小的问题。' },
  { id: 'medium', label: '中风险人工快速批准', detail: '系统提出方案，人检查关键证据后决定是否发布。' },
  { id: 'high', label: '高风险人工深度审核', detail: '需要安全、权限、回退和责任等多维检查。' },
]

export function BugTriageLab() {
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<{ issueId: string; lane: Lane } | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const route = (lane: Lane) => {
    if (!selected) return
    setResult({ issueId: selected, lane })
    requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
      if (!resultRef.current || reduceMotion) return
      gsap.fromTo(resultRef.current, { y: 8 }, { y: 0, duration: 0.25, ease: 'power3.out', clearProps: 'transform' })
    })
  }

  const reset = () => {
    setSelected(null)
    setResult(null)
  }

  const issue = result ? issues.find((item) => item.id === result.issueId) : null
  const lane = result ? lanes.find((item) => item.id === result.lane) : null
  const correct = Boolean(issue && result && issue.correct === result.lane)

  return (
    <div className="triage-lab">
      <p className="triage-lab__hint">先选择一个问题，再选择处理通道。判断依据是潜在影响、可验证性和可回退性。</p>
      <div className="triage-lab__issues">
        {issues.map((item) => (
          <button className={selected === item.id ? 'is-selected' : ''} type="button" key={item.id} onClick={() => { setSelected(item.id); setResult(null) }} aria-label={`选择${item.label}`}>
            <ShieldAlert aria-hidden="true" size={18} /><b>{item.label}</b><span>{item.context}</span>
          </button>
        ))}
      </div>
      <div className="triage-lab__lanes">
        {lanes.map((item) => (
          <button type="button" key={item.id} disabled={!selected} onClick={() => route(item.id)} aria-label={`送入${item.label}`}>
            <b>{item.label}</b><span>{item.detail}</span>
          </button>
        ))}
      </div>
      {result && issue && lane ? (
        <div className={`triage-lab__result ${correct ? 'is-correct' : 'is-wrong'}`} ref={resultRef} aria-live="polite">
          <h4>{issue.label}{correct ? '分流正确' : '还需要调整'}</h4>
          <p>{correct ? issue.rationale : `你选择了“${lane.label}”，但这个问题更适合“${lanes.find((item) => item.id === issue.correct)?.label}”。${issue.rationale}`}</p>
          <dl><div><dt>速度</dt><dd>{result.lane === 'low' ? '快' : result.lane === 'medium' ? '中等' : '较慢'}</dd></div><div><dt>人工成本</dt><dd>{result.lane === 'low' ? '低' : result.lane === 'medium' ? '中等' : '高'}</dd></div><div><dt>风险控制</dt><dd>{result.lane === 'high' ? '最强' : result.lane === 'medium' ? '平衡' : '依赖自动验证'}</dd></div></dl>
        </div>
      ) : null}
      <button className="text-button" type="button" onClick={reset}><RotateCcw aria-hidden="true" size={16} />重置分诊台</button>
    </div>
  )
}
