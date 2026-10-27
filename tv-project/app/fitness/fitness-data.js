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
E('sumo_squat','lower_body',1,NONE,40,15,5.0,['glutes','adductors'],N('Sumo Squat','سكوات سومو','Squat sumo','相扑深蹲','スモウスクワット'),'Wide stance, toes out. Push knees out.','وقفة واسعة وأصابع للخارج. ادفع الركب للخارج.','Narrower stance.'),
E('wall_sit','lower_body',1,'wall',30,20,4.0,['quads'],N('Wall Sit','جلوس الحائط','Chaise murale','靠墙静蹲','ウォールシット'),'Back flat on wall, thighs parallel to floor.','الظهر على الحائط والفخذان موازيان للأرض.','Higher position.'),
E('forward_lunge','lower_body',2,NONE,45,20,6.0,['quads','glutes'],N('Forward Lunge','لانجز أمامي','Fente avant','前弓步','フォワードランジ'),'Step forward, both knees to 90 degrees.','اخطُ للأمام وانزل حتى 90 درجة للركبتين.','Hold a chair.'),
E('reverse_lunge','lower_body',1,NONE,45,20,5.5,['quads','glutes'],N('Reverse Lunge','لانجز خلفي','Fente arrière','后弓步','リバースランジ'),'Step back softly, torso tall.','ارجع خطوة للخلف بهدوء والجذع مستقيم.','Shorter step.'),
E('glute_bridge','lower_body',1,NONE,40,15,4.0,['glutes','hamstrings'],N('Glute Bridge','جسر المؤخرة','Pont fessier','臀桥','グルートブリッジ'),'Feet flat, lift hips and squeeze.','القدمان على الأرض وارفع الحوض مع الضغط.','Single small lifts.'),
E('calf_raise','lower_body',1,'chair',30,10,3.5,['calves'],N('Calf Raise','رفع السمانة','Mollets','提踵','カーフレイズ'),'Rise tall on toes, pause, lower slowly.','اصعد على أطراف الأصابع ثم انزل ببطء.','Hold wall.'),
E('side_lunge','lower_body',2,NONE,45,20,5.5,['adductors','quads'],N('Side Lunge','لانجز جانبي','Fente latérale','侧弓步','サイドランジ'),'Sit back to one side, other leg straight.','انزل على جانب واحد والرجل الأخرى مفرودة.','Shallow range.'),
E('push_up','upper_body',2,NONE,40,20,8.0,['chest','triceps'],N('Push-Up','ضغط','Pompe','俯卧撑','腕立て伏せ'),'Body straight from head to heels. Chest to floor.','الجسم مستقيم من الرأس للكعبين.','Knee push-up.'),
E('knee_push_up','upper_body',1,NONE,35,15,6.0,['chest','triceps'],N('Knee Push-Up','ضغط على الركب','Pompe genoux','跪姿俯卧撑','膝つき腕立て'),'Knees down, core tight, full range.','على الركب مع شد الجذع ومدى كامل.','Wall push-up.'),
E('wall_push_up','upper_body',1,'wall',35,15,3.5,['chest','shoulders'],N('Wall Push-Up','ضغط على الحائط','Pompe murale','靠墙俯卧撑','壁腕立て'),'Hands on wall, lean and press.','اليدان على الحائط وادفع بقوة.','Closer to wall.'),
E('pike_push_up','upper_body',2,NONE,35,20,7.0,['shoulders','triceps'],N('Pike Push-Up','ضغط الكتف','Pompe piquée','下犬俯卧撑','パイクプッシュアップ'),'Hips high in inverted V, lower head.','الوركان مرتفعان وأنزل الرأس ببطء.','Shorter hold.'),
E('shoulder_tap','upper_body',2,NONE,35,15,6.5,['core','shoulders'],N('Shoulder Tap','لمس الكتف','Touche épaule','交替摸肩','ショルダータップ'),'Plank position, tap opposite shoulder.','في وضع البلانك المس الكتف المعاكس.','Wider feet.'),
E('plank_up_down','upper_body',3,NONE,40,20,8.0,['core','triceps'],N('Plank Up-Down','بلانك صعود ونزول','Planche montée','平板支撑上下','プランクアップダウン'),'Forearms to hands without rotating hips.','من الساعدين لليدين دون لف الحوض.','Knees down.'),
E('superman_pull','upper_body',1,NONE,35,15,4.5,['back','glutes'],N('Superman Pull','سوبرمان','Superman','超人伸展','スーパーマン'),'Lift chest and legs, squeeze shoulder blades.','ارفع الصدر والرجلين مع ضم لوحي الكتف.','Lift chest only.'),
E('tricep_dip_chair','strength',2,'chair',35,20,6.0,['triceps'],N('Chair Dip','غطس على كرسي','Dips chaise','椅子臂屈伸','チェアディップス'),'Hands on chair, lower body with control.','اليدان على الكرسي وانزل بتحكم.','Bend knees more.'),
E('forearm_plank','core',1,NONE,40,20,4.0,['core'],N('Forearm Plank','بلانك الساعدين','Planche','平板支撑','フロントプランク'),'Elbows under shoulders, body one line.','المرفقان تحت الكتفين والجسم خط واحد.','Drop knees.'),
E('side_plank','core',2,NONE,30,20,4.5,['obliques'],N('Side Plank','بلانك جانبي','Planche latérale','侧平板','サイドプランク'),'Stack feet, hips high, per side.','القدمان فوق بعضهما والحوض مرتفع لكل جانب.','Knee on floor.'),
E('dead_bug','core',1,NONE,40,15,4.0,['core'],N('Dead Bug','الحشرة الميتة','Dead bug','死虫式','デッドバグ'),'Back pressed to floor, alternate limbs.','الظهر ملتصق بالأرض وبدّل الأطراف.','Smaller range.'),
E('bird_dog','core',1,NONE,40,15,4.0,['core','back'],N('Bird Dog','طائر الكلب','Bird dog','鸟狗式','バードドッグ'),'Extend opposite arm and leg, hips level.','مد الذراع والرجل المعاكستين والحوض ثابت.','Hands and knees only.'),
E('bicycle_crunch','core',2,NONE,40,15,6.5,['abs','obliques'],N('Bicycle Crunch','دراجة البطن','Crunch vélo','空中蹬车','バイシクルクランチ'),'Elbow to opposite knee, slow twist.','الكوع للركبة المعاكسة مع لف بطيء.','Feet on floor.'),
E('reverse_crunch','core',1,NONE,35,15,5.0,['abs'],N('Reverse Crunch','كرانش معكوس','Crunch inversé','反向卷腹','リバースクランチ'),'Curl hips off floor, lower slowly.','ارفع الحوض عن الأرض وانزل ببطء.','Small range.'),
E('heel_touch','core',1,NONE,35,15,5.0,['obliques'],N('Heel Touch','لمس الكعب','Touche talon','触跟卷腹','ヒールタッチ'),'Side bend to touch each heel.','انحنِ جانباً للمس كل كعب.','Shorter reach.'),
E('leg_raise','core',2,NONE,35,20,6.0,['abs'],N('Leg Raise','رفع الأرجل','Relevé jambes','举腿','レッグレイズ'),'Legs straight up, lower without arching.','ارفع الأرجل ثم أنزل دون تقوس الظهر.','Bent knees.'),
E('mountain_climber','cardio',2,NONE,40,20,9.0,['core','legs'],N('Mountain Climber','متسلق الجبال','Mountain climber','登山跑','マウンテンクライマー'),'Drive knees fast under chest.','ادفع الركب بسرعة تحت الصدر.','Slow march.'),
E('jumping_jack','cardio',1,NONE,40,15,8.0,['full'],N('Jumping Jack','قفز فتح وضم','Jumping jack','开合跳','ジャンピングジャック'),'Jump feet out, arms overhead.','اقفز بفتح الأرجل ورفع الذراعين.','Step jack.'),
E('step_jack','cardio',1,NONE,40,15,5.0,['full'],N('Step Jack','خطوة جانبية','Pas jack','踏步开合','ステップジャック'),'Step side to side, no jumping.','خطوة يميناً ويساراً دون قفز.','March in place.'),
E('skater','cardio',2,NONE,40,20,8.5,['glutes','legs'],N('Skater Hop','قفزة المتزلج','Patineur','滑冰跳','スケーター'),'Lateral hop, land softly on one foot.','اقفز جانباً واهبط بهدوء على رجل واحدة.','Step side to side.'),
E('high_knee','cardio',2,NONE,35,20,9.5,['legs','core'],N('High Knees','ركب عالية','Montées genoux','高抬腿','ハイニー'),'Run in place, knees to hip height.','اجري في مكانك والركب لمستوى الحوض.','March in place.'),
E('butt_kick','cardio',1,NONE,35,15,7.0,['hamstrings'],N('Butt Kick','ركل المؤخرة','Talons fesses','后踢腿','バットキック'),'Jog kicking heels to glutes.','اجري مع لمس الكعبين للمؤخرة.','Walk in place.'),
E('march_place','low_impact',1,NONE,40,10,3.5,['legs'],N('March in Place','مشي في المكان','Marche sur place','原地踏步','その場足踏み'),'Lift knees gently, swing arms.','ارفع الركب بهدوء مع تحريك الذراعين.','Seated march.'),
E('burpee','hiit',3,NONE,40,25,11.0,['full'],N('Burpee','بربي','Burpee','波比跳','バーピー'),'Squat, plank, jump up explosively.','سكوات ثم بلانك ثم قفزة انفجارية.','Squat thrust only.'),
E('squat_thrust','full_body',2,NONE,40,20,9.0,['full'],N('Squat Thrust','سكوات دفع','Squat thrust','深蹲后踢','スクワットスラスト'),'Squat to plank and back, no jump.','سكوات لبلانك والعودة دون قفزة.','Step back.'),
E('inchworm','full_body',2,NONE,40,20,6.0,['core','hamstrings'],N('Inchworm','دودة القياس','Chenille','毛毛虫爬行','インチワーム'),'Walk hands to plank, walk feet in.','امشِ بيديك للبلانك ثم اقترب بقدميك.','Bend knees.'),
E('jumping_squat','hiit',3,NONE,35,25,10.0,['quads','glutes'],N('Jump Squat','سكوات قفز','Squat sauté','跳跃深蹲','ジャンプスクワット'),'Squat then jump, land soft.','سكوات ثم قفزة واهبط بهدوء.','Regular squat.'),
E('lunge_jump','hiit',3,NONE,35,25,10.5,['legs'],N('Jump Lunge','لانجز قفز','Fente sautée','跳跃弓步','ジャンプランジ'),'Alternate lunge in the air.','بدّل اللانجز في الهواء.','Reverse lunge.'),
E('plank_jack','hiit',2,NONE,35,20,9.0,['core'],N('Plank Jack','بلانك قفز','Planche sautée','平板开合','プランクジャック'),'Plank, jump feet out and in.','في البلانك افتح وضم الأرجل.','Step feet.'),
E('hip_circle','mobility',1,NONE,30,10,2.5,['hips'],N('Hip Circle','دوائر الحوض','Cercles hanches','髋部绕环','ヒップサークル'),'Big slow circles each direction.','دوائر كبيرة وبطيئة لكل اتجاه.','Small circles.'),
E('cat_cow','mobility',1,NONE,35,10,2.5,['spine'],N('Cat-Cow','قطة وبقرة','Chat-vache','猫牛式','キャットカウ'),'Arch and round spine with breath.','قوّس ودوّر العمود الفقري مع النفس.','Seated version.'),
E('child_pose','recovery',1,NONE,40,10,2.0,['back','lats'],N("Child's Pose",'وضع الطفل','Posture enfant','婴儿式','チャイルドポーズ'),'Knees wide, arms long, breathe deep.','الركب متباعدة والذراعان ممدودتان وتنفس عميق.','Pillow under chest.'),
E('hamstring_stretch','stretching',1,NONE,35,10,2.0,['hamstrings'],N('Hamstring Stretch','تمدد الخلفية','Étirement ischios','腘绳肌拉伸','ハムストリング stretch'),'Hinge at hips, gentle pull.','انحنِ من الحوض وشد بلطف.','Bend knee.'),
E('shoulder_stretch','stretching',1,NONE,30,10,2.0,['shoulders'],N('Shoulder Stretch','تمدد الكتف','Étirement épaule','肩部拉伸','肩ストレッチ'),'Pull arm across chest gently.','اسحب الذراع عبر الصدر بلطف.','Lower arm.'),
E('spinal_rotation','mobility',1,NONE,35,10,2.5,['spine','obliques'],N('Spinal Rotation','لف العمود الفقري','Rotation colonne','脊柱旋转','脊柱ローテーション'),'Lying twist, shoulders down.','التواء مستلقٍ مع تثبيت الكتفين.','Knees bent.'),
E('chest_opener','stretching',1,'wall',30,10,2.0,['chest'],N('Chest Opener','فتح الصدر','Ouverture poitrine','开胸拉伸','チェストオープナー'),'Hands on wall, lean gently forward.','اليدان على الحائط وانحنِ للأمام بلطف.','Doorway option.'),
E('quad_stretch','stretching',1,'chair',30,10,2.0,['quads'],N('Quad Stretch','تمدد الفخذ','Étirement quadriceps','股四头肌拉伸','大腿四頭筋ストレッチ'),'Hold foot behind, knees together.','امسك القدم خلفك والركب معاً.','Hold chair.'),
E('cobra_stretch','recovery',1,NONE,30,10,2.5,['abs','back'],N('Cobra Stretch','وضع الكوبرا','Cobra','眼镜蛇式','コブラ'),'Press chest up, hips stay down.','ارفع الصدر والحوض ثابت.','Low cobra.'),
E('downward_dog','mobility',1,NONE,35,10,3.0,['hamstrings','calves'],N('Downward Dog','الكلب لأسفل','Chien tête bas','下犬式','ダウンダウンドッグ'),'Hips high, heels press down.','الوركان مرتفعان والكعبان للأسفل.','Bend knees.'),
E('knee_to_chest','recovery',1,NONE,30,10,2.0,['back','glutes'],N('Knee to Chest','الركبة للصدر','Genou poitrine','抱膝','ニーtoチェスト'),'Hug one knee, keep back flat.','احتضن ركبة واحدة والظهر مسطح.','Both knees.'),
E('torso_twist','warmup',1,NONE,30,10,3.0,['core'],N('Torso Twist','لف الجذع','Rotation buste','转体','胴体ツイスト'),'Rotate side to side with control.','لف يميناً ويساراً بتحكم.','Small range.'),
E('arm_circle','warmup',1,NONE,30,10,2.5,['shoulders'],N('Arm Circles','دوائر الذراع','Cercles bras','手臂绕环','アームサークル'),'Small to big circles both ways.','دوائر من صغيرة لكبيرة بالاتجاهين.','Small only.'),
E('leg_swing','warmup',1,'chair',30,10,3.0,['hips','legs'],N('Leg Swing','مرجحة الرجل','Balancement jambe','摆腿','レッグスイング'),'Swing leg forward and back.','أرجح الرجل أماماً وخلفاً.','Hold support.'),
E('side_bend','warmup',1,NONE,30,10,2.5,['obliques'],N('Side Bend','انحناء جانبي','Flexion latérale','侧弯','サイドベンド'),'Reach overhead and lean side to side.','مد الذراع فوق الرأس وانحنِ جانباً.','Hands on hips.'),
E('neck_roll','warmup',1,NONE,30,10,1.5,['neck'],N('Neck Roll','لف الرقبة','Rotation cou','颈部绕环','首回し'),'Slow gentle circles, both directions.','دوائر بطيئة ولطيفة بالاتجاهين.','Half circles.'),
E('ankle_circle','mobility',1,'chair',30,10,1.5,['ankles'],N('Ankle Circle','دوائر الكاحل','Cercles cheville','踝绕环','足首回し'),'Lift foot and circle the ankle.','ارفع القدم ودوّر الكاحل.','Seated.'),
E('seated_march','low_impact',1,'chair',40,10,3.0,['legs'],N('Seated March','مشي جالس','Marche assise','坐姿踏步','座位行進'),'Sit tall, alternate knee lifts.','اجلس مستقيماً وبدّل رفع الركب.','Slow pace.'),
E('standing_side_crunch','low_impact',1,NONE,35,15,4.5,['obliques'],N('Standing Side Crunch','طحن جانبي واقف','Crunch debout','站姿侧卷腹','スタンディング腹筋'),'Knee up, elbow down to meet.','ارفع الركبة وقابلها بالكوع.','Small range.'),
E('chair_squat','low_impact',1,'chair',40,15,3.5,['quads','glutes'],N('Chair Squat','سكوات الكرسي','Squat chaise','椅子深蹲','チェアスクワット'),'Sit back to touch, stand tall.','انزل للمس الكرسي ثم قف.','Partial sit.'),
E('gentle_jack','low_impact',1,NONE,35,10,4.0,['full'],N('Gentle Jack','جاك لطيف','Jack doux','轻柔开合跳','やさしいジャック'),'Low-impact side step with arm raise.','خطوة جانبية خفيفة مع رفع الذراع.','March only.'),
E('water_break_march','recovery',1,NONE,30,5,1.5,['full'],N('Cool-Down March','مشي التهدئة','Marche retour','冷身踏步','クールダウン'),'Easy march, deep breaths.','مشي سهل مع أنفاس عميقة.','Standing breathe.'),
E('box_breathing','recovery',1,NONE,60,5,1.0,['mind'],N('Box Breathing','تنفس الصندوق','Respiration carrée','箱式呼吸','ボックス呼吸'),'Inhale 4, hold 4, exhale 4, hold 4.','شهيق 4 ثوانٍ وحبس 4 وزفير 4 وحبس 4.','Normal breathing.'),
E('plank_shoulder_stretch','stretching',1,NONE,30,10,2.5,['shoulders','lats'],N('Lats Stretch','تمدد الظهر العلوي','Étirement dorsaux','背阔肌拉伸','広背筋ストレッチ'),'Arms overhead, lean to each side.','الذراعان فوق الرأس وانحنِ لكل جانب.','Hands clasped.'),
E('glute_stretch','stretching',1,NONE,35,10,2.0,['glutes'],N('Figure-4 Stretch','تمدد المؤخرة','Étirement fessier','臀部拉伸','臀部ストレッチ'),'Ankle on knee, pull gently.','الكاحل على الركبة واسحب بلطف.','Lying version.'),
E('slow_climber','low_impact',1,NONE,35,15,4.5,['core'],N('Slow Climber','متسلق بطيء','Grimpeur lent','慢速登山','スロークライマー'),'Hands on chair, slow knee drives.','اليدان على كرسي ودفع بطيء للركب.','Standing march.')
];

function P(id, lvl, mins, cat, rounds, exerciseIds, secsOverride, rest, name, descEn, descAr) {
  return { id: id, level: lvl, targetMins: mins, cat: cat, rounds: rounds,
    exercises: exerciseIds, secs: secsOverride || null, rest: rest,
    name: name, desc: { en: descEn, ar: descAr }, image: 'fitness/programs/' + id };
}
var PROGRAMS = [
P('quick_energy',1,5,'cardio',1,['march_place','jumping_jack','torso_twist','standing_side_crunch','gentle_jack','cool_down_placeholder'],null,15,N('Quick Energy','طاقة سريعة','Énergie rapide','快速能量','クイックエナジー'),'Five minutes to wake up your whole body.','خمس دقائق لتنشيط جسمك بالكامل.'),
P('morning_activation',1,7,'warmup',1,['neck_roll','arm_circle','leg_swing','side_bend','march_place','cat_cow','torso_twist','glute_bridge'],null,15,N('Morning Activation','تنشيط الصباح','Réveil matin','晨间激活','モーニングアクティベーション'),'Gentle morning flow to start the day.','تدفق صباحي لطيف لبدء اليوم.'),
P('full_body_starter',1,10,'full_body',2,['bodyweight_squat','knee_push_up','glute_bridge','dead_bug','step_jack','child_pose'],30,20,N('Full Body Starter','البداية الشاملة','Départ complet','全身入门','全身スターター'),'A friendly full-body introduction.','مقدمة ودودة لتمارين الجسم الكامل.'),
P('core_abs',1,10,'core',2,['dead_bug','heel_touch','reverse_crunch','bird_dog','forearm_plank','knee_to_chest'],30,20,N('Core & Abs','البطن والجذع','Abdos','核心','コア＆腹筋'),'Build a strong, stable midsection.','ابنِ جذعاً قوياً ومستقراً.'),
P('upper_strength',2,15,'upper_body',2,['push_up','shoulder_tap','tricep_dip_chair','pike_push_up','superman_pull','plank_up_down','shoulder_stretch'],35,20,N('Upper Body Strength','قوة الجزء العلوي','Haut du corps','上半身力量','上半身強化'),'Chest, shoulders, arms and back.','الصدر والكتفان والذراعان والظهر.'),
P('lower_power',2,15,'lower_body',2,['bodyweight_squat','forward_lunge','glute_bridge','side_lunge','calf_raise','wall_sit','quad_stretch'],40,20,N('Lower Body Power','قوة الجزء السفلي','Bas du corps','下半身力量','下半身パワー'),'Legs and glutes that carry you.','أرجل ومؤخرة تحملك طوال اليوم.'),
P('fat_burn',2,15,'hiit',2,['jumping_jack','bodyweight_squat','mountain_climber','squat_thrust','high_knee','burpee','child_pose'],35,20,N('Fat Burn','حرق الدهون','Brûle-graisse','燃脂','脂肪燃焼'),'Sweaty intervals, big energy.','فترات متعرقة وطاقة كبيرة.'),
P('low_impact_cardio',1,15,'low_impact',2,['march_place','step_jack','seated_march','standing_side_crunch','chair_squat','gentle_jack','slow_climber'],40,15,N('Low Impact Cardio','كارديو لطيف','Cardio doux','低冲击有氧','低負荷カーディオ'),'Joint-friendly cardio for every day.','كارديو لطيف على المفاصل لكل يوم.'),
P('mobility_recovery',1,10,'mobility',1,['hip_circle','cat_cow','spinal_rotation','downward_dog','hamstring_stretch','shoulder_stretch','cobra_stretch','box_breathing'],40,10,N('Mobility & Recovery','المرونة والاستشفاء','Mobilité','灵活性恢复','モビリティ回復'),'Move well, feel new again.','تحرك جيداً واشعر بالتجدد.'),
P('full_body_strength',2,20,'strength',3,['bodyweight_squat','push_up','forward_lunge','plank_up_down','glute_bridge','shoulder_tap','superman_pull','forearm_plank'],35,20,N('Full Body Strength','قوة الجسم الكامل','Force complète','全身力量','全身筋力'),'Total-body strength in twenty minutes.','قوة الجسم الكامل في عشرين دقيقة.'),
P('hiit_blast',3,20,'hiit',3,['burpee','mountain_climber','jumping_squat','plank_jack','high_knee','lunge_jump','skater','child_pose'],35,25,N('HIIT Blast','انفجار الهيت','HIIT intense','高强度间歇','HIITブラスト'),'Advanced intervals. Bring water.','فترات متقدمة. جهّز الماء.'),
P('cardio_endurance',2,20,'cardio',2,['jumping_jack','skater','mountain_climber','butt_kick','high_knee','step_jack','plank_jack','cool_down_placeholder'],45,20,N('Cardio Endurance','تحمل الكارديو','Endurance cardio','有氧耐力','有酸素持久力'),'Steady engine-building cardio.','كارديو ثابت لبناء التحمل.'),
P('strength_tone',2,25,'strength',3,['sumo_squat','push_up','reverse_lunge','tricep_dip_chair','glute_bridge','pike_push_up','side_plank','leg_raise','quad_stretch'],40,20,N('Strength & Tone','قوة وتناسق','Tonification','力量塑形','筋力＆トーニング'),'Sculpt and strengthen everywhere.','انحت وقوِّ جسمك بالكامل.'),
P('full_body_challenge',3,30,'full_body',3,['burpee','push_up','jumping_squat','forward_lunge','mountain_climber','bicycle_crunch','plank_up_down','lunge_jump','forearm_plank','cobra_stretch'],40,25,N('Full Body Challenge','تحدي الجسم الكامل','Défi complet','全身挑战','全身チャレンジ'),'Thirty-minute total challenge.','تحدٍّ شامل لمدة ثلاثين دقيقة.'),
P('deep_stretch',1,20,'recovery',1,['child_pose','hamstring_stretch','shoulder_stretch','quad_stretch','cobra_stretch','spinal_rotation','glute_stretch','knee_to_chest','chest_opener','box_breathing'],45,10,N('Deep Stretch & Recovery','تمدد عميق واستشفاء','Étirement profond','深度拉伸','ディープストレッチ'),'Slow down and recover deeply.','اهدأ واستشفِ بعمق.')
];

/* Replace placeholder id with real exercise */
PROGRAMS.forEach(function (p) {
  p.exercises = p.exercises.map(function (id) { return id === 'cool_down_placeholder' ? 'water_break_march' : id; });
});

C.FitnessData = { CATEGORIES: CATS, EXERCISES: EX, PROGRAMS: PROGRAMS,
  byId: function (id) { for (var i = 0; i < EX.length; i++) if (EX[i].id === id) return EX[i]; return null; },
  programById: function (id) { for (var i = 0; i < PROGRAMS.length; i++) if (PROGRAMS[i].id === id) return PROGRAMS[i]; return null; },
  estimateSecs: function (p, customSecs) {
    var total = 0;
    p.exercises.forEach(function (id) { var e = C.FitnessData.byId(id); if (e) total += (customSecs || p.secs || e.secs) + (p.rest || e.rest || 15); });
    total += 5; /* GO cue */ total += (p.rounds - 1) * 20; return Math.round(total * (p.rounds || 1) / Math.max(1, 1)) / 1;
  }
};
})(window);
