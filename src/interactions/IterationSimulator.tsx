import { RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

type Decision = 'rollout' | 'revise' | 'fallback'

const outcomes: Record<Decision, { title: string; explanation: string }> = {
  rollout: { title: '你选择了放量发布', explanation: '测试组核心指标提升 18%，错误率没有明显变化。逐步放量合理，但仍应继续观察更大样本。' },
  revise: { title: '你选择了修改后再测', explanation: '真实信号显示点击增加，但完成率下降。先修改流程再测试，避免只优化表面指标。' },
  fallback: { title: '你选择了回退稳定版', explanation: '测试出现高风险错误和投诉信号。回退能先保护用户，再进入问题定位与修复。' },
}

export function IterationSimulator() {
  const [stage, setStage] = useState(0)
  const [decision, setDecision] = useState<Decision | null>(null)
  const progressRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    if (!progressRef.current || reduceMotion) return
    gsap.to(progressRef.current, { scaleX: stage / 3, duration: 0.3, ease: 'power3.out' })
  }, [stage])

  const choose = (choice: Decision) => {
    setDecision(choice)
    setStage(3)
  }

  const reset = () => {
    setStage(0)
    setDecision(null)
  }

  return (
    <div className="iteration-simulator">
      <div className="iteration-simulator__track" aria-hidden="true"><span ref={progressRef} /></div>
      <ol className="iteration-simulator__steps">
        <li className={stage >= 1 ? 'is-active' : ''}><b>10:00</b><span>完成最小 Feature（产品功能）</span></li>
        <li className={stage >= 2 ? 'is-active' : ''}><b>12:00</b><span>读取对照测试数据</span></li>
        <li className={stage >= 3 ? 'is-active' : ''}><b>15:00</b><span>根据 Signal（信号）决策</span></li>
        <li className={stage >= 3 ? 'is-active' : ''}><b>17:00</b><span>留下结果并继续观察</span></li>
      </ol>
      {stage === 0 ? <button className="secondary-button" type="button" onClick={() => setStage(1)}>开始一天迭代</button> : null}
      {stage === 1 ? (
        <div className="iteration-simulator__panel">
          <h4>新功能已经完成</h4>
          <p>现在还不知道它是否真正改善用户结果。先把新旧版本交给相似用户比较。</p>
          <button className="secondary-button" type="button" onClick={() => setStage(2)}>运行 A/B Test（对照测试）</button>
        </div>
      ) : null}
      {stage === 2 ? (
        <div className="iteration-simulator__panel">
          <h4>中午的真实信号</h4>
          <p>新版本点击率上升 22%，但完成率下降 9%，错误报告略有增加。你会怎么做？</p>
          <div className="iteration-simulator__choices">
            <button type="button" onClick={() => choose('rollout')}>选择放量发布</button>
            <button type="button" onClick={() => choose('revise')}>选择修改后再测</button>
            <button type="button" onClick={() => choose('fallback')}>选择回退稳定版</button>
          </div>
        </div>
      ) : null}
      {stage === 3 && decision ? (
        <div className="iteration-simulator__result" aria-live="polite">
          <h4>{outcomes[decision].title}</h4>
          <p>{outcomes[decision].explanation} 关键是用真实信号推动下一轮，而不是把“代码写完”当作结束。</p>
        </div>
      ) : null}
      {stage > 0 ? <button className="text-button" type="button" onClick={reset}><RotateCcw aria-hidden="true" size={16} />重新模拟</button> : null}
    </div>
  )
}
