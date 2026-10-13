// day: 0=月 1=火 2=水 3=木 4=金 / from, to: 時限（両端を含む）
// 東京科学大は 100分=1コマ で数える（公式の 1-2限 → from: 1, 5-8限 → from: 3, to: 4）
// status: "tentative" = 迷い中, "either" = どちらか一方
// ko: 韓国語表示のときに使う名前（ないものは日本語のまま出す）
const PEOPLE = [
  {
    id: "osaka",
    label: "阪大",
    school: "大阪大学 人間科学部",
    term: "2026年度 秋学期",
    ko: { label: "오사카대", school: "오사카대학 인간과학부", term: "2026학년도 가을학기" },
    periods: [
      { no: 1, start: "8:50", end: "10:20" },
      { no: 2, start: "10:30", end: "12:00" },
      { no: 3, start: "13:30", end: "15:00" },
      { no: 4, start: "15:10", end: "16:40" },
      { no: 5, start: "16:50", end: "18:20" },
    ],
    classes: [
      { day: 0, from: 3, to: 3, code: "010794", name: "教育工学", teacher: "西森 年寿", room: "本館33講義室", building: "本館", ko: { name: "교육공학", room: "본관 33강의실" } },
      { day: 0, from: 4, to: 4, code: "010742", name: "心理学統計法", teacher: "山本 倫生", room: "本館51講義室", building: "本館", ko: { name: "심리학 통계법", room: "본관 51강의실" } },
      { day: 1, from: 2, to: 2, code: "010739", name: "比較発達行動学（発達心理学）", teacher: "鹿子木 康弘", room: "本館51講義室", building: "本館", ko: { name: "비교 발달 행동학 (발달심리학)", room: "본관 51강의실" } },
      { day: 1, from: 3, to: 3, code: "010497", name: "生涯教育学", teacher: "北山 夕華", room: "東館303講義室", building: "東館", ko: { name: "평생교육학", room: "동관 303강의실" } },
      { day: 2, from: 2, to: 2, code: "010733", name: "社会・集団・家族心理学", teacher: "三浦 麻子", room: "CiDER新棟 203大会議室", building: "CiDER新棟", ko: { name: "사회·집단·가족 심리학", room: "CiDER 신관 203 대회의실" } },
      { day: 2, from: 3, to: 3, code: "010804", name: "基礎心理学（知覚・認知心理学）", teacher: "入戸野 宏", room: "東館303講義室", building: "東館", ko: { name: "기초 심리학 (지각·인지 심리학)", room: "동관 303강의실" } },
      { day: 3, from: 2, to: 2, code: "010734", name: "臨床死生学・老年行動学（福祉心理学）", teacher: "権藤 恭之", room: "本館41講義室", building: "本館", ko: { name: "임상 사생학·노년 행동학 (복지 심리학)", room: "본관 41강의실" } },
      { day: 4, from: 1, to: 1, code: "010749", name: "司法・犯罪心理学", teacher: "直原 康光", room: "本館51講義室", building: "本館", ko: { name: "사법·범죄 심리학", room: "본관 51강의실" } },
      { day: 4, from: 2, to: 2, code: "010752", name: "臨床心理学概論", teacher: "佐々木 淳", room: "東館207講義室", building: "東館", ko: { name: "임상심리학 개론", room: "동관 207강의실" } },
      { day: 4, from: 3, to: 5, code: "010755", name: "臨床教育学実験実習Ⅰ（心理的アセスメント）", teacher: "野村 晴夫", room: "東館106講義室", building: "東館", ko: { name: "임상교육학 실험실습 Ⅰ (심리 평가)", room: "동관 106강의실" } },
    ],
  },
  {
    id: "tokyo",
    label: "東工大",
    school: "東京科学大学 大岡山",
    term: "2026年度 3Q",
    ko: { label: "도쿄공대", school: "도쿄과학대학 오오카야마", term: "2026학년도 3Q" },
    periods: [
      { no: 1, start: "8:50", end: "10:30" },
      { no: 2, start: "10:45", end: "12:25" },
      { no: 3, start: "13:30", end: "15:10" },
      { no: 4, start: "15:25", end: "17:05" },
      { no: 5, start: "17:15", end: "18:55" },
    ],
    classes: [
      { day: 0, from: 1, to: 1, code: "MEC.L331", name: "生体工学基礎", teacher: "八木 透, 柳田 保子, 古川 克子", room: "I3-201A", building: "石川台3号館", ko: { name: "생체공학 기초" } },
      { day: 1, from: 3, to: 4, code: "MEC.Q324", name: "メカトロデザイン PJ", teacher: "各 教員", room: "I3-201A", building: "石川台3号館", ko: { name: "메카트로 디자인 PJ", teacher: "각 교원" } },
      { day: 2, from: 1, to: 1, code: "LAL.K353", name: "韓国語3", teacher: "※承 賢珠", room: "M-B43", building: "本館B1F", ko: { name: "한국어 3" } },
      { day: 3, from: 1, to: 1, code: "MEC.L311", name: "人間中心情報学", teacher: "西田 佳史, 藤原 武男, ※北村 光司", room: "I1-256", building: "石川台1号館", ko: { name: "인간 중심 정보학" } },
      { day: 3, from: 3, to: 3, code: "MEC.N331", name: "自動車・モビリティ技術", teacher: "伏信 一慶, 小竹 元基, ※萩本 隆寛 他", room: "I1-256", building: "石川台1号館", ko: { name: "자동차·모빌리티 기술" } },
      { day: 4, from: 3, to: 4, code: "MEC.Q324", name: "メカトロデザイン PJ", teacher: "各 教員", room: "I3-201A", building: "石川台3号館", ko: { name: "메카트로 디자인 PJ", teacher: "각 교원" } },
    ],
  }
];
