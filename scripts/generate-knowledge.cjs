const fs = require('fs');
const path = require('path');

const MODELS = ['Qwen Plus','Qwen2.5-7B','Qwen2.5-14B','通义千问','DeepSeek-V3','DeepSeek-R1','DeepSeek-Coder','Kimi-K2.5','豆包 Seed-Lite','智谱 GLM-5','GPT-4o','Claude 3.5 Sonnet','Gemini 2.0','Llama 3.1-70B','Agnes-2.0-Flash','硅基流动'];
const ABILITIES = ['自然语言理解','逻辑推理','代码生成','代码调试','长文档理解','摘要','多轮对话','角色扮演','数学计算','翻译润色','创意写作','结构化输出','表格生成','JSON输出','文本分类','情感分析'];
const SCENES = ['日常办公','邮件撰写','会议纪要','报告整理','内容创作','推文撰写','营销文案','编程辅助','代码生成','错误排查','函数解释','学习辅导','数据分析','报表生成','翻译润色','中译英'];
const ROLES = ['资深前端工程师','资深后端工程师','全栈开发专家','数据科学家','AI工程师','产品经理','资深文案','技术面试官','学习规划师','英语翻译专家','架构师','财务顾问'];
const TASKS = ['重构一段代码并解释改动','把长文本提炼为3个要点','写一篇产品推广推文','修正代码中的潜在bug','通俗解释一个复杂概念','为初学者编写学习路径','给出同一问题的3种解法','翻译一段中文对话','基于数据生成分析报告','设计系统的模块划分'];
const CONTEXTS = ['项目使用React + TypeScript + Vite','团队采用敏捷开发','用户是产品经理','用户是学生','项目基于Node.js后端 + React前端','代码库存在一定历史遗留','使用Git做版本管理','用户对性能有较高要求','部署在GitHub Pages','用户是非技术人员'];
const FORMATS = ['Markdown标题+分点列表','JSON对象','分段落自然语言','表格形式','倒金字塔结构','问题-分析-建议三段式'];
const TONES = ['专业严谨','友好亲切','简洁直接','活泼有趣','正式书面','口语化','教学风格','鼓励性'];
const LANGS = ['JavaScript','TypeScript','Python','Go','Rust','Java','C++','SQL','HTML','CSS'];
const CONCEPTS = [
  {term:'闭包Closure',expl:'函数及其词法环境的组合，内部函数可访问外部函数的变量，即使外部函数已执行完毕。'},
  {term:'Promise/async-await',expl:'异步编程的两种主要写法，Promise封装异步操作的结果，async-await以同步写法表达异步逻辑。'},
  {term:'HTTP状态码',expl:'2xx成功、3xx重定向、4xx客户端错误、5xx服务端错误；常见200/301/400/401/403/404/500/502/503。'},
  {term:'RESTful API',expl:'基于HTTP动词和资源路径的接口设计风格，强调无状态、可缓存、统一接口。'},
  {term:'时间复杂度Big O',expl:'衡量算法效率的指标，常见O(1)/O(log n)/O(n)/O(n log n)/O(n²)/O(2ⁿ)。'},
  {term:'递归',expl:'函数调用自身解决问题，必须包含基准条件和递归步骤；优点代码简洁，缺点栈溢出风险。'},
  {term:'动态规划DP',expl:'把复杂问题分解为重叠子问题，通过保存子问题结果避免重复计算。'},
  {term:'哈希表Map',expl:'通过哈希函数将key映射到数组下标，平均O(1)查找；冲突处理常见链地址法、开放寻址法。'},
  {term:'Git工作流',expl:'常见Git Flow：master/dev/feature/release/hotfix分支模型；简化流程常用主干开发+feature分支。'},
  {term:'CSS Flexbox',expl:'一维布局方案，通过flex-direction、justify-content、align-items控制子元素排列。'},
  {term:'CSS Grid',expl:'二维布局方案，定义行列后子元素可以精确放置到网格单元中。'},
  {term:'React Hooks',expl:'useState管理本地状态、useEffect处理副作用、useMemo/useCallback做性能优化、useRef保存引用。'},
  {term:'虚拟DOM',expl:'用JS对象描述真实DOM树，更新时通过diff算法计算最小变更集合，再批量patch到真实DOM。'},
  {term:'SSR/SSG/CSR',expl:'服务端渲染、静态站点生成、客户端渲染；区别在于HTML生成的时机和位置，影响首屏速度和SEO。'},
  {term:'数据库索引',expl:'类似书籍目录，加速WHERE/JOIN查询；B+Tree适合范围查询、Hash适合等值查询。'},
  {term:'SQL注入',expl:'把用户输入直接拼入SQL语句导致的安全漏洞；防御：参数化查询、ORM、输入校验、最小权限。'},
  {term:'JWT',expl:'JSON Web Token三段式结构，服务端不保存状态，由客户端每次请求携带。'},
  {term:'Docker容器',expl:'基于镜像的轻量级虚拟化技术，提供一致的开发/测试/生产环境，与宿主机共享内核。'},
  {term:'CI/CD',expl:'持续集成：代码变更自动构建测试；持续部署：通过流水线自动发布到生产。'},
  {term:'函数式编程',expl:'强调纯函数、不可变数据、函数是一等公民；核心概念map、filter、reduce、compose。'},
  {term:'进程vs线程',expl:'进程是资源分配的最小单位，线程是CPU调度的最小单位；一个进程可包含多个线程，共享进程内存空间。'},
  {term:'死锁',expl:'多进程/线程互相等待对方持有的资源而都无法继续；产生条件互斥/占有并请求/不剥夺/循环等待。'},
  {term:'CAP定理',expl:'分布式系统中一致性、可用性、分区容错性三者不可兼得，实际系统通常在CP和AP之间权衡。'},
  {term:'Redis缓存',expl:'内存数据库，常用作缓存、消息队列、排行榜、计数器；支持字符串、哈希、列表、集合、有序集合等数据结构。'},
  {term:'负载均衡',expl:'将请求分发到多个后端实例，提高可用性和吞吐量；常见轮询、加权轮询、IP Hash、最少连接。'},
  {term:'微服务',expl:'将单体应用按业务拆分，每个服务独立部署、独立数据库、独立技术栈；优点灵活扩展，缺点复杂度上升。'},
  {term:'节流vs防抖',expl:'节流throttle：高频事件固定间隔执行一次；防抖debounce：停止触发一段时间后执行一次。'},
  {term:'前端性能优化',expl:'代码分割、懒加载、图片优化、HTTP缓存、CDN、Tree Shaking、减少重排重绘。'},
  {term:'WebSocket',expl:'全双工通信协议，客户端与服务端建立长连接后可互发消息，适合实时聊天、推送通知。'},
  {term:'XSS/CSRF',expl:'XSS是跨站脚本注入恶意代码；CSRF是冒用已登录用户身份发起请求；防御转义输出、HttpOnly Cookie、CSRF Token。'},
];
const AITERMS = [
  {term:'LLM大语言模型',expl:'通过海量文本预训练的神经网络，能够理解和生成自然语言，典型代表GPT、Qwen、DeepSeek。'},
  {term:'Transformer',expl:'2017年论文Attention is All You Need提出的架构，核心是自注意力机制，成为现代大模型的基础。'},
  {term:'Prompt提示词',expl:'用户输入给模型的文本，用来引导模型输出；提示工程是一门设计提示词的艺术。'},
  {term:'Token',expl:'大模型处理文本的基本单位，中文大约0.75字=1 token；API调用计费和上下文窗口都以token衡量。'},
  {term:'RAG检索增强生成',expl:'把外部知识库检索到的文档片段拼入prompt，让模型基于可靠内容回答问题，解决时效性和幻觉问题。'},
  {term:'Fine-tuning微调',expl:'在预训练模型基础上用领域数据继续训练，适配特定任务；相比RAG更深入但成本更高。'},
  {term:'Chain of Thought思维链',expl:'让模型先写出推理步骤再给出答案，显著提升复杂推理任务准确率。'},
  {term:'Agent智能体',expl:'能自主规划、调用工具、观察结果、循环执行的AI系统；核心能力计划、工具调用、记忆、反思。'},
  {term:'Function Calling工具调用',expl:'模型按指定JSON Schema生成工具调用参数，由宿主程序执行后把结果回传模型。'},
  {term:'Embedding向量检索',expl:'把文本编码为高维向量，通过向量相似度实现语义搜索；是RAG系统中检索阶段的核心技术。'},
  {term:'Temperature温度',expl:'控制模型输出随机性的参数；0接近确定性回答，1更有创造力；事实性问答调低、创意写作调高。'},
  {term:'Hallucination幻觉',expl:'模型输出看似合理但实际错误的内容；RAG、降低temperature、要求引用来源都是减轻幻觉的方法。'},
  {term:'Context Window上下文窗口',expl:'模型单次能处理的最大token数；如Qwen Plus约128K、Kimi可达256K。'},
  {term:'推理Inference',expl:'使用已训练好的模型生成结果的过程，区别于训练Training；推理优化技术KV Cache、量化、Speculative Decoding。'},
  {term:'模型量化Quantization',expl:'把模型权重从FP16/FP32降低到INT8/INT4，显著减少显存占用和推理延迟，精度损失可控。'},
  {term:'多模态Multimodal',expl:'同时处理文本、图像、音频、视频等多种输入输出的模型；如GPT-4o、Gemini都支持图像理解。'},
  {term:'API Key',expl:'访问云端大模型API的凭证，类似密码；需妥善保管，一旦泄露应立即在控制台撤销并重新生成。'},
  {term:'OpenAI兼容格式',expl:'大模型服务普遍采用与OpenAI一致的请求/响应格式chat.completions，便于切换模型而不需改动业务代码。'},
  {term:'本地部署模型',expl:'将开源大模型下载到本地服务器或个人电脑上运行，数据不出内网，适合隐私敏感场景。'},
  {term:'LangChain',expl:'流行的LLM应用开发框架，封装prompt模板、链式调用、Agent工具链、向量检索集成等通用能力。'},
  {term:'向量数据库',expl:'存储embedding向量并支持高效相似度查询的数据库，代表Milvus、Weaviate、pgvector。'},
  {term:'MoE混合专家模型',expl:'一个大模型由多个专家组成，每次前向只激活少量专家，在巨大参数量下保持可接受的推理成本。'},
  {term:'System Prompt',expl:'对话开始前给模型的指令文本，定义模型角色、语气、输出规范、约束条件；通常对整段对话持续生效。'},
  {term:'流式输出Streaming',expl:'模型一边生成一边返回token，用户体验更好；实现基于SSE Server-Sent Events或chunked transfer。'},
  {term:'结构化输出',expl:'强制模型输出符合JSON Schema定义的数据结构，是Agent可靠调用工具的前提。'},
  {term:'提示词注入Prompt Injection',expl:'攻击者通过构造恶意输入绕过系统提示词的约束；防御隔离用户输入、输出过滤、结构化指令。'},
];
const ALGOS = ['两数之和','反转链表','二叉树层序遍历','LRU缓存','快速排序','归并排序','二分查找','滑动窗口','回溯Backtracking','动态规划DP','BFS广度优先','DFS深度优先','拓扑排序','并查集','最小生成树','最短路径Dijkstra','Trie字典树','堆Heap','哈希冲突','字符串匹配KMP','前缀和与差分'];
const MLBASICS = ['监督学习','无监督学习','半监督学习','强化学习RL','过拟合vs欠拟合','梯度下降GD','损失函数Loss','学习率Learning Rate','批量大小Batch Size','正则化Regularization','归一化Normalization','Dropout','激活函数','CNN卷积网络','词嵌入Word Embedding','迁移学习Transfer Learning','评估指标','交叉验证K-Fold','特征工程','集成学习Ensemble','数据增强'];
const TIPS = ['学习新技术的5步法','遇到报错怎么办','写好代码的10条建议','快速看懂陌生代码库','Git常用清单','键盘快捷键提升效率','给初学者的编程建议','调试的艺术','时间管理与学习节奏','如何提问才能得到好回答'];
const QUESTIONS = ['为什么大模型会"幻觉"','RAG和微调哪个更好','大模型能处理多长的文本','本地部署模型需要什么硬件','怎么让模型输出严格JSON格式','为什么同样的问题每次回答不一样','Context Window越大越好吗','LLM和传统搜索有什么本质区别','大模型怎么保证数据安全','怎么评估模型回答质量','大模型能否替代程序员','API Key应该存在哪','怎么设计一个好用的Prompt','为什么模型突然答非所问','怎么让模型记住对话历史','Temperature设置多少合适','开源模型和商业模型该怎么选'];
const CATEGORIES = [
  {key:'大模型介绍',weight:15},{key:'提示词技巧',weight:15},{key:'编程知识',weight:15},
  {key:'算法与数据结构',weight:10},{key:'AI行业知识',weight:10},{key:'机器学习基础',weight:10},
  {key:'前端开发',weight:5},{key:'后端与系统',weight:5},{key:'实用技巧',weight:8},{key:'学习方法',weight:4}
];

function makeSeededRand(seed){let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;}}
function pick(arr,r){return arr[Math.floor(r()*arr.length)]}
function weightedPick(items,r){const total=items.reduce((s,i)=>s+i.weight,0);let x=r()*total;for(const it of items){x-=it.weight;if(x<=0)return it;}return items[0];}

function pickCategory(r){return weightedPick(CATEGORIES,r).key}

function main(){
  const TOTAL=100000;
  console.log(`[开始] 生成 ${TOTAL} 条知识条目...`);
  const startTime=Date.now();
  const rand=makeSeededRand(20240619);
  const entries=[];

  for(let i=0;i<TOTAL;i++){
    const category=pickCategory(rand);
    const rType=rand();
    let title,content,tags;

    if(rType<0.15){
      const model=pick(MODELS,rand),ab1=pick(ABILITIES,rand),ab2=pick(ABILITIES,rand),ab3=pick(ABILITIES,rand),sc=pick(SCENES,rand);
      title=`${model} · 能力画像与推荐场景`;
      content=`【模型简介】\n${model}是一款在实际项目中被广泛使用的大语言模型，覆盖对话、代码、分析等多种任务。\n\n【核心能力3项】\n1. ${ab1}：模型在这方面表现稳定，适合直接上手使用\n2. ${ab2}：配合合适的提示词结构，能输出高质量结果\n3. ${ab3}：对上下文信息的整合和引用能力优秀\n\n【推荐应用场景】\n- ${sc}：在此场景下输出质量和速度表现较好\n- 需要灵活角色设定的多轮对话\n- 结合外部知识库RAG的问答系统\n\n【使用建议】\n- 先用默认temperature约0.7，根据输出效果微调\n- 长文本任务优先选择上下文窗口更大的模型\n- 对答案一致性要求高时，降低temperature至0.3-0.5\n- 重要结果加入事实校验或引用来源`;
      tags=[model.split(' ')[0],'模型介绍','场景推荐'];
    }else if(rType<0.30){
      const role=pick(ROLES,rand),task=pick(TASKS,rand),ctx=pick(CONTEXTS,rand),fmt=pick(FORMATS,rand),tone=pick(TONES,rand);
      title=`提示词模板 #${i+1}：${role} · ${tone}风格`;
      content=`【适用场景】\n当你希望模型以"${role}"的身份、保持"${tone}"的语气处理任务时，可以以此模板为基础。\n\n【完整模板】\n你是一名${role}。请帮我完成以下任务：\n\n**任务**：${task}\n**背景**：${ctx}\n**约束**：\n- 输出格式：${fmt}\n- 语气：${tone}\n\n请严格按照要求输出。\n\n【关键设计点】\n1. 明确角色：告诉模型它的身份，约束输出的专业度和语气\n2. 结构化指令：任务、背景、约束分条列出，模型更容易遵循\n3. 输出格式：明确格式要求，方便后续程序化消费\n\n【变体技巧】\n- 要求越高如法律/医疗场景，temperature越低\n- 想让模型发挥创造力，适当提升至1.0+\n- 输出较长时加入字数上限，避免无限生成`;
      tags=['Prompt','提示工程','模板',role];
    }else if(rType<0.45){
      const c=pick(CONCEPTS,rand),lang=pick(LANGS,rand);
      title=`概念解析：${c.term}（${lang}视角）`;
      content=`【是什么】\n${c.expl}\n\n【在${lang}中的典型应用】\n- 日常开发中遇到这个概念的频率：中高频\n- 与语言特性和标准库结合时的使用方式\n- 面试和代码评审中经常被关注的点\n\n【常见误区】\n1. 只了解表面用法，忽视底层原理\n2. 忽略边界条件和空值处理\n3. 不考虑性能和复杂度就直接使用\n4. 忽略团队代码风格和已有实现\n\n【学习建议】\n- 至少动手写3个小demo验证理解\n- 读一份高质量实现源码如语言标准库或知名开源库\n- 尝试给别人讲解一遍，看能否讲清楚\n- 在真实项目代码中刻意寻找应用场景`;
      tags=[c.term.split(' ')[0].replace(/[()（）]/g,''),lang,'编程概念'];
    }else if(rType<0.55){
      const a=pick(ALGOS,rand);
      title=`算法精讲：${a}`;
      content=`【主题】${a}\n\n【核心思想】\n理解一种算法，关键在于理解它"解决什么问题、核心思路是什么、代价如何"，而不是上来就背代码。\n\n【复杂度分析】\n- 关注最坏情况，面试常问\n- 空间复杂度同样重要，尤其是递归的栈空间\n- 很多算法有"平均vs最坏"的显著差异\n\n【推荐学习方式】\n1. 先理解核心思想，不用背代码\n2. 在纸上或白板上手动推演一遍小规模输入\n3. 写代码：每写完一段就验证一下，不要整段写完再调试\n4. 做2-3道相关题目，观察同一思想在不同题中的变形\n5. 隔一周再回来做一遍，检验是否真正记住\n\n【常见套路】\n- 看到"有序数组"→二分/双指针\n- 看到"子数组/子串+最值"→滑动窗口/前缀和\n- 看到"所有可能"→回溯/DP\n- 看到"最短路/最少步数"→BFS/DP`;
      tags=['算法',a.split(' ')[0],'数据结构','面试'];
    }else if(rType<0.65){
      const t1=pick(AITERMS,rand),t2=pick(AITERMS,rand);
      title=`AI术语速查：${t1.term} vs ${t2.term}`;
      content=`【${t1.term}】\n${t1.expl}\n\n【${t2.term}】\n${t2.expl}\n\n【两者关系与区别】\n- 前者关注工程与应用层面\n- 后者关注模型架构与能力层面\n- 两者在实际项目中常常同时出现，互为支撑\n\n【记忆要点】\n- 第一次接触某个术语时，用"它解决什么问题→核心思路→典型应用"三段法记住\n- 听到新术语立刻在手机或笔记中记下，当天花5分钟查一下\n- 同一领域内的术语是相关的，画一张概念关系图能大幅降低记忆负担\n\n【延伸阅读方向】\n- 官方文档原始定义\n- 高质量博客文章\n- 实战项目中的使用案例`;
      tags=['AI','术语',t1.term.split(' ')[0],t2.term.split(' ')[0]];
    }else if(rType<0.75){
      const m=pick(MLBASICS,rand);
      title=`机器学习基础：${m}`;
      content=`【概念】${m}\n\n【为什么重要】\n- 是理解更高级主题的前置知识\n- 在项目选型和方案评审中频繁出现\n- 技术面试高频考点\n- 阅读技术文章和论文时的基本词汇\n\n【直觉理解】\n用一个生活中的类比帮助记忆：\n- 把模型想象成一个"学习机器"，它通过"经验"数据改进表现\n- 损失函数是它"做得有多差"的量化指标\n- 梯度下降是它"如何改进"的方向\n- 正则化是防止它"死记硬背"过拟合的手段\n\n【实战中的注意事项】\n- 数据质量>>模型复杂度\n- 不要在未理解数据分布的情况下就调模型\n- baseline很重要：先实现一个简单方案再逐步升级\n- 始终关注：训练集指标、验证集指标、测试集指标、线上指标的差距`;
      tags=['机器学习',m.split(' ')[0],'基础概念'];
    }else if(rType<0.83){
      const t=pick(TIPS,rand);
      title=`实用指南：${t}`;
      content=`【主题】${t}\n\n这是一个在日常工作和学习中频繁遇到的话题。掌握正确的方法，比盲目投入时间更有效。\n\n【核心建议】\n1. 先理解问题本质，不要上来就找答案\n2. 建立自己的checklist：遇到同类问题时按清单逐项排查\n3. 记录你的发现：下次遇到类似问题就是你的个人知识库\n4. 与他人交流：讲一遍给别人听，你会发现自己理解的漏洞\n5. 定期复盘：什么方法有效、什么是浪费时间，形成个人方法论\n\n【常见误区】\n- ❌ 只收藏不阅读：收藏夹不等于掌握\n- ❌ 追求一次完美：先跑通再优化是工程界的金科玉律\n- ❌ 闭门造车：看看别人怎么解决类似问题，你不是第一个遇到的人\n\n【下一步行动】\n从上述建议中选一条你最有共鸣的，本周内刻意应用，两周后回顾效果。`;
      tags=['效率','学习方法','实用技巧',t.split(' ')[0]];
    }else if(rType<0.90){
      const m1=pick(MODELS,rand),m2=pick(MODELS,rand);
      title=`模型对比：${m1} vs ${m2}`;
      content=`【对比背景】\n${m1}与${m2}都是当前可用的主流大模型，但在能力侧重、响应速度、成本、使用方式上各有不同。\n\n【维度一：核心能力对比】\n- 中文理解：两者都能处理中文，但${m1}在某些特定领域细节上表现更好\n- 代码生成：两者都支持，但${m2}在复杂代码任务中通常更稳定\n- 长文档处理：两者都支持较广的上下文，具体看模型参数\n- 推理能力：根据公开评测结果有差异，建议自行测试实际任务\n\n【维度二：工程与成本】\n- 调用成本：取决于具体平台计费，建议查看各平台控制台\n- 响应速度：日常对话均可接受；复杂任务建议选择更强模型\n- API稳定性：主流平台均已进入稳定阶段\n- 是否支持流式输出：大多数平台均支持\n\n【最终建议】\n- 不存在"一个模型解决所有问题"的银弹\n- 建议至少准备2-3个模型作为主备\n- 在真实业务数据上做A/B测试，比看评测更有参考价值\n- 关注模型更新：大模型迭代很快，半年后同一个模型可能已不同`;
      tags=['模型对比',m1.split(' ')[0],m2.split(' ')[0],'选型'];
    }else if(rType<0.96){
      const q=pick(QUESTIONS,rand);
      title=`常见问题：${q}`;
      content=`【问题】${q}\n\n【核心解答】\n这是一个在LLM应用开发中非常典型的问题。本质上它涉及以下几个层面：\n\n1. 理解限制：大模型不是知识库，它的知识有截止日期，且可能对长尾、冷门信息了解不足\n2. 工程弥补：通过RAG、工具调用、结构化输出约束等工程手段，可以显著提升可靠性\n3. 合理预期：理解模型能做什么、不能做什么，比盲目追求"更聪明的模型"更有价值\n\n【实用建议】\n- 先在小规模验证方案可行，再扩大到全量\n- 监控线上效果，建立人工抽检+指标监控的双重机制\n- 关键决策场景永远保留"人工复核"环节\n- 好的系统设计，应该让模型的优势发挥、弱点被工程弥补\n\n【相关主题】\n- 评估体系：怎么量化"回答质量"\n- 失败模式：常见问题及修复路径\n- Prompt优化：同一问题，换种问法可能结果完全不同\n- 成本/效果权衡：是否真的需要最贵的模型`;
      tags=['FAQ',q.split('？')[0].split('？')[0],'问答'];
    }else{
      const sc=pick(SCENES,rand),md=pick(MODELS,rand),rl=pick(ROLES,rand);
      title=`场景实战：用${md}处理${sc}任务`;
      content=`【场景描述】\n${sc}是日常工作中高频出现的任务类型，适合用大模型辅助。\n\n【推荐工作流】\n1. 准备材料：把相关背景、数据、示例整理好\n2. 设定角色：以"${rl}"的身份要求模型，提升专业度\n3. 结构化指令：明确目标、输入、输出格式、约束条件\n4. 初步结果：让模型先出草稿，不要追求一次完美\n5. 人机协作：你在模型输出的基础上做精修和判断\n6. 保存模板：效果好的prompt保存下来复用\n\n【在${md}上的实践经验】\n- 先从低temperature开始，需要创意时再调高\n- 长输入任务注意上下文窗口上限\n- 如果结果不理想，先改进prompt再考虑换模型\n- 结构化输出要求明确字段定义，便于程序化消费\n\n【常见坑】\n- ❌ 一次性给太多要求，模型顾此失彼\n- ❌ 只看一次输出就下结论，多试几次效果差异可能很大\n- ❌ 不做事实校验就直接使用，尤其涉及数字、引用、法律条款\n- ✅ 建立自己的"好用prompt库"，积累长期资产`;
      tags=[sc,'最佳实践',md.split(' ')[0],'工作流'];
    }

    const now=Date.now()-(TOTAL-i)*10;
    entries.push({id:`k-ext-${i+1}`,title,content,category,tags,createdAt:now,updatedAt:now});
    if((i+1)%10000===0)console.log(`  已生成 ${i+1}/${TOTAL} (${Math.round((i+1)/TOTAL*100)}%)`);
  }

  const outDir=path.join(__dirname,'..','public','knowledge');
  if(!fs.existsSync(outDir))fs.mkdirSync(outDir,{recursive:true});

  // 分块：每块 5000 条，共 20 个文件
  const CHUNK_SIZE = 5000;
  const numChunks = Math.ceil(entries.length / CHUNK_SIZE);

  console.log(`[分块] 生成 ${numChunks} 个数据文件，每块 ${CHUNK_SIZE} 条`);
  for(let c=0;c<numChunks;c++){
    const slice = entries.slice(c*CHUNK_SIZE,(c+1)*CHUNK_SIZE);
    // 简化结构：只保留必要字段，减小体积
    // chunk文件保留完整内容，供对话时使用；标题索引（titles.json）仅展示用
    const compact = slice.map(e=>({i:e.id,t:e.title,s:e.content,c:e.category,g:(e.tags||[]).slice(0,3)}));
    const chunkPath = path.join(outDir,`chunk-${c.toString().padStart(2,'0')}.json`);
    fs.writeFileSync(chunkPath,JSON.stringify(compact));
    if(c===0 || (c+1)%5===0)console.log(`  写入 chunk-${c.toString().padStart(2,'0')}: ${slice.length} 条`);
  }

  // 元数据：标题索引（用于列表展示、搜索）
  console.log(`[索引] 生成标题索引...`);
  const titleIndex = entries.map((e,i)=>({i:e.id,t:e.title,c:e.category,g:e.tags[0]||''}));
  fs.writeFileSync(path.join(outDir,'titles.json'),JSON.stringify(titleIndex));

  // 分类索引
  const catIndex = {};
  CATEGORIES.forEach(c=>{catIndex[c.key]=[];});
  entries.forEach((e,i)=>{
    if(!catIndex[e.category])catIndex[e.category]=[];
    catIndex[e.category].push(i);
  });
  fs.writeFileSync(path.join(outDir,'categories.json'),JSON.stringify(catIndex));

  // 总索引文件
  const manifest = {
    total: entries.length,
    chunkSize: CHUNK_SIZE,
    numChunks,
    generatedAt: new Date().toISOString(),
    categories: CATEGORIES.map(c=>c.key),
    files: Array.from({length:numChunks},(_,i)=>`chunk-${i.toString().padStart(2,'0')}.json`)
  };
  fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(manifest,null,2));

  // 计算总大小
  let totalBytes=0;
  fs.readdirSync(outDir).forEach(f=>{totalBytes+=fs.statSync(path.join(outDir,f)).size;});
  const elapsed=((Date.now()-startTime)/1000).toFixed(1);
  console.log(`[完成] 共 ${entries.length} 条 / ${numChunks} 个数据文件, 总计 ${(totalBytes/1024/1024).toFixed(2)} MB, 耗时 ${elapsed}s`);
}

main();
