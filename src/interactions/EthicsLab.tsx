import { FileSearch, MessageSquareText, RotateCcw, Scale, ShoppingCart, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

type ScenarioId = 'chat' | 'purchase' | 'review' | 'content'
type ChoiceId = 'wide' | 'minimum' | 'manual'

const scenarios: Array<{ id: ScenarioId; label: string; title: string; note: string; icon: typeof MessageSquareText }> = [
  { id: 'chat', label: '员工聊天记录', title: '智能体读取员工聊天来同步项目', note: '效率、同意与工作场所隐私发生冲突。', icon: MessageSquareText },
  { id: 'purchase', label: '自动采购推荐', title: '智能体替公司筛选并购买服务', note: '推荐质量、商业影响与责任归属发生冲突。', icon: ShoppingCart },
  { id: 'review', label: '自动绩效评价', title: '系统根据工作记录评价员工表现', note: '规模化判断、解释权与申诉权发生冲突。', icon: Scale },
  { id: 'content', label: '面向智能体的内容', title: '营销内容主要为采购智能体优化', note: '机器可读性、人类理解与操纵风险发生冲突。', icon: FileSearch },
]

const outcomes: Record<ScenarioId, Record<ChoiceId, { title: string; body: string; stakeholders: string; guardrail: string; question: string }>> = {
  chat: {
    wide: { title: '全面读取，效率优先', body: '系统可能更快同步信息，但员工很难理解哪些私人语境会被用于管理决策。', stakeholders: '员工、管理者、客户与信息中提到的第三方', guardrail: '仅靠公司拥有账号不足以形成正当授权', question: '员工能否拒绝、纠正或删除被误解的内容？' },
    minimum: { title: '最小必要权限，目的受限', body: '只读取已明确授权的项目频道和必要字段，敏感对话默认排除，并记录每次访问。', stakeholders: '员工、项目团队、管理者与客户', guardrail: '最小必要权限、可追溯同意、保存期限、访问日志与人工升级', question: '谁判断一个频道确实“必要”，员工拒绝后是否会受到隐性惩罚？' },
    manual: { title: '全部改为人工同步', body: '降低自动读取的隐私风险，却可能重新制造大量会议、遗漏和人工监控。', stakeholders: '员工、项目负责人和信息接收者', guardrail: '明确记录范围、会议最小化与人工保密责任', question: '人工查看是否真的比系统查看更少侵犯隐私？' },
  },
  purchase: {
    wide: { title: '允许系统直接下单', body: '速度很高，但错误推荐、利益冲突和不可逆付款会被一起放大。', stakeholders: '采购人、供应商、财务、最终使用者', guardrail: '预算上限、供应商审计、回滚和异常冻结', question: '推荐排序是否受到供应商付费或训练数据偏差影响？' },
    minimum: { title: '分级授权，关键购买确认', body: '公开调研和低额重复购买可自动化，高金额或敏感服务由人确认。', stakeholders: '采购人、财务、供应商与客户', guardrail: '最小必要权限、金额阈值、理由说明和人工审核', question: '金额之外，数据访问和长期锁定风险如何计入阈值？' },
    manual: { title: '只提供候选名单', body: '人保留全部决策权，但仍可能过度依赖系统筛选后的有限选项。', stakeholders: '决策者、被排除供应商与最终用户', guardrail: '公开筛选标准、多个信息源和反例检查', question: '未进入候选名单的方案是否还有公平申诉机会？' },
  },
  review: {
    wide: { title: '自动生成并执行评价', body: '评价快速一致，但错误指标会直接改变人的收入、岗位和机会。', stakeholders: '员工、经理、团队与人力资源部门', guardrail: '禁止单一自动决定高影响人事结果', question: '系统无法观察的照顾工作与协作贡献怎样被承认？' },
    minimum: { title: '系统整理证据，人承担判断', body: '系统只汇总经授权的工作证据，员工可查看和纠正，最终评价由明确责任人完成。', stakeholders: '被评价员工、经理、同事与组织', guardrail: '最小必要权限、解释、纠错、申诉和人工审核', question: '员工是否有真正安全的渠道挑战管理者和系统共同形成的结论？' },
    manual: { title: '完全人工评价', body: '避免自动决定，却保留记忆偏差、关系偏差和不可审计的主观判断。', stakeholders: '员工、经理与团队', guardrail: '结构化标准、多方证据和书面解释', question: '人工流程如何证明自己比有护栏的系统更公平？' },
  },
  content: {
    wide: { title: '只为智能体排名优化', body: '可能提高机器推荐率，却让人难以理解产品，也可能诱导代理指标而非真实价值。', stakeholders: '消费者、采购智能体、平台与商家', guardrail: '禁止伪造结构化数据并保留人类可读说明', question: '系统如何区分有用结构与针对排序算法的操纵？' },
    minimum: { title: '机器可读与人类可读并存', body: '为智能体提供结构化事实、来源和限制，同时让最终使用者能理解与复核。', stakeholders: '消费者、智能体开发者、平台和商家', guardrail: '最小必要数据、来源证明、可比较字段与人工确认', question: '当人完全委托购买时，谁代表人的长期偏好和意外需求？' },
    manual: { title: '禁止智能体消费内容', body: '短期减少机器操纵，却难以执行，也会失去无障碍、搜索和辅助决策价值。', stakeholders: '消费者、辅助技术用户、平台与商家', guardrail: '清楚标记自动访问与代理行为', question: '禁止是否会不成比例地伤害依赖辅助技术的人？' },
  },
}

export function EthicsLab() {
  const [scenario, setScenario] = useState<ScenarioId | null>(null)
  const [choice, setChoice] = useState<ChoiceId | null>(null)
  const outcome = scenario && choice ? outcomes[scenario][choice] : null

  const reset = () => {
    setScenario(null)
    setChoice(null)
  }

  return (
    <div className="ethics-lab">
      <p className="ethics-lab__hint">伦理不是寻找一个脱离情境的正确按钮。先选场景，再比较授权方式造成的真实影响。</p>
      <div className="ethics-lab__scenarios" aria-label="伦理场景">
        {scenarios.map((item) => {
          const Icon = item.icon
          return (
            <button aria-label={`选择${item.label}场景`} className={scenario === item.id ? 'is-selected' : ''} key={item.id} onClick={() => { setScenario(item.id); setChoice(null) }} type="button">
              <Icon aria-hidden="true" size={20} />
              <b>{item.title}</b>
              <span>{item.note}</span>
            </button>
          )
        })}
      </div>
      <div className="ethics-lab__choices" aria-label="处理方案">
        <button disabled={!scenario} onClick={() => setChoice('wide')} type="button"><b>全面授权</b><span>让系统直接读取和执行。</span></button>
        <button aria-label="采用最小必要权限方案" disabled={!scenario} onClick={() => setChoice('minimum')} type="button"><b>最小必要权限</b><span>按目的、风险和影响分级授权。</span></button>
        <button disabled={!scenario} onClick={() => setChoice('manual')} type="button"><b>全部人工处理</b><span>系统只提供有限辅助或完全退出。</span></button>
      </div>
      {outcome ? (
        <div className="ethics-lab__result" aria-live="polite">
          <div className="ethics-lab__result-copy">
            <ShieldCheck aria-hidden="true" size={22} />
            <span>情境分析</span>
            <h4>{outcome.title}</h4>
            <p>{outcome.body}</p>
          </div>
          <dl>
            <div><dt>利益相关者</dt><dd>{outcome.stakeholders}</dd></div>
            <div><dt>隐私与责任护栏</dt><dd>{outcome.guardrail}</dd></div>
            <div><dt>仍需回答</dt><dd>{outcome.question}</dd></div>
          </dl>
        </div>
      ) : null}
      <button aria-label="重置伦理实验室" className="text-button" onClick={reset} type="button"><RotateCcw aria-hidden="true" size={16} />重置</button>
    </div>
  )
}
