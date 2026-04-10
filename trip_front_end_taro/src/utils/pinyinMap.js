/**
 * 中文城市名 -> 拼音首字母映射
 * 用于城市选择器 A-Z 分组索引
 */

// 常用汉字首字母映射（覆盖 seed 中所有城市名首字）
const CHAR_TO_INITIAL = {
  '万': 'W', '三': 'S', '上': 'S', '东': 'D', '中': 'Z', '临': 'L',
  '丹': 'D', '丽': 'L', '乌': 'W', '乐': 'L', '九': 'J', '京': 'J',
  '伊': 'Y', '伦': 'L', '佛': 'F', '佳': 'J', '保': 'B', '儋': 'D',
  '六': 'L', '兰': 'L', '包': 'B', '北': 'B', '十': 'S', '南': 'N',
  '厦': 'X', '台': 'T', '合': 'H', '吉': 'J', '吐': 'T', '呼': 'H',
  '咸': 'X', '哈': 'H', '唐': 'T', '喀': 'K', '嘉': 'J', '四': 'S',
  '墨': 'M', '大': 'D', '天': 'T', '太': 'T', '威': 'W', '宁': 'N',
  '安': 'A', '宜': 'Y', '宝': 'B', '岳': 'Y', '巴': 'B', '常': 'C',
  '广': 'G', '延': 'Y', '开': 'K', '张': 'Z', '徐': 'X', '德': 'D',
  '恩': 'E', '悉': 'X', '惠': 'H', '成': 'C', '扬': 'Y', '承': 'C',
  '抚': 'F', '敦': 'D', '文': 'W', '新': 'X', '无': 'W', '旧': 'J',
  '昆': 'K', '晋': 'J', '普': 'P', '景': 'J', '曲': 'Q', '曼': 'M',
  '本': 'B', '杭': 'H', '柳': 'L', '株': 'Z', '桂': 'G', '梧': 'W',
  '榆': 'Y', '武': 'W', '毕': 'B', '汉': 'H', '汕': 'S', '沈': 'S',
  '泉': 'Q', '泰': 'T', '泸': 'L', '洛': 'L', '济': 'J', '海': 'H',
  '深': 'S', '清': 'Q', '温': 'W', '渭': 'W', '湖': 'H', '湘': 'X',
  '漳': 'Z', '潍': 'W', '烟': 'Y', '牡': 'M', '玉': 'Y', '珠': 'Z',
  '琼': 'Q', '百': 'B', '石': 'S', '福': 'F', '秦': 'Q', '纽': 'N',
  '绍': 'S', '绵': 'M', '芜': 'W', '苏': 'S', '荆': 'J', '莆': 'P',
  '蚌': 'B', '衡': 'H', '襄': 'X', '西': 'X', '许': 'X', '贵': 'G',
  '赣': 'G', '赤': 'C', '运': 'Y', '连': 'L', '迪': 'D', '通': 'T',
  '遵': 'Z', '邯': 'H', '郑': 'Z', '鄂': 'E', '酒': 'J', '重': 'C',
  '金': 'J', '铜': 'T', '锦': 'J', '长': 'C', '阜': 'F', '阿': 'A',
  '青': 'Q', '鞍': 'A', '首': 'S', '香': 'X', '马': 'M', '黄': 'H',
  '齐': 'Q', '龙': 'L',
};

/**
 * 获取城市名的拼音首字母（大写）
 * @param {string} name 城市名
 * @returns {string} 首字母，如 'B'、'S'，未匹配返回 '#'
 */
export const getInitial = (name) => {
  if (!name) return '#';
  const firstChar = name.charAt(0);
  // 英文字母直接返回
  if (/[a-zA-Z]/.test(firstChar)) return firstChar.toUpperCase();
  return CHAR_TO_INITIAL[firstChar] || '#';
};

/**
 * 将城市列表按拼音首字母分组
 * @param {Array} cities - 城市列表 [{id, name, ...}]
 * @returns {Array} 分组结果 [{letter: 'A', cities: [...]}, ...]
 */
export const groupByInitial = (cities) => {
  const groups = {};
  cities.forEach(city => {
    const letter = getInitial(city.name);
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(city);
  });

  return Object.keys(groups)
    .sort((a, b) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    })
    .map(letter => ({ letter, cities: groups[letter] }));
};
