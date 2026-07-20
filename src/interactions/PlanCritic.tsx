import { RotateCcw } from 'lucide-react'
import { useState } from 'react'

const dimensions = [
  { id: 'security', label: '安全', button: '指出安全缺陷', revision: '增加最小权限与操作确认，敏感动作进入人工审核。' },
  { id: 'latency', label: '延迟', button: '指出延迟缺陷', revision: '增加缓存与超时策略，长任务拆成可恢复检查点。' },
  { id: 'cost', label: '成本', button: '指出成本缺陷', revision: '为工具调用和推理时间设置预算，并记录超额原因。' },
  { id: 'maintenance', label: '可维护性', button: '指出可维护性缺陷', revision: '拆分模块、记录架构决定，并为依赖升级设计验证。' },
]

export function PlanCritic() {
  const [critiques, setCritiques] = useState<string[]>([])
  const score = 50 + critiques.length * 10

  const addCritique = (id: string) => {
    setCritiques((current) => current.includes(id) ? current : [...current, id])
  }

  return (
    <div className="plan-critic">
      <div className="plan-critic__draft">
        <span>AI Planning（人工智能规划）初稿</span>
        <h4>“让 Agent（智能体）自动读取数据、调用工具并发布结果。”</h4>
        <p>目标有了，但权限、等待、费用和长期修改方式都没有说明。</p>
      </div>
      <div className="plan-critic__score">
        <b>计划评分：{score} / 100</b>
        <span aria-hidden="true"><i style={{ transform: `scaleX(${score / 100})` }} /></span>
      </div>
      <div className="plan-critic__buttons">
        {dimensions.map((dimension) => (
          <button className={critiques.includes(dimension.id) ? 'is-used' : ''} type="button" key={dimension.id} onClick={() => addCritique(dimension.id)} disabled={critiques.includes(dimension.id)}>
            {dimension.button}
          </button>
        ))}
      </div>
      <div className="plan-critic__revisions" aria-live="polite">
        <h4>修订后的计划依据</h4>
        {critiques.length === 0 ? <p>选择一个维度，开始 Criticize（批评审查）这份计划。</p> : (
          <ul>{critiques.map((id) => { const item = dimensions.find((dimension) => dimension.id === id)!; return <li key={id}><b>{item.label}：</b>{item.revision}</li> })}</ul>
        )}
      </div>
      <button className="text-button" type="button" onClick={() => setCritiques([])}><RotateCcw aria-hidden="true" size={16} />重置评审</button>
    </div>
  )
}
