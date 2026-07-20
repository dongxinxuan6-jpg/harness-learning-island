import { RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'

type Scores = {
  architecture: number
  judgment: number
  productMarket: number
  implementation: number
  depth: number
  adaptability: number
}

const defaults: Scores = {
  architecture: 52,
  judgment: 56,
  productMarket: 42,
  implementation: 62,
  depth: 58,
  adaptability: 64,
}

const abilities: Array<{ key: keyof Scores; label: string; note: string }> = [
  { key: 'architecture', label: '系统架构能力', note: '定义边界、接口、权限、反馈和恢复机制。' },
  { key: 'judgment', label: '结果与风险判断', note: '发现计划缺陷并审核高影响结果。' },
  { key: 'productMarket', label: '产品与市场判断', note: '连接用户需求、产品价值和市场信号。' },
  { key: 'implementation', label: '快速实现能力', note: '把想法在短时间内变成可运行原型。' },
  { key: 'depth', label: '专业技术深度', note: '识别安全、性能和复杂领域风险。' },
  { key: 'adaptability', label: '角色适应能力', note: '愿意扩大职责并采用新的工作方式。' },
]

function getProfile(scores: Scores) {
  if (scores.architecture >= 75 && scores.productMarket >= 70 && scores.depth >= 65) {
    return {
      name: '架构型复合人才',
      fit: '适合定义人工智能系统边界，把专业风险、用户价值和业务信号连接成完整闭环。',
      caution: '不要把资深经验当成过时负担。应把经验转成 Guardrails（护栏规则）、测试、技能规则和评审标准，让系统复用。',
    }
  }
  if (scores.implementation >= 75 && scores.adaptability >= 70 && scores.productMarket >= 55) {
    return {
      name: '端到端产品建造者',
      fit: '适合快速把用户问题变成原型、发布实验并根据数据继续迭代。',
      caution: '实现很快时更要补专业评审。安全、可靠性和商业化不能只靠原型速度判断。',
    }
  }
  if (scores.depth >= 78 && scores.judgment >= 68) {
    return {
      name: '专业护栏设计者',
      fit: '适合处理高风险领域，把深度知识沉淀成计划批评、测试和升级条件。',
      caution: '不要让职责停在代码交付。继续补产品、市场和发布后影响分析，才能连接完整结果。',
    }
  }
  if (scores.adaptability >= 75 && scores.depth < 60) {
    return {
      name: '高适应成长型人才',
      fit: '愿意扩展职责、快速学习新工具，适合从小范围端到端任务积累经验。',
      caution: '适应快不等于判断稳。要用故障诊断、基础训练和资深评审补足专业深度。',
    }
  }
  return {
    name: '待强化的协作型人才',
    fit: '已有若干可靠能力，适合先选择一项主专长和一个完整业务结果持续训练。',
    caution: '不要同时追求六项满分。先提升最影响当前职责的一项，再借助团队和系统补足其他能力。',
  }
}

export function TalentMixer() {
  const [scores, setScores] = useState<Scores>(defaults)
  const [generated, setGenerated] = useState(false)
  const profile = getProfile(scores)

  const setScore = (key: keyof Scores, value: number) => {
    setScores((current) => ({ ...current, [key]: value }))
    setGenerated(false)
  }

  const reset = () => {
    setScores(defaults)
    setGenerated(false)
  }

  return (
    <div className="talent-mixer">
      <div className="talent-mixer__controls">
        {abilities.map((ability) => (
          <label key={ability.key}>
            <span><b>{ability.label}</b><output>{scores[ability.key]}</output></span>
            <input
              aria-label={ability.label}
              max="100"
              min="0"
              onChange={(event) => setScore(ability.key, Number(event.target.value))}
              type="range"
              value={scores[ability.key]}
            />
            <small>{ability.note}</small>
          </label>
        ))}
      </div>
      <div className="talent-mixer__actions">
        <button className="secondary-button" onClick={() => setGenerated(true)} type="button"><SlidersHorizontal aria-hidden="true" size={16} />生成人才画像</button>
        <button aria-label="重置人才混合器" className="text-button" onClick={reset} type="button"><RotateCcw aria-hidden="true" size={16} />重置</button>
      </div>
      {generated ? (
        <div className="talent-mixer__result" aria-live="polite">
          <span>能力组合画像</span>
          <h4>{profile.name}</h4>
          <p>{profile.fit}</p>
          <aside><b>成长提醒</b>{profile.caution}</aside>
        </div>
      ) : null}
    </div>
  )
}
