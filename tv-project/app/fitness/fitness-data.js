(function (w) {
'use strict';
/* MorphTV Fitness — structured exercise + program library (data-driven, no UI logic here). */
var C = w.ClearTV = w.ClearTV || {};
function N(en, ar, fr, zh, ja) { return { en: en, ar: ar, fr: fr, zh: zh, ja: ja }; }

var CATS = [
  { id: 'full_body',  name: N('Full Body','كامل الجسم','Corps entier','全身','全身'),          icon: 'bolt' },
  { id: 'upper_body', name: N('Upper Body','الجزء العلوي','Haut du corps','上半身','上半身'),    icon: 'upper' },
  { id: 'lower_body', name: N('Lower Body','الجزء السفلي','Bas du corps','下半身','下半身'),     icon: 'lower' },
  { id: 'core',       name: N('Core & Abs','البطن والجذع','Abdos','核心','体幹'),                 icon: 'core' },
  { id: 'cardio',     name: N('Cardio','كارديو','Cardio','有氧','有酸素'),                        icon: 'heart' },
  { id: 'hiit',       name: N('HIIT','هيت عالي الكثافة','HIIT','高强度间歇','HIIT'),              icon: 'flame' },
  { id: 'strength',   name: N('Strength','قوة','Musculation','力量','筋力'),                      icon: 'dumbbell' },
  { id: 'stretching', name: N('Stretching','تمدد','Étirements','拉伸','ストレッチ'),             icon: 'leaf' },
  { id: 'mobility',   name: N('Mobility','مرونة المفاصل','Mobilité','灵活性','モビリティ'),     icon: 'wave' },
  { id: 'low_impact', name: N('Low Impact','منخفض التأثير','Doux','低冲击','低負荷'),            icon: 'feather' },
  { id: 'warmup',     name: N('Warm-Up','إحماء','Échauffement','热身','ウォームアップ'),        icon: 'sun' },
  { id: 'recovery',   name: N('Recovery','استشفاء','Récupération','恢复','リカバリー'),          icon: 'moon' }
];

/* E(id, cat, lvl 1-3, equip, secs, rest, met, muscles[], name5, cueEn, cueAr) */
function E(id, cat, lvl, equip, secs, rest, met, muscles, name, cueEn, cueAr, mod) {
  return { id: id, cat: cat, level: lvl, equip: equip, secs: secs, rest: rest, met: met,
    muscles: muscles, name: name, cueEn: cueEn, cueAr: cueAr, mod: mod || '',
    image: 'fitness/exercises/' + id, demo: 'fitness/exercises/' + id + '_demo' };
}
var NONE = 'none';

var EX = [
E('bodyweight_squat','lower_body',1,NONE,40,15,5.0,['quads','glutes'],N('Bodyweight Squat','سكوات بوزن الجسم','Squat','自重深蹲','スクワット'),'Feet shoulder-width. Chest up, knees track over toes.','القدمين بعرض الكتفين. الصدر مرفوع والركب فوق مشط القدم.','Wall sit or half squat.'),
E('reverse_lunge','lower_body',1,NONE,45,20,5.5,['quads','glutes'],N('Reverse Lunge','لانجز خلفي','Fente arrière','后弓步','リバースランジ'),'Step back softly, torso tall.','ارجع خطوة للخلف بهدوء والجذع مستقيم.','Shorter step.'),
E('glute_bridge','lower_body',1,NONE,40,15,4.0,['glutes','hamstrings'],N('Glute Bridge','جسر المؤخرة','Pont fessier','臀桥','グルートブリッジ'),'Feet flat, lift hips and squeeze.','القدمان على الأرض وارفع الحوض مع الضغط.','Single small lifts.'),
E('calf_raise','lower_body',1,'chair',30,10,3.5,['calves'],N('Calf Raise','رفع السمانة','Mollets','提踵','カーフレイズ'),'Rise tall on toes, pause, lower slowly.','اصعد على أطراف الأصابع ثم انزل ببطء.','Hold wall.'),
E('push_up','upper_body',2,NONE,40,20,8.0,['chest','triceps'],N('Push-Up','ضغط','Pompe','俯卧撑','腕立て伏せ'),'Body straight from head to heels. Chest to floor.','الجسم مستقيم من الرأس للكعبين.','Knee push-up.'),
E('knee_push_up','upper_body',1,NONE,35,15,6.0,['chest','triceps'],N('Knee Push-Up','ضغط على الركب','Pompe genoux','跪姿俯卧撑','膝つき腕立て'),'Knees down, core tight, full range.','على الركب مع شد الجذع ومدى كامل.','Wall push-up.'),
E('shoulder_tap','upper_body',2,NONE,35,15,6.5,['core','shoulders'],N('Shoulder Tap','لمس الكتف','Touche épaule','交替摸肩','ショルダータップ'),'Plank position, tap opposite shoulder.','في وضع البلانك المس الكتف المعاكس.','Wider feet.'),
E('tricep_dip_chair','strength',2,'chair',35,20,6.0,['triceps'],N('Chair Dip','غطس على كرسي','Dips chaise','椅子臂屈伸','チェアディップス'),'Hands on chair, lower body with control.','اليدان على الكرسي وانزل بتحكم.','Bend knees more.'),
E('forearm_plank','core',1,NONE,40,20,4.0,['core'],N('Forearm Plank','بلانك الساعدين','Planche','平板支撑','フロントプランク'),'Elbows under shoulders, body one line.','المرفقان تحت الكتفين والجسم خط واحد.','Drop knees.'),
E('dead_bug','core',1,NONE,40,15,4.0,['core'],N('Dead Bug','الحشرة الميتة','Dead bug','死虫式','デッドバグ'),'Back pressed to floor, alternate limbs.','الظهر ملتصق بالأرض وبدّل الأطراف.','Smaller range.'),
E('bird_dog','core',1,NONE,40,15,4.0,['core','back'],N('Bird Dog','طائر الكلب','Bird dog','鸟狗式','バードドッグ'),'Extend opposite arm and leg, hips level.','مد الذراع والرجل المعاكستين والحوض ثابت.','Hands and knees only.'),
E('mountain_climber','cardio',2,NONE,40,20,9.0,['core','legs'],N('Mountain Climber','متسلق الجبال','Mountain climber','登山跑','マウンテンクライマー'),'Drive knees fast under chest.','ادفع الركب بسرعة تحت الصدر.','Slow march.'),
E('jumping_jack','cardio',1,NONE,40,15,8.0,['full'],N('Jumping Jack','قفز فتح وضم','Jumping jack','开合跳','ジャンピングジャック'),'Jump feet out, arms overhead.','اقفز بفتح الأرجل ورفع الذراعين.','Step jack.'),
E('step_jack','cardio',1,NONE,40,15,5.0,['full'],N('Step Jack','خطوة جانبية','Pas jack','踏步开合','ステップジャック'),'Step side to side, no jumping.','خطوة يميناً ويساراً دون قفز.','March in place.'),
E('high_knee','cardio',2,NONE,35,20,9.5,['legs','core'],N('High Knees','ركب عالية','Montées genoux','高抬腿','ハイニー'),'Run in place, knees to hip height.','اجري في مكانك والركب لمستوى الحوض.','March in place.'),
E('march_place','low_impact',1,NONE,40,10,3.5,['legs'],N('March in Place','مشي في المكان','Marche sur place','原地踏步','その場足踏み'),'Lift knees gently, swing arms.','ارفع الركب بهدوء مع تحريك الذراعين.','Seated march.'),
E('burpee','hiit',3,NONE,40,25,11.0,['full'],N('Burpee','بربي','Burpee','波比跳','バーピー'),'Squat, plank, jump up explosively.','سكوات ثم بلانك ثم قفزة انفجارية.','Squat thrust only.'),
E('squat_thrust','full_body',2,NONE,40,20,9.0,['full'],N('Squat Thrust','سكوات دفع','Squat thrust','深蹲后踢','スクワットスラスト'),'Squat to plank and back, no jump.','سكوات لبلانك والعودة دون قفزة.','Step back.'),
E('hip_circle','mobility',1,NONE,30,10,2.5,['hips'],N('Hip Circle','دوائر الحوض','Cercles hanches','髋部绕环','ヒップサークル'),'Big slow circles each direction.','دوائر كبيرة وبطيئة لكل اتجاه.','Small circles.'),
E('cat_cow','mobility',1,NONE,35,10,2.5,['spine'],N('Cat-Cow','قطة وبقرة','Chat-vache','猫牛式','キャットカウ'),'Arch and round spine with breath.','قوّس ودوّر العمود الفقري مع النفس.','Seated version.'),
E('child_pose','recovery',1,NONE,40,10,2.0,['back','lats'],N("Child's Pose",'وضع الطفل','Posture enfant','婴儿式','チャイルドポーズ'),'Knees wide, arms long, breathe deep.','الركب متباعدة والذراعان ممدودتان وتنفس عميق.','Pillow under chest.'),
E('hamstring_stretch','stretching',1,NONE,35,10,2.0,['hamstrings'],N('Hamstring Stretch','تمدد الخلفية','Étirement ischios','腘绳肌拉伸','ハムストリング stretch'),'Hinge at hips, gentle pull.','انحنِ من الحوض وشد بلطف.','Bend knee.'),
E('shoulder_stretch','stretching',1,NONE,30,10,2.0,['shoulders'],N('Shoulder Stretch','تمدد الكتف','Étirement épaule','肩部拉伸','肩ストレッチ'),'Pull arm across chest gently.','اسحب الذراع عبر الصدر بلطف.','Lower arm.'),
E('spinal_rotation','mobility',1,NONE,35,10,2.5,['spine','obliques'],N('Spinal Rotation','لف العمود الفقري','Rotation colonne','脊柱旋转','脊柱ローテーション'),'Lying twist, shoulders down.','التواء مستلقٍ مع تثبيت الكتفين.','Knees bent.'),
E('quad_stretch','stretching',1,'chair',30,10,2.0,['quads'],N('Quad Stretch','تمدد الفخذ','Étirement quadriceps','股四头肌拉伸','大腿四頭筋ストレッチ'),'Hold foot behind, knees together.','امسك القدم خلفك والركب معاً.','Hold chair.'),
E('knee_to_chest','recovery',1,NONE,30,10,2.0,['back','glutes'],N('Knee to Chest','الركبة للصدر','Genou poitrine','抱膝','ニーtoチェスト'),'Hug one knee, keep back flat.','احتضن ركبة واحدة والظهر مسطح.','Both knees.'),
E('arm_circle','warmup',1,NONE,30,10,2.5,['shoulders'],N('Arm Circles','دوائر الذراع','Cercles bras','手臂绕环','アームサークル'),'Small to big circles both ways.','دوائر من صغيرة لكبيرة بالاتجاهين.','Small only.'),
E('leg_swing','warmup',1,'chair',30,10,3.0,['hips','legs'],N('Leg Swing','مرجحة الرجل','Balancement jambe','摆腿','レッグスイング'),'Swing leg forward and back.','أرجح الرجل أماماً وخلفاً.','Hold support.'),
E('ankle_circle','mobility',1,'chair',30,10,1.5,['ankles'],N('Ankle Circle','دوائر الكاحل','Cercles cheville','踝绕环','足首回し'),'Lift foot and circle the ankle.','ارفع القدم ودوّر الكاحل.','Seated.'),
E('seated_march','low_impact',1,'chair',40,10,3.0,['legs'],N('Seated March','مشي جالس','Marche assise','坐姿踏步','座位行進'),'Sit tall, alternate knee lifts.','اجلس مستقيماً وبدّل رفع الركب.','Slow pace.'),
E('chair_squat','low_impact',1,'chair',40,15,3.5,['quads','glutes'],N('Chair Squat','سكوات الكرسي','Squat chaise','椅子深蹲','チェアスクワット'),'Sit back to touch, stand tall.','انزل للمس الكرسي ثم قف.','Partial sit.'),
E('water_break_march','recovery',1,NONE,30,5,1.5,['full'],N('Cool-Down March','مشي التهدئة','Marche retour','冷身踏步','クールダウン'),'Easy march, deep breaths.','مشي سهل مع أنفاس عميقة.','Standing breathe.'),
];

function P(id, lvl, mins, cat, rounds, exerciseIds, secsOverride, rest, name, descEn, descAr) {
  return { id: id, level: lvl, targetMins: mins, cat: cat, rounds: rounds,
    exercises: exerciseIds, secs: secsOverride || null, rest: rest,
    name: name, desc: { en: descEn, ar: descAr }, image: 'fitness/programs/' + id };
}
var PROGRAMS = [
P('quick_energy',1,5,'cardio',1,['march_place','jumping_jack','arm_circle','step_jack','seated_march','water_break_march'],null,15,N('Quick Energy','طاقة سريعة','Énergie rapide','快速能量','クイックエナジー'),'Five minutes to wake up your whole body.','خمس دقائق لتنشيط جسمك بالكامل.'),
P('morning_activation',1,7,'warmup',1,['arm_circle','leg_swing','hip_circle','ankle_circle','march_place','cat_cow','shoulder_stretch','glute_bridge'],null,15,N('Morning Activation','تنشيط الصباح','Réveil matin','晨间激活','モーニングアクティベーション'),'Gentle morning flow to start the day.','تدفق صباحي لطيف لبدء اليوم.'),
P('full_body_starter',1,10,'full_body',2,['bodyweight_squat','knee_push_up','glute_bridge','dead_bug','step_jack','child_pose'],30,20,N('Full Body Starter','البداية الشاملة','Départ complet','全身入门','全身スターター'),'A friendly full-body introduction.','مقدمة ودودة لتمارين الجسم الكامل.'),
P('core_abs',1,10,'core',2,['dead_bug','bird_dog','forearm_plank','shoulder_tap','glute_bridge','knee_to_chest'],30,20,N('Core & Abs','البطن والجذع','Abdos','核心','コア＆腹筋'),'Build a strong, stable midsection.','ابنِ جذعاً قوياً ومستقراً.'),
P('upper_strength',2,15,'upper_body',2,['push_up','knee_push_up','shoulder_tap','tricep_dip_chair','forearm_plank','bird_dog','shoulder_stretch'],35,20,N('Upper Body Strength','قوة الجزء العلوي','Haut du corps','上半身力量','上半身強化'),'Chest, shoulders, arms and back.','الصدر والكتفان والذراعان والظهر.'),
P('lower_power',2,15,'lower_body',2,['bodyweight_squat','reverse_lunge','glute_bridge','calf_raise','chair_squat','hip_circle','quad_stretch'],40,20,N('Lower Body Power','قوة الجزء السفلي','Bas du corps','下半身力量','下半身パワー'),'Legs and glutes that carry you.','أرجل ومؤخرة تحملك طوال اليوم.'),
P('fat_burn',2,15,'hiit',2,['jumping_jack','bodyweight_squat','mountain_climber','squat_thrust','high_knee','burpee','child_pose'],35,20,N('Fat Burn','حرق الدهون','Brûle-graisse','燃脂','脂肪燃焼'),'Sweaty intervals, big energy.','فترات متعرقة وطاقة كبيرة.'),
P('low_impact_cardio',1,15,'low_impact',2,['march_place','step_jack','seated_march','chair_squat','calf_raise','arm_circle','water_break_march'],40,15,N('Low Impact Cardio','كارديو لطيف','Cardio doux','低冲击有氧','低負荷カーディオ'),'Joint-friendly cardio for every day.','كارديو لطيف على المفاصل لكل يوم.'),
P('mobility_recovery',1,10,'mobility',1,['hip_circle','cat_cow','ankle_circle','spinal_rotation','hamstring_stretch','shoulder_stretch','knee_to_chest','child_pose'],40,10,N('Mobility & Recovery','المرونة والاستشفاء','Mobilité','灵活性恢复','モビリティ回復'),'Move well, feel new again.','تحرك جيداً واشعر بالتجدد.'),
P('full_body_strength',2,20,'strength',3,['bodyweight_squat','push_up','reverse_lunge','shoulder_tap','glute_bridge','tricep_dip_chair','bird_dog','forearm_plank'],35,20,N('Full Body Strength','قوة الجسم الكامل','Force complète','全身力量','全身筋力'),'Total-body strength in twenty minutes.','قوة الجسم الكامل في عشرين دقيقة.'),
P('hiit_blast',3,20,'hiit',3,['burpee','mountain_climber','squat_thrust','high_knee','jumping_jack','bodyweight_squat','forearm_plank','child_pose'],35,25,N('HIIT Blast','انفجار الهيت','HIIT intense','高强度间歇','HIITブラスト'),'Advanced intervals. Bring water.','فترات متقدمة. جهّز الماء.'),
P('cardio_endurance',2,20,'cardio',2,['jumping_jack','high_knee','mountain_climber','step_jack','march_place','arm_circle','squat_thrust','water_break_march'],45,20,N('Cardio Endurance','تحمل الكارديو','Endurance cardio','有氧耐力','有酸素持久力'),'Steady engine-building cardio.','كارديو ثابت لبناء التحمل.'),
P('strength_tone',2,25,'strength',3,['bodyweight_squat','push_up','reverse_lunge','tricep_dip_chair','glute_bridge','shoulder_tap','dead_bug','forearm_plank','quad_stretch'],40,20,N('Strength & Tone','قوة وتناسق','Tonification','力量塑形','筋力＆トーニング'),'Sculpt and strengthen everywhere.','انحت وقوِّ جسمك بالكامل.'),
P('full_body_challenge',3,30,'full_body',3,['burpee','push_up','bodyweight_squat','reverse_lunge','mountain_climber','dead_bug','shoulder_tap','squat_thrust','forearm_plank','child_pose'],40,25,N('Full Body Challenge','تحدي الجسم الكامل','Défi complet','全身挑战','全身チャレンジ'),'Thirty-minute total challenge.','تحدٍّ شامل لمدة ثلاثين دقيقة.'),
P('deep_stretch',1,20,'recovery',1,['child_pose','hamstring_stretch','shoulder_stretch','quad_stretch','cat_cow','spinal_rotation','hip_circle','knee_to_chest','ankle_circle','leg_swing'],45,10,N('Deep Stretch & Recovery','تمدد عميق واستشفاء','Étirement profond','深度拉伸','ディープストレッチ'),'Slow down and recover deeply.','اهدأ واستشفِ بعمق.')
];

/* Retired variations are resolved only when reading saved custom sessions. */
var RETIRED = {"sumo_squat":"bodyweight_squat","wall_sit":"chair_squat","forward_lunge":"reverse_lunge","side_lunge":"reverse_lunge","wall_push_up":"knee_push_up","pike_push_up":"push_up","plank_up_down":"shoulder_tap","superman_pull":"bird_dog","side_plank":"forearm_plank","bicycle_crunch":"dead_bug","reverse_crunch":"dead_bug","heel_touch":"dead_bug","leg_raise":"dead_bug","skater":"step_jack","butt_kick":"march_place","inchworm":"squat_thrust","jumping_squat":"bodyweight_squat","lunge_jump":"reverse_lunge","plank_jack":"mountain_climber","chest_opener":"shoulder_stretch","cobra_stretch":"cat_cow","downward_dog":"hamstring_stretch","torso_twist":"spinal_rotation","side_bend":"hip_circle","neck_roll":"arm_circle","standing_side_crunch":"march_place","gentle_jack":"step_jack","box_breathing":"water_break_march","plank_shoulder_stretch":"shoulder_stretch","glute_stretch":"knee_to_chest","slow_climber":"march_place"};

C.FitnessData = { CATEGORIES: CATS, EXERCISES: EX, PROGRAMS: PROGRAMS,
  resolveExerciseId: function (id) { return RETIRED[id] || id; },
  byId: function (id) { for (var i = 0; i < EX.length; i++) if (EX[i].id === id) return EX[i]; return null; },
  programById: function (id) { for (var i = 0; i < PROGRAMS.length; i++) if (PROGRAMS[i].id === id) return PROGRAMS[i]; return null; },
  estimateSecs: function (p, customSecs) {
    var total = 0;
    p.exercises.forEach(function (id) { var e = C.FitnessData.byId(id); if (e) total += (customSecs || p.secs || e.secs) + (p.rest || e.rest || 15); });
    total += 5; /* GO cue */ total += (p.rounds - 1) * 20; return Math.round(total * (p.rounds || 1) / Math.max(1, 1)) / 1;
  }
};
})(window);
