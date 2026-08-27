import type { TFunction } from 'i18next';

type TranslationPair = { en: string; ja: string };

const VALUES: Record<string, TranslationPair> = {
  '科学侧': { en: 'Science Side', ja: '科学サイド' },
  '魔法侧': { en: 'Magic Side', ja: '魔術サイド' },
  '独立／其他': { en: 'Independent / Other', ja: '独立／その他' },
  '未知': { en: 'Unknown', ja: '不明' },
  '学园都市': { en: 'Academy City', ja: '学園都市' },
  '日本': { en: 'Japan', ja: '日本' },
  '中国': { en: 'China', ja: '中国' },
  '英国': { en: 'United Kingdom', ja: 'イギリス' },
  '意大利': { en: 'Italy', ja: 'イタリア' },
  '梵蒂冈': { en: 'Vatican City', ja: 'バチカン' },
  '欧洲': { en: 'Europe', ja: 'ヨーロッパ' },
  '北欧': { en: 'Northern Europe', ja: '北欧' },
  '俄罗斯': { en: 'Russia', ja: 'ロシア' },
  '亚洲': { en: 'Asia', ja: 'アジア' },
  '埃及': { en: 'Egypt', ja: 'エジプト' },
  '墨西哥': { en: 'Mexico', ja: 'メキシコ' },
  '魔法禁书目录（旧约）': { en: 'A Certain Magical Index (Old Testament)', ja: 'とある魔術の禁書目録（旧約）' },
  '某魔法的禁书目录（旧约）': { en: 'A Certain Magical Index (Old Testament)', ja: 'とある魔術の禁書目録（旧約）' },
  '魔法禁书目录 SS': { en: 'A Certain Magical Index SS', ja: 'とある魔術の禁書目録 SS' },
  '魔法禁书目录 SS2': { en: 'A Certain Magical Index SS2', ja: 'とある魔術の禁書目録 SS2' },
  '新约 魔法禁书目录': { en: 'A Certain Magical Index: New Testament', ja: '新約 とある魔術の禁書目録' },
  '新约 某魔法的禁书目录': { en: 'A Certain Magical Index: New Testament', ja: '新約 とある魔術の禁書目録' },
  '创约 魔法禁书目录': { en: 'A Certain Magical Index: Genesis Testament', ja: '創約 とある魔術の禁書目録' },
  '创约 某魔法的禁书目录': { en: 'A Certain Magical Index: Genesis Testament', ja: '創約 とある魔術の禁書目録' },
  '魔法禁书目录 SP': { en: 'A Certain Magical Index SP', ja: 'とある魔術の禁書目録 SP' },
  '某科学的超电磁炮（漫画）': { en: 'A Certain Scientific Railgun (manga)', ja: 'とある科学の超電磁砲（漫画）' },
  '某科学的超电磁炮': { en: 'A Certain Scientific Railgun', ja: 'とある科学の超電磁砲' },
  '某科学的超电磁炮（动画）': { en: 'A Certain Scientific Railgun (anime)', ja: 'とある科学の超電磁砲（アニメ）' },
  '某科学的一方通行': { en: 'A Certain Scientific Accelerator', ja: 'とある科学の一方通行' },
  '剧场版 魔法禁书目录：恩底弥翁的奇迹': { en: 'A Certain Magical Index: The Miracle of Endymion', ja: '劇場版 とある魔術の禁書目録 -エンデュミオンの奇蹟-' },
  '能力者': { en: 'Esper', ja: '能力者' },
  '克隆能力者': { en: 'Esper clone', ja: 'クローン能力者' },
  '无能力者': { en: 'Level 0', ja: '無能力者' },
  '原石': { en: 'Gemstone', ja: '原石' },
  '研究人员': { en: 'Researcher', ja: '研究者' },
  '教师': { en: 'Teacher', ja: '教師' },
  '治安人员': { en: 'Law enforcement', ja: '治安要員' },
  '医生': { en: 'Doctor', ja: '医師' },
  '魔法师': { en: 'Magician', ja: '魔術師' },
  '自由魔法师': { en: 'Freelance magician', ja: 'フリーの魔術師' },
  '修女魔法师': { en: 'Nun magician', ja: 'シスター兼魔術師' },
  '修女': { en: 'Nun', ja: 'シスター' },
  '主教魔法师': { en: 'Bishop magician', ja: '司教兼魔術師' },
  '骑士魔法师': { en: 'Knight magician', ja: '騎士兼魔術師' },
  '圣人': { en: 'Saint', ja: '聖人' },
  '魔神': { en: 'Magic God', ja: '魔神' },
  '王室成员': { en: 'Royal family member', ja: '王族' },
  '暗部成员': { en: 'Dark Side operative', ja: '暗部構成員' },
  '潜入人员': { en: 'Infiltrator', ja: '潜入要員' },
  '势力领导者': { en: 'Faction leader', ja: '勢力の指導者' },
  '人工生命': { en: 'Artificial life-form', ja: '人工生命' },
  '超越性存在': { en: 'Transcendent being', ja: '超越的存在' },
  '普通市民': { en: 'Civilian', ja: '一般市民' },
  '学园都市居民': { en: 'Academy City resident', ja: '学園都市の住民' },
  '企业经营者': { en: 'Corporate operator', ja: '企業経営者' },
};

const ORGANIZATIONS: Record<string, TranslationPair> = {
  'DA': { en: 'DA', ja: 'DA' }, 'L.S.S.': { en: 'L.S.S.', ja: 'L.S.S.' },
  '三泽塾': { en: 'Misawa Cram School', ja: '三沢塾' }, '上条家': { en: 'Kamijou family', ja: '上条家' },
  '上里势力': { en: 'Kamizato faction', ja: '上里勢力' }, '不死者': { en: 'Immortals', ja: '不死者' },
  '亚雷斯塔协力者': { en: "Aleister's collaborators", ja: 'アレイスターの協力者' }, '人工天使': { en: 'Artificial Angel', ja: '人工天使' },
  '俄罗斯成教': { en: 'Russian Orthodox Church', ja: 'ロシア成教' }, '先进状况救助队（MAR）': { en: 'Multi Active Rescue', ja: '先進状況救助隊（MAR）' },
  '克隆多莉计划': { en: 'Clone Dolly Project', ja: 'クローンドリー計画' }, '土御门家': { en: 'Tsuchimikado family', ja: '土御門家' },
  '天使坠落嫌疑人': { en: 'Angel Fall suspect', ja: 'エンゼルフォール容疑者' }, '天草式十字凄教': { en: 'Amakusa-Style Remix of Church', ja: '天草式十字凄教' },
  '奥雷尔斯一行': { en: "Ollerus's group", ja: 'オッレルス一行' }, '女仆学校': { en: 'Maid school', ja: 'メイド学校' },
  '女武神': { en: 'Valkyrie', ja: 'ワルキューレ' }, '女王舰队': { en: "Queen's Fleet", ja: '女王艦隊' },
  '妹妹们（SISTERS）': { en: 'SISTERS', ja: '妹達（シスターズ）' }, '学园都市医院': { en: 'Academy City hospital', ja: '学園都市の病院' },
  '学校（SCHOOL）': { en: 'SCHOOL', ja: 'スクール（SCHOOL）' }, '常盘台中学': { en: 'Tokiwadai Middle School', ja: '常盤台中学' },
  '常盘台学生宿舍': { en: 'Tokiwadai dormitory', ja: '常盤台学生寮' }, '幻想御手使用者': { en: 'Level Upper user', ja: '幻想御手使用者' },
  '御坂家': { en: 'Misaka family', ja: '御坂家' }, '御坂网络': { en: 'Misaka Network', ja: 'ミサカネットワーク' },
  '必要之恶教会': { en: 'Necessarius', ja: '必要悪の教会（ネセサリウス）' }, '忍者': { en: 'Ninja', ja: '忍者' },
  '恩底弥翁计划': { en: 'Endymion Project', ja: 'エンデュミオン計画' }, '成员（MEMBER）': { en: 'MEMBER', ja: 'メンバー（MEMBER）' },
  '才人工房（Clone Dolly）': { en: 'Clone Dolly', ja: '才人工房（クローンドリー）' }, '抛弃物儿童（Child Error）': { en: 'Child Error', ja: '置き去り（チャイルドエラー）' },
  '新生之光': { en: 'New Light', ja: '新たなる光' }, '新生（STUDY）': { en: 'STUDY', ja: 'スタディ（STUDY）' },
  '暗部': { en: 'Dark Side', ja: '暗部' }, '有翼者归来': { en: 'Return of the Winged One', ja: '翼ある者の帰還' },
  '木原一族': { en: 'Kihara family', ja: '木原一族' }, '木原研究所': { en: 'Kihara laboratory', ja: '木原研究所' },
  '木山实验组': { en: "Kiyama's research group", ja: '木山研究班' }, '某高中': { en: 'A Certain High School', ja: 'とある高校' },
  '栅川中学': { en: 'Sakugawa Middle School', ja: '柵川中学' }, '格雷姆林': { en: 'GREMLIN', ja: 'グレムリン' },
  '桥架结社': { en: 'Bridge Builders Cabal', ja: '橋架結社' }, '武装无能力集团（Skill-Out）': { en: 'Skill-Out', ja: '武装無能力者集団（スキルアウト）' },
  '歼灭白书': { en: 'Annihilatus', ja: '殲滅白書' }, '海原家': { en: 'Unabara family', ja: '海原家' },
  '灵魂研究计划': { en: 'Soul research project', ja: '魂魄研究計画' }, '猎犬部队（Hound Dog）': { en: 'Hound Dog', ja: '猟犬部隊（ハウンドドッグ）' },
  '真正的格雷姆林': { en: 'True GREMLIN', ja: '真のグレムリン' }, '神之右席': { en: "God's Right Seat", ja: '神の右席' },
  '第三次制造计划': { en: 'Third Season Project', ja: '第三次製造計画' }, '绝对能力进化计划': { en: 'Level 6 Shift Project', ja: '絶対能力進化計画' },
  '统括理事会': { en: 'Board of Directors', ja: '統括理事会' }, '罗森塔尔家族': { en: 'Rosenthal family', ja: 'ローゼンタール家' },
  '罗森塔尔模拟魂魄': { en: 'Rosenthal pseudo-souls', ja: 'ローゼンタール式擬似魂魄' }, '罗马正教': { en: 'Roman Catholic Church', ja: 'ローマ正教' },
  '英国清教': { en: 'Anglican Church', ja: 'イギリス清教' }, '英国王室': { en: 'British Royal Family', ja: 'イギリス王室' },
  '英国骑士派': { en: 'English Knights', ja: '騎士派' }, '菱形研究组': { en: "Hishigata's research group", ja: '菱形研究班' },
  '蔷薇十字': { en: 'Rosicrucian Order', ja: '薔薇十字' }, '虚数学区·五行机关': { en: 'Imaginary Number District', ja: '虚数学区・五行機関' },
  '警备员（Anti-Skill）': { en: 'Anti-Skill', ja: '警備員（アンチスキル）' }, '赫尔墨斯协会': { en: 'Hermetic Society', ja: 'ヘルメス学会' },
  '超绝者': { en: 'Transcendents', ja: '超絶者' }, '轨道电梯公司': { en: 'Orbital elevator company', ja: '軌道エレベーター運営会社' },
  '道具（ITEM）': { en: 'ITEM', ja: 'アイテム（ITEM）' }, '雅妮丝部队': { en: 'Agnese Forces', ja: 'アニェーゼ部隊' },
  '集团（GROUP）': { en: 'GROUP', ja: 'グループ（GROUP）' }, '风纪委员': { en: 'Judgment', ja: '風紀委員' },
  '风纪委员第177支部': { en: 'Judgment Branch 177', ja: '風紀委員第177支部' }, '食蜂派阀': { en: "Shokuhou's clique", ja: '食蜂派閥' },
  '魔神未遂': { en: 'Failed Magic God', ja: '魔神未遂' }, '黄金黎明': { en: 'Golden Dawn', ja: '黄金夜明' },
  '黄金黎明导师': { en: 'Golden Dawn mentor', ja: '黄金夜明の導師' }, '黎明晨光': { en: 'Dawn-Colored Sunlight', ja: '明け色の陽射し' },
  '黑暗的五月计划': { en: 'Dark May Project', ja: '暗闇の五月計画' },
};

const SUFFIXES: Record<string, TranslationPair> = {
  '前研究人员': { en: 'former researcher', ja: '元研究者' }, '研究人员': { en: 'researcher', ja: '研究者' },
  '前领导者': { en: 'former leader', ja: '元指導者' }, '领导者': { en: 'leader', ja: '指導者' },
  '第二公主': { en: 'Second Princess', ja: '第二王女' }, '第三公主': { en: 'Third Princess', ja: '第三王女' },
  '学生': { en: 'student', ja: '生徒' }, '教师': { en: 'teacher', ja: '教師' }, '医生': { en: 'doctor', ja: '医師' },
  '指挥官': { en: 'commander', ja: '指揮官' }, '负责人': { en: 'head', ja: '責任者' },
  '大主教': { en: 'archbishop', ja: '大主教' }, '主教': { en: 'bishop', ja: '司教' },
  '侍女': { en: 'maid', ja: '侍女' }, '父亲': { en: 'father', ja: '父' }, '母亲': { en: 'mother', ja: '母' },
  '控制者': { en: 'controller', ja: '支配者' }, '实验对象': { en: 'test subject', ja: '実験対象' },
  '核心人物': { en: 'central figure', ja: '中心人物' }, '前成员': { en: 'former member', ja: '元メンバー' },
  '成员': { en: 'member', ja: 'メンバー' }, '相关人员': { en: 'associate', ja: '関係者' },
  '协力者': { en: 'collaborator', ja: '協力者' }, '管理者': { en: 'administrator', ja: '管理者' },
  '传教士': { en: 'missionary', ja: '宣教師' }, '代理教皇': { en: 'Pope substitute', ja: '代理教皇' },
};

function locale(language: string): 'zh' | 'en' | 'ja' {
  const root = language.split('-')[0];
  return root === 'en' || root === 'ja' ? root : 'zh';
}

function translateExact(value: string, language: string): string | null {
  const lang = locale(language);
  if (lang === 'zh') return value;
  const translated = VALUES[value] ?? ORGANIZATIONS[value];
  return translated?.[lang] ?? null;
}

export function localizeLoreValue(_t: TFunction, value: string, language: string): string {
  if (!value || locale(language) === 'zh') return value;
  const direct = translateExact(value, language);
  if (direct) return direct;
  if (value.includes('、')) {
    return value.split('、').map((part) => localizeLoreValue(_t, part, language)).join(locale(language) === 'ja' ? '、' : ', ');
  }
  const organization = Object.keys(ORGANIZATIONS)
    .sort((left, right) => right.length - left.length)
    .find((name) => value.startsWith(name));
  if (!organization) return value;
  const suffix = value.slice(organization.length);
  const translatedOrganization = translateExact(organization, language) ?? organization;
  if (!suffix) return translatedOrganization;
  const translatedSuffix = SUFFIXES[suffix]?.[locale(language) as 'en' | 'ja'];
  if (!translatedSuffix) return value;
  return locale(language) === 'ja'
    ? `${translatedOrganization}の${translatedSuffix}`
    : `${translatedOrganization} ${translatedSuffix}`;
}
