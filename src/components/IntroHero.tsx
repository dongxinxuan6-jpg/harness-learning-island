import { ArrowDown, Clock3, Layers3, ListChecks } from 'lucide-react'

interface IntroHeroProps {
  chapters: string[]
  onStart: () => void
}

export function IntroHero({ chapters, onStart }: IntroHeroProps) {
  return (
    <section className="intro-hero" id="top">
      <div className="intro-hero__copy">
        <p className="intro-hero__label">零基础连续课程</p>
        <h1>Harness 学习岛</h1>
        <p className="intro-hero__summary">
          从 Prompt Engineering（提示词工程）一路学到 AI First（人工智能优先）组织、Agent Economy（智能体经济）与人的价值。内容来自整期播客，并增加解释、案例、互动和复习。
        </p>
        <button className="primary-button" type="button" onClick={onStart}>
          从第一章开始 <ArrowDown aria-hidden="true" size={18} />
        </button>
        <dl className="course-facts">
          <div><Layers3 aria-hidden="true" /><dt>8 章</dt><dd>连续学习路线</dd></div>
          <div><ListChecks aria-hidden="true" /><dt>106 个</dt><dd>完整知识单元</dd></div>
          <div><Clock3 aria-hidden="true" /><dt>约 90 分钟</dt><dd>首轮深度学习</dd></div>
        </dl>
      </div>
      <div className="course-map" aria-label="八章课程路线">
        <p>从这里开始，一路向下</p>
        <ol>
          {chapters.map((chapter, index) => (
            <li key={chapter}><span>{index + 1}</span><b>{chapter}</b></li>
          ))}
        </ol>
      </div>
    </section>
  )
}
