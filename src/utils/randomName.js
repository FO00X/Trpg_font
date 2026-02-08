/**
 * 随机姓名生成（参考 COC 调查员卡：国家/地区 + 性别）
 * 支持：中国、日本、韩国、欧美、俄罗斯、印度、法国、德国、西班牙、意大利
 */

const nameChina = {
  surnames: ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫', '蒋', '沈', '韩', '杨', '朱', '秦', '尤', '许', '何', '吕', '施', '张', '孔', '曹', '严', '华', '金', '魏', '陶', '姜', '戚', '谢', '邹', '喻', '柏', '水', '窦', '章', '云', '苏', '潘', '葛', '奚', '范', '彭', '郎', '鲁', '韦', '昌', '马', '苗', '凤', '花', '方', '俞', '任', '袁', '柳', '酆', '鲍', '史', '唐', '费', '廉', '岑', '薛', '雷', '贺', '倪', '汤', '滕', '殷', '罗', '毕', '郝', '邬', '安', '常', '乐', '于', '时', '傅', '皮', '卞', '齐', '康', '伍', '余', '元', '卜', '顾', '孟', '平', '黄', '和', '穆', '萧', '尹'],
  doubleSurnames: ['欧阳', '上官', '司马', '诸葛', '司徒', '司空', '公孙', '东方', '皇甫', '尉迟', '公羊', '澹台', '申屠', '轩辕', '令狐', '宇文', '长孙', '慕容', '司徒', '南门', '呼延', '东郭', '百里', '南宫', '万俟', '端木', '梁丘', '左丘', '西门', '第五', '南荣', '东里', '仲长', '子书', '即墨', '纳兰', '归海'],
  maleSingleNames: ['伟', '强', '磊', '军', '洋', '勇', '杰', '涛', '明', '超', '亮', '飞', '健', '林', '波', '辉', '斌', '浩', '宇', '鑫', '俊', '龙', '峰', '鹏', '华', '剑', '刚', '平'],
  femaleSingleNames: ['芳', '娜', '敏', '静', '丽', '秀', '霞', '燕', '艳', '玲', '慧', '娟', '莉', '萍', '红', '梅', '琳', '婷', '莹', '洁'],
  maleDoubleNames: ['伟强', '志远', '俊杰', '浩然', '子轩', '博文', '梓轩', '宇轩', '浩宇', '雨泽', '文博', '致远', '志强', '子豪', '辰宇', '瑾瑜', '昊然', '明轩', '皓轩', '天佑', '嘉懿', '俊驰', '烨磊', '伟奇', '晟睿', '文昊', '修洁', '黎昕', '远航', '旭尧', '鸿涛', '荣轩', '越泽', '擎苍', '志泽', '睿渊', '弘文', '哲瀚', '楷瑞', '建辉'],
  femaleDoubleNames: ['雨涵', '欣怡', '佳怡', '梓涵', '可馨', '心怡', '诗涵', '静怡', '思涵', '梦琪', '雅琪', '梦涵', '雨婷', '佳琪', '思怡', '子涵', '雨欣', '梦瑶', '诗琪', '欣雨', '雨菲', '语嫣', '雨萱', '紫涵', '雨彤', '佳欣', '雨桐', '语桐', '欣桐', '语涵', '诗雨', '佳桐', '语菲'],
}

const nameJapan = {
  surnames: ['佐藤', '铃木', '高桥', '田中', '伊藤', '渡边', '山本', '中村', '小林', '加藤', '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '清水', '山崎', '中岛', '池田', '阿部', '桥本', '山下', '森', '石川', '前田', '小川', '藤田', '冈田', '后藤', '长谷川', '石井', '村上', '近藤', '坂本', '远藤', '青木', '藤井', '西村', '福田', '太田', '三浦', '藤原', '冈本', '松田', '中川', '中野', '原田', '小野', '田村', '竹内', '金子', '和田', '中山', '石田', '上田', '森田', '小岛', '柴田', '原', '宫崎', '酒井', '工藤', '横山', '宫本', '内田', '高木', '安藤', '岛田', '谷口', '大野', '高田', '丸山', '今井', '河野', '藤本', '村田', '武田', '上野', '杉山', '增田', '小山', '大冢', '平野', '菅原', '久保', '松井', '千叶', '岩崎', '樱井', '木下', '野口', '松尾', '菊地', '野村', '新井', '渡部', '樱田'],
  maleNames: ['一郎', '次郎', '三郎', '大辅', '大介', '大辉', '大翔', '健太', '健二', '浩二', '浩三', '太郎', '隆史', '隆志', '康夫', '康太', '博文', '博太', '文太', '文二', '明太', '明二'],
  femaleNames: ['美咲', '美雪', '美佳', '美穗', '美绪', '美和', '美纪', '美香', '美里', '真理', '真由', '真希', '真琴', '真央', '樱', '樱花', '樱子', '优子', '优香', '优希', '爱', '爱理', '爱菜', '莉子', '莉奈', '莉香', '麻美', '麻衣', '奈美', '奈奈', '奈绪', '香织', '香苗', '香奈', '明日香', '明日菜'],
}

const nameKorea = {
  surnames: ['金', '李', '朴', '崔', '郑', '姜', '赵', '尹', '张', '林', '韩', '申', '吴', '徐', '权', '黄', '安', '宋', '河', '全', '裴'],
  maleNames: ['泰熙', '承宪', '正锡', '智勋', '东健', '元彬', '钟硕', '秀贤', '敏镐', '相赫', '允浩', '在中', '昌珉', '俊秀', '硕贤', '基范', '始源', '东海', '厉旭', '圭贤', '晟敏', '银赫', '艺声', '强仁', '利特', '神童', '希澈', '泰民', '钟铉', '珉豪', '温流', '胜利', '太阳', '大声', '起光', '耀燮', '东云', '俊亨', '斗俊', '泽演', '佑荣', '俊昊', '灿盛', '润浩', '昌燮', '恩光', '东根', '陆星材', '李准', 'N', 'Leo', 'Ken', 'Ravi', 'Hongbin', 'Hyuk'],
  femaleNames: ['智孝', '恩惠', '智贤', '允儿', '秀智', '泰妍', '孝渊', 'Yuri', '秀英', '徐贤', '誉恩', '昭熙', '先艺', '宣美', '泫雅', '智妮', '智秀', '彩英', '智敏', '智恩', '智妍', '素妍', '恩静', '孝敏', '居丽', '宝蓝', '孝琳', '昭宥', 'IU', '昭妍', '孝定', '美延', '素恩', '素敏', '素拉', '素英', '素真', '素怡', '素贤', '素熙', '素妍', '素允', '素珍'],
}

const nameWestern = {
  maleNames: ['John', 'James', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Donald', 'Mark', 'Paul', 'Steven', 'Andrew', 'Kenneth', 'George', 'Joshua', 'Kevin', 'Brian', 'Edward', 'Ronald', 'Timothy', 'Jason', 'Jeffrey', 'Ryan', 'Jacob', 'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin', 'Samuel', 'Gregory', 'Alexander', 'Frank', 'Patrick', 'Raymond', 'Jack', 'Dennis', 'Jerry', 'Tyler', 'Aaron', 'Jose', 'Adam', 'Nathan', 'Henry', 'Douglas', 'Zachary', 'Peter', 'Kyle', 'Walter', 'Ethan', 'Jeremy', 'Harold', 'Keith', 'Christian', 'Roger', 'Noah', 'Gerald', 'Carl', 'Terry', 'Sean', 'Austin', 'Arthur', 'Lawrence', 'Jesse', 'Dylan', 'Bryan', 'Joe', 'Jordan', 'Billy', 'Bruce', 'Albert', 'Willie', 'Gabriel', 'Logan', 'Alan', 'Juan', 'Wayne', 'Roy', 'Ralph', 'Randy', 'Eugene', 'Vincent', 'Russell', 'Elijah', 'Louis', 'Bobby', 'Philip', 'Johnny'],
  femaleNames: ['Mary', 'Patricia', 'Linda', 'Barbara', 'Elizabeth', 'Jennifer', 'Maria', 'Susan', 'Margaret', 'Dorothy', 'Lisa', 'Nancy', 'Karen', 'Betty', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle', 'Sarah', 'Laura', 'Melissa', 'Deborah', 'Joan', 'Sharon', 'Megan', 'Kathleen', 'Amy', 'Shirley', 'Angela', 'Helen', 'Anna', 'Brenda', 'Pamela', 'Nicole', 'Katherine', 'Samantha', 'Christine', 'Debra', 'Rachel', 'Catherine', 'Carol', 'Janet', 'Ruth', 'Lauren', 'Rebecca', 'Theresa', 'Virginia', 'Jessica'],
  surnames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson', 'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez'],
}

const nameRussia = {
  maleNames: ['Alexander', 'Dmitry', 'Vladimir', 'Sergey', 'Andrey', 'Alexey', 'Maxim', 'Evgeniy', 'Ivan', 'Artem', 'Mikhail', 'Dmitriy', 'Vladislav', 'Roman', 'Kirill', 'Yuriy', 'Viktor', 'Denis', 'Stanislav', 'Andrei', 'Sergei', 'Alexei', 'Maksim', 'Eugene', 'Mihail', 'Dmitri', 'Yuri', 'Nikolai', 'Pavel', 'Oleg'],
  femaleNames: ['Anna', 'Maria', 'Ekaterina', 'Olga', 'Svetlana', 'Tatiana', 'Natalia', 'Yelena', 'Elena', 'Marina', 'Mariya', 'Yekaterina', 'Tatyana', 'Natalya', 'Irina', 'Daria', 'Anastasia', 'Victoria', 'Polina', 'Kristina'],
  surnames: ['Ivanov', 'Petrov', 'Sidorov', 'Kuznetsov', 'Smirnov', 'Vasiliev', 'Popov', 'Kovalev', 'Novikov', 'Morozov', 'Volkov', 'Solovyov', 'Voronov', 'Lebedev', 'Sokolov', 'Kozlov', 'Pavlov', 'Orlov', 'Golubev', 'Bogdanov', 'Zaitsev', 'Kuznetsova', 'Smirnova', 'Vasilieva', 'Popova', 'Kovaleva', 'Novikova', 'Ivanova', 'Petrova', 'Sidorova'],
}

const nameIndia = {
  maleNames: ['Rahul', 'Amit', 'Raj', 'Suresh', 'Vikram', 'Anil', 'Deepak', 'Sunil', 'Ravi', 'Ashok', 'Kumar', 'Sanjeev', 'Arun', 'Vivek', 'Manoj', 'Mahesh', 'Narendra', 'Prakash', 'Pradeep', 'Satish', 'Ramesh', 'Sanjay', 'Ajay', 'Vijay', 'Vinod', 'Rakesh', 'Shankar', 'Shyam', 'Vishal', 'Gopal', 'Harish', 'Dinesh', 'Sudhir', 'Naresh', 'Hari', 'Mohan', 'Ram', 'Shiv', 'Krishna', 'Ganesha'],
  femaleNames: ['Priya', 'Deepa', 'Rita', 'Sita', 'Geeta', 'Lata', 'Meera', 'Anita', 'Sunita', 'Kavita', 'Pooja', 'Shweta', 'Neha', 'Asha', 'Rekha', 'Anjali', 'Madhuri', 'Kumari', 'Rani', 'Padma', 'Lakshmi', 'Durga', 'Saraswati', 'Parvati', 'Radha', 'Gita', 'Meera', 'Anita', 'Sunita', 'Kavita', 'Pooja', 'Shweta', 'Neha', 'Asha', 'Rekha', 'Anjali', 'Madhuri', 'Kumari', 'Rani'],
  surnames: ['Sharma', 'Verma', 'Gupta', 'Singh', 'Rao', 'Patel', 'Desai', 'Joshi', 'Kumar', 'Babu', 'Nair', 'Pillai', 'Menon', 'Iyengar', 'Iyer', 'Nayak', 'Reddy', 'Choudhary', 'Yadav', 'Jha', 'Mishra', 'Tiwari', 'Tripathi', 'Shukla', 'Srivastava', 'Chaturvedi', 'Vishwakarma', 'Agrawal', 'Goyal', 'Jain', 'Mehta', 'Shah', 'Bhatt', 'Bhatia', 'Chopra', 'Malhotra', 'Kapoor', 'Khanna', 'Mehra', 'Gupta'],
}

const nameFrance = {
  maleNames: ['Jean', 'Pierre', 'Jacques', 'Michel', 'François', 'Philippe', 'Luc', 'Paul', 'Louis', 'Marc', 'Hugo', 'Alexandre', 'Quentin', 'Thomas', 'Romain', 'Maxime', 'Benjamin', 'Antoine', 'Nicolas', 'David', 'Sébastien', 'Guillaume', 'Matthieu', 'Charles', 'Olivier', 'Christophe', 'Laurent', 'Daniel', 'Gérard', 'Patrick'],
  femaleNames: ['Marie', 'Sophie', 'Julie', 'Nathalie', 'Isabelle', 'Catherine', 'Sandrine', 'Claire', 'Caroline', 'Aurélie', 'Laura', 'Emma', 'Camille', 'Lucie', 'Chloé', 'Léa', 'Manon', 'Pauline', 'Justine', 'Julie', 'Sophie', 'Nathalie', 'Isabelle', 'Catherine', 'Sandrine', 'Claire', 'Caroline', 'Aurélie', 'Laura', 'Emma'],
  surnames: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Lefebvre', 'Leroux', 'Morel', 'Fournier', 'Girard', 'Dupont', 'Lambert', 'Fontaine', 'Roux', 'David', 'Bertrand', 'Moreau', 'Leroy', 'Dupont', 'Lambert', 'Fontaine', 'Roux', 'David', 'Bertrand'],
}

const nameGermany = {
  maleNames: ['Michael', 'Thomas', 'Andreas', 'Christian', 'Stefan', 'Alexander', 'Markus', 'Matthias', 'Jan', 'Patrick', 'Martin', 'Daniel', 'Jens', 'Tobias', 'Benjamin', 'Tim', 'Kevin', 'Florian', 'Sven', 'Oliver', 'Lukas', 'Max', 'Moritz', 'Paul', 'Johannes', 'Philipp', 'Julian', 'Lennart', 'Niklas', 'Leon'],
  femaleNames: ['Anna', 'Julia', 'Sarah', 'Lisa', 'Jennifer', 'Sabrina', 'Jessica', 'Christina', 'Stefanie', 'Melissa', 'Marie', 'Anna', 'Julia', 'Sarah', 'Lisa', 'Jennifer', 'Sabrina', 'Jessica', 'Christina', 'Stefanie', 'Melissa', 'Marie', 'Anna', 'Julia', 'Sarah', 'Lisa', 'Jennifer', 'Sabrina', 'Jessica', 'Christina'],
  surnames: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Herrmann', 'Köhler', 'Bergmann', 'Lange', 'Schmid', 'Schmitz', 'Krause', 'Werner'],
}

const nameSpain = {
  maleNames: ['Juan', 'José', 'Carlos', 'Manuel', 'Antonio', 'Miguel', 'Javier', 'Francisco', 'David', 'Pablo', 'Daniel', 'Luis', 'Fernando', 'Alejandro', 'Sergio', 'Roberto', 'Jorge', 'Rafael', 'Pedro', 'Álvaro', 'Miguel Ángel', 'Diego', 'José Antonio', 'Jesús', 'Marcos', 'Carlos', 'Pablo', 'Sergio', 'Daniel'],
  femaleNames: ['María', 'Carmen', 'Ana', 'Luisa', 'Isabel', 'María Carmen', 'Ana María', 'Rosa', 'Dolores', 'Pilar', 'Marta', 'Laura', 'Sara', 'Cristina', 'Paula', 'Elena', 'Patricia', 'Lucía', 'Rocío', 'Beatriz', 'María José', 'Sofía', 'Julia', 'Ángela', 'Natalia', 'Eva', 'Valeria', 'Carla', 'Martina', 'Emma'],
  surnames: ['García', 'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Álvarez', 'Muñoz', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Molina'],
}

const nameItaly = {
  maleNames: ['Marco', 'Luca', 'Andrea', 'Giuseppe', 'Paolo', 'Giovanni', 'Roberto', 'Francesco', 'Domenico', 'Alessandro', 'Fabio', 'Lorenzo', 'Michele', 'Stefano', 'Giorgio', 'Massimo', 'Luigi', 'Simone', 'Matteo', 'Riccardo', 'Marco', 'Luca', 'Andrea', 'Giuseppe', 'Paolo', 'Giovanni', 'Roberto', 'Francesco', 'Domenico', 'Alessandro'],
  femaleNames: ['Maria', 'Anna', 'Laura', 'Sara', 'Chiara', 'Francesca', 'Giulia', 'Paola', 'Martina', 'Silvia', 'Alessandra', 'Elena', 'Valentina', 'Sofia', 'Gaia', 'Federica', 'Beatrice', 'Aurora', 'Ginevra', 'Emma', 'Maria', 'Anna', 'Laura', 'Sara', 'Chiara', 'Francesca', 'Giulia', 'Paola', 'Martina', 'Silvia'],
  surnames: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Marini', 'Vega', 'Lorenzo', 'Gatto', 'Pellegrini', 'Mariani', 'Santoro', 'Rinaldi', 'Caruso'],
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateChina(gender) {
  const surnames = Math.random() > 0.9 ? nameChina.doubleSurnames : nameChina.surnames
  const surname = pick(surnames)
  const useDouble = Math.random() > 0.5
  const firstNames = gender === 'female'
    ? (useDouble ? nameChina.femaleDoubleNames : nameChina.femaleSingleNames)
    : (useDouble ? nameChina.maleDoubleNames : nameChina.maleSingleNames)
  return surname + pick(firstNames)
}

function generateJapan(gender) {
  const surname = pick(nameJapan.surnames)
  const first = gender === 'female' ? pick(nameJapan.femaleNames) : pick(nameJapan.maleNames)
  return `${surname}${first}`
}

function generateKorea(gender) {
  const surname = pick(nameKorea.surnames)
  const first = gender === 'female' ? pick(nameKorea.femaleNames) : pick(nameKorea.maleNames)
  return `${surname}${first}`
}

function generateWestern(gender) {
  const first = gender === 'female' ? pick(nameWestern.femaleNames) : pick(nameWestern.maleNames)
  const last = pick(nameWestern.surnames)
  return `${first} ${last}`
}

function generateRussia(gender) {
  const first = gender === 'female' ? pick(nameRussia.femaleNames) : pick(nameRussia.maleNames)
  const last = pick(nameRussia.surnames)
  return `${first} ${last}`
}

function generateIndia(gender) {
  const first = gender === 'female' ? pick(nameIndia.femaleNames) : pick(nameIndia.maleNames)
  const last = pick(nameIndia.surnames)
  return `${first} ${last}`
}

function generateFrance(gender) {
  const first = gender === 'female' ? pick(nameFrance.femaleNames) : pick(nameFrance.maleNames)
  const last = pick(nameFrance.surnames)
  return `${first} ${last}`
}

function generateGermany(gender) {
  const first = gender === 'female' ? pick(nameGermany.femaleNames) : pick(nameGermany.maleNames)
  const last = pick(nameGermany.surnames)
  return `${first} ${last}`
}

function generateSpain(gender) {
  const first = gender === 'female' ? pick(nameSpain.femaleNames) : pick(nameSpain.maleNames)
  const last = pick(nameSpain.surnames)
  return `${first} ${last}`
}

function generateItaly(gender) {
  const first = gender === 'female' ? pick(nameItaly.femaleNames) : pick(nameItaly.maleNames)
  const last = pick(nameItaly.surnames)
  return `${first} ${last}`
}

export const NAME_COUNTRY_OPTIONS = [
  { value: 'china', label: '中国' },
  { value: 'japan', label: '日本' },
  { value: 'korea', label: '韩国' },
  { value: 'western', label: '欧美' },
  { value: 'russia', label: '俄罗斯' },
  { value: 'india', label: '印度' },
  { value: 'france', label: '法国' },
  { value: 'germany', label: '德国' },
  { value: 'spain', label: '西班牙' },
  { value: 'italy', label: '意大利' },
]

export const NAME_GENDER_OPTIONS = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'unknown', label: '未知' },
]

/**
 * 根据国家/地区与性别生成随机姓名
 * @param {string} country - 国家代码：china|japan|korea|western|russia|india|france|germany|spain|italy
 * @param {string} gender - male|female|unknown（unknown 时随机男女）
 */
export function generateName(country = 'china', gender = 'male') {
  const effectiveGender = gender === 'unknown' ? (Math.random() > 0.5 ? 'male' : 'female') : gender
  switch (country) {
    case 'china':
      return generateChina(effectiveGender)
    case 'japan':
      return generateJapan(effectiveGender)
    case 'korea':
      return generateKorea(effectiveGender)
    case 'western':
      return generateWestern(effectiveGender)
    case 'russia':
      return generateRussia(effectiveGender)
    case 'india':
      return generateIndia(effectiveGender)
    case 'france':
      return generateFrance(effectiveGender)
    case 'germany':
      return generateGermany(effectiveGender)
    case 'spain':
      return generateSpain(effectiveGender)
    case 'italy':
      return generateItaly(effectiveGender)
    default:
      return generateChina(effectiveGender)
  }
}
