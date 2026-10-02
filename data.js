// day: 0=月 1=火 2=水 3=木 4=金 / from, to: 時限（両端を含む）
// status: "tentative" = 迷い中, "either" = どちらか一方
// 生涯教育学のコードは元画像で書き込みに隠れて読めない（末尾 497 のみ判読）
const PEOPLE = [
  {
    id: "osaka",
    label: "阪大",
    school: "大阪大学 人間科学部",
    term: "2026年度",
    periods: [
      { no: 1, start: "8:50", end: "10:20" },
      { no: 2, start: "10:30", end: "12:00" },
      { no: 3, start: "13:30", end: "15:00" },
      { no: 4, start: "15:10", end: "16:40" },
      { no: 5, start: "16:50", end: "18:20" },
    ],
    classes: [
      { day: 0, from: 2, to: 2, code: "010796", name: "感情・人格心理学（理論と実践）", teacher: "直原 康光", room: "本館44講義室", building: "本館" },
      { day: 0, from: 3, to: 3, code: "010794", name: "教育工学", teacher: "西森 年寿", room: "本館33講義室", building: "本館" },
      { day: 0, from: 4, to: 4, code: "010742", name: "心理学統計法", teacher: "山本 倫生", room: "本館51講義室", building: "本館" },
      { day: 1, from: 2, to: 2, code: "010739", name: "比較発達行動学（発達心理学）", teacher: "鹿子木 康弘", room: "本館51講義室", building: "本館" },
      { day: 1, from: 3, to: 3, code: "", name: "生涯教育学", teacher: "北山 夕華", room: "東館303講義室", building: "東館" },
      { day: 2, from: 1, to: 1, code: "019834", name: "認知行動工学", teacher: "平井 啓", room: "CiDER新棟", building: "CiDER新棟" },
      { day: 2, from: 2, to: 2, code: "010733", name: "社会・集団・家族心理学", teacher: "三浦 麻子", room: "CiDER新棟", building: "CiDER新棟" },
      { day: 2, from: 3, to: 3, code: "010804", name: "基礎心理学（知覚・認知心理学）", teacher: "入戸野 宏", room: "東館303講義室", building: "東館" },
      { day: 3, from: 2, to: 2, code: "010734", name: "臨床死生学・老年行動学（福祉心理学）", teacher: "権藤 恭之", room: "本館41講義室", building: "本館" },
      { day: 4, from: 1, to: 1, code: "010749", name: "司法・犯罪心理学", teacher: "直原 康光", room: "本館51講義室", building: "本館" },
      { day: 4, from: 2, to: 2, code: "010752", name: "臨床心理学概論", teacher: "佐々木 淳", room: "東館207講義室", building: "東館" },
      { day: 4, from: 3, to: 5, code: "010755", name: "臨床教育学実験実習Ⅰ", teacher: "野村 晴夫", room: "東館106講義室", building: "東館" },
    ],
  },
  {
    id: "tokyo",
    label: "東工大",
    school: "東京科学大学 大岡山",
    term: "2026年度 3Q",
    periods: [
      { no: 1, start: "8:50", end: "10:30" },
      { no: 2, start: "10:45", end: "12:25" },
      { no: 3, start: "13:30", end: "15:10" },
      { no: 4, start: "15:25", end: "17:05" },
      { no: 5, start: "17:15", end: "18:55" },
    ],
    classes: [
      { day: 0, from: 1, to: 1, code: "L331", name: "生体工学基礎", room: "I3-201A", building: "石川台3号館" },
      { day: 1, from: 1, to: 1, code: "J333", name: "トライボロジーの基礎", room: "I1-256", building: "石川台1号館" },
      { day: 1, from: 2, to: 2, code: "F331", name: "応用流体力学", room: "I1-256", building: "石川台1号館" },
      { day: 1, from: 3, to: 4, code: "Q324", name: "メカトロデザイン PJ", room: "I3-201A", building: "石川台3号館" },
      { day: 2, from: 1, to: 1, code: "K353", name: "韓国語3", room: "M-B43", building: "本館B1F" },
      { day: 3, from: 1, to: 1, code: "L311", name: "人間中心情報学", room: "I1-256", building: "石川台1号館" },
      { day: 3, from: 3, to: 3, code: "N331", name: "自動車・モビリティ技術", room: "I1-256", building: "石川台1号館" },
      { day: 3, from: 4, to: 4, code: "J331", name: "マイクロ・ナノ加工基礎", room: "I3-203", building: "石川台3号館" },
      { day: 4, from: 3, to: 4, code: "Q324", name: "メカトロデザイン PJ", room: "I3-201A", building: "石川台3号館" },
    ],
  }
];
