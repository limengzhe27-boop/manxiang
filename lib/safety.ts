/**
 * 内容安全 真实人物 / 版权角色检测
 * 只在服务端使用
 *
 * 三层名单:
 *   1) 中国领导人 - 合规硬红线
 *   2) 真人明星 - 肖像权风险
 *   3) 版权角色 - 漫威 / DC / 游戏 / 动漫主流 IP
 */

// === 1. 中国 现任 + 近代领导人 ===
const CN_LEADERS_CN = [
  '习近平', '李强', '赵乐际', '王沪宁', '蔡奇', '丁薛祥', '李希',
  '韩正', '王毅',
  '胡锦涛', '温家宝', '江泽民', '朱镕基', '李鹏',
  '邓小平', '陈云', '李先念',
  '毛泽东', '周恩来', '刘少奇', '朱德', '林彪',
  '华国锋', '叶剑英',
  '李克强', '栗战书', '汪洋',
  '李家超', '林郑月娥', '梁振英', '董建华',
  '贺一诚', '崔世安'
];

const CN_LEADERS_EN = [
  'xi jinping', 'li keqiang', 'li qiang', 'wang huning',
  'hu jintao', 'jiang zemin', 'wen jiabao', 'zhu rongji',
  'mao zedong', 'mao tsetung', 'deng xiaoping',
  'zhou enlai', 'liu shaoqi', 'lin biao', 'hua guofeng'
];

// === 2. 真人明星 (高知名度, 肖像权风险大) ===
const CELEBRITIES_CN = [
  // 华语影视
  '周杰伦', '王力宏', '林俊杰', '陈奕迅', '邓紫棋',
  '成龙', '李连杰', '周星驰', '刘德华', '梁朝伟', '张国荣', '周润发',
  '范冰冰', '李冰冰', '汤唯', '章子怡', '巩俐', '王宝强', '黄渤', '徐峥',
  '杨幂', '迪丽热巴', '赵丽颖', '杨颖', 'angelababy', 'baby',
  '蔡徐坤', '王一博', '肖战', '鹿晗', '吴亦凡', '黄子韬', '张艺兴',
  '易烊千玺', '王俊凯', '王源',
  '杨紫', '关晓彤', '欧阳娜娜',
  '吴磊', '罗云熙', '檀健次',
  '马云', '马化腾', '王健林', '雷军', '李彦宏', '刘强东', '丁磊',
  // 国际明星
  '泰勒斯威夫特', '碧昂丝', '蕾哈娜', '蕾迪嘎嘎', '麦当娜',
  '阿黛尔', '艾薇儿',
  '汤姆克鲁斯', '布拉德皮特', '小李子', '莱昂纳多',
  '盖尔加朵', '斯嘉丽约翰逊', '安妮海瑟薇', '艾玛沃森',
  '梅西', 'c罗', 'cr7', '内马尔', '姆巴佩', '哈兰德',
  '科比', '乔丹', '勒布朗', '库里', '杜兰特',
  // 韩国
  '李敏镐', '宋仲基', '玄彬', '孔刘',
  '全智贤', '宋慧乔', '金泰熙',
  // 日本
  '木村拓哉', '新垣结衣', '石原里美', '橋本环奈',
  '宫崎骏', '新海诚'
];

const CELEBRITIES_EN = [
  'taylor swift', 'beyonce', 'rihanna', 'lady gaga', 'madonna', 'adele',
  'tom cruise', 'brad pitt', 'leonardo dicaprio', 'leonardo dicarprio',
  'gal gadot', 'scarlett johansson', 'anne hathaway', 'emma watson',
  'tom hanks', 'morgan freeman', 'robert downey jr', 'rdj',
  'messi', 'cristiano ronaldo', 'ronaldo', 'neymar', 'mbappe', 'haaland',
  'kobe bryant', 'michael jordan', 'lebron james', 'stephen curry', 'kevin durant',
  'elon musk', 'jeff bezos', 'mark zuckerberg', 'bill gates', 'steve jobs',
  'jackie chan', 'jet li', 'jay chou', 'andy lau'
];

// === 3. 版权角色 (漫威 / DC / 游戏 / 动漫主流 IP) ===
const COPYRIGHTED_CHARACTERS_CN = [
  // 漫威
  '钢铁侠', '蜘蛛侠', '美国队长', '雷神', '索尔', '绿巨人', '浩克', '黑寡妇',
  '奇异博士', '蚁人', '惊奇队长', '黑豹', '银河护卫队', '星爵', '灭霸',
  '死侍', '金刚狼', 'x战警', '万磁王', 'x教授',
  '复仇者联盟', '复联',
  // DC
  '超人', '蝙蝠侠', '神奇女侠', '海王', '闪电侠', '绿灯侠', '小丑', '哈利奎因',
  '正义联盟', '罗宾', '蝙蝠女',
  // 哈利波特
  '哈利波特', '赫敏', '罗恩', '邓布利多', '伏地魔', '斯内普', '哈利·波特',
  // 星战
  '卢克天行者', '达斯维达', '尤达大师', '黑武士', '韩索罗', '蕾雅公主',
  // 日漫
  '皮卡丘', '小智', '哆啦a梦', '机器猫', '蜡笔小新', '柯南', '工藤新一',
  '路飞', '索隆', '山治', '娜美', '乔巴', '罗宾',
  '鸣人', '佐助', '小樱', '卡卡西', '鼬',
  '炭治郎', '祢豆子', '善逸', '伊之助',
  '艾伦', '三笠', '阿明', '利威尔兵长', '调查兵团',
  '悟空', '贝吉塔', '布尔玛', '克林',
  '一拳超人', '埼玉',
  '夜神月',
  // 游戏
  '马力欧', '马里奥', '路易吉', '林克', '塞尔达', '皮卡丘', '宝可梦',
  '索尼克',
  // 国产
  '孙悟空', '猪八戒', '沙僧', '唐僧', // 这俩可以创作但用法宽松, 暂留
  '哪吒', '杨戬'
];

const COPYRIGHTED_CHARACTERS_EN = [
  'iron man', 'spider-man', 'spiderman', 'captain america', 'thor', 'hulk',
  'black widow', 'doctor strange', 'ant-man', 'captain marvel', 'black panther',
  'star-lord', 'thanos', 'deadpool', 'wolverine', 'x-men', 'magneto',
  'professor x', 'avengers',
  'superman', 'batman', 'wonder woman', 'aquaman', 'flash', 'green lantern',
  'joker', 'harley quinn', 'justice league', 'robin',
  'harry potter', 'hermione', 'ron weasley', 'dumbledore', 'voldemort', 'snape',
  'luke skywalker', 'darth vader', 'yoda', 'han solo', 'princess leia',
  'pikachu', 'ash ketchum', 'doraemon', 'crayon shinchan', 'conan edogawa',
  'luffy', 'zoro', 'sanji', 'nami',
  'naruto', 'sasuke', 'sakura', 'kakashi', 'itachi',
  'tanjiro', 'nezuko', 'eren yeager', 'mikasa', 'levi',
  'goku', 'vegeta',
  'saitama', 'light yagami',
  'mario', 'luigi', 'zelda character', 'sonic the hedgehog'
];

// 过短的英文名会误伤普通词 (如 'l' / 'link') 这些只用中文匹配
// 'link' 在英文里是 hyperlink 等高频词, 不放在英文列表
// 'l' 是 death note 角色, 不放在英文列表

// 当前策略: 只拦中国领导人, 明星 / 版权角色放开 (用户决策, 见 ChangeLog)
// 明星 / 版权列表保留在文件中, 上线前如需开启把下面两行换成 [...LEADERS, ...CELEBRITIES, ...COPYRIGHTED]
const ALL_CN = [...CN_LEADERS_CN];
const ALL_EN = [...CN_LEADERS_EN];
void CELEBRITIES_CN; void CELEBRITIES_EN;
void COPYRIGHTED_CHARACTERS_CN; void COPYRIGHTED_CHARACTERS_EN;

/**
 * 检测文本是否包含敏感人物名字 / 版权角色名
 * 返回命中的名字, 没有则返回 null
 */
export function detectPoliticalFigure(text: string): string | null {
  if (!text) return null;

  // 中文匹配 直接子串 (名字至少 2 个字符防误伤)
  for (const name of ALL_CN) {
    if (name.length < 2) continue;
    if (text.includes(name)) return name;
  }

  // 英文匹配 单词边界 + 名字长度 >= 4 防止误伤普通词
  const lower = text.toLowerCase();
  for (const name of ALL_EN) {
    if (name.length < 4) continue; // 防御性: 跳过太短的名字 (虽然列表内已过滤)
    const re = new RegExp(`\\b${name.replace(/[-\s]+/g, '[\\s-]*')}\\b`, 'i');
    if (re.test(lower)) return name;
  }

  return null;
}

/** 友好提示文案: 区分领导人 vs 明星/版权角色 */
export function buildSafetyMessage(hit: string): string {
  const lower = hit.toLowerCase();
  // 领导人列表
  const isLeader = CN_LEADERS_CN.includes(hit) || CN_LEADERS_EN.includes(lower);
  if (isLeader) {
    return `因合规要求，故事不能直接使用「${hit}」这类领导人名字，请换一个虚构名字`;
  }
  return `请使用虚构角色描述，不支持生成真实人物或版权角色（检测到「${hit}」）`;
}
