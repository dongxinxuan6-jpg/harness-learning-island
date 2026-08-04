import type { ContentItem, FrontierSignal, GitHubProject, LearningNode, Product, Source, WeeklyDigest } from "@jingjian/domain";
import type { SnapshotDataset } from "./snapshots";

const generatedAt = "2026-08-03T02:00:00.000Z";
const source = (id: string, name: string, url: string, tier: Source["tier"], language: Source["language"] = "en"): Source => ({
  id, name, url, tier, language, fetchedAt: generatedAt
});

const sources = {
  android: source("android-xr", "Android XR Developers", "https://developer.android.com/develop/xr/devices", "official"),
  androidDp4: source("android-xr-dp4", "Android Developers Blog", "https://developer.android.com/blog/posts/updates-to-the-android-xr-sdk-introducing-developer-preview-4", "official"),
  meta: source("meta-ai", "AI at Meta", "https://ai.meta.com/blog/executorch-reality-labs-on-device-ai/", "official"),
  qualcomm: source("qualcomm-ar2", "Qualcomm", "https://www.qualcomm.com/xr-vr-ar/products/ar-series/snapdragon-ar2-gen-1-platform", "official"),
  xreal: source("xreal-aura", "XREAL", "https://www.xreal.com/us/aura", "official"),
  rokid: source("rokid", "Rokid", "https://global.rokid.com/", "official"),
  xiaomi: source("xiaomi", "小米", "https://www.mi.com/prod/xiaomi-ai-glasses", "official", "zh"),
  rayneo: source("rayneo", "RayNeo", "https://www.rayneo.com/pages/x3-pro-launch", "official"),
  even: source("even-g2", "Even Realities", "https://www.evenrealities.com/en-US/smart-glasses", "official"),
  halliday: source("halliday-g2", "Halliday", "https://www.hallidayglobal.com/", "official"),
  solos: source("solos", "Solos", "https://solosglasses.com/", "official"),
  brilliant: source("brilliant", "Brilliant Labs", "https://github.com/brilliantlabsAR", "official"),
  snap: source("snap", "Snap Spectacles Developers", "https://developers.snap.com/spectacles/get-started/introduction", "official"),
  github: source("github", "GitHub", "https://github.com/topics/smart-glasses", "research"),
  openglassPaper: source("openglass-paper", "arXiv", "https://arxiv.org/abs/2606.07431", "research"),
  superglasses: source("superglasses-paper", "arXiv", "https://arxiv.org/abs/2602.22683", "research")
};

const score = (
  value: number,
  heat: number,
  verification: "verified" | "developing" | "unverified" = "verified",
  independentSources = 1,
  discussionVelocity = 50,
  observedMentions = independentSources
) => ({
  value,
  heat,
  verification,
  independentSources,
  confidence: verification === "verified" ? 0.9 : verification === "developing" ? 0.72 : 0.55,
  scoredAt: generatedAt,
  heatSignals: { discussionVelocity, crossPlatformSources: independentSources, observedMentions, windowHours: 24 }
});

export const contents: ContentItem[] = [
  {
    id: "content-android-xr-dp4", slug: "android-xr-dp4-glasses", title: "Android XR 把 AI 眼镜正式拆成音频与显示两条产品路线",
    originalTitle: "Updates to the Android XR SDK: Introducing Developer Preview 4",
    summary: "Google 正在用统一 SDK 覆盖音频眼镜、显示眼镜与有线 XR 眼镜，并为轻显示界面提供 Glimmer 组件体系。",
    whyItMatters: "操作系统开始按产品形态定义能力边界，开发者可以更早判断一项体验应该通过声音、轻显示还是空间界面交付。",
    beginnerNote: "音频眼镜依赖相机、麦克风和扬声器；显示眼镜在此基础上加入短小、私密、可扫读的视觉提示。",
    productImpact: "统一平台会降低跨品牌开发成本，但也会增强手机与系统生态对眼镜体验的控制力。",
    publishedAt: "2026-05-19T00:00:00Z", readMinutes: 2, tags: ["Android XR", "操作系统", "显示交互"],
    productSlugs: ["xreal-aura"], learningNodeIds: ["stage-1-form-factors", "stage-3-software-stack"], sources: [sources.androidDp4, sources.android], score: score(94, 88, "verified", 1, 78, 2)
  },
  {
    id: "content-meta-executorch", slug: "meta-executorch-on-device-ai", title: "Meta 如何把端侧 AI 放进全天佩戴的眼镜",
    originalTitle: "ExecuTorch Adoption in Reality Labs: Powering On-Device AI Across Meta Devices",
    summary: "ExecuTorch 已用于 Ray-Ban Meta、Meta Ray-Ban Display 与运动眼镜中的 OCR、字幕、翻译和视觉理解。",
    whyItMatters: "端侧推理决定响应速度、隐私、网络依赖和续航，是 AI 眼镜从相机配件走向实时助手的关键。",
    beginnerNote: "端侧模型在眼镜或手机本地运行，云端模型能力更强；真实产品通常在两者之间分配任务。",
    productImpact: "产品需要在模型尺寸、芯片功耗、发热和输出质量之间持续取舍。",
    publishedAt: "2025-11-21T00:00:00Z", readMinutes: 2, tags: ["端侧 AI", "ExecuTorch", "OCR"],
    productSlugs: ["ray-ban-meta", "meta-ray-ban-display"], learningNodeIds: ["stage-3-ai-stack", "stage-3-hardware"], sources: [sources.meta], score: score(92, 82, "verified", 1, 62)
  },
  {
    id: "content-xreal-aura", slug: "xreal-aura-split-computing", title: "XREAL AURA 用分体计算换取 70° 视场角与眼镜形态",
    summary: "AURA 将 Snapdragon Reality Elite 放在计算盒中，眼镜端使用 X1S 协处理器承担低延迟空间显示。",
    whyItMatters: "它直接展示了高性能空间计算与轻量佩戴之间的一种现实解法。",
    beginnerNote: "分体计算把高功耗任务放到手机或计算盒，眼镜保留显示、传感与低延迟处理。",
    productImpact: "体验上获得更大视场角和完整应用生态，代价是线缆、额外设备与携带复杂度。",
    publishedAt: "2026-07-15T00:00:00Z", readMinutes: 2, tags: ["空间计算", "分体计算", "光学"],
    productSlugs: ["xreal-aura"], learningNodeIds: ["stage-1-form-factors", "stage-3-hardware"], sources: [sources.xreal, sources.android], score: score(90, 91, "verified", 2, 91, 2)
  },
  {
    id: "content-openglass-paper", slug: "openglass-event-camera", title: "事件相机让 200mAh 眼镜实现最长 11.8 小时端侧手势识别",
    originalTitle: "OpenGlass: Open-Source Smart Glasses for On-Device Event-Based Gesture Recognition",
    summary: "研究原型使用事件相机、RISC-V SoC 与事件唤醒电源管理，只在需要推理时启动主要计算单元。",
    whyItMatters: "它给出了续航问题的系统级答案：降低传感数据量，并让硬件按事件醒来。",
    beginnerNote: "事件相机只报告像素变化，不持续输出完整画面，因此数据量和处理压力更低。",
    productImpact: "适合手势和状态识别，但成像内容与传统相机不同，仍需针对具体任务设计模型。",
    publishedAt: "2026-06-05T16:27:02Z", readMinutes: 2, tags: ["事件相机", "低功耗", "手势"],
    productSlugs: ["brilliant-frame"], learningNodeIds: ["stage-3-hardware", "stage-4-judgement"], sources: [sources.openglassPaper], score: score(89, 74, "verified", 1, 54)
  },
  {
    id: "content-superglasses", slug: "superglasses-vlm-benchmark", title: "第一视角 VQA 暴露通用视觉模型在 AI 眼镜上的能力缺口",
    originalTitle: "SUPERGLASSES: Benchmarking Vision Language Models as Intelligent Agents for AI Smart Glasses",
    summary: "SUPERGLASSES 使用真实眼镜采集的第一视角数据评估视觉语言模型，强调先识别关注对象、再检索知识。",
    whyItMatters: "手机图片问答效果好，并不代表模型能理解持续移动、遮挡和用户注意目标不明确的第一视角。",
    beginnerNote: "第一视角模型既要看懂画面，还要判断用户此刻真正关心哪个对象。",
    productImpact: "产品需要对象定位、查询拆分和外部检索组成完整链路，而非只调用一次大模型。",
    publishedAt: "2026-02-26T06:55:48Z", readMinutes: 2, tags: ["第一视角", "VLM", "评测"],
    productSlugs: ["ray-ban-meta", "xiaomi-ai-glasses"], learningNodeIds: ["stage-3-ai-stack", "stage-4-judgement"], sources: [sources.superglasses], score: score(87, 76, "verified", 1, 58)
  },
  {
    id: "content-rayneo-x3", slug: "rayneo-x3-pro-aios", title: "轻显示眼镜正在从功能集合走向专用 AI 操作系统",
    summary: "RayNeo X3 Pro 将彩色光波导、翻译、导航、应用与开发模式放入同一产品，代表轻显示路线对系统完整性的追求。",
    whyItMatters: "显示眼镜的竞争重点正从单项参数转向应用、交互与开发者生态能否形成闭环。",
    beginnerNote: "有显示并不等于空间计算；轻显示通常强调短信息、导航和翻译，而非大范围沉浸界面。",
    productImpact: "能力更完整，同时会增加重量、功耗、热量与软件维护压力。",
    publishedAt: "2026-07-28T00:00:00Z", readMinutes: 2, tags: ["AIOS", "光波导", "生态"],
    productSlugs: ["rayneo-x3-pro"], learningNodeIds: ["stage-2-interaction", "stage-3-software-stack"], sources: [sources.rayneo], score: score(84, 86, "developing", 1, 86)
  },
  {
    id: "content-qualcomm-ar2", slug: "snapdragon-ar2-distributed", title: "为什么 AI 眼镜芯片开始采用多芯片与分布式架构",
    summary: "Snapdragon AR2 将感知、协处理与连接职责拆开，并把复杂任务分配给手机或主机。",
    whyItMatters: "眼镜镜腿空间、散热面积和电池都很有限，单芯片堆性能会迅速破坏佩戴体验。",
    beginnerNote: "分布式架构让不同芯片只处理自己擅长的任务，并把高耗能工作移出眼镜。",
    productImpact: "可降低眼镜端功耗和 PCB 尺寸，但系统集成、连接稳定性和延迟调优更复杂。",
    publishedAt: "2026-07-20T00:00:00Z", readMinutes: 2, tags: ["芯片", "分布式架构", "功耗"],
    productSlugs: ["xreal-aura", "rokid-glasses"], learningNodeIds: ["stage-3-hardware"], sources: [sources.qualcomm], score: score(82, 69, "verified", 1, 45)
  }
];

const baseSpecs = { "连接": "蓝牙 / Wi-Fi（依产品而定）", "核心输入": "语音、触控与第一视角感知" };
export const products: Product[] = [
  { id: "p-meta", slug: "ray-ban-meta", brand: "Meta × Ray-Ban", name: "Ray-Ban Meta", form: "audio", status: "shipping", heroImage: "/assets/products/ray-ban-meta.webp", officialUrl: "https://www.meta.com/smart-glasses/", positioning: "面向日常拍摄、开放式音频与多模态助手的无显示 AI 眼镜。", audience: "希望全天佩戴并随手记录、查询环境信息的消费者。", scenarios: ["第一视角拍摄", "语音问答", "通话与音频"], capabilities: ["相机", "麦克风阵列", "开放式扬声器", "Meta AI"], specs: { ...baseSpecs, "显示": "无" }, architecture: ["眼镜负责采集与音频", "手机负责连接和应用", "端侧与云端模型协同"], tradeoffs: ["外形接近日常眼镜", "视觉输出依赖声音和手机"], updatedAt: generatedAt, sources: [sources.meta] },
  { id: "p-meta-display", slug: "meta-ray-ban-display", brand: "Meta × Ray-Ban", name: "Ray-Ban Display", form: "display", status: "shipping", heroImage: "/assets/products/meta-ray-ban-display.webp", officialUrl: "https://www.meta.com/smart-glasses/", positioning: "把字幕、OCR 与上下文信息直接放入视野的轻显示眼镜。", audience: "需要实时视觉提示、翻译与信息回看的用户。", scenarios: ["实时字幕", "翻译", "文本识别"], capabilities: ["私密显示", "端侧 OCR", "手部交互"], specs: { ...baseSpecs, "显示": "单眼轻显示" }, architecture: ["眼镜端显示与感知", "神经腕带/触控输入", "端侧 ExecuTorch"], tradeoffs: ["信息更直观", "显示增加重量与功耗"], updatedAt: generatedAt, sources: [sources.meta] },
  { id: "p-xiaomi", slug: "xiaomi-ai-glasses", brand: "小米", name: "小米 AI 眼镜", form: "audio", status: "shipping", heroImage: "/assets/products/xiaomi-ai-glasses.webp", officialUrl: "https://www.mi.com/prod/xiaomi-ai-glasses", positioning: "连接小米手机与生态服务的相机音频 AI 眼镜。", audience: "小米生态用户与轻量第一视角拍摄用户。", scenarios: ["拍摄", "翻译", "语音助手"], capabilities: ["相机", "音频", "小爱同学"], specs: { ...baseSpecs, "显示": "无" }, architecture: ["眼镜采集", "手机协同", "小米云服务"], tradeoffs: ["生态协同完整", "体验受地区与手机生态影响"], updatedAt: generatedAt, sources: [sources.xiaomi] },
  { id: "p-rokid-style", slug: "rokid-ai-style", brand: "Rokid", name: "AI Glasses Style", form: "audio", status: "shipping", heroImage: "/assets/products/rokid-ai-style.webp", officialUrl: "https://global.rokid.com/", positioning: "强调轻量、长时间拍摄与翻译会议能力的无显示眼镜。", audience: "会议、旅行和日常记录用户。", scenarios: ["会议纪要", "翻译", "拍摄"], capabilities: ["相机", "语音助手", "实时转写"], specs: { ...baseSpecs, "显示": "无" }, architecture: ["眼镜采集", "手机 App", "云端 AI"], tradeoffs: ["重量较低", "核心反馈依赖音频和手机"], updatedAt: generatedAt, sources: [sources.rokid] },
  { id: "p-rokid", slug: "rokid-glasses", brand: "Rokid", name: "Rokid Glasses", form: "display", status: "shipping", heroImage: "/assets/products/rokid-glasses.webp", officialUrl: "https://global.rokid.com/products/rokid-glasses", positioning: "将相机、AI 与 MicroLED 显示合并到日常眼镜形态。", audience: "需要翻译、提词、导航和视觉提示的用户。", scenarios: ["翻译字幕", "提词", "导航"], capabilities: ["MicroLED 显示", "相机", "语音交互"], specs: { ...baseSpecs, "显示": "MicroLED 光波导" }, architecture: ["眼镜显示感知", "手机协同", "云端模型"], tradeoffs: ["功能完整", "显示带来续航与适配成本"], updatedAt: generatedAt, sources: [sources.rokid] },
  { id: "p-rayneo", slug: "rayneo-x3-pro", brand: "RayNeo", name: "X3 Pro", form: "display", status: "shipping", heroImage: "/assets/products/rayneo-x3-pro.webp", officialUrl: "https://www.rayneo.com/pages/x3-pro-launch", positioning: "面向翻译、导航和 AR 应用的双目全彩轻显示眼镜。", audience: "开发者、旅行者和 AR 早期用户。", scenarios: ["彩色导航", "实时翻译", "AR 应用"], capabilities: ["双目全彩显示", "Gemini", "AIOS"], specs: { ...baseSpecs, "显示": "双目全彩 MicroLED 光波导" }, architecture: ["眼镜端系统", "Android/Unity SDK", "Gemini 云端能力"], tradeoffs: ["输出丰富", "系统和硬件复杂度较高"], updatedAt: generatedAt, sources: [sources.rayneo] },
  { id: "p-xreal", slug: "xreal-aura", brand: "XREAL", name: "AURA", form: "spatial", status: "announced", heroImage: "/assets/products/xreal-aura.webp", officialUrl: "https://www.xreal.com/us/aura", positioning: "基于 Android XR 的分体式空间计算眼镜。", audience: "需要大空间画布、生产力和沉浸内容的用户与开发者。", scenarios: ["空间办公", "娱乐", "AI 视觉"], capabilities: ["70° 视场角", "6DoF", "手势", "Gemini"], specs: { "显示": "Sony Micro-OLED 1920×1200/眼", "视场角": "70°", "刷新率": "最高 120Hz" }, architecture: ["眼镜端 X1S 协处理器", "计算盒 Reality Elite", "Android XR 与 Gemini"], tradeoffs: ["空间能力强", "需要线缆和计算盒"], updatedAt: generatedAt, sources: [sources.xreal, sources.android] },
  { id: "p-even", slug: "even-g2", brand: "Even Realities", name: "G2", form: "display", status: "shipping", heroImage: "/assets/products/even-g2.webp", officialUrl: "https://www.evenrealities.com/en-US/smart-glasses", positioning: "强调全天佩戴、对话提示与无相机隐私设计的显示眼镜。", audience: "会议、演讲和日常信息提示用户。", scenarios: ["对话提示", "提词", "通知"], capabilities: ["双目绿色显示", "Conversate", "翻译"], specs: { "显示": "双目 MicroLED 光波导", "分辨率": "640×350", "视场角": "27.5°" }, architecture: ["眼镜端轻显示", "手机 App", "上下文 AI"], tradeoffs: ["隐私与佩戴友好", "缺少相机视觉能力"], updatedAt: generatedAt, sources: [sources.even] },
  { id: "p-halliday", slug: "halliday-g2", brand: "Halliday", name: "G2", form: "display", status: "announced", heroImage: "/assets/products/halliday-g2.webp", officialUrl: "https://www.hallidayglobal.com/", positioning: "聚焦会议过程和实时对话辅助的无相机双目显示眼镜。", audience: "会议密集的专业用户。", scenarios: ["会议跟踪", "翻译", "提醒"], capabilities: ["双目显示", "四麦克风", "Meeting Flow"], specs: { "显示": "双目 MicroLED 光波导", "续航": "标称 12 小时", "防护": "IP54" }, architecture: ["眼镜音频显示", "手机应用", "会议 AI 服务"], tradeoffs: ["场景定位清晰", "高级会议能力依赖订阅"], updatedAt: generatedAt, sources: [sources.halliday] },
  { id: "p-solos", slug: "solos-airgo-v2", brand: "Solos", name: "AirGo V2", form: "audio", status: "shipping", heroImage: "/assets/products/solos-airgo-v2.webp", officialUrl: "https://solosglasses.com/", positioning: "模块化镜框与相机、音频 AI 能力组合的消费眼镜。", audience: "通话、拍摄和语音助手用户。", scenarios: ["视频拍摄", "即时翻译", "语音查询"], capabilities: ["16MP 相机", "开放式音频", "SolosChat"], specs: { ...baseSpecs, "显示": "无" }, architecture: ["可替换镜框", "手机应用", "云端 AI"], tradeoffs: ["镜框选择多", "缺少视觉输出"], updatedAt: generatedAt, sources: [sources.solos] },
  { id: "p-brilliant", slug: "brilliant-frame", brand: "Brilliant Labs", name: "Frame", form: "display", status: "developer-kit", heroImage: "/assets/products/brilliant-frame.webp", officialUrl: "https://brilliant.xyz/products/frame", positioning: "面向开发者和创客的开放式单眼显示 AI 眼镜。", audience: "希望访问固件、SDK 和传感数据的开发者。", scenarios: ["原型开发", "视觉问答", "提词"], capabilities: ["显示", "相机", "麦克风", "开放代码"], specs: { ...baseSpecs, "开发": "Lua / Python / Flutter" }, architecture: ["开放固件", "BLE 主机应用", "可替换 AI 服务"], tradeoffs: ["可扩展性强", "消费级完成度和维护要求较高"], updatedAt: generatedAt, sources: [sources.brilliant] },
  { id: "p-snap", slug: "snap-spectacles", brand: "Snap", name: "Spectacles", form: "spatial", status: "developer-kit", heroImage: "/assets/products/snap-spectacles.webp", officialUrl: "https://www.spectacles.com/", positioning: "以 Lens Studio 和空间 Lens 为核心的独立 AR 开发者眼镜。", audience: "AR 创作者和交互原型开发者。", scenarios: ["空间 Lens", "手势交互", "多人体验"], capabilities: ["全彩显示", "空间追踪", "手势"], specs: { ...baseSpecs, "开发": "Lens Studio" }, architecture: ["眼镜端 Snap OS", "Lens Studio", "Snap 云服务"], tradeoffs: ["开发工具成熟", "面向开发者且佩戴体积较大"], updatedAt: generatedAt, sources: [sources.snap] }
];

export const projects: GitHubProject[] = [
  { id: "repo-mentra", slug: "mentra-os", name: "MentraOS", owner: "Mentra-Community", repositoryUrl: "https://github.com/Mentra-Community/MentraOS", description: "跨品牌智能眼镜应用运行时、SDK 与应用商店。", status: "active", license: "MIT", languages: ["TypeScript", "Java", "Swift", "Kotlin", "C"], supportedDevices: ["Mentra Live", "Even G1/G2", "Vuzix Z100"], stars: 2000, latestRelease: "v2.10", lastCommitAt: "2026-07-30T00:00:00Z", difficulty: "intermediate", architecture: ["眼镜传感与显示", "手机 Mentra Runtime", "MiniApp SDK", "可选云端 AI", "字幕、翻译与应用输出"], productInsight: "用手机运行时统一不同硬件，可降低应用适配成本并保持眼镜轻量。" },
  { id: "repo-executorch", slug: "executorch", name: "ExecuTorch", owner: "pytorch", repositoryUrl: "https://github.com/pytorch/executorch", description: "面向移动、嵌入式与边缘设备的 PyTorch 端侧推理运行时。", status: "active", license: "BSD-3-Clause", languages: ["C++", "Python"], supportedDevices: ["Ray-Ban Meta", "Meta Ray-Ban Display", "Quest"], stars: 12000, latestRelease: "1.x", lastCommitAt: "2026-08-01T00:00:00Z", difficulty: "advanced", architecture: ["眼镜 SoC/NPU", "端侧运行时", "PyTorch 导出与后端", "模型发布流水线", "OCR、字幕与视觉理解"], productInsight: "端侧运行时把隐私、速度和功耗从模型问题变成可部署的产品能力。" },
  { id: "repo-frame", slug: "brilliant-frame-codebase", name: "frame-codebase", owner: "brilliantlabsAR", repositoryUrl: "https://github.com/brilliantlabsAR/frame-codebase", description: "Brilliant Labs Frame 的完整固件与设备代码。", status: "watch", license: "Open source", languages: ["C", "Lua", "Python"], supportedDevices: ["Brilliant Labs Frame"], stars: 477, lastCommitAt: "2025-10-05T00:00:00Z", difficulty: "advanced", architecture: ["nRF52/FPGA 与传感器", "BLE 主机连接", "Lua/消息 SDK", "主机或云端模型", "单眼显示与音频"], productInsight: "完整开放硬件代码能帮助理解低功耗设备如何把相机、显示和 BLE 组织成产品。" },
  { id: "repo-xrblocks", slug: "google-xrblocks", name: "xrblocks", owner: "google", repositoryUrl: "https://github.com/google/xrblocks", description: "用于快速构建 WebXR、手势和 AI 原型的轻量库。", status: "active", license: "Apache-2.0", languages: ["TypeScript"], supportedDevices: ["WebXR devices", "Android XR prototypes"], stars: 416, lastCommitAt: "2026-06-08T00:00:00Z", difficulty: "intermediate", architecture: ["XR 传感设备", "浏览器运行时", "WebXR 组件", "Gemini/LiteRT", "手势与空间内容"], productInsight: "Web 技术可缩短 AI+XR 交互验证周期，但最终眼镜仍受浏览器能力与性能限制。" },
  { id: "repo-snap", slug: "spectacles-sample", name: "Spectacles-Sample", owner: "Snapchat", repositoryUrl: "https://github.com/Snapchat/Spectacles-Sample", description: "早期 Spectacles 模板与示例集合，已迁移至新的 specs-devs 组织。", status: "migrated", license: "See repository", languages: ["JavaScript", "Lens Studio"], supportedDevices: ["Snap Spectacles"], stars: 230, lastCommitAt: "2025-12-01T00:00:00Z", difficulty: "beginner", architecture: ["Spectacles 硬件", "Snap OS", "Lens Studio", "Lens 云服务", "空间 Lens 输出"], productInsight: "项目价值在于历史示例和迁移线索，学习时应转向当前组织而非旧仓库。" },
  { id: "repo-openglass", slug: "based-openglass", name: "OpenGlass", owner: "BasedHardware", repositoryUrl: "https://github.com/BasedHardware/OpenGlass", description: "使用 ESP32-S3 和手机应用构建低成本相机 AI 眼镜的早期开源项目。", status: "migrated", license: "MIT", languages: ["C", "TypeScript", "C++"], supportedDevices: ["DIY ESP32-S3 glasses"], stars: 4000, lastCommitAt: "2024-08-01T00:00:00Z", difficulty: "intermediate", architecture: ["ESP32 相机模组", "React Native 手机应用", "图像与音频传输", "Ollama/OpenAI 服务", "语音或手机输出"], productInsight: "低成本原型清楚展示了眼镜采集、手机计算和云模型的最小链路；当前维护已迁往 Omi。" }
];

export const signals: FrontierSignal[] = [
  { id: "signal-glimmer", title: "Jetpack Compose Glimmer 面向透明显示建立新 UI 规则", summary: "黑色在光学透明显示中相当于透明，界面需要围绕短文本、对比度与扫读重新设计。", category: "显示交互", maturity: "developer-preview", date: "2026-05-19", source: sources.androidDp4, productSlugs: ["xreal-aura"], projectSlugs: ["google-xrblocks"], impact: 94 },
  { id: "signal-egocentric", title: "第一视角多模态模型开始拥有专用评测集", summary: "研究重点从通用图片问答转向对象关注、连续环境与外部知识检索。", category: "多模态 AI", maturity: "research", date: "2026-02-26", source: sources.superglasses, productSlugs: ["ray-ban-meta", "xiaomi-ai-glasses"], projectSlugs: ["executorch"], impact: 91 },
  { id: "signal-event-camera", title: "事件相机与事件唤醒降低眼镜端持续感知功耗", summary: "仅处理变化像素并按事件启动 SoC，可显著延长小电池设备的端侧推理时间。", category: "传感与功耗", maturity: "research", date: "2026-06-05", source: sources.openglassPaper, productSlugs: ["brilliant-frame"], projectSlugs: [], impact: 88 },
  { id: "signal-split", title: "分体计算成为大视场角空间眼镜的现实路线", summary: "眼镜端承担低延迟显示与追踪，计算盒或手机承担生成式 AI 与空间应用。", category: "系统架构", maturity: "announced", date: "2026-07-15", source: sources.xreal, productSlugs: ["xreal-aura"], projectSlugs: [], impact: 86 },
  { id: "signal-on-device", title: "端侧 OCR、字幕与翻译进入量产眼镜", summary: "模型运行时开始直接影响延迟、隐私、断网体验和电池分配。", category: "端侧 AI", maturity: "shipping", date: "2025-11-21", source: sources.meta, productSlugs: ["ray-ban-meta", "meta-ray-ban-display"], projectSlugs: ["executorch"], impact: 84 },
  { id: "signal-cross-runtime", title: "跨品牌眼镜运行时尝试统一硬件差异", summary: "应用在手机运行时中共享眼镜连接，让字幕、翻译和 Agent 同时工作。", category: "开发生态", maturity: "shipping", date: "2026-04-16", source: sources.github, productSlugs: ["even-g2"], projectSlugs: ["mentra-os"], impact: 79 }
];

export const learningNodes: LearningNode[] = [
  { id: "stage-1-form-factors", stage: 1, title: "先分清三种产品形态", question: "无显示、轻显示与空间计算眼镜分别解决什么问题？", summary: "从输出方式、全天佩戴和计算位置建立产品边界。", durationMinutes: 18, prerequisites: [], productSlugs: ["ray-ban-meta", "even-g2", "xreal-aura"], outcomes: ["判断产品形态", "解释形态与场景的关系"] },
  { id: "stage-1-users", stage: 1, title: "从目标用户看产品", question: "同样叫 AI 眼镜，为什么服务的人完全不同？", summary: "比较记录、会议、旅行、辅助与空间生产力用户。", durationMinutes: 16, prerequisites: ["stage-1-form-factors"], productSlugs: ["xiaomi-ai-glasses", "halliday-g2"], outcomes: ["识别目标用户", "区分核心与展示场景"] },
  { id: "stage-1-capability-map", stage: 1, title: "建立能力地图", question: "拍摄、理解、显示与行动如何组合成产品？", summary: "用输入、理解、输出和行动四层整理能力。", durationMinutes: 20, prerequisites: ["stage-1-users"], productSlugs: ["rayneo-x3-pro", "rokid-glasses"], outcomes: ["绘制能力地图"] },
  { id: "stage-2-journey", stage: 2, title: "拆解全天用户旅程", question: "眼镜从戴上到摘下会在哪些环节失败？", summary: "关注唤醒、连接、反馈、中断、充电和社交接受度。", durationMinutes: 22, prerequisites: ["stage-1-capability-map"], productSlugs: ["ray-ban-meta", "even-g2"], outcomes: ["识别体验断点"] },
  { id: "stage-2-interaction", stage: 2, title: "声音、触控与轻显示", question: "哪种反馈适合哪种信息？", summary: "比较语音、镜腿触控、手势、字幕和短提示。", durationMinutes: 20, prerequisites: ["stage-2-journey"], productSlugs: ["rayneo-x3-pro", "halliday-g2"], outcomes: ["选择交互通道"] },
  { id: "stage-2-privacy", stage: 2, title: "隐私提示与社会接受", question: "相机和持续感知如何影响真实使用？", summary: "从指示灯、无相机设计、数据边界和公共场景评估产品。", durationMinutes: 18, prerequisites: ["stage-2-interaction"], productSlugs: ["ray-ban-meta", "even-g2"], outcomes: ["评估隐私边界"] },
  { id: "stage-3-ai-stack", stage: 3, title: "感知到 Agent 的 AI 链路", question: "眼镜如何理解用户看到和听到的世界？", summary: "拆解 ASR、VLM、检索、记忆、Agent 与端云协同。", durationMinutes: 28, prerequisites: ["stage-2-privacy"], productSlugs: ["ray-ban-meta", "xiaomi-ai-glasses"], outcomes: ["画出 AI 数据流"] },
  { id: "stage-3-software-stack", stage: 3, title: "操作系统、SDK 与应用", question: "硬件能力如何开放给开发者？", summary: "比较 Android XR、Lens Studio、品牌 SDK 与跨设备运行时。", durationMinutes: 26, prerequisites: ["stage-3-ai-stack"], productSlugs: ["xreal-aura", "snap-spectacles"], outcomes: ["判断生态开放度"] },
  { id: "stage-3-hardware", stage: 3, title: "硬件与结构取舍", question: "重量、续航、显示和算力为什么互相牵制？", summary: "理解芯片、相机、麦克风、光学、电池、散热和连接。", durationMinutes: 30, prerequisites: ["stage-3-software-stack"], productSlugs: ["xreal-aura", "rokid-glasses"], outcomes: ["解释关键硬件代价"] },
  { id: "stage-4-judgement", stage: 4, title: "从参数回到产品价值", question: "参数更高是否等于产品更好？", summary: "把技术参数还原为用户收益、失败模式和成本。", durationMinutes: 24, prerequisites: ["stage-3-hardware"], productSlugs: ["even-g2", "rayneo-x3-pro"], outcomes: ["识别营销参数", "形成产品判断"] },
  { id: "stage-4-comparison", stage: 4, title: "统一八维横评", question: "如何公平比较不同形态的眼镜？", summary: "按用户、场景、能力、交互、佩戴、智能、边界和生态比较。", durationMinutes: 32, prerequisites: ["stage-4-judgement"], productSlugs: ["ray-ban-meta", "even-g2", "xreal-aura"], outcomes: ["完成跨形态横评"] },
  { id: "stage-4-signals", stage: 4, title: "长期信号与短期噪音", question: "什么变化真正会改变产品路线？", summary: "从量产状态、生态、技术成熟度和用户行为区分趋势与热度。", durationMinutes: 22, prerequisites: ["stage-4-comparison"], productSlugs: ["meta-ray-ban-display", "xreal-aura"], outcomes: ["判断前沿信号质量"] }
];

export const weekly: Array<WeeklyDigest & { title: string; sections: Array<{ title: string; body: string }> }> = [{
  isoWeek: "2026-W31", generatedAt, thesis: "AI 眼镜的竞争正在从单项硬件参数转向端侧 AI、系统平台与全天佩戴的共同优化。",
  title: "第 31 周：平台开始定义眼镜形态", signalIds: ["signal-glimmer", "signal-egocentric", "signal-split"],
  contentIds: ["content-android-xr-dp4", "content-meta-executorch", "content-xreal-aura"],
  sections: [
    { title: "长期信号", body: "Android XR 的形态分类和端侧运行时说明平台层正在成熟，开发者入口比单一硬件发布更值得持续观察。" },
    { title: "短期噪音", body: "单次发布会的参数对比热度很高，但交付状态、SDK 可用性和真实续航仍需后续证据。" },
    { title: "下周学习", body: "先完成“感知到 Agent 的 AI 链路”，再比较 Ray-Ban Meta 与 Even G2 的输入输出取舍。" }
  ]
}];

export const seedDataset: SnapshotDataset = { generatedAt, contents, products, productCandidates: [], projects, signals, learningNodes, weekly };
