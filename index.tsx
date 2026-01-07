
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { FolderOpen, FileText, Search, Lock, AlertTriangle, CheckCircle, HelpCircle, Map, User, Clock, Check } from 'lucide-react';

// --- Types & Data Structures ---

type DocType = 'log' | 'list' | 'note' | 'report' | 'transcript';

interface GameDocument {
  id: string;
  folderId: string;
  title: string;
  type: DocType;
  content: React.ReactNode;
  isRedacted?: boolean;
}

interface Character {
  id: string;
  name: string; // The "Public" name or description
}

interface Ending {
  id: 'truth' | 'misjudge_edgar' | 'misjudge_susanna' | 'incomplete';
  title: string;
  description: string;
}

// --- Game Content (Sections 5-12) ---

const CHARACTERS: Character[] = [
  { id: 'victim', name: '无名死者 (The Victim)' },
  { id: 'guest_101', name: '101住户 (Edgar)' },
  { id: 'guest_102', name: '102住户 (Susanna)' },
  { id: 'guest_104', name: '104住户 (Mr. X)' },
  { id: 'dean', name: '海伦院长 (Dean Helen)' },
];

const DOCUMENTS: GameDocument[] = [
  // FOLDER 1: 行政与人员 (Admin)
  {
    id: 'guest_list',
    folderId: 'admin',
    title: '11月13日 入住登记表',
    type: 'list',
    content: (
      <div className="space-y-2 text-sm">
        <div className="border-b border-gray-600 pb-2 mb-2 font-bold">听松疗养院 - 前台登记</div>
        <p>101: 埃德加·沃恩 (Edgar Vaughn) - <span className="text-red-400 font-handwriting">VIP, 勿扰</span></p>
        <p>102: 苏珊娜·克莱 (Susanna Clay) - <span className="text-gray-500 italic">长期住户</span></p>
        <p>103: <span className="bg-black text-black px-1">空置维护中</span></p>
        <p>104: 约翰·史密斯 (John Smith) - <span className="text-red-400 font-handwriting">由于暴雨，客人致电将晚点到达 (备注时间: 20:00)</span></p>
        <div className="mt-4 p-2 border border-gray-600 bg-gray-800/50">
          <p className="font-bold">前台备注 (23:30):</p>
          <p>真正的史密斯先生已到达。海伦院长亲自接待，安排在休息室等候。</p>
        </div>
      </div>
    )
  },
  {
    id: 'staff_roster',
    folderId: 'admin',
    title: '夜班人员排班表',
    type: 'list',
    content: (
      <div className="text-sm">
        <p>值班经理: 海伦·福斯特 (Dean)</p>
        <p>维修/杂工: 阿瑟 (Arthur)</p>
        <p>安保: (缺席/系统自动接管)</p>
        <br/>
        <p className="font-handwriting text-blue-300">"暴雨导致电话线路不稳定，所有外部呼叫需通过总台转接。"</p>
      </div>
    )
  },

  // FOLDER 2: 医疗与服务 (Service)
  {
    id: 'dietary',
    folderId: 'service',
    title: '住户膳食禁忌单',
    type: 'list',
    content: (
      <div className="text-sm space-y-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-500">
              <th className="py-1">房间</th>
              <th>过敏/禁忌</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-700">
              <td className="py-1">101</td>
              <td className="text-yellow-500">严重糖尿病 (禁糖)</td>
            </tr>
            <tr className="border-b border-gray-700">
              <td className="py-1">102</td>
              <td className="text-yellow-500">乳糖不耐受 (禁奶制品)</td>
            </tr>
            <tr className="border-b border-gray-700">
              <td className="py-1">104</td>
              <td>无记录</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-4 text-xs text-gray-400">*厨房注意：今晚甜点是“特浓奶油泡芙”。101与102必须替换为果盘。</div>
      </div>
    )
  },
  {
    id: 'room_service',
    folderId: 'service',
    title: '11/13 客房服务回收记录',
    type: 'log',
    content: (
      <div className="text-sm font-mono">
        <p>[20:15 回收餐盘]</p>
        <p>101: 主菜吃光, 果盘未动。</p>
        <p>102: 主菜剩余一半, 果盘吃光。</p>
        <p>104: 主菜吃光, <span className="bg-yellow-900/50 text-yellow-200 px-1">奶油泡芙吃光</span>。</p>
        <br/>
        <p>[22:15 呼叫]</p>
        <p>104 致电前台要求送一瓶威士忌。</p>
      </div>
    )
  },
  {
    id: 'laundry',
    folderId: 'service',
    title: '洗衣房清单 (本周)',
    type: 'list',
    content: (
      <div className="text-sm">
        <p>101: 浴袍 (XL) - 每日更换</p>
        <p>102: 丝绸睡衣 (S) - 干洗</p>
        <p>104: 浴袍 (L) - 今日送洗</p>
      </div>
    )
  },

  // FOLDER 3: 设施与系统 (System)
  {
    id: 'sprinkler',
    folderId: 'system',
    title: '温室/长廊 自动喷淋配置',
    type: 'report',
    content: (
      <div className="text-sm font-mono space-y-2">
        <div className="border border-green-800 bg-green-900/20 p-2">
          <p className="text-green-400">>>> SYSTEM STATUS: AUTO</p>
          <p>区域: 玻璃长廊 (Glass Corridor)</p>
          <p>模式: 热带雨林高湿</p>
          <p>频率: 每15分钟启动一次，持续3分钟。</p>
          <p>启动时间点: xx:00, xx:15, xx:30, xx:45</p>
        </div>
        <div className="border border-red-800 bg-red-900/20 p-2 mt-2">
          <p className="text-red-400">!!! 维护例外 !!!</p>
          <p>每日 23:45 - 00:00 系统进行自检，喷淋强制关闭。</p>
        </div>
      </div>
    )
  },
  {
    id: 'access_log',
    folderId: 'system',
    title: '门禁刷卡日志 (11/13)',
    type: 'log',
    content: (
      <div className="text-sm font-mono">
        <p>21:00 - 102 (主楼入口) -> 拒绝 (宵禁)</p>
        <p>22:00 - 101 (玻璃长廊入口) -> 允许</p>
        <p>22:05 - 101 (玻璃长廊出口) -> 允许</p>
        <p>23:00 - <span className="bg-yellow-900/50 text-yellow-200">101 (玻璃长廊入口) -> 允许</span></p>
        <p>23:15 - (无出口记录)</p>
        <p className="text-gray-500">--- 日志结束 ---</p>
      </div>
    )
  },
  {
    id: 'maintenance',
    folderId: 'system',
    title: '阿瑟的维修手记',
    type: 'note',
    content: (
      <div className="text-sm font-handwriting leading-relaxed text-gray-300">
        <p>22:45 - 去104送酒。敲门没人应。奇怪，明明22:15才打过电话。我把酒放在门口了。</p>
        <p>23:20 - 厨房水管漏水，去修了一下。</p>
        <p>23:50 - 玻璃长廊的灯闪烁。我去换灯泡。即使外面下大雨，长廊里面因为停了喷淋，地面难得是<span className="font-bold text-white border-b border-white">干的</span>。正好不用穿雨靴。</p>
        <p>01:30 - 巡逻发现温室门虚掩... 天哪。</p>
      </div>
    )
  },

  // FOLDER 4: 证据与尸检 (Evidence)
  {
    id: 'autopsy',
    folderId: 'evidence',
    title: '初步尸检报告 (摘录)',
    type: 'report',
    content: (
      <div className="text-sm space-y-2">
        <p><span className="font-bold">发现时间：</span>01:30</p>
        <p><span className="font-bold">发现地点：</span>温室花坛深处</p>
        <p><span className="font-bold">死亡推断时间：</span>23:00 - 00:30 之间</p>
        <p><span className="font-bold">死因：</span>钝器击打后脑。</p>
        <div className="bg-gray-800 p-2 my-2">
          <p className="font-bold text-gray-400">衣着特征：</p>
          <p>- 疗养院制式浴袍 (尺码 L)</p>
          <p>- 拖鞋底面：<span className="text-red-400 font-bold">完全干燥，无水渍</span>。</p>
        </div>
        <div className="bg-gray-800 p-2">
          <p className="font-bold text-gray-400">胃内容物：</p>
          <p>- 威士忌 (少量)</p>
          <p>- 未消化的奶油、面粉 (推测为甜点)</p>
        </div>
      </div>
    )
  },
  {
    id: 'cipher',
    folderId: 'evidence',
    title: '104房垃圾桶内的碎纸',
    type: 'note',
    content: (
      <div className="text-sm font-mono bg-white text-black p-4 rotate-1 shadow-lg max-w-[300px]">
        <p>致 L.S.:</p>
        <p>如果你想拿到那笔钱，就在今晚那个时间去温室。</p>
        <p>不要走正门。</p>
        <p>记住我们的暗号：</p>
        <p className="font-bold text-lg mt-2">ROOM 101 + ROOM 103 = ?</p>
        <p className="text-xs mt-4 text-right">(笔迹潦草，不属于任何已知住户)</p>
      </div>
    )
  }
];

// --- Logic & State ---

const App = () => {
  const [activeFolder, setActiveFolder] = useState<string>('admin');
  const [activeDoc, setActiveDoc] = useState<GameDocument | null>(null);
  const [archive, setArchive] = useState<{ [key: string]: any }>({
    victim_identity: '',
    victim_room: '',
    killer: '',
    murder_time: '',
    method_clue: '',
  });
  const [showEnding, setShowEnding] = useState<Ending | null>(null);

  // Helper to update archive state
  const updateArchive = (field: string, value: string) => {
    setArchive(prev => ({ ...prev, [field]: value }));
  };

  // Logic to determine ending
  const checkCase = () => {
    // 1. Identify Victim
    // Clues: Victim ate cream puff (No Lactose, No Diabetes) -> Not 102, Not 101.
    // Victim wore L size -> 104 is L. 101 is XL, 102 is S.
    // Conclusion: Victim is the person staying in 104.
    const isVictimCorrect = archive.victim_room === '104';

    // 2. Identify Killer
    // Red Herring: 101 card used at 23:00. But 23:00 sprinklers are ON.
    // Victim shoes are DRY. Must traverse during 23:45 - 00:00 (Maintenance).
    // 101 has alibi? No, but Dean has alibi at 23:30 (Greeting Smith).
    // Wait, let's look at the timeline.
    // 23:00 - 101 Card used. If this was the murder, victim would be wet or killer would be wet.
    // 23:45 - 00:00 - The only DRY window.
    // Who was free 23:45-00:00?
    // Dean greeted Smith at 23:30. Smith put in lounge. Dean is free after that.
    // 101 claims to be asleep (weak).
    // However, the "Dry Shoes" is the strongest physical evidence.
    
    // Determining the ending based on inputs
    if (archive.killer === 'guest_101') {
      setShowEnding({
        id: 'misjudge_edgar',
        title: '结局 B: 仓促的指控',
        description: '你指控了 101号 埃德加。证据是他的门禁卡在 23:00 刷开了门。然而，警方后来发现埃德加因为糖尿病昏迷在房间。他的卡被盗了。更重要的是，23:00 喷淋系统正在运行，如果那时作案，死者的鞋底绝对不可能是干的。你忽略了关键的环境证据。'
      });
    } else if (archive.killer === 'dean' && archive.method_clue === 'maintenance_window' && isVictimCorrect) {
      setShowEnding({
        id: 'truth',
        title: '结局 A: 完美的归档',
        description: '真相大白。死者是假冒 104 住户的记者。真正的史密斯 23:30 才到。院长海伦利用 23:45-00:00 的喷淋维护窗口（这是唯一能保持鞋底干燥的时段）将记者诱骗至温室杀害。只有院长最清楚系统的运作规律。你的报告无懈可击。'
      });
    } else if (archive.killer === 'dean') {
       setShowEnding({
        id: 'truth',
        title: '结局 A-: 证据不足的真相',
        description: '你指控了院长，方向是对的，但你没有指出关键的作案时间窗口（喷淋维护期）。检方可能难以定罪，因为她有 23:30 接待客人的不在场证明。你需要强调 23:45 后的时间差。'
      });
    } else {
      setShowEnding({
        id: 'incomplete',
        title: '案件驳回',
        description: '你的档案充满了矛盾。请重新核对死者的身份特征（饮食、衣物尺码）以及鞋底干燥这一物理不可能现象。'
      });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-200 flex flex-col md:flex-row overflow-hidden">
      
      {/* --- LEFT SIDEBAR: FOLDERS --- */}
      <div className="w-full md:w-64 bg-neutral-950 border-r border-neutral-800 flex-shrink-0 flex flex-col">
        <div className="p-4 border-b border-neutral-800 bg-black">
          <h1 className="text-xl font-bold tracking-wider text-neutral-400">听松疗养院</h1>
          <p className="text-xs text-neutral-600 mt-1">档案归档系统 v1.0 (1998)</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          <FolderButton id="admin" icon={<User size={16}/>} label="行政与人员" active={activeFolder} onClick={setActiveFolder} />
          <FolderButton id="service" icon={<Clock size={16}/>} label="医疗与服务" active={activeFolder} onClick={setActiveFolder} />
          <FolderButton id="system" icon={<Lock size={16}/>} label="设施与系统" active={activeFolder} onClick={setActiveFolder} />
          <FolderButton id="evidence" icon={<AlertTriangle size={16}/>} label="证据与尸检" active={activeFolder} onClick={setActiveFolder} />
        </div>

        <div className="p-4 border-t border-neutral-800 text-xs text-neutral-600">
          <p>当前时间: 04:15 AM</p>
          <p>天气: 暴雨</p>
        </div>
      </div>

      {/* --- CENTER: DOCUMENT READER --- */}
      <div className="flex-1 bg-neutral-900 flex flex-col relative">
        {/* Document List for Active Folder */}
        <div className="h-12 bg-neutral-800 border-b border-neutral-700 flex items-center px-4 space-x-4 overflow-x-auto">
          {DOCUMENTS.filter(d => d.folderId === activeFolder).map(doc => (
            <button
              key={doc.id}
              onClick={() => setActiveDoc(doc)}
              className={`text-sm px-3 py-1 rounded transition-colors whitespace-nowrap ${activeDoc?.id === doc.id ? 'bg-neutral-200 text-black font-bold' : 'text-neutral-400 hover:bg-neutral-700'}`}
            >
              {doc.type === 'log' && <span className="mr-2">LOG</span>}
              {doc.title}
            </button>
          ))}
        </div>

        {/* Document Content Area */}
        <div className="flex-1 p-8 overflow-y-auto bg-[#1a1a1a] relative">
          {activeDoc ? (
            <div className="max-w-2xl mx-auto bg-[#e5e5e5] text-neutral-900 p-8 min-h-[600px] shadow-lg paper-shadow relative">
               {/* Paper texture overlay effect */}
               <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none mix-blend-multiply"></div>
               
               {/* Header */}
               <div className="flex justify-between items-end border-b-2 border-neutral-800 pb-4 mb-6 opacity-70">
                 <div>
                   <h2 className="text-2xl font-bold uppercase tracking-widest">{activeDoc.title}</h2>
                   <p className="text-xs font-mono mt-1">REF: {activeDoc.id.toUpperCase()} // CLASSIFIED</p>
                 </div>
                 <div className="text-right">
                   <div className="border border-neutral-800 px-2 py-1 text-xs font-bold rotate-[-5deg]">PINE ARCHIVES</div>
                 </div>
               </div>

               {/* Content */}
               <div className="font-serif leading-relaxed relative z-10">
                 {activeDoc.content}
               </div>

               {/* Footer */}
               <div className="mt-12 pt-4 border-t border-neutral-400 text-xs text-center text-neutral-500 font-mono">
                 PAGE 1 OF 1 • AUTHORIZED EYES ONLY
               </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-neutral-600 space-y-4">
              <Search size={48} className="opacity-20" />
              <p>从左侧选择文件夹，点击上方标签查看文档。</p>
            </div>
          )}
        </div>
      </div>

      {/* --- RIGHT SIDEBAR: ARCHIVE FORM --- */}
      <div className="w-full md:w-80 bg-neutral-950 border-l border-neutral-800 flex flex-col flex-shrink-0">
        <div className="p-4 bg-neutral-900 border-b border-neutral-800">
          <h2 className="font-bold flex items-center gap-2 text-neutral-200">
            <FileText size={18} /> 案件归档表
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Section 1: Victim Identity */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase">1. 死者身份确认</label>
            <div className="bg-neutral-900 p-3 rounded border border-neutral-800 space-y-3">
              <p className="text-xs text-gray-400 mb-2">根据尸检报告中的衣物尺码与胃内容物反推。</p>
              
              <select 
                className="w-full bg-black border border-neutral-700 text-sm p-2 rounded text-neutral-300"
                value={archive.victim_room}
                onChange={(e) => updateArchive('victim_room', e.target.value)}
              >
                <option value="">-- 选择死者所在房间 --</option>
                <option value="101">101房 (XL码, 忌糖)</option>
                <option value="102">102房 (S码, 忌奶)</option>
                <option value="104">104房 (L码, 无记录)</option>
              </select>

              <select 
                className="w-full bg-black border border-neutral-700 text-sm p-2 rounded text-neutral-300"
                value={archive.victim_identity}
                onChange={(e) => updateArchive('victim_identity', e.target.value)}
              >
                 <option value="">-- 选择死者真实身份 --</option>
                 <option value="edgar">埃德加 (议员)</option>
                 <option value="susanna">苏珊娜 (歌女)</option>
                 <option value="fake_smith">假冒的史密斯 (记者)</option>
                 <option value="real_smith">真正的史密斯 (迟到)</option>
              </select>
            </div>
          </div>

          {/* Section 2: The Method */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase">2. 关键作案窗口</label>
            <div className="bg-neutral-900 p-3 rounded border border-neutral-800 space-y-3">
              <p className="text-xs text-gray-400 mb-2">死者鞋底是干的，而玻璃长廊每15分钟喷水一次。凶手是如何做到的？</p>
              <select 
                className="w-full bg-black border border-neutral-700 text-sm p-2 rounded text-neutral-300"
                value={archive.method_clue}
                onChange={(e) => updateArchive('method_clue', e.target.value)}
              >
                <option value="">-- 选择核心环境证据 --</option>
                <option value="umbrella">死者打了伞</option>
                <option value="carried">尸体被通过污衣井运送</option>
                <option value="maintenance_window">利用 23:45 的系统维护停机间隙</option>
              </select>
            </div>
          </div>

          {/* Section 3: The Killer */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase">3. 指控凶手</label>
            <div className="bg-neutral-900 p-3 rounded border border-neutral-800 space-y-3">
              <select 
                className="w-full bg-black border border-neutral-700 text-sm p-2 rounded text-neutral-300"
                value={archive.killer}
                onChange={(e) => updateArchive('killer', e.target.value)}
              >
                <option value="">-- 选择嫌疑人 --</option>
                <option value="guest_101">101 埃德加 (门禁卡记录)</option>
                <option value="guest_102">102 苏珊娜 (不在场证明存疑)</option>
                <option value="dean">海伦院长 (熟悉系统)</option>
                <option value="arthur">维修工阿瑟 (最后目击者)</option>
              </select>
            </div>
          </div>

          <button 
            onClick={checkCase}
            className="w-full bg-neutral-200 text-black font-bold py-3 mt-4 hover:bg-white transition-colors uppercase tracking-widest border border-gray-400"
          >
            提交结案报告
          </button>

          {/* Decryption Puzzle Mini-Tool */}
          <div className="mt-8 pt-6 border-t border-neutral-800">
             <h3 className="text-xs font-bold text-neutral-500 mb-2 flex items-center gap-1"><HelpCircle size={12}/> 辅助工具：密码计算</h3>
             <div className="bg-black p-2 text-xs font-mono text-green-500">
               <p>> INPUT: 101 + 103</p>
               <p>> HINT: 房间号相加</p>
               <p>> RESULT: 204 (Target Room?)</p>
               <p className="text-gray-500 mt-1">// 提示：这可能暗示凶手在寻找某个特定编号的物品或位置，或者是为了掩人耳目。</p>
             </div>
          </div>

        </div>
      </div>

      {/* --- ENDING MODAL --- */}
      {showEnding && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 max-w-lg w-full p-8 shadow-2xl relative">
            <button 
              onClick={() => setShowEnding(null)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white"
            >
              ✕
            </button>
            <h2 className={`text-3xl font-bold mb-4 ${showEnding.id === 'truth' ? 'text-green-500' : 'text-red-500'}`}>
              {showEnding.title}
            </h2>
            <div className="w-full h-px bg-neutral-700 mb-6"></div>
            <p className="text-lg leading-relaxed mb-8 font-serif">
              {showEnding.description}
            </p>
            <div className="flex justify-end">
              <button 
                onClick={() => setShowEnding(null)}
                className="px-6 py-2 border border-neutral-600 hover:bg-neutral-800 text-sm uppercase tracking-widest"
              >
                返回档案
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Subcomponent for Folder Buttons
const FolderButton = ({ id, icon, label, active, onClick }: { id: string, icon: React.ReactNode, label: string, active: string, onClick: (id: string) => void }) => (
  <button
    onClick={() => onClick(id)}
    className={`w-full flex items-center space-x-3 px-3 py-3 text-sm transition-colors rounded ${
      active === id ? 'bg-neutral-800 text-neutral-200' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
