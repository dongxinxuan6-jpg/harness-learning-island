import { Bot, BrainCircuit, HeartHandshake, Layers3, Network, Repeat2, ShieldCheck, UsersRound, Workflow } from 'lucide-react'
import { useState } from 'react'

const branches = [
  { number: 1, title: '工程范围扩大', relation: '输入 → 信息 → 系统', detail: 'Prompt Engineering（提示词工程）→ Context Engineering（上下文工程）→ Harness Engineering（驾驭系统工程）', icon: Layers3 },
  { number: 2, title: '反馈闭环加速', relation: '实现 → 测试 → 信号 → 决策', detail: 'Feature（产品功能）→ A/B Test（对照测试）→ Signal（信号）→ Roll out（放量发布）或 Fall back（回退）', icon: Repeat2 },
  { number: 3, title: '质量系统自治', relation: '预防 → 发现 → 分诊 → 修复', detail: 'CI/CD（持续集成与持续部署）连接测试、日志、Bug Triage（错误分诊）与 Autofixing（自动修复）', icon: ShieldCheck },
  { number: 4, title: '生产力主导权转移', relation: '人使用工具 → 系统主导流程', detail: '人从逐项执行转向定义目标、批评计划、设计 Architecture（系统架构）和审核结果', icon: Workflow },
  { number: 5, title: '软件服务对象变化', relation: '人看界面 → 智能体调用接口', detail: 'Agent Economy（智能体经济）让 Dashboard（仪表盘）之外的 MCP（模型上下文协议）与 API（应用程序接口）更重要', icon: Bot },
  { number: 6, title: '组织信任重构', relation: '信任个人 → 信任有护栏的系统', detail: '角色可以融合，但 Guardrails（护栏规则）、Owner（责任人）、证据和恢复机制不能消失', icon: UsersRound },
  { number: 7, title: '人才价值重组', relation: '专业深度 × 架构能力 × 产品与市场判断', detail: 'Senior Engineer（资深工程师）的经验与 Generalist（复合型人才）的端到端能力共同形成高杠杆', icon: BrainCircuit },
  { number: 8, title: '人的价值回到两端', relation: '定义需求 → 审核结果', detail: '系统扩大执行能力，人继续定义 Human Value（人的价值）、权利边界和可接受结果', icon: HeartHandshake },
]

export function KnowledgeMap() {
  const [selected, setSelected] = useState(0)
  const branch = branches[selected]

  return (
    <section className="knowledge-map" aria-labelledby="knowledge-map-title">
      <div className="knowledge-map__inner">
        <header><span>八章知识如何连接</span><h2 id="knowledge-map-title">全局思维导图</h2></header>
        <div className="knowledge-map__canvas">
          <div className="knowledge-map__root"><Network aria-hidden="true" size={26} /><b>Harness（驾驭系统）</b><span>让能力持续、可靠地工作</span></div>
          <div className="knowledge-map__branches">
            {branches.map((item, index) => {
              const Icon = item.icon
              return (
                <button aria-label={`查看第 ${item.number} 章：${item.title}`} aria-pressed={selected === index} className={selected === index ? 'is-selected' : ''} key={item.number} onClick={() => setSelected(index)} type="button">
                  <span>{item.number}</span><Icon aria-hidden="true" size={18} /><b>{item.title}</b><small>{item.relation}</small>
                </button>
              )
            })}
          </div>
        </div>
        <div className="knowledge-map__detail" aria-live="polite"><span>第 {branch.number} 章关系</span><h3>{branch.relation}</h3><p>{branch.detail}</p></div>
      </div>
    </section>
  )
}
