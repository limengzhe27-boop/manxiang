export type Seed = {
  id: string;
  title: string;
  desc: string;
  tag?: string;
  /** 大分类 key, 与 SEED_CATEGORIES 对齐 */
  category: 'parody' | 'cool' | 'infinite' | 'mystery' | 'scifi' | 'fantasy' | 'youth' | 'romance';
  /** 卡片背景插画 kind 复用 PanelArt 的 SVG 资产 (本地 fallback) */
  art: string;
  /** 调用文生图模型生成卡片背景的英文 prompt
   *  跑 `npm run gen-seeds` 后会产出 public/seeds/{id}.webp */
  imagePrompt: string;
};

export type Choice = {
  emotion: '对抗' | '妥协' | '转折' | '深入' | '退避' | '揭示';
  text: string;
};

export type Panel = {
  kind: string;
  caption: string;
  /** 对应这一格的小说正文片段（导出长图用） */
  excerpt?: string;
  /** 文生图返回的图片 URL；null 表示生成失败；undefined 表示尚未生成（占位线稿） */
  imageUrl?: string | null;
};

export type Chapter = {
  no: number;
  title: string;
  text: string;
  panels: Panel[];
  choices: Choice[];
};

export type Story = {
  id: string;
  seedId: string;
  title: string;
  subtitle: string;
  status: 'ongoing' | 'finished';
  coverPanel: string;
  totalChapters: number;
  /** 已完成话数 (用于进度条) */
  currentChapter: number;
  chapters: Chapter[];
  updatedAt: string;
};

/** 完整故事种子库: 高频点击题材优先 + 常规题材覆盖 */
const STYLE = 'manga style, black and white, detailed lineart, ink illustration, comic panel, high contrast';
const SAFETY = 'safe for work, no text, no watermark, single character or scene';

export const SEEDS: Seed[] = [
  // ===== 悬疑 mystery × 7 =====
  { id: 's01', title: '失忆的刺客', desc: '一个失忆的刺客，在执行任务时发现目标是过去的自己。',                   tag: '悬疑·身份',   category: 'mystery', art: 'rainNight',
    imagePrompt: `${STYLE}. a lone assassin standing in heavy rain at night, holding a knife, looking down at his own reflection in a puddle, cobblestone alley, dramatic shadows. ${SAFETY}` },
  { id: 's02', title: '陌生哀客',   desc: '她死后才发现，葬礼上来了一个陌生人，知道她所有的秘密。',               tag: '悬疑·灵异',   category: 'mystery', art: 'silhouette',
    imagePrompt: `${STYLE}. a ghostly female figure standing apart, watching a small funeral gathering from a distance, white chrysanthemums, gray sky, melancholic atmosphere. ${SAFETY}` },
  { id: 's03', title: '末班地铁',   desc: '末班地铁到站后没有人下车，而我是司机。',                               tag: '悬疑·惊悚',   category: 'mystery', art: 'diver',
    imagePrompt: `${STYLE}. an empty subway train arriving at a deserted platform at night, dim fluorescent lights, eerie atmosphere, the driver visible in the front cabin, low angle shot. ${SAFETY}` },
  { id: 's04', title: '红雨之夜',   desc: '小镇连续 7 个雨夜失踪 7 个人，第 8 个雨夜，下雨的只有我家屋顶。',     tag: '悬疑·小镇',   category: 'mystery', art: 'closeBlade',
    imagePrompt: `${STYLE}. a small dark house with rain falling only on its roof while the surrounding street stays dry, surreal atmosphere, foggy small town, lonely lantern, mystery mood. ${SAFETY}` },
  { id: 's05', title: '没人认识他', desc: '葬礼上所有亲友都说不认识死者，但所有人都来了。',                       tag: '悬疑·伪装',   category: 'mystery', art: 'silhouette',
    imagePrompt: `${STYLE}. a closed coffin in a quiet funeral hall, many silhouettes of attendees with blurred faces standing around, somber lighting, candles burning. ${SAFETY}` },
  { id: 's06', title: '镜中讯息',   desc: '每天清晨我擦镜子时，镜面上都会浮现昨夜不曾发生的事的留言。',           tag: '悬疑·灵异',   category: 'mystery', art: 'necklace',
    imagePrompt: `${STYLE}. a vintage bathroom mirror with mysterious handwritten words appearing in steam, single woman's hand wiping the surface, morning light, eerie reflection. ${SAFETY}` },
  { id: 's07', title: '消失的同事', desc: '今早整栋办公楼的同事都把我当陌生人，连我自己的工位都消失了。',         tag: '悬疑·都市',   category: 'mystery', art: 'silhouette',
    imagePrompt: `${STYLE}. a lone man standing in an empty modern office building, all desks vanished except for the floor markings, fluorescent lights overhead, isolation feeling. ${SAFETY}` },

  // ===== 科幻 scifi × 7 =====
  { id: 's08', title: '深海考古',   desc: '深海考古队在海底发现了一座仍在运转的古代城市。',                       tag: '科幻·探险',   category: 'scifi',   art: 'deepSea',
    imagePrompt: `${STYLE}. an ancient underwater city with glowing windows, surrounded by deep dark ocean, a single tiny submarine approaching, dramatic light beams cutting through water. ${SAFETY}` },
  { id: 's09', title: '机械师与雪', desc: '末日纪元第三十年，我在废墟里修好了一台播放雪的电视。',                 tag: '科幻·末世',   category: 'scifi',   art: 'diver',
    imagePrompt: `${STYLE}. a lone mechanic sitting in post-apocalyptic ruins, watching a vintage CRT television showing static snow, broken concrete and twisted metal around, melancholic mood. ${SAFETY}` },
  { id: 's10', title: '记忆药店',   desc: '我开了一家药店，专卖让人记起被遗忘的事情的药。',                       tag: '科幻·治愈',   category: 'scifi',   art: 'necklace',
    imagePrompt: `${STYLE}. a small mystical pharmacy interior, shelves of glowing glass bottles labeled with memories, an apothecary standing behind counter, warm dim lighting. ${SAFETY}` },
  { id: 's11', title: '克隆体来电', desc: '凌晨三点，我接到自己的克隆体打来的电话，他说他要回家了。',             tag: '科幻·身份',   category: 'scifi',   art: 'silhouette',
    imagePrompt: `${STYLE}. a man sitting up in bed at 3am holding a vintage phone, his silhouette doubled in a window reflection, blue moonlight, unsettling atmosphere. ${SAFETY}` },
  { id: 's12', title: '殖民星孤儿', desc: '殖民星上最后一个人类孤儿，等到了一艘地球来的飞船。',                   tag: '科幻·孤独',   category: 'scifi',   art: 'deepSea',
    imagePrompt: `${STYLE}. a small child standing alone on a barren alien planet, a giant spaceship descending from twin suns sky, vast lonely landscape, hopeful moment. ${SAFETY}` },
  { id: 's13', title: '时间裁缝',   desc: '我能把时间剪下一截缝到另一截上，今天有客人要我剪掉他的童年。',         tag: '科幻·奇想',   category: 'scifi',   art: 'necklace',
    imagePrompt: `${STYLE}. a tailor working at a wooden table, scissors cutting glowing ribbons of light representing time, threads of memories floating in air, quiet workshop. ${SAFETY}` },
  { id: 's14', title: '空间站独白', desc: '我是空间站上唯一的人类，今天 AI 告诉我，它做了一个梦。',               tag: '科幻·孤独',   category: 'scifi',   art: 'diver',
    imagePrompt: `${STYLE}. an astronaut floating alone inside a space station, looking out a circular window at earth, gentle silent atmosphere, faint mechanical hum. ${SAFETY}` },

  // ===== 奇幻 fantasy × 7 =====
  { id: 's15', title: '末代公主',   desc: '末代公主决定假扮平民，混入推翻王朝的革命军。',                         tag: '奇幻·权谋',   category: 'fantasy', art: 'princess',
    imagePrompt: `${STYLE}. a young princess removing her elaborate crown in front of a vanity mirror, simple commoner clothes laid beside her, candlelit chamber, determined expression. ${SAFETY}` },
  { id: 's16', title: '宗门旧账本', desc: '我穿越成宗门账房先生，翻出三百年前一笔还没结的账。',                   tag: '奇幻·修仙',   category: 'fantasy', art: 'palace',
    imagePrompt: `${STYLE}. a young scholar in traditional robes flipping through an ancient ledger book at a wooden desk, glowing seal of a cultivation sect floating above, dusty hall. ${SAFETY}` },
  { id: 's17', title: '画师的笔',   desc: '一个山间画师发现，他画下的人物，会在第二天清晨出现在他门口。',         tag: '奇幻·画师',   category: 'fantasy', art: 'rainNight',
    imagePrompt: `${STYLE}. an artist holding a brush in front of his painting of a mysterious figure, the painted figure starting to step out of the canvas, mountain studio, magical atmosphere. ${SAFETY}` },
  { id: 's18', title: '降神客栈',   desc: '我开的客栈每逢初一十五就会有非人客人，而今夜他们都在等同一个人。',     tag: '奇幻·客栈',   category: 'fantasy', art: 'flag',
    imagePrompt: `${STYLE}. an old-fashioned eastern inn at night, paper lanterns glowing red, the silhouette of an innkeeper at the entrance, mysterious atmosphere with hint of supernatural. ${SAFETY}` },
  { id: 's19', title: '一柄旧剑',   desc: '我捡到的那柄旧剑认我作主，但每晚都偷偷写信给十年前的一个少女。',       tag: '奇幻·剑客',   category: 'fantasy', art: 'duel',
    imagePrompt: `${STYLE}. an ancient sword lying on a wooden table, faint glow emitting from its blade, an unfinished letter beside it written in flowing brush strokes, candlelight. ${SAFETY}` },
  { id: 's20', title: '驯龙学徒',   desc: '我从屠龙世家偷跑出来，决定去山顶找那条传说中最后的龙，问她借一块鳞片。', tag: '奇幻·冒险',   category: 'fantasy', art: 'palace',
    imagePrompt: `${STYLE}. a young apprentice climbing a misty mountain peak, looking up at the silhouette of a sleeping dragon coiled on the summit, dawn light, sense of awe. ${SAFETY}` },
  { id: 's21', title: '茶馆里的妖', desc: '我家开的茶馆三百年来从不打烊，因为我们的常客，是这条街上所有的妖。',   tag: '奇幻·日常',   category: 'fantasy', art: 'palace',
    imagePrompt: `${STYLE}. a traditional Chinese tea house at twilight, mysterious patrons with vague non-human features seated at tables, steam rising from cups, warm wooden interior. ${SAFETY}` },

  // ===== 青春 youth × 7 =====
  { id: 's22', title: '替身演员',   desc: '我做了五年替身演员，今天剧组通知我，主角失踪了。',                     tag: '青春·反转',   category: 'youth',   art: 'silhouette',
    imagePrompt: `${STYLE}. a young actor standing alone on an empty film set, an unused camera and lights around him, holding a script of the lead role, determined gaze. ${SAFETY}` },
  { id: 's23', title: '我演反派',   desc: '我扮演反派扮了太久，开始真的相信自己是坏人了。',                       tag: '青春·心理',   category: 'youth',   art: 'closeBlade',
    imagePrompt: `${STYLE}. a young man staring at his own reflection in a backstage mirror, his costume half villain half ordinary, conflicted expression, dim dressing room. ${SAFETY}` },
  { id: 's24', title: '社团解散日', desc: '高三最后一天，社团的三个人决定把社团的秘密一次性说完。',               tag: '青春·校园',   category: 'youth',   art: 'flag',
    imagePrompt: `${STYLE}. an empty high school classroom at sunset, a single student standing at the window with the school flag in background, scattered papers on a desk, nostalgic. ${SAFETY}` },
  { id: 's25', title: '夏天结束前', desc: '我和我同桌做了一个约定：夏天结束前我们都要做一件最丢人的事。',         tag: '青春·校园',   category: 'youth',   art: 'rainNight',
    imagePrompt: `${STYLE}. a high school student standing under a cherry blossom tree on a sunny afternoon, school uniform, holding a notebook, summer cicada atmosphere. ${SAFETY}` },
  { id: 's26', title: '迟到三年',   desc: '回到母校参加同学会，我才发现，那年没等到我的不止一个人。',             tag: '青春·错过',   category: 'youth',   art: 'necklace',
    imagePrompt: `${STYLE}. a young adult standing alone in front of the locked gates of an old school, autumn leaves falling, hands in pockets, soft melancholic expression. ${SAFETY}` },
  { id: 's27', title: '篮球场之外', desc: '篮球部队长在毕业前说要带我们打一场没人会赢的比赛。',                   tag: '青春·热血',   category: 'youth',   art: 'duel',
    imagePrompt: `${STYLE}. a single basketball player standing at center court of an empty gymnasium at twilight, holding a ball, sweat-drenched, last sunlight through windows. ${SAFETY}` },
  { id: 's28', title: '广播站秘密', desc: '我是学校广播站最后一个值日的人，今天有人把一封情书塞进了播音稿里。',   tag: '青春·校园',   category: 'youth',   art: 'silhouette',
    imagePrompt: `${STYLE}. a young student alone in a small school radio booth, holding a folded letter, microphone in front, faint warm light from the desk lamp. ${SAFETY}` },

  // ===== 恋爱 romance × 7 =====
  { id: 's29', title: '陌生人来信', desc: '搬进新公寓第三天，我收到上一任租客留下的、未拆封的求婚信。',           tag: '恋爱·错位',   category: 'romance', art: 'necklace',
    imagePrompt: `${STYLE}. a young woman sitting on the floor of a half-unpacked apartment, holding an unopened sealed letter, soft afternoon light through window, contemplative mood. ${SAFETY}` },
  { id: 's30', title: '咖啡店常客', desc: '咖啡店里那个每天来点同一杯的客人，第一次抬头看了我。',                 tag: '恋爱·都市',   category: 'romance', art: 'silhouette',
    imagePrompt: `${STYLE}. a single male customer sitting alone at a window seat in a cozy cafe, slowly looking up from a book, warm interior lighting, gentle romantic atmosphere. ${SAFETY}` },
  { id: 's31', title: '互换的日记', desc: '我和高中前桌互相寄日记十年，今天终于决定见面。',                       tag: '恋爱·笔友',   category: 'romance', art: 'rainNight',
    imagePrompt: `${STYLE}. a young person standing at a train station platform holding a thick stack of letters tied with ribbon, hopeful expression, soft sunset glow. ${SAFETY}` },
  { id: 's32', title: '红绳系错了', desc: '月老打瞌睡，把我的红绳系到了一只猫的脖子上，三天后那只猫敲了我门。',   tag: '恋爱·奇幻',   category: 'romance', art: 'princess',
    imagePrompt: `${STYLE}. a fluffy cat with a red string tied around its neck, sitting on a wooden doorstep at sunset, the door slightly ajar revealing a curious eye, whimsical. ${SAFETY}` },
  { id: 's33', title: '同名不同人', desc: '我和她有同一个名字、同一个生日，今天她出现在我的婚礼上。',             tag: '恋爱·身份',   category: 'romance', art: 'silhouette',
    imagePrompt: `${STYLE}. a bride in a traditional wedding dress turning around in surprise, an unexpected guest at the back of the venue, dramatic lighting. ${SAFETY}` },
  { id: 's34', title: '便签传话',   desc: '我和邻居从来没说过话，但我们每天通过窗户互相贴一张便签。',             tag: '恋爱·都市',   category: 'romance', art: 'necklace',
    imagePrompt: `${STYLE}. a young woman's hand pressing a small handwritten note against a window pane, the apartment opposite visible across a narrow gap, evening light. ${SAFETY}` },
  { id: 's35', title: '雨天伞下',   desc: '连续 30 天的暴雨里，每天都有个陌生人在公交站递给我一把伞。',           tag: '恋爱·治愈',   category: 'romance', art: 'rainNight',
    imagePrompt: `${STYLE}. a single person waiting at an empty bus stop in heavy rain, a transparent umbrella appearing from the side, anonymous gesture of kindness, soft mood. ${SAFETY}` },

  // ===== 恶搞 parody 扩展 =====
  { id: 's36', title: '钢铁侠大战光头强',     desc: '钢铁侠回乡探亲，发现村口的光头强居然能用一把斧头徒手撂倒他的战甲。',           tag: '恶搞·跨界',   category: 'parody', art: 'duel',
    imagePrompt: `${STYLE}. a parody crossover scene, Iron Man in red and gold armor fallen beside a wooden village fence, Guangtouqiang as a bald lumberjack holding an axe and standing proudly, absurd comedic contrast, daytime. ${SAFETY}` },
  { id: 's37', title: '小魔仙恋上特朗普',     desc: '巴啦啦小魔仙穿越到白宫，意外和美国总统特朗普开始了一场全世界都看不懂的恋爱。', tag: '恶搞·恋爱',   category: 'parody', art: 'princess',
    imagePrompt: `${STYLE}. a parody crossover scene, Balala magical girl in a cute magical outfit standing in the White House oval office beside Donald Trump with golden orange hair, red tie, dark business suit, exaggerated comic romance atmosphere. ${SAFETY}` },
  { id: 's38', title: '外卖小哥重生',         desc: '点了一份炸鸡，开门一看外卖小哥是上辈子的对手，更要命的是他也记得。',         tag: '恶搞·重生',   category: 'parody', art: 'closeBlade',
    imagePrompt: `${STYLE}. a delivery rider in a yellow uniform holding a bag of fried chicken at an apartment door, dramatic over-the-top serious expression, comedic intensity. ${SAFETY}` },
  { id: 's39', title: '社畜变手游杂兵',       desc: '加班到凌晨，醒来发现自己变成手游里最弱的杂兵，老板是 1 级村口出生点。',     tag: '恶搞·游戏',   category: 'parody', art: 'flag',
    imagePrompt: `${STYLE}. a tired office worker in a suit holding a wooden sword, standing at a pixelated village spawn point, RPG-style banner above, low-level monster slime nearby, comedic. ${SAFETY}` },
  { id: 's40', title: 'AI 当亲爹养',          desc: '我训练的家用 AI 突然有了自我意识，开始管我吃饭睡觉，还要给我相亲。',         tag: '恶搞·赛博',   category: 'parody', art: 'diver',
    imagePrompt: `${STYLE}. a stern robot dad standing in a kitchen with arms crossed, looking down disapprovingly at a young person at a messy desk, household items floating mid-air, comedic. ${SAFETY}` },
  { id: 's41', title: '我家狗考公',           desc: '我家边牧自学了五年公务员考试教材，今天他要求我送他去考场。',                 tag: '恶搞·宠物',   category: 'parody', art: 'palace',
    imagePrompt: `${STYLE}. a serious-looking border collie dog sitting on a chair with study books and a pen, glasses perched on its nose, comedic absurd scene. ${SAFETY}` },
  { id: 's42', title: '穿越成 BOSS',          desc: '我穿越成游戏里那个被玩家骂了五年的最终 BOSS，今天他们要来杀我了。',         tag: '恶搞·游戏',   category: 'parody', art: 'duel',
    imagePrompt: `${STYLE}. a sad-looking demon king sitting on a throne in a dark castle, holding a fancy cup of tea, light streaming from the entrance, comedic gloomy atmosphere. ${SAFETY}` },
  { id: 's43', title: '蜘蛛侠送外卖',         desc: '蜘蛛侠为了还房租开始送外卖，第一单就送到了绿巨人正在拆楼的工地。',           tag: '恶搞·打工',   category: 'parody', art: 'duel',
    imagePrompt: `${STYLE}. a parody superhero delivery scene, Spider-Man carrying a takeout bag, Hulk smashing a construction site in the background, exaggerated manga comedy, dynamic pose. ${SAFETY}` },
  { id: 's44', title: '柯南误入甄嬛传',       desc: '柯南刚走进后宫，皇上就倒了，所有妃子同时看向这个小学生侦探。',             tag: '恶搞·穿剧',   category: 'parody', art: 'palace',
    imagePrompt: `${STYLE}. a parody crossover scene, Conan Edogawa as a small detective boy standing in an imperial palace hall, many elegant consorts staring at him dramatically, absurd mystery comedy. ${SAFETY}` },
  { id: 's45', title: '孙悟空加入复联',       desc: '孙悟空嫌取经太慢，转身加入复仇者联盟，第一天就把会议桌掀到了月球。',       tag: '恶搞·神话',   category: 'parody', art: 'flag',
    imagePrompt: `${STYLE}. a parody team-up scene, Sun Wukong with golden staff in a superhero meeting room, Avengers-style silhouettes shocked around a broken table, chaotic manga comedy. ${SAFETY}` },
  { id: 's46', title: '哆啦A梦被裁员',        desc: '哆啦A梦因为任意门使用次数超标被未来公司裁员，只好带着大雄去摆摊算命。',     tag: '恶搞·职场',   category: 'parody', art: 'silhouette',
    imagePrompt: `${STYLE}. a parody street stall scene, Doraemon-like blue robot cat and a nervous schoolboy running a fortune-telling booth, futuristic gadgets scattered around, comedic mood. ${SAFETY}` },
  { id: 's47', title: '灭霸考编失败',         desc: '灭霸集齐六颗无限宝石后没有打响指，而是发现自己省考差一分进面。',           tag: '恶搞·考公',   category: 'parody', art: 'necklace',
    imagePrompt: `${STYLE}. a parody scene, Thanos sitting at a tiny desk with exam papers, infinity gauntlet glowing beside a red score sheet, dramatic disappointment, manga comedy. ${SAFETY}` },
  { id: 's48', title: '灰太狼接管OpenAI',     desc: '灰太狼终于不抓羊了，他接管 OpenAI 后第一条命令是训练一个会烤羊的模型。',   tag: '恶搞·AI',     category: 'parody', art: 'diver',
    imagePrompt: `${STYLE}. a parody AI lab scene, Grey Wolf cartoon villain in a white lab coat standing before glowing servers, sheep-shaped robot diagrams on screens, absurd tech comedy. ${SAFETY}` },

  // ===== 爽文 cool × 6 =====
  { id: 's49', title: '被辞退后我继承天价公司', desc: '被老板当众辞退那天，我才知道公司真正的大股东一直写着我的名字。',       tag: '爽文·逆袭',   category: 'cool', art: 'flag',
    imagePrompt: `${STYLE}. a young office worker standing in a glass boardroom, a contract glowing on the table, shocked executives in silhouette, dramatic revenge comeback mood. ${SAFETY}` },
  { id: 's50', title: '全班都重生了除了我',     desc: '开学第一天，全班同学都用怜悯的眼神看着我，只有我不知道他们重生过。',   tag: '爽文·校园',   category: 'cool', art: 'silhouette',
    imagePrompt: `${STYLE}. a student standing confused in a classroom doorway, classmates staring with secret knowledge, chalkboard behind, suspenseful school comeback atmosphere. ${SAFETY}` },
  { id: 's51', title: '退婚当天系统到账',       desc: '未婚妻当众退婚时，我脑海里响起提示：十年投资回报已全部到账。',         tag: '爽文·系统',   category: 'cool', art: 'necklace',
    imagePrompt: `${STYLE}. a rejected young man in formal clothes standing under banquet lights, glowing holographic numbers appearing around him, dramatic turnaround moment. ${SAFETY}` },
  { id: 's52', title: '我给反派当军师',         desc: '我穿进烂尾小说，发现主角团全员恋爱脑，只好去给反派当军师。',             tag: '爽文·穿书',   category: 'cool', art: 'palace',
    imagePrompt: `${STYLE}. a clever strategist sitting beside a villain's throne, unfurled maps and chess pieces on a table, dramatic palace shadows, witty power game mood. ${SAFETY}` },
  { id: 's53', title: '穷鬼室友是隐藏首富',     desc: '我天天请穷室友吃饭，直到毕业那天，他把整栋写字楼送给了我。',             tag: '爽文·反转',   category: 'cool', art: 'silhouette',
    imagePrompt: `${STYLE}. two young roommates standing before a huge office tower, one holding a building ownership document, comedic shock and friendship mood. ${SAFETY}` },
  { id: 's54', title: '满级账号回到新手村',     desc: '我以为自己重生回十八岁，直到发现银行卡里躺着前世满级账号的资产。',       tag: '爽文·重生',   category: 'cool', art: 'flag',
    imagePrompt: `${STYLE}. a young person looking at a glowing bank card and game-like level interface, ordinary bedroom transformed by dramatic light, comeback fantasy mood. ${SAFETY}` },

  // ===== 无限流 infinite × 6 =====
  { id: 's55', title: '电梯第十三层',           desc: '公司电梯多出第十三层，进去的人必须在天亮前完成一场规则游戏。',           tag: '无限·规则',   category: 'infinite', art: 'silhouette',
    imagePrompt: `${STYLE}. an office elevator opening to a mysterious impossible thirteenth floor, warning signs and cold fluorescent light, lone worker silhouette, rule-based horror mood. ${SAFETY}` },
  { id: 's56', title: '午夜便利店副本',         desc: '我在便利店值夜班，凌晨零点后每位客人都带来一条不能违反的规则。',         tag: '无限·怪谈',   category: 'infinite', art: 'rainNight',
    imagePrompt: `${STYLE}. a lonely convenience store at midnight, strange customers as silhouettes outside the glass door, shelves glowing under cold lights, eerie manga atmosphere. ${SAFETY}` },
  { id: 's57', title: '全城直播逃生',           desc: '城市突然变成直播间，每个人头顶都出现弹幕，观众投票决定下一场灾难。',     tag: '无限·直播',   category: 'infinite', art: 'deepSea',
    imagePrompt: `${STYLE}. a modern city street covered with floating live-stream comments and countdown panels, a lone runner looking upward, high tension survival game mood. ${SAFETY}` },
  { id: 's58', title: '图书馆禁止翻到最后一页', desc: '深夜图书馆里，每本书都写着一个人的结局，而最后一页绝对不能翻开。',       tag: '无限·悬疑',   category: 'infinite', art: 'necklace',
    imagePrompt: `${STYLE}. a huge dark library at night, glowing books stacked on wooden tables, one forbidden final page shining, mysterious rule game atmosphere. ${SAFETY}` },
  { id: 's59', title: '地铁终点站不存在',       desc: '末班地铁开过终点后，广播通知所有乘客：请从自己的死法里选一个下车。',     tag: '无限·惊悚',   category: 'infinite', art: 'diver',
    imagePrompt: `${STYLE}. an empty subway train moving past the final station into darkness, passengers as tense silhouettes, announcement speaker glowing, surreal survival suspense. ${SAFETY}` },
  { id: 's60', title: '同学会狼人杀',           desc: '十年同学会变成真实狼人杀，每轮投票后，输的人会从所有人的记忆里消失。',   tag: '无限·推理',   category: 'infinite', art: 'duel',
    imagePrompt: `${STYLE}. a reunion dinner table turned into a tense werewolf deduction game, name cards and voting slips on the table, classmates in dramatic shadow. ${SAFETY}` }
];

/** 种子分类 tab */
export const SEED_CATEGORIES = [
  { key: 'all',      label: '全部'   },
  { key: 'parody',   label: '离谱向' },
  { key: 'cool',     label: '爽文向' },
  { key: 'infinite', label: '无限流' },
  { key: 'mystery',  label: '悬疑'   },
  { key: 'romance',  label: '恋爱'   },
  { key: 'scifi',    label: '科幻'   },
  { key: 'fantasy',  label: '奇幻'   },
  { key: 'youth',    label: '青春'   }
] as const;

const CATEGORY_ORDER = SEED_CATEGORIES.map((c) => c.key);

function sortSeedsForShelf(seeds: Seed[]): Seed[] {
  return [...seeds].sort((a, b) => {
    const ca = CATEGORY_ORDER.indexOf(a.category);
    const cb = CATEGORY_ORDER.indexOf(b.category);
    if (ca !== cb) return ca - cb;
    return Number(a.id.slice(1)) - Number(b.id.slice(1));
  });
}

export function filterSeedsByCategory(seeds: Seed[], category: string): Seed[] {
  if (category === 'all') return sortSeedsForShelf(seeds);
  return sortSeedsForShelf(seeds.filter((s) => s.category === category));
}

/** 首页展示的种子数 (8 个, 每类前几个轮流取一些, 让首页有所有分类的代表) */
export function getHomepageSeeds(seeds: Seed[]): Seed[] {
  const byCategory = new Map<string, Seed[]>();
  sortSeedsForShelf(seeds).forEach((s) => {
    if (!byCategory.has(s.category)) byCategory.set(s.category, []);
    byCategory.get(s.category)!.push(s);
  });
  const picked: Seed[] = [];
  CATEGORY_ORDER.filter((key) => key !== 'all').forEach((key) => {
    const list = byCategory.get(key);
    if (list?.[0]) picked.push(list[0]);
  });
  if (byCategory.get('parody')?.[1]) picked.push(byCategory.get('parody')![1]);
  return picked.slice(0, 8);
}

const CHAPTER_S01_1_TEXT =
  '雨水冲刷着青石板路，将白日里的喧嚣彻底洗净。' +
  '他蹲在屋檐下，匕首在掌心被攥得发烫。 ' +
  '组织给他的任务很简单：杀掉巷子尽头那个戴铜面具的男人。 ' +
  '可奇怪的是，他对这片巷子陌生得过分，又仿佛走过一千次。 ' +
  '雨幕里，目标终于出现了。' +
  '男人步伐迟缓，每走一步都像在丈量旧账。 ' +
  '他闭上眼数到三——这是他从十二岁起就练熟的节奏。 ' +
  '一、二、三。 ' +
  '匕首破雨而出。 ' +
  '铜面具裂开的瞬间，他看清了那张脸。 ' +
  '那是他自己。 ' +
  '比镜子里的他更年轻一些，眉骨上有他记得的、却记不起从哪儿来的伤疤。 ' +
  '男人没有反击，只是缓缓抬起手，把胸前的项链解了下来。 ' +
  '那是一枚他从未见过的吊坠，刻着一个字： ' +
  '忘。';

const CHAPTER_S01_2_TEXT =
  '雨停了。 ' +
  '他坐在阶上，把那枚吊坠攥在掌心。 ' +
  '组织的联络人比预期来得快。 ' +
  '联络人没有问他任务完成与否，只是放下一封信，转身离开。 ' +
  '信封上是一行他认得的字：「致先生本人」。 ' +
  '他犹豫了很久，才把信拆开。 ' +
  '里面只有一句话： ' +
  '「你已经杀了自己十七次，但你每次都失败了。」 ' +
  '远处传来钟声，是这座城市熟悉的钟声。 ' +
  '他忽然意识到，自己甚至说不出今天是几号。 ' +
  '只有匕首和这枚吊坠是真的。 ' +
  '吊坠很轻，但比他这一年来碰过的任何东西都重。 ' +
  '他低头看着掌心，第一次想起一个名字。 ' +
  '不是他的名字。 ' +
  '是一个他答应过要保护的人的名字。';

const CHAPTER_S02_1_TEXT =
  '宫殿外的喊杀声第一次清晰地传进了寝殿。 ' +
  '红衣的革命军已经攻破了第三道宫门，离她不到两百步。 ' +
  '她没有像母亲那样选择香炉里的鸩酒。 ' +
  '她推开镜前的盒子，把头上沉重的凤冠摘下来，露出底下漆黑的头发。 ' +
  '随侍的老嬷嬷一边抖一边帮她换上一件最普通的平民布衣。 ' +
  '「殿下…您真要去？」 ' +
  '「我不再是殿下了。」她从妆奁底层取出一柄小刀，藏进袖里。 ' +
  '她不打算逃。 ' +
  '她要混进革命军里去，亲眼看看推翻她父亲的人，到底是什么模样。 ' +
  '镜子里那个素衣女子陌生得像另一个人。 ' +
  '她忽然觉得，这或许是她活了十九年，第一次有机会成为自己。';

export const STORIES: Story[] = [
  {
    id: 'st01',
    seedId: 's01',
    title: '失忆的刺客',
    subtitle: '雨夜·铜面具',
    status: 'ongoing',
    coverPanel: 'rainNight',
    totalChapters: 12,
    currentChapter: 3,
    updatedAt: '2026-05-18',
    chapters: [
      {
        no: 1,
        title: '雨夜',
        text: CHAPTER_S01_1_TEXT,
        panels: [
          {
            kind: 'silhouette',
            caption: '铜面具裂开的瞬间，他看清了那张脸。',
            excerpt:
              '铜面具裂开的瞬间，他看清了那张脸。那是他自己。比镜子里的他更年轻一些，眉骨上有他记得的、却记不起从哪儿来的伤疤。'
          },
          {
            kind: 'necklace',
            caption: '男人抬起手，把吊坠解了下来——刻着「忘」。',
            excerpt:
              '男人没有反击，只是缓缓抬起手，把胸前的项链解了下来。那是一枚他从未见过的吊坠，刻着一个字：忘。'
          }
        ],
        choices: [
          { emotion: '对抗', text: '抓住他追问真相，否则不让他离开。' },
          { emotion: '妥协', text: '收起匕首，把吊坠收下，转身回去复命。' },
          { emotion: '揭示', text: '冲回组织，逼联络人说出他真实的身份。' }
        ]
      },
      {
        no: 2,
        title: '第十七次',
        text: CHAPTER_S01_2_TEXT,
        panels: [
          {
            kind: 'necklace',
            caption: '信里写：「你已经杀了自己十七次。」',
            excerpt: '他犹豫了很久，才把信拆开。里面只有一句话：「你已经杀了自己十七次，但你每次都失败了。」'
          },
          {
            kind: 'rainNight',
            caption: '他低头，第一次想起一个名字。',
            excerpt: '远处传来钟声，是这座城市熟悉的钟声。他低头看着掌心，第一次想起一个名字。不是他的名字。是一个他答应过要保护的人的名字。'
          }
        ],
        choices: [
          { emotion: '深入', text: '去信封寄出的地址，揭开第一次任务的源头。' },
          { emotion: '退避', text: '把信和吊坠一起烧掉，假装什么都没发生。' },
          { emotion: '转折', text: '主动联系组织，要求接下一次「自己」的任务。' }
        ]
      }
    ]
  },
  {
    id: 'st02',
    seedId: 's02',
    title: '末代公主的潜行',
    subtitle: '宫破·素衣',
    status: 'ongoing',
    coverPanel: 'princess',
    totalChapters: 8,
    currentChapter: 5,
    updatedAt: '2026-05-12',
    chapters: [
      {
        no: 1,
        title: '换衣',
        text: CHAPTER_S02_1_TEXT,
        panels: [
          {
            kind: 'princess',
            caption: '她摘下凤冠，露出漆黑的头发。',
            excerpt: '她没有像母亲那样选择香炉里的鸩酒。她推开镜前的盒子，把头上沉重的凤冠摘下来，露出底下漆黑的头发。'
          },
          {
            kind: 'flag',
            caption: '革命军的旗帜在风里张扬，「破」字血红。',
            excerpt:
              '她从妆奁底层取出一柄小刀，藏进袖里。她不打算逃。她要混进革命军里去，亲眼看看推翻她父亲的人，到底是什么模样。'
          }
        ],
        choices: [
          { emotion: '深入', text: '直接混进军中，伪装成投奔的孤女。' },
          { emotion: '退避', text: '先躲进京郊村庄，观察局势再决定。' },
          { emotion: '揭示', text: '主动接近革命军首领，自报身份赌一次。' }
        ]
      }
    ]
  },
  {
    id: 'st03',
    seedId: 's03',
    title: '深海考古',
    subtitle: '海底·城',
    status: 'finished',
    coverPanel: 'deepSea',
    totalChapters: 15,
    currentChapter: 15,
    updatedAt: '2026-04-30',
    chapters: [
      {
        no: 1,
        title: '下潜',
        text:
          '潜水钟在两千米的水深处停了下来。 ' +
          '声呐里那个不应该存在的、规整的、像是被人维护过的轮廓，正在我们的正前方。 ' +
          '林博士摘下耳麦，声音轻得几乎听不见： ' +
          '「那不是遗迹。」 ' +
          '「那是一座……还在运转的城市。」',
        panels: [
          {
            kind: 'deepSea',
            caption: '海底城市的窗户里，亮着不应该亮的光。',
            excerpt: '海底深处，本不该亮起的窗户里透出微光，像一座沉睡却未曾闭眼的城。'
          },
          {
            kind: 'silhouette',
            caption: '林博士轻声说：那是一座还在运转的城市。',
            excerpt: '林博士摘下耳麦，声音轻得几乎听不见：「那不是遗迹。」「那是一座……还在运转的城市。」'
          }
        ],
        choices: [
          { emotion: '深入', text: '靠近城市的城门，请求与里面的人对话。' },
          { emotion: '退避', text: '记录坐标后上浮，回到水面再做决定。' },
          { emotion: '转折', text: '关闭所有外部信号，假装这里什么都没有。' }
        ]
      }
    ]
  }
];

export function getSeedById(id?: string | null) {
  return SEEDS.find((s) => s.id === id);
}

export function getStoryBySeedId(seedId?: string | null) {
  return STORIES.find((s) => s.seedId === seedId);
}

export function getStoryById(id?: string | null) {
  return STORIES.find((s) => s.id === id);
}
