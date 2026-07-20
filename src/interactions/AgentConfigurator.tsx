import { RotateCcw } from 'lucide-react'
import { useState } from 'react'

type ReviewLevel = 'none' | 'key' | 'all'

export function AgentConfigurator() {
  const [internalData, setInternalData] = useState(false)
  const [customerData, setCustomerData] = useState(false)
  const [review, setReview] = useState<ReviewLevel>('none')
  const [generated, setGenerated] = useState(false)

  const efficiency = Math.max(0, 60 + (internalData ? 20 : 0) + (customerData ? 20 : 0) - (review === 'key' ? 8 : review === 'all' ? 20 : 0))
  const risk = Math.max(0, 18 + (internalData ? 20 : 0) + (customerData ? 35 : 0) - (review === 'key' ? 15 : review === 'all' ? 30 : 0))

  const reset = () => {
    setInternalData(false)
    setCustomerData(false)
    setReview('none')
    setGenerated(false)
  }

  return (
    <div className="agent-configurator">
      <fieldset>
        <legend>数据 Permission（权限）</legend>
        <label><input aria-label="允许读取内部业务数据" type="checkbox" checked={internalData} onChange={(event) => { setInternalData(event.target.checked); setGenerated(false) }} />允许读取内部业务数据<span>提高回答速度，也扩大内部误读范围。</span></label>
        <label><input aria-label="允许读取客户敏感数据" type="checkbox" checked={customerData} onChange={(event) => { setCustomerData(event.target.checked); setGenerated(false) }} />允许读取客户敏感数据<span>可完成更多任务，但身份、审计和泄露风险显著增加。</span></label>
      </fieldset>
      <fieldset>
        <legend>Human Review（人工审核）</legend>
        <label><input aria-label="不设置强制人工审核" type="radio" name="review" checked={review === 'none'} onChange={() => { setReview('none'); setGenerated(false) }} />不设置强制人工审核<span>速度最高，适合只处理公开低风险信息。</span></label>
        <label><input aria-label="关键决策必须人工审核" type="radio" name="review" checked={review === 'key'} onChange={() => { setReview('key'); setGenerated(false) }} />关键决策必须人工审核<span>常规步骤自动运行，发布、付款和敏感操作由人确认。</span></label>
        <label><input aria-label="每一步都需要人工审核" type="radio" name="review" checked={review === 'all'} onChange={() => { setReview('all'); setGenerated(false) }} />每一步都需要人工审核<span>风险较低，但人会重新成为流程吞吐量上限。</span></label>
      </fieldset>
      <div className="agent-configurator__actions">
        <button className="secondary-button" type="button" onClick={() => setGenerated(true)}>生成配置结果</button>
        <button className="text-button" type="button" onClick={reset}><RotateCcw aria-hidden="true" size={16} />重置配置</button>
      </div>
      {generated ? (
        <div className="agent-configurator__result" aria-live="polite">
          <div><b>效率评分：{efficiency} / 100</b><span><i style={{ transform: `scaleX(${efficiency / 100})` }} /></span></div>
          <div><b>风险评分：{risk} / 100</b><span><i style={{ transform: `scaleX(${risk / 100})` }} /></span></div>
          <p>权限越大，Agent（智能体）能完成的任务越多，但一次错误能影响的数据和动作也越多。人工审核应放在高影响决策点，而不是机械检查每一步。</p>
        </div>
      ) : null}
    </div>
  )
}
