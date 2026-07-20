import { RotateCcw } from 'lucide-react'
import { useRef, useState } from 'react'
import gsap from 'gsap'

type Layer = 'prompt' | 'context' | 'harness'

const layers: Array<{ id: Layer; label: string; hint: string }> = [
  { id: 'prompt', label: 'Prompt（提示词）', hint: '这一次要做什么' },
  { id: 'context', label: 'Context（上下文）', hint: '完成任务需要知道什么' },
  { id: 'harness', label: 'Harness（驾驭系统）', hint: '怎样长期、安全地工作' },
]

const items: Array<{ id: string; label: string; correct: Layer; explanation: string }> = [
  { id: 'request', label: '一句明确请求', correct: 'prompt', explanation: '它直接描述这一次要完成的任务。' },
  { id: 'examples', label: '历史资料与例子', correct: 'context', explanation: '它们帮助模型理解背景和判断标准。' },
  { id: 'tools', label: '工具调用', correct: 'harness', explanation: '工具决定系统能在现实环境中执行什么动作。' },
  { id: 'safety', label: '安全边界', correct: 'harness', explanation: '安全边界限制权限并处理高风险操作。' },
  { id: 'feedback', label: '反馈闭环', correct: 'harness', explanation: '反馈让系统发现结果好坏并进入下一轮改进。' },
]

export function ScopeBuilder() {
  const [selected, setSelected] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<Record<string, Layer>>({})
  const [checked, setChecked] = useState(false)
  const resultRef = useRef<HTMLDivElement>(null)

  const assign = (layer: Layer) => {
    if (!selected) return
    setAssignments((current) => ({ ...current, [selected]: layer }))
    setSelected(null)
    setChecked(false)
  }

  const checkResult = () => {
    setChecked(true)
    requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
      if (!resultRef.current || reduceMotion) return
      gsap.fromTo(resultRef.current, { y: 8 }, { y: 0, duration: 0.28, ease: 'power3.out', clearProps: 'transform' })
    })
  }

  const reset = () => {
    setSelected(null)
    setAssignments({})
    setChecked(false)
  }

  const score = items.filter((item) => assignments[item.id] === item.correct).length

  return (
    <div className="scope-builder">
      <div className="scope-builder__instructions">
        <p><b>操作：</b>先选一张卡，再把它放入你认为正确的层级。手机和键盘都不需要拖拽。</p>
        <span>已放置 {Object.keys(assignments).length} / {items.length}</span>
      </div>
      <div className="scope-builder__cards" aria-label="待分类概念">
        {items.map((item) => (
          <button
            className={selected === item.id ? 'is-selected' : ''}
            type="button"
            key={item.id}
            onClick={() => setSelected(item.id)}
            aria-label={`选择${item.label}`}
          >
            <span>{item.label}</span>
            <small>{assignments[item.id] ? `当前：${layers.find((layer) => layer.id === assignments[item.id])?.label}` : '点击选择'}</small>
          </button>
        ))}
      </div>
      <div className="scope-builder__layers">
        {layers.map((layer) => (
          <button type="button" key={layer.id} disabled={!selected} onClick={() => assign(layer.id)} aria-label={`放入 ${layer.label}层`}>
            <b>{layer.label}</b><span>{layer.hint}</span>
          </button>
        ))}
      </div>
      <div className="scope-builder__actions">
        <button className="secondary-button" type="button" onClick={checkResult}>检查搭建</button>
        <button className="text-button" type="button" onClick={reset}><RotateCcw aria-hidden="true" size={16} />重新搭建</button>
      </div>
      {checked ? (
        <div className="scope-builder__result" ref={resultRef} aria-live="polite">
          <h4>你放对了 {score} / {items.length} 张</h4>
          <ul>
            {items.map((item) => {
              const correct = assignments[item.id] === item.correct
              return <li key={item.id} className={correct ? 'is-correct' : 'is-wrong'}><b>{item.label}{correct ? '放对了' : '需要调整'}：</b>{item.explanation}</li>
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
