import { BrainCircuit, RotateCcw, UserRound, UsersRound } from 'lucide-react'
import { useState } from 'react'

type ResponsibilityId = 'value' | 'signals' | 'prototype' | 'sync' | 'review'
type LaneId = 'pm' | 'team' | 'harness'

const responsibilities: Array<{ id: ResponsibilityId; label: string; note: string }> = [
  { id: 'value', label: '定义用户价值', note: '决定为谁解决什么问题，以及什么结果值得做。' },
  { id: 'signals', label: '整理市场信号', note: '收集用户、市场、产品和运营反馈。' },
  { id: 'prototype', label: '实现并验证原型', note: '把想法变成可运行版本并观察数据。' },
  { id: 'sync', label: '同步团队状态', note: '让市场、设计和工程看到同一份真实进展。' },
  { id: 'review', label: '审核最终结果', note: '检查结果是否符合人的目标、风险边界与利益。' },
]

const lanes: Array<{ id: LaneId; label: string; note: string; icon: typeof UserRound }> = [
  { id: 'pm', label: '单独产品经理', note: '集中判断，交接与等待较多。', icon: UserRound },
  { id: 'team', label: '跨职能团队', note: '共享判断，必须指定责任人。', icon: UsersRound },
  { id: 'harness', label: 'AI Harness（人工智能驾驭系统）', note: '持续处理信号，需护栏和人工审核。', icon: BrainCircuit },
]

const results: Record<ResponsibilityId, Record<LaneId, { title: string; body: string; alignment: string; trust: string }>> = {
  value: {
    pm: { title: '集中价值判断', body: '产品经理能保持方向一致，但市场证据和工程限制都要先翻译给一个人。', alignment: '中等', trust: '信任产品经理的判断与沟通' },
    team: { title: '共同定义，单点负责', body: '价值定义不应只交给 AI（人工智能）。跨职能团队可以共同提供证据，但仍要指定一名 Owner（责任人）做最终取舍。', alignment: '较低：用原型和共享证据代替反复转述', trust: '信任公开证据、决策记录与明确责任' },
    harness: { title: '让系统整理证据，人定义价值', body: '系统可以聚合用户和市场信号，却不能替人决定什么值得追求。高影响方向必须由人审核。', alignment: '较低', trust: '信任可追溯信号，不盲信结论' },
  },
  signals: {
    pm: { title: '人工汇总市场信号', body: '判断集中，但容易受到个人带宽和转述损耗限制。', alignment: '较高', trust: '信任汇总者没有遗漏关键信号' },
    team: { title: '团队共享一手证据', body: '市场、工程和设计直接看同一组数据，并在决策记录中解释各自判断。', alignment: '中等', trust: '信任共同数据与可追溯讨论' },
    harness: { title: '系统持续整理信号', body: '让 Agent（智能体）分类产品、市场和用户信号，人只处理冲突与高影响异常。', alignment: '低', trust: '信任数据来源、权限和抽样检查' },
  },
  prototype: {
    pm: { title: '需求交接后实现', body: '产品经理定义方案，再等待工程团队理解和排期。', alignment: '高', trust: '信任需求文档能完整传递意图' },
    team: { title: '想法直接变成原型', body: '具备 Implementation（实现）能力的成员在一两小时内做出版本，用真实行为继续讨论。', alignment: '低', trust: '信任可运行原型与测试结果' },
    harness: { title: '系统实现，团队设边界', body: '系统生成、测试和迭代原型；涉及安全、成本和共享架构时由专业人员评审。', alignment: '低', trust: '信任测试、权限与回滚机制' },
  },
  sync: {
    pm: { title: '由中间角色同步状态', body: '信息入口统一，但等待和失真都集中在这个角色上。', alignment: '高', trust: '信任人工更新及时且准确' },
    team: { title: '共享产品状态', body: '每个成员读取同一份发布、指标和决策记录，减少重复开会。', alignment: '中等', trust: '信任统一事实源' },
    harness: { title: '系统主动同步', body: 'Agent（智能体）读取代码、测试和业务信号，自动告诉相关团队发生了什么。', alignment: '低', trust: '信任数据接入、身份认证与异常提示' },
  },
  review: {
    pm: { title: '单人验收结果', body: '适合方向一致的小项目，但复杂风险可能超过一个人的知识范围。', alignment: '中等', trust: '信任个人经验' },
    team: { title: '按专业风险共同审核', body: '产品看价值，工程看可靠性，市场看需求，最终责任人作决定。', alignment: '中等', trust: '信任清晰审核标准与责任边界' },
    harness: { title: '系统筛查，人做最终判断', body: '系统发现异常和准备证据，人审核高影响结果。人的价值不是重复执行，而是定义需求与判断结果。', alignment: '低', trust: '信任筛查覆盖率与人工最终责任' },
  },
}

export function OrgWorkbench() {
  const [selected, setSelected] = useState<ResponsibilityId | null>(null)
  const [assignment, setAssignment] = useState<{ responsibility: ResponsibilityId; lane: LaneId } | null>(null)

  const reset = () => {
    setSelected(null)
    setAssignment(null)
  }

  const result = assignment ? results[assignment.responsibility][assignment.lane] : null

  return (
    <div className="org-workbench">
      <p className="org-workbench__hint">先选一项职责，再决定谁来承担。没有唯一组织图，关键是让信任依据和责任边界可见。</p>
      <div className="org-workbench__responsibilities" aria-label="组织职责">
        {responsibilities.map((item) => (
          <button
            aria-label={`选择${item.label}`}
            className={selected === item.id ? 'is-selected' : ''}
            key={item.id}
            onClick={() => { setSelected(item.id); setAssignment(null) }}
            type="button"
          >
            <b>{item.label}</b>
            <span>{item.note}</span>
          </button>
        ))}
      </div>
      <div className="org-workbench__lanes" aria-label="职责承担方式">
        {lanes.map((lane) => {
          const Icon = lane.icon
          return (
            <button
              aria-label={`分配给${lane.label}`}
              disabled={!selected}
              key={lane.id}
              onClick={() => selected && setAssignment({ responsibility: selected, lane: lane.id })}
              type="button"
            >
              <Icon aria-hidden="true" size={19} />
              <b>{lane.label}</b>
              <span>{lane.note}</span>
            </button>
          )
        })}
      </div>
      {result ? (
        <div className="org-workbench__result" aria-live="polite">
          <div>
            <span>组织推演结果</span>
            <h4>{result.title}</h4>
            <p>{result.body}</p>
          </div>
          <dl>
            <div><dt>对齐成本</dt><dd>{result.alignment}</dd></div>
            <div><dt>信任依据</dt><dd>{result.trust}</dd></div>
          </dl>
        </div>
      ) : null}
      <button className="text-button" type="button" onClick={reset}><RotateCcw aria-hidden="true" size={16} />重置组织桌面</button>
    </div>
  )
}
