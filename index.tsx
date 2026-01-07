
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { FolderOpen, FileText, Search, Lock, AlertTriangle, CheckCircle, HelpCircle, Map, User, Clock, Unlock, XCircle, Grid, ChevronDown, ChevronRight, Terminal, Save, Play, RotateCcw } from 'lucide-react';

// --- Types & Constants ---

type DocType = 'log' | 'list' | 'note' | 'report' | 'transcript' | 'receipt';
type FolderId = 'admin' | 'service' | 'system' | 'evidence';
type Difficulty = 'relaxed' | 'normal' | 'hardcore';
type GameState = 'init' | 'playing' | 'viewing_result' | 'ended';

interface GameDocument {
  id: string;
  folderId: FolderId;
  title: string;
  type: DocType;
  content: React.ReactNode;
  locked?: boolean;
  isRedacted?: boolean;
}

interface Ending {
  id: string;
  title: string;
  description: string;
  color: string;
  isGameOver: boolean;
}

// 难度配置 (分钟)
const DIFFICULTY_CONFIG: Record<Difficulty, number> = {
  relaxed: 120,
  normal: 90,
  hardcore: 30
};

const PENALTY_MS = 2 * 60 * 1000; // 错误扣时 2 分钟

// 逻辑审计日志
const AUDIT_LOG = [
  {
    conclusion: "排除 101 (Edgar) 和 102 (Susanna) 为死者",
    evidence: ["膳食单(忌糖/忌奶)", "尸检(胃内含奶油泡芙)"],
    excludes: "101, 102"
  },
  {
    conclusion: "死者为 104 的冒名顶替者",
    evidence: ["尸检(L码浴袍)", "洗衣房(104洗了L码)", "入住表(真Smith 23:30才到)"],
    excludes: "真正的 Smith 先生"
  },
  {
    conclusion: "作案窗口锁定为 23:45 - 00:00 (干燥期)",
    evidence: ["尸检(一次性纸浆拖鞋遇水即烂且完好)", "喷淋配置(全覆盖无干区)", "维修手记(23:50地面是干的)"],
    excludes: "22:00-23:45, 00:00-01:30 的所有喷淋时段"
  },
  {
    conclusion: "101 (Edgar) 的门禁卡是被盗用的 (解释记录)",
    evidence: ["电话记录(22:30报失)", "门禁日志(离线缓存模式说明)", "钥匙卡台账(待同步状态)"],
    excludes: "101 本人作案的可能性"
  },
  {
    conclusion: "102 (Susanna) 不知晓维护窗口",
    evidence: ["投诉单(被告知喷淋24小时运行)", "电话记录(22:35未接)", "喷淋配置(无干燥路权)"],
    excludes: "102 利用维护窗口作案的可能性"
  },
  {
    conclusion: "凶手是院长 (Dean Helen)",
    evidence: ["维护工单(签字批准23:45停机)", "钥匙卡台账(取走万能卡)", "时间线(23:30接待后有空档)"],
    excludes: "Arthur (有维修工作在身)"
  }
];

// 文档数据
const DOCUMENTS: GameDocument[] = [
  // --- FOLDER: ADMIN ---
  {
    id: 'guest_list',
    folderId: 'admin',
    title: '11月13日 入住登记表',
    type: 'list',
    content: (
      <div className="space-y-2 text-sm font-mono">
        <div className="border-b border-gray-600 pb-2 mb-2 font-bold flex justify-between">
            <span>听松疗养院 - 前台登记</span>
            <span>日期: 1998/11/13</span>
        </div>
        <p>101: Edgar Vaughn <span className="text-red-400 font-handwriting">[VIP, 糖尿病, 勿扰]</span></p>
        <p>102: Susanna Clay <span className="text-gray-500 italic">[长期住户, 歌剧演员]</span></p>
        <p>103: <span className="bg-black text-black px-1 select-none">RESERVED</span> (空置维护中)</p>
        <p>104: John Smith <span className="text-red-400 font-handwriting">[迟到备注: 暴雨延误, 预计23:30到达]</span></p>
        <div className="mt-4 p-2 border border-gray-600 bg-gray-800/50">
          <p className="font-bold">值班经理备注 (23:35):</p>
          <p>真正的 Smith 先生已到达。因 104 房需清理（前一位客人刚退？），安排其在员工休息室暂住一晚，明早办理入住。</p>
        </div>
      </div>
    )
  },
  {
    id: 'phone_log',
    folderId: 'admin',
    title: '总台电话转接记录',
    type: 'log',
    content: (
      <div className="text-sm font-mono">
        <table className="w-full text-left">
          <thead><tr className="border-b border-gray-600"><th>时间</th><th>来源</th><th>去向</th><th>备注</th></tr></thead>
          <tbody>
            <tr><td>22:15</td><td>104</td><td>前台</td><td>要求送一瓶威士忌</td></tr>
            <tr><td>22:30</td><td>101</td><td>前台</td><td><span className="text-yellow-400">报失：门禁卡遗失</span></td></tr>
            <tr><td>22:35</td><td>前台</td><td>102</td><td>无人接听</td></tr>
            <tr><td>23:10</td><td>外部</td><td>前台</td><td>线路故障，噪音极大...</td></tr>
          </tbody>
        </table>
        <p className="mt-2 text-xs text-gray-500">*注：暴雨导致线路不稳定，内线系统偶发串线。</p>
      </div>
    )
  },

  // --- FOLDER: SERVICE ---
  {
    id: 'dietary',
    folderId: 'service',
    title: '膳食禁忌单 (厨房)',
    type: 'list',
    content: (
      <div className="text-sm space-y-2">
        <p>101 (Edgar): <span className="text-red-400 font-bold">I型糖尿病 (严禁糖分)</span></p>
        <p>102 (Susanna): <span className="text-yellow-500 font-bold">重度乳糖不耐 (严禁奶制品)</span></p>
        <p>104 (Smith): 无禁忌记录</p>
        <div className="mt-2 border-t border-gray-600 pt-2">
          <p className="font-bold">今日特供甜点：</p>
          <p>特浓奶油泡芙 (含大量鲜奶油与糖霜)</p>
          <p className="text-xs text-gray-400">警告：101/102 必须替换为无糖果盘，严禁混淆！后果自负。</p>
        </div>
      </div>
    )
  },
  {
    id: 'room_service_log',
    folderId: 'service',
    title: '客房服务回收记录',
    type: 'log',
    content: (
      <div className="text-sm font-mono">
        <p>[20:15 餐盘回收]</p>
        <p>101: 主菜空, 果盘未动。</p>
        <p>102: 主菜剩半, 果盘空。</p>
        <p>104: 主菜空, <span className="bg-yellow-900/50 text-yellow-200 px-1 border border-yellow-700">奶油泡芙盘空</span>。</p>
      </div>
    )
  },
  {
    id: 'laundry',
    folderId: 'service',
    title: '洗衣房收衣单',
    type: 'receipt',
    content: (
      <div className="text-sm font-mono bg-white text-black p-3 shadow-sm rotate-1 max-w-sm">
        <p className="text-center font-bold border-b border-black mb-2">洗衣回单 (LAUNDRY RECEIPT)</p>
        <p>101: 浴袍 (XL) x1</p>
        <p>102: 丝绸睡衣 (S) x1 [干洗]</p>
        <p>104: 浴袍 (L) x1</p>
        <p className="mt-4 text-xs text-right">经办人: Arthur (维修部兼)</p>
      </div>
    )
  },
  {
    id: 'complaint_note',
    folderId: 'service',
    title: '住户投诉单 (102)',
    type: 'note',
    content: (
      <div className="text-sm font-serif bg-yellow-50 text-black p-4">
        <p className="font-bold">来自: 102 (Susanna Clay)</p>
        <p>内容：外面玻璃长廊的喷水声简直像轰炸机一样！我根本无法休息。这该死的系统到底什么时候会停？</p>
        <hr className="border-gray-400 my-2"/>
        <p className="font-bold">前台回复：</p>
        <p>尊敬的 Clay 女士，非常抱歉。为了维持珍稀热带植物的湿度，<span className="underline">自动喷淋系统必须 24 小时不间断运行</span>。我们无法为您单独关闭。</p>
      </div>
    )
  },

  // --- FOLDER: SYSTEM ---
  {
    id: 'sprinkler',
    folderId: 'system',
    title: '玻璃长廊喷淋系统说明',
    type: 'report',
    content: (
      <div className="text-sm font-mono space-y-2">
        <div className="border border-blue-800 bg-blue-900/20 p-2">
          <p className="text-blue-400 font-bold">&gt;&gt;&gt; 配置参数</p>
          <p>区域: 玻璃长廊 (全长50米，连接主楼与温室，无遮挡)</p>
          <p>频率: 每15分钟启动 (xx:00, xx:15, xx:30, xx:45)</p>
          <p>持续: 3分钟/次</p>
        </div>
        <div className="border border-red-800 bg-red-900/20 p-2">
           <p className="text-red-400 font-bold">!!! 警告 !!!</p>
           <p>地面铺设为吸水防滑岩。喷淋结束后，地面将在 <span className="underline">至少 10 分钟内</span> 保持严重积水状态。</p>
           <p>严禁穿着纸质/棉质拖鞋进入，否则会瞬间湿透并损毁。</p>
        </div>
      </div>
    )
  },
  {
    id: 'maintenance_auth',
    folderId: 'system',
    title: '系统停机维护授权书',
    type: 'report',
    content: (
      <div className="text-sm font-serif bg-[#f0f0f0] text-black p-4">
        <div className="text-right text-xs font-bold text-red-600 border-2 border-red-600 inline-block p-1 rotate-12 mb-2">机密 / 仅限管理层<br/>CONFIDENTIAL</div>
        <h3 className="text-center font-bold text-lg underline mb-4">系统干预授权书</h3>
        <p>兹批准于 <span className="font-bold">23:45 - 00:00</span> 对全院安防及喷淋系统进行短时停机维护，以校准传感器。</p>
        <p className="mt-4">停机期间：</p>
        <ul className="list-disc pl-5">
            <li>CCTV 将离线</li>
            <li>电子门禁转为<span className="font-bold">本地缓存模式</span>（无法同步实时挂失）</li>
            <li><span className="font-bold">喷淋系统强制关闭 (干燥窗口)</span></li>
        </ul>
        <div className="mt-8 flex justify-between items-end">
            <div>
                <p>批准人签名：</p>
                <p className="font-handwriting text-xl text-blue-900">Dr. Helen Foster</p>
            </div>
            <p className="text-xs">日期: 11/13</p>
        </div>
      </div>
    )
  },
  {
    id: 'key_log',
    folderId: 'system',
    title: '🔑 钥匙卡管理台账',
    type: 'log',
    locked: true,
    content: (
      <div className="text-sm font-mono space-y-2">
        <p className="text-green-400 border-b border-green-800 pb-1">访问已授权：安全等级 2</p>
        <table className="w-full text-left">
           <thead><tr className="text-gray-500"><th>Time</th><th>Action</th><th>Details</th></tr></thead>
           <tbody>
             <tr><td>14:00</td><td>发放</td><td>104 访客卡 (前台经办)</td></tr>
             <tr><td>22:35</td><td>挂失</td><td>101 门禁卡 (电话报失) -&gt; <span className="text-yellow-500">待同步 (SYNC PENDING)</span></td></tr>
             <tr><td>22:40</td><td>补办</td><td>101 临时卡 (暂存于前台)</td></tr>
             <tr><td>23:40</td><td>取用</td><td><span className="text-yellow-400 font-bold">万能卡 (Master Key #001) - 取用人: H. Foster</span></td></tr>
           </tbody>
        </table>
        <p className="text-xs text-red-500 mt-2">系统警告: 暴雨导致主服务器连接超时。挂失指令暂未同步至终端闸机。</p>
      </div>
    )
  },
  {
    id: 'maintenance_notes',
    folderId: 'system',
    title: 'Arthur的维修手记',
    type: 'note',
    content: (
      <div className="text-sm font-handwriting leading-relaxed text-gray-300">
        <p>22:45 - 给104送威士忌。敲门没人。放在门口了。</p>
        <p>23:20 - 厨房水管报修，我去处理。</p>
        <p>23:50 - 趁着“停机维护”去长廊换灯泡。这时候喷淋停了，<span className="bg-white text-black px-1 font-bold">地是干的</span>，不用穿笨重的雨靴。真好。</p>
        <p>01:30 - 巡逻发现温室门没关... 里面有人躺着。</p>
      </div>
    )
  },

  // --- FOLDER: EVIDENCE ---
  {
    id: 'autopsy',
    folderId: 'evidence',
    title: '尸检报告 #98-044',
    type: 'report',
    content: (
      <div className="text-sm space-y-2">
        <div className="bg-neutral-800 p-3 border-l-4 border-red-600">
          <p className="font-bold text-red-400">关键物理证据：</p>
          <p>死者穿着疗养院配发的 <span className="font-bold text-white">"环保纸浆拖鞋" (一次性)</span>。</p>
          <p className="text-gray-400 text-xs mt-1">注：该材质极其脆弱，遇水即发生不可逆的软化与崩解。死者鞋底完好、干燥、无任何水渍。</p>
          <p className="mt-2 text-green-400 font-mono">结论：死者从未踏入过潮湿地面。该特性无法通过擦干鞋底伪造。</p>
        </div>
        <div className="mt-4">
           <p>胃内容物：威士忌、未消化的奶油泡芙。</p>
           <p>死亡时间：23:30 - 00:30 之间。</p>
        </div>
      </div>
    )
  },
  {
    id: 'access_log',
    folderId: 'evidence',
    title: '门禁刷卡流水 (部分)',
    type: 'log',
    content: (
      <div className="text-sm font-mono">
        <p className="text-red-500 border border-red-900 p-1 mb-2 text-center text-xs">网络状态: 离线 (OFFLINE) - 启用本地缓存模式</p>
        <p>22:00 - 101 [进入 -&gt; 长廊]</p>
        <p>22:05 - 101 [离开 -&gt; 大厅]</p>
        <p>23:00 - <span className="text-yellow-400">101 [进入 -&gt; 长廊]</span> <span className="text-gray-500 text-xs">// 验证源: 本地缓存 (无视挂失状态)</span></p>
        <p>23:45 - SYSTEM SHUTDOWN (维护停机)</p>
        <p>00:00 - SYSTEM REBOOT (系统重启)</p>
      </div>
    )
  },
  {
    id: 'trash_note',
    folderId: 'evidence',
    title: '104 垃圾桶碎纸片',
    type: 'note',
    content: (
      <div className="text-sm font-mono bg-white text-black p-4 rotate-1 shadow-lg max-w-[300px]">
        <p>致 L.S. (Link Sterling):</p>
        <p>计划有变。如果你想要那笔封口费，必须避开监控。</p>
        <p>唯一的盲区在温室。</p>
        <p>记住我们的暗号：</p>
        <p className="font-bold text-lg mt-2 border-2 border-black p-1 inline-block">ROOM 101 + ROOM 103 = ?</p>
        <p className="text-xs mt-4 text-right">(这是我在系统里的后门代码)</p>
      </div>
    )
  }
];

// --- Subcomponents ---

const Toast = ({ message, onClose }: { message: string, onClose: () => void }) => (
  <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-neutral-800 text-neutral-200 px-4 py-2 rounded shadow-2xl border border-neutral-600 z-[100] animate-in slide-in-from-top-2 fade-in">
    <div className="flex items-center gap-2">
      <AlertTriangle size={16} className="text-yellow-500" />
      <span className="text-xs font-mono">{message}</span>
      <button onClick={onClose} className="ml-4 hover:text-white">✕</button>
    </div>
  </div>
);

const Modal = ({ title, children, actions, color = "text-neutral-200" }: any) => (
  <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
    <div className="bg-[#111] border border-neutral-700 max-w-lg w-full p-8 shadow-2xl relative">
      <h2 className={`text-2xl font-bold mb-4 font-serif ${color}`}>
        {title}
      </h2>
      <div className="w-full h-px bg-neutral-700 mb-6"></div>
      <div className="text-base leading-relaxed mb-8 text-neutral-300 font-serif">
        {children}
      </div>
      <div className="flex justify-end gap-4">
        {actions}
      </div>
    </div>
  </div>
);

const FolderBtn = ({ id, label, icon, active, onClick }: any) => (
  <button
    onClick={() => onClick(id)}
    className={`w-full flex items-center space-x-3 px-3 py-2 text-xs transition-colors rounded-sm ${
      active === id ? 'bg-neutral-800 text-neutral-200 border-l-2 border-green-500' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900'
    }`}
  >
    {icon}
    <span className="font-mono">{label}</span>
  </button>
);

const Section = ({ label, children }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">{label}</label>
    <div className="bg-neutral-900 p-2 rounded border border-neutral-800 space-y-2">
      {children}
    </div>
  </div>
);

const Select = ({ value, onChange, options }: any) => (
  <select 
    className="w-full bg-black border border-neutral-700 text-xs p-2 rounded text-neutral-300 outline-none focus:border-green-700 transition-colors"
    value={value}
    onChange={(e) => onChange(e.target.value)}
  >
    {options.map((o: any) => <option key={o.val} value={o.val}>{o.lbl}</option>)}
  </select>
);

// --- Main App ---

const App = () => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>('init');
  const [difficulty, setDifficulty] = useState<Difficulty>('relaxed');
  
  // Timer State (Deadline timestamp)
  const [deadline, setDeadline] = useState<number>(0);
  const [now, setNow] = useState<number>(Date.now());
  
  // Content State
  const [activeFolder, setActiveFolder] = useState<FolderId>('admin');
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [unlockedDocs, setUnlockedDocs] = useState<Set<string>>(new Set());
  const [cipherInput, setCipherInput] = useState("");
  const [grid, setGrid] = useState<Record<string, boolean>>({});

  // Form State
  const [archive, setArchive] = useState({
    victim_identity: '',
    victim_room: '',
    killer: '',
    murder_time: '',
    method_clue: '',
  });

  // UI State
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [ending, setEnding] = useState<Ending | null>(null);
  const [confirmModal, setConfirmModal] = useState<{title: string, msg: string, onConfirm: () => void} | null>(null);
  const [showLogicGrid, setShowLogicGrid] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

  const activeDoc = useMemo(() => DOCUMENTS.find(d => d.id === activeDocId), [activeDocId]);

  // --- Persistence ---
  
  const saveGame = useCallback(() => {
    if (gameState !== 'playing' && gameState !== 'viewing_result') return;
    const saveData = {
      gameState, difficulty, deadline, archive, grid, 
      unlockedDocs: Array.from(unlockedDocs), 
      activeDocId, activeFolder
    };
    localStorage.setItem('pine_save', JSON.stringify(saveData));
  }, [gameState, difficulty, deadline, archive, grid, unlockedDocs, activeDocId, activeFolder]);

  const loadGame = () => {
    try {
      const raw = localStorage.getItem('pine_save');
      if (!raw) return false;
      const data = JSON.parse(raw);
      
      // Basic hydration
      setDifficulty(data.difficulty);
      setDeadline(data.deadline); // Restore absolute deadline
      setArchive(data.archive);
      setGrid(data.grid || {});
      setUnlockedDocs(new Set(data.unlockedDocs));
      setActiveFolder(data.activeFolder || 'admin');
      setActiveDocId(data.activeDocId);
      setGameState('playing');
      return true;
    } catch (e) {
      console.error("Save file corrupted", e);
      return false;
    }
  };

  const startNewGame = (diff: Difficulty) => {
    setDifficulty(diff);
    setDeadline(Date.now() + DIFFICULTY_CONFIG[diff] * 60 * 1000);
    setArchive({ victim_identity: '', victim_room: '', killer: '', murder_time: '', method_clue: '' });
    setGrid({});
    setUnlockedDocs(new Set());
    setActiveFolder('admin');
    setActiveDocId(null);
    setGameState('playing');
  };

  // Auto-save loop
  useEffect(() => {
    const interval = setInterval(saveGame, 5000);
    return () => clearInterval(interval);
  }, [saveGame]);

  // Timer Tick
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check Timeout
  useEffect(() => {
    if (gameState === 'playing' && now > deadline) {
      triggerTimeout();
    }
  }, [now, deadline, gameState]);

  // --- Logic ---

  const triggerTimeout = () => {
    setGameState('ended');
    setEnding({
      id: 'timeout',
      title: '结局: 档案封存',
      description: '时间耗尽。清晨的阳光并未带来希望，安保人员接管了档案室。你感觉到自己知道得太多，却记录得太少。你的名字将被加入下一份“待处理”清单。',
      color: 'text-gray-500',
      isGameOver: true
    });
    localStorage.removeItem('pine_save');
  };

  const handleCipherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cipherInput === '204') {
      setUnlockedDocs(prev => new Set(prev).add('key_log'));
      setCipherInput('');
      setToastMsg("密钥正确：已解锁 [钥匙卡管理台账]");
      setTimeout(() => setToastMsg(null), 3000);
    } else {
      setToastMsg("密钥错误：访问被拒绝");
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  const penalize = () => {
    setDeadline(prev => prev - PENALTY_MS);
    setToastMsg("归档驳回：时间扣除 2 分钟");
    setTimeout(() => setToastMsg(null), 4000);
  };

  const checkCase = (force = false) => {
    // 1. Grid Conflict Check
    if (!force) {
      const killerMap: Record<string, string> = { 'guest_101': '101(Ed)', 'guest_102': '102(Su)', 'dean': 'Dean', 'arthur': 'Arthur' };
      const timeMap: Record<string, string> = { '2200_2230': '22', '2300_2315': '23', '2345_0000': 'Maint' };
      const kKey = killerMap[archive.killer];
      const tKey = timeMap[archive.murder_time];
      
      if (kKey && tKey && grid[`${kKey}-${tKey}`]) {
        setConfirmModal({
          title: "逻辑冲突警告",
          msg: `你在逻辑网格中排除了【${kKey}】在【${tKey}】时段的可能性，但这与你的结案报告矛盾。\n\n是否忽略此笔记强制提交？`,
          onConfirm: () => { setConfirmModal(null); checkCase(true); }
        });
        return;
      }
    }

    // 2. Evaluation
    const isVictimRoomCorrect = archive.victim_room === '104';
    const isVictimIdCorrect = archive.victim_identity === 'fake_smith';
    const isKillerCorrect = archive.killer === 'dean';
    const isTimeCorrect = archive.murder_time === '2345_0000';
    const isMethodCorrect = archive.method_clue === 'maintenance_window';

    let result: Ending;

    if (archive.killer === 'guest_101') {
      result = {
        id: 'misjudge_101',
        title: '结局 B: 错误的指控 (Edgar)',
        description: '你指控了 101 住户。门禁记录确实显示了他的卡在 23:00 被使用。但你忽略了“离线缓存模式”的提示以及 22:30 的挂失记录。更致命的是，23:00 喷淋系统全开，他的鞋底不可能保持干燥。真正的凶手利用了系统漏洞，也利用了你的疏忽。',
        color: 'text-red-500',
        isGameOver: false
      };
    } else if (archive.killer === 'guest_102') {
      result = {
        id: 'misjudge_102',
        title: '结局 C: 诱导的陷阱 (Susanna)',
        description: '你指控了 102 住户。她确实失踪了且有动机。但根据投诉单，她被明确告知喷淋系统“24小时运行”。她根本不知道维护窗口的存在，也不可能穿着纸浆拖鞋穿越湿地。她当时只是因头痛去药房偷药罢了。',
        color: 'text-yellow-500',
        isGameOver: false
      };
    } else if (isKillerCorrect) {
       if (isTimeCorrect && isMethodCorrect && isVictimIdCorrect && isVictimRoomCorrect) {
          result = {
            id: 'truth',
            title: '结局 A: 完美的真相',
            description: '无懈可击。你识破了死者是假冒的记者 Link Sterling，利用“纸浆拖鞋”这一决定性证据锁定了唯一的作案窗口——23:45至00:00的停机维护期。只有拥有最高权限并亲自签署维护令的 Helen 院长能做到这一点。钥匙卡台账成为了压死骆驼的最后一根稻草。',
            color: 'text-green-500',
            isGameOver: true
          };
          localStorage.removeItem('pine_save');
       } else {
         result = {
            id: 'partial',
            title: '结局 A-2: 证据链残缺',
            description: '你正确指出了凶手是院长，但你的报告无法解释她是如何在“满地积水”的长廊中不留痕迹地作案，或者你尚未查清死者的真实身份。检方认为核心证据链（特别是物理环境与身份的交叉验证）不足，驳回了起诉。',
            color: 'text-orange-400',
            isGameOver: false
         };
       }
    } else {
      // General wrong killer or incomplete
      penalize();
      return; 
    }

    setEnding(result);
    setGameState(result.isGameOver ? 'ended' : 'viewing_result');
    if (!result.isGameOver) {
      penalize(); // Apply penalty for wrong guess even if viewing result
    }
  };

  const resumeGame = () => {
    setEnding(null);
    setGameState('playing');
  };

  const formatTime = (ms: number) => {
    if (ms < 0) return "00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Render: Init Screen ---
  if (gameState === 'init') {
    const hasSave = !!localStorage.getItem('pine_save');
    return (
      <div className="h-screen bg-[#0a0a0a] text-neutral-300 flex items-center justify-center font-mono">
        <div className="max-w-md w-full p-8 border border-neutral-700 bg-[#111] shadow-2xl">
          <h1 className="text-3xl font-bold mb-2 tracking-widest text-center text-neutral-200">听松疗养院<br/><span className="text-sm font-normal text-neutral-500">归档事宜 (The Archives)</span></h1>
          <div className="w-full h-px bg-neutral-800 my-6"></div>
          
          <div className="space-y-4">
            {hasSave && (
              <button 
                onClick={loadGame}
                className="w-full py-4 border border-green-800 text-green-500 hover:bg-green-900/20 flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw size={18} /> 继续归档
              </button>
            )}
            
            <div className="space-y-2 pt-4">
              <p className="text-xs text-center text-neutral-500 mb-2">新建档案 (选择难度)</p>
              <button onClick={() => startNewGame('relaxed')} className="w-full py-3 border border-neutral-700 hover:bg-neutral-800 text-sm">放松模式 (120分钟)</button>
              <button onClick={() => startNewGame('normal')} className="w-full py-3 border border-neutral-700 hover:bg-neutral-800 text-sm">普通模式 (90分钟)</button>
              <button onClick={() => startNewGame('hardcore')} className="w-full py-3 border border-red-900/50 text-red-400 hover:bg-red-900/10 text-sm">硬核模式 (30分钟)</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Render: Main Game ---
  const remainingTime = deadline - now;
  
  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden font-mono text-sm bg-neutral-900 text-neutral-300">
      
      {/* Toast Notification */}
      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}

      {/* Confirmation Modal */}
      {confirmModal && (
        <Modal 
          title={confirmModal.title} 
          actions={
            <>
              <button onClick={() => setConfirmModal(null)} className="px-4 py-2 border border-neutral-600 hover:bg-neutral-800 text-xs">取消</button>
              <button onClick={confirmModal.onConfirm} className="px-4 py-2 bg-red-900 text-white hover:bg-red-800 text-xs">确认执行</button>
            </>
          }
        >
          {confirmModal.msg}
        </Modal>
      )}

      {/* Sidebar */}
      <div className="w-full md:w-64 bg-[#0a0a0a] border-r border-neutral-800 flex flex-col flex-shrink-0 z-20">
        <div className="p-4 border-b border-neutral-800 bg-black">
          <h1 className="text-lg font-bold tracking-wider text-neutral-300 flex items-center gap-2">
            <Terminal size={18} /> 听松档案系统
          </h1>
          <div className={`mt-2 text-2xl font-bold font-mono ${remainingTime < 300000 ? 'text-red-500 blink' : 'text-green-500'}`}>
            {formatTime(remainingTime)}
          </div>
          <p className="text-xs text-neutral-600 mt-1 uppercase">距离清晨交接 (自动存档中)</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <FolderBtn id="admin" label="行政与人员" icon={<User size={14}/>} active={activeFolder} onClick={setActiveFolder} />
          <FolderBtn id="service" label="医疗与服务" icon={<Clock size={14}/>} active={activeFolder} onClick={setActiveFolder} />
          <FolderBtn id="system" label="设施与系统" icon={<Lock size={14}/>} active={activeFolder} onClick={setActiveFolder} />
          <FolderBtn id="evidence" label="证据与尸检" icon={<AlertTriangle size={14}/>} active={activeFolder} onClick={setActiveFolder} />
        </div>

        <div className="p-4 border-t border-neutral-800 bg-neutral-900/50">
          <label className="text-xs text-neutral-500 font-bold mb-1 block">机密文档解密</label>
          <form onSubmit={handleCipherSubmit} className="flex gap-1">
            <input 
              type="text" 
              value={cipherInput}
              onChange={e => setCipherInput(e.target.value)}
              placeholder="输入密钥..." 
              className="bg-black border border-neutral-700 text-green-500 w-full px-2 py-1 text-xs outline-none focus:border-green-500 placeholder-neutral-700"
            />
            <button type="submit" className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-2 border border-neutral-700">
              <Unlock size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* Reader Area */}
      <div className="flex-1 bg-[#111] flex flex-col relative z-10 min-w-0">
        <div className="h-10 bg-[#0a0a0a] border-b border-neutral-800 flex items-center px-2 gap-2 overflow-x-auto">
          {DOCUMENTS.filter(d => d.folderId === activeFolder).map(doc => {
            const isLocked = doc.locked && !unlockedDocs.has(doc.id);
            return (
              <button
                key={doc.id}
                onClick={() => !isLocked && setActiveDocId(doc.id)}
                disabled={isLocked}
                className={`flex items-center gap-2 px-3 py-1 text-xs rounded-t transition-all border-t border-x border-transparent whitespace-nowrap
                  ${activeDocId === doc.id ? 'bg-[#e5e5e5] text-black border-neutral-400 font-bold' : 'text-neutral-500 hover:bg-neutral-800'}
                  ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isLocked ? <Lock size={10} /> : <FileText size={10} />}
                {isLocked ? '加密文档' : doc.title}
              </button>
            );
          })}
        </div>

        <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-[#1a1a1a] relative">
          {activeDoc ? (
            <div className="max-w-3xl mx-auto bg-[#e5e5e5] text-neutral-900 min-h-[600px] shadow-2xl paper-shadow relative animate-in fade-in duration-300 texture-overlay">
               <div className="absolute inset-0 bg-yellow-900/5 pointer-events-none mix-blend-multiply" />
               <div className="absolute top-2 right-2 border-2 border-red-900/30 text-red-900/30 font-bold text-xs px-2 rotate-12 select-none">绝密档案 / CONFIDENTIAL</div>

               <div className="p-8 relative z-10">
                 <div className="flex justify-between items-end border-b-2 border-neutral-800 pb-4 mb-6">
                   <div>
                     <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest font-serif">{activeDoc.title}</h2>
                     <p className="text-xs font-mono mt-1 text-neutral-600">编号: {activeDoc.id.toUpperCase()}</p>
                   </div>
                   <div className="text-xs font-mono text-neutral-500 text-right">
                     听松疗养院档案科<br/>1998年11月14日
                   </div>
                 </div>

                 <div className="font-serif leading-relaxed text-sm md:text-base">
                   {activeDoc.content}
                 </div>
               </div>

               <div className="absolute bottom-4 w-full text-center text-[10px] font-mono text-neutral-400 uppercase">
                 仅限内部流转 • 禁止外泄
               </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-neutral-700 gap-4">
              <Search size={64} className="opacity-20" />
              <p>请选择档案文件进行查阅</p>
            </div>
          )}
        </div>
        
        <button 
          onClick={() => setShowLogicGrid(!showLogicGrid)}
          className="absolute bottom-4 right-4 bg-neutral-800 text-neutral-300 p-2 rounded-full shadow-lg hover:bg-neutral-700 z-50 border border-neutral-600"
          title="打开逻辑辅助网格"
        >
          <Grid size={20} />
        </button>

        {/* Logic Grid Overlay */}
        {showLogicGrid && (
          <div className="absolute bottom-16 right-4 w-80 bg-neutral-900 border border-neutral-600 shadow-2xl p-4 rounded z-50 text-xs animate-in fade-in slide-in-from-bottom-4">
            <h3 className="font-bold text-neutral-400 mb-2 border-b border-neutral-700 pb-1">调查员逻辑网格 (辅助笔记)</h3>
            <p className="text-[10px] text-gray-500 mb-2">点击标记“排除(X)”。此笔记仅供自查，不计入报告。</p>
            <div className="grid grid-cols-4 gap-1 mb-1 text-center font-bold text-neutral-500">
              <div></div><div>22:00</div><div>23:00</div><div>Maint</div>
            </div>
            {['101(Ed)', '102(Su)', 'Dean', 'Arthur'].map(p => (
              <div key={p} className="grid grid-cols-4 gap-1 items-center mb-1">
                <div className="font-bold text-neutral-400">{p}</div>
                {['22', '23', 'Maint'].map(t => {
                  const k = `${p}-${t}`;
                  return (
                    <div 
                      key={k} 
                      onClick={() => setGrid(prev => ({...prev, [k]: !prev[k]}))}
                      className={`h-6 border border-neutral-700 cursor-pointer flex items-center justify-center ${grid[k] ? 'bg-red-900/50 text-red-200' : 'bg-black'}`}
                    >
                      {grid[k] && <XCircle size={12}/>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Form */}
      <div className="w-full md:w-80 bg-[#0a0a0a] border-l border-neutral-800 flex flex-col flex-shrink-0 z-20 overflow-y-auto">
        <div className="p-4 bg-neutral-900 border-b border-neutral-800">
          <h2 className="font-bold flex items-center gap-2 text-neutral-200">
            <FileText size={16} /> 最终结案报告
          </h2>
        </div>

        <div className="p-4 space-y-6 pb-20">
          <Section label="1. 死者身份确认">
             <Select 
               value={archive.victim_room} 
               onChange={v => setArchive(p => ({...p, victim_room: v}))}
               options={[
                 {val: '', lbl: '- 选择房间号 -'},
                 {val: '101', lbl: '101房 (XL码)'},
                 {val: '102', lbl: '102房 (S码)'},
                 {val: '104', lbl: '104房 (L码)'},
               ]} 
             />
             <Select 
               value={archive.victim_identity} 
               onChange={v => setArchive(p => ({...p, victim_identity: v}))}
               options={[
                 {val: '', lbl: '- 选择真实身份 -'},
                 {val: 'edgar', lbl: 'Edgar Vaughn (客人)'},
                 {val: 'susanna', lbl: 'Susanna Clay (客人)'},
                 {val: 'real_smith', lbl: 'John Smith (迟到者)'},
                 {val: 'fake_smith', lbl: '冒名顶替者 / 记者'},
               ]} 
             />
          </Section>

          <Section label="2. 手法与时间窗口">
             <p className="text-[10px] text-gray-500 mb-2">凶手如何在喷淋开启的玻璃长廊作案且不留水渍？</p>
             <Select 
               value={archive.method_clue} 
               onChange={v => setArchive(p => ({...p, method_clue: v}))}
               options={[
                 {val: '', lbl: '- 核心环境证据 -'},
                 {val: 'umbrella', lbl: '使用了雨伞/雨衣'},
                 {val: 'carried', lbl: '通过污衣井运送尸体'},
                 {val: 'maintenance_window', lbl: '利用系统停机维护窗口'},
               ]} 
             />
             <Select 
               value={archive.murder_time} 
               onChange={v => setArchive(p => ({...p, murder_time: v}))}
               options={[
                 {val: '', lbl: '- 作案时间段 -'},
                 {val: '2200_2230', lbl: '22:00 - 22:30 (晚餐时段)'},
                 {val: '2300_2315', lbl: '23:00 - 23:15 (喷淋运行中)'},
                 {val: '2345_0000', lbl: '23:45 - 00:00 (系统离线)'},
                 {val: '0015_0030', lbl: '00:15 - 00:30 (喷淋运行中)'},
               ]} 
             />
          </Section>

          <Section label="3. 指控真凶">
            <Select 
               value={archive.killer} 
               onChange={v => setArchive(p => ({...p, killer: v}))}
               options={[
                 {val: '', lbl: '- 嫌疑人 -'},
                 {val: 'guest_101', lbl: '101 Edgar (门禁记录)'},
                 {val: 'guest_102', lbl: '102 Susanna (不在场证明存疑)'},
                 {val: 'dean', lbl: 'Dean Helen (院长)'},
                 {val: 'arthur', lbl: 'Arthur (维修工)'},
               ]} 
             />
          </Section>

          <button 
            onClick={() => checkCase(false)}
            className="w-full bg-neutral-200 hover:bg-white text-black font-bold py-3 uppercase tracking-widest border border-gray-400 transition-colors text-xs"
          >
            提交结案报告
          </button>

          <div className="border-t border-neutral-800 pt-4">
             <button 
               onClick={() => setShowAudit(!showAudit)} 
               className="flex items-center gap-2 text-xs text-neutral-600 hover:text-neutral-400 w-full"
             >
               {showAudit ? <ChevronDown size={12}/> : <ChevronRight size={12}/>} 
               逻辑审计日志 (DEBUG)
             </button>
             
             {showAudit && (
               <div className="mt-2 space-y-2 bg-black p-2 border border-neutral-800 text-[10px] font-mono text-gray-400">
                 {AUDIT_LOG.map((log, i) => (
                   <div key={i} className="mb-2 border-b border-neutral-900 pb-2">
                     <p className="text-green-600 font-bold">结论: {log.conclusion}</p>
                     <p className="text-blue-600">证据: {log.evidence.join(' + ')}</p>
                     <p className="text-red-900">排除: {log.excludes}</p>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {(gameState === 'viewing_result' || gameState === 'ended') && ending && (
        <Modal 
          title={ending.title} 
          color={ending.color}
          actions={
            !ending.isGameOver ? (
              <button 
                onClick={resumeGame}
                className="px-4 py-2 border border-neutral-600 hover:bg-neutral-800 text-neutral-400 text-xs uppercase"
              >
                继续调查 (扣除2分钟)
              </button>
            ) : (
             <button 
                onClick={() => { localStorage.removeItem('pine_save'); setGameState('init'); }}
                className="px-4 py-2 bg-neutral-200 text-black hover:bg-white text-xs uppercase font-bold"
              >
                重启档案系统
              </button>
            )
          }
        >
          {ending.description}
        </Modal>
      )}

    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);