console.log('%c RADAR PNSA v4.2-FIX (29/04/2026 17:30) ', 'background: #10b981; color: white; font-size: 16px; font-weight: bold; padding: 4px 8px; border-radius: 4px;');

// =============================================
// AVATAR RENDERER
// =============================================
window.getInitials = function (user) {
    if (!user) return '?';
    if (user.iniciais && user.iniciais !== '--' && user.iniciais !== '?') return user.iniciais;
    if (user.nome) {
        const parts = user.nome.trim().split(' ').filter(Boolean);
        if (parts.length > 0) return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
    }
    return '?';
};
window.renderAvatar = function (user, baseClass = '', extraStyle = '') {
    if (!user) return '<div class="' + baseClass + '" style="' + extraStyle + '">?</div>';
    if (user.avatarUrl) {
        return '<img src="' + user.avatarUrl + '" class="' + baseClass + '" style="object-fit:cover; ' + extraStyle + '" title="' + user.nome + '" alt="' + user.iniciais + '">';
    }
    return '<div class="' + baseClass + '" style="' + extraStyle + '" title="' + user.nome + '">' + window.getInitials(user) + '</div>';
};

function generateId() {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
}


// Radar PNSA - SISTEMA DE GESTÃO DE DEMANDAS ASSUNÇÃO
// Versão 2.2 - Correções de Timer e Checkbox

const DEFAULT_USERS = {
    'armando-gestao': { id: 'armando-gestao', nome: 'Armando', iniciais: 'AR', dept: 'Gestão', role: 'coordinator' },
    'julia-sm': { id: 'julia-sm', nome: 'Julia Mendes', iniciais: 'JM', dept: 'Social Media', role: 'social_media' },
    'carlos-sm': { id: 'carlos-sm', nome: 'Carlos Santos', iniciais: 'CS', dept: 'Social Media', role: 'coordinator' },
    'ana-dg': { id: 'ana-dg', nome: 'Ana Costa', iniciais: 'AC', dept: 'Designer', role: 'executor' },
    'lucas-dg': { id: 'lucas-dg', nome: 'Lucas Oliveira', iniciais: 'LO', dept: 'Designer', role: 'executor' },
    'pedro-vm': { id: 'pedro-vm', nome: 'Pedro Lima', iniciais: 'PL', dept: 'Videomaker', role: 'executor' },
    'maria-vm': { id: 'maria-vm', nome: 'Maria Silva', iniciais: 'MS', dept: 'Videomaker', role: 'executor' },
    'roberto-sp': { id: 'roberto-sp', nome: 'Roberto Souza', iniciais: 'RS', dept: 'Suporte', role: 'executor' },
    'fernanda-ti': { id: 'fernanda-ti', nome: 'Fernanda Tech', iniciais: 'FT', dept: 'Inovação/TI', role: 'executor' }
};

let USERS = {};
let DEPT_USERS = {};
let managerAuthenticated = localStorage.getItem('radar_manager_auth') === 'true';
window.currentOriginFilter = 'minhas';

// Helper: Init Users
async function initUsers() {
    try {
        const querySnapshot = await window.getDocs(window.collection(window.firebaseDb, "users"));
        const usersData = {};
        querySnapshot.forEach((doc) => {
            usersData[doc.id] = doc.data();
        });

        if (Object.keys(usersData).length > 0) {
            USERS = usersData;
        } else {
            USERS = JSON.parse(JSON.stringify(DEFAULT_USERS));
        }
        rebuildDeptUsers();
    } catch (e) {
        console.error("Erro ao buscar usuários do Firebase, usando local", e);
        const saved = localStorage.getItem('sgta-users');
        if (saved) {
            USERS = JSON.parse(saved);
        } else {
            USERS = JSON.parse(JSON.stringify(DEFAULT_USERS));
        }
        rebuildDeptUsers();
    }
}

function rebuildDeptUsers() {
    DEPT_USERS = {};
    // Default Dept Users structure to ensure keys exist
    const depts = ['Designer', 'Videomaker', 'Transmissão', 'Suporte', 'Inovação/TI', 'Social Media', 'Gestão'];
    depts.forEach(d => DEPT_USERS[d] = []);

    Object.values(USERS).forEach(u => {
        let depts = getUserDepts(u);
        depts.forEach(d => {
            if (!DEPT_USERS[d]) DEPT_USERS[d] = [];
            if (!DEPT_USERS[d].includes(u.id)) DEPT_USERS[d].push(u.id);
        });
    });
}

function saveUsers() {
    localStorage.setItem('sgta-users', JSON.stringify(USERS));
    rebuildDeptUsers();
    populateLoginDropdown(); // Refresh login dropdown when users change
}

function populateLoginDropdown() {
    const select = document.getElementById('selectUser');
    if (!select) return;

    // Keep the first placeholder option
    select.innerHTML = '<option value="">Escolha um colaborador...</option>';

    // Group users by department
    const groups = {};
    const deptOrder = ['Gestão', 'Social Media', 'Designer', 'Videomaker', 'Suporte', 'Inovação/TI'];

    Object.values(USERS).forEach(u => {
        let depts = typeof getUserDepts === 'function' ? getUserDepts(u) : (Array.isArray(u.dept) ? u.dept : (typeof u.dept === 'string' ? u.dept.split(',').map(d => d.trim()) : [u.dept]));
        if (!depts || depts.length === 0) depts = ['Geral'];
        depts.forEach(d => {
            if (!groups[d]) groups[d] = [];
            groups[d].push(u);
        });
    });

    // Build optgroups in order
    deptOrder.forEach(dept => {
        if (groups[dept] && groups[dept].length > 0) {
            const deptIcons = { 'Gestão': '◆', 'Social Media': '📱', 'Designer': '🎨', 'Videomaker': '🎬', 'Suporte': '🛠️', 'Inovação/TI': '💡' };
            const optgroup = document.createElement('optgroup');
            optgroup.label = `${deptIcons[dept] || '📁'} ${dept}`;
            groups[dept].forEach(u => {
                const option = document.createElement('option');
                option.value = u.id;
                option.textContent = u.nome;
                optgroup.appendChild(option);
            });
            select.appendChild(optgroup);
        }
    });

    // Any departments not in the order list
    Object.keys(groups).forEach(dept => {
        if (!deptOrder.includes(dept) && groups[dept].length > 0) {
            const optgroup = document.createElement('optgroup');
            optgroup.label = `📁 ${dept}`;
            groups[dept].forEach(u => {
                const option = document.createElement('option');
                option.value = u.id;
                option.textContent = u.nome;
                optgroup.appendChild(option);
            });
            select.appendChild(optgroup);
        }
    });
}

// =============================================
// NOVO SISTEMA DE STATUS (Monday-style)
// =============================================
const DEPT_COLORS = { 'Gestão': '#6366f1', 'Social Media': '#ec4899', 'Designer': '#a855f7', 'Videomaker': '#3b82f6', 'Transmissão': '#06b6d4', 'Suporte': '#22c55e', 'Inovação/TI': '#f59e0b' };
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function isGlobalCoordinator() {
    if (!currentUser) return false;
    const depts = typeof getUserDepts === 'function' ? getUserDepts(currentUser) : (Array.isArray(currentUser.dept) ? currentUser.dept : (typeof currentUser.dept === 'string' ? currentUser.dept.split(',').map(d => d.trim()) : [currentUser.dept]));
    const isGestao = depts.includes('Gestão');
    return isGestao || currentUser.role === 'coordinator' || currentUser.role === 'social_media';
}

function getUserVisibleTasks(baseDemandas) {
    if (!currentUser) return [];
    if (!baseDemandas) return [];

    if (isGlobalCoordinator()) {
        return baseDemandas;
    }

    const depts = typeof getUserDepts === 'function' ? getUserDepts(currentUser) : (Array.isArray(currentUser.dept) ? currentUser.dept : [currentUser.dept]);

    if (currentUser.role === 'gestor_equipe') {
        return baseDemandas.filter(d => {
            if (d.solicitanteId === currentUser.id) return true;
            if (!d.pipeline) return false;

            // Se o próprio gestor de equipe está atribuído como candidato ou executor direto da etapa atual, ele deve ver!
            const isAssigned = d.pipeline.some(s => s.userId === currentUser.id || (!s.userId && s.userIds && s.userIds.includes(currentUser.id)));
            if (isAssigned) return true;

            return d.pipeline.some(stage => {
                if (depts.includes(stage.dept)) return true;
                const stageUser = USERS && USERS[stage.userId];
                if (stageUser) {
                    const userDepts = typeof getUserDepts === 'function' ? getUserDepts(stageUser) : [stageUser.dept];
                    return userDepts.some(ud => depts.includes(ud));
                }
                // Se for compartilhado, verificar se algum dos candidatos pertence ao departamento do gestor
                if (!stage.userId && stage.userIds) {
                    return stage.userIds.some(uid => {
                        const sUser = USERS && USERS[uid];
                        if (sUser) {
                            const userDepts = typeof getUserDepts === 'function' ? getUserDepts(sUser) : [sUser.dept];
                            return userDepts.some(ud => depts.includes(ud));
                        }
                        return false;
                    });
                }
                return false;
            });
        });
    }

    // Default executor
    return baseDemandas.filter(d =>
        d.solicitanteId === currentUser.id ||
        (d.pipeline && d.pipeline.some(s => s.userId === currentUser.id || (!s.userId && s.userIds && s.userIds.includes(currentUser.id))))
    );
}


function getUserDepts(u) {
    if (!u) return [];
    if (u.allDepts && Array.isArray(u.allDepts) && u.allDepts.length > 0) return u.allDepts;
    if (Array.isArray(u.dept)) return u.dept;
    if (typeof u.dept === 'string') return u.dept.split(',').map(d => d.trim()).filter(Boolean);
    return [u.dept].filter(Boolean);
}

// =============================================
// NOVO SISTEMA DE STATUS (Monday-style)
// =============================================
const STATUS_FLOW = ['A fazer', 'Fazendo', 'Para aprovação', 'Alteração', 'Aprovado'];
const STATUS_COLORS = {
    'A fazer': '#f59e0b',
    'Fazendo': '#3b82f6',
    'Para aprovação': '#8b5cf6',
    'Alteração': '#ef4444',
    'Aprovado': '#10b981'
};

// Mapeamento de status antigos para novos (migração)
const STATUS_MIGRATION = {
    'Aguardando': 'A fazer',
    'Em Execução': 'Fazendo',
    'Em Revisão': 'Para aprovação',
    'Concluída': 'Aprovado'
};

// Normaliza qualquer variação de status para o formato canônico
function normalizeStatus(s) {
    if (!s) return 'A fazer';
    const t = s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (t === 'a fazer' || t === 'aguardando') return 'A fazer';
    if (t === 'fazendo' || t === 'em execucao' || t === 'em andamento') return 'Fazendo';
    if (t.includes('aprov') && !t.includes('alter')) {
        if (t.includes('para')) return 'Para aprovação';
        return 'Aprovado';
    }
    if (t.includes('alter') || t.includes('correcao')) return 'Alteração';
    if (t === 'aprovado' || t === 'concluida' || t === 'concluido' || t === 'resolvido') return 'Aprovado';
    // Tenta migração de status antigos
    if (STATUS_MIGRATION[s.trim()]) return STATUS_MIGRATION[s.trim()];
    console.warn('Radar PNSA: Status desconhecido encontrado:', JSON.stringify(s));
    return s.trim();
}

// Normaliza todos os status de um array de demandas
function normalizeDemandas(arr) {
    arr.forEach(d => {
        if (d.status) d.status = normalizeStatus(d.status);
        if (d.pipeline && Array.isArray(d.pipeline)) {
            d.pipeline.forEach(stage => {
                if (stage && stage.status) stage.status = normalizeStatus(stage.status);
            });
        }
    });
}

// =============================================
// QUADROS E ABAS (Monday-style)
// =============================================
const QUADROS = {
    'Designer': {
        icon: '🎨',
        abas: ['Missas (arte)', 'Eventos (arte)', 'Produtos (arte)', 'Criativos (arte)']
    },
    'Videomaker': {
        icon: '🎬',
        abas: ['Missas (vídeo)', 'Eventos (vídeo)', 'Produtos (vídeo)', 'Criativos (vídeo)']
    }
};

// Campos específicos por aba
const CAMPOS_POR_ABA = {
    'Missas': ['infosMissa'],
    'Eventos': ['artesAdicionais', 'videosAdicionais', 'nomePalestrantes', 'dataEvento', 'localEvento', 'arquivosFotos', 'videoReferencia'],
    'Produtos': ['infosProduto'],
    'Criativos': ['infosCriativo']
};

// Tags System
const TAGS = {
    'urgente': { name: 'Urgente', color: '#ef4444', icon: '🔥' },
    'evento': { name: 'Evento', color: '#8b5cf6', icon: '🎉' },
    'campanha': { name: 'Campanha', color: '#3b82f6', icon: '📢' },
    'redes': { name: 'Redes Sociais', color: '#ec4899', icon: '📱' },
    'institucional': { name: 'Institucional', color: '#6366f1', icon: '🏛️' },
    'pastoral': { name: 'Pastoral', color: '#10b981', icon: '⛪' },
    'juventude': { name: 'Juventude', color: '#f59e0b', icon: '👥' },
    'liturgia': { name: 'Liturgia', color: '#14b8a6', icon: '✝️' },
    'missa': { name: 'Missa', color: '#6366f1', icon: '⛪' },
    'produto': { name: 'Produto', color: '#22c55e', icon: '📦' }
};

const TEMPLATE_EVENTO_COMPLETO = [
    "1.0 Identidade Visual (IDV)",
    "1.1 Definição de paleta, tipografia, grafismos",
    "2.0 Arte Principal (Key Visual)",
    "2.1 Card Feed",
    "2.2 Card Stories",
    "2.3 Card Site",
    "2.4 Card Site de vendas",
    "3.0 Material impresso",
    "3.1 Camisa",
    "3.2 Lona 3x2m",
    "3.3 Outdoor 9x3m",
    "3.4 Panfleto 15x15 ou 15x20cm",
    "3.5 Adesivo",
    "3.6 Ingresso",
    "3.7 Pulseiras de acesso",
    "3.8 Crachás",
    "4.0 Artes de Antecipação",
    "4.1 Cards Individuais das Atrações",
    "4.2 Atração 01",
    "4.3 Atração 02",
    "4.4 Atração 03",
    "4.5 Atração 04",
    "4.6 Atração 05",
    "4.7 Atração 06",
    "5.0 Porcentagem de Ingressos",
    "5.1 50%",
    "5.2 70%",
    "5.3 90%",
    "5.4 95%",
    "5.5 99%",
    "5.6 Esgotado",
    "6.0 Countdown (Contagem Regressiva)",
    "6.1 Faltam 30 dias",
    "6.2 Faltam 15 dias",
    "6.3 Faltam 7 dias",
    "6.4 Faltam 5 dias",
    "6.5 Faltam 4 dias",
    "6.6 Faltam 3 dias",
    "6.7 Faltam 2 dias",
    "6.8 Faltam 1 dia",
    "6.9 É hoje"
];

const TEMPLATE_EVENTO_VIDEO = [
    "## Save the Date",
    "Prévia com data do evento.",
    "## Chamada",
    "Convite/teaser para o público participar.",
    "## Manifesto (1min30)",
    "Vídeo principal com mensagem e propósito do evento.",
    "## Motion da Identidade Visual",
    "Pacote de animações com a identidade do evento.",
    "## Motion de cada participante",
    "Animação de apresentação individual.",
    "## Pílulas de cada atração",
    "Vídeos curtos destacando cada atração.",
    "## Cobertura do evento",
    "Captação e edição do que aconteceu no dia."
];

let savedFilters = JSON.parse(localStorage.getItem('sgta-filters') || '[]');
let templates = JSON.parse(localStorage.getItem('sgta-templates') || '[]');

let brandHubConfig = JSON.parse(localStorage.getItem('sgta-brandhub')) || {
    colors: [
        { name: 'Azul Primário PNSA', hex: '#0B3C5D' },
        { name: 'Dourado PNSA', hex: '#D9B310' },
        { name: 'Cinza Escuro', hex: '#328CC1' },
        { name: 'Branco', hex: '#FFFFFF' }
    ],
    links: [
        { label: 'Google Drive - Fotos Oficiais', url: 'https://drive.google.com' },
        { label: 'Canva - Templates de Postagem', url: 'https://canva.com' }
    ],
    driveKitLink: 'https://drive.google.com',
    logoPngUrl: 'logo-pnsa.png',
    logoPngLabel: 'Logo PNG (Fundo Transparente)',
    driveKitLabel: 'Kit Completo (Vetor/AI/SVG)'
};

let currentUser = null, demandas = [], nextId = 1, currentDept = null, currentTaskId = null;
let currentView = 'minha-area';
let agendaDate = new Date(), tvInterval = null;

// =============================================
// NOVO SISTEMA DE FILTRO DE MÊS NO DASHBOARD (Idêntico ao TV)
// =============================================
let selectedYear = new Date().getFullYear();
let selectedMonth = new Date().getMonth();

function buildMonthSelector() {
    const sel = document.getElementById('monthSelect');
    if (!sel) return;
    const now = new Date();
    const opts = [];
    for (let i = 0; i < 12; i++) {
        const m = now.getMonth() - i;
        const y = now.getFullYear();
        const dt = new Date(y, m, 1);
        const val = `${dt.getFullYear()}-${dt.getMonth()}`;
        const lbl = `${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
        opts.push(`<option value="${val}"${i === 0 ? ' selected' : ''}>${lbl}</option>`);
    }
    sel.innerHTML = opts.join('');
}

function changeMonth(val) {
    const [y, m] = val.split('-').map(Number);
    selectedYear = y;
    selectedMonth = m;
    refresh(); // Recarrega todas as telas ativas usando as demandas filtradas
}

function getLocalDateString() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function getMonthDemandas(includeFuture = false) {
    const start = new Date(selectedYear, selectedMonth, 1);
    const end = new Date(selectedYear, selectedMonth + 1, 1);
    const now = new Date();
    const isCurrentMonth = (selectedYear === now.getFullYear() && selectedMonth === now.getMonth());

    let filtered = demandas.filter(d => {
        // Priorizar dataSolicitacao e dataConclusao em vez de dataCriacao para colocar a demanda no mês correto de execução
        const dc = d.dataSolicitacao || d.dataConclusao || d.dataCriacao;
        if (!dc) return isCurrentMonth; // Sem data? Mostra no mês atual por segurança

        const dt = new Date(dc);

        // REGRA 1: Demanda foi agendada/criada neste mês selecionado → sempre aparece
        if (dt >= start && dt < end) return true;

        // REGRA 2 (Carry-over): Se a demanda é de meses anteriores
        if (dt < start) {
            // Se estamos no mês atual E ela NÃO está "Aprovado" → aparece (pra não sumir da tela de trabalho)
            if (isCurrentMonth && d.status !== 'Aprovado') return true;

            // Se ela foi aprovada/concluída neste mês selecionado → aparece na coluna de Aprovados do mês de conclusão
            if (d.status === 'Aprovado' && d.lastStatusChange) {
                const lst = new Date(d.lastStatusChange);
                if (lst >= start && lst < end) return true;
            }
        }

        return false;
    });

    if (!includeFuture) {
        const todayStr = getLocalDateString();
        filtered = filtered.filter(d => {
            // Se a demanda está "A fazer" e tem data de solicitação futura, oculta
            if (d.status === 'A fazer' && d.dataSolicitacao && d.dataSolicitacao > todayStr) {
                return false;
            }
            return true;
        });
    }

    return filtered;
}

// Função para abrir modais
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

// Função de login via Google Auth
async function loginComGoogle() {
    console.log('Radar PNSA: Tentando login com Google...');
    try {
        await window.signInWithPopup(window.firebaseAuth, window.googleProvider);
    } catch (error) {
        console.error(error);
        toast('Erro ao fazer login com Google: ' + error.message, 'error');
    }
}

window.skipAutoLogin = function () {
    if (window._autoLoginInt) clearInterval(window._autoLoginInt);
    if (window._autoLoginTm) clearTimeout(window._autoLoginTm);
    showApp();
}

function toggleSenhaGestao() {
    // Campo agora é global, função obsoleta, mantida para prevenir quebras caso algo a chame.
}

async function finalizarOnboarding() {
    const user = window.tempGoogleUser;
    if (!user) return;

    const iniciais = document.getElementById('onboardIniciais')?.value?.trim()?.toUpperCase() || '--';

    const checkboxes = document.querySelectorAll('input[name="onboardDept"]:checked');
    if (checkboxes.length === 0) return toast('Selecione pelo menos 1 departamento.', 'error');

    const senha = document.getElementById('onboardSenhaGestao').value;
    if (senha !== 'GYN1976#') {
        return toast('Acesso negado: Senha do sistema incorreta!', 'error');
    }

    const depts = Array.from(checkboxes).map(cb => cb.value);
    const mainDept = depts[0];

    let isGestao = depts.includes('Gestão');
    let role = 'executor';

    if (isGestao) {
        role = 'coordinator';
    } else if (depts.includes('Social Media')) {
        role = 'social_media';
    }

    const newUser = {
        id: user.uid,
        nome: user.displayName || 'Sem Nome',
        email: user.email,
        iniciais: iniciais,
        dept: depts,
        allDepts: depts,
        role: role,
        avatarUrl: user.photoURL
    };

    try {
        document.getElementById('btnSaveOnboarding').textContent = "Salvando...";
        await window.setDoc(window.doc(window.firebaseDb, "users", user.uid), newUser);
        currentUser = newUser;
        USERS[currentUser.id] = currentUser;
        rebuildDeptUsers();
        closeModal('modalOnboarding');
        showApp();
        toast('Bem-vindo ao Radar PNSA, ' + currentUser.nome + '!', 'success');
    } catch (e) {
        console.error(e);
        toast('Erro ao salvar perfil: ' + e.message, 'error');
        document.getElementById('btnSaveOnboarding').textContent = "Finalizar Cadastro";
    }
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('Radar PNSA: DOM Carregado. Aguardando Firebase...');
    if (window.firebaseDb) {
        initAppBackend();
    } else {
        window.addEventListener('firebaseLoaded', initAppBackend);
    }
});

async function initAppBackend() {
    console.log('Radar PNSA: Iniciando Backend...');
    try {
        await initUsers();
        console.log('Radar PNSA: Usuários carregados');
        initEvents();
        console.log('Radar PNSA: Eventos inicializados');

        buildMonthSelector(); // Adicionado inicialização do seletor

        checkAuth();
        console.log('Radar PNSA: Autenticação em verificação...');
    } catch (e) {
        console.error('Radar PNSA: Erro na inicialização', e);
    }
}

async function loadDataFirestore() {
    return new Promise((resolve, reject) => {
        try {
            // Escuta em Tempo Real (onSnapshot) substituindo a foto estática (getDocs) do F5
            window.onSnapshot(window.collection(window.firebaseDb, "demandas"), (querySnapshot) => {
                demandas = [];
                let maxId = 0;

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    demandas.push(data);
                    const idNum = parseInt(doc.id.split('-')[1]);
                    if (!isNaN(idNum) && idNum > maxId) {
                        maxId = idNum;
                    }
                });

                nextId = maxId + 1;
                
                // Normaliza todos os status para o formato canônico antes de qualquer renderização
                normalizeDemandas(demandas);
                
                console.log('Radar PNSA: Demandas sincronizadas em Tempo Real do Firestore', demandas.length);

                // Timer Retroactive Fix (mantido da segurança na carga limpa)
                demandas.forEach(d => {
                    if (d.status !== 'Fazendo') {
                        d.pipeline?.forEach(stage => {
                            if (stage.timerState && stage.timerState.running) {
                                const endTime = d.lastStatusChange ? new Date(d.lastStatusChange) : new Date();
                                const startTime = new Date(stage.timerState.lastStart);
                                if (endTime > startTime) stage.timerState.accumulated = (stage.timerState.accumulated || 0) + (endTime - startTime);
                                stage.timerState.running = false; stage.timerState.lastStart = null;

                                const ms = stage.timerState.accumulated;
                                const hours = Math.floor(ms / (1000 * 60 * 60));
                                const mins = Math.floor((ms / (1000 * 60)) % 60);
                                stage.timeSpent = `${hours}h ${mins}m`;
                            }
                        });
                    }
                });

                localStorage.setItem('workflowPNSA', JSON.stringify(demandas)); // Guarda cache local de fallback puro sem dar append-loop no Firestore

                // Se a UI já estiver aparecendo para o usuário, força uma atualização nas telas e mini-dashboards (Real-Time)
                if (document.getElementById('app')?.style.display !== 'none') {
                    console.log('Radar PNSA: Sincronização Real-time concluída. Atualizando UI...');
                    if (typeof setupRoleUI === 'function') setupRoleUI();
                    if (typeof refresh === 'function') refresh();
                }

                resolve(); // Libera o checkAuth da promessa principal the tela the loading
            }, (error) => {
                console.error("Erro ao escutar demandas do Firestore (onSnapshot):", error);
                reject(error);
            });

            // Sincronização em Tempo Real para o Mural de Avisos
            window.onSnapshot(window.collection(window.firebaseDb, "avisos"), (qs) => {
                let avTemp = [];
                qs.forEach((doc) => {
                    avTemp.push(doc.data());
                });
                avisos = avTemp;
                localStorage.setItem('sgta-avisos', JSON.stringify(avisos));
                if (document.getElementById('view-mural') && document.getElementById('view-mural').classList.contains('active')) {
                    renderMural();
                }
            });

            // Sincronização em Tempo Real para o Brand Hub (config/brandHub)
            window.onSnapshot(window.doc(window.firebaseDb, "config", "brandHub"), (docSnap) => {
                if (docSnap.exists()) {
                    brandHubConfig = docSnap.data();
                    localStorage.setItem('sgta-brandhub', JSON.stringify(brandHubConfig));
                    console.log('Radar PNSA: Brand Hub atualizado do Firestore.');
                } else {
                    console.log('Radar PNSA: Documento config/brandHub não existe. Usando fallback padrão.');
                }
                if (typeof updateAppLogo === 'function') {
                    updateAppLogo(brandHubConfig.logoPngUrl);
                }
                if (currentView === 'brand-hub') {
                    renderBrandHub();
                }
            }, (error) => {
                console.error("Erro ao carregar Brand Hub (onSnapshot):", error);
            });
        } catch (e) {
            console.error("Erro ao configurar motor onSnapshot no Firestore", e);
            reject(e);
        }
    });
}

async function saveData(demanda = null) {
    localStorage.setItem('workflowPNSA', JSON.stringify(demandas));
    try {
        if (demanda && demanda.id) {
            await window.setDoc(window.doc(window.firebaseDb, "demandas", demanda.id), demanda);
        } else {
            const promises = demandas.filter(d => d.id).map(d =>
                window.setDoc(window.doc(window.firebaseDb, "demandas", d.id), d)
            );
            await Promise.all(promises);
        }
    } catch (e) { console.error('Erro ao salvar no Firestore:', e); }
}

function checkAuth() {
    window.onAuthStateChanged(window.firebaseAuth, async (user) => {
        if (user) {
            try {
                const docRef = window.doc(window.firebaseDb, "users", user.uid);
                const docSnap = await window.getDoc(docRef);

                if (docSnap.exists()) {
                    currentUser = docSnap.data();
                    localStorage.setItem('workflowUser', currentUser.id);
                    // Garante que o usuário logado está em USERS atualizado
                    USERS[currentUser.id] = currentUser;
                    rebuildDeptUsers();
                    const autoBtn = document.getElementById('autoLoginMsg');
                    if (autoBtn) {
                        const originalBtn = document.getElementById('googleLogin');
                        if (originalBtn) originalBtn.style.display = 'none';

                        autoBtn.style.display = 'flex';
                        let timeLeft = 3;
                        const ring = document.getElementById('loginTimerRing');
                        const text = document.getElementById('loginTimerText');
                        text.textContent = timeLeft;
                        ring.style.strokeDashoffset = '0';

                        window._autoLoginInt = setInterval(() => {
                            timeLeft--;
                            if (timeLeft >= 0) {
                                text.textContent = timeLeft;
                                const maxOffset = 150.79;
                                const offset = maxOffset - (maxOffset * timeLeft / 3);
                                ring.style.strokeDashoffset = offset;
                            }
                        }, 1000);

                        window._autoLoginTm = setTimeout(() => {
                            if (window._autoLoginInt) clearInterval(window._autoLoginInt);
                            showApp();
                        }, 3000);
                    } else {
                        setTimeout(function () { showApp(); }, 3000);
                    }

                } else {
                    // Primeiro acesso: não existe no Firestore
                    window.tempGoogleUser = user;
                    const nomeStr = user.displayName ? user.displayName.split(' ')[0] : 'Novo Usuário';
                    const elNome = document.getElementById('onboardName');
                    if (elNome) elNome.textContent = nomeStr;
                    openModal('modalOnboarding');
                }
            } catch (e) {
                console.error("Erro ao verificar user no Firestore", e);
                showLogin();
            }
        } else {
            showLogin();
        }
    });
}
function showLogin() { document.getElementById('loginScreen').style.display = 'flex'; document.getElementById('app').style.display = 'none'; document.getElementById('btnFloatingIT').style.display = 'none'; }
function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    document.getElementById('btnFloatingIT').style.display = 'flex';
    updateUserUI();
    setupRoleUI();
    startNotificationsListener(); // Escuta tempo real as notifications do usuário atual
    loadDataFirestore().then(() => {
        checkStaleDemands();
        autoFinalizarTransmissoes();

        saveData();
        
        // Garante que o UI de cargos esteja atualizado após carregar os dados
        setupRoleUI();

        // Smart redirect: 1ª vez absoluta → Guia, 1ª vez no dia → Minha Área, senão → onde parou
        const smartView = getSmartInitialView();
        if (smartView === 'board') {
            const lastDept = localStorage.getItem('sgta-last-dept');
            if (lastDept) openBoard(lastDept);
            else navigateTo('minha-area');
        } else {
            navigateTo(smartView);
        }

        // Novidades do Sistema (exibe apenas uma vez)
        const showedUpdates = showSystemUpdates();

        // Lembrete diário (1x por dia, se não exibiu novidades)
        if (!showedUpdates) {
            showDailyReminder();
            setTimeout(startBrandHubTour, 1000);
        }

    });
}

function showDailyReminder() {
    const today = new Date().toISOString().split('T')[0];

    // Mensagem de despedida — exibe apenas na terça-feira 2026-03-31, uma vez por usuário
    if (today === '2026-03-31') {
        const farewellKey = 'radar_despedida_2026-03-31';
        if (!localStorage.getItem(farewellKey)) {
            localStorage.setItem(farewellKey, '1');
            showFarewellMessage();
        }
        return;
    }

    const key = 'radar_lembrete_' + today;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const firstName = currentUser?.nome?.split(' ')[0] || '';

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:99999;opacity:0;transition:opacity 0.3s;';
    const box = document.createElement('div');
    box.style.cssText = 'background:var(--surface-light,#1a1a2e);border-radius:16px;padding:36px 44px;text-align:center;max-width:420px;box-shadow:0 8px 32px rgba(0,0,0,0.4);transform:scale(0.9);transition:transform 0.3s;';
    box.innerHTML = `
        <div style="font-size:52px;margin-bottom:14px;">&#128075;</div>
        <h3 style="margin:0 0 6px;color:var(--text-color);font-size:20px;">${greeting}, ${firstName}!</h3>
        <p style="margin:0 0 10px;color:var(--text-secondary);font-size:14px;line-height:1.8;">
            Não se esqueça de verificar suas<br>
            <span style="background:rgba(99,102,241,0.15);color:#818cf8;font-weight:700;padding:2px 8px;border-radius:6px;">notificações</span>,
            <span style="background:rgba(34,197,94,0.15);color:#4ade80;font-weight:700;padding:2px 8px;border-radius:6px;">demandas</span> e o
            <span style="background:rgba(251,191,36,0.15);color:#fbbf24;font-weight:700;padding:2px 8px;border-radius:6px;">mural de avisos</span>!
        </p>
        <p style="margin:0 0 18px;color:var(--text-secondary);font-size:13px;">Tenha um excelente dia de trabalho! &#128640;</p>
        <button onclick="this.closest('div[style*=fixed]').remove()" style="padding:10px 28px;border-radius:10px;border:none;background:var(--primary,#6366f1);color:#fff;font-weight:600;font-size:14px;cursor:pointer;">Entendi!</button>
    `;
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; box.style.transform = 'scale(1)'; });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 8000);
}

function showSystemUpdates() {
    const key = 'radar_updates_seen_2026-06';
    if (localStorage.getItem(key)) {
        return false;
    }

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:99999;opacity:0;transition:opacity 0.3s;padding:20px;box-sizing:border-box;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);';

    const box = document.createElement('div');
    box.style.cssText = [
        'background:linear-gradient(135deg, #1e1e38 0%, #111128 100%)',
        'border-radius:24px',
        'padding:36px',
        'width:100%',
        'max-width:620px',
        'box-shadow:0 25px 50px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(99, 102, 241, 0.25)',
        'transform:scale(0.9)',
        'transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        'color:#ffffff',
        'font-family:\'Inter\', sans-serif',
        'position:relative',
        'overflow:hidden'
    ].join(';');

    // Glowing background spots
    const glow1 = document.createElement('div');
    glow1.style.cssText = 'position:absolute;top:-50px;right:-50px;width:200px;height:200px;border-radius:50%;background:rgba(99, 102, 241, 0.15);filter:blur(50px);pointer-events:none;';
    const glow2 = document.createElement('div');
    glow2.style.cssText = 'position:absolute;bottom:-50px;left:-50px;width:200px;height:200px;border-radius:50%;background:rgba(239, 68, 68, 0.1);filter:blur(50px);pointer-events:none;';
    box.appendChild(glow1);
    box.appendChild(glow2);

    const content = document.createElement('div');
    content.style.cssText = 'position:relative;z-index:2;display:flex;flex-direction:column;max-height:85vh;';

    content.innerHTML = `
        <div style="font-size:48px;margin-bottom:16px;text-align:center;filter:drop-shadow(0 4px 10px rgba(99,102,241,0.3));">🚀</div>
        <h2 style="margin:0 0 8px;font-size:24px;font-weight:800;text-align:center;letter-spacing:-0.5px;background:linear-gradient(90deg, #a855f7, #6366f1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;display:inline-block;align-self:center;">Novidades no Radar PNSA!</h2>
        <p style="margin:0 0 24px;font-size:14px;color:#a1a1aa;text-align:center;font-weight:500;">Confira as últimas atualizações que implementamos para melhorar seu fluxo de trabalho:</p>
        
        <div style="overflow-y:auto;padding-right:8px;margin-bottom:28px;text-align:left;display:flex;flex-direction:column;gap:18px;flex:1;" class="updates-list-scroll">
            <style>
                .updates-list-scroll::-webkit-scrollbar { width: 5px; }
                .updates-list-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 4px; }
                .updates-list-scroll::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.3); border-radius: 4px; }
                .updates-list-scroll::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.5); }
                .update-item-wrapper { display: flex; gap: 14px; align-items: flex-start; }
                .update-item-icon { font-size: 22px; flex-shrink: 0; margin-top: 1px; }
                .update-item-title { font-weight: 700; color: #f4f4f5; font-size: 15px; margin: 0 0 4px; letter-spacing: -0.2px; }
                .update-item-desc { color: #cbd5e1; font-size: 13px; line-height: 1.5; margin: 0; }
            </style>
            
            <div class="update-item-wrapper">
                <span class="update-item-icon">👥</span>
                <div>
                    <h4 class="update-item-title">Demandas Compartilhadas (Fila de Trabalho)</h4>
                    <p class="update-item-desc">Agora é possível criar tarefas para múltiplos responsáveis. Quando qualquer um de vocês iniciar a atividade (mudando para "Fazendo" ou ativando o cronômetro), a tarefa assume a titularidade dele e os demais candidatos são notificados automaticamente.</p>
                </div>
            </div>

            <div class="update-item-wrapper">
                <span class="update-item-icon">📎</span>
                <div>
                    <h4 class="update-item-title">Destaque para Anexos (Cards e Detalhes)</h4>
                    <p class="update-item-desc">Qualquer card no sistema agora exibe um indicador vermelho brilhante e pulsante (<strong style="color:#f87171;">📎 N</strong>) se houver anexos. Além disso, a aba <strong>Anexos</strong> dentro do modal de detalhes ganha uma borda vermelha luminosa, fundo animado suave e destaque em negrito se houver arquivos para direcionar seu olhar imediatamente.</p>
                </div>
            </div>

            <div class="update-item-wrapper">
                <span class="update-item-icon">🔍</span>
                <div>
                    <h4 class="update-item-title">Filtros Personalizados e Rápidos</h4>
                    <p class="update-item-desc">Filtre rapidamente suas demandas, demandas de colegas específicos, Todas do departamento de Social Media ou Todas do Sistema com apenas um clique.</p>
                </div>
            </div>

            <div class="update-item-wrapper">
                <span class="update-item-icon">📅</span>
                <div>
                    <h4 class="update-item-title">Demandas Futuras</h4>
                    <p class="update-item-desc">Tarefas recorrentes agendadas em lote para datas futuras (próximas semanas ou meses).</p>
                </div>
            </div>

            <div class="update-item-wrapper">
                <span class="update-item-icon">✨</span>
                <div>
                    <h4 class="update-item-title">Melhorias Contínuas de Usabilidade</h4>
                    <p class="update-item-desc">Ajustes visuais e otimizações de fluxo foram integrados em todo o sistema para deixar a sua navegação ainda mais simples e fluida.</p>
                </div>
            </div>
        </div>
        
        <div style="text-align:center; margin-top: 8px;">
            <button id="btnDismissUpdates" style="padding:14px 44px;border-radius:12px;border:none;background:linear-gradient(135deg, #a855f7, #6366f1);color:#fff;font-weight:700;font-size:14.5px;cursor:pointer;box-shadow:0 4px 20px rgba(99, 102, 241, 0.4);transition: all 0.2s; letter-spacing: 0.3px;">
                Entendi, vamos lá!
            </button>
        </div>
    `;

    box.appendChild(content);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        box.style.transform = 'scale(1)';
    });

    const dismiss = () => {
        localStorage.setItem(key, 'true');
        overlay.style.opacity = '0';
        box.style.transform = 'scale(0.9)';
        setTimeout(() => {
            overlay.remove();
            setTimeout(startBrandHubTour, 500);
        }, 300);
    };

    box.querySelector('#btnDismissUpdates').addEventListener('click', dismiss);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) dismiss();
    });

    return true;
}

function updateTourLine() {
    const navLink = document.getElementById('navBrandHub');
    const popup = document.getElementById('brandHubTourPopup');
    const line = document.getElementById('tourLine');
    const clone = document.getElementById('navBrandHubClone');
    if (!navLink || !popup || !line) return;
    
    const rect = navLink.getBoundingClientRect();
    if (clone) {
        clone.style.top = `${rect.top}px`;
        clone.style.left = `${rect.left}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
    }
    
    const popupRect = popup.getBoundingClientRect();
    
    const x1 = popupRect.left;
    const y1 = popupRect.top + popupRect.height / 2;
    const x2 = rect.right;
    const y2 = rect.top + rect.height / 2;
    
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
}

function startBrandHubTour() {
    if (localStorage.getItem('radar_brandhub_tour_seen')) return;
    
    const navLink = document.getElementById('navBrandHub');
    if (!navLink) return;
    
    // Suavemente rola o menu lateral para centralizar o item
    navLink.scrollIntoView({ block: 'center', behavior: 'smooth' });
    
    setTimeout(() => {
        // Injetar estilos
        if (!document.getElementById('tourStyles')) {
            const style = document.createElement('style');
            style.id = 'tourStyles';
            style.textContent = `
                .tour-highlight {
                    position: relative;
                    box-shadow: 0 0 0 2px #fbbf24, 0 0 20px rgba(251, 191, 36, 0.7) !important;
                    border-radius: 8px;
                    background: rgba(251, 191, 36, 0.2) !important;
                    color: #fff !important;
                }
                .tour-beacon {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 10px;
                    height: 10px;
                    background: #fbbf24;
                    border-radius: 50%;
                    box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.8);
                    animation: tour-pulse 1.5s infinite;
                    pointer-events: none;
                }
                @keyframes tour-pulse {
                    0% {
                        box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.8);
                    }
                    70% {
                        box-shadow: 0 0 0 10px rgba(251, 191, 36, 0);
                    }
                    100% {
                        box-shadow: 0 0 0 0 rgba(251, 191, 36, 0);
                    }
                }
                @keyframes tour-dash {
                    to {
                        stroke-dashoffset: -100;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Criar o fundo escurecido e borrado (Backdrop Blur Overlay)
        const backdrop = document.createElement('div');
        backdrop.id = 'tourBackdrop';
        backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);z-index:999990;opacity:0;transition:opacity 0.4s;';
        document.body.appendChild(backdrop);
        
        // Clonar o item do menu lateral para exibi-lo por cima do backdrop
        const rect = navLink.getBoundingClientRect();
        const clone = navLink.cloneNode(true);
        clone.id = 'navBrandHubClone';
        clone.classList.add('tour-highlight');
        clone.style.cssText = `
            position: fixed;
            top: ${rect.top}px;
            left: ${rect.left}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            margin: 0;
            z-index: 999992;
            cursor: pointer;
            display: flex;
            align-items: center;
        `;
        
        const beacon = document.createElement('div');
        beacon.className = 'tour-beacon';
        clone.appendChild(beacon);
        document.body.appendChild(clone);
        
        // Criar o Pop-up com tamanho aumentado
        const popup = document.createElement('div');
        popup.id = 'brandHubTourPopup';
        popup.style.cssText = 'position:fixed;right:60px;top:50%;transform:translateY(-50%) scale(0.9);width:420px;background:linear-gradient(135deg, #2a2b4d 0%, #17182f 100%);border:2px solid #fbbf24;border-radius:18px;box-shadow:0 20px 50px rgba(0,0,0,0.7), 0 0 35px rgba(251,191,36,0.3);padding:32px;color:#fff;z-index:999995;opacity:0;transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1);font-family:\'Inter\', sans-serif;';
        popup.innerHTML = `
            <div style="font-size:48px;margin-bottom:16px;text-align:center;filter:drop-shadow(0 4px 8px rgba(251,191,36,0.4));">🎨</div>
            <h3 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#fbbf24;text-align:center;letter-spacing:-0.3px;">Novidade: Guia de Estilo!</h3>
            <p style="margin:0 0 24px;font-size:14px;color:#cbd5e1;line-height:1.75;text-align:justify;">
                Olá! Apresentamos o novo <strong>Guia de Estilo (Brand Hub)</strong> do Radar PNSA. Esta seção centraliza toda a identidade visual oficial da paróquia em um só lugar. Aqui você pode copiar os códigos HEX da paleta oficial com um clique, baixar logotipos e vetores em alta resolução, e utilizar o novo <strong>Gerador de QR Code Branded</strong> personalizado com as cores da igreja!
            </p>
            <div style="display:flex;flex-direction:column;gap:10px;">
                <button id="btnTourGo" style="padding:14px;border-radius:12px;border:none;background:linear-gradient(135deg, #fbbf24, #d97706);color:#000;font-weight:800;font-size:14px;cursor:pointer;box-shadow:0 4px 15px rgba(251, 191, 36, 0.4);transition:transform 0.2s;text-transform:uppercase;letter-spacing:0.5px;">
                    ✨ Explorar Guia de Estilo
                </button>
                <button id="btnTourDismiss" style="padding:10px;border-radius:12px;border:none;background:transparent;color:#a1a1aa;font-weight:600;font-size:13px;cursor:pointer;transition:color 0.2s;">
                    Fechar
                </button>
            </div>
        `;
        document.body.appendChild(popup);
        
        // Criar a Linha Conectora SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'tourLineSvg';
        svg.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:999994;';
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.id = 'tourLine';
        line.setAttribute('stroke', '#fbbf24');
        line.setAttribute('stroke-width', '3');
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('stroke-dasharray', '8, 8');
        line.style.cssText = 'filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.8)); animation: tour-dash 5s linear infinite;';
        svg.appendChild(line);
        document.body.appendChild(svg);
        
        // Ativar animações de entrada
        requestAnimationFrame(() => {
            backdrop.style.opacity = '1';
            popup.style.opacity = '1';
            popup.style.transform = 'translateY(-50%) scale(1)';
            updateTourLine();
        });
        
        window.addEventListener('resize', updateTourLine);
        
        const endTour = (shouldNavigate = false) => {
            localStorage.setItem('radar_brandhub_tour_seen', 'true');
            window.removeEventListener('resize', updateTourLine);
            
            backdrop.style.opacity = '0';
            popup.style.opacity = '0';
            popup.style.transform = 'translateY(-50%) scale(0.9)';
            svg.remove();
            
            setTimeout(() => {
                backdrop.remove();
                popup.remove();
                clone.remove();
                
                if (shouldNavigate) {
                    if (typeof navigateTo === 'function') {
                        navigateTo('brand-hub');
                    }
                }
            }, 400);
        };
        
        document.getElementById('btnTourGo').addEventListener('click', () => endTour(true));
        document.getElementById('btnTourDismiss').addEventListener('click', () => endTour(false));
        clone.addEventListener('click', () => endTour(true));
    }, 300); // Rola primeiro e aguarda concluir a animação do scroll
}

function showFarewellMessage() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;z-index:99999;opacity:0;transition:opacity 0.4s;padding:20px;box-sizing:border-box;';

    const box = document.createElement('div');
    box.style.cssText = [
        'background:linear-gradient(160deg,#14172a 0%,#1a1d33 60%,#1e1a2e 100%)',
        'border-radius:20px',
        'padding:40px 44px',
        'text-align:center',
        'max-width:540px',
        'width:100%',
        'box-shadow:0 20px 60px rgba(0,0,0,0.6),0 0 0 1px rgba(251,191,36,0.25)',
        'transform:scale(0.88)',
        'transition:transform 0.4s cubic-bezier(.34,1.56,.64,1)'
    ].join(';');

    box.innerHTML = `
        <div style="font-size:44px;margin-bottom:6px;filter:drop-shadow(0 2px 6px rgba(251,191,36,0.4));">🕊️</div>
        <p style="margin:0 0 20px;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#fbbf24;opacity:0.8;">Mensagem Especial</p>

        <div style="width:40px;height:1px;background:linear-gradient(90deg,transparent,#fbbf24,transparent);margin:0 auto 24px;"></div>

        <p style="margin:0 0 18px;font-size:17px;font-weight:600;color:#f5f5f5;text-align:left;line-height:1.7;">Olá a todos,</p>

        <p style="margin:0 0 14px;font-size:14px;color:#c4c4d4;text-align:left;line-height:1.8;">
            Gostaria de informar que, a partir desta <strong style="color:#f5f5f5;">terça-feira</strong>, o gestor deste sistema passará a ser o <strong style="color:#fbbf24;">Armando Filho</strong>.
        </p>

        <p style="margin:0 0 22px;font-size:14px;color:#c4c4d4;text-align:left;line-height:1.8;">
            Foi um imenso prazer construir esta ferramenta e contribuir da melhor forma que pude com cada um de vocês ao longo desses últimos <strong style="color:#f5f5f5;">5 anos</strong>. Deixo aqui o meu muito obrigado.
        </p>

        <p style="margin:0 0 14px;font-size:13px;color:#a0a0b8;text-align:left;font-style:italic;">Para encerrar este ciclo, deixo uma reflexão:</p>

        <blockquote style="margin:0 0 28px;padding:18px 20px;background:rgba(251,191,36,0.06);border-left:3px solid #fbbf24;border-radius:0 10px 10px 0;text-align:left;">
            <p style="margin:0 0 10px;font-size:14px;color:#e8e0c4;font-style:italic;line-height:1.9;">
                "Tudo o que fizerem, façam de todo o coração, como para o Senhor, e não para os homens, sabendo que receberão do Senhor a recompensa..."
            </p>
            <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:1px;color:#fbbf24;text-align:right;">— Colossenses 3:23-24</p>
        </blockquote>

        <p style="margin:0 0 20px;font-size:11px;color:#6b6b88;text-align:center;font-style:italic;">
            ✦ Esta mensagem foi programada na segunda-feira para ser exibida automaticamente ✦
        </p>

        <div style="width:40px;height:1px;background:linear-gradient(90deg,transparent,#fbbf24,transparent);margin:0 auto 24px;"></div>

        <button onclick="this.closest('div[style*=fixed]').remove()" style="padding:13px 36px;border-radius:12px;border:none;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;font-weight:700;font-size:14px;cursor:pointer;letter-spacing:0.5px;box-shadow:0 4px 16px rgba(245,158,11,0.35);transition:opacity 0.2s;" onmouseover="this.style.opacity='0.88'" onmouseout="this.style.opacity='1'">
            Com gratidão ✦
        </button>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => { overlay.style.opacity = '1'; box.style.transform = 'scale(1)'; });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
}

function updateUserUI() {
    if (!currentUser) return;
    try {
        const avatar = document.getElementById('userAvatar');
        const name = document.getElementById('userName');
        const dept = document.getElementById('userDept');
        const welcome = document.getElementById('welcomeName');
        const solicitante = document.getElementById('cSolicitante');

        if (avatar) avatar.innerHTML = window.renderAvatar(currentUser, 'user-avatar');
        if (name) name.textContent = currentUser.nome || 'Usuário';
        if (dept) {
            const depts = typeof getUserDepts === 'function' ? getUserDepts(currentUser) : (currentUser.dept || []);
            dept.textContent = Array.isArray(depts) ? depts.join(', ') : depts;
        }
        if (welcome && currentUser.nome) {
            welcome.textContent = currentUser.nome.split(' ')[0];
        }
        if (solicitante) {
            solicitante.innerHTML = `<option value="${currentUser.id || ''}" selected>${currentUser.nome || 'Usuário'}</option>`;
        }
    } catch (err) {
        console.error("Erro em updateUserUI:", err);
    }
}

function setupRoleUI() {
    if (!currentUser) return;
    
    // Tenta encontrar o usuário no banco USERS por ID, Email ou Nome para garantir o cargo mais atualizado
    const authRole = currentUser.role;
    const usersEntry = Object.values(USERS).find(u => 
        (u.id && u.id === currentUser.id) || 
        (u.email && u.email === currentUser.email) || 
        (u.nome && u.nome === currentUser.nome)
    );

    // Se encontramos no banco, sincronizamos o objeto currentUser para que isGlobalCoordinator() use dados reais
    if (usersEntry) {
        if (usersEntry.role) currentUser.role = usersEntry.role;
        if (usersEntry.dept) currentUser.dept = usersEntry.dept;
        if (usersEntry.allDepts) currentUser.allDepts = usersEntry.allDepts;
    }

    const databaseRole = usersEntry?.role;
    
    // Se no banco central (USERS) o cargo for diferente de executor, prioriza ele
    const role = (databaseRole && databaseRole !== 'executor') ? databaseRole : authRole;
    
    const isGlobal = isGlobalCoordinator() || role === 'coordinator' || role === 'social_media' || role === 'gestor_equipe';
    const isCoordOrSocialMedia = role === 'coordinator' || role === 'social_media' || role === 'gestor_equipe' || isGlobal;

    console.log('Radar PNSA: setupRoleUI - User:', currentUser.id, 'AuthRole:', authRole, 'DBRole:', databaseRole, 'FinalRole:', role, 'isCoordOrSocialMedia:', isCoordOrSocialMedia);

    const navCoordinator = document.getElementById('navCoordinator');
    if (navCoordinator) navCoordinator.style.display = isCoordOrSocialMedia ? 'block' : 'none';

    const navExecutor = document.getElementById('navExecutor');
    if (navExecutor) navExecutor.style.display = isCoordOrSocialMedia ? 'none' : 'block';

    const headerActions = document.getElementById('headerActions');
    if (headerActions) headerActions.style.display = isCoordOrSocialMedia ? 'flex' : 'none';

    const btnCreateAlt = document.querySelector('.btn-create-alt');
    if (btnCreateAlt) btnCreateAlt.style.display = isCoordOrSocialMedia ? 'flex' : 'none';
    document.getElementById('welcomeDesc').textContent = isCoordOrSocialMedia ? 'Acompanhe suas demandas e crie novas' : 'Veja as tarefas atribuídas a você';
    document.getElementById('navWorkload').style.display = isCoordOrSocialMedia ? 'flex' : 'none';
    document.getElementById('navTemplates').style.display = isCoordOrSocialMedia ? 'flex' : 'none';
    const navLixeira = document.getElementById('navLixeira');
    if (navLixeira) navLixeira.style.display = isCoordOrSocialMedia ? 'flex' : 'none';
    
    const navUsers = document.getElementById('nav-users');
    if (navUsers) {
        // Gestor de equipe não pode ver a aba de usuários, apenas coordenadores e gestão
        const canSeeUsers = (isGlobal || isGlobalCoordinator()) && role !== 'gestor_equipe';
        navUsers.style.display = canSeeUsers ? 'flex' : 'none';
    }
    
    const navEquipe = document.getElementById('nav-equipe');
    if (navEquipe) {
        // Equipe (Demandas da Equipe) visível para gestores de equipe e coordenadores
        // Aba Equipe visível para permitir que gestores se autentiquem (mesmo se o papel inicial for user)
        const canSeeEquipe = true; 
        navEquipe.style.display = canSeeEquipe ? 'flex' : 'none';
    }
    
    const navTV = document.getElementById('navTV');
    if (navTV) navTV.style.display = isCoordOrSocialMedia ? 'block' : 'none';
    
    buildDeptNav();
}

function buildDeptNav() {
    const c = document.getElementById('navDepts');
    const section = document.getElementById('navDeptsSection');
    if (!c) return;
    
    const isCoordOrSocialMedia = currentUser.role === 'coordinator' || currentUser.role === 'social_media' || currentUser.role === 'gestor_equipe' || isGlobalCoordinator();

    if (section) section.style.display = 'block';

    let depts = [];
    if (isCoordOrSocialMedia) {
        depts = ['Designer', 'Videomaker', 'Transmissão', 'Suporte', 'Inovação/TI'];
    } else {
        depts = [...getUserDepts(currentUser)]; // <-- CLONAR O ARRAY para não modificar currentUser
        // Garante que a opção Suporte sempre apareça no menu lateral
        // Mesmo sem permissão, o clique exibirá a tela de "Acesso Restrito"
        if (!depts.includes('Suporte')) {
            depts.push('Suporte');
        }
    }

    c.innerHTML = depts.map(d => {
        if (!d) return '';
        const dt = d.trim();
        return `<a class="dept-link" data-dept="${dt}"><span class="dept-dot" style="background:${DEPT_COLORS[dt] || '#ccc'}"></span>${dt}</a>`;
    }).join('');

    c.querySelectorAll('.dept-link').forEach(el => el.addEventListener('click', () => openBoard(el.dataset.dept)));
}

function populateResponsaveis() {
    document.getElementById('cResponsavelDesign').innerHTML = '<option value="">Selecione...</option>' + DEPT_USERS['Designer'].map(id => `<option value="${id}">${USERS[id].nome}</option>`).join('');
    document.getElementById('cResponsavelVideo').innerHTML = '<option value="">Selecione...</option>' + DEPT_USERS['Videomaker'].map(id => `<option value="${id}">${USERS[id].nome}</option>`).join('');
}

function initEvents() {
    // Login
    // (O botão do Google possui listener 'onclick' direto no HTML)

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) btnLogout.addEventListener('click', async function () {
        // Clear Sessions
        localStorage.removeItem('workflowUser');
        localStorage.removeItem('sgta-user');

        // Firebase logout
        try { await window.signOut(window.firebaseAuth); } catch (e) { console.error(e); }

        // Clear Global Timer
        localStorage.removeItem('sgta-timer-start');
        localStorage.removeItem('sgta-timer-running');
        if (timerInterval) clearInterval(timerInterval);
        const tDisp = document.getElementById('timerDisplay');
        if (tDisp) tDisp.textContent = '00:00:00';
        document.getElementById('headerTimer')?.classList.remove('running');

        if (tvInterval) clearInterval(tvInterval);
        showLogin();
    });

    // Navegação
    document.querySelectorAll('.nav-link[data-view]').forEach(function (el) {
        el.addEventListener('click', function () { navigateTo(el.dataset.view); });
    });

    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) menuToggle.addEventListener('click', function () { document.getElementById('sidebar').classList.toggle('open'); });

    const btnCreate = document.getElementById('btnCreate');
    if (btnCreate) btnCreate.addEventListener('click', openCreateModal);

    document.getElementById('btnCreateAlt')?.addEventListener('click', openCreateModal);
    document.getElementById('formCreate')?.addEventListener('submit', handleCreate);
    document.getElementById('filterTasks')?.addEventListener('change', renderTasks);
    document.getElementById('filterBoard')?.addEventListener('change', renderBoard);
    document.getElementById('boardSearch')?.addEventListener('input', renderBoard);
    document.getElementById('filterKanbanPrio')?.addEventListener('change', renderKanban);
    document.getElementById('filterKanbanDept')?.addEventListener('change', renderKanban);
    document.getElementById('kanbanSearch')?.addEventListener('input', renderKanban);
    document.getElementById('filterQuadroStatus')?.addEventListener('change', renderQuadroGeral);
    document.getElementById('filterQuadroDept')?.addEventListener('change', renderQuadroGeral);
    document.getElementById('filterQuadroPrio')?.addEventListener('change', renderQuadroGeral);
    document.getElementById('quadroSearch')?.addEventListener('input', renderQuadroGeral);
    document.getElementById('filterOrigin')?.addEventListener('change', (e) => {
        window.currentOriginFilter = e.target.value;
        const filterReq = document.getElementById('filterOriginReq');
        if (filterReq) filterReq.value = window.currentOriginFilter;
        renderKanban();
    });
    document.getElementById('filterOriginReq')?.addEventListener('change', (e) => {
        window.currentOriginFilter = e.target.value;
        const filterKanban = document.getElementById('filterOrigin');
        if (filterKanban) filterKanban.value = window.currentOriginFilter;
        renderRequests();
    });
    document.getElementById('btnAgendaPrev')?.addEventListener('click', () => { agendaDate.setMonth(agendaDate.getMonth() - 1); renderAgenda(); });
    document.getElementById('btnAgendaNext')?.addEventListener('click', () => { agendaDate.setMonth(agendaDate.getMonth() + 1); renderAgenda(); });
    document.getElementById('btnAgendaToday')?.addEventListener('click', () => { agendaDate = new Date(); renderAgenda(); });
    document.getElementById('btnOpenTV')?.addEventListener('click', () => { window.open('tv-dashboard.html', '_blank'); });

    // Enter key for Manager Auth
    document.getElementById('managerPassInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkManagerAuth();
    });
}

function onTipoProjetoChange() {
    // alert('DEBUG: Change Event Fired');
    console.log('DEBUG: Change Event Fired');
    const t = document.getElementById('cTipoProjeto').value;
    // Reset all sub-sections
    document.getElementById('sectionSubType').style.display = 'none';
    ['groupDesign', 'groupVideo', 'groupSocial', 'groupTI'].forEach(id => document.getElementById(id).style.display = 'none');
    ['cTipoDesign', 'cTipoVideo', 'cTipoSocial', 'cTipoTI'].forEach(id => document.getElementById(id).required = false);

    // Show appropriate sub-section
    const isTI = t === 'TI';
    const isTrans = t === 'Transmissão';

    // Se TI, redirecionar para o modal dedicado de chamado TI
    if (isTI) {
        document.getElementById('cTipoProjeto').value = '';
        closeModal('modalCreate');
        openITSupportModal();
        return;
    }

    // Suporte liberado para uso, fluxo padrão.
    const hideStandard = isTrans;

    // Toggle standard vs TI/Transmissão fields
    if (document.getElementById('groupStandardFields')) {
        document.getElementById('groupStandardFields').style.display = hideStandard ? 'none' : 'block';
    }
    if (document.getElementById('groupTIFields')) {
        document.getElementById('groupTIFields').style.display = isTI ? 'block' : 'none';
    }
    if (document.getElementById('groupTransmissaoFields')) {
        document.getElementById('groupTransmissaoFields').style.display = isTrans ? 'block' : 'none';
        if (isTrans) buildTransmissaoWeekGrid();
        
        const transSemanaEl = document.getElementById('cTransSemana');
        if (transSemanaEl) transSemanaEl.required = isTrans;
    }

    // Toggle Dates and Title for TI/Transmissão
    const datesGroup = document.getElementById('groupDatesTitle');
    if (datesGroup) {
        datesGroup.style.display = hideStandard ? 'none' : 'block';
        document.getElementById('cDataSolicitacao').required = !hideStandard;
        document.getElementById('cDataConclusao').required = !hideStandard;
    }

    // Toggle Pinned Option
    const pinnedGroup = document.getElementById('groupPinned');
    if (pinnedGroup) pinnedGroup.style.display = hideStandard ? 'none' : 'flex';

    // Hide/Show "Formatos" and standard descriptions based on type
    const formatsGroup = document.getElementById('groupFormats');
    if (formatsGroup) formatsGroup.style.display = hideStandard ? 'none' : 'block';

    if (t === 'Design Gráfico') {
        document.getElementById('sectionSubType').style.display = 'block';
        document.getElementById('groupDesign').style.display = 'block';
        document.getElementById('cTipoDesign').required = true;
        // Show Dependency Option
        const depGroup = document.getElementById('groupDependencyDesign');
        if (depGroup) depGroup.style.display = 'block';
    } else {
        // Hide Dependency Option for others
        const depGroup = document.getElementById('groupDependencyDesign');
        if (depGroup) {
            depGroup.style.display = 'none';
            document.getElementById('cDependeDesigner').checked = false;
            toggleVideomakerFields?.(); // Safely call if exists
        }
    }

    if (t === 'Videomaker') {
        document.getElementById('sectionSubType').style.display = 'block';
        document.getElementById('groupVideo').style.display = 'block';
        document.getElementById('cTipoVideo').required = true;
    } else if (t === 'Social Media') {
        document.getElementById('sectionSubType').style.display = 'block';
        document.getElementById('groupSocial').style.display = 'block';
        document.getElementById('cTipoSocial').required = true;
    } else if (t === 'TI') {
        // Hide sub-type for TI as requested
        document.getElementById('sectionSubType').style.display = 'none';
        document.getElementById('groupTI').style.display = 'none';
        document.getElementById('cTipoTI').required = false;
    } else if (t === 'Transmissão') {
        document.getElementById('sectionSubType').style.display = 'none';
    }
    // Populate Format Options
    const formatsContainer = document.getElementById('formatsContainer');
    let formats = [];

    if (t === 'Design Gráfico') {
        formats = [
            'Feed de Instagram',
            'Stories de Instagram',
            'Thumbnail para YouTube',
            'Banner para Website',
            'Banner Site Paróquia',
            'Site Ingressos',
            'Site Loja'
        ];
    } else if (t === 'Videomaker') {
        formats = [
            'Instagram',
            'YouTube'
        ];
    } else if (t === 'Social Media') {
        // Union of both
        formats = [
            'Feed de Instagram',
            'Stories de Instagram',
            'Thumbnail para YouTube',
            'Banner para Website',
            'Banner Site Paróquia',
            'Site Ingressos',
            'Site Loja',
            'Instagram (Vídeo)',
            'YouTube (Vídeo)'
        ];
    }

    if (formats.length > 0) {
        let html = formats.map(f => {
            const safeId = `fmt-${f.replace(/[^a-zA-Z0-9]/g, '-')}`;
            return `
            <div class="checkbox-item" style="display:flex; align-items:center; gap:8px;">
                <input type="checkbox" id="${safeId}" value="${f}" name="formatOptions" class="format-checkbox">
                <label for="${safeId}" style="cursor:pointer;">${f}</label>
            </div>
            `;
        }).join('');
        // Campo Personalizado
        html += `
        <div class="checkbox-item" style="display:flex; align-items:center; gap:8px; margin-top:8px;">
            <input type="checkbox" id="fmt-personalizado" value="Personalizado" name="formatOptions" class="format-checkbox" onchange="document.getElementById('fmt-personalizado-input').style.display = this.checked ? 'block' : 'none'">
            <label for="fmt-personalizado" style="cursor:pointer; font-weight:600;">✏️ Personalizado</label>
        </div>
        <div id="fmt-personalizado-input" style="display:none; margin-top:6px; padding:8px 12px; background:rgba(0,0,0,0.03); border-radius:8px; border:1px solid var(--border-subtle);">
            <input type="text" id="fmtCustomText" placeholder="Ex: Banner impresso 3x2m, Panfleto 15x15cm, Outdoor..." style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border-color); font-size:13px;">
        </div>
        `;
        formatsContainer.innerHTML = html;
    } else {
        formatsContainer.innerHTML = '<span class="text-muted">Selecione um tipo de projeto para ver os formatos.</span>';
    }
}


function updatePipelinePreview(depts) { document.getElementById('pipelinePreview').innerHTML = depts.map((d, i) => `<div class="pipeline-item"><span class="pipeline-num">${i + 1}</span><div class="pipeline-info"><span class="pipeline-dept">${d}</span><span class="pipeline-user">(selecione responsável)</span></div></div>`).join(''); }

/**
 * Lógica inteligente de redirect pós-login:
 * 1ª vez absoluta (nunca usou) → 'guide' (Guia de Uso)
 * 1ª vez no dia (usou antes, mas não hoje) → 'minha-area'
 * Já abriu hoje → retoma de onde parou (sgta-last-view)
 */
function getSmartInitialView() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const everUsed = localStorage.getItem('sgta-ever-logged');
    const lastSessionDate = localStorage.getItem('sgta-last-session-date');
    const lastView = localStorage.getItem('sgta-last-view');

    // Marca que já usou o sistema
    localStorage.setItem('sgta-ever-logged', 'true');
    localStorage.setItem('sgta-last-session-date', today);

    if (!everUsed) {
        // 1ª vez absoluta → Guia de Uso
        console.log('Radar PNSA: Primeiro acesso do usuário → Guia de Uso');
        return 'guide';
    }

    if (lastSessionDate !== today) {
        // 1ª vez no dia → Minha Área
        console.log('Radar PNSA: Primeiro acesso do dia → Minha Área');
        return 'minha-area';
    }

    // Já abriu hoje → retoma de onde parou
    console.log('Radar PNSA: Retomando sessão → ' + (lastView || 'minha-area'));
    return lastView || 'minha-area';
}

function navigateTo(view) {
    currentView = view;
    localStorage.setItem('sgta-last-view', view);
    document.querySelectorAll('.nav-link, .dept-link').forEach(el => el.classList.remove('active'));
    document.querySelector(`.nav-link[data-view="${view}"]`)?.classList.add('active');
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none';
    });

    const target = document.getElementById(`view-${view}`);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
    } else {
        console.error(`View target view-${view} not found!`);
    }
    const titles = { 'minha-area': 'Minha Área', 'minha-agenda': 'Minha Agenda', kanban: 'Kanban Board', 'quadro-geral': 'Quadro Geral', requests: 'Minhas Demandas', review: 'Para Revisar', tasks: 'Para Executar', timeline: 'Timeline', analytics: 'Analytics', workload: 'Carga de Trabalho', templates: 'Templates', mural: 'Mural de Avisos', lixeira: 'Lixeira / Arquivo Morto', users: 'Gestão de Usuários', guide: 'Guia de Uso', equipe: 'Demandas da Equipe', galeria: 'Galeria de Mídias', 'brand-hub': 'Guia de Estilo' };
    
    // Gate for Equipe View
    if (view === 'equipe' && !managerAuthenticated) {
        openManagerAuth();
        return;
    }

    const pTitle = document.getElementById('pageTitle');
    if (pTitle) pTitle.textContent = titles[view] || 'Radar PNSA';

    if (view === 'users') {
        renderUsers();
    }
    currentDept = null;
    if (tvInterval) { clearInterval(tvInterval); tvInterval = null; }
    if (view === 'minha-area') updateMinhaArea();
    if (view === 'minha-agenda') renderAgenda();
    if (view === 'requests') renderRequests();
    if (view === 'review') renderReview();
    if (view === 'tasks') renderTasks();
    if (view === 'kanban') renderKanban();
    if (view === 'quadro-geral') renderQuadroGeral();
    if (view === 'timeline') renderTimeline();
    if (view === 'analytics') renderAnalytics();
    if (view === 'workload') renderWorkload();
    if (view === 'templates') renderTemplates();
    if (view === 'mural') renderMural();
    if (view === 'lixeira') renderLixeira();
    if (view === 'equipe') renderEquipeView();
    if (view === 'galeria') renderGallery();
    if (view === 'brand-hub') renderBrandHub();
    updateBadges();
    document.getElementById('sidebar').classList.remove('open');
}

function openBoard(dept) {
    currentDept = dept;
    currentView = 'board';
    localStorage.setItem('sgta-last-view', 'board');
    localStorage.setItem('sgta-last-dept', dept);
    document.querySelectorAll('.nav-link, .dept-link').forEach(el => el.classList.remove('active'));
    document.querySelector(`.dept-link[data-dept="${dept}"]`)?.classList.add('active');
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
        v.style.display = 'none';
    });
    const boardView = document.getElementById('view-board');
    if (boardView) {
        boardView.classList.add('active');
        boardView.style.display = 'block';
    }
    document.getElementById('pageTitle').textContent = dept;

    // Placeholder premium "Em breve"
    const boardTable = document.getElementById('boardTable');
    if (boardTable) {
        const tb = document.querySelector('#view-board .toolbar');
        if (tb) tb.style.display = dept === 'Suporte' ? 'none' : 'flex';

        if (dept === 'Suporte') {
            const depts = (typeof getUserDepts === 'function' && currentUser) ? getUserDepts(currentUser) : [];
            const isSuporte = depts.includes('Suporte');
            const isCoord = (typeof isGlobalCoordinator === 'function' && isGlobalCoordinator()) || currentUser?.role === 'coordinator';
            
            if (!isSuporte && !isCoord) {
                boardTable.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 55vh; padding: 60px 20px; text-align: center;">
                        <div style="background: linear-gradient(135deg, rgba(220, 38, 38, 0.08), rgba(248, 113, 113, 0.06)); backdrop-filter: blur(20px); border: 1px solid rgba(220, 38, 38, 0.15); border-radius: 24px; padding: 60px 50px; max-width: 520px; width: 100%;">
                            <div style="width: 80px; height: 80px; background: rgba(220, 38, 38, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px auto;">
                                <i class="fas fa-lock" style="font-size: 32px; color: #dc2626;"></i>
                            </div>
                            <h2 style="font-family: 'Space Grotesk', sans-serif; font-size: 24px; font-weight: 700; color: var(--text-color); margin-bottom: 16px;">Acesso Restrito</h2>
                            <p style="font-size: 16px; color: var(--secondary-color); line-height: 1.6; margin-bottom: 0;">
                                Você não tem permissão para visualizar o painel de <strong>Suporte</strong>.<br><br>
                                O acesso é restrito aos membros do departamento e aos Coordenadores/Gestão.
                            </p>
                        </div>
                    </div>
                `;
                return;
            }

            renderSuporteDashboard();
            return;
        }

        if (dept === 'Inovação/TI') {
            boardTable.innerHTML = `
                <style>
                    @keyframes urgentGlow {
                        0% { box-shadow: 0 0 5px rgba(239,68,68,0.2), inset 0 0 0 1px rgba(239,68,68,0.5); }
                        50% { box-shadow: 0 0 20px rgba(239,68,68,0.8), inset 0 0 0 2px rgba(239,68,68,1); }
                        100% { box-shadow: 0 0 5px rgba(239,68,68,0.2), inset 0 0 0 1px rgba(239,68,68,0.5); }
                    }
                    .urgent-glow {
                        animation: urgentGlow 2s infinite alternate !important;
                        border: 1px solid rgba(239,68,68,0.8) !important;
                    }
                </style>
                <div style="display: flex; gap: 16px; padding: 20px 20px 0 20px; flex-wrap: wrap;">
                    <div onclick="renderTIKanban('pendentes')" style="flex: 1; min-width: 200px; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(99,102,241,0.2); display: flex; align-items: center; justify-content: center; font-size: 20px; color: #818cf8;"><i class="fas fa-clock"></i></div>
                        <div>
                            <p style="margin: 0; font-size: 13px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Pendentes Hoje</p>
                            <h3 id="tiKpiPendentes" style="margin: 4px 0 0 0; font-size: 24px; color: #818cf8; font-weight: 700;">0</h3>
                        </div>
                    </div>
                    <div onclick="renderTIKanban('concluidos')" style="flex: 1; min-width: 200px; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(34,197,94,0.2); display: flex; align-items: center; justify-content: center; font-size: 20px; color: #4ade80;"><i class="fas fa-check-circle"></i></div>
                        <div>
                            <p style="margin: 0; font-size: 13px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Concluídos (Semana)</p>
                            <h3 id="tiKpiConcluidos" style="margin: 4px 0 0 0; font-size: 24px; color: #4ade80; font-weight: 700;">0</h3>
                        </div>
                    </div>
                    <div onclick="renderTIKanban('urgentes')" style="flex: 1; min-width: 200px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(239,68,68,0.2); display: flex; align-items: center; justify-content: center; font-size: 20px; color: #f87171;"><i class="fas fa-exclamation-triangle"></i></div>
                        <div>
                            <p style="margin: 0; font-size: 13px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Urgentes / Atrasados</p>
                            <h3 id="tiKpiUrgentes" style="margin: 4px 0 0 0; font-size: 24px; color: #f87171; font-weight: 700;">0</h3>
                        </div>
                    </div>
                    <div style="min-width: 200px; display: flex; flex-direction: column; justify-content: center; gap: 8px;">
                        <button onclick="window.toggleGlobalIncident()" id="btnIncident" style="padding: 12px; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; color: #f87171; font-weight: 700; cursor: pointer; transition: all 0.3s; box-shadow: inset 0 0 10px rgba(239,68,68,0.1);">
                            🚨 Disparar Alerta Global
                        </button>
                    </div>
                </div>
                <div class="kanban-board" style="display:grid; grid-template-columns: repeat(5, 1fr); gap:16px; padding:20px; align-items:flex-start; height: 100%; min-height: 55vh;">
                    ${['A fazer', 'Fazendo', 'Para aprovação', 'Alteração', 'Aprovado'].map(status => {
                        let borderColor = '#3b82f6';
                        if(status === 'A fazer') borderColor = '#a855f7';
                        if(status === 'Fazendo') borderColor = '#f59e0b';
                        if(status === 'Para aprovação') borderColor = '#eab308';
                        if(status === 'Alteração') borderColor = '#ef4444';
                        if(status === 'Aprovado') borderColor = '#22c55e';
                        
                        return `
                        <div class="kanban-column" data-status="${status}" style="width:100%; min-width:0; background:var(--surface-light); border-top: 3px solid ${borderColor}; border-radius:12px; display:flex; flex-direction:column; padding:16px; overflow:hidden;">
                            <div style="display:flex; justify-content:space-between; align-items: center; margin-bottom:16px;">
                                <h3 style="font-size:14.5px; font-weight:700; color:var(--text-color); margin:0;">${status}</h3>
                                <span id="count-ti-${status.replace(/\s+/g, '')}" style="background:rgba(255,255,255,0.05); padding:2px 8px; border-radius:10px; font-size:12px; font-weight:600;">0</span>
                            </div>
                            <div class="kanban-cards custom-ti-cards" data-status="${status}" id="cards-ti-${status.replace(/\s+/g, '')}" style="display:flex; flex-direction:column; gap:12px; min-height:150px;">
                            </div>
                        </div>
                    `}).join('')}
                </div>
            `;
            setTimeout(() => {
                if(typeof renderTIKanban === 'function') renderTIKanban();
                
                // Add listeners for toolbar
                const bs = document.getElementById('boardSearch');
                const fb = document.getElementById('filterBoard');
                if(bs) bs.oninput = () => renderTIKanban();
                if(fb) fb.onchange = () => renderTIKanban();
            }, 50);
            return;
        }

        boardTable.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 55vh;
                padding: 60px 20px;
                text-align: center;
            ">
                <div style="
                    background: linear-gradient(135deg, rgba(108, 92, 231, 0.08), rgba(0, 206, 201, 0.06));
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(108, 92, 231, 0.15);
                    border-radius: 24px;
                    padding: 60px 50px;
                    max-width: 520px;
                    width: 100%;
                    position: relative;
                    overflow: hidden;
                    animation: comingSoonPulse 3s ease-in-out infinite;
                ">
                    <div style="
                        position: absolute;
                        top: -50%;
                        left: -50%;
                        width: 200%;
                        height: 200%;
                        background: radial-gradient(circle, rgba(108, 92, 231, 0.05) 0%, transparent 70%);
                        animation: comingSoonGlow 6s ease-in-out infinite;
                        pointer-events: none;
                    "></div>
                    
                    <div style="
                        font-size: 64px;
                        margin-bottom: 20px;
                        animation: comingSoonFloat 3s ease-in-out infinite;
                    ">🚀</div>
                    
                    <h2 style="
                        font-size: 1.8rem;
                        font-weight: 700;
                        background: linear-gradient(135deg, #6c5ce7, #00cec9);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        margin-bottom: 12px;
                        letter-spacing: -0.5px;
                    ">Em Breve</h2>
                    
                    <p style="
                        color: var(--text-muted);
                        font-size: 1.05rem;
                        line-height: 1.6;
                        margin-bottom: 24px;
                        max-width: 380px;
                        margin-left: auto;
                        margin-right: auto;
                    ">
                        O painel do departamento <strong style="color: var(--text-primary)">${dept}</strong> 
                        está sendo desenvolvido e estará disponível em breve.
                    </p>
                    
                    <div style="
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        padding: 10px 24px;
                        border-radius: 50px;
                        background: rgba(108, 92, 231, 0.1);
                        border: 1px solid rgba(108, 92, 231, 0.2);
                        color: #6c5ce7;
                        font-weight: 600;
                        font-size: 0.85rem;
                        letter-spacing: 0.5px;
                    ">
                        <span style="
                            width: 8px;
                            height: 8px;
                            border-radius: 50%;
                            background: #6c5ce7;
                            animation: comingSoonBlink 1.5s ease-in-out infinite;
                        "></span>
                        EM DESENVOLVIMENTO
                    </div>
                </div>
            </div>
        `;
    }

    // Inject animations if not already present
    if (!document.getElementById('comingSoonStyles')) {
        const style = document.createElement('style');
        style.id = 'comingSoonStyles';
        style.textContent = `
            @keyframes comingSoonPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.01); }
            }
            @keyframes comingSoonFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            @keyframes comingSoonGlow {
                0%, 100% { transform: translate(0, 0) rotate(0deg); }
                50% { transform: translate(5%, 5%) rotate(180deg); }
            }
            @keyframes comingSoonBlink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
            }
        `;
        document.head.appendChild(style);
    }

    document.getElementById('sidebar').classList.remove('open');
}

// MINHA AGENDA (Personal Calendar)
function renderAgenda() {
    const yr = agendaDate.getFullYear(), mo = agendaDate.getMonth();
    document.getElementById('agendaTitle').textContent = `${MONTHS[mo]} ${yr}`;
    document.getElementById('agendaAvatar').innerHTML = window.renderAvatar(currentUser, 'agenda-avatar');
    document.getElementById('agendaUserName').textContent = `Agenda de ${currentUser.nome.split(' ')[0]}`;
    document.getElementById('agendaUserDept').textContent = `${currentUser.dept} • ${isGlobalCoordinator() ? 'Todas as demandas' : (currentUser.role === 'gestor_equipe' ? 'Demandas do departamento' : 'Minhas demandas do mês')}`;

    const activeDemandas = getMonthDemandas(true).filter(d => !d.deletedAt);
    const tasks = getUserVisibleTasks(activeDemandas);

    const monthTasks = tasks.filter(t => { const parts = (t.dataConclusao || '').split('-'); return parseInt(parts[0]) === yr && parseInt(parts[1]) - 1 === mo; });

    document.getElementById('agendaTotal').textContent = monthTasks.length;
    document.getElementById('agendaPending').textContent = monthTasks.filter(t => t.status === 'Fazendo').length;
    document.getElementById('agendaDone').textContent = monthTasks.filter(t => t.status === 'Aprovado').length;

    const firstDay = new Date(yr, mo, 1), lastDay = new Date(yr, mo + 1, 0);
    const startDay = firstDay.getDay(), totalDays = lastDay.getDate();
    const today = new Date(), isCurrentMonth = today.getFullYear() === yr && today.getMonth() === mo;

    let html = '';
    const prevMonthDays = new Date(yr, mo, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) html += `<div class="calendar-day other-month"><span class="calendar-day-num">${prevMonthDays - i}</span></div>`;

    for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = isCurrentMonth && day === today.getDate();
        const dayTasks = tasks.filter(t => t.dataConclusao === dateStr);
        dayTasks.sort((a, b) => getPriorityWeight(b.prioridade) - getPriorityWeight(a.prioridade));
        html += `<div class="calendar-day ${isToday ? 'today' : ''}"><span class="calendar-day-num">${day}</span>
            ${dayTasks.slice(0, 3).map(t => `<div class="calendar-event ${t.prioridade.toLowerCase()}" onclick="openDetail('${t.id}')">${t.nome}</div>`).join('')}
            ${dayTasks.length > 3 ? `<div class="calendar-event" style="background:var(--bg-hover);color:var(--text-muted);">+${dayTasks.length - 3} mais</div>` : ''}
        </div>`;
    }

    const remaining = 42 - (startDay + totalDays);
    for (let d = 1; d <= remaining; d++) html += `<div class="calendar-day other-month"><span class="calendar-day-num">${d}</span></div>`;
    document.getElementById('agendaDays').innerHTML = html;
}

// MINHA ÁREA - Personal Dashboard
function updateMinhaArea() {
    const activeDemandas = getMonthDemandas().filter(d => !d.deletedAt);
    let tasks = getUserVisibleTasks(activeDemandas);
    document.getElementById('mTotal').textContent = tasks.length;

    const fazendoTasks = tasks.filter(d => d.status === 'Fazendo');
    console.log('DEBUG v2.3: Tasks com status Fazendo:', fazendoTasks.length, fazendoTasks);
    document.getElementById('mPending').textContent = fazendoTasks.length;

    document.getElementById('mReview').textContent = tasks.filter(d => d.status === 'Para aprovação').length;
    document.getElementById('mDone').textContent = tasks.filter(d => d.status === 'Aprovado').length;
    renderDashboardCharts(tasks);
    renderActivity(tasks.slice(0, 5));
    renderMeuProgresso(tasks);
    updateBadges();
}

function showMetricDemandas(statusFilter) {
    const activeDemandas = getMonthDemandas().filter(d => !d.deletedAt);
    let tasks = getUserVisibleTasks(activeDemandas);

    // Filtrar por status
    const labels = {
        'all': '📋 Todas as Demandas',
        'Fazendo': '⏳ Demandas Em Andamento',
        'Para aprovação': '👁️ Demandas Para Revisar',
        'Aprovado': '✅ Demandas Concluídas'
    };

    if (statusFilter !== 'all') {
        tasks = tasks.filter(d => d.status === statusFilter);
    }
    sortTasksByDateAndPriority(tasks);

    // Highlight card ativo
    document.querySelectorAll('.metric-card').forEach(c => c.classList.remove('metric-active'));
    event?.target?.closest('.metric-card')?.classList.add('metric-active');

    const panel = document.getElementById('metricDemandasPanel');
    const title = document.getElementById('metricDemandasTitle');
    const list = document.getElementById('metricDemandasList');

    title.textContent = labels[statusFilter] || 'Demandas';

    if (tasks.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted); font-style:italic;">Nenhuma demanda encontrada</div>';
    } else {
        list.innerHTML = `<div style="display:flex; flex-direction:column; gap:8px;">
            ${tasks.map(t => {
                const statusCls = getStatusClass(t.status);
                const deadline = parseDateLocal(t.dataConclusao);
                const today = new Date();
                const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                let dateClass = '';
                if (daysUntil < 0) dateClass = 'color:#ef4444; font-weight:600;';
                else if (daysUntil <= 3) dateClass = 'color:#f59e0b; font-weight:600;';

                const currentStage = t.pipeline[t.currentStage];
                const respName = currentStage ? (currentStage.userId ? USERS[currentStage.userId]?.nome : (currentStage.userIds ? currentStage.userIds.map(uid => USERS[uid]?.nome).filter(Boolean).join(', ') : '-')) : '-';

                return `<div onclick="openDetail('${t.id}')" style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:var(--surface-light); border-radius:10px; border:1px solid var(--border-subtle); cursor:pointer; transition:all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'" onmouseleave="this.style.transform='none'; this.style.boxShadow='none'">
                    <div style="flex:1; min-width:0;">
                        <div style="font-weight:600; font-size:0.95em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.nome}</div>
                        <div style="font-size:0.8em; color:var(--text-muted); margin-top:2px;">
                            ${t.tipoProjeto} • ${respName} • <span style="${dateClass}">📅 ${formatDate(t.dataConclusao)}</span>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px; flex-shrink:0; margin-left:12px;">
                        <span class="priority-badge ${t.prioridade.toLowerCase()}" style="font-size:0.75em;">${t.prioridade}</span>
                        <span class="status-tag ${statusCls}" style="font-size:0.75em;">${t.status}</span>
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    }

    panel.style.display = 'block';
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function createCardHTML(t) {
    const deadline = parseDateLocal(t.dataConclusao);
    const today = new Date();
    const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    let dateClass = '';
    if (daysUntil < 0) dateClass = 'overdue';
    else if (daysUntil <= 3) dateClass = 'soon';

    const currentStage = (t.pipeline && t.pipeline[t.currentStage]) ? t.pipeline[t.currentStage] : { dept: '-', userId: null };
    const responsavel = currentStage.userId ? USERS[currentStage.userId] : null;

    const totalAttachments = (t.attachments?.length || 0) + (t.entregasUrl?.length || (t.entregaUrl ? 1 : 0));
    const attachmentBadge = totalAttachments > 0 ? `<span class="card-attachment-badge" title="Possui ${totalAttachments} anexo(s)">📎 ${totalAttachments}</span>` : '';

    return `
        <div class="execution-card ${(t.prioridade || '').toLowerCase()}" onclick="openDetail('${t.id}')">
            <div class="execution-card-header">
                <span class="execution-id">#${t.id}</span>
                <span class="execution-date ${dateClass}">📅 ${formatDate(t.dataConclusao)}</span>
            </div>
            <div class="execution-card-body">
                <h4 class="execution-title">${t.nome || 'Sem nome'} ${attachmentBadge}</h4>
                <div class="execution-meta">
                    <span class="meta-display">📁 ${t.tipoProjeto || '-'}</span>
                    <span class="meta-display">🏢 ${currentStage.dept || '-'}</span>
                </div>
            </div>
            <div class="execution-card-footer">
                <span class="execution-prio-badge ${(t.prioridade || '').toLowerCase()}">${t.prioridade || '-'}</span>
                <span class="status-badge ${getStatusClass(t.status)}" style="font-size:11px; font-weight:700; padding:4px 8px; border-radius:6px; margin-left: auto;">${t.status || '-'}</span>
                <div class="execution-avatars">
                    ${responsavel ? `${window.renderAvatar(responsavel, 'avatar')}` : (currentStage.userIds ? currentStage.userIds.map(uid => USERS[uid]).filter(Boolean).map(u => window.renderAvatar(u, 'avatar')).join('') : '')}
                </div>
            </div>
        </div>`;
}

function renderEquipeView() {
    const grid = document.getElementById('equipeGrid');
    const deptElem = document.getElementById('gestorDeptName');
    if (!grid || !deptElem) return;

    // Se for coordenador global, vê todas as demandas da empresa. Se não, vê apenas dos seus departamentos.
    let rawDepts = typeof getUserDepts === 'function' ? getUserDepts(currentUser) : (Array.isArray(currentUser.dept) ? currentUser.dept : [currentUser.dept]);
    if (isGlobalCoordinator()) {
        rawDepts = Object.keys(DEPT_COLORS); // Tem acesso a todos os departamentos
    }
    
    deptElem.textContent = isGlobalCoordinator() ? 'Visão Global (Todos)' : rawDepts.join(', ');

    // DEBUG: Log para diagnosticar filtro da equipe
    const allDemandas = typeof getMonthDemandas === 'function' ? getMonthDemandas() : [];
    console.log('=== DEBUG EQUIPE ===');
    console.log('currentUser:', JSON.stringify(currentUser));
    console.log('rawDepts:', rawDepts);
    console.log('USERS keys:', Object.keys(USERS || {}));
    console.log('Total demandas no mês:', allDemandas.length);
    console.log('Total demandas global:', demandas.length);
    if (allDemandas.length > 0) {
        console.log('Exemplo demanda[0]:', JSON.stringify(allDemandas[0]?.pipeline));
        console.log('Todas pipelines:', allDemandas.map(d => ({ id: d.id, pipeline: d.pipeline?.map(s => ({ dept: s.dept, userId: s.userId })), deletedAt: d.deletedAt })));
    }
    console.log('=== FIM DEBUG ===');

    // Extrair busca e filtro de status
    const searchTerm = (document.getElementById('filterEquipeSearch')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('filterEquipeStatus')?.value || '';

    // Filtrar demandas cujo executor pertença ao departamento do gestor
    // Verifica: pipeline[].dept OU se o userId do pipeline pertence ao dept do gestor
    let equipeTasks = allDemandas.filter(t => {
        if (t.deletedAt) return false;
        if (!t.pipeline) return false;
        return t.pipeline.some(stage => {
            // Match por dept da etapa do pipeline
            if (rawDepts.includes(stage.dept)) return true;
            // Match por dept do executor atribuído à etapa
            const stageUser = USERS && USERS[stage.userId];
            if (stageUser) {
                const userDepts = typeof getUserDepts === 'function' ? getUserDepts(stageUser) : [stageUser.dept];
                return userDepts.some(ud => rawDepts.includes(ud));
            }
            return false;
        });
    });

    if (searchTerm) {
        equipeTasks = equipeTasks.filter(t => 
            t.nome.toLowerCase().includes(searchTerm) || 
            (t.id && t.id.toLowerCase().includes(searchTerm))
        );
    }
    if (statusFilter) {
        equipeTasks = equipeTasks.filter(t => t.status === statusFilter);
    }
    sortTasksByDateAndPriority(equipeTasks);

    if (equipeTasks.length === 0) {
        grid.innerHTML = '<div class="empty-state">Nenhuma demanda da equipe encontrada com estes filtros.</div>';
        return;
    }

    // Group tasks by assignee of the current stage
    const grouped = {};
    equipeTasks.forEach(t => {
        const stage = t.pipeline ? t.pipeline[t.currentStage] : null;
        const userId = (stage && stage.userId) ? stage.userId : 'unassigned';
        if (!grouped[userId]) grouped[userId] = [];
        grouped[userId].push(t);
    });

    // Render group sections
    let html = '';

    // Render defined users first
    Object.keys(grouped).forEach(userId => {
        if (userId === 'unassigned') return;
        const user = USERS[userId];
        if (!user) return;
        const tasks = grouped[userId];

        html += `
            <div class="equipe-user-section" style="margin-bottom: 32px;">
                <div class="equipe-user-header" style="display:flex; align-items:center; gap:12px; margin-top:28px; margin-bottom:16px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.08);">
                    ${window.renderAvatar(user, 'user-avatar-sm', 'width:32px; height:32px; border-radius:50%; font-size:12px; font-weight:700; background:var(--primary); display:flex; align-items:center; justify-content:center; color:white;')}
                    <h3 style="margin:0; font-size:1.2em; font-weight:700; color:var(--text-color);">${user.nome} <span style="font-size:0.75em; color:var(--text-muted); font-weight:500;">(${user.dept || ''})</span></h3>
                    <span style="background:rgba(99, 102, 241, 0.15); color:var(--primary, #6366f1); padding:2px 10px; border-radius:12px; font-size:12px; font-weight:700; border:1px solid rgba(99, 102, 241, 0.3);">${tasks.length}</span>
                </div>
                <div class="execution-grid">
                    ${tasks.map(t => createCardHTML(t)).join('')}
                </div>
            </div>
        `;
    });

    // Render unassigned tasks at the end
    if (grouped['unassigned'] && grouped['unassigned'].length > 0) {
        const tasks = grouped['unassigned'];
        html += `
            <div class="equipe-user-section" style="margin-bottom: 32px;">
                <div class="equipe-user-header" style="display:flex; align-items:center; gap:12px; margin-top:28px; margin-bottom:16px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.08);">
                    <div style="width:32px; height:32px; border-radius:50%; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; font-size:16px;">❓</div>
                    <h3 style="margin:0; font-size:1.2em; font-weight:700; color:var(--text-color);">Sem Responsável Atribuído</h3>
                    <span style="background:rgba(255, 255, 255, 0.1); color:var(--text-muted); padding:2px 10px; border-radius:12px; font-size:12px; font-weight:700; border:1px solid rgba(255, 255, 255, 0.15);">${tasks.length}</span>
                </div>
                <div class="execution-grid">
                    ${tasks.map(t => createCardHTML(t)).join('')}
                </div>
            </div>
        `;
    }

    grid.innerHTML = html;
}

// === MANAGER AUTH LOGIC ===
function openManagerAuth() {
    const el = document.getElementById('managerAuth');
    if (el) {
        el.style.display = 'flex';
        el.classList.add('active');
        const input = document.getElementById('managerPassInput');
        if (input) {
            input.value = '';
            input.focus();
        }
    }
}

function closeManagerAuth() {
    const el = document.getElementById('managerAuth');
    if (el) {
        el.classList.remove('active');
        setTimeout(() => { el.style.display = 'none'; }, 300);
    }
}

function checkManagerAuth() {
    const pass = document.getElementById('managerPassInput').value;
    if (pass === 'GYN1976#') {
        managerAuthenticated = true;
        localStorage.setItem('radar_manager_auth', 'true');
        closeManagerAuth();
        setupRoleUI(); // Refresh sidebar to show Equipe tab
        navigateTo('equipe');
        toast('Acesso concedido!', 'success');
    } else {
        toast('Senha incorreta!', 'error');
        document.getElementById('managerPassInput').value = '';
        document.getElementById('managerPassInput').focus();
    }
}

// Event Listeners for Equipe View
document.addEventListener('DOMContentLoaded', () => {
    const srch = document.getElementById('filterEquipeSearch');
    const stat = document.getElementById('filterEquipeStatus');
    if (srch) srch.addEventListener('input', renderEquipeView);
    if (stat) stat.addEventListener('change', renderEquipeView);
});

function renderDashboardCharts(tasks) {


    // Status Chart
    const statuses = [{ name: 'A fazer', cls: 'waiting' }, { name: 'Fazendo', cls: 'exec' }, { name: 'Para aprovação', cls: 'review' }, { name: 'Aprovado', cls: 'done' }];
    const maxS = Math.max(...statuses.map(s => tasks.filter(d => d.status === s.name).length), 1);
    document.getElementById('dashChartStatus').innerHTML = `<div class="chart-bar-container">${statuses.map(s => {
        const c = tasks.filter(d => d.status === s.name).length, p = (c / maxS) * 100;
        return `<div class="chart-bar-item"><span class="chart-bar-label">${s.name}</span><div class="chart-bar-track"><div class="chart-bar-fill ${s.cls}" style="width:${p}%">${c}</div></div></div>`;
    }).join('')}</div>`;

    // Priority Chart - Updated to match form values AND legacy values
    const priorities = [
        { name: 'Crítico', cls: 'urgente', aliases: ['Crítico', 'Urgente', 'Critico'] },
        { name: 'Alta', cls: 'alta', aliases: ['Alta'] },
        { name: 'Média', cls: 'normal', aliases: ['Média', 'Normal', 'Media'] },
        { name: 'Baixa', cls: 'baixa', aliases: ['Baixa'] }
    ];
    const maxP = Math.max(...priorities.map(p => tasks.filter(d => p.aliases.includes(d.prioridade)).length), 1);
    document.getElementById('dashChartPriority').innerHTML = `<div class="chart-bar-container">${priorities.map(p => {
        const c = tasks.filter(d => p.aliases.includes(d.prioridade)).length;
        const pct = (c / maxP) * 100;
        return `<div class="chart-bar-item"><span class="chart-bar-label">${p.name}</span><div class="chart-bar-track"><div class="chart-bar-fill ${p.cls}" style="width:${pct}%">${c}</div></div></div>`;
    }).join('')}</div>`;

    // Type Chart - Updated to match form values AND legacy values
    const types = [
        { name: 'Design Gráfico', cls: 'design', aliases: ['Design Gráfico', 'Design', 'Design + Vídeo'] },
        { name: 'Videomaker', cls: 'video', aliases: ['Videomaker', 'Vídeo', 'Video'] },
        { name: 'Social Media', cls: 'social', aliases: ['Social Media', 'Social'] },
        { name: 'TI', cls: 'ti', aliases: ['TI'] },
        { name: 'Transmissão', cls: 'transmissao', aliases: ['Transmissão'] }
    ];
    const maxT = Math.max(...types.map(t => tasks.filter(d => t.aliases.includes(d.tipoProjeto)).length), 1);

    document.getElementById('dashChartType').innerHTML = `<div class="chart-bar-container">${types.map(t => {
        const c = tasks.filter(d => t.aliases.includes(d.tipoProjeto)).length;
        const pct = (c / maxT) * 100;
        return `<div class="chart-bar-item"><span class="chart-bar-label">${t.name}</span><div class="chart-bar-track"><div class="chart-bar-fill ${t.cls}" style="width:${pct}%">${c}</div></div></div>`;
    }).join('')}</div>`;
}

function renderActivity(tasks) {
    const c = document.getElementById('recentActivity');
    if (!tasks.length) { c.innerHTML = '<div class="empty-message">Nenhuma atividade recente</div>'; return; }
    c.innerHTML = tasks.map(t => {
        const pipelineCount = t.pipeline ? t.pipeline.length : 0;
        const prio = (t.prioridade || 'Média').toLowerCase();
        return `<div class="activity-item" onclick="openDetail('${t.id}')">
            <div class="activity-prio ${prio}"></div>
            <div class="activity-info">
                <div class="activity-title">${t.nome}</div>
                <div class="activity-meta">${t.tipoProjeto} • Etapa ${t.currentStage + 1}/${pipelineCount}</div>
            </div>
            <span class="status-tag ${getStatusClass(t.status)}">${t.status}</span>
        </div>`;
    }).join('');
}

function renderMeuProgresso(tasks) {
    const container = document.getElementById('meuProgresso');
    const concluidas = tasks.filter(t => t.status === 'Aprovado').length;
    const total = tasks.length;
    let taxaConclusao = 0;
    if (total > 0) {
        taxaConclusao = Math.round((concluidas / total) * 100);
    }

    const thisMonth = new Date();
    const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);

    // Check if task was completed this month (using its status change timestamp instead of creation date)
    const concluidasMes = tasks.filter(t => {
        if (t.status !== 'Aprovado') return false;
        const compareDate = t.lastStatusChange ? new Date(t.lastStatusChange) : new Date(t.dataConclusao || t.dataCriacao);
        return compareDate >= monthStart;
    }).length;

    const emAndamento = tasks.filter(t => t.status === 'Fazendo').length;

    container.innerHTML = `
        <div class="progress-stats">
            <div class="progress-stat-item">
                <span class="progress-stat-value">${taxaConclusao}%</span>
                <span class="progress-stat-label">Taxa de Conclusão</span>
                <div class="progress-bar"><div class="progress-fill" style="width:${taxaConclusao}%"></div></div>
            </div>
            <div class="progress-stat-item">
                <span class="progress-stat-value">${concluidasMes}</span>
                <span class="progress-stat-label">Concluídas este mês</span>
            </div>
            <div class="progress-stat-item">
                <span class="progress-stat-value">${emAndamento}</span>
                <span class="progress-stat-label">Em andamento</span>
            </div>
            <div class="progress-stat-item">
                <span class="progress-stat-value">${total}</span>
                <span class="progress-stat-label">Total de demandas</span>
            </div>
        </div>
    `;
}

function updateBadges() {
    const visibleTasks = getUserVisibleTasks(getMonthDemandas().filter(d => !d.deletedAt));
    document.getElementById('badgeRequests').textContent = visibleTasks.filter(d => d.status !== 'Aprovado').length;
    document.getElementById('badgeReview').textContent = visibleTasks.filter(d => d.status === 'Para aprovação').length;

    // For ordinary executors, we also show badgeTasks
    if (currentUser.role === 'executor') {
        const executorTasks = visibleTasks.filter(d => 
            (d.pipeline[d.currentStage]?.userId === currentUser.id || 
             (!d.pipeline[d.currentStage]?.userId && d.pipeline[d.currentStage]?.userIds && d.pipeline[d.currentStage].userIds.includes(currentUser.id))) 
            && d.status !== 'Aprovado'
        );
        const badgeTasks = document.getElementById('badgeTasks');
        if (badgeTasks) badgeTasks.textContent = executorTasks.length;
    }
}

function getSocialMediaUsers() {
    return Object.values(USERS).filter(u => u.dept === 'Social Media' || u.role === 'social_media');
}

function setupOriginFilters() {
    const isSMOrCoord = isGlobalCoordinator() || currentUser.role === 'gestor_equipe';
    
    const filterSelectKanban = document.getElementById('filterOrigin');
    const filterSelectReq = document.getElementById('filterOriginReq');
    const reqToolbar = document.getElementById('requestsToolbar');

    if (!isSMOrCoord) {
        if (filterSelectKanban) filterSelectKanban.style.display = 'none';
        if (reqToolbar) reqToolbar.style.display = 'none';
        return;
    }

    // Determine which users to show in the filter:
    // Show all users who are coordinators, social_media, gestor_equipe, or Gestão, excluding currentUser
    const filterUsers = Object.values(USERS).filter(u => {
        if (u.id === currentUser.id) return false;
        const uDepts = typeof getUserDepts === 'function' ? getUserDepts(u) : [u.dept];
        const isGestao = uDepts.includes('Gestão');
        return isGestao || u.role === 'coordinator' || u.role === 'social_media' || u.role === 'gestor_equipe';
    });

    let optionsHtml = `<option value="minhas">👤 Minhas Demandas</option>`;
    filterUsers.forEach(u => {
        optionsHtml += `<option value="user-${u.id}">👥 Demandas de ${u.nome}</option>`;
    });
    optionsHtml += `<option value="todas-sm">📱 Todas de Social Media</option>`;
    optionsHtml += `<option value="todas">🌐 Todas do Sistema</option>`;

    if (filterSelectKanban) {
        // Only set innerHTML if options changed or elements don't match
        if (filterSelectKanban.options.length !== (3 + filterUsers.length)) {
            filterSelectKanban.innerHTML = optionsHtml;
        }
        filterSelectKanban.value = window.currentOriginFilter || 'minhas';
        filterSelectKanban.style.display = 'block';
    }

    if (filterSelectReq) {
        if (filterSelectReq.options.length !== (3 + filterUsers.length)) {
            filterSelectReq.innerHTML = optionsHtml;
        }
        filterSelectReq.value = window.currentOriginFilter || 'minhas';
    }
    if (reqToolbar) {
        reqToolbar.style.display = 'flex';
    }
}

// KANBAN BOARD with Drag & Drop
function renderKanban() {
    setupOriginFilters();

    if (currentDept === 'Inovação/TI') {
        if(typeof renderTIKanban === 'function') {
            renderTIKanban();
            return;
        }
    }

    const filterPrio = document.getElementById('filterKanbanPrio')?.value || 'all';
    const filterDept = document.getElementById('filterKanbanDept')?.value || 'all';
    const search = document.getElementById('kanbanSearch')?.value.toLowerCase() || '';

    const board = document.getElementById('kanbanBoard');
    if (!board) return;

    // Default status columns
    const columns = [
        { id: 'A fazer', title: 'A fazer', color: 'var(--solicitado)' },
        { id: 'Fazendo', title: 'Fazendo', color: 'var(--em-andamento)' },
        { id: 'Para aprovação', title: 'Para aprovação', color: 'var(--para-aprovacao)' },
        { id: 'Alteração', title: 'Alteração', color: 'var(--alteracao)' },
        { id: 'Aprovado', title: 'Aprovado', color: 'var(--concluida)' }
    ];

    let baseDemandas = getMonthDemandas().filter(d => !d.deletedAt);
    let tasks = getUserVisibleTasks(baseDemandas);

    // Apply Origin Filter for Social Media and Coordinator
    const isSMOrCoord = isGlobalCoordinator() || currentUser.role === 'gestor_equipe';
    if (isSMOrCoord && window.currentOriginFilter) {
        const smUsers = getSocialMediaUsers();
        const smUserIds = smUsers.map(u => u.id);
        
        if (window.currentOriginFilter === 'minhas') {
            tasks = tasks.filter(t => t.solicitanteId === currentUser.id || (t.pipeline && t.pipeline.some(s => s.userId === currentUser.id || (!s.userId && s.userIds && s.userIds.includes(currentUser.id)))));
        } else if (window.currentOriginFilter.startsWith('user-')) {
            const targetId = window.currentOriginFilter.replace('user-', '');
            tasks = tasks.filter(t => t.solicitanteId === targetId);
        } else if (window.currentOriginFilter === 'todas-sm') {
            tasks = tasks.filter(t => smUserIds.includes(t.solicitanteId));
        }
    }
    if (currentUser.role === 'executor') {
        tasks = tasks.filter(d => d.pipeline && d.pipeline.some(s => s.userId === currentUser.id || (!s.userId && s.userIds && s.userIds.includes(currentUser.id))));
    }

    // Apply filters
    if (filterPrio !== 'all') tasks = tasks.filter(t => t.prioridade === filterPrio);
    if (filterDept !== 'all') tasks = tasks.filter(t => t.pipeline && t.pipeline.some(s => s.dept === filterDept));
    if (search) tasks = tasks.filter(t => t.nome.toLowerCase().includes(search));

    sortTasksByDateAndPriority(tasks);

    const statuses = ['A fazer', 'Fazendo', 'Para aprovação', 'Alteração', 'Aprovado'];
    const containerIds = { 'A fazer': 'cardsAFazer', 'Fazendo': 'cardsFazendo', 'Para aprovação': 'cardsAprovacao', 'Alteração': 'cardsAlteracao', 'Aprovado': 'cardsAprovado' };
    const countIds = { 'A fazer': 'countAFazer', 'Fazendo': 'countFazendo', 'Para aprovação': 'countAprovacao', 'Alteração': 'countAlteracao', 'Aprovado': 'countAprovado' };

    statuses.forEach(status => {
        const statusTasks = tasks.filter(t => t.status === status);
        const container = document.getElementById(containerIds[status]);
        const countEl = document.getElementById(countIds[status]);

        countEl.textContent = statusTasks.length;

        if (!statusTasks.length) {
            container.innerHTML = '<div class="kanban-empty">Nenhuma demanda</div>';
            return;
        }

        container.innerHTML = statusTasks.map(t => {
            const currentStage = t.pipeline[t.currentStage];
            const avatars = t.pipeline.map(s => USERS[s.userId]).filter(Boolean);
            const deadline = parseDateLocal(t.dataConclusao);
            const today = new Date();
            const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
            let dateClass = '';
            if (daysUntil < 0) dateClass = 'overdue';
            else if (daysUntil <= 3) dateClass = 'soon';
            const commentCount = t.comments?.length || 0;
            const attachCount = t.attachments?.length || 0;
            const staleDays = t.stale ? Math.floor((new Date() - new Date(t.lastStatusChange || t.dataCriacao)) / (1000 * 60 * 60 * 24)) : 0;

            // Timer Logic
            const timerState = currentStage.timerState || { running: false, accumulated: 0, lastStart: null };
            let currentSession = 0;
            if (timerState.running && timerState.lastStart) {
                const start = new Date(timerState.lastStart);
                if (!isNaN(start.getTime())) {
                    currentSession = new Date() - start;
                }
            }
            // Sanitize accumulated
            const safeAccumulated = (timerState.accumulated && !isNaN(timerState.accumulated)) ? parseInt(timerState.accumulated) : 0;
            const totalMs = safeAccumulated + currentSession;
            const formattedTime = formatTimer(totalMs);
            const isOwner = currentUser.id === currentStage.userId;

            const sp = getSubtaskProgress(t);
            let progressHtml = '';
            if (sp && sp.total > 0) {
                progressHtml = `<div class="kanban-card-progress" style="margin-top:8px; margin-bottom:4px; font-size:0.75rem; color:var(--text-muted); display:flex; align-items:center; gap:6px;">
                    <div style="flex:1; height:4px; background:rgba(0,0,0,0.1); border-radius:2px; overflow:hidden;">
                        <div style="height:100%; width:${sp.percent}%; background:var(--brand-primary); border-radius:2px; transition:width 0.3s ease;"></div>
                    </div>
                    <span style="font-weight:600;">${sp.percent}%</span>
                </div>`;
            }

            // Bloqueio Físico UI: Executores não arrastam 'Para aprovação' nem 'Aprovado'
            let isLocked = false;
            if (currentUser.role === 'executor' && (t.status === 'Para aprovação' || t.status === 'Aprovado')) {
                isLocked = true;
            }
            const dragAttr = isLocked ? 'false' : 'true';
            const lockedClass = isLocked ? 'locked-card' : '';

            const totalAttachments = (t.attachments?.length || 0) + (t.entregasUrl?.length || (t.entregaUrl ? 1 : 0));
            const attachmentBadge = totalAttachments > 0 ? `<span class="card-attachment-badge" title="Possui ${totalAttachments} anexo(s)">📎 ${totalAttachments}</span>` : '';

            return `
                <div class="kanban-card ${t.prioridade.toLowerCase()} ${lockedClass}" draggable="${dragAttr}" data-id="${t.id}" onclick="openDetail('${t.id}')">
                    <div class="kanban-card-header">
                         <span class="kanban-card-title">${t.nome} ${attachmentBadge}</span>
                         ${t.stale ? `<span class="stale-badge" title="Parada há ${staleDays} dias">⚠️ ${staleDays}d</span>` : ''}
                         ${isLocked ? '<span class="lock-icon" title="Bloqueado para edição" style="font-size: 12px; margin-left: auto;">🔒</span>' : ''}
                    </div>
                    <div class="kanban-card-meta">
                        <span class="kanban-card-type">${t.tipoProjeto}</span>
                        <span class="kanban-card-dept">${currentStage?.dept || '-'}</span>
                    </div>
                    
                    ${progressHtml}

                    ${isOwner ? `
                    <div class="timer-controls" onclick="event.stopPropagation()">
                            <button class="btn-timer" onclick="toggleTimer('${t.id}')" title="${timerState.running ? 'Pausar' : 'Iniciar'}">
                                ${timerState.running ? '⏸️' : '▶️'}
                            </button>
                            <span class="timer-display ${timerState.running ? 'running' : ''}" id="timer-${t.id}" data-start="${timerState.lastStart || ''}" data-accumulated="${timerState.accumulated || 0}">
                                ${timerState.running ? '<span class="timer-badge-active"></span>' : ''}${formattedTime}
                            </span>
                        </div>` : `
                        <div class="timer-controls" style="background:none; padding-left:0;">
                            <span class="timer-display ${timerState.running ? 'running' : ''}" id="timer-${t.id}" data-start="${timerState.lastStart || ''}" data-accumulated="${timerState.accumulated || 0}" style="font-size:0.8rem; ${timerState.running ? '' : 'color:var(--text-dim)'}">
                                ${timerState.running ? '<span class="timer-badge-active"></span>' : '⏱️ '}${formattedTime}
                            </span>
                    </div>`}

                    <div class="kanban-card-footer">
                        <span class="kanban-card-date ${dateClass}">📅 ${formatDate(t.dataConclusao)}</span>
                        <div class="kanban-card-avatars">
                            ${avatars.slice(0, 3).map(u => `${window.renderAvatar(u, 'kanban-card-avatar')}`).join('')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    });

    // Initialize drag and drop
    initKanbanDragDrop();
}

// Drag & Drop for Kanban
function initKanbanDragDrop() {
    const cards = document.querySelectorAll('.kanban-card[draggable="true"]');
    const columns = document.querySelectorAll('.kanban-cards');

    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            card.classList.add('dragging');
            e.dataTransfer.setData('text/plain', card.dataset.id);
        });
        card.addEventListener('dragend', () => card.classList.remove('dragging'));
    });

    columns.forEach(col => {
        col.addEventListener('dragover', (e) => {
            const colStatus = col.dataset.status;
            // Bloquear executores de dropar em Alteração/Aprovado
            if (currentUser.role === 'executor' && (colStatus === 'Alteração' || colStatus === 'Aprovado')) {
                return; // NÃO chama preventDefault = navegador impede o drop
            }
            e.preventDefault();
            col.classList.add('drag-over');
        });
        col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
        col.addEventListener('drop', (e) => {
            e.preventDefault();
            col.classList.remove('drag-over');
            const taskId = e.dataTransfer.getData('text/plain');
            const newStatus = col.dataset.status;
            if (taskId && newStatus) {
                changeTaskStatus(taskId, newStatus);
            }
        });
    });
}

function changeTaskStatus(taskId, newStatus, skipUpload = false) {
    const task = demandas.find(d => d.id === taskId);
    if (!task) return;

    // Interceptar envio para aprovação para solicitar a arte/vídeo
    if (newStatus === 'Alteração' && !skipUpload && task.status !== 'Alteração') {
        openReviewModal(taskId);
        return;
    }

    // Interceptar envio para aprovação para solicitar a arte/vídeo
    if (newStatus === 'Para aprovação' && !skipUpload && task.status !== 'Para aprovação') {
        const checkDesign = task.tipoProjeto === 'Design Gráfico' || (Array.isArray(task.tipoProjeto) && task.tipoProjeto.includes('Design Gráfico'));
        const checkVideo = task.tipoProjeto === 'Videomaker' || (Array.isArray(task.tipoProjeto) && task.tipoProjeto.includes('Videomaker'));

        if (checkDesign || checkVideo) {
            window.currentEntregaTaskId = taskId;
            window.currentEntregaTipo = checkDesign ? 'arte' : 'video';

            document.getElementById('entregaArteSection').style.display = checkDesign ? 'flex' : 'none';
            document.getElementById('entregaVideoSection').style.display = checkVideo ? 'flex' : 'none';

            // reset file
            window.currentEntregaFile = null;
            document.getElementById('entregaFileName').textContent = 'Clique ou arraste a imagem aqui';
            document.getElementById('entregaLinkInput').value = '';

            openModal('modalEntrega');
            return;
        }
    }

    // Regras de Movimentação para Executores
    if (currentUser.role === 'executor') {
        const restrictedStatuses = ['Alteração', 'Aprovado'];
        if (restrictedStatuses.includes(newStatus)) {
            toast('Apenas o Social Media ou Coordenador pode mover para "' + newStatus + '"', 'error');
            renderKanban();
            return;
        }
        // Bloquear volta para "A fazer"
        if (task.status === 'Fazendo' && newStatus === 'A fazer') {
            toast('Não é permitido retornar para "A fazer" após iniciar a demanda.', 'error');
            renderKanban();
            return;
        }
        // Bloquear movimentação a partir de "Para aprovação"
        if (task.status === 'Para aprovação' && newStatus !== 'Para aprovação') {
            toast('A demanda está bloqueada em "Para aprovação". Apenas gestores podem alterar.', 'error');
            renderKanban();
            return;
        }
    } else {
        // Bloqueio global: Ninguém volta para 'A fazer' se já estava em 'Fazendo'
        if (task.status === 'Fazendo' && newStatus === 'A fazer') {
            toast('Não é permitido retornar para "A fazer" após a demanda ter sido iniciada.', 'error');
            renderKanban();
            return;
        }
    }

    // 1. STOP TIMER (se estiver rodando no stage atual)
    const currentStage = task.pipeline ? task.pipeline[task.currentStage] : null;

    if (currentStage && currentStage.timerState && currentStage.timerState.running) {
        const now = new Date();
        const start = new Date(currentStage.timerState.lastStart);

        // Calcular sessão atual com validação total
        let sessionMs = 0;
        if (currentStage.timerState.lastStart && !isNaN(start.getTime())) {
            sessionMs = Math.max(0, now - start);
        }

        // Sanitizar accumulated (nunca NaN)
        const prevAccumulated = (typeof currentStage.timerState.accumulated === 'number' && !isNaN(currentStage.timerState.accumulated))
            ? currentStage.timerState.accumulated : 0;

        currentStage.timerState.accumulated = prevAccumulated + sessionMs;
        currentStage.timerState.running = false;
        currentStage.timerState.lastStart = null;

        // Update display string
        const ms = currentStage.timerState.accumulated;
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const mins = Math.floor((ms / (1000 * 60)) % 60);
        currentStage.timeSpent = `${hours}h ${mins}m`;

        toast('Timer pausado automaticamente.', 'info');
    }

    // 2. Update Status
    if (task.status !== newStatus) {
        const oldStatus = task.status;
        task.status = newStatus;
        task.lastStatusChange = new Date().toISOString();
        toast(`Status alterado para "${newStatus}"`, 'success');

        // Assume titularidade se for demanda compartilhada ao iniciar atividade
        if (newStatus === 'Fazendo') {
            claimTaskIfShared(task, currentUser.id);
        }

        // Disparo centralizado de Notificações de Mudança de Status
        if (newStatus === 'Fazendo') {
            notifySolicitante(task, '▶️', `${currentUser.nome} iniciou a demanda: ${task.nome}`);
        } else if (newStatus === 'Para aprovação') {
            notifySolicitante(task, '👀', `${currentUser.nome} enviou p/ aprovação: ${task.nome}`);
        } else if (newStatus === 'Aprovado') {
            notifyCurrentResponsible(task, '🎉', `Etapa aprovada: ${task.nome}`);
        } else if (newStatus === 'Alteração') {
            notifyCurrentResponsible(task, '🔄', `Alteração solicitada: ${task.nome}`);
        }
    }

    // 3. Auto-start timer when moving TO 'Fazendo'
    if (newStatus === 'Fazendo' && currentStage) {
        // Reset limpo do timerState para evitar dados corrompidos
        const prevAccum = (currentStage.timerState && typeof currentStage.timerState.accumulated === 'number' && !isNaN(currentStage.timerState.accumulated))
            ? currentStage.timerState.accumulated : 0;

        currentStage.timerState = {
            running: true,
            accumulated: prevAccum,
            lastStart: new Date().toISOString()
        };
        toast('Timer iniciado automaticamente! 🔴', 'success');
    }

    saveData(task);
    if (typeof refresh === 'function') refresh();
    else renderKanban();
}

// QUADRO GERAL - All demands view for coordinators
function renderQuadroGeral() {
    const fStatus = document.getElementById('filterQuadroStatus')?.value || '';
    const fDept = document.getElementById('filterQuadroDept')?.value || '';
    const fPrio = document.getElementById('filterQuadroPrio')?.value || '';
    const searchTerm = document.getElementById('quadroSearch')?.value?.toLowerCase() || '';

    // Modificação: usando as demandas filtradas pelo mês selecionado
    let baseDemandas = getMonthDemandas();
    const activeDemandas = baseDemandas.filter(d => !d.deletedAt);

    // Get all demands for coordinator OR where user is participant
    let tasks = [];
    if (isGlobalCoordinator()) {
        tasks = activeDemandas;
    } else {
        // User sees tasks they requested OR where they are active OR were part of the pipeline (for history)
        tasks = activeDemandas.filter(d =>
            d.solicitanteId === currentUser.id ||
            (d.pipeline && d.pipeline.some(s => s.userId === currentUser.id || (!s.userId && s.userIds && s.userIds.includes(currentUser.id))))
        );
    }

    // Apply filters
    if (fStatus) tasks = tasks.filter(t => t.status === fStatus);
    if (fDept) tasks = tasks.filter(t => t.pipeline && t.pipeline.some(s => s.dept === fDept));
    if (fPrio) tasks = tasks.filter(t => t.prioridade === fPrio);
    if (searchTerm) tasks = tasks.filter(t => t.nome.toLowerCase().includes(searchTerm) || t.id.toLowerCase().includes(searchTerm));

    // Render stats
    let allTasks = [];
    if (isGlobalCoordinator()) {
        allTasks = activeDemandas;
    } else {
        allTasks = activeDemandas.filter(d =>
            d.solicitanteId === currentUser.id ||
            (d.pipeline && d.pipeline.some(s => s.userId === currentUser.id || (!s.userId && s.userIds && s.userIds.includes(currentUser.id))))
        );
    }
    const stats = {
        total: allTasks.length,
        afazer: allTasks.filter(t => t.status === 'A fazer').length,
        execucao: allTasks.filter(t => t.status === 'Fazendo').length,
        revisao: allTasks.filter(t => t.status === 'Para aprovação').length,
        concluida: allTasks.filter(t => t.status === 'Aprovado').length
    };

    document.getElementById('quadroStats').innerHTML = `
        <div class="quadro-stat-item">
            <span class="quadro-stat-value">${stats.total}</span>
            <span class="quadro-stat-label">Total</span>
        </div>
        <div class="quadro-stat-item waiting">
            <span class="quadro-stat-value">${stats.afazer}</span>
            <span class="quadro-stat-label">A fazer</span>
        </div>
        <div class="quadro-stat-item exec">
            <span class="quadro-stat-value">${stats.execucao}</span>
            <span class="quadro-stat-label">Fazendo</span>
        </div>
        <div class="quadro-stat-item review">
            <span class="quadro-stat-value">${stats.revisao}</span>
            <span class="quadro-stat-label">Para aprovação</span>
        </div>
        <div class="quadro-stat-item done">
            <span class="quadro-stat-value">${stats.concluida}</span>
            <span class="quadro-stat-label">Aprovado</span>
        </div>
    `;

    // Render table
    const container = document.getElementById('quadroGeralTable');
    if (!tasks.length) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)">Nenhuma demanda encontrada</div>';
        return;
    }

    container.innerHTML = `
    <table class="table">
            <thead>
                <tr>

                    <th class="table-th">Demanda</th>
                    <th class="table-th" style="width:120px">Tipo</th>
                    <th class="table-th" style="width:100px">Prioridade</th>
                    <th class="table-th" style="width:120px">Departamento</th>
                    <th class="table-th" style="width:100px">Responsável</th>
                    <th class="table-th" style="width:100px">Status</th>
                    <th class="table-th" style="width:100px">Prazo</th>
                </tr>
            </thead>
            <tbody>
                ${tasks.map(t => {
        const stage = t.pipeline ? t.pipeline[t.currentStage] : null;
        const user = USERS[stage?.userId];
        const deadline = parseDateLocal(t.dataConclusao);
        const today = new Date();
        const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        let dateClass = '';
        if (t.status !== 'Aprovado') {
            if (daysUntil < 0) dateClass = 'overdue';
            else if (daysUntil <= 3) dateClass = 'soon';
        }
        return `
                        <tr class="table-row" onclick="openDetail('${t.id}')">

                            <td class="table-td"><span class="task-name">${t.nome}</span></td>
                            <td class="table-td">${t.tipoProjeto}</td>
                            <td class="table-td"><span class="priority-badge ${t.prioridade.toLowerCase()}">${t.prioridade}</span></td>
                            <td class="table-td">${stage?.dept || '-'}</td>
                            <td class="table-td">${user?.nome || '-'}</td>
                            <td class="table-td"><span class="status-badge ${getStatusClass(t.status)}">${t.status}</span></td>
                            <td class="table-td ${dateClass}">${formatDate(t.dataConclusao)}</td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
    `;
}

// TV Dashboard now opens in a separate page (tv-dashboard.html)

// TABLES
function renderRequests() {
    setupOriginFilters();

    const c = document.getElementById('requestsTable');
    let baseDemandas = getMonthDemandas().filter(d => !d.deletedAt);
    let t = getUserVisibleTasks(baseDemandas);

    // Apply Origin Filter for Social Media and Coordinator
    const isSMOrCoord = isGlobalCoordinator() || currentUser.role === 'gestor_equipe';
    if (isSMOrCoord && window.currentOriginFilter) {
        const smUsers = getSocialMediaUsers();
        const smUserIds = smUsers.map(u => u.id);
        
        if (window.currentOriginFilter === 'minhas') {
            t = t.filter(x => x.solicitanteId === currentUser.id || (x.pipeline && x.pipeline.some(s => s.userId === currentUser.id || (!s.userId && s.userIds && s.userIds.includes(currentUser.id)))));
        } else if (window.currentOriginFilter.startsWith('user-')) {
            const targetId = window.currentOriginFilter.replace('user-', '');
            t = t.filter(x => x.solicitanteId === targetId);
        } else if (window.currentOriginFilter === 'todas-sm') {
            t = t.filter(x => smUserIds.includes(x.solicitanteId));
        }
    }

    // Always show tabs, even if empty
    c.innerHTML = renderRequestsTabs(t);
}

function renderRequestsTabs(tasks) {
    sortTasksByDateAndPriority(tasks);
    const groups = {};
    tasks.forEach(t => {
        const st = (t.status || '').trim();
        if (!groups[st]) groups[st] = [];
        groups[st].push(t);
    });

    console.log('Radar PNSA DEBUG: renderRequestsTabs - total tasks:', tasks.length, 'groups:', Object.keys(groups).map(k => k + ':' + groups[k].length));

    const statusOrder = [
        { key: 'A fazer', label: 'A Fazer', icon: '📋', cls: 'solicitado' },
        { key: 'Fazendo', label: 'Fazendo', icon: '🔄', cls: 'em-andamento' },
        { key: 'Para aprovação', label: 'Para Aprovação', icon: '👁️', cls: 'para-aprovacao' },
        { key: 'Alteração', label: 'Alteração', icon: '✏️', cls: 'alteracao' },
        { key: 'Aprovado', label: 'Aprovado', icon: '✅', cls: 'concluida' }
    ];

    // 1. Render Tabs Header
    let html = `<div class="execution-tabs">`;
    statusOrder.forEach((status, index) => {
        const count = groups[status.key]?.length || 0;
        const activeClass = index === 0 ? 'active' : '';
        html += `<button class="execution-tab ${activeClass}" onclick="switchRequestTab('${status.key}')" id="tab-btn-req-${status.cls}">
                    ${status.icon} ${status.label} <span class="execution-tab-count">${count}</span>
                 </button>`;
    });
    html += `</div>`;

    // 2. Render Content Areas
    html += `<div class="execution-body">`;
    statusOrder.forEach((status, index) => {
        const items = groups[status.key] || [];
        const activeClass = index === 0 ? 'active' : '';

        html += `<div id="tab-content-req-${status.cls}" class="execution-tab-content ${activeClass}">`;

        if (items.length === 0) {
            html += '<div class="empty-message">Nenhuma demanda neste status</div>';
        } else {
            html += `<div class="execution-grid">`;
            items.forEach((t, cardIndex) => {
                try {
                    const deadline = parseDateLocal(t.dataConclusao);
                    const today = new Date();
                    const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                    let dateClass = '';
                    if (daysUntil < 0) dateClass = 'overdue';
                    else if (daysUntil <= 3) dateClass = 'soon';

                    const currentStage = (t.pipeline && t.pipeline[t.currentStage]) ? t.pipeline[t.currentStage] : { dept: '-', userId: null };
                    const responsavel = currentStage.userId ? USERS[currentStage.userId] : null;
                    const staggerDelay = cardIndex * 0.06;
                    const totalAttachments = (t.attachments?.length || 0) + (t.entregasUrl?.length || (t.entregaUrl ? 1 : 0));
                    const attachmentBadge = totalAttachments > 0 ? `<span class="card-attachment-badge" title="Possui ${totalAttachments} anexo(s)">📎 ${totalAttachments}</span>` : '';

                    html += `
                        <div class="execution-card ${(t.prioridade || '').toLowerCase()}" onclick="openDetail('${t.id}')" style="animation-delay: ${staggerDelay}s">
                            <div class="execution-card-header">
                                <span class="execution-id">#${t.id}</span>
                                <span class="execution-date ${dateClass}">📅 ${formatDate(t.dataConclusao)}</span>
                            </div>
                            <div class="execution-card-body">
                                <h4 class="execution-title">${t.nome || 'Sem nome'} ${attachmentBadge}</h4>
                                <div class="execution-meta">
                                    <span class="meta-display">📁 ${t.tipoProjeto || '-'}</span>
                                    <span class="meta-display">🏢 ${currentStage.dept || '-'}</span>
                                </div>
                            </div>
                            <div class="execution-card-footer">
                                <span class="execution-prio-badge ${(t.prioridade || '').toLowerCase()}">${t.prioridade || '-'}</span>
                                <div class="execution-avatars">
                                    ${responsavel ? `${window.renderAvatar(responsavel, 'avatar')}` : ''}
                                </div>
                            </div>
                        </div>`;
                } catch (cardErr) {
                    console.error('Radar PNSA: Erro ao renderizar card de demanda:', t.id, cardErr);
                }
            });
            html += `</div>`;
        }
        html += `</div>`;
    });
    html += `</div>`;

    return html;
}

function switchRequestTab(key) {
    // Map status keys to safe CSS class identifiers
    const keyToCls = {
        'A fazer': 'solicitado',
        'Fazendo': 'em-andamento',
        'Para aprovação': 'para-aprovacao',
        'Alteração': 'alteracao',
        'Aprovado': 'concluida'
    };
    const cls = keyToCls[key] || key.replace(/\s+/g, '-');

    // Remove active class from all tabs and contents
    document.querySelectorAll('.execution-tab').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.execution-tab-content').forEach(el => el.classList.remove('active'));

    // Add active class to selected
    const tabBtn = document.getElementById(`tab-btn-req-${cls}`);
    const tabContent = document.getElementById(`tab-content-req-${cls}`);
    if (tabBtn) tabBtn.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
}

function renderReview() {
    const c = document.getElementById('reviewTable');
    let baseDemandas = getMonthDemandas();
    const canReview = isGlobalCoordinator() || currentUser.role === 'coordinator' || currentUser.role === 'social_media' || currentUser.role === 'gestor_equipe';
    
    // Debug: log all statuses to find mismatches
    const allStatuses = baseDemandas.map(d => `"${d.status}"`);
    console.log('Radar PNSA DEBUG: renderReview - canReview:', canReview, 'total demandas:', baseDemandas.length);
    console.log('Radar PNSA DEBUG: Status values in data:', [...new Set(allStatuses)]);
    
    // Debug: investigar deletedAt em demandas Para aprovação
    const paraAprov = baseDemandas.filter(d => (d.status || '').trim() === 'Para aprovação');
    console.log('Radar PNSA DEBUG: Demandas com Para aprovação (sem filtro deletedAt):', paraAprov.length, paraAprov.map(d => ({id: d.id, deletedAt: d.deletedAt, nome: d.nome})));
    
    let t = canReview
        ? baseDemandas.filter(d => !d.deletedAt && (d.status || '').trim() === 'Para aprovação')
        : baseDemandas.filter(d => !d.deletedAt && (d.status || '').trim() === 'Para aprovação' && d.solicitanteId === currentUser.id);

    console.log('Radar PNSA DEBUG: renderReview - demandas para revisar (com filtro deletedAt):', t.length);
    
    // Se não encontrou com filtro deletedAt mas tem sem filtro, mostrar sem filtro
    if (t.length === 0 && paraAprov.length > 0) {
        console.warn('Radar PNSA: Demandas Para aprovação existem mas todas tem deletedAt! Mostrando mesmo assim.');
        t = canReview
            ? paraAprov
            : paraAprov.filter(d => d.solicitanteId === currentUser.id);
    }

    if (!t.length) {
        c.innerHTML = `
            <div class="review-empty-state">
                <div class="review-empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                </div>
                <h3 class="review-empty-title">Nenhuma demanda para revisar</h3>
                <p class="review-empty-desc">Quando uma demanda for enviada para aprovação, ela aparecerá aqui.</p>
            </div>`;
        return;
    }

    let cardsHtml = '';
    t.forEach((task, index) => {
        try {
            const pipeline = task.pipeline || [];
            const s = pipeline[task.currentStage] || { dept: '-', userId: null };
            const u = s.userId ? USERS[s.userId] : null;
            const deadline = parseDateLocal(task.dataConclusao);
            const today = new Date();
            const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
            let dateClass = '';
            if (daysUntil < 0) dateClass = 'overdue';
            else if (daysUntil <= 3) dateClass = 'soon';

            cardsHtml += `
                <div class="review-card" onclick="openReviewModal('${task.id}')" style="animation-delay: ${index * 0.06}s">
                    <div class="review-card-top">
                        <span class="review-card-id">#${task.id}</span>
                        <span class="review-card-prio ${(task.prioridade || '').toLowerCase()}">${task.prioridade || '-'}</span>
                    </div>
                    <div class="review-card-body">
                        <h4 class="review-card-title">${task.nome || 'Sem nome'}</h4>
                        <div class="review-card-meta">
                            <span class="review-card-dept">🏢 ${s.dept || '-'}</span>
                            <span class="review-card-date ${dateClass}">📅 ${formatDate(task.dataConclusao)}</span>
                        </div>
                    </div>
                    <div class="review-card-bottom">
                        <span class="review-card-label">Responsável</span>
                        <div class="review-card-user">
                            ${u ? window.renderAvatar(u, 'review-avatar') : '<div class="review-avatar">?</div>'}
                            <span class="review-card-username">${u?.nome || '-'}</span>
                        </div>
                    </div>
                </div>`;
        } catch (cardErr) {
            console.error('Radar PNSA: Erro ao renderizar card de revisão:', task.id, cardErr);
        }
    });

    c.innerHTML = `
        <div class="review-header-bar">
            <div class="review-header-info">
                <span class="review-header-icon">👁️</span>
                <span class="review-header-title">Aguardando Revisão</span>
                <span class="review-header-count">${t.length}</span>
            </div>
        </div>
        <div class="review-cards-grid">
            ${cardsHtml}
        </div>`;
}

function renderTasks() {
    const c = document.getElementById('tasksTable'), f = document.getElementById('filterTasks').value;
    let t = getMonthDemandas().filter(d => !d.deletedAt && d.pipeline && d.pipeline.some(s => s.userId === currentUser.id || (!s.userId && s.userIds && s.userIds.includes(currentUser.id))));
    if (f) t = t.filter(d => (d.status || '').trim().toLowerCase().includes(f.trim().toLowerCase()));
    // Always show tabs, even if empty
    c.innerHTML = renderExecutionTasks(t);
}

function renderBoard() {
    if (!currentDept) return;
    // Skip if Suporte — it has its own dashboard
    if (currentDept === 'Suporte') { renderSuporteDashboard(false); return; }

    const c = document.getElementById('boardTable'), f = document.getElementById('filterBoard').value, s = document.getElementById('boardSearch').value.toLowerCase();
    let t = getMonthDemandas().filter(d => !d.deletedAt && d.pipeline && d.pipeline.some(st => st.dept === currentDept));
    if (!isGlobalCoordinator()) {
        t = t.filter(d => d.solicitanteId === currentUser.id || (d.pipeline && d.pipeline.some(st => st.userId === currentUser.id || (!st.userId && st.userIds && st.userIds.includes(currentUser.id)))));
    }
    if (f) t = t.filter(d => d.status.includes(f)); if (s) t = t.filter(d => d.nome.toLowerCase().includes(s));
    if (!t.length) { c.innerHTML = '<div class="empty-message">Nenhuma demanda encontrada</div>'; return; }
    c.innerHTML = renderGroupedTable(t); initCollapse();
}

function renderGroupedTable(tasks) {
    sortTasksByDateAndPriority(tasks);
    const groups = {}; tasks.forEach(t => { if (!groups[t.status]) groups[t.status] = []; groups[t.status].push(t); });
    // Standard order: A FAZER, FAZENDO, PARA APROVAÇÃO, ALTERAÇÃO, APROVADO
    const statusOrder = [
        { key: 'A fazer', label: 'A Fazer', cls: 'solicitado' },
        { key: 'Fazendo', label: 'Fazendo', cls: 'em-andamento' },
        { key: 'Para aprovação', label: 'Para Aprovação', cls: 'para-aprovacao' },
        { key: 'Alteração', label: 'Alteração', cls: 'alteracao' },
        { key: 'Aprovado', label: 'Aprovado', cls: 'concluida' }
    ];
    return statusOrder.filter(s => groups[s.key]).map(status => {
        const items = groups[status.key];
        return `<div class="board-section">
            <div class="board-section-header ${status.cls}">
                <span class="board-section-title">${status.label}</span>
                <span class="board-section-count">${items.length}</span>
            </div>
            <div class="board-section-body">
                <div class="table-head">
                    <div class="table-th">Demanda</div>
                    <div class="table-th">Pipeline</div>
                    <div class="table-th">Prioridade</div>
                    <div class="table-th">Prazo</div>
                    <div class="table-th">Responsáveis</div>
                </div>
                ${items.map(t => {
            const avatars = [];
            (t.pipeline || []).forEach(s => {
                if (s.userId) {
                    const u = USERS[s.userId];
                    if (u && !avatars.includes(u)) avatars.push(u);
                } else if (s.userIds) {
                    s.userIds.forEach(uid => {
                        const u = USERS[uid];
                        if (u && !avatars.includes(u)) avatars.push(u);
                    });
                }
            });
            return `<div class="table-row" onclick="openDetail('${t.id}')">
                        <div class="table-td"><span class="td-title">${t.nome}</span></div>
                        <div class="table-td">Etapa ${t.currentStage + 1}/${t.pipeline ? t.pipeline.length : 0}</div>
                        <div class="table-td"><span class="priority-badge ${t.prioridade.toLowerCase()}">${t.prioridade}</span></div>
                        <div class="table-td">${formatDate(t.dataConclusao)}</div>
                        <div class="table-td"><div class="td-avatars">${avatars.slice(0, 3).map(u => `${window.renderAvatar(u, 'td-avatar')}`).join('')}</div></div>
                    </div>`;
        }).join('')}
            </div>
        </div>`;
    }).join('');
}

function renderExecutionTasks(tasks) {
    sortTasksByDateAndPriority(tasks);
    const groups = {};
    tasks.forEach(t => {
        const s = (t.status || '').trim();
        if (!groups[s]) groups[s] = [];
        groups[s].push(t);
    });

    const statusOrder = [
        { key: 'A fazer', label: 'A Fazer', cls: 'solicitado' },
        { key: 'Fazendo', label: 'Fazendo', cls: 'em-andamento' },
        { key: 'Para aprovação', label: 'Para Aprovação', cls: 'para-aprovacao' },
        { key: 'Alteração', label: 'Alteração', cls: 'alteracao' },
        { key: 'Aprovado', label: 'Aprovado', cls: 'concluida' }
    ];


    // 1. Render Tabs Header
    let html = `<div class="execution-tabs">`;
    statusOrder.forEach((status, index) => {
        const count = groups[status.key]?.length || 0;
        const activeClass = index === 0 ? 'active' : '';
        html += `<button class="execution-tab ${activeClass}" onclick="switchExecutionTab('${status.key}')" id="tab-btn-${status.cls}">
                    ${status.label} <span class="execution-tab-count">${count}</span>
                 </button>`;
    });
    html += `</div>`;

    // 2. Render Content Areas
    html += `<div class="execution-body">`;
    statusOrder.forEach((status, index) => {
        const items = groups[status.key] || [];
        const activeClass = index === 0 ? 'active' : '';

        html += `<div id="tab-content-${status.cls}" class="execution-tab-content ${activeClass}">`;

        if (items.length === 0) {
            html += '<div class="empty-message">Nenhuma demanda neste status</div>';
        } else {
            html += `<div class="execution-grid">`;
            items.forEach(t => {
                try {
                    if (!t.pipeline || t.currentStage === undefined) return;
                    const currentStage = t.pipeline[t.currentStage];
                    if (!currentStage) return;
                    
                    const deadline = parseDateLocal(t.dataConclusao);
                    const today = new Date();
                    const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                    let dateClass = '';
                    if (daysUntil < 0) dateClass = 'overdue';
                    else if (daysUntil <= 3) dateClass = 'soon';

                    const avatars = [];
                    t.pipeline.forEach(s => {
                        if (s.userId) {
                            const u = USERS[s.userId];
                            if (u && !avatars.includes(u)) avatars.push(u);
                        } else if (s.userIds) {
                            s.userIds.forEach(uid => {
                                const u = USERS[uid];
                                if (u && !avatars.includes(u)) avatars.push(u);
                            });
                        }
                    });

                    const totalAttachments = (t.attachments?.length || 0) + (t.entregasUrl?.length || (t.entregaUrl ? 1 : 0));
                    const attachmentBadge = totalAttachments > 0 ? `<span class="card-attachment-badge" title="Possui ${totalAttachments} anexo(s)">📎 ${totalAttachments}</span>` : '';

                    html += `
                        <div class="execution-card ${(t.prioridade || '').toLowerCase()}" onclick="openDetail('${t.id}')">
                            <div class="execution-card-header">
                                <span class="execution-date ${dateClass}">📅 ${formatDate(t.dataConclusao)}</span>
                            </div>
                            <div class="execution-card-body">
                                <h4 class="execution-title">${t.nome || 'Sem nome'} ${attachmentBadge}</h4>
                                <div class="execution-meta">
                                    <span class="meta-display">📁 ${t.tipoProjeto || '-'}</span>
                                    <span class="meta-display">🏢 ${currentStage.dept || '-'}</span>
                                </div>
                            </div>
                            <div class="execution-card-footer">
                                <span class="execution-prio-badge ${(t.prioridade || '').toLowerCase()}">${t.prioridade || '-'}</span>
                                <div class="execution-avatars">
                                    ${avatars.slice(0, 3).map(u => `${window.renderAvatar(u, 'avatar')}`).join('')}
                                    ${avatars.length > 3 ? `<div class="avatar">+${avatars.length - 3}</div>` : ''}
                                </div>
                            </div>
                        </div>`;
                } catch (e) {
                    console.error('Radar PNSA: Erro ao renderizar card execução:', t.id, e);
                }
            });
            html += `</div>`;
        }
        html += `</div>`;
    });
    html += `</div>`;

    return html;
}

function switchExecutionTab(key) {
    const keyToCls = {
        'A fazer': 'solicitado',
        'Fazendo': 'em-andamento',
        'Para aprovação': 'para-aprovacao',
        'Alteração': 'alteracao',
        'Aprovado': 'concluida'
    };
    const cls = keyToCls[key] || key.replace(/\s+/g, '-');

    document.querySelectorAll('.execution-tab').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.execution-tab-content').forEach(el => el.classList.remove('active'));

    const tabBtn = document.getElementById(`tab-btn-${cls}`);
    const tabContent = document.getElementById(`tab-content-${cls}`);
    if (tabBtn) tabBtn.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
}

function initCollapse() { document.querySelectorAll('.group-head').forEach(el => el.addEventListener('click', () => el.closest('.table-group').classList.toggle('collapsed'))); }

// MODALS

function populateAllUsers() {
    const allUsers = Object.values(USERS);
    const solicitanteOpts = '<option value="">Selecione...</option>' + allUsers.map(u => `<option value="${u.id}">${u.nome}</option>`).join('');

    // Group all users by department for Responsável select
    const groups = {};
    const deptOrder = ['Gestão', 'Social Media', 'Designer', 'Videomaker', 'Transmissão', 'Suporte', 'Inovação/TI'];

    allUsers.forEach(u => {
        let userDepts = getUserDepts(u);
        userDepts.forEach(d => {
            if (!groups[d]) groups[d] = [];
            groups[d].push(u);
        });
    });

    let responsavelOpts = '<option value="">Selecione...</option>';

    // Build optgroups in order
    deptOrder.forEach(dept => {
        if (groups[dept] && groups[dept].length > 0) {
            const deptIcons = { 'Gestão': '◆', 'Social Media': '📱', 'Designer': '🎨', 'Videomaker': '🎬', 'Transmissão': '🎥', 'Suporte': '🛠️', 'Inovação/TI': '💡' };
            responsavelOpts += `<optgroup label="${deptIcons[dept] || '📁'} ${dept}">`;
            groups[dept].forEach(u => {
                responsavelOpts += `<option value="${u.id}">${u.nome}</option>`;
            });
            responsavelOpts += `</optgroup>`;
        }
    });

    // Any departments not in the order list
    Object.keys(groups).forEach(dept => {
        if (!deptOrder.includes(dept) && groups[dept].length > 0) {
            responsavelOpts += `<optgroup label="📁 ${dept}">`;
            groups[dept].forEach(u => {
                responsavelOpts += `<option value="${u.id}">${u.nome}</option>`;
            });
            responsavelOpts += `</optgroup>`;
        }
    });

    document.getElementById('cSolicitante').innerHTML = solicitanteOpts;
    document.getElementById('cResponsavel').innerHTML = responsavelOpts;
    document.getElementById('cSolicitante').disabled = false;
}

function populateDependencies() {
    console.log('Radar PNSA: Populating dependencies. Count:', demandas.length);
    console.log('Radar PNSA: First task:', demandas[0]);

    let opts = '<option value="">Nenhuma dependência</option>';

    if (demandas && demandas.length > 0) {
        opts += demandas.filter(d => !d.deletedAt).map(d => {
            const id = d.id || 'SEM_ID';
            const nome = d.nome || 'Sem Nome';
            return `<option value="${id}">#${id} - ${nome}</option>`;
        }).join('');
    } else {
        // Fallback examples + Generic Dependencies
        opts += `<optgroup label="Dependências de Fluxo">
                    <option value="dep_design">Finalização de Design</option>
                    <option value="dep_video">Finalização de Vídeo</option>
                    <option value="dep_roteiro">Aprovação de Roteiro</option>
                 </optgroup>
                 <optgroup label="Tarefas Exemplo">
                    <option value="ex1">#WF-0001 - Exemplo de Tarefa (Demonstração)</option>
                    <option value="ex2">#WF-0002 - Exemplo de Tarefa (Demonstração)</option>
                 </optgroup>`;
    }

    const select = document.getElementById('cDependsOn');
    if (select) {
        select.innerHTML = opts;
        console.log('Radar PNSA: Dependencies populated in DOM');
    } else {
        console.error('Radar PNSA: Select cDependsOn not found');
    }
}

function handleSubTypeChange(type) {
    const selectorId = `cTipo${type}`;
    const val = document.getElementById(selectorId).value;

    // Hide all event fields first
    document.getElementById('sectionEventDetails').style.display = 'none';
    ['fieldsEventDesign', 'fieldsEventVideo', 'fieldsEventSocial'].forEach(id => document.getElementById(id).style.display = 'none');

    // Logic: If EVENTOS, show specific fields
    if (val === 'EVENTOS') {
        document.getElementById('sectionEventDetails').style.display = 'block';
        if (type === 'Design') {
            document.getElementById('fieldsEventDesign').style.display = 'block';
            document.getElementById('fieldsEventVideo').style.display = 'none';
        }
        if (type === 'Video') {
            document.getElementById('fieldsEventVideo').style.display = 'block';
            document.getElementById('fieldsEventDesign').style.display = 'none';
        }
        if (type === 'Social') document.getElementById('fieldsEventSocial').style.display = 'block';
    }
}

// Show dependency checkbox only for Design


function toggleVideomakerFields() {
    const isChecked = document.getElementById('cDependeDesigner').checked;
    const fields = document.getElementById('extraVideomakerFields');
    fields.style.display = isChecked ? 'block' : 'none';

    if (isChecked) {
        // Populate Videomakers
        const videomakers = DEPT_USERS['Videomaker'].map(id => `<option value="${id}">${USERS[id].nome}</option>`).join('');
        document.getElementById('cExtraVideoResp').innerHTML = '<option value="">Selecione...</option>' + videomakers;
    }
}

function openCreateModal() {
    if (currentDept === 'Inovação/TI') {
        if (typeof openChamadoTIModal === 'function') {
            openChamadoTIModal();
            return;
        }
    }

    // Apenas social_media, gestores e coordenadores (gestão) podem criar demandas
    const role = currentUser?.role;
    if (role !== 'social_media' && role !== 'coordinator' && role !== 'gestor_equipe' && !isGlobalCoordinator() && currentDept !== 'Inovação/TI') {
        toast('Você não tem permissão para criar demandas.', 'error');
        return;
    }
    document.getElementById('modalCreate').classList.add('active');
    document.getElementById('formCreate').reset();

    // Reset recurrence inputs and state
    window.customRecurringDates = [];
    document.querySelectorAll('input[name="cDiaSemanaCheckbox"]').forEach(cb => cb.checked = false);
    const cRestringir = document.getElementById('cRestringirDiasUteis');
    if (cRestringir) cRestringir.checked = false;
    const cUsarP80 = document.getElementById('cUsarPrazoProbabilistico');
    if (cUsarP80) cUsarP80.checked = true;
    const cFrequencia = document.getElementById('cFrequencia');
    if (cFrequencia) cFrequencia.value = '';
    
    // Hide preview on start
    const previewContainer = document.getElementById('recurrencePreviewContainer');
    if (previewContainer) previewContainer.style.display = 'none';
    const previewList = document.getElementById('recurrencePreviewList');
    if (previewList) previewList.innerHTML = '';
    const recDatesList = document.getElementById('recurringDatesList');
    if (recDatesList) recDatesList.innerHTML = '';

    // Controle de visibilidade da repetição
    const canRepeat = (role === 'social_media' || role === 'coordinator' || role === 'gestor_equipe' || isGlobalCoordinator());
    const sectionRepeticao = document.getElementById('sectionRepeticao');
    if (sectionRepeticao) sectionRepeticao.style.display = canRepeat ? 'block' : 'none';

    // Initialize form state
    onTipoProjetoChange();

    document.getElementById('groupDependencyDesign').style.display = 'none';
    document.getElementById('extraVideomakerFields').style.display = 'none';

    const today = new Date();
    document.getElementById('cDataSolicitacao').value = today.toISOString().split('T')[0];

    // Populate users
    populateAllUsers();
    populateDependencies();

    // Initialize visuals
    document.getElementById('sectionSubType').style.display = 'none';
    document.getElementById('sectionEventDetails').style.display = 'none';
    document.getElementById('groupFormats').style.display = 'none';

    renderTagsSelector('tagsSelectorCreate');
    populateDependencies();

    // Initialize formats container with placeholder
    const formatsContainer = document.getElementById('formatsContainer');
    if (formatsContainer) {
        formatsContainer.innerHTML = '<span class="text-muted">Selecione um tipo de projeto para ver os formatos.</span>';
    }

    document.getElementById('cPinned').checked = false;

    // Renderizar templates personalizados de checklist
    renderCustomTemplateCheckboxes();

    // Adicionar escutadores para atualizar a pré-visualização ao vivo
    const inputsToBind = ['cTipoProjeto', 'cTipoDesign', 'cTipoVideo', 'cTipoSocial', 'cTipoTI', 'cDataConclusao', 'cDataSolicitacao'];
    inputsToBind.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.removeEventListener('change', window.updateRecurrencePreview);
            el.addEventListener('change', window.updateRecurrencePreview);
        }
    });

    // Forçar atualização inicial do estado da repetição e prazo P80
    window.updateRecurrencePreview();
}

async function handleCreate(e) {
    try {
        e.preventDefault();

        // Basic Fields
        const nome = document.getElementById('cNome').value;
        const solicitanteId = document.getElementById('cSolicitante').value;
        const responsaveisSelect = document.getElementById('cResponsavel');
        const selectedResponsaveis = Array.from(responsaveisSelect.selectedOptions).map(o => o.value).filter(v => v);
        if (selectedResponsaveis.length === 0) {
            toast('Selecione pelo menos um responsável.', 'error');
            return;
        }

        const tipoProjeto = document.getElementById('cTipoProjeto').value;
        const prioridade = document.getElementById('cPrioridade').value;

        // ===== TRANSMISSÃO: Fluxo especial — gera uma demanda por programa selecionado =====
        if (tipoProjeto === 'Transmissão') {
            const selections = getTransmissaoSelections();
            if (selections.length === 0) {
                toast('Selecione pelo menos um programa para a semana.', 'error');
                return;
            }

            const respId = selectedResponsaveis[0]; // Executor principal
            const createdTasks = [];

            for (const sel of selections) {
                const task = {
                    id: `WF-${String(nextId++).padStart(4, '0')}`,
                    nome: `📡 ${sel.programa} — ${sel.dia} ${sel.horario}`,
                    solicitanteId,
                    responsavelId: respId,
                    tipoProjeto: 'Transmissão',
                    subType: 'PROGRAMAÇÃO',
                    prioridade: prioridade || 'Normal',
                    dataSolicitacao: sel.date,
                    dataConclusao: sel.date,
                    titulo: `${sel.programa} — ${sel.dia}`,
                    detalhes: `Transmissão: ${sel.programa} às ${sel.horario} (${sel.dia}, ${sel.date})`,
                    briefing: '',
                    orientacoes: '',
                    referencias: '',
                    textos: '',
                    referenciasEventos: {},
                    pipeline: [{
                        dept: 'Transmissão',
                        userId: respId,
                        status: 'A fazer'
                    }],
                    currentStage: 0,
                    status: 'A fazer',
                    dataCriacao: new Date().toISOString(),
                    feedback: [],
                    tags: ['Transmissão'],
                    formatos: [],
                    dependsOn: null,
                    pinned: false,
                    attachments: [],
                    transmissao: {
                        programa: sel.programa,
                        horario: sel.horario,
                        dia: sel.dia,
                        dataHoraFim: sel.dataHoraFim
                    }
                };
                demandas.push(task);
                createdTasks.push(task);
            }

            // Salvar todas
            for (const t of createdTasks) {
                saveData(t);
            }

            // Notificar executor
            const solName = USERS[solicitanteId]?.nome || 'Gestor';
            notifyUser(respId, '📡', `${createdTasks.length} transmissões agendadas por ${solName}`);

            closeModal('modalCreate');
            document.getElementById('formCreate').reset();
            toast(`${createdTasks.length} demandas de transmissão criadas!`, 'success');
            refresh();
            return;
        }

        let dataSolicitacao = document.getElementById('cDataSolicitacao').value;
        let dataConclusao = document.getElementById('cDataConclusao').value;

        // Default dates for TI if hidden/empty
        if (tipoProjeto === 'TI') {
            if (!dataSolicitacao) dataSolicitacao = new Date().toISOString().split('T')[0];
            if (!dataConclusao) {
                const d = new Date();
                d.setDate(d.getDate() + 2); // Default SLA 2 days?
                dataConclusao = d.toISOString().split('T')[0];
            }
        }

        // TI Specific Data
        let tiData = null;
        let descricao = '';
        if (tipoProjeto === 'TI') {
            tiData = {
                category: document.getElementById('cTICategory').value,
                description: document.getElementById('cTIDescription').value,
                location: document.getElementById('cTILocation').value,
                presence: document.getElementById('cTIPresence').value
            };
            // Use TI description as standard description for card view
            descricao = tiData.description;
        } else {
            descricao = document.getElementById('cDetalhesConteudo')?.value || '';
        }

        // Details
        const titulo = document.getElementById('cTitulo') ? document.getElementById('cTitulo').value : '';
        const briefing = document.getElementById('cBriefing').value;
        const orientacoes = document.getElementById('cOrientacoes')?.value || '';
        const referencias = document.getElementById('cReferencias').value;
        const textos = document.getElementById('cTextos') ? document.getElementById('cTextos').value : '';

        // Sub-type Logic
        let subType = '';
        const tipoDesignEl = document.getElementById('cTipoDesign');
        const tipoVideoEl = document.getElementById('cTipoVideo');
        const tipoSocialEl = document.getElementById('cTipoSocial');
        const tipoTIEl = document.getElementById('cTipoTI');

        if (tipoProjeto === 'Design Gráfico' && tipoDesignEl) subType = tipoDesignEl.value;
        else if (tipoProjeto === 'Videomaker' && tipoVideoEl) subType = tipoVideoEl.value;
        else if (tipoProjeto === 'Social Media' && tipoSocialEl) subType = tipoSocialEl.value;
        else if (tipoProjeto === 'TI' && tipoTIEl) subType = tipoTIEl.value;

        // Event Fields
        const eventData = {};
        if (subType === 'EVENTOS') {
            if (tipoProjeto === 'Design Gráfico') {
                const videosAdEl = document.getElementById('cVideosAdicionais');
                const palestrantesDesEl = document.getElementById('cPalestrantesDesign');
                const dataEventoDesEl = document.getElementById('cDataEventoDesign');
                const localEventoDesEl = document.getElementById('cLocalEventoDesign');

                eventData.videosAdicionais = videosAdEl ? videosAdEl.value : '';
                eventData.palestrantes = palestrantesDesEl ? palestrantesDesEl.value : '';
                eventData.dataEvento = dataEventoDesEl ? dataEventoDesEl.value : '';
                eventData.localEvento = localEventoDesEl ? localEventoDesEl.value : '';
            } else if (tipoProjeto === 'Videomaker') {
                const artesAdEl = document.getElementById('cArtesAdicionais');
                const palestrantesVidEl = document.getElementById('cPalestrantesVideo');
                const dataEventoVidEl = document.getElementById('cDataEventoVideo');
                const localEventoVidEl = document.getElementById('cLocalEventoVideo');

                eventData.artesAdicionais = artesAdEl ? artesAdEl.value : '';
                eventData.palestrantes = palestrantesVidEl ? palestrantesVidEl.value : '';
                eventData.dataEvento = dataEventoVidEl ? dataEventoVidEl.value : '';
                eventData.localEvento = localEventoVidEl ? localEventoVidEl.value : '';
            } else if (tipoProjeto === 'Social Media') {
                const demandaAdEl = document.getElementById('cDemandaAdicionalSocial');
                eventData.demandaAdicional = demandaAdEl ? demandaAdEl.value : '';
            }
        }

        // Process Attachments Upload (ONCE for all tasks generated)
        const anexosInput = document.getElementById('cAnexos');
        const fotosDesignInput = document.getElementById('cFotosDesign');
        const videoRefInput = document.getElementById('cVideoRefVideo');

        const allFiles = [];
        if (anexosInput && anexosInput.files) allFiles.push(...anexosInput.files);
        if (fotosDesignInput && fotosDesignInput.files) allFiles.push(...fotosDesignInput.files);
        if (videoRefInput && videoRefInput.files) allFiles.push(...videoRefInput.files);

        const attachments = [];
        if (allFiles.length > 0) {
            toast('⏳ Enviando anexos...', 'info');
            const btnSubmit = document.querySelector('#formCreate button[type="submit"]');
            if (btnSubmit) btnSubmit.disabled = true;

            const baseUploadId = `WF-${String(nextId).padStart(4, '0')}`;
            for (let i = 0; i < allFiles.length; i++) {
                const file = allFiles[i];
                let type = 'doc';
                if (file.type.startsWith('image/')) type = 'image';
                else if (file.type === 'application/pdf') type = 'pdf';
                else if (file.type.startsWith('video/')) type = 'video';

                const storageRef = window.ref(window.firebaseStorage, `arquivos_demandas/${baseUploadId}/${Date.now()}_${file.name}`);
                try {
                    await window.uploadBytes(storageRef, file);
                    const docUrl = await window.getDownloadURL(storageRef);
                    attachments.push({
                        name: file.name,
                        type: type,
                        size: (file.size / 1024).toFixed(1) + ' KB',
                        date: new Date().toISOString(),
                        uploadedBy: currentUser.nome,
                        url: docUrl
                    });
                } catch (upErr) {
                    console.error('Erro ao enviar anexo:', upErr);
                    toast('Erro ao enviar ' + file.name, 'error');
                }
            }
            if (btnSubmit) btnSubmit.disabled = false;
        }

        // LOOPS OVER SELECTED RESPONSibles TO CREATE ONE DEMAND FOR EACH
        const dependsOnDesigner = document.getElementById('cDependeDesigner')?.checked || false;

        // --- Calcula Datas de Repetição ---
        const frequenciaEl = document.getElementById('cFrequencia');
        const frequencia = frequenciaEl ? frequenciaEl.value : '';
        let completionDates = [dataConclusao];

        const canRepeat = (currentUser?.role === 'social_media' || currentUser?.role === 'coordinator' || isGlobalCoordinator());

        // Busca o prazo probabilístico P80 se selecionado
        let p80LeadTime = null;
        const cUsarProb = document.getElementById('cUsarPrazoProbabilistico');
        if (cUsarProb && cUsarProb.checked) {
            let subTypeForProb = '';
            if (tipoProjeto === 'Design Gráfico') subTypeForProb = document.getElementById('cTipoDesign')?.value || '';
            else if (tipoProjeto === 'Videomaker') subTypeForProb = document.getElementById('cTipoVideo')?.value || '';
            else if (tipoProjeto === 'Social Media') subTypeForProb = document.getElementById('cTipoSocial')?.value || '';
            else if (tipoProjeto === 'TI') subTypeForProb = document.getElementById('cTipoTI')?.value || '';
            
            p80LeadTime = window.calculateProbabilisticDuration(tipoProjeto, subTypeForProb);
        }

        if (frequencia && canRepeat) {
            const checkedDays = Array.from(document.querySelectorAll('input[name="cDiaSemanaCheckbox"]:checked')).map(cb => parseInt(cb.value));
            const config = {
                frequencia: frequencia,
                diasSemana: checkedDays,
                restringirDiasUteis: document.getElementById('cRestringirDiasUteis')?.checked || false,
                periodo: document.getElementById('cPeriodo')?.value || '1_mes',
                limiteOcorrencias: parseInt(document.getElementById('cLimiteOcorrencias')?.value) || 5,
                datasPersonalizadas: window.customRecurringDates
            };
            const generated = window.generateRecurrenceDates(dataConclusao, config);
            completionDates.push(...generated);
        }

        // Calcula antecedência padrão (offset manual) em dias
        let manualOffsetDays = 0;
        if (dataSolicitacao && dataConclusao) {
            const dSol = new Date(dataSolicitacao + 'T12:00:00Z');
            const dCon = new Date(dataConclusao + 'T12:00:00Z');
            manualOffsetDays = Math.max(0, Math.round((dCon - dSol) / (1000 * 60 * 60 * 24)));
        }

        const effectiveOffsetDays = (p80LeadTime !== null) ? p80LeadTime : manualOffsetDays;

        for (let repeticaoIndex = 0; repeticaoIndex < completionDates.length; repeticaoIndex++) {
            const targetDate = completionDates[repeticaoIndex];
            let solDate = targetDate;
            
            if (repeticaoIndex === 0 && p80LeadTime === null) {
                // Se for a primeira demanda e NÃO estiver usando prazo probabilístico, usa o manual do input
                solDate = dataSolicitacao;
            } else if (effectiveOffsetDays > 0) {
                const tmp = new Date(targetDate + 'T12:00:00Z');
                tmp.setDate(tmp.getDate() - effectiveOffsetDays);
                solDate = tmp.toISOString().split('T')[0];
            }
            const isRecurring = completionDates.length > 1 && repeticaoIndex > 0;
            const isLastRecurring = isRecurring && repeticaoIndex === completionDates.length - 1;
            let pipeline = [];
            
            const isShared = selectedResponsaveis.length > 1;

            if (dependsOnDesigner && tipoProjeto === 'Design Gráfico') {
                // SEQUENTIAL WORKFLOW: Design -> Video
                const videoRespEl = document.getElementById('cExtraVideoResp');
                const videoBriefingEl = document.getElementById('cExtraVideoBriefing');
                const videoReelsEl = document.getElementById('cVideoTypeReels');
                const videoYoutubeEl = document.getElementById('cVideoTypeYoutube');

                const videoResp = videoRespEl ? videoRespEl.value : '';
                const videoBriefing = videoBriefingEl ? videoBriefingEl.value : '';

                // Get checked video types
                let videoTypes = [];
                if (videoReelsEl && videoReelsEl.checked) videoTypes.push('Reels/TikTok');
                if (videoYoutubeEl && videoYoutubeEl.checked) videoTypes.push('YouTube');
                const videoTypeStr = videoTypes.join(' + ');

                // 1. Designer (Current selection)
                if (isShared) {
                    pipeline.push({
                        dept: 'Designer',
                        userId: '',
                        userIds: [...selectedResponsaveis],
                        status: 'A fazer'
                    });
                } else {
                    pipeline.push({
                        dept: 'Designer',
                        userId: selectedResponsaveis[0],
                        status: 'A fazer'
                    });
                }

                // 2. Videomaker (Starts later)
                pipeline.push({
                    dept: 'Videomaker',
                    userId: videoResp || 'pedro-vm', // Fallback
                    status: 'A fazer', // Will be blocked until previous is done (logic in execution)
                    obs: `Depende da arte. Tipo: ${videoTypeStr}. Briefing: ${videoBriefing}`
                });

            } else {
                // Standard Single Pipeline
                let targetDept = 'Inovação/TI';
                if (tipoProjeto === 'Design Gráfico') targetDept = 'Designer';
                else if (tipoProjeto === 'Videomaker') targetDept = 'Videomaker';
                else if (tipoProjeto === 'Social Media') targetDept = 'Social Media';
                else if (tipoProjeto === 'TI') targetDept = 'Inovação/TI';
                else if (tipoProjeto === 'Suporte') targetDept = 'Suporte';
                else if (tipoProjeto === 'Transmissão') targetDept = 'Transmissão';
                else if (tipoProjeto === 'Design + Vídeo') {
                    targetDept = 'Designer'; // Starts with design
                }

                if (isShared) {
                    pipeline.push({
                        dept: targetDept,
                        userId: '',
                        userIds: [...selectedResponsaveis],
                        status: 'A fazer'
                    });
                } else {
                    pipeline.push({
                        dept: targetDept,
                        userId: selectedResponsaveis[0],
                        status: 'A fazer'
                    });
                }

                // If "Design + Vídeo" was manually selected in dropdown (legacy or alternative)
                if (tipoProjeto === 'Design + Vídeo') {
                    pipeline.push({
                        dept: 'Videomaker',
                        userId: 'pedro-vm', // Default or need prompt
                        status: 'A fazer'
                    });
                }
            }

            const task = {
                id: `WF-${String(nextId++).padStart(4, '0')}`,
                nome: isRecurring ? `${nome} (Cópia ${repeticaoIndex})` : nome,
                solicitanteId,
                responsavelId: isShared ? '' : selectedResponsaveis[0],
                tipoProjeto: (dependsOnDesigner) ? 'Design + Vídeo' : tipoProjeto, // Override type if sequential
                subType,
                prioridade,
                dataSolicitacao: solDate,
                dataConclusao: targetDate,
                titulo: titulo || nome,
                detalhes: descricao, // Use 'descricao' here
                briefing,
                orientacoes: isLastRecurring ? `⚠️ AVISO DO SISTEMA: Última demanda do ciclo mensal de repetição!\n${orientacoes}` : orientacoes,
                referencias,
                textos,
                referenciasEventos: eventData,
                pipeline,
                currentStage: 0,
                status: 'A fazer',
                dataCriacao: new Date().toISOString(),
                feedback: [],
                tags: getSelectedTags('tagsSelectorCreate'),
                formatos: getSelectedFormats(),
                dependsOn: document.getElementById('cDependsOn')?.value || null,
                pinned: document.getElementById('cPinned')?.checked || false,
                ti: tiData, // Save TI data
                attachments: [...attachments] // Copiar via destructuring
            };

            // Apply Template Evento Completo
            if (tipoProjeto === 'Design Gráfico' && subType === 'EVENTOS' && document.getElementById('cEventoCompletoDesign').checked) {
                task.subtasks = TEMPLATE_EVENTO_COMPLETO.map((text, i) => ({
                    id: Date.now() + i,
                    text: text,
                    completed: false
                }));
            } else if (tipoProjeto === 'Videomaker' && subType === 'EVENTOS' && document.getElementById('cEventoCompletoVideo').checked) {
                task.subtasks = TEMPLATE_EVENTO_VIDEO.map((text, i) => ({
                    id: Date.now() + i,
                    text: text,
                    completed: false
                }));
            }

            // Apply Custom Templates (personalizados) — acumula com templates padrão
            const customTemplates = getCustomTemplates();
            const checkedCustom = document.querySelectorAll('.custom-template-check:checked');
            checkedCustom.forEach(cb => {
                const tplIdx = parseInt(cb.dataset.tplIndex);
                const tpl = customTemplates[tplIdx];
                if (tpl && tpl.items) {
                    const baseId = Date.now() + (task.subtasks?.length || 0) + Math.random() * 1000;
                    // Adiciona cabeçalho do template
                    task.subtasks = task.subtasks || [];
                    task.subtasks.push({ id: Math.floor(baseId), text: `## ${tpl.name}`, completed: false });
                    tpl.items.forEach((item, i) => {
                        task.subtasks.push({
                            id: Math.floor(baseId + i + 1),
                            text: item,
                            completed: false
                        });
                    });
                }
            });

            demandas.push(task);
            if (repeticaoIndex === 0) {
                if (isShared) {
                    selectedResponsaveis.forEach(uid => {
                        notifyUser(uid, '🚀', `Nova demanda compartilhada: ${task.nome}${completionDates.length > 1 ? ` (+${completionDates.length-1} repetições)` : ''}`);
                    });
                } else if (task.pipeline[0]?.userId) {
                    notifyUser(task.pipeline[0].userId, '🚀', `Nova demanda: ${task.nome}${completionDates.length > 1 ? ` (+${completionDates.length-1} repetições)` : ''}`);
                }
            }
        } // FIM DO LOOP REPETICAO

        saveData();
        closeModal('modalCreate');
        toast('Demanda(s) enviada(s) com sucesso!', 'success');
        refresh();
    } catch (err) {
        console.error('Erro detalhado ao criar demanda:', err);
        console.error('Stack trace:', err.stack);
        alert(`Erro ao criar demanda: ${err.message}\n\nVerifique o console (F12) para mais detalhes.`);
    }
}


function openDetail(id) {
    event?.stopPropagation();
    const t = demandas.find(d => d.id === id); if (!t) return;
    currentTaskId = id;
    document.getElementById('detailId').innerHTML = '📋 ' + t.nome;
    const sol = USERS[t.solicitanteId], cls = getStatusClass(t.status);
    const pipeHtml = t.pipeline.map((s, i) => {
        const uNames = s.userId ? (USERS[s.userId]?.nome || '?') : (s.userIds ? s.userIds.map(uid => USERS[uid]?.nome).filter(Boolean).join(', ') : '?');
        const isCurr = i === t.currentStage && t.status !== 'Aprovado', isDone = i < t.currentStage || t.status === 'Aprovado';
        const timeInfo = s.timeSpent ? `<span class="pipeline-time">⏱️ ${s.timeSpent}</span> ` : (s.startedAt && isCurr ? ` <span class="pipeline-time running">⏳ Em andamento...</span> ` : '');
        return `<div class="pipeline-stage ${isCurr ? 'current' : isDone ? 'completed' : ''}"><span class="pipeline-stage-num">${i + 1}</span><div class="pipeline-stage-info"><span class="pipeline-stage-dept">${s.dept}</span> <span class="pipeline-stage-user">${uNames}</span>${timeInfo}</div><span class="pipeline-stage-status">${isDone ? ' ✓ Concluída' : isCurr ? s.status : 'A fazer'}</span></div> `;
    }).join('');

    // Comments HTML
    const comments = t.comments || [];
    const commentsHtml = comments.length ? comments.map(c => {
        const u = USERS[c.userId] || { iniciais: '?', nome: 'Desconhecido', cor: 'var(--brand-primary)' };
        let userInitial = u.iniciais || u.nome.substring(0, 2).toUpperCase();
        return `<div class="comment-item"><div class="comment-avatar" style="background-color: ${u.cor || 'var(--brand-primary)'}">${userInitial}</div><div class="comment-body"><div class="comment-header"><span class="comment-author">${u.nome}</span><span class="comment-date">${formatDateFull(c.date)}</span></div><p class="comment-text">${c.text}</p></div></div> `;
    }).join('') : '<div class="empty-comments">Nenhum comentário ainda</div>';

    // Attachments HTML
    const attachments = t.attachments || [];
    const attachmentsHtml = attachments.length ? `<div class="attachment-grid">` + attachments.map((a, i) => {
        const isImage = a.type === 'image' || (a.name && /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(a.name));
        const icon = a.type === 'pdf' ? '📄' : a.type === 'link' ? '🔗' : '📎';
        const previewHtml = isImage && a.url
            ? `<img src="${a.url}" alt="${a.name}">`
            : `<span class="attachment-preview-icon">${icon}</span>`;
        
        const clickHandler = a.url ? `onclick="event.stopPropagation(); window.open('${a.url.replace(/'/g, "\\'")}', '_blank')"` : `onclick="event.stopPropagation()"`;
        
        return `
        <div class="attachment-item-card" ${clickHandler}>
            <div class="attachment-preview-box">
                ${previewHtml}
            </div>
            <div class="attachment-card-info">
                <div class="attachment-card-title" title="${a.name}">${a.name}</div>
                <div class="attachment-card-size">${a.size || ''}</div>
            </div>
            <div class="attachment-action-overlay">
                <button class="attachment-action-btn">
                    📥 Abrir / Baixar
                </button>
            </div>
        </div>
        `;
    }).join('') + `</div>` : '<div style="display: flex; justify-content: center; align-items: center; width: 100%; padding: 20px; text-align: center; color: var(--text-muted); font-style: italic;">Nenhum anexo ainda</div>';

    // Subtasks
    const subtasks = t.subtasks || [];
    const subtaskProgress = getSubtaskProgress(t);
    const subtasksHtml = (t.subtasks || []).map(s => {
        // Check if it's a header item (ending in .0 or specific keywords)
        const isHeader = s.text.includes('.0') || s.text.startsWith('Countdown') || s.text.startsWith('## ');
        if (isHeader) {
            return `
            <div class="subtask-header" style="margin-top: 15px; margin-bottom: 5px; font-weight: 700; color: var(--primary); font-size: 1.05em; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 4px;">
                ${s.text.replace('## ', '')}
            </div>`;
        }
        return `
        <div class="subtask-item">
            <input type="checkbox" id="sub-${s.id}" ${s.completed ? 'checked' : ''} onchange="toggleSubtask('${t.id}', ${s.id})">
            <label for="sub-${s.id}" class="${s.completed ? 'completed' : ''}">${s.text}</label>
            <button class="btn-icon-small" onclick="deleteSubtask('${t.id}', ${s.id})">🗑️</button>
        </div>`;
    }).join('');

    let contentHtml = '';

    if (t.ti) {
        // TI Specific Details View
        contentHtml = `
            <div class="detail-section" style="background: rgba(59, 130, 246, 0.05); padding: 15px; border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.1);">
                <h4 style="color: var(--brand-primary); margin-bottom: 15px;">🖥️ Suporte TI</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Categoria</label>
                        <span>${t.ti.category || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Local</label>
                        <span>${t.ti.location || '-'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Presencial?</label>
                        <span>${t.ti.presence || '-'}</span>
                    </div>
                </div>
                <div class="detail-item full">
                    <label>Descrição do Problema</label>
                    <p>${t.ti.description || '-'}</p>
                </div>
            </div>
        `;
    } else {
        // Standard View
        contentHtml = `
            <div class="detail-section">
                <h4>Briefing</h4>
                <p>${t.briefing || '-'}</p>
            </div>
            <div class="detail-section">
                <h4>Referências</h4>
                <p>${t.referencias && t.referencias.startsWith('http') ? `<a href="${t.referencias}" target="_blank">Link de Referência</a>` : (t.referencias || '-')}</p>
            </div>
            ${t.subType === 'EVENTOS' ? `
            <div class="detail-section event-details">
                <h4>🎉 Detalhes do Evento</h4>
                <div class="detail-grid">
                    <div class="detail-item"><label>Data Evento</label><span>${formatDateFull(t.referenciasEventos.dataEvento) || '-'}</span></div>
                    <div class="detail-item"><label>Local</label><span>${t.referenciasEventos.localEvento || '-'}</span></div>
                    <div class="detail-item full"><label>Palestrantes</label><span>${t.referenciasEventos.palestrantes || '-'}</span></div>
                    ${t.referenciasEventos.videosAdicionais ? `<div class="detail-item full"><label>Vídeos Adicionais</label><span>${t.referenciasEventos.videosAdicionais}</span></div>` : ''}
                    ${t.referenciasEventos.artesAdicionais ? `<div class="detail-item full"><label>Artes Adicionais</label><span>${t.referenciasEventos.artesAdicionais}</span></div>` : ''}
                    ${t.referenciasEventos.demandaAdicional ? `<div class="detail-item full"><label>Demanda Adicional</label><span>${t.referenciasEventos.demandaAdicional}</span></div>` : ''}
                </div>
            </div>` : ''}
        `;
    }

    let entregaExplicitaHtml = '';
    const entregasIds = t.entregasUrl || (t.entregaUrl ? [t.entregaUrl] : []);

    if (entregasIds.length > 0) {
        if (t.entregaTipo === 'arte') {
            const galeriaHtml = entregasIds.map(url => `
                <a href="${url}" target="_blank">
                    <img src="${url}" style="max-height:150px; border-radius:8px; object-fit:contain; background:var(--surface-light); margin-right:8px; margin-bottom: 8px; border: 1px solid var(--border-subtle);">
                </a>
            `).join('');
            entregaExplicitaHtml = `<div class="detail-section" style="background: rgba(139, 92, 246, 0.05); padding: 15px; border-radius: 8px; border: 1px solid rgba(139, 92, 246, 0.2); margin-top: 15px;">
                <h4 style="color: var(--brand-primary); margin-bottom: 15px;">🎨 Conteúdo Entregue (Artes)</h4>
                <div style="display:flex; overflow-x:auto; padding: 8px 0;">${galeriaHtml}</div>
            </div>`;
        } else if (t.entregaTipo === 'video') {
            const videosHtml = entregasIds.map(url => {
                let videoHtml = `<div style="margin-top:8px;"><a href="${url}" target="_blank" style="color:var(--brand-primary); text-decoration:none; display:flex; align-items:center; gap:8px;">🔗 Acessar Link do Vídeo</a></div>`;
                if (url.includes('youtube.com') || url.includes('youtu.be')) {
                    let ytid = '';
                    if (url.includes('v=')) ytid = url.split('v=')[1]?.split('&')[0];
                    else if (url.includes('youtu.be/')) ytid = url.split('youtu.be/')[1]?.split('?')[0];

                    if (ytid) {
                        videoHtml = `<iframe width="100%" height="250" src="https://www.youtube.com/embed/${ytid}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius:8px; margin-top:8px; width:100%; margin-bottom: 16px;"></iframe>`;
                    }
                }
                return videoHtml;
            }).join('');
            entregaExplicitaHtml = `<div class="detail-section" style="background: rgba(239, 68, 68, 0.05); padding: 15px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.2); margin-top: 15px;">
                <h4 style="color: var(--video); margin-bottom: 15px;">🎥 Conteúdo Entregue (Vídeos)</h4>
                <div style="display:flex; flex-direction:column; gap:8px;">${videosHtml}</div>
            </div>`;
        }
    }

    document.getElementById('detailBody').innerHTML = `
    <div class="detail-grid">
            <div class="detail-item full"><label>Nome</label><span>${t.nome}</span></div>
            <div class="detail-item"><label>Status</label><span class="status-tag ${cls}">${t.status}</span></div>
            <div class="detail-item"><label>Prioridade</label><span>${t.prioridade}</span></div>
            <div class="detail-item"><label>Tipo</label><span>${t.tipoProjeto} ${t.subType ? `(${t.subType})` : ''}</span></div>
            <div class="detail-item"><label>Prazo</label><span>${formatDateFull(t.dataConclusao)}</span></div>
            <div class="detail-item full"><label>Solicitante</label><span>${sol?.nome || '?'}</span></div>
        </div>
        ${contentHtml}
        ${entregaExplicitaHtml}
        <div class="detail-section"><h4>🔄 Pipeline</h4><div class="pipeline-display">${pipeHtml}</div></div>

        ${t.feedback && t.feedback.length > 0 ? `
        <div class="alteration-feedback-alert">
            <div class="alteration-header">
                <span class="alteration-icon">⚠️</span>
                <h4>Alteração Solicitada</h4>
            </div>
            <div class="alteration-content">
                ${t.feedback.map(f => `
                    <div class="feedback-item">
                        <div class="feedback-date">${formatDateFull(f.data)}</div>
                        <p class="feedback-text">${f.texto}</p>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <div class="detail-tabs">
            <button class="detail-tab active" onclick="switchDetailTab('subtasks')"> ✓ Subtarefas (${subtasks.length})</button>
            <button class="detail-tab" onclick="switchDetailTab('comments')">💬 Comentários (${comments.length})</button>
            <button class="detail-tab ${attachments.length > 0 ? 'has-attachments' : ''}" onclick="switchDetailTab('attachments')">${attachments.length > 0 ? `<span style="color: #ef4444; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">📎 Anexos <span class="tab-notif-badge">${attachments.length}</span></span>` : `📎 Anexos (${attachments.length})`}</button>
        </div>
        
        <div class="detail-tab-content active" id="tabSubtasks">
            ${subtaskProgress ? `<div class="subtask-progress-bar"><div class="subtask-progress-fill" style="width:${subtaskProgress.percent}%"></div><span>${subtaskProgress.percent}% (${subtaskProgress.completed}/${subtaskProgress.total})</span></div>` : ''}
            <div class="subtask-list">${subtasksHtml}</div>
            <div class="subtask-form">
                <input type="text" class="subtask-input" id="newSubtaskText" placeholder="Nova subtarefa..." onkeypress="if(event.key==='Enter')addSubtaskUI('${id}')">
                <button class="btn-subtask" onclick="addSubtaskUI('${id}')">+ Adicionar</button>
            </div>
        </div>
        
        <div class="detail-tab-content" id="tabComments">
            <div class="comment-list">${commentsHtml}</div>
            <div class="comment-form">
                <textarea class="comment-input" id="newCommentText" placeholder="Escreva um comentário..." rows="2"></textarea>
                <button class="btn-comment" onclick="addComment('${id}')">Enviar</button>
            </div>
        </div>
        
        <div class="detail-tab-content" id="tabAttachments">
            <div class="attachment-list">${attachmentsHtml}</div>
            <div class="attachment-upload-area">
                <input type="file" id="fileUpload-${id}" style="display:none" onchange="handleFileUpload('${id}', this)" multiple>
                <button class="btn-upload" onclick="document.getElementById('fileUpload-${id}').click()">
                    📂 Selecionar Arquivos
                </button>
            </div>
        </div>
`;

    let footer = '';
    const status = t.status;
    const canDelete = currentUser.role === 'coordinator' || currentUser.role === 'social_media' || currentUser.role === 'gestor_equipe';
    const canEdit = canDelete; // coordinator e social_media podem editar
    const currentStage = t.pipeline[t.currentStage];
    const isExecutorOnTask = (currentStage?.userId === currentUser.id) || (!currentStage?.userId && currentStage?.userIds && currentStage.userIds.includes(currentUser.id));
    // Qualquer participante do pipeline, coordinator ou social_media pode mudar status
    const canChangeStatus = isExecutorOnTask || currentUser.role === 'coordinator' || currentUser.role === 'social_media' || currentUser.role === 'gestor_equipe' || isGlobalCoordinator();

    if (canChangeStatus) {
        const deleteBtn = canDelete ? `<button class="btn-delete" onclick="deleteTask('${id}')">Excluir</button>` : '';
        const editBtn = canEdit ? `<button class="btn-edit" onclick="openEditModal('${id}')">✏️ Editar</button>` : '';

        if (status === 'Aprovado') {
            footer = `${editBtn}${deleteBtn}<button class="btn-cancel" onclick="closeModal('modalDetail')">Fechar</button>`;
        } else if (status === 'A fazer') {
            footer = `${editBtn}${deleteBtn}<button class="btn-cancel" onclick="closeModal('modalDetail')">Fechar</button> <button class="btn-primary" onclick="startExecution('${id}')">Iniciar Demanda</button>`;
        } else if (status === 'Fazendo') {
            // Se tem feedbacks pendentes, a demanda voltou de alteração — mostra "Reenviar"
            const hasFeedback = t.feedback && t.feedback.length > 0;
            if (hasFeedback) {
                footer = `${editBtn}${deleteBtn}<button class="btn-cancel" onclick="closeModal('modalDetail')">Fechar</button> <button class="btn-success" onclick="submitCorrection('${id}')">Reenviar para Aprovação</button>`;
            } else {
                footer = `${editBtn}${deleteBtn}<button class="btn-cancel" onclick="closeModal('modalDetail')">Fechar</button> <button class="btn-success" onclick="submitForReview('${id}')">Encerrar Demanda</button>`;
            }
        } else if (status === 'Alteração') {
            footer = `${editBtn}${deleteBtn}<button class="btn-cancel" onclick="closeModal('modalDetail')">Fechar</button> <button class="btn-secondary" onclick="startExecution('${id}')">Reiniciar Demanda</button> <button class="btn-success" onclick="submitCorrection('${id}')">Reenviar para Aprovação</button>`;
        } else if (status === 'Para aprovação') {
            const canReviewHere = isGlobalCoordinator() || currentUser.role === 'coordinator' || currentUser.role === 'social_media' || currentUser.role === 'gestor_equipe' || t.solicitanteId === currentUser.id;
            if (canReviewHere) {
                footer = `${editBtn}${deleteBtn}<button class="btn-cancel" onclick="closeModal('modalDetail')">Fechar</button> <button class="btn-success" onclick="openReviewFromDetail('${id}')">Revisar Demanda</button>`;
            } else {
                footer = `${editBtn}${deleteBtn}<button class="btn-cancel" onclick="closeModal('modalDetail')">Aguardando aprovação...</button>`;
            }
        } else {
            footer = `${editBtn}${deleteBtn}<button class="btn-cancel" onclick="closeModal('modalDetail')">Fechar</button>`;
        }
    } else {
        footer = `<button class="btn-cancel" onclick="closeModal('modalDetail')">Fechar</button>`;
    }
    document.getElementById('detailFooter').innerHTML = footer;
    document.getElementById('modalDetail').classList.add('active');
}

// Add subtask from UI
function addSubtaskUI(taskId) {
    const input = document.getElementById('newSubtaskText');
    const text = input.value.trim();
    if (!text) return;
    addSubtask(taskId, text);
    input.value = '';
    openDetail(taskId);
    toast('Subtarefa adicionada', 'success');
}

// Switch tabs in detail modal
function switchDetailTab(tab) {
    event?.stopPropagation();
    document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.detail-tab-content').forEach(c => c.classList.remove('active'));

    const tabs = ['subtasks', 'comments', 'attachments'];
    const idx = tabs.indexOf(tab);
    if (idx >= 0) {
        document.querySelectorAll('.detail-tab')[idx].classList.add('active');
        document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add('active');
    }
}

// Add comment to task
function addComment(taskId) {
    event?.stopPropagation();
    const text = document.getElementById('newCommentText').value.trim();
    if (!text) { toast('Digite um comentário', 'warning'); return; }
    const task = demandas.find(d => d.id === taskId);
    if (!task) return;
    if (!task.comments) task.comments = [];
    task.comments.push({
        userId: currentUser.id,
        text: text,
        date: new Date().toISOString()
    });
    saveData();
    openDetail(taskId);
    toast('Comentário adicionado', 'success');
}

// Handle real file upload
async function handleFileUpload(taskId, input) {
    event?.stopPropagation();
    const task = demandas.find(d => d.id === taskId);
    if (!task) return;
    if (!task.attachments) task.attachments = [];

    const files = input.files;
    if (!files || files.length === 0) return;

    toast('⏳ Enviando arquivo(s)...', 'info');
    const btnUpload = input.nextElementSibling;
    if (btnUpload) btnUpload.disabled = true;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Determine file type
        let type = 'doc';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type === 'application/pdf') type = 'pdf';
        else if (file.type.startsWith('video/')) type = 'video';

        const storageRef = window.ref(window.firebaseStorage, `arquivos_demandas/${taskId}/${Date.now()}_${file.name}`);
        try {
            await window.uploadBytes(storageRef, file);
            const docUrl = await window.getDownloadURL(storageRef);

            task.attachments.push({
                name: file.name,
                type: type,
                size: (file.size / 1024).toFixed(1) + ' KB',
                date: new Date().toISOString(),
                uploadedBy: currentUser.nome,
                url: docUrl
            });
        } catch (upErr) {
            console.error('Erro no upload:', upErr);
            toast('Erro ao enviar ' + file.name, 'error');
        }
    }

    if (btnUpload) btnUpload.disabled = false;
    saveData();
    input.value = ''; // Reset input
    openDetail(taskId);
    toast(`${files.length} arquivo(s) anexado(s)`, 'success');
}

function startExecution(id) {
    const t = demandas.find(d => d.id === id);
    if (!t) return;
    const stage = t.pipeline[t.currentStage];

    // Set startedAt if first time
    if (!stage.startedAt) {
        stage.startedAt = new Date().toISOString();
    }

    // Delegate to central logic (Handles Timer Start)
    changeTaskStatus(id, 'Fazendo');

    addHistory(id, 'execution', 'Iniciou execução da etapa ' + stage.dept);

    closeModal('modalDetail');
    refresh();
}

function submitForReview(id) {
    openDeliveryModal(id, 'review');
}

function submitCorrection(id) {
    openDeliveryModal(id, 'correction');
}

// Modal de Entrega — pede arquivo/link antes de enviar para aprovação
function openDeliveryModal(taskId, mode) {
    // Remove modal anterior se existir
    const existing = document.getElementById('modalDelivery');
    if (existing) existing.remove();

    const t = demandas.find(d => d.id === taskId);
    if (!t) return;

    const title = mode === 'correction' ? 'Reenviar para Aprovação' : 'Encerrar e Enviar para Aprovação';
    const subtitle = mode === 'correction' ? 'Anexe o arquivo corrigido ou link atualizado' : 'Anexe o arquivo finalizado ou link de entrega';

    const modal = document.createElement('div');
    modal.className = 'modal-backdrop active';
    modal.id = 'modalDelivery';
    modal.innerHTML = `
        <div class="modal" style="max-width: 520px; animation: slideUp 0.3s ease;">
            <div class="modal-header" style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="
                        width: 42px; height: 42px; border-radius: 12px;
                        background: linear-gradient(135deg, #6c5ce7, #a78bfa);
                        display: flex; align-items: center; justify-content: center;
                        font-size: 20px;
                    ">📎</div>
                    <div>
                        <h2 style="font-size: 1.1rem; margin: 0;">${title}</h2>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0;">${subtitle}</p>
                    </div>
                </div>
                <button class="modal-close" onclick="closeModal('modalDelivery')">×</button>
            </div>
            <div class="modal-body" style="padding: 24px;">
                <div style="
                    background: rgba(108, 92, 231, 0.06);
                    border: 1px solid rgba(108, 92, 231, 0.12);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 20px;
                ">
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
                        📄 Demanda: <strong style="color: var(--text-body);">${t.nome}</strong>
                    </p>
                </div>

                <div class="form-group" style="margin-bottom: 16px;">
                    <label style="font-weight: 600; margin-bottom: 6px; display: block;">
                        🔗 Link do Arquivo (Google Drive, Canva, etc.)
                    </label>
                    <input type="text" id="deliveryLink" class="form-input"
                        placeholder="https://drive.google.com/..." 
                        style="width: 100%; padding: 12px 16px; border-radius: 10px; background: var(--bg-base); border: 1px solid var(--border-subtle); color: var(--text-body); font-size: 0.9rem;"
                    >
                </div>

                <div class="form-group">
                    <label style="font-weight: 600; margin-bottom: 6px; display: block;">
                        💬 Observações (opcional)
                    </label>
                    <textarea id="deliveryNote" class="form-input" rows="3"
                        placeholder="Adicione observações sobre a entrega..."
                        style="width: 100%; padding: 12px 16px; border-radius: 10px; background: var(--bg-base); border: 1px solid var(--border-subtle); color: var(--text-body); font-size: 0.9rem; resize: vertical;"
                    ></textarea>
                </div>
            </div>
            <div class="modal-footer" style="padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; gap: 12px; justify-content: flex-end;">
                <button class="btn-cancel" onclick="closeModal('modalDelivery')">Cancelar</button>
                <button class="btn-success" onclick="confirmDelivery('${taskId}', '${mode}')" style="
                    display: flex; align-items: center; gap: 8px;
                    padding: 10px 24px; border-radius: 10px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    border: none; color: white; font-weight: 600; cursor: pointer;
                    transition: all 0.2s ease;
                ">
                    🚀 Enviar para Aprovação
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    // Focus no input de link
    setTimeout(() => document.getElementById('deliveryLink')?.focus(), 100);
}

async function confirmDelivery(taskId, mode) {
    const link = document.getElementById('deliveryLink')?.value.trim() || '';
    const note = document.getElementById('deliveryNote')?.value.trim() || '';

    const t = demandas.find(d => d.id === taskId);
    if (!t) return;

    // Salva link e nota na demanda
    if (link) {
        t.deliveryLink = link;
        t.deliveryDate = new Date().toISOString();
    }
    if (note) {
        t.deliveryNote = note;
    }

    // Envia para aprovação
    changeTaskStatus(taskId, 'Para aprovação');

    // Histórico
    const historyMsg = link
        ? `Entrega enviada para aprovação${note ? ` — "${note}"` : ''} | Link: ${link}`
        : `Enviado para aprovação${note ? ` — "${note}"` : ''}`;

    addHistory(taskId, mode === 'correction' ? 'action' : 'timer',
        mode === 'correction' ? `Correção reenviada: ${historyMsg}` : historyMsg
    );

    // Salva no Firebase
    try {
        await window.db.collection('demandas').doc(taskId).update({
            deliveryLink: link || null,
            deliveryNote: note || null,
            deliveryDate: link ? new Date().toISOString() : null,
            status: 'Para aprovação'
        });
    } catch (e) {
        console.error('Erro ao salvar entrega:', e);
    }

    closeModal('modalDelivery');
    closeModal('modalDetail');
    refresh();
    toast(mode === 'correction' ? 'Correção reenviada com sucesso!' : 'Demanda enviada para aprovação!', 'success');
}

function undoSubmission(id) {
    const t = demandas.find(d => d.id === id);
    if (!t) return;
    t.pipeline[t.currentStage].status = 'Alteração';
    t.status = 'Alteração';
    addHistory(id, 'action', 'Envio cancelado pelo executor');
    saveData();
    closeModal('modalDetail');
    toast('Envio cancelado. Voltou para Alteração.', 'info');
    refresh();
}
async function deleteTask(id) { if (!confirm('Excluir?')) return; demandas = demandas.filter(d => d.id !== id); try { await window.deleteDoc(window.doc(window.firebaseDb, "demandas", id)); } catch (e) { } localStorage.setItem('workflowPNSA', JSON.stringify(demandas)); closeModal('modalDetail'); toast('Demanda excluída', 'info'); refresh(); }

function openReviewModal(id) {
    event?.stopPropagation();
    const t = demandas.find(d => d.id === id); if (!t) return;
    currentTaskId = id;
    const s = t.pipeline[t.currentStage], u = USERS[s.userId];

    let entregaVisual = '';
    const entregasIds = t.entregasUrl || (t.entregaUrl ? [t.entregaUrl] : []);

    if (entregasIds.length > 0) {
        if (t.entregaTipo === 'arte') {
            const galeriaHtml = entregasIds.map(url => `
                <a href="${url}" target="_blank">
                    <img src="${url}" style="max-height:200px; border-radius:8px; object-fit:contain; background:var(--surface-light); margin-right:8px; margin-bottom: 8px;">
                </a>
            `).join('');
            entregaVisual = `<div style="margin-top:16px; width:100%;"><h4>Arte(s) Entregue(s)</h4><div style="display:flex; overflow-x:auto; padding: 8px 0;">${galeriaHtml}</div></div>`;
        } else if (t.entregaTipo === 'video') {
            const videosHtml = entregasIds.map(url => {
                let videoHtml = `<div style="margin-top:8px;"><a href="${url}" target="_blank" style="color:var(--brand-primary); text-decoration:none; display:flex; align-items:center; gap:8px;">🔗 Acessar Link do Vídeo</a></div>`;
                if (url.includes('youtube.com') || url.includes('youtu.be')) {
                    let ytid = '';
                    if (url.includes('v=')) ytid = url.split('v=')[1]?.split('&')[0];
                    else if (url.includes('youtu.be/')) ytid = url.split('youtu.be/')[1]?.split('?')[0];

                    if (ytid) {
                        videoHtml = `<iframe width="100%" height="250" src="https://www.youtube.com/embed/${ytid}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius:8px; margin-top:8px; width:100%; margin-bottom: 16px;"></iframe>`;
                    }
                }
                return videoHtml;
            }).join('');
            entregaVisual = `<div style="margin-top:16px; width:100%;"><h4>Vídeo(s) Entregue(s)</h4><div style="display:flex; flex-direction:column; gap:8px;">${videosHtml}</div></div>`;
        }
    }

    document.getElementById('reviewInfo').innerHTML = `<div class="detail-item full" style="margin-bottom:16px;"><label>Demanda</label><span><strong>${t.id}</strong> - ${t.nome}</span></div> <div class="detail-grid"><div class="detail-item"><label>Etapa</label><span>${s.dept}</span></div><div class="detail-item"><label>Responsável</label><span>${u?.nome || '?'}</span></div></div>${entregaVisual}`;
    document.getElementById('reviewFeedback').value = '';
    document.getElementById('modalReview').classList.add('active');
}

// Open edit modal for Social Media / Coordinator
function openEditModal(id) {
    const role = currentUser?.role;
    if (role !== 'social_media' && role !== 'coordinator' && !isGlobalCoordinator()) {
        toast('Você não tem permissão para editar demandas.', 'error');
        return;
    }
    closeModal('modalDetail');
    const t = demandas.find(d => d.id === id);
    if (!t) return;

    document.getElementById('editTaskId').value = id;
    document.getElementById('editNome').value = t.nome;
    document.getElementById('editPrioridade').value = t.prioridade;
    document.getElementById('editDataConclusao').value = t.dataConclusao;
    document.getElementById('editBriefing').value = t.briefing || '';
    document.getElementById('editOrientacoes').value = t.orientacoes || '';

    // Dynamically populate selects for each pipeline stage department
    const container = document.getElementById('editPipelineSelects');
    container.innerHTML = '';

    const deptIcons = { 'Gestão': '◆', 'Social Media': '📱', 'Designer': '🎨', 'Videomaker': '🎬', 'Transmissão': '🎥', 'Suporte': '🛠️', 'Inovação/TI': '💡' };

    t.pipeline.forEach((stage, idx) => {
        const dept = stage.dept;
        const icon = deptIcons[dept] || '📁';

        // Find all users belonging to this department
        const allUsers = Object.values(USERS);
        const deptUsers = allUsers.filter(u => {
            let userDepts = [];
            if (Array.isArray(u.dept)) {
                userDepts = u.dept;
            } else if (typeof u.dept === 'string') {
                userDepts = u.dept.split(',').map(d => d.trim());
            } else {
                userDepts = [u.dept];
            }
            return userDepts.includes(dept);
        });

        const wrapper = document.createElement('div');
        wrapper.className = 'form-group';
        wrapper.style.flex = '1';
        wrapper.style.minWidth = '200px';

        const label = document.createElement('label');
        label.textContent = `${icon} ${dept} (Etapa ${idx + 1})`;
        label.style.fontWeight = '600';

        const select = document.createElement('select');
        select.id = `editPipeline_${idx}`;
        
        // Regra do Gestor de Equipe: só pode alterar executores do seu próprio departamento
        if (currentUser.role === 'gestor_equipe') {
            const gestorDepts = Array.isArray(currentUser.dept) ? currentUser.dept : [currentUser.dept];
            if (!gestorDepts.includes(dept)) {
                select.disabled = true;
                select.title = "Apenas gestores deste departamento podem alterar este responsável.";
            }
        }

        select.innerHTML = '<option value="">Selecione...</option>' +
            deptUsers.map(u => `<option value="${u.id}" ${u.id === stage.userId ? 'selected' : ''}>${u.nome}</option>`).join('');

        wrapper.appendChild(label);
        wrapper.appendChild(select);
        container.appendChild(wrapper);
    });

    document.getElementById('modalEdit').classList.add('active');
}

// Save edited task
function saveEditTask() {
    const id = document.getElementById('editTaskId').value;
    const t = demandas.find(d => d.id === id);
    if (!t) return;

    t.nome = document.getElementById('editNome').value.trim();
    t.prioridade = document.getElementById('editPrioridade').value;
    t.dataConclusao = document.getElementById('editDataConclusao').value;
    t.briefing = document.getElementById('editBriefing').value.trim();
    t.orientacoes = document.getElementById('editOrientacoes').value.trim();

    // Update executors in pipeline dynamically
    t.pipeline.forEach((stage, idx) => {
        const select = document.getElementById(`editPipeline_${idx}`);
        if (select && select.value) {
            const oldUserId = stage.userId;
            const newUserId = select.value;
            stage.userId = newUserId;
            if (oldUserId !== newUserId) {
                addHistory(id, 'reassign', `${stage.dept}: ${USERS[oldUserId]?.nome || '?'} → ${USERS[newUserId]?.nome || '?'} (por ${currentUser.nome})`);
                
                // Dispara notificações de reatribuição para os executores envolvidos
                if (oldUserId && oldUserId !== currentUser.id) {
                    notifyUser(oldUserId, '🔀', `Você foi removido da etapa de ${stage.dept} na demanda: "${t.nome}"`);
                }
                if (newUserId && newUserId !== currentUser.id) {
                    notifyUser(newUserId, '🔀', `Você assumiu a etapa de ${stage.dept} na demanda: "${t.nome}"`);
                }
            }
        }
    });

    addHistory(id, 'edit', `Demanda editada por ${currentUser.nome}`);

    // Notificar responsável atual da pipeline
    const currentStageUser = t.pipeline[t.currentStage]?.userId;
    if (currentStageUser && currentStageUser !== currentUser.id) {
        notifyUser(currentStageUser, '✏️', `Demanda editada: "${t.nome}" — alterada por ${currentUser.nome}`);
    }
    // Notificar solicitante (se não for quem editou)
    if (t.solicitanteId && t.solicitanteId !== currentUser.id && t.solicitanteId !== currentStageUser) {
        notifySolicitante(t, '✏️', `Demanda editada: "${t.nome}" — alterada por ${currentUser.nome}`);
    }

    saveData(t);
    closeModal('modalEdit');
    toast('Demanda atualizada com sucesso!', 'success');
    refresh();
}

function openReviewFromDetail(id) { closeModal('modalDetail'); setTimeout(() => openReviewModal(id), 200); }

function rejectTask() {
    // Prevent double-click
    const btn = document.getElementById('btnReject');
    if (btn.disabled) return;
    btn.disabled = true;

    const t = demandas.find(d => d.id === currentTaskId);
    if (!t) { btn.disabled = false; return; }

    const fb = document.getElementById('reviewFeedback').value.trim();
    if (!fb) { btn.disabled = false; return toast('Adicione feedback', 'error'); }

    // Update status — define como 'Alteração' para que apareça na aba correta e sinalize a necessidade de correção
    t.pipeline[t.currentStage].status = 'Alteração';
    // Timer: Se estava rodando, para. O executor deve retomar ao iniciar a correção.
    if (t.pipeline[t.currentStage].timerState) {
        t.pipeline[t.currentStage].timerState.running = false;
        t.pipeline[t.currentStage].timerState.lastStart = null;
    }
    t.status = 'Alteração';
    t.lastStatusChange = new Date().toISOString();
    t.feedback.push({ data: new Date().toISOString(), texto: fb });

    // Notify the executor that changes are needed
    const executorId = t.pipeline[t.currentStage].userId;
    notifyUser(executorId, '🔄', `Alteração solicitada: ${t.nome} - ${currentUser.nome} pediu correção`);

    saveData();
    closeModal('modalReview');
    btn.disabled = false;
    toast('Alteração solicitada ao executor', 'info');
    refresh();
}


function approveTask() {
    // Prevent double-click
    const btn = document.getElementById('btnApprove');
    if (btn.disabled) return;
    btn.disabled = true;

    const t = demandas.find(d => d.id === currentTaskId);
    if (!t) { btn.disabled = false; return; }

    const fb = document.getElementById('reviewFeedback').value.trim();
    if (fb) t.feedback.push({ data: new Date().toISOString(), texto: fb });

    // Get current stage executor to notify them
    const currentStageUser = t.pipeline[t.currentStage].userId;

    t.pipeline[t.currentStage].status = 'Aprovado';
    t.lastStatusChange = new Date().toISOString();

    if (t.currentStage < t.pipeline.length - 1) {
        // Notify current stage executor that it was approved
        notifyUser(currentStageUser, '✅', `Aprovado: ${t.nome} - ${currentUser.nome} aprovou sua etapa`);

        t.currentStage++;
        t.pipeline[t.currentStage].status = 'A fazer';
        t.status = 'A fazer';

        // Notify next stage user that they have a new task
        const nextStageUser = t.pipeline[t.currentStage].userId;
        notifyUser(nextStageUser, '📥', `Nova tarefa: ${t.nome} - A FAZER sua execução`);

        toast(`Aprovado! Passou para ${t.pipeline[t.currentStage].dept} `, 'success');
    } else {
        t.status = 'Aprovado';

        // Notify executor that it was approved
        notifyUser(currentStageUser, '🎉', `Aprovado: ${t.nome} - ${currentUser.nome} aprovou`);

        // Notify solicitante that demand is fully completed
        notifySolicitante(t, '✅', `Concluída: ${t.nome} - todas as etapas finalizadas!`);

        toast('Demanda concluída!', 'success');
    }
    saveData();
    closeModal('modalReview');
    document.getElementById('btnApprove').disabled = false;
    refresh();
}

function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function getStatusClass(s) { const m = { 'A fazer': 'a-fazer', 'Fazendo': 'fazendo', 'Para aprovação': 'aprovacao', 'Alteração': 'alteracao', 'Aprovado': 'aprovado' }; return m[s] || 'a-fazer'; }

function parseDateLocal(d) { if(!d) return new Date(); return new Date(d.length === 10 ? d + 'T12:00:00' : d); }
function getPriorityWeight(prio) {
    if (!prio) return 1;
    const p = prio.toLowerCase().trim();
    if (p === 'crítico' || p === 'critico') return 5;
    if (p === 'urgente') return 4;
    if (p === 'alta') return 3;
    if (p === 'média' || p === 'media') return 2;
    if (p === 'normal') return 1;
    if (p === 'baixa') return 0;
    return 1;
}
function sortTasksByDateAndPriority(tasks) {
    if (!Array.isArray(tasks)) return tasks;
    return tasks.sort((a, b) => {
        const valA = a.dataConclusao || '';
        const valB = b.dataConclusao || '';
        if (valA !== valB) {
            if (valA && valB) {
                return valA.localeCompare(valB);
            }
            return valA ? -1 : 1;
        }
        return getPriorityWeight(b.prioridade) - getPriorityWeight(a.prioridade);
    });
}
function formatDate(d) {
    if (!d) return '-'; const dt = parseDateLocal(d); return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;
}
function formatDateFull(d) { if (!d) return '-'; const dt = parseDateLocal(d); return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`; }
function toast(msg, type = 'info') { const a = document.getElementById('toastArea'), icons = { success: '✓', error: '✗', info: 'ℹ' }, t = document.createElement('div'); t.className = `toast ${type}`; t.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`; a.appendChild(t); setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3500); }
function refresh() {
    updateMinhaArea(); // Always update dashboard stats
    updateBadges(); // Always update sidebar badges

    // GLOBAL INCIDENT BANNER LOGIC
    const incidentDoc = demandas.find(d => d.id === 'GLOBAL_ALERT_TI');
    let banner = document.getElementById('globalIncidentBanner');
    const btnIncident = document.getElementById('btnIncident');
    
    if (incidentDoc && incidentDoc.status === 'ACTIVO') {
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'globalIncidentBanner';
            banner.style.cssText = 'background: rgba(239,68,68,0.95); font-family: "Inter", sans-serif; border-bottom: 2px solid #ef4444; padding: 16px 24px; color: #fff; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 16px; position: fixed; top: 0; left: 0; right: 0; z-index: 1000000; box-shadow: 0 4px 15px rgba(239,68,68,0.5); animation: urgentGlow 2s infinite alternate; text-align: center;';
            document.body.appendChild(banner);
        }
        banner.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin: 0 auto; max-width: 1200px; width: 100%;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 24px;"></i> 
                    <div style="text-align: left;">
                        <h3 style="margin:0; font-size:16px; color:#fff; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">ALERTA GLOBAL DE TI</h3>
                        <p style="margin:4px 0 0 0; font-size:14px; font-weight:500; color:#fee2e2; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${incidentDoc.descricaoCartao || 'Instabilidade nos sistemas. Estamos verificando.'}</p>
                    </div>
                </div>
                ${(currentUser?.role === 'coordinator' || isGlobalCoordinator() || currentDept === 'Inovação/TI') ? 
                    `<button onclick="window.toggleGlobalIncident()" style="background: #fff; color: #ef4444; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 800; cursor: pointer; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">MARCAR COMO RESOLVIDO</button>` : ''}
            </div>`;
        if (btnIncident) {
            btnIncident.classList.add('active-alert');
            btnIncident.innerHTML = '🛑 Desativar Alerta Global';
            btnIncident.style.background = '#ef4444';
            btnIncident.style.color = '#ffffff';
        }
    } else {
        if (banner) banner.remove();
        if (btnIncident) {
            btnIncident.classList.remove('active-alert');
            btnIncident.innerHTML = '🚨 Disparar Alerta Global';
            btnIncident.style.background = 'rgba(239,68,68,0.15)';
            btnIncident.style.color = '#f87171';
        }
    }

    // Intelligent refresh based on current view
    if (currentView === 'board' && currentDept) {
        if (currentDept === 'Suporte') renderSuporteDashboard(false);
        else renderBoard();
    }
    else if (currentView === 'minha-agenda') renderAgenda();
    else if (currentView === 'kanban') renderKanban();
    else if (currentView === 'quadro-geral') renderQuadroGeral();
    else if (currentView === 'timeline') renderTimeline();
    else if (currentView === 'analytics') renderAnalytics();
    else if (currentView === 'requests') renderRequests();
    else if (currentView === 'review') renderReview();
    else if (currentView === 'tasks') renderTasks();
    else if (currentView === 'workload') renderWorkload();
}

// =============================================
// THEME SYSTEM (Dark, Light, Monday)
// =============================================
let currentTheme = localStorage.getItem('sgta-theme') || 'monday';

function toggleThemeMenu() {
    const menu = document.getElementById('themeMenu');
    menu.classList.toggle('active');
}

function setTheme(theme) {
    currentTheme = theme;
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-monday');
    document.body.classList.add(`theme-${theme}`);

    const icons = { dark: '\uD83C\uDF19', light: '\u2600\uFE0F', monday: '\uD83D\uDE80' };
    document.getElementById('themeIcon').textContent = icons[theme] || '\uD83C\uDFA8';

    localStorage.setItem('sgta-theme', theme);
    document.getElementById('themeMenu').classList.remove('active');

    const names = { dark: 'Escuro', light: 'Claro', monday: 'Monday' };
    toast(`Tema ${names[theme]} aplicado`, 'info');
}

function initTheme() {
    document.body.classList.add(`theme-${currentTheme}`);
    const icons = { dark: '\uD83C\uDF19', light: '\u2600\uFE0F', monday: '\uD83D\uDE80' };
    document.getElementById('themeIcon').textContent = icons[currentTheme] || '🎨';
}

// =============================================
// GLOBAL SEARCH
// =============================================
function globalSearchHandler(event) {
    const query = event.target.value.toLowerCase().trim();
    const resultsEl = document.getElementById('searchResults');

    if (query.length < 2) {
        resultsEl.innerHTML = '';
        resultsEl.style.display = 'none';
        return;
    }

    const results = demandas.filter(d =>
        d.nome.toLowerCase().includes(query) ||
        d.id.toLowerCase().includes(query) ||
        d.tipoProjeto.toLowerCase().includes(query) ||
        d.briefing?.toLowerCase().includes(query)
    ).slice(0, 8);

    if (!results.length) {
        resultsEl.innerHTML = '<div class="search-empty">Nenhum resultado encontrado</div>';
    } else {
        resultsEl.innerHTML = results.map(r => `
            <div class="search-item" onclick="openDetail('${r.id}'); closeSearch();">
                <span class="search-item-id">${r.id}</span>
                <span class="search-item-name">${r.nome}</span>
                <span class="search-item-status ${getStatusClass(r.status)}">${r.status}</span>
            </div>
        `).join('');
    }
    resultsEl.style.display = 'block';
}

function closeSearch() {
    document.getElementById('globalSearch').value = '';
    document.getElementById('searchResults').style.display = 'none';
}

// =============================================
// INDEPENDENT GLOBAL TIMER
// =============================================
let timerInterval = null;

function toggleTimer() {
    const isRunning = localStorage.getItem('sgta-timer-running') === 'true';
    if (isRunning) {
        stopTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);

    // Set state
    const now = Date.now();
    localStorage.setItem('sgta-timer-start', now);
    localStorage.setItem('sgta-timer-running', 'true');

    document.getElementById('headerTimer').classList.add('running');
    toast('Cronômetro iniciado', 'info');

    timerInterval = setInterval(updateTimerDisplay, 1000);
    updateTimerDisplay();
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;

    const start = parseInt(localStorage.getItem('sgta-timer-start') || '0');
    const now = Date.now();
    const elapsed = Math.floor((now - start) / 1000);

    // Format time for toast
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    const timeStr = `${h}h ${m}m ${s}s`;

    toast(`Tempo finalizado: ${timeStr}`, 'success');

    // RESET completely
    localStorage.removeItem('sgta-timer-start');
    localStorage.removeItem('sgta-timer-running');

    document.getElementById('headerTimer').classList.remove('running');
    document.getElementById('timerDisplay').textContent = '00:00:00';
}

function updateTimerDisplay() {
    const isRunning = localStorage.getItem('sgta-timer-running') === 'true';
    const start = parseInt(localStorage.getItem('sgta-timer-start') || '0');

    if (isRunning && start) {
        const now = Date.now();
        const diff = Math.floor((now - start) / 1000);

        const h = String(Math.floor(diff / 3600)).padStart(2, '0');
        const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
        const s = String(diff % 60).padStart(2, '0');

        const display = document.getElementById('timerDisplay');
        if (display) display.textContent = `${h}:${m}:${s}`;

        const headerTimer = document.getElementById('headerTimer');
        if (headerTimer && !headerTimer.classList.contains('running')) {
            headerTimer.classList.add('running');
        }
    } else {
        // If not running, ensure 00:00:00
        const display = document.getElementById('timerDisplay');
        if (display) display.textContent = '00:00:00';
    }
}

// Init Timer on Load
document.addEventListener('DOMContentLoaded', () => {
    // Check if was running
    if (localStorage.getItem('sgta-timer-running') === 'true') {
        timerInterval = setInterval(updateTimerDisplay, 1000);
        updateTimerDisplay();
    }
});

// =============================================
// NOTIFICATIONS
// =============================================
let notifications = [];

let _prevNotifIds = new Set();
function startNotificationsListener() {
    if (!currentUser?.id) return;

    // Solicita permissão para notificações nativas do SO (Windows/macOS)
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    // Escuta na Nuvem apenas as notificações destinadas a mim
    const q = window.query(
        window.collection(window.firebaseDb, "notifications"),
        window.where("usuarioDestinatarioId", "==", currentUser.id)
    );

    window.onSnapshot(q, (snapshot) => {
        const novos = [];
        snapshot.forEach(doc => {
            novos.push({ id: doc.id, ...doc.data() });
        });

        // Ordena para que os alertas mais novos subam na gaveta
        notifications = novos.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Detecta notificações REALMENTE novas (que não existiam antes)
        if (_prevNotifIds.size > 0) {
            const newOnes = novos.filter(n => !_prevNotifIds.has(n.id) && !n.read);
            newOnes.forEach(n => showNotifToast(n));
        }
        _prevNotifIds = new Set(novos.map(n => n.id));

        updateNotificationBadge();

        // Se eu estiver com a aba aberta, atualizar os blocos HTML ativamente
        if (document.getElementById('notificationsPanel')?.classList.contains('active')) {
            renderNotifications();
        }
    }, (error) => {
        console.error("Erro no onSnapshot de Notificações:", error);
    });
}

function toggleNotifications() {
    const panel = document.getElementById('notificationsPanel');
    panel.classList.toggle('active');
    renderNotifications();
}

function renderNotifications() {
    const list = document.getElementById('notifList');
    if (!notifications.length) {
        list.innerHTML = '<div class="notif-empty">Nenhuma notificação</div>';
        return;
    }

    // Mark as read when viewed on Firebase
    notifications.forEach(n => {
        if (!n.read) {
            window.setDoc(window.doc(window.firebaseDb, "notifications", n.id), { ...n, read: true }).catch(e => console.error(e));
        }
    });

    list.innerHTML = notifications.slice(0, 20).map(n => {
        let clickAction = '';
        if (n.taskId) {
            clickAction = `onclick="openDetail('${n.taskId}'); toggleNotifications();"`;
        } else {
            // Extract Task ID from the notification text if possible, assuming "WF-XXXX" is in the text somewhere
            const matchId = n.text.match(/(WF-\d{4})/);
            if (matchId) {
                clickAction = `onclick="openDetail('${matchId[0]}'); toggleNotifications();"`;
            } else {
                // Try to find by demand name anywhere in the text
                const task = [...demandas].sort((a, b) => b.nome.length - a.nome.length).find(d => n.text.includes(d.nome) || (d.titulo && n.text.includes(d.titulo)));
                if (task) {
                    clickAction = `onclick="openDetail('${task.id}'); toggleNotifications();"`;
                }
            }
        }

        return `
        <div class="notif-item ${n.read ? 'read' : 'unread'}" ${clickAction} style="${clickAction ? 'cursor:pointer' : ''}">
            <div class="notif-icon-wrap">
                <span class="notif-icon">${n.icon}</span>
            </div>
            <div class="notif-content">
                <span class="notif-text">${n.text}</span>
                <span class="notif-time">${formatDateFull(n.date)}</span>
            </div>
            ${!n.read ? '<span class="notif-dot"></span>' : ''}
        </div>
    `}).join('');
}

async function addNotification(icon, text, targetUserId = null, taskId = null) {
    const finalTarget = targetUserId || currentUser?.id || null;
    if (!finalTarget) return;

    const notificationId = Date.now().toString() + Math.floor(Math.random() * 10000);
    const notificationObj = {
        icon,
        text,
        date: new Date().toISOString(),
        read: false,
        usuarioDestinatarioId: finalTarget,
        ...(taskId && { taskId })
    };

    try {
        await window.setDoc(window.doc(window.firebaseDb, "notifications", notificationId), notificationObj);
    } catch (e) {
        console.error("Erro ao enviar notificação pro Firebase:", e);
    }
}

// Get notifications for current user (kept for retro-compatibility naming)
function getMyNotifications() {
    return notifications;
}

function updateNotificationBadge() {
    const unread = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notifBadge');
    if (badge) {
        badge.textContent = unread;
        badge.style.display = unread ? 'flex' : 'none';
        // Pulsa o badge quando há não-lidas
        if (unread > 0) {
            badge.classList.add('has-new');
        } else {
            badge.classList.remove('has-new');
        }
    }
}

/** Exibe um toast de preview de notificação no canto inferior direito */
function showNotifToast(notification) {
    const container = document.getElementById('notifToastContainer');
    if (!container) return;

    const el = document.createElement('div');
    el.className = 'notif-toast';
    el.style.position = 'relative';
    el.innerHTML = `
        <span class="notif-toast-icon">${notification.icon || '🔔'}</span>
        <div class="notif-toast-body">
            <div class="notif-toast-title">Nova Notificação</div>
            <div class="notif-toast-text">${notification.text || ''}</div>
            <div class="notif-toast-time">Agora mesmo</div>
        </div>
        <div class="notif-toast-progress">
            <div class="notif-toast-progress-bar"></div>
        </div>
    `;

    // Clicar no toast abre o painel de notificações
    el.addEventListener('click', () => {
        el.classList.add('dismissing');
        setTimeout(() => el.remove(), 350);
        toggleNotifications();
    });

    container.appendChild(el);

    // Auto-dismiss após 5 segundos
    setTimeout(() => {
        if (el.parentNode) {
            el.classList.add('dismissing');
            setTimeout(() => el.remove(), 350);
        }
    }, 5000);

    // Dispara notificação NATIVA do SO (Windows/macOS) se o usuário permitiu
    if ('Notification' in window && Notification.permission === 'granted') {
        const plainText = (notification.text || '').replace(/<[^>]*>/g, '');
        const nativeNotif = new Notification('📋 Monday Manual', {
            body: plainText,
            icon: 'notif-icon.png',
            badge: 'notif-icon.png',
            tag: 'notif-' + Date.now(),
            silent: false
        });
        // Clicar na notificação nativa traz o foco para a aba do sistema
        nativeNotif.onclick = () => {
            window.focus();
            toggleNotifications();
            nativeNotif.close();
        };
    }
}

async function clearNotifications() {
    try {
        const promises = notifications.map(n =>
            window.deleteDoc(window.doc(window.firebaseDb, "notifications", n.id))
        );
        await Promise.all(promises);
        toast('Notificações limpas do servidor', 'info');
    } catch (e) {
        console.error("Erro ao limpar notificações:", e);
    }
}

// Notify specific user by their ID
function notifyUser(userId, icon, text) {
    addNotification(icon, text, userId);
}

// Notify all users in a department
function notifyDepartment(dept, icon, text) {
    const usersInDept = DEPT_USERS[dept] || [];
    usersInDept.forEach(userId => {
        addNotification(icon, text, userId);
    });
}

// Notify the solicitante (requester) of a task
function notifySolicitante(task, icon, text) {
    if (task.solicitanteId) {
        addNotification(icon, text, task.solicitanteId);
    }
}

// Notify the current stage responsible
function notifyCurrentResponsible(task, icon, text) {
    const stage = task.pipeline[task.currentStage];
    if (stage?.userId) {
        addNotification(icon, text, stage.userId);
    }
}

// =============================================
// HISTORY LOG
// =============================================
function addHistory(taskId, action, detail) {
    const task = demandas.find(d => d.id === taskId);
    if (!task) return;
    if (!task.history) task.history = [];
    task.history.push({
        userId: currentUser.id,
        action,
        detail,
        date: new Date().toISOString()
    });
    saveData();
}

function openHistoryModal(taskId) {
    const task = demandas.find(d => d.id === taskId);
    if (!task) return;
    const history = task.history || [];
    const list = document.getElementById('historyList');

    if (!history.length) {
        list.innerHTML = '<div class="history-empty">Nenhuma alteração registrada</div>';
    } else {
        list.innerHTML = history.map(h => {
            const u = USERS[h.userId] || { nome: 'Sistema', iniciais: '🤖' };
            return `
                <div class="history-item">
                    ${window.renderAvatar(u, 'history-avatar')}
                    <div class="history-body">
                        <span class="history-user">${u.nome}</span>
                        <span class="history-action">${h.detail}</span>
                        <span class="history-date">${formatDateFull(h.date)}</span>
                    </div>
                </div>
            `;
        }).reverse().join('');
    }

    document.getElementById('modalHistory').classList.add('active');
}

// =============================================
// EXPORT (PDF, Excel, CSV)
// =============================================
function openExportModal() {
    document.getElementById('modalExport').classList.add('active');
}

function exportData(format) {
    let content = '';
    const data = demandas.map(d => ({
        ID: d.id,
        Nome: d.nome,
        Status: d.status,
        Prioridade: d.prioridade,
        Tipo: d.tipoProjeto,
        Prazo: d.dataConclusao,
        Solicitante: USERS[d.solicitanteId]?.nome || '-'
    }));

    if (format === 'csv') {
        const headers = Object.keys(data[0] || {}).join(',');
        const rows = data.map(d => Object.values(d).join(','));
        content = [headers, ...rows].join('\n');
        downloadFile(content, 'sgta-export.csv', 'text/csv');
    } else if (format === 'excel') {
        // Simple TSV for Excel compatibility
        const headers = Object.keys(data[0] || {}).join('\t');
        const rows = data.map(d => Object.values(d).join('\t'));
        content = [headers, ...rows].join('\n');
        downloadFile(content, 'sgta-export.xls', 'application/vnd.ms-excel');
    } else if (format === 'pdf') {
        // Generate printable HTML
        const html = `
            <html><head><title>Radar PNSA - Relatório</title>
            <style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#333;color:white}</style>
            </head><body>
            <h1>📋 Radar PNSA - Relatório de Demandas</h1>
            <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
            <table><tr>${Object.keys(data[0] || {}).map(k => `<th>${k}</th>`).join('')}</tr>
            ${data.map(d => `<tr>${Object.values(d).map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}
            </table></body></html>
        `;
        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
        win.print();
    }

    closeModal('modalExport');
    toast(`Exportação ${format.toUpperCase()} concluída`, 'success');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// =============================================
// BACKUP & RESTORE
// =============================================
function openBackupModal() {
    const lastBackup = localStorage.getItem('sgta-last-backup');
    document.getElementById('lastBackupDate').textContent = lastBackup ? new Date(lastBackup).toLocaleString('pt-BR') : 'Nunca';
    document.getElementById('modalBackup').classList.add('active');
}

function downloadBackup() {
    const backup = {
        version: '1.0',
        date: new Date().toISOString(),
        demandas: demandas,
        nextId: nextId,
        notifications: notifications
    };
    const content = JSON.stringify(backup, null, 2);
    downloadFile(content, `sgta-backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    localStorage.setItem('sgta-last-backup', new Date().toISOString());
    closeModal('modalBackup');
    toast('Backup baixado com sucesso!', 'success');
}

function restoreBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const backup = JSON.parse(e.target.result);
            if (backup.demandas && Array.isArray(backup.demandas)) {
                demandas = backup.demandas;
                nextId = backup.nextId || demandas.length + 1;
                if (backup.notifications) {
                    notifications = backup.notifications;
                    localStorage.setItem('sgta-notifications', JSON.stringify(notifications));
                }
                saveData();
                closeModal('modalBackup');
                toast('Backup restaurado com sucesso!', 'success');
                refresh();
            } else {
                toast('Arquivo de backup inválido', 'error');
            }
        } catch (err) {
            toast('Erro ao ler backup', 'error');
        }
    };
    reader.readAsText(file);
}

// =============================================
// SUBTASKS (Checklists)
// =============================================
function addSubtask(taskId, text) {
    const task = demandas.find(d => d.id === taskId);
    if (!task) return;
    if (!task.subtasks) task.subtasks = [];
    task.subtasks.push({
        id: Date.now(),
        text: text,
        completed: false
    });
    saveData();
    addHistory(taskId, 'subtask', `Subtarefa adicionada: ${text}`);
}

function toggleSubtask(taskId, subtaskId) {
    const task = demandas.find(d => d.id === taskId);
    if (!task || !task.subtasks) return;
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (subtask) {
        subtask.completed = !subtask.completed;
        saveData(task);

        // Update UI immediately (Visual Strikethrough)
        const label = document.querySelector(`label[for="sub-${subtaskId}"]`);
        if (label) {
            if (subtask.completed) label.classList.add('completed');
            else label.classList.remove('completed');
        }

        // Update Progress Bar in Modal
        const sp = getSubtaskProgress(task);
        if (sp) {
            const pb = document.querySelector('.subtask-progress-fill');
            const ps = document.querySelector('.subtask-progress-bar span');
            if (pb && ps) {
                pb.style.width = sp.percent + '%';
                ps.textContent = sp.percent + '% (' + sp.completed + '/' + sp.total + ')';
            }
        }

        if (typeof refresh === 'function') refresh();
    }
}

function getSubtaskProgress(task) {
    if (!task.subtasks || !task.subtasks.length) return null;
    const completed = task.subtasks.filter(s => s.completed).length;
    return { completed, total: task.subtasks.length, percent: Math.round((completed / task.subtasks.length) * 100) };
}

// =============================================
// TAGS SYSTEM
// =============================================
function renderTagsSelector(containerId, selectedTags = []) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = Object.entries(TAGS).map(([key, tag]) => `
        <label class="tag-checkbox" style="--tag-color: ${tag.color}">
            <input type="checkbox" value="${key}" ${selectedTags.includes(key) ? 'checked' : ''}>
            <span class="tag-pill">${tag.icon} ${tag.name}</span>
        </label>
    `).join('');
}

function getSelectedTags(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    return Array.from(container.querySelectorAll('input:checked')).map(cb => cb.value);
}

// FORMATS SYSTEM
function getSelectedFormats() {
    const container = document.getElementById('formatsContainer');
    if (!container) return [];

    const checkboxes = container.querySelectorAll('.format-checkbox:checked');
    const selected = Array.from(checkboxes).map(cb => cb.value);

    // Capturar formato personalizado
    const customCheckbox = document.getElementById('fmt-personalizado');
    const customInput = document.getElementById('fmtCustomText');
    if (customCheckbox && customCheckbox.checked && customInput && customInput.value.trim()) {
        // Substituir 'Personalizado' pelo texto real
        const idx = selected.indexOf('Personalizado');
        if (idx !== -1) selected[idx] = `Personalizado: ${customInput.value.trim()}`;
    }

    return selected;
}

function renderTagsDisplay(tags = []) {
    if (!tags.length) return '';
    return tags.map(key => {
        const tag = TAGS[key];
        return tag ? `<span class="tag-badge" style="background:${tag.color}">${tag.icon}</span>` : '';
    }).join('');
}

// =============================================
// PIN/UNPIN DEMANDS
// =============================================
function togglePin(taskId) {
    const task = demandas.find(d => d.id === taskId);
    if (!task) return;
    task.pinned = !task.pinned;
    saveData();
    toast(task.pinned ? 'Demanda fixada!' : 'Demanda desafixada', 'info');
    refresh();
}

// =============================================
// DEPENDENCIES
// =============================================
function populateDependencies() {
    const select = document.getElementById('cDependsOn');
    if (!select) return;
    select.innerHTML = '<option value="">Nenhuma dependência</option>' +
        demandas.filter(d => d.status !== 'Aprovado').map(d =>
            `<option value="${d.id}">${d.id} - ${d.nome.substring(0, 40)}...</option>`
        ).join('');
}

function checkDependency(taskId) {
    const task = demandas.find(d => d.id === taskId);
    if (!task || !task.dependsOn) return true;
    const dependency = demandas.find(d => d.id === task.dependsOn);
    return !dependency || dependency.status === 'Aprovado';
}

// =============================================
// TIMELINE / GANTT VIEW
// =============================================
let timelineDate = new Date();
let timelineScale = 'week';

function renderTimeline() {
    const daysContainer = document.getElementById('timelineDays');
    const rowsContainer = document.getElementById('timelineRows');
    if (!daysContainer || !rowsContainer) return;

    const startDate = new Date(timelineDate.getFullYear(), timelineDate.getMonth(), 1);
    const daysInMonth = new Date(timelineDate.getFullYear(), timelineDate.getMonth() + 1, 0).getDate();

    document.getElementById('timelineMonth').textContent =
        MONTHS[timelineDate.getMonth()] + ' ' + timelineDate.getFullYear();

    // Render days header
    let daysHtml = '';
    for (let i = 1; i <= daysInMonth; i++) {
        const day = new Date(timelineDate.getFullYear(), timelineDate.getMonth(), i);
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        const isToday = new Date().toDateString() === day.toDateString();
        daysHtml += `<div class="timeline-day ${isWeekend ? 'weekend' : ''} ${isToday ? 'today' : ''}">${i}</div>`;
    }
    daysContainer.innerHTML = daysHtml;
    daysContainer.style.gridTemplateColumns = `repeat(${daysInMonth}, 1fr)`;

    // Render task rows
    // STRICT FILTER: Only show tasks relevant to the user (excluding deleted)
    let tasksToRender = [];
    const activeDemandas = getMonthDemandas(true).filter(d => !d.deletedAt);
    if (currentUser.role === 'coordinator' || currentUser.role === 'social_media' || currentUser.role === 'gestor_equipe') {
        tasksToRender = activeDemandas;
    } else {
        tasksToRender = activeDemandas.filter(d => d.pipeline.some(s => s.userId === currentUser.id || (!s.userId && s.userIds && s.userIds.includes(currentUser.id))));
    }

    const monthTasks = tasksToRender.filter(d => {
        const start = parseDateLocal(d.dataSolicitacao);
        const end = parseDateLocal(d.dataConclusao);
        return start.getMonth() === timelineDate.getMonth() || end.getMonth() === timelineDate.getMonth();
    });

    // Sort: pinned first, then by date
    monthTasks.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(a.dataSolicitacao) - new Date(b.dataSolicitacao));

    rowsContainer.innerHTML = monthTasks.map(task => {
        const start = parseDateLocal(task.dataSolicitacao);
        const end = parseDateLocal(task.dataConclusao);
        const startDay = start.getMonth() === timelineDate.getMonth() ? start.getDate() : 1;
        const endDay = end.getMonth() === timelineDate.getMonth() ? end.getDate() : daysInMonth;
        const span = endDay - startDay + 1;
        const statusClass = getStatusClass(task.status);
        const tagsHtml = renderTagsDisplay(task.tags || []);
        const pinIcon = task.pinned ? '📌 ' : '';

        return `
            <div class="timeline-row" onclick="openDetail('${task.id}')">
                <div class="timeline-task-name">${pinIcon}${tagsHtml}${task.nome.substring(0, 30)}...</div>
                <div class="timeline-bar-container" style="grid-template-columns: repeat(${daysInMonth}, 1fr)">
                    <div class="timeline-bar ${statusClass}" style="grid-column: ${startDay} / span ${span}">
                        ${task.status}
                    </div>
                </div>
            </div>
        `;
    }).join('') || '<div class="empty-message">Nenhuma demanda neste mês</div>';
}

function timelineNav(dir) {
    timelineDate.setMonth(timelineDate.getMonth() + dir);
    renderTimeline();
}

function setTimelineScale(scale) {
    timelineScale = scale;
    document.querySelectorAll('.scale-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.scale-btn[onclick="setTimelineScale('${scale}')"]`)?.classList.add('active');
    renderTimeline();
}

// =============================================
// ANALYTICS DASHBOARD
// =============================================
function renderAnalytics() {
    const now = new Date();
    const period = document.getElementById('analyticsPeriod')?.value || 'month';
    const fUser = document.getElementById('analyticsUser')?.value || '';

    // Populate user filter dropdown dynamically if it exists
    const userSelect = document.getElementById('analyticsUser');
    if (userSelect) {
        const currentVal = userSelect.value;
        const allUserIds = new Set();
        demandas.forEach(d => {
            if (d.solicitanteId) allUserIds.add(d.solicitanteId);
            d.pipeline?.forEach(s => {
                if (s.userId) allUserIds.add(s.userId);
                if (s.userIds) s.userIds.forEach(uid => allUserIds.add(uid));
            });
        });

        const usersList = Array.from(allUserIds).map(uid => {
            return USERS[uid] || null;
        }).filter(u => u && u.nome && u.nome !== 'undefined');

        usersList.sort((a, b) => a.nome.localeCompare(b.nome));

        const existingIds = Array.from(userSelect.options).map(o => o.value).filter(val => val !== '');
        const newListIds = usersList.map(u => u.id);
        
        if (existingIds.join(',') !== newListIds.join(',')) {
            userSelect.innerHTML = '<option value="">👤 Todos os Colaboradores</option>';
            usersList.forEach(u => {
                const option = document.createElement('option');
                option.value = u.id;
                option.textContent = u.nome;
                if (u.id === currentVal) option.selected = true;
                userSelect.appendChild(option);
            });
        }
    }

    // Usa o mês selecionado como referência, não o mês real
    const refDate = new Date(selectedYear, selectedMonth, 1);
    let filterDate;

    switch (period) {
        case 'week': filterDate = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - 7); break;
        case 'month': filterDate = new Date(refDate.getFullYear(), refDate.getMonth(), 1); break;
        case 'quarter': filterDate = new Date(refDate.getFullYear(), refDate.getMonth() - 3, 1); break;
        case 'year': filterDate = new Date(refDate.getFullYear(), 0, 1); break;
        default: filterDate = new Date(0);
    }

    // STRICT FILTER: Analytics only shows own performance (excluding deleted)
    const activeDemandas = (period === 'all') ? demandas.filter(d => !d.deletedAt) : getMonthDemandas().filter(d => !d.deletedAt);

    // Coordenador global vê tudo; demais veem só suas demandas
    let baseTasks;
    if (isGlobalCoordinator()) {
        baseTasks = activeDemandas;
    } else {
        baseTasks = activeDemandas.filter(d =>
            d.solicitanteId === currentUser.id ||
            (d.pipeline && d.pipeline.some(s => s.userId === currentUser.id || (!s.userId && s.userIds && s.userIds.includes(currentUser.id))))
        );
    }

    // Filtrar por colaborador selecionado
    if (fUser) {
        baseTasks = baseTasks.filter(d => {
            return d.solicitanteId === fUser || 
                   (d.pipeline && d.pipeline.some(s => s.userId === fUser || (s.userIds && s.userIds.includes(fUser))));
        });
    }

    const filteredTasks = baseTasks.filter(d => {
        const dc = d.dataCriacao || d.dataSolicitacao || d.dataConclusao;
        if (!dc) return true; // Sem data = mostra por segurança
        return new Date(dc) >= filterDate;
    });
    const completed = filteredTasks.filter(d => d.status === 'Aprovado');

    // Calculate average time
    let totalMinutes = 0, timeCount = 0;
    filteredTasks.forEach(t => {
        t.pipeline?.forEach(s => {
            if (s.timeSpent) {
                const match = s.timeSpent.match(/(\d+)h\s*(\d+)\s*m/);
                if (match) {
                    totalMinutes += parseInt(match[1]) * 60 + parseInt(match[2]);
                    timeCount++;
                }
            }
        });
    });
    const avgTime = timeCount ? Math.round(totalMinutes / timeCount) : 0;
    const avgHours = Math.floor(avgTime / 60);
    const avgMins = avgTime % 60;

    // Render metrics
    const metricsContainer = document.getElementById('analyticsMetrics');
    if (metricsContainer) {
        metricsContainer.innerHTML = `
            <div class="analytics-metric">
                <span class="metric-value">${filteredTasks.length}</span>
                <span class="metric-label">Total Demandas</span>
            </div>
            <div class="analytics-metric">
                <span class="metric-value">${completed.length}</span>
                <span class="metric-label">Concluídas</span>
            </div>
            <div class="analytics-metric">
                <span class="metric-value">${filteredTasks.length ? Math.round((completed.length / filteredTasks.length) * 100) : 0}%</span>
                <span class="metric-label">Taxa de Conclusão</span>
            </div>
            <div class="analytics-metric">
                <span class="metric-value">${avgHours}h ${avgMins}m</span>
                <span class="metric-label">Tempo Médio</span>
            </div>
        `;
    }

    // Status chart
    const statusChart = document.getElementById('chartByStatus');
    if (statusChart) {
        const statuses = ['A fazer', 'Fazendo', 'Para aprovação', 'Aprovado'];
        statusChart.innerHTML = statuses.map(s => {
            const count = filteredTasks.filter(t => t.status === s).length;
            const pct = filteredTasks.length ? (count / filteredTasks.length) * 100 : 0;
            return `<div class="analytics-bar"><span>${s}</span><div class="bar-track"><div class="bar-fill ${getStatusClass(s)}" style="width:${pct}%"></div></div><span>${count}</span></div>`;
        }).join('');
    }

    // User productivity chart - Conta TODAS as tarefas atribuídas (não apenas Aprovado)
    const userChart = document.getElementById('chartByUser');
    if (userChart) {
        const userStats = {};

        filteredTasks.forEach(t => {
            // Conta estritamente quem executou etapas na pipeline (trabalho de execução)
            t.pipeline?.forEach(s => {
                if (s.userId) {
                    if (!userStats[s.userId]) userStats[s.userId] = { total: 0, done: 0 };
                    userStats[s.userId].total++;
                    if (s.status === 'Aprovado' || t.status === 'Aprovado') userStats[s.userId].done++;
                }
                if (s.userIds && Array.isArray(s.userIds)) {
                    s.userIds.forEach(uid => {
                        if (uid) {
                            if (!userStats[uid]) userStats[uid] = { total: 0, done: 0 };
                            userStats[uid].total++;
                            if (s.status === 'Aprovado' || t.status === 'Aprovado') userStats[uid].done++;
                        }
                    });
                }
            });
        });

        // Filtra apenas usuários válidos cadastrados no sistema (remove UIDs brutos e contas temporárias)
        const validUsers = Object.entries(userStats).filter(([uid, _]) => {
            return uid && uid !== 'undefined' && USERS[uid];
        });
        const maxUser = Math.max(...validUsers.map(x => x[1].total), 1);

        userChart.innerHTML = validUsers.sort((a, b) => b[1].total - a[1].total).map(([uid, stats]) => {
            const user = USERS[uid];
            const pct = (stats.total / maxUser) * 100;
            return `<div class="analytics-bar" onclick="openUserAnalyticsDetail('${uid}')" style="cursor: pointer;" title="Clique para ver entregas de ${user?.nome || uid}"><span>👤 ${user?.nome || uid}</span><div class="bar-track"><div class="bar-fill user" style="width:${pct}%"></div></div><span>${stats.total} (${stats.done}✓)</span></div>`;
        }).join('') || '<div class="empty-message">Sem dados</div>';
    }

    // Calculo do Tempo Total (Fallback)
    function calcTimeMins(stage) {
        if (stage.timeSpent) {
            const match = stage.timeSpent.match(/(\d+)h\s*(\d+)\s*m/);
            if (match) return parseInt(match[1]) * 60 + parseInt(match[2]);
            return 0; // Fallback for purely string parsing fail
        }
        // Se a demanda tem histórico de tempo que não tá no timeSpent:
        if (stage.timerState?.accumulated) {
            return Math.floor(stage.timerState.accumulated / (1000 * 60));
        }
        return 0;
    }

    // Time by stage chart
    const timeChart = document.getElementById('chartTimeByStage');
    if (timeChart) {
        // Initialize with all known departments to avoid missing keys
        const stageTime = {};
        const stageCount = {};

        // Pre-populate keys from DEPT_COLORS
        Object.keys(DEPT_COLORS).forEach(k => {
            stageTime[k] = 0;
            stageCount[k] = 0;
        });

        filteredTasks.forEach(t => {
            t.pipeline?.forEach(s => {
                let mins = calcTimeMins(s);
                if (mins > 0 && s.dept) {
                    stageTime[s.dept] = (stageTime[s.dept] || 0) + mins;
                    stageCount[s.dept] = (stageCount[s.dept] || 0) + 1;
                }
            });
        });

        // Filter out zero times
        const validEntries = Object.entries(stageTime).filter(([_, v]) => v > 0);
        const maxTime = Math.max(...Object.values(stageTime), 1); // Avoid division by zero

        console.log('Radar PNSA: Analytics Time Data:', stageTime);

        timeChart.innerHTML = validEntries.map(([dept, mins]) => {
            const count = stageCount[dept] || 1;
            const avg = Math.round(mins / count);
            const pct = (mins / maxTime) * 100;
            // Robust formatting
            const h = Math.floor(avg / 60);
            const m = avg % 60;
            const color = DEPT_COLORS[dept] || '#ccc';

            return `<div class="analytics-bar" style="margin-bottom: 8px;">
                        <span style="min-width: 90px;">${dept}</span>
                        <div class="bar-track">
                            <div class="bar-fill" style="width:${pct}%; background:${color}"></div>
                        </div>
                        <span style="min-width: 60px; text-align:right;">${h}h ${m}m</span>
                    </div>`;
        }).join('') || '<div class="empty-message">Sem dados de tempo</div>';
    }

    // Trend chart (simple) - 12 Months of CURRENT year
    const trendChart = document.getElementById('chartTrend');
    if (trendChart) {
        const monthsOfThisYear = [];
        const currentYear = now.getFullYear();

        for (let i = 0; i < 12; i++) {
            const monthTasks = demandas.filter(t => {
                const created = new Date(t.dataCriacao);
                if (isNaN(created.getTime())) return false; // Trata datas inválidas
                return created.getMonth() === i && created.getFullYear() === currentYear;
            });
            monthsOfThisYear.push({
                month: MONTHS[i].substring(0, 3),
                count: monthTasks.length
            });
        }

        const maxMonth = Math.max(...monthsOfThisYear.map(m => m.count), 1);
        trendChart.innerHTML = `<div class="trend-chart" style="display:flex; justify-content:space-between; height: 180px; align-items: flex-end;">${monthsOfThisYear.map(m => `
            <div class="trend-bar" style="display:flex; flex-direction:column; align-items:center; flex:1;">
                <span class="trend-value" style="font-size:12px; margin-bottom:5px; color:var(--text); font-weight:600;">${m.count}</span>
                <div class="trend-fill" style="width:12px; border-radius:3px; background:var(--primary); height:${Math.max((m.count / maxMonth) * 100, 5)}%"></div>
                <span class="trend-label" style="font-size:11px; margin-top:8px; color:var(--text-muted);">${m.month}</span>
            </div>
        `).join('')}</div>`;
    }
}

let currentAnalyticsUserId = null;

window.openUserAnalyticsDetail = function(uid) {
    currentAnalyticsUserId = uid;
    const select = document.getElementById('uaPeriodSelect');
    if (select) select.value = 'all'; // Default to all time
    
    renderUserAnalyticsDetail();
    openModal('modalUserAnalytics');
};

window.renderUserAnalyticsDetail = function() {
    const uid = currentAnalyticsUserId;
    if (!uid) return;

    const user = USERS[uid] || { nome: uid, role: 'executor' };
    document.getElementById('uaTitle').innerHTML = `📊 Desempenho: ${user.nome}`;

    const period = document.getElementById('uaPeriodSelect')?.value || 'all';

    // Filter date based on selected period
    let filterDate = new Date(0);
    const now = new Date();
    if (period === 'month') {
        filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === 'quarter') {
        filterDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    } else if (period === 'year') {
        filterDate = new Date(now.getFullYear(), 0, 1);
    }

    // Filter demands (including all months for 'all' / date logic)
    // We want only approved demands where they participated and delivered
    const userDemands = demandas.filter(d => {
        if (d.deletedAt || d.status !== 'Aprovado') return false;

        const participou = d.responsavelId === uid || 
                           (d.pipeline && d.pipeline.some(s => s.userId === uid || (s.userIds && s.userIds.includes(uid))));
        
        const hasDeliveries = (d.entregasUrl && d.entregasUrl.length > 0) || d.entregaUrl;
        if (!participou || !hasDeliveries) return false;

        const dc = d.dataConclusao || d.lastStatusChange || d.dataCriacao;
        if (!dc) return true; // Show by default if no date

        return new Date(dc) >= filterDate;
    });

    // Sort by completion date descending
    userDemands.sort((a, b) => new Date(b.dataConclusao || b.lastStatusChange || 0) - new Date(a.dataConclusao || a.lastStatusChange || 0));

    // Calculate metrics
    let totalFiles = 0;
    userDemands.forEach(d => {
        if (d.entregasUrl && d.entregasUrl.length > 0) {
            totalFiles += d.entregasUrl.length;
        } else if (d.entregaUrl) {
            totalFiles += 1;
        }
    });

    const metricsContainer = document.getElementById('uaMetrics');
    if (metricsContainer) {
        metricsContainer.innerHTML = `
            <div class="analytics-metric" style="background: rgba(99, 102, 241, 0.05); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 10px; padding: 16px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <span class="metric-value" style="font-size: 32px; font-weight: 700; color: var(--primary); display: block;">${userDemands.length}</span>
                <span class="metric-label" style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-top: 4px;">Demandas Aprovadas</span>
            </div>
            <div class="analytics-metric" style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 10px; padding: 16px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <span class="metric-value" style="font-size: 32px; font-weight: 700; color: #10b981; display: block;">${totalFiles}</span>
                <span class="metric-label" style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-top: 4px;">Artes/Mídias Entregues</span>
            </div>
        `;
    }

    // Render table rows
    const tbody = document.getElementById('uaDeliveriesTableBody');
    if (tbody) {
        if (userDemands.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 32px; color: var(--text-muted); font-style: italic;">
                        Nenhuma entrega registrada para este período.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = userDemands.map(d => {
            const entregas = d.entregasUrl || (d.entregaUrl ? [d.entregaUrl] : []);
            const filesCount = entregas.length;
            const dateStr = formatDate(d.dataConclusao || d.lastStatusChange || d.dataCriacao);

            // Create buttons/links to view the files
            const linksHtml = entregas.map((url, i) => {
                return `<a href="${url}" target="_blank" style="color: var(--primary); text-decoration: none; font-weight: 600; margin-right: 8px;" title="Ver mídia ${i+1}">[Mídia ${i+1}]</a>`;
            }).join(' ');

            return `
                <tr style="border-bottom: 1px solid var(--border-subtle); transition: background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 12px; font-weight: 600; color: var(--text-muted);">#${d.id}</td>
                    <td style="padding: 12px;">
                        <div style="font-weight: 600; color: var(--text-color); cursor: pointer; text-decoration: underline;" onclick="closeModal('modalUserAnalytics'); openDetail('${d.id}')" title="Ver Detalhes da Demanda">
                            ${d.nome || d.titulo || 'Demanda sem título'}
                        </div>
                    </td>
                    <td style="padding: 12px; color: var(--text-muted);">${dateStr}</td>
                    <td style="padding: 12px;">
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <span style="font-weight: 700; color: var(--text-color);">${filesCount} arquivo(s)</span>
                            <div style="font-size: 11px; margin-top: 2px;">
                                ${linksHtml}
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
};

// =============================================
// INITIALIZATION
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    updateNotificationBadge();

    // Close dropdowns on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.header-search')) {
            document.getElementById('searchResults').style.display = 'none';
        }
        if (!e.target.closest('.notifications-panel') && !e.target.closest('#btnNotifications')) {
            document.getElementById('notificationsPanel').classList.remove('active');
        }
        if (!e.target.closest('.theme-selector')) {
            document.getElementById('themeMenu').classList.remove('active');
        }
    });
});

// =============================================
// THEME SWITCHER LOGIC (ROBUST)
// =============================================
function initTheme() {
    const savedTheme = localStorage.getItem('sgta-theme') || 'dark';
    setTheme(savedTheme);
}

function setTheme(mode) {
    // 1. Set the data-theme attribute on HTML (root) so CSS :root modifiers work
    document.documentElement.setAttribute('data-theme', mode);

    // 1b. Also set body class for CSS selectors like body.theme-light
    document.body.classList.remove('theme-dark', 'theme-light', 'theme-monday');
    document.body.classList.add('theme-' + mode);

    // 2. Save preference
    localStorage.setItem('sgta-theme', mode);

    // 3. Update active state in menu
    document.querySelectorAll('.theme-option').forEach(opt => {
        opt.classList.remove('active');
        if (opt.getAttribute('onclick')?.includes(mode)) {
            opt.classList.add('active');
        }
    });

    // 4. Update Icon
    const icon = document.getElementById('themeIcon');
    if (icon) {
        if (mode === 'light') icon.textContent = '☀️';
        else if (mode === 'dark') icon.textContent = '🌙';
        else icon.textContent = '🚀'; // Monday
    }

    // 5. Close menu
    const menu = document.getElementById('themeMenu');
    if (menu) menu.classList.remove('active');

    console.log(`Radar PNSA Theme set to: ${mode}`);
}

function toggleThemeMenu() {
    const menu = document.getElementById('themeMenu');
    if (menu) menu.classList.toggle('active');
}

// =============================================
// STALE DEMAND AUTOMATION (3+ DAYS)
// =============================================
function checkStaleDemands() {
    const now = new Date();
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    let staleCount = 0;

    demandas.filter(d => !d.deletedAt).forEach(t => {
        if (t.status === 'Aprovado') {
            t.stale = false;
            return;
        }

        const lastChange = new Date(t.lastStatusChange || t.dataCriacao);
        const diff = now - lastChange;

        if (diff >= THREE_DAYS_MS) {
            if (!t.stale) {
                t.stale = true;
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                // Notify the solicitante (coordinator)
                addNotification('⚠️', `Demanda parada há ${days} dias: ${t.nome} (${t.id})`, t.solicitanteId);
                
                // Safety check for pipeline
                if (t.pipeline && t.pipeline[t.currentStage]) {
                    const currentExecutor = t.pipeline[t.currentStage].userId;
                    if (currentExecutor && currentExecutor !== t.solicitanteId) {
                        addNotification('⚠️', `Sua demanda está parada há ${days} dias: ${t.nome}`, currentExecutor);
                    }
                }
                staleCount++;
            }
        } else {
            t.stale = false;
        }
    });

    if (staleCount > 0) { localStorage.setItem('workflowPNSA', JSON.stringify(demandas)); }
}

// Auto-finalizar demandas de transmissão quando o horário agendado passar
function autoFinalizarTransmissoes() {
    const now = new Date();
    let changed = false;

    demandas.forEach(t => {
        if (t.tipoProjeto !== 'Transmissão' || t.status === 'Aprovado' || t.deletedAt) return;
        if (!t.transmissao || !t.transmissao.dataHoraFim) return;

        const fim = new Date(t.transmissao.dataHoraFim);
        // Adiciona 1h de margem após o horário da transmissão
        fim.setHours(fim.getHours() + 1);

        if (now >= fim) {
            t.status = 'Aprovado';
            if (t.pipeline) {
                t.pipeline.forEach(s => { s.status = 'Aprovado'; });
            }
            t.lastStatusChange = now.toISOString();
            changed = true;
        }
    });

    if (changed) saveData();
}

// Executar auto-finalização periodicamente (a cada 5 minutos)
setInterval(autoFinalizarTransmissoes, 5 * 60 * 1000);

// =============================================
// TEMPLATES SYSTEM
// =============================================
function saveAsTemplate() {
    const tipo = document.getElementById('cTipoProjeto')?.value;
    const equipe = document.getElementById('cEquipeDestino')?.value;
    const nome = document.getElementById('cNomeDemanda')?.value;
    const titulo = document.getElementById('cTitulo')?.value;
    const briefing = document.getElementById('cBriefing')?.value;
    const orientacoes = document.getElementById('cOrientacoes')?.value;
    const detalhes = document.getElementById('cDetalhesConteudo')?.value;
    const referencias = document.getElementById('cReferencias')?.value;
    const prioridade = document.getElementById('cPrioridade')?.value;

    if (!nome && !titulo) {
        toast('Preencha pelo menos o nome ou título do projeto para salvar como template', 'error');
        return;
    }

    const templateName = prompt('Nome do template:', nome || titulo || 'Meu Template');
    if (!templateName) return;

    const template = {
        id: 'TPL-' + Date.now(),
        name: templateName,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id,
        data: {
            tipoProjeto: tipo,
            equipeDestino: equipe,
            nomeDemanda: nome,
            titulo: titulo,
            briefing: briefing,
            orientacoes: orientacoes,
            detalhesConteudo: detalhes,
            referencias: referencias,
            prioridade: prioridade
        }
    };

    templates.push(template);
    localStorage.setItem('sgta-templates', JSON.stringify(templates));
    toast('Template salvo com sucesso! 🔁', 'success');
}

function renderTemplates() {
    const grid = document.getElementById('templatesGrid');
    const empty = document.getElementById('templatesEmpty');

    if (templates.length === 0) {
        grid.style.display = 'none';
        empty.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    empty.style.display = 'none';

    grid.innerHTML = templates.map(tpl => {
        const creator = USERS[tpl.createdBy];
        const date = new Date(tpl.createdAt).toLocaleDateString('pt-BR');
        const deptColor = DEPT_COLORS[tpl.data.equipeDestino] || '#6161ff';

        return `
            <div class="template-card">
                <div class="template-card-header">
                    <span class="template-card-title">${tpl.name}</span>
                    <span class="template-card-badge" style="background: ${deptColor}22; color: ${deptColor};">${tpl.data.equipeDestino || 'Geral'}</span>
                </div>
                <div class="template-card-body">
                    <div class="template-card-info">
                        <span class="template-card-info-icon">📁</span>
                        <span>${tpl.data.tipoProjeto || '-'}</span>
                    </div>
                    <div class="template-card-info">
                        <span class="template-card-info-icon">📋</span>
                        <span>${tpl.data.nomeDemanda || tpl.data.titulo || '-'}</span>
                    </div>
                    <div class="template-card-info">
                        <span class="template-card-info-icon">👤</span>
                        <span>${creator?.nome || 'Desconhecido'} • ${date}</span>
                    </div>
                    ${tpl.data.briefing ? `<div class="template-card-info"><span class="template-card-info-icon">📝</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${tpl.data.briefing.substring(0, 80)}${tpl.data.briefing.length > 80 ? '...' : ''}</span></div>` : ''}
                </div>
                <div class="template-card-actions">
                    <button class="btn-use-template" onclick="useTemplate('${tpl.id}')">✨ Usar Template</button>
                    <button class="btn-delete-template" onclick="deleteTemplate('${tpl.id}')">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

function useTemplate(templateId) {
    const tpl = templates.find(t => t.id === templateId);
    if (!tpl) return;

    // Open the create modal
    openCreateModal();

    // Pre-fill form fields after a small delay to let the modal initialize
    setTimeout(() => {
        const d = tpl.data;
        if (d.tipoProjeto) {
            const tipoProjeto = document.getElementById('cTipoProjeto');
            if (tipoProjeto) { tipoProjeto.value = d.tipoProjeto; onTipoProjetoChange(); }
        }
        if (d.equipeDestino) {
            const equipe = document.getElementById('cEquipeDestino');
            if (equipe) { equipe.value = d.equipeDestino; onEquipeDestinoChange(); }
        }
        if (d.nomeDemanda) {
            const nome = document.getElementById('cNomeDemanda');
            if (nome) nome.value = d.nomeDemanda;
        }
        if (d.titulo) {
            const titulo = document.getElementById('cTitulo');
            if (titulo) titulo.value = d.titulo;
        }
        if (d.briefing) {
            const briefing = document.getElementById('cBriefing');
            if (briefing) briefing.value = d.briefing;
        }
        if (d.orientacoes) {
            const orientacoes = document.getElementById('cOrientacoes');
            if (orientacoes) orientacoes.value = d.orientacoes;
        }
        if (d.detalhesConteudo) {
            const detalhes = document.getElementById('cDetalhesConteudo');
            if (detalhes) detalhes.value = d.detalhesConteudo;
        }
        if (d.referencias) {
            const ref = document.getElementById('cReferencias');
            if (ref) ref.value = d.referencias;
        }
        if (d.prioridade) {
            const prio = document.getElementById('cPrioridade');
            if (prio) prio.value = d.prioridade;
        }

        toast('Template carregado! Ajuste os campos e envie.', 'info');
    }, 200);
}

function deleteTemplate(templateId) {
    if (!confirm('Excluir este template?')) return;
    templates = templates.filter(t => t.id !== templateId);
    localStorage.setItem('sgta-templates', JSON.stringify(templates));
    renderTemplates();
    toast('Template excluído', 'info');
}

// =============================================
// WORKLOAD DASHBOARD
// =============================================
function renderWorkload() {
    const summaryEl = document.getElementById('workloadSummary');
    const gridEl = document.getElementById('workloadGrid');

    // Calculate workload per user
    const activeDemandas = getMonthDemandas().filter(d => !d.deletedAt && d.status !== 'Aprovado');
    const MAX_CAPACITY = 5; // Max reasonable tasks per person

    const userWorkloads = {};

    // Initialize users
    Object.values(USERS).forEach(u => {
        userWorkloads[u.id] = {
            user: u,
            tasks: [],
            count: 0
        };
    });

    // Assign tasks to their current executor
    activeDemandas.forEach(t => {
        const currentStage = t.pipeline ? t.pipeline[t.currentStage] : null;
        if (currentStage && currentStage.userId && userWorkloads[currentStage.userId]) {
            userWorkloads[currentStage.userId].tasks.push(t);
            userWorkloads[currentStage.userId].count++;
        }
    });

    // Classify capacity
    const workloadEntries = Object.values(userWorkloads).map(w => {
        let capacity, capacityLabel;
        if (w.count === 0) { capacity = 'free'; capacityLabel = '🟢 Disponível'; }
        else if (w.count <= 2) { capacity = 'free'; capacityLabel = '🟢 Disponível'; }
        else if (w.count <= 3) { capacity = 'busy'; capacityLabel = '🟡 Ocupado'; }
        else { capacity = 'overloaded'; capacityLabel = '🔴 Sobrecarregado'; }
        return { ...w, capacity, capacityLabel };
    });

    // Sort: overloaded first, then busy, then free
    const order = { overloaded: 0, busy: 1, free: 2 };
    workloadEntries.sort((a, b) => order[a.capacity] - order[b.capacity] || b.count - a.count);

    // Summary stats
    const totalActive = activeDemandas.length;
    const freeCount = workloadEntries.filter(w => w.capacity === 'free').length;
    const busyCount = workloadEntries.filter(w => w.capacity === 'busy').length;
    const overloadedCount = workloadEntries.filter(w => w.capacity === 'overloaded').length;
    const avg = workloadEntries.length > 0 ? (totalActive / workloadEntries.length).toFixed(1) : 0;

    summaryEl.innerHTML = `
        <div class="workload-summary-card total">
            <span class="workload-summary-value">${totalActive}</span>
            <span class="workload-summary-label">Demandas Ativas</span>
        </div>
        <div class="workload-summary-card total">
            <span class="workload-summary-value">${avg}</span>
            <span class="workload-summary-label">Média por Pessoa</span>
        </div>
        <div class="workload-summary-card free">
            <span class="workload-summary-value">${freeCount}</span>
            <span class="workload-summary-label">Disponíveis</span>
        </div>
        <div class="workload-summary-card busy">
            <span class="workload-summary-value">${busyCount}</span>
            <span class="workload-summary-label">Ocupados</span>
        </div>
        <div class="workload-summary-card overloaded">
            <span class="workload-summary-value">${overloadedCount}</span>
            <span class="workload-summary-label">Sobrecarregados</span>
        </div>
    `;

    // Render user cards grouped by department
    const deptOrder = ['Designer', 'Videomaker', 'Suporte', 'Inovação/TI', 'Social Media'];
    const deptGroups = {};
    workloadEntries.forEach(w => {
        let depts = typeof getUserDepts === 'function' ? getUserDepts(w.user) : (Array.isArray(w.user.dept) ? w.user.dept : (typeof w.user.dept === 'string' ? w.user.dept.split(',').map(d => d.trim()) : [w.user.dept]));
        if (!depts || depts.length === 0) depts = ['Geral'];
        depts.forEach(dept => {
            if (!deptGroups[dept]) deptGroups[dept] = [];
            deptGroups[dept].push(w);
        });
    });

    gridEl.innerHTML = deptOrder.filter(dept => deptGroups[dept] && deptGroups[dept].length > 0).map(dept => {
        const deptColor = DEPT_COLORS[dept] || '#6161ff';
        const deptEntries = deptGroups[dept];
        const deptDemandas = deptEntries.reduce((sum, w) => sum + w.count, 0);

        const cards = deptEntries.map(w => {
            const fillPct = Math.min((w.count / MAX_CAPACITY) * 100, 100);
            const prioColors = { 'Crítico': '#ef4444', 'Alta': '#f59e0b', 'Média': '#22c55e', 'Normal': '#3b82f6', 'Baixa': '#94a3b8' };

            const tasksList = w.tasks.slice(0, 5).map(t => `
                <div class="workload-task-item" onclick="openDetail('${t.id}')">
                    <span class="workload-task-prio" style="background: ${prioColors[t.prioridade] || '#94a3b8'}"></span>
                    <span class="workload-task-name">${t.nome}</span>
                    <span style="font-size:10px;color:var(--text-dim);">${t.status}</span>
                </div>
            `).join('');

            return `
                <div class="workload-card">
                    <div class="workload-card-header">
                        ${window.renderAvatar(w.user, 'workload-avatar', 'background: ' + deptColor)}
                        <div class="workload-user-info">
                            <span class="workload-user-name">${w.user.nome}</span>
                            <span class="workload-user-dept">${w.user.dept}</span>
                        </div>
                        <span class="capacity-badge ${w.capacity}">${w.capacityLabel}</span>
                    </div>
                    <div class="workload-bar-container">
                        <div class="workload-bar-label">
                            <span>${w.count} demandas ativas</span>
                            <span>${fillPct.toFixed(0)}%</span>
                        </div>
                        <div class="workload-bar-track">
                            <div class="workload-bar-fill ${w.capacity}" style="width: ${fillPct}%"></div>
                        </div>
                    </div>
                    ${w.tasks.length > 0 ? `<div class="workload-tasks-list">${tasksList}</div>` : '<div style="text-align:center;color:var(--text-dim);font-size:13px;padding:10px;">Nenhuma demanda ativa</div>'}
                    ${w.tasks.length > 5 ? `<div style="text-align:center;color:var(--text-muted);font-size:11px;margin-top:8px;">+ ${w.tasks.length - 5} mais</div>` : ''}
                </div>
            `;
        }).join('');

        return `
            <div class="workload-dept-section">
                <div class="workload-dept-header" style="border-left: 4px solid ${deptColor}; padding: 10px 16px; margin-bottom: 12px; background: ${deptColor}10; border-radius: 6px;">
                    <h3 style="margin:0; font-size: 16px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                        <span style="width:10px; height:10px; border-radius:50%; background: ${deptColor}; display:inline-block;"></span>
                        ${dept}
                        <span style="font-size:12px; font-weight:400; color:var(--text-muted); margin-left:auto;">${deptEntries.length} pessoa${deptEntries.length > 1 ? 's' : ''} • ${deptDemandas} demanda${deptDemandas !== 1 ? 's' : ''}</span>
                    </h3>
                </div>
                <div class="workload-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:16px; margin-bottom: 24px;">${cards}</div>
            </div>
        `;
    }).join('');
}

// =============================================
// MURAL DE AVISOS (Announcements)
// =============================================
let avisos = JSON.parse(localStorage.getItem('sgta-avisos')) || [
    { id: 1700000000001, titulo: 'Bem-vindo ao Novo Mural!', texto: 'Este é o canal oficial de comunicados da gestão.', autorId: 'armando-gestao', data: new Date().toISOString(), prioridade: 'normal' }
];

function renderMural() {
    const grid = document.getElementById('muralGrid');
    const btnNew = document.getElementById('btnNewAviso');

    // Permission: Only Global Coordinator (Armando) can create
    if (isGlobalCoordinator()) {
        btnNew.style.display = 'block';
    } else {
        btnNew.style.display = 'none';
    }

    if (!avisos.length) {
        grid.innerHTML = '<div class="mural-empty">Nenhum aviso no momento.</div>';
        return;
    }

    // Sort: Urgent first, then new
    const sortedAvisos = [...avisos].sort((a, b) => {
        if (a.prioridade === 'urgente' && b.prioridade !== 'urgente') return -1;
        if (b.prioridade === 'urgente' && a.prioridade !== 'urgente') return 1;
        return new Date(b.data) - new Date(a.data);
    });

    grid.innerHTML = sortedAvisos.map(a => {
        const author = USERS[a.autorId] || { nome: 'Sistema', iniciais: 'SYS' };
        const isAuthor = currentUser.id === a.autorId;
        const canDelete = isGlobalCoordinator() || isAuthor; // Only Armando or author can delete

        return `
            <div class="mural-card ${a.prioridade}">
                <div class="mural-card-header">
                    <div class="mural-author">
                        ${window.renderAvatar(author, 'mural-avatar')}
                        <span>${author.nome}</span>
                    </div>
                    <span class="mural-date">${formatDateFull(a.data)}</span>
                </div>
                <div class="mural-title">${a.titulo}</div>
                <div class="mural-text"${a.prioridade === 'urgente' ? ' style="font-weight:500;"' : ''}>${a.texto}</div>
                
                ${canDelete ? `
                <div class="mural-card-footer">
                    <button class="btn-delete-aviso" onclick="deleteAviso(${a.id})" title="Excluir Aviso">
                        🗑️ Excluir
                    </button>
                </div>` : ''}
            </div>
        `;
    }).join('');
}

function openCreateAvisoModal() {
    document.getElementById('modalCreateAviso').classList.add('active');
    document.getElementById('avisoTitulo').value = '';
    document.getElementById('avisoTexto').value = '';
    document.getElementById('avisoPrioridade').value = 'normal';
}

function saveAviso() {
    const titulo = document.getElementById('avisoTitulo').value.trim();
    const texto = document.getElementById('avisoTexto').value.trim();
    const prioridade = document.getElementById('avisoPrioridade').value;

    if (!titulo || !texto) return toast('Preencha título e mensagem', 'error');

    const idAviso = Date.now();
    const novoAviso = {
        id: idAviso,
        titulo,
        texto,
        prioridade,
        autorId: currentUser.id,
        data: new Date().toISOString()
    };

    // Firebase save
    window.setDoc(window.doc(window.firebaseDb, "avisos", idAviso.toString()), novoAviso).then(() => {
        closeModal('modalCreateAviso');
        toast('Aviso publicado no Mural!', 'success');

        // Notifica todos os outros usuários
        Object.keys(USERS).forEach(userId => {
            if (userId !== currentUser.id) {
                if (typeof notifyUser === 'function') {
                    notifyUser(userId, '📣', `Novo aviso no mural: ${titulo}`);
                }
            }
        });
    }).catch((e) => {
        console.error("Erro ao publicar aviso: ", e);
        toast('Erro ao publicar aviso', 'error');
    });
}

function deleteAviso(id) {
    if (!confirm('Tem certeza que deseja excluir este aviso?')) return;

    window.deleteDoc(window.doc(window.firebaseDb, "avisos", id.toString())).then(() => {
        toast('Aviso excluído do Mural.');
    }).catch((e) => {
        console.error("Erro ao excluir aviso: ", e);
        toast('Erro ao excluir aviso', 'error');
    });
}

// =============================================
// TIME TRACKING FUNCTIONS
// =============================================
function formatTimer(ms) {
    if (!ms) return '00:00:00';
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function claimTaskIfShared(task, userId) {
    if (!task || !task.pipeline) return;
    const stage = task.pipeline[task.currentStage];
    if (stage && !stage.userId && stage.userIds && stage.userIds.length > 0) {
        const claimants = stage.userIds;
        stage.userId = userId;
        task.responsavelId = userId;
        
        // Adiciona histórico da demanda
        addHistory(task.id, 'claim', `${USERS[userId]?.nome || 'Usuário'} assumiu a titularidade exclusiva da demanda.`);
        
        // Notifica os outros colaboradores
        const otherUsers = claimants.filter(id => id !== userId);
        otherUsers.forEach(uid => {
            notifyUser(uid, '🔒', `A demanda "${task.nome}" foi assumida por ${USERS[userId]?.nome || 'outro colaborador'} e iniciada.`);
        });
        
        console.log(`Radar PNSA: Demanda ${task.id} assumida por ${userId}. Outros usuários notificados:`, otherUsers);
    }
}

function toggleTimer(taskId) {
    if (!taskId) {
        // Toggle INDEPENDENT Global Timer
        toggleGlobalTimer();
        return;
    }

    const t = demandas.find(d => d.id === taskId);
    if (!t) return;

    // Check if another task is running and stop it (Single active timer policy)
    // This policy is being removed to allow independent timers.
    // const otherRunning = demandas.find(d => d.id !== taskId && d.pipeline[d.currentStage].timerState?.running);
    // if (otherRunning && !t.pipeline[t.currentStage].timerState?.running) {
    //     toggleTimer(otherRunning.id); // Stop the other one first
    // }

    // Ensure structure exists
    if (!t.pipeline[t.currentStage].timerState) {
        t.pipeline[t.currentStage].timerState = { running: false, accumulated: 0, lastStart: null };
    }

    const state = t.pipeline[t.currentStage].timerState;
    const now = new Date().toISOString();

    if (state.running) {
        // STOP
        const start = new Date(state.lastStart);
        let session = 0;
        if (!isNaN(start.getTime())) {
            session = new Date() - start;
        }

        // Sanitize accumulated
        const currentAcc = isNaN(parseInt(state.accumulated)) ? 0 : parseInt(state.accumulated);
        state.accumulated = currentAcc + session;
        state.running = false;
        state.lastStart = null;

        // Update legacy timeSpent string for compatibility
        const hours = Math.floor(state.accumulated / (1000 * 60 * 60));
        const mins = Math.floor((state.accumulated / (1000 * 60)) % 60);
        t.pipeline[t.currentStage].timeSpent = `${hours}h ${mins}m`;

        toast('Timer pausado. Tempo salvo!', 'info');
    } else {
        // START
        state.running = true;
        state.lastStart = now;

        // Assume titularidade caso seja demanda compartilhada/não assumida
        claimTaskIfShared(t, currentUser.id);

        // Auto-change status to "Fazendo" if "A fazer"
        if (t.status === 'A fazer') {
            t.status = 'Fazendo';
            t.pipeline[t.currentStage].status = 'Fazendo';
        }

    }

    saveData(t);
    renderKanban();
}

// INDEPENDENT GLOBAL TIMER
let globalTimerState = JSON.parse(localStorage.getItem('globalTimerState')) || {
    running: false,
    startTime: null,
    accumulated: 0
};

function toggleGlobalTimer() {
    const now = Date.now();
    const container = document.getElementById('headerTimer');

    if (globalTimerState.running) {
        // Stop - Calculate elapsed for toast, then RESET
        const elapsed = now - globalTimerState.startTime;
        const totalMs = globalTimerState.accumulated + elapsed;

        // Format for toast
        const hours = Math.floor(totalMs / (1000 * 60 * 60));
        const mins = Math.floor((totalMs / (1000 * 60)) % 60);
        const secs = Math.floor((totalMs / 1000) % 60);
        toast(`Tempo finalizado: ${hours}h ${mins}m ${secs}s`, 'success');

        // RESET completely
        globalTimerState.accumulated = 0;
        globalTimerState.running = false;
        globalTimerState.startTime = null;
        if (container) container.classList.remove('active');
        if (container) container.classList.remove('running');
    } else {
        // Start
        globalTimerState.running = true;
        globalTimerState.startTime = now;
        globalTimerState.accumulated = 0; // Fresh start
        if (container) container.classList.add('active');
        if (container) container.classList.add('running');
        toast('Cronômetro iniciado', 'success');
    }

    localStorage.setItem('globalTimerState', JSON.stringify(globalTimerState));
    updateGlobalTimerDisplay();
}

function updateGlobalTimerDisplay() {
    const display = document.getElementById('timerDisplay');
    const container = document.getElementById('headerTimer');
    if (!display || !container) return;

    if (globalTimerState.running) {
        const now = Date.now();
        const totalMs = globalTimerState.accumulated + (now - globalTimerState.startTime);

        // Format
        const hours = Math.floor(totalMs / (1000 * 60 * 60));
        const mins = Math.floor((totalMs / (1000 * 60)) % 60);
        const secs = Math.floor((totalMs / 1000) % 60);
        const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

        display.textContent = timeStr;
        container.classList.add('active');
    } else {
        // RESET display to 00:00:00
        display.textContent = '00:00:00';
        container.classList.remove('active');
        container.classList.remove('running');
    }
}

// Global Timer Update Loop
setInterval(() => {
    document.querySelectorAll('.timer-display.running').forEach(el => {
        const start = el.dataset.start;
        const accumulated = parseInt(el.dataset.accumulated || '0');

        if (start && start !== 'null' && start !== 'undefined') {
            const now = new Date();
            const lastStart = new Date(start);

            if (!isNaN(lastStart.getTime())) {
                const currentSession = now - lastStart;
                const safeAccumulated = isNaN(accumulated) ? 0 : accumulated;
                const totalMs = safeAccumulated + currentSession;

                // Format HH:mm:ss
                const hours = Math.floor(totalMs / (1000 * 60 * 60));
                const mins = Math.floor((totalMs / (1000 * 60)) % 60);
                const secs = Math.floor((totalMs / 1000) % 60);
                const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

                // Update only if text changed nicely, preserving the badge
                el.innerHTML = `<span class="timer-badge-active"></span>${timeStr}`;
            }
        }
    });

    // Always update global timer independently
    updateGlobalTimerDisplay();
}, 1000);

// =============================================
// LIXEIRA / TRASH (Soft Delete)
// =============================================
function renderLixeira() {
    const container = document.getElementById('lixeiraContainer');
    const deleted = demandas.filter(d => d.deletedAt);

    // Only Global Coordinator can empty trash
    const btnEmpty = document.getElementById('btnEmptyTrash');
    if (isGlobalCoordinator()) btnEmpty.style.display = 'block';
    else btnEmpty.style.display = 'none';

    if (!deleted.length) {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);font-style:italic">Lixeira vazia</div>';
        return;
    }

    const rows = deleted.map(d => `
        <tr class="lixeira-row">
            <td class="lixeira-cell">${d.nome}</td>
            <td class="lixeira-cell">${formatDateFull(d.deletedAt)}</td>
            <td class="lixeira-cell">${USERS[d.deletedBy]?.nome || 'Desconhecido'}</td>
            <td class="lixeira-cell lixeira-actions">
                <button class="btn-restore" onclick="restoreTask('${d.id}')" title="Restaurar">♻️ Restaurar</button>
                ${isGlobalCoordinator() ? `<button class="btn-permanent" onclick="permanentDeleteTask('${d.id}')" title="Excluir Permanentemente">❌ Excluir</button>` : ''}
            </td>
        </tr>
    `).join('');

    container.innerHTML = `
        <table class="lixeira-table">
            <thead>
                <tr>
                    <th class="lixeira-header">Demanda</th>
                    <th class="lixeira-header">Data Exclusão</th>
                    <th class="lixeira-header">Excluído Por</th>
                    <th class="lixeira-header">Ações</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

function deleteTask(id) {
    const t = demandas.find(d => d.id === id);
    if (!t) return;

    if (!confirm(`Deseja enviar "${t.nome}" para a lixeira?`)) return;

    t.deletedAt = new Date().toISOString();
    t.deletedBy = currentUser.id;
    // Keep status to allow easy restore

    saveData();
    closeModal('modalDetail');
    toast('Demanda movida para a Lixeira', 'info');

    // Refresh current view
    const current = localStorage.getItem('sgta-last-view');
    navigateTo(current || 'minha-area');
}

function restoreTask(id) {
    const t = demandas.find(d => d.id === id);
    if (!t) return;

    delete t.deletedAt;
    delete t.deletedBy;

    saveData();
    renderLixeira();
    toast('Demanda restaurada com sucesso!', 'success');
}

function permanentDeleteTask(id) {
    if (!confirm('ATENÇÃO: Isso excluirá a demanda permanentemente. Não há volta.\\nConfirmar?')) return;

    const idx = demandas.findIndex(d => d.id === id);
    if (idx > -1) {
        demandas.splice(idx, 1);
        saveData();
        renderLixeira();
        toast('Demanda excluída permanentemente.', 'error');
    }
}

function emptyTrash() {
    if (!confirm('Deseja esvaziar a lixeira e apagar TODOS os itens nela permanentemente?')) return;

    for (let i = demandas.length - 1; i >= 0; i--) {
        if (demandas[i].deletedAt) {
            demandas.splice(i, 1);
        }
    }

    saveData();
    renderLixeira();
    toast('Lixeira esvaziada.', 'success');
}

// =============================================
// USER MANAGEMENT
// =============================================
function renderUsers() {
    console.log('Radar PNSA: renderUsers called');
    const container = document.getElementById('usersTableWrapper');
    if (!container) {
        console.error('Radar PNSA: container usersTableWrapper not found!');
        return;
    }

    try {
        if (!USERS || Object.keys(USERS).length === 0) {
            console.warn('Radar PNSA: USERS empty! Attempting to restore defaults...');
            USERS = JSON.parse(JSON.stringify(DEFAULT_USERS));
            saveUsers();
        }

        const usersList = Object.values(USERS);

        // Define grid layout for users: Nome (2fr), Foto/Iniciais (80px), ID (140px), Dept (160px), Role (140px), Actions (80px)
        const gridStyle = 'grid-template-columns: 2fr 80px 150px 160px 140px 80px;';

        let html = `
            <div class="table-head" style="${gridStyle}">
                <div class="table-th">Nome</div>
                <div class="table-th">Foto</div>
                <div class="table-th">ID (Login)</div>
                <div class="table-th">Departamento</div>
                <div class="table-th">Função</div>
                <div class="table-th">Ações</div>
            </div>
            <div class="table-body">
        `;

        html += usersList.map(u => {
            const deptColor = DEPT_COLORS[u.dept] || '#ccc';
            let roleLabel = 'Executor';
            let roleClass = 'exec';
            if (u.role === 'coordinator') { roleLabel = 'Coordenador'; roleClass = 'review'; }
            if (u.role === 'social_media') { roleLabel = 'Social Media'; roleClass = 'done'; }
            if (u.role === 'gestor_equipe') { roleLabel = 'Gestor de Equipe'; roleClass = 'waiting'; }

            return `
            <div class="table-row" style="${gridStyle}">
                <div class="table-td">
                    <div style="display:flex; flex-direction:column;">
                        <span class="td-title">${u.nome}</span>
                    </div>
                </div>
                <div class="table-td">
                    ${window.renderAvatar(u, 'td-avatar')}
                </div>
                <div class="table-td" style="max-width: 150px; overflow: hidden;">
                    <code style="display:block; max-width:130px; font-size:11px; background:rgba(255,255,255,0.05); padding:4px 8px; border-radius:6px; color: var(--text-muted); border: 1px solid rgba(255,255,255,0.1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${u.id}">${u.id}</code>
                </div>
                <div class="table-td">
                    ${(Array.isArray(u.dept) ? u.dept : (typeof u.dept === 'string' ? u.dept.split(',') : [u.dept]))
                    .map(d => {
                        const dColor = DEPT_COLORS[d.trim()] || '#888';
                        return `<span class="status-tag" style="background:${dColor}15; color:${dColor}; margin-bottom:4px; display:inline-block; margin-right:4px;">${d.trim()}</span>`;
                    }).join('')}
                </div>
                <div class="table-td" style="font-size:12px; display:flex; align-items:center;">
                    <select onchange="changeUserRole('${u.id}', this.value)" style="background:transparent; border:1px solid var(--border-subtle, rgba(255,255,255,0.1)); border-radius:8px; padding:5px 8px; color:var(--text-primary, #f0f0f5); font-size:11px; font-weight:600; cursor:pointer; outline:none; appearance:auto; font-family:'Inter',sans-serif;">
                        <option value="executor" ${u.role === 'executor' ? 'selected' : ''}>Executor</option>
                        <option value="gestor_equipe" ${u.role === 'gestor_equipe' ? 'selected' : ''}>Gestor de Equipe</option>
                        <option value="social_media" ${u.role === 'social_media' ? 'selected' : ''}>Social Media</option>
                        <option value="coordinator" ${u.role === 'coordinator' ? 'selected' : ''}>Coordenador</option>
                    </select>
                </div>
                <div class="table-td" style="display:flex; gap: 8px;">
                    <button class="btn-icon edit" onclick="editUser('${u.id}')" title="Editar">
                        <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-icon delete" onclick="deleteUser('${u.id}')" title="Excluir">
                        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            </div>
            `;
        }).join('');

        html += '</div>'; // Close table-body
        container.innerHTML = html;

    } catch (e) {
        console.error('Radar PNSA: Error rendering users:', e);
        container.innerHTML = `<div class="empty-message" style="color:var(--red)">Erro ao renderizar: ${e.message}</div>`;
    }
}

let editingUserId = null; // Track if we are editing

function openUserModal() {
    // Reset to create mode
    editingUserId = null;
    document.getElementById('uNome').value = '';
    document.getElementById('uIniciais').value = '';
    document.getElementById('uId').value = '';

    // Reset checkboxes
    document.querySelectorAll('input[name="uDept"]').forEach(cb => cb.checked = false);

    document.getElementById('uRole').value = 'executor';
    document.querySelector('#modalUser .modal-header h3').textContent = '👤 Novo Usuário';
    document.getElementById('modalUser').classList.add('active');
}

function editUser(userId) {
    const user = USERS[userId];
    if (!user) { toast('Usuário não encontrado', 'error'); return; }

    editingUserId = userId;
    document.getElementById('uNome').value = user.nome;
    document.getElementById('uIniciais').value = user.iniciais;
    document.getElementById('uId').value = user.id;

    // Handle check of multiple departments
    document.querySelectorAll('input[name="uDept"]').forEach(cb => cb.checked = false);
    let userDepts = getUserDepts(user);

    userDepts.forEach(d => {
        const checkbox = document.querySelector(`input[name="uDept"][value="${d}"]`);
        if (checkbox) checkbox.checked = true;
    });

    document.getElementById('uRole').value = user.role;
    document.querySelector('#modalUser .modal-header h3').textContent = '✏️ Editar Usuário';
    document.getElementById('modalUser').classList.add('active');
}

async function deleteUser(userId) {
    const user = USERS[userId];
    if (!user) return;
    if (userId === currentUser?.id) {
        toast('Você não pode excluir seu próprio usuário!', 'error');
        return;
    }
    if (!confirm(`Deseja excluir o usuário "${user.nome}"?`)) return;

    delete USERS[userId];
    saveUsers();
    renderUsers();

    try {
        await window.deleteDoc(window.doc(window.firebaseDb, "users", userId));
        toast('Usuário excluído com sucesso', 'success');
    } catch (e) {
        console.error('Erro ao excluir usuário no Firebase:', e);
        toast('Erro ao excluir usuário no banco de dados', 'error');
    }
}

async function saveNewUser() {
    const nome = document.getElementById('uNome').value.trim();
    const iniciais = document.getElementById('uIniciais').value.trim().toUpperCase();
    const newId = document.getElementById('uId').value.trim().toLowerCase().replace(/\s+/g, '-');
    const deptCheckboxes = document.querySelectorAll('input[name="uDept"]:checked');
    const dept = Array.from(deptCheckboxes).map(cb => cb.value);
    const role = document.getElementById('uRole').value;

    if (!nome || !iniciais || !newId || dept.length === 0) {
        toast('Preencha todos os campos e selecione pelo menos um departamento!', 'error');
        return;
    }

    if (editingUserId) {
        // Edit mode
        if (newId !== editingUserId) {
            // ID changed — check if new ID is available
            if (USERS[newId]) {
                toast('Esse novo ID já está em uso!', 'error');
                return;
            }
            // Delete old key and create new
            delete USERS[editingUserId];
            USERS[newId] = { id: newId, nome, iniciais, dept, allDepts: dept, role };
            saveUsers();

            try {
                await window.deleteDoc(window.doc(window.firebaseDb, "users", editingUserId));
                await window.setDoc(window.doc(window.firebaseDb, "users", newId), USERS[newId], { merge: true });
            } catch (e) { console.error('Erro setDoc Firebase', e); }

        } else {
            // Same ID — just update fields
            USERS[editingUserId].nome = nome;
            USERS[editingUserId].iniciais = iniciais;
            USERS[editingUserId].dept = dept;
            USERS[editingUserId].allDepts = dept;
            USERS[editingUserId].role = role;
            saveUsers();

            try {
                await window.setDoc(window.doc(window.firebaseDb, "users", editingUserId), USERS[editingUserId], { merge: true });
            } catch (e) { console.error('Erro setDoc Firebase', e); }
        }
        toast('Usuário atualizado com sucesso!', 'success');
    } else {
        // Create mode
        if (USERS[newId]) {
            toast('ID de usuário já existe!', 'error');
            return;
        }
        USERS[newId] = { id: newId, nome, iniciais, dept, allDepts: dept, role };
        saveUsers();

        try {
            await window.setDoc(window.doc(window.firebaseDb, "users", newId), USERS[newId], { merge: true });
        } catch (e) { console.error('Erro setDoc Firebase', e); }
        toast('Usuário criado com sucesso!', 'success');
    }

    closeModal('modalUser');
    editingUserId = null;
    renderUsers();
}

async function changeUserRole(userId, newRole) {
    if (!USERS[userId]) return;
    
    USERS[userId].role = newRole;
    saveUsers(); // Salva localmente
    
    // Salva no Firebase
    try {
        if (window.setDoc && window.doc && window.firebaseDb) {
            await window.setDoc(window.doc(window.firebaseDb, "users", userId), USERS[userId], { merge: true });
            
            // Se o usuário foi alterado para gestor de equipe E é ele mesmo que está logado
            if (newRole === 'gestor_equipe' && currentUser.id === userId) {
                // Atualiza a sessão atual
                currentUser.role = 'gestor_equipe';
                localStorage.setItem('sgta-user', JSON.stringify(currentUser));
                
                const depts = Array.isArray(currentUser.dept) ? currentUser.dept.join(', ') : currentUser.dept;
                alert(`Role atualizada para Gestor de Equipe!\nVocê agora gerencia o(s) departamento(s): ${depts}.\n\nO sistema será recarregado para aplicar a nova visão departamental.`);
                window.location.reload();
            } else if (newRole === 'gestor_equipe') {
                const depts = Array.isArray(USERS[userId].dept) ? USERS[userId].dept.join(', ') : USERS[userId].dept;
                toast(`Role alterada! ${USERS[userId].nome} é o novo gestor de: ${depts}`, 'success');
            } else {
                toast('Role do usuário atualizada com sucesso!', 'success');
            }
        } else {
            toast('Erro: Firebase não configurado corretamente.', 'error');
        }
    } catch (e) {
        console.error('Erro ao salvar role no Firebase', e);
        toast('Erro ao sincronizar com servidor.', 'error');
    }
    
    renderUsers();
}


// =============================================
// INITIALIZATION
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Radar PNSA: App Initializing...');

    // Initialize Users
    if (typeof initUsers === 'function') {
        initUsers();
    }

    // Dynamically populate login dropdown from USERS
    populateLoginDropdown();

    // Login Button
    const btnEnter = document.getElementById('btnEnter');
    if (btnEnter) {
        btnEnter.addEventListener('click', () => {
            const select = document.getElementById('selectUser');
            if (!select || !select.value) {
                toast('Por favor, selecione um usuário.', 'error');
                return;
            }

            const userId = select.value;
            const selectedOption = select.options[select.selectedIndex];

            // Set Global Current User
            currentUser = {
                id: userId,
                nome: selectedOption.text,
                dept: 'Geral', // Default
                role: 'executor' // Default
            };

            // Enrich from USERS if available
            if (USERS && USERS[userId]) {
                currentUser = USERS[userId];
            } else {
                // Fallback heuristics if ID not in USERS (should not happen with match)
                if (userId.includes('gestao')) { currentUser.role = 'coordinator'; currentUser.dept = 'Gestão'; }
                if (userId.includes('sm')) { currentUser.dept = 'Social Media'; }
                if (userId.includes('dg')) { currentUser.dept = 'Designer'; }
                if (userId.includes('vm')) { currentUser.dept = 'Videomaker'; }
                if (userId.includes('sp')) { currentUser.dept = 'Suporte'; }
                if (userId.includes('ti')) { currentUser.dept = 'Inovação/TI'; }
            }

            // Save to session/local
            localStorage.setItem('sgta-user', JSON.stringify(currentUser));

            // UI Transition
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('app').style.display = 'flex';

            // Init App
            loadDataFirestore().then(() => {
                renderKanban();
                const lastView = localStorage.getItem('sgta-last-view') || 'minha-area';
                navigateTo(lastView);

            });
        });
    }

    // Google Login agora é via firebase-config.js e interface principal

    // Check for saved user to auto-login
    const savedUser = localStorage.getItem('sgta-user');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            loadDataFirestore().then(() => {
                const loginScreen = document.getElementById('loginScreen');
                const app = document.getElementById('app');

                // Atraso inserido para permitir que a bela animação do Remotion carregue e toque
                setTimeout(() => {
                    if (loginScreen) loginScreen.style.display = 'none';
                    if (app) app.style.display = 'flex';

                    renderKanban();
                    const smartView = getSmartInitialView();
                    navigateTo(smartView);
                }, 4000); // 4 Segundos de animação de entrada
            });
        } catch (e) {
            console.error('Error auto-login: ', e);
        }
    }
});

// =============================================
// MODAL DE ENTREGA KANBAN (Aprovação)
// =============================================
window.handleEntregaFile = function (input) {
    const files = input.files;
    if (files && files.length > 0) {
        window.currentEntregaFiles = Array.from(files);
        const names = window.currentEntregaFiles.map(f => f.name).join(', ');
        const label = names.length > 40 ? names.substring(0, 40) + '...' : names;
        document.getElementById('entregaFileName').textContent = label;
    } else {
        window.currentEntregaFiles = [];
        document.getElementById('entregaFileName').textContent = "Clique ou arraste as imagens aqui";
    }
};

window.submitEntrega = async function () {
    const taskId = window.currentEntregaTaskId;
    const task = demandas.find(d => d.id === taskId);
    if (!task) return;

    const tipo = window.currentEntregaTipo; // 'arte' ou 'video'
    let entregasUrl = [];

    const btn = document.getElementById('btnSubmitEntrega');
    const originalText = btn.innerHTML;

    if (tipo === 'arte') {
        const files = window.currentEntregaFiles || [];
        if (files.length === 0) {
            toast('Selecione ao menos uma imagem para enviar.', 'error');
            return;
        }
        try {
            btn.innerHTML = 'Enviando... <svg class="spinner" viewBox="0 0 50 50" style="width:16px;height:16px;animation:spin_t 1s linear infinite;"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="80" stroke-dashoffset="60" stroke-linecap="round"></circle></svg>';
            btn.disabled = true;

            const storage = window.firebaseStorage;

            // Faz o upload em paralelo de todas as artes selecionadas
            const uploadPromises = files.map(async (file, index) => {
                const nomeArquivo = `arquivos_demandas/${taskId}/entrega_${Date.now()}_${index}_${file.name}`;
                const refStorage = window.ref(storage, nomeArquivo);
                const snapshot = await window.uploadBytes(refStorage, file);
                return await window.getDownloadURL(snapshot.ref);
            });

            entregasUrl = await Promise.all(uploadPromises);

        } catch (error) {
            console.error('Erro no upload das artes', error);
            toast('Erro ao fazer upload das artes. O Storage está ativo no Firebase?', 'error');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }
    } else if (tipo === 'video') {
        const linksText = document.getElementById('entregaLinkInput').value;
        // Divide o texto do textarea em links considerando vírgulas ou quebras de linha
        const links = linksText.split(/[\n,]+/).map(l => l.trim()).filter(l => l.length > 0);

        if (links.length === 0) {
            toast('Cole ao menos um link de vídeo para enviar.', 'error');
            return;
        }
        entregasUrl = links;
    }

    // Salva na tarefa (Criamos um novo campo 'entregasUrl' como array)
    task.entregasUrl = entregasUrl;
    // Opcional: Manter retrocompatibilidade com o app base se ainda quiser a primeira thumbnail no Dashboard
    task.entregaUrl = entregasUrl[0] || '';
    task.entregaTipo = tipo;

    btn.innerHTML = originalText;
    btn.disabled = false;
    closeModal('modalEntrega');

    // Força a mudança de status bypassando o bloqueio de upload
    changeTaskStatus(taskId, 'Para aprovação', true);
};

// =============================================
// CUSTOM CHECKLIST TEMPLATES (Personalizados)
// =============================================

function getCustomTemplates() {
    try {
        return JSON.parse(localStorage.getItem('sgta-custom-templates') || '[]');
    } catch (e) {
        return [];
    }
}

function saveCustomTemplatesStorage(templates) {
    localStorage.setItem('sgta-custom-templates', JSON.stringify(templates));
}

function renderCustomTemplateCheckboxes() {
    const container = document.getElementById('customTemplatesContainer');
    if (!container) return;

    const templates = getCustomTemplates();

    if (templates.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 12px; font-style: italic;">Nenhum template personalizado criado ainda. Clique em "➕ Criar Novo Template" para começar.</p>';
        return;
    }

    container.innerHTML = templates.map((tpl, idx) => `
        <div class="form-group checkbox-group" style="padding: 10px; background: rgba(99,102,241,0.05); border-radius: 8px; border: 1px solid rgba(99,102,241,0.15); margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                <input type="checkbox" class="custom-template-check" id="ctCheck_${idx}" data-tpl-index="${idx}" style="width: auto;">
                <label for="ctCheck_${idx}" style="font-weight: 600; font-size: 13px; color: var(--primary, #6366f1); cursor: pointer; flex: 1;">
                    📋 ${tpl.name} <span style="font-weight: 400; color: var(--text-muted); font-size: 11px;">(${tpl.items.length} itens)</span>
                </label>
            </div>
            <button type="button" onclick="deleteCustomTemplate(${idx})" title="Excluir template" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 16px; padding: 4px 8px; border-radius: 4px; transition: all 0.2s;" onmouseenter="this.style.color='#ef4444'" onmouseleave="this.style.color='var(--text-muted)'">🗑️</button>
        </div>
    `).join('');
}

function openCustomTemplateModal() {
    // Limpar campos
    document.getElementById('ctNome').value = '';
    const list = document.getElementById('ctItemsList');
    list.innerHTML = '';

    // Adicionar 3 inputs iniciais
    for (let i = 0; i < 3; i++) {
        addTemplateItemInput();
    }

    document.getElementById('modalCustomTemplate').classList.add('active');
}

function addTemplateItemInput() {
    const list = document.getElementById('ctItemsList');
    const count = list.children.length + 1;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display: flex; align-items: center; gap: 8px;';

    const num = document.createElement('span');
    num.textContent = count + '.';
    num.style.cssText = 'font-weight: 700; color: var(--primary, #6366f1); min-width: 24px; font-size: 13px;';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'ct-item-input';
    input.placeholder = `Item ${count} do checklist...`;
    input.style.cssText = 'flex: 1; font-size: 13px;';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '✕';
    removeBtn.style.cssText = 'background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 16px; padding: 4px; border-radius: 4px;';
    removeBtn.onclick = function () {
        wrapper.remove();
        // Renumerar
        document.querySelectorAll('#ctItemsList > div').forEach((el, i) => {
            el.querySelector('span').textContent = (i + 1) + '.';
            el.querySelector('input').placeholder = `Item ${i + 1} do checklist...`;
        });
    };

    wrapper.appendChild(num);
    wrapper.appendChild(input);
    wrapper.appendChild(removeBtn);
    list.appendChild(wrapper);

    input.focus();
}

function saveCustomTemplate() {
    const name = document.getElementById('ctNome').value.trim();
    if (!name) {
        toast('Dê um nome ao template!', 'error');
        return;
    }

    const inputs = document.querySelectorAll('.ct-item-input');
    const items = [];
    inputs.forEach(input => {
        const val = input.value.trim();
        if (val) items.push(val);
    });

    if (items.length === 0) {
        toast('Adicione pelo menos um item ao checklist!', 'error');
        return;
    }

    const templates = getCustomTemplates();
    templates.push({
        name: name,
        items: items,
        createdBy: currentUser?.nome || 'Desconhecido',
        createdAt: new Date().toISOString()
    });

    closeModal('modalCustomTemplate');
    toast(`Template "${name}" criado com ${items.length} itens!`, 'success');

    // Atualizar checkboxes no formulário de criação (se estiver aberto)
    renderCustomTemplateCheckboxes();
}

function deleteCustomTemplate(idx) {
    const templates = getCustomTemplates();
    if (idx < 0 || idx >= templates.length) return;

    const name = templates[idx].name;
    if (!confirm(`Excluir o template "${name}"?`)) return;

    templates.splice(idx, 1);
    saveCustomTemplatesStorage(templates);
    renderCustomTemplateCheckboxes();
    toast(`Template "${name}" excluído.`, 'success');
}

// =============================================
// TRANSMISSÃO — PROGRAMAÇÃO SEMANAL
// =============================================

const TRANS_PROGRAMAS_SEMANA = [
    { id: 'intimidade', nome: 'Programa Intimidade com Deus', horario: '11:00' },
    { id: 'misericordia', nome: 'Programa Hora da Misericórdia', horario: '15:00' },
    { id: 'grupo_missa', nome: 'Grupo/Missa', horario: '19:30' }
];

const TRANS_PROGRAMAS_SABADO = [
    { id: 'missa_desatadora', nome: 'Missa Desatadora dos Nós', horario: '15:00' }
];

const TRANS_PROGRAMAS_DOMINGO = [
    { id: 'missa_dom_730', nome: 'Missa Dominical', horario: '07:30' },
    { id: 'missa_dom_10', nome: 'Missa Dominical', horario: '10:00' },
    { id: 'missa_dom_1930', nome: 'Missa Dominical', horario: '19:30' }
];

const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

function getTransProgramasDia(diaIdx) {
    if (diaIdx === 5) return TRANS_PROGRAMAS_SABADO;
    if (diaIdx === 6) return TRANS_PROGRAMAS_DOMINGO;
    return TRANS_PROGRAMAS_SEMANA;
}

function buildTransmissaoWeekGrid() {
    const grid = document.getElementById('transWeekGrid');
    if (!grid) return;

    // Setar semana padrão (próxima segunda-feira)
    const semanaInput = document.getElementById('cTransSemana');
    if (semanaInput && !semanaInput.value) {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = dayOfWeek === 0 ? 1 : (dayOfWeek === 1 ? 0 : 8 - dayOfWeek);
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + diff);
        semanaInput.value = nextMonday.toISOString().split('T')[0];
    }

    grid.innerHTML = DIAS_SEMANA.map((dia, idx) => {
        const programas = getTransProgramasDia(idx);
        return `
        <div style="background:var(--surface-light, #1a1a2e); border-radius:10px; padding:14px; border:1px solid var(--border-color);">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                <span style="font-weight:700; font-size:15px; color:var(--text-color);">📅 ${dia}</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:6px;">
                ${programas.map(p => `
                    <label style="display:flex; align-items:center; gap:8px; padding:6px 10px; border-radius:8px; cursor:pointer; transition:background 0.15s; background:var(--surface, #111);">
                        <input type="checkbox" class="trans-check" data-dia="${idx}" data-programa="${p.id}" data-nome="${p.nome}" data-horario="${p.horario}">
                        <span style="flex:1; font-size:13px; color:var(--text-color);">${p.nome}</span>
                        <span style="font-size:12px; color:var(--text-secondary); font-weight:600;">${p.horario}</span>
                    </label>
                `).join('')}
                <div style="border-top:1px solid var(--border-color); padding-top:8px; margin-top:4px;">
                    <div id="transCustomList_${idx}" style="display:flex; flex-direction:column; gap:6px;"></div>
                    <button type="button" onclick="addTransCustom(${idx})" style="display:flex; align-items:center; gap:6px; padding:6px 10px; border-radius:8px; cursor:pointer; background:var(--surface, #111); border:1px dashed var(--border-color); color:var(--brand-primary); font-weight:600; font-size:13px; width:100%; margin-top:4px;">
                        + Personalizado
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');
}

let transCustomCounter = 0;

function addTransCustom(diaIdx) {
    const list = document.getElementById(`transCustomList_${diaIdx}`);
    if (!list) return;
    const cid = transCustomCounter++;
    const row = document.createElement('div');
    row.id = `transCustomRow_${cid}`;
    row.style.cssText = 'display:flex; align-items:center; gap:6px;';
    row.innerHTML = `
        <input type="text" class="trans-custom-nome" data-dia="${diaIdx}" placeholder="Nome do evento" style="flex:2; padding:8px; border-radius:6px; border:1px solid var(--border-color); background:var(--surface-light); color:var(--text-color); font-size:13px;">
        <input type="time" class="trans-custom-hora" data-dia="${diaIdx}" value="20:00" style="width:100px; padding:8px; border-radius:6px; border:1px solid var(--border-color); background:var(--surface-light); color:var(--text-color); font-size:13px;">
        <button type="button" onclick="document.getElementById('transCustomRow_${cid}').remove()" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:16px; padding:4px;">✕</button>
    `;
    list.appendChild(row);
    row.querySelector('input').focus();
}

function getTransmissaoSelections() {
    const semanaStr = document.getElementById('cTransSemana').value;
    if (!semanaStr) return [];

    const monday = new Date(semanaStr + 'T12:00:00');
    const selections = [];

    // Programas fixos marcados
    document.querySelectorAll('.trans-check:checked').forEach(cb => {
        const diaIdx = parseInt(cb.dataset.dia);
        const diaDate = new Date(monday);
        diaDate.setDate(monday.getDate() + diaIdx);
        const dateStr = diaDate.toISOString().split('T')[0];

        selections.push({
            dia: DIAS_SEMANA[diaIdx],
            diaIdx,
            date: dateStr,
            programa: cb.dataset.nome,
            horario: cb.dataset.horario,
            dataHoraFim: `${dateStr}T${cb.dataset.horario}:00`
        });
    });

    // Personalizados (múltiplos por dia)
    DIAS_SEMANA.forEach((dia, diaIdx) => {
        const nomes = document.querySelectorAll(`#transCustomList_${diaIdx} .trans-custom-nome`);
        const horas = document.querySelectorAll(`#transCustomList_${diaIdx} .trans-custom-hora`);
        nomes.forEach((input, i) => {
            const nome = input.value.trim();
            const horario = horas[i]?.value || '20:00';
            if (!nome) return;

            const diaDate = new Date(monday);
            diaDate.setDate(monday.getDate() + diaIdx);
            const dateStr = diaDate.toISOString().split('T')[0];

            selections.push({
                dia,
                diaIdx,
                date: dateStr,
                programa: nome,
                horario,
                dataHoraFim: `${dateStr}T${horario}:00`
            });
        });
    });

    return selections;
}

window.buildTransmissaoWeekGrid = buildTransmissaoWeekGrid;
window.addTransCustom = addTransCustom;
window.getTransmissaoSelections = getTransmissaoSelections;

// =============================================
// FLOATING IT SUPPORT BUTTON
// =============================================
function previewITFiles(input) {
    const preview = document.getElementById('itAnexosPreview');
    const count = document.getElementById('itAnexosCount');
    preview.innerHTML = '';
    if (!input.files || input.files.length === 0) { count.textContent = ''; return; }
    count.textContent = `${input.files.length} arquivo(s) selecionado(s)`;
    Array.from(input.files).forEach((file, i) => {
        const tag = document.createElement('div');
        tag.style.cssText = 'display:flex; align-items:center; gap:6px; background:var(--surface-light, #f3f4f6); border-radius:8px; padding:4px 10px; font-size:12px;';
        const isImg = file.type.startsWith('image/');
        tag.innerHTML = `${isImg ? '🖼️' : '📄'} <span style="max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${file.name}</span> <span style="color:var(--text-tertiary);">(${(file.size/1024).toFixed(0)} KB)</span>`;
        preview.appendChild(tag);
    });
}
window.previewITFiles = previewITFiles;

function openITSupportModal() {
    if (typeof openChamadoTIModal === 'function') {
        // Ignora o modal velho (modalITSupport) e redireciona para o modal novo (modalChamadoTI) que contém a Categoria
        openChamadoTIModal();
        return;
    }
}

window.openITSupportModal = openITSupportModal;

async function submitITSupport() {
    const solicitanteId = document.getElementById('itSolicitante').value;
    const responsavelId = document.getElementById('itResponsavel').value;
    const problema = document.getElementById('itProblema').value.trim();
    const link = document.getElementById('itLink').value.trim();
    const anexosInput = document.getElementById('itAnexos');

    if (!solicitanteId || !responsavelId || !problema) {
        toast('Por favor, preencha todos os campos do chamado.', 'error');
        return;
    }

    try {
        const btn = document.getElementById('btnSubmitIT');
        if (btn) {
            btn.dataset.originalText = btn.innerHTML;
            btn.innerHTML = 'Enviando...';
            btn.disabled = true;
        }

        const nomeAbreviado = problema.length > 40 ? problema.substring(0, 40) + '...' : problema;
        const taskId = `WF-${String(typeof nextId !== 'undefined' ? nextId++ : Date.now()).padStart(4, '0')}`;

        // Upload anexos via Firebase Storage
        const attachments = [];
        if (anexosInput && anexosInput.files && anexosInput.files.length > 0) {
            toast('⏳ Enviando anexos...', 'info');
            for (let i = 0; i < anexosInput.files.length; i++) {
                const file = anexosInput.files[i];
                let type = 'doc';
                if (file.type.startsWith('image/')) type = 'image';
                else if (file.type === 'application/pdf') type = 'pdf';
                else if (file.type.startsWith('video/')) type = 'video';

                const storageRef = window.ref(window.firebaseStorage, `arquivos_demandas/${taskId}/${Date.now()}_${file.name}`);
                try {
                    await window.uploadBytes(storageRef, file);
                    const docUrl = await window.getDownloadURL(storageRef);
                    attachments.push({
                        name: file.name,
                        type: type,
                        size: (file.size / 1024).toFixed(1) + ' KB',
                        date: new Date().toISOString(),
                        uploadedBy: (USERS && USERS[solicitanteId]) ? USERS[solicitanteId].nome : 'Usuário',
                        url: docUrl
                    });
                } catch (upErr) {
                    console.error('Erro ao enviar anexo:', upErr);
                    toast('Erro ao enviar ' + file.name, 'error');
                }
            }
        }

        // Adicionar link como anexo se fornecido
        if (link) {
            attachments.push({
                name: link,
                type: 'link',
                size: '-',
                date: new Date().toISOString(),
                uploadedBy: (USERS && USERS[solicitanteId]) ? USERS[solicitanteId].nome : 'Usuário',
                url: link
            });
        }

        const task = {
            id: taskId,
            nome: `Chamado TI: ${nomeAbreviado}`,
            solicitanteId: solicitanteId,
            responsavelId: responsavelId,
            tipoProjeto: 'TI',
            subType: 'SUPORTE',
            prioridade: 'Normal',
            dataSolicitacao: new Date().toISOString().split('T')[0],
            dataConclusao: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            titulo: `Chamado TI: ${nomeAbreviado}`,
            detalhes: problema,
            briefing: problema,
            orientacoes: '',
            referencias: link || '',
            textos: '',
            referenciasEventos: {},
            pipeline: [{
                dept: 'Inovação/TI',
                userId: responsavelId,
                status: 'A fazer'
            }],
            currentStage: 0,
            status: 'A fazer',
            dataCriacao: new Date().toISOString(),
            feedback: [],
            tags: ['TI', 'Suporte'],
            formatos: [],
            dependsOn: null,
            pinned: false,
            ti: {
                category: 'Suporte Interno',
                description: problema,
                location: '',
                presence: 'Remoto'
            },
            attachments: attachments
        };

        if (typeof demandas !== 'undefined') {
            demandas.push(task);
        }

        if (typeof saveData === 'function') {
            saveData(task);
        }

        if (typeof notifyUser === 'function') {
            const solName = (USERS && USERS[solicitanteId]) ? USERS[solicitanteId].nome : 'Usuário';
            notifyUser(responsavelId, '💻', `Novo chamado TI de ${solName}`);
        }

        if (typeof closeModal === 'function') {
            closeModal('modalITSupport');
        }

        if (typeof toast === 'function') {
            toast('Chamado de TI aberto com sucesso!', 'success');
        }

        if (typeof refresh === 'function') {
            refresh();
        } else if (typeof renderKanban === 'function') {
            renderKanban();
        }

    } catch (err) {
        console.error('Erro ao criar chamado de TI:', err);
        if (typeof toast === 'function') toast('Erro ao abrir chamado.', 'error');
    } finally {
        const btn = document.getElementById('btnSubmitIT');
        if (btn) {
            btn.innerHTML = btn.dataset.originalText || 'Enviar Chamado';
            btn.disabled = false;
        }
    }
}

window.submitITSupport = submitITSupport;

// =============================================
// NOVO DASHBOARD DO SUPORTE
// =============================================
let suporteDashboardData = {
    canais: [
        { id: 'wa-eventos', name: 'WA Suporte Eventos', values: { 'geral': 0 } },
        { id: 'wa-caravanas', name: 'WA Caravanas', values: { 'geral': 0 } },
        { id: 'wa-criatura', name: 'WA Criatura Santa', values: { 'geral': 0 } },
        { id: 'ig-paroquia', name: 'Instagram Paróquia', values: { 'geral': 0 } },
        { id: 'ig-totus', name: 'Instagram Totus Tuus', values: { 'geral': 0 } }
    ],
    funil: [
        { id: 'f-loja', name: 'Loja Assunção', values: { 'geral': 0 } },
        { id: 'f-totus', name: 'Totus Tuus', values: { 'geral': 0 } },
        { id: 'f-dizimo', name: 'Dízimo', values: { 'geral': 0 } },
        { id: 'f-prog', name: 'Programação da Paróquia', values: { 'geral': 0 } },
        { id: 'f-agend', name: 'Agendamentos com o padre', values: { 'geral': 0 } },
        { id: 'f-outro', name: 'Outro', values: { 'geral': 0 } }
    ]
};

window.currentSuporteUser = 'geral';
window.currentSuporteDate = null; // null = hoje

window.getSuporteDateKey = function() {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000; 
    return (new Date(d - offset)).toISOString().split('T')[0];
}

function migrateSuporteItem(item) {
    if (!item.history) {
        item.history = {};
    }
    const today = window.getSuporteDateKey();
    
    if (!item.values) {
        if (item.value !== undefined) {
            item.values = { 'geral': item.value || 0 };
        } else {
            item.values = { 'geral': 0 };
        }
    }
    delete item.value;
    
    if (Object.keys(item.history).length === 0 && item.values) {
        item.history[today] = JSON.parse(JSON.stringify(item.values));
    }
    
    if (!item.history[today]) {
        item.history[today] = {};
    }
}

function getSuporteVal(item) {
    migrateSuporteItem(item);
    const dateKey = window.currentSuporteDate || window.getSuporteDateKey();
    const dayData = item.history[dateKey] || {};
    
    if (window.currentSuporteUser === 'geral') {
        let sum = 0;
        for (let key in dayData) {
            if (Object.prototype.hasOwnProperty.call(dayData, key)) {
                const val = parseInt(dayData[key], 10);
                if (!isNaN(val)) sum += val;
            }
        }
        return sum;
    }
    return parseInt(dayData[window.currentSuporteUser], 10) || 0;
}

function setSuporteVal(item, val) {
    migrateSuporteItem(item);
    const dateKey = window.currentSuporteDate || window.getSuporteDateKey();
    if (!item.history[dateKey]) item.history[dateKey] = {};
    item.history[dateKey][window.currentSuporteUser] = val;
}

// Flag to avoid duplicate listeners
let _suporteSnapshotActive = false;

function initSuporteRealtimeListener() {
    if (_suporteSnapshotActive || !window.firebaseDb || !window.onSnapshot) return;
    _suporteSnapshotActive = true;
    console.log('🔄 Suporte: Listener em tempo real ATIVADO');
    
    try {
        window.onSnapshot(window.doc(window.firebaseDb, 'config', 'suporteDashboard'), (docSnap) => {
            if (docSnap.exists()) {
                console.log('📡 Suporte: Dados recebidos do Firebase em tempo real', new Date().toLocaleTimeString());
                applySuporteData(docSnap.data());
                // Re-render if user is currently viewing the Suporte dashboard
                if (currentDept === 'Suporte') {
                    renderSuporteDashboard(false);
                }
            }
        }, (error) => {
            console.error("❌ Erro no listener em tempo real do Suporte:", error);
        });
    } catch(e) {
        console.error("❌ Erro ao configurar listener do Suporte:", e);
    }
}

function applySuporteData(data) {
    if (data.canais) {
        let loadedCanais = typeof data.canais === 'string' ? JSON.parse(data.canais) : data.canais;
        if (!Array.isArray(loadedCanais)) loadedCanais = Object.values(loadedCanais);
        
        // REPAIR CORRUPT DATA
        loadedCanais = loadedCanais.filter(l => l && typeof l === 'object');
        loadedCanais.forEach((l, idx) => {
            if (!l.id) l.id = 'c-repaired-' + idx + '-' + Date.now();
            if (!l.name && !l.nome) l.name = 'Canal Recuperado ' + (idx + 1);
            migrateSuporteItem(l);
        });
        
        suporteDashboardData.canais = loadedCanais;
    }
    if (data.funil) {
        let loadedFunil = typeof data.funil === 'string' ? JSON.parse(data.funil) : data.funil;
        if (!Array.isArray(loadedFunil)) loadedFunil = Object.values(loadedFunil);
        
        // REPAIR CORRUPT DATA
        loadedFunil = loadedFunil.filter(l => l && typeof l === 'object');
        loadedFunil.forEach((l, idx) => {
            if (!l.id) l.id = 'f-repaired-' + idx + '-' + Date.now();
            if (!l.name && !l.nome) l.name = 'Funil Recuperado ' + (idx + 1);
            migrateSuporteItem(l);
        });
        
        suporteDashboardData.funil = loadedFunil;
    }
    // Also update localStorage as backup
    localStorage.setItem('sgta-suporte-dashboard', JSON.stringify(suporteDashboardData));
}

async function loadSuporteDashboard() {
    // Start the real-time listener if not yet active
    initSuporteRealtimeListener();
    
    try {
        const docSnap = await window.getDoc(window.doc(window.firebaseDb, 'config', 'suporteDashboard'));
        if (docSnap.exists()) {
            applySuporteData(docSnap.data());
        } else {
            loadSuporteDashboardFallback();
        }
    } catch (e) {
        loadSuporteDashboardFallback();
    }
}

function loadSuporteDashboardFallback() {
    const local = localStorage.getItem('sgta-suporte-dashboard');
    if (local) {
        const data = JSON.parse(local);
        if (data.canais) {
            data.canais.forEach(l => migrateSuporteItem(l));
            // Replace the entire canais list with loaded data to preserve all fields including history
            suporteDashboardData.canais = data.canais;
        }
        if (data.funil) {
            data.funil.forEach(migrateSuporteItem);
            suporteDashboardData.funil = data.funil;
        }
    }
}

async function saveSuporteDashboard() {
    // Serialize to clean JSON to avoid Firestore issues with complex objects
    const cleanData = JSON.parse(JSON.stringify(suporteDashboardData));
    localStorage.setItem('sgta-suporte-dashboard', JSON.stringify(cleanData));
    try {
        await window.setDoc(window.doc(window.firebaseDb, 'config', 'suporteDashboard'), cleanData);
        console.log('✅ Suporte Dashboard salvo no Firebase com sucesso');
    } catch(e) {
        console.error('❌ Erro ao salvar Suporte no Firebase:', e);
    }
}

window.mudarSuporteUser = function(userId) {
    window.currentSuporteUser = userId;
    localStorage.setItem('sgta-last-suporte-user', userId); // Lembrar usuário
    renderSuporteDashboard(false);
}

function saveSuporteLocalStorage() {
    const cleanData = JSON.parse(JSON.stringify(suporteDashboardData));
    localStorage.setItem('sgta-suporte-dashboard', JSON.stringify(cleanData));
}

window.mudarDataSuporte = function(dateStr) {
    window.currentSuporteDate = dateStr || null;
    renderSuporteDashboard(false);
}

window.atualizarValorSuporte = async function(tipo, id, delta) {
    const docRef = window.doc(window.firebaseDb, 'config', 'suporteDashboard');
    const dateKey = window.currentSuporteDate || window.getSuporteDateKey();
    const uId = window.currentSuporteUser;
    
    // Atualização otimista na tela
    const localArr = tipo === 'canal' ? suporteDashboardData.canais : suporteDashboardData.funil;
    const localIdx = localArr.findIndex(x => x.id === id);
    if (localIdx !== -1) {
        let current = getSuporteVal(localArr[localIdx]);
        setSuporteVal(localArr[localIdx], Math.max(0, current + delta));
        renderSuporteDashboard(false);
    }
    
    try {
        await window.runTransaction(window.firebaseDb, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            if (!docSnap.exists()) throw "Doc não existe!";
            
            const data = docSnap.data();
            const arrName = tipo === 'canal' ? 'canais' : 'funil';
            const arr = data[arrName] || [];
            
            const idx = arr.findIndex(x => x.id === id);
            if (idx === -1) return;
            
            const item = arr[idx];
            if (!item.history) item.history = {};
            if (!item.history[dateKey]) item.history[dateKey] = {};
            
            // Lógica do 'geral'
            let targetUser = uId;
            if (uId === 'geral') {
                // Se estiver na visão geral, incrementa no 'geral'
                targetUser = 'geral';
            }
            
            let current = parseInt(item.history[dateKey][targetUser], 10) || 0;
            let newVal = Math.max(0, current + delta);
            item.history[dateKey][targetUser] = newVal;
            
            transaction.update(docRef, { [arrName]: arr });
        });
        console.log('✅ Valor atualizado com segurança no servidor!');
    } catch(e) {
        console.error('❌ Falha na transação:', e);
        saveSuporteDashboard(); // Fallback de emergência (não ideal, mas mantém funcionando se offline)
    }
}

window.setValorManualmenteSuporte = async function(tipo, id, valorAtual) {
    const input = prompt('Digite o novo valor:', valorAtual || 0);
    if (input === null) return;
    const val = parseInt(input, 10);
    
    if (!isNaN(val) && val >= 0) {
        const docRef = window.doc(window.firebaseDb, 'config', 'suporteDashboard');
        const dateKey = window.currentSuporteDate || window.getSuporteDateKey();
        const uId = window.currentSuporteUser;
        
        // Atualização otimista na tela
        const localArr = tipo === 'canal' ? suporteDashboardData.canais : suporteDashboardData.funil;
        const localIdx = localArr.findIndex(x => x.id === id);
        if (localIdx !== -1) {
            setSuporteVal(localArr[localIdx], val);
            renderSuporteDashboard(false);
        }
        
        try {
            await window.runTransaction(window.firebaseDb, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) throw "Doc não existe!";
                
                const data = docSnap.data();
                const arrName = tipo === 'canal' ? 'canais' : 'funil';
                const arr = data[arrName] || [];
                
                const idx = arr.findIndex(x => x.id === id);
                if (idx === -1) return;
                
                const item = arr[idx];
                if (!item.history) item.history = {};
                if (!item.history[dateKey]) item.history[dateKey] = {};
                
                let targetUser = uId;
                if (uId === 'geral') targetUser = 'geral';
                
                item.history[dateKey][targetUser] = val;
                
                transaction.update(docRef, { [arrName]: arr });
            });
            console.log('✅ Valor atualizado manualmente com segurança!');
        } catch(e) {
            console.error('❌ Falha na transação manual:', e);
            saveSuporteDashboard();
        }
    } else {
        alert('Valor inválido. Digite um número positivo.');
    }
}

window.sincronizarDadosSuporte = async function() {
    const btn = document.getElementById('btnSyncSuporte');
    if (btn) btn.textContent = 'Sincronizando...';
    try {
        const localDataStr = localStorage.getItem('sgta-suporte-dashboard');
        if (!localDataStr) {
            alert('Sem dados locais para sincronizar.');
            if (btn) btn.textContent = 'Sincronizar Dados Locais';
            return;
        }
        const localData = JSON.parse(localDataStr);
        const docRef = window.doc(window.firebaseDb, 'config', 'suporteDashboard');
        
        await window.runTransaction(window.firebaseDb, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            if (!docSnap.exists()) throw "Doc não existe no server!";
            const serverData = docSnap.data();
            
            if (localData.canais) {
                if (!serverData.canais) {
                    serverData.canais = [];
                } else if (!Array.isArray(serverData.canais)) {
                    serverData.canais = Object.values(serverData.canais);
                }
                
                localData.canais.forEach(localItem => {
                    let serverItem = serverData.canais.find(x => x.id === localItem.id);
                    if (!serverItem) {
                        serverData.canais.push(JSON.parse(JSON.stringify(localItem)));
                    } else {
                        if (localItem.history) {
                            if (!serverItem.history) serverItem.history = {};
                            Object.keys(localItem.history).forEach(date => {
                                if (!serverItem.history[date]) serverItem.history[date] = {};
                                Object.keys(localItem.history[date]).forEach(uid => {
                                    const localVal = parseInt(localItem.history[date][uid], 10) || 0;
                                    const serverVal = parseInt(serverItem.history[date][uid], 10) || 0;
                                    // Manter sempre o maior valor para evitar perda de cliques de outras pessoas
                                    if (localVal > serverVal) {
                                        serverItem.history[date][uid] = localVal;
                                    }
                                });
                            });
                        }
                    }
                });
            }
            transaction.update(docRef, { canais: serverData.canais });
        });
        alert('✅ Dados locais mesclados com o servidor com sucesso! A contagem de todo mundo foi unificada.');
        if (btn) btn.style.display = 'none';
        renderSuporteDashboard(false);
    } catch(e) {
        console.error('Erro na sincronização:', e);
        alert('Erro ao sincronizar. Veja o console.');
        if (btn) btn.textContent = 'Erro ao Sincronizar';
    }
}

window.adicionarCanalAtendimento = function() {
    const name = prompt('Digite o nome do novo canal:');
    if (!name || name.trim() === '') return;
    const newId = 'c-custom-' + Date.now();
    suporteDashboardData.canais.push({ id: newId, name: name.trim(), values: { 'geral': 0 } });
    saveSuporteDashboard();
    renderSuporteDashboard(false);
}

window.renomearCanalAtendimento = async function(id) {
    const arr = suporteDashboardData.canais;
    const item = arr.find(x => x.id === id);
    if (!item) return;
    const currentName = item.name || item.nome || item.id;
    const novoNome = prompt('Digite o novo nome para o canal:', currentName === item.id ? '' : currentName);
    if (!novoNome || novoNome.trim() === '') return;
    
    item.name = novoNome.trim();
    renderSuporteDashboard(false); 
    
    try {
        const docRef = window.doc(window.firebaseDb, 'config', 'suporteDashboard');
        await window.runTransaction(window.firebaseDb, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            if (!docSnap.exists()) throw "Doc não existe!";
            const serverData = docSnap.data();
            let serverArr = serverData.canais || [];
            if (!Array.isArray(serverArr)) serverArr = Object.values(serverArr);
            
            const serverItem = serverArr.find(x => x.id === id);
            if (serverItem) {
                serverItem.name = item.name;
            } else {
                const localIdx = suporteDashboardData.canais.findIndex(x => x.id === id);
                if (localIdx !== -1 && serverArr[localIdx]) {
                    serverArr[localIdx].name = item.name;
                    serverArr[localIdx].id = id;
                } else {
                    serverArr.push(item);
                }
            }
            transaction.update(docRef, { canais: serverArr });
        });
        console.log('✅ Canal renomeado no servidor!');
    } catch(e) {
        console.error('Erro ao renomear no servidor', e);
        saveSuporteDashboard(); 
    }
}

window.forcarSincronizacaoMestra = async function() {
    try {
        const cleanData = JSON.parse(JSON.stringify(suporteDashboardData));
        const docRef = window.doc(window.firebaseDb, 'config', 'suporteDashboard');
        await window.updateDoc(docRef, cleanData);
        alert('Nuvem atualizada com sucesso! Peça para as meninas darem F5 agora.');
    } catch(e) {
        alert('Erro ao forçar gravação: ' + e);
        console.error(e);
    }
}

window.removerCanalAtendimento = function(id) {
    if(!confirm('Tem certeza que deseja remover este canal?')) return;
    suporteDashboardData.canais = suporteDashboardData.canais.filter(x => x.id !== id);
    saveSuporteDashboard();
    renderSuporteDashboard(false);
}

window.adicionarCategoriaFunil = function() {
    const name = prompt('Digite o nome da nova categoria:');
    if (!name || name.trim() === '') return;
    const newId = 'f-custom-' + Date.now();
    suporteDashboardData.funil.push({ id: newId, name: name.trim(), values: { 'geral': 0 } });
    saveSuporteDashboard();
    renderSuporteDashboard(false);
}

window.renomearCategoriaFunil = async function(id) {
    const arr = suporteDashboardData.funil;
    const item = arr.find(x => x.id === id);
    if (!item) return;
    const currentName = item.name || item.nome || item.id;
    const novoNome = prompt('Digite o novo nome para a categoria do funil:', currentName === item.id ? '' : currentName);
    if (!novoNome || novoNome.trim() === '') return;
    
    item.name = novoNome.trim();
    renderSuporteDashboard(false);
    
    try {
        const docRef = window.doc(window.firebaseDb, 'config', 'suporteDashboard');
        await window.runTransaction(window.firebaseDb, async (transaction) => {
            const docSnap = await transaction.get(docRef);
            if (!docSnap.exists()) throw "Doc não existe!";
            const serverData = docSnap.data();
            let serverArr = serverData.funil || [];
            if (!Array.isArray(serverArr)) serverArr = Object.values(serverArr);
            
            const serverItem = serverArr.find(x => x.id === id);
            if (serverItem) {
                serverItem.name = item.name;
            } else {
                const localIdx = suporteDashboardData.funil.findIndex(x => x.id === id);
                if (localIdx !== -1 && serverArr[localIdx]) {
                    serverArr[localIdx].name = item.name;
                    serverArr[localIdx].id = id;
                } else {
                    serverArr.push(item);
                }
            }
            transaction.update(docRef, { funil: serverArr });
        });
    } catch(e) {
        saveSuporteDashboard();
    }
}

window.removerCategoriaFunil = function(id) {
    if(!confirm('Tem certeza que deseja remover esta categoria?')) return;
    suporteDashboardData.funil = suporteDashboardData.funil.filter(x => x.id !== id);
    saveSuporteDashboard();
    renderSuporteDashboard(false);
}

window.gerarHtmlListaPerguntas = function(f) {
    if (!f.perguntas || f.perguntas.length === 0) {
        return `<div style="text-align: center; color: var(--text-muted, #a1a1aa); padding: 30px; font-style: italic;">Nenhuma pergunta frequente cadastrada para esta categoria.</div>`;
    }
    return f.perguntas.map((p, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; background: rgba(255,255,255,0.03); padding: 12px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="color: var(--text-color, #f0f0f5); font-size: 13px; line-height: 1.4; padding-right: 10px; word-break: break-word;">${p}</div>
            <button onclick="window.removerPergunta('${f.id}', ${idx})" title="Remover" style="background: rgba(239,68,68,0.1); border:none; color: #ef4444; width: 26px; height: 26px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; display: flex; align-items:center; justify-content:center; flex-shrink: 0; transition: background 0.2s;">&times;</button>
        </div>
    `).join('');
}

window.salvarNovaPergunta = function(id) {
    const input = document.getElementById('novaPerguntaInput');
    const val = input.value.trim();
    if(!val) return;
    
    const f = suporteDashboardData.funil.find(x => x.id === id) || suporteDashboardData.canais.find(x => x.id === id);
    if(f) {
        f.perguntas = f.perguntas || [];
        f.perguntas.push(val);
        saveSuporteDashboard();
        const container = document.getElementById('listaPerguntasContainer');
        if(container) container.innerHTML = window.gerarHtmlListaPerguntas(f);
        input.value = '';
        input.focus();
    }
}

window.removerPergunta = function(id, idx) {
    const f = suporteDashboardData.funil.find(x => x.id === id) || suporteDashboardData.canais.find(x => x.id === id);
    if(f && f.perguntas) {
        if(confirm('Tem certeza que deseja remover esta pergunta?')) {
            f.perguntas.splice(idx, 1);
            saveSuporteDashboard();
            const container = document.getElementById('listaPerguntasContainer');
            if(container) container.innerHTML = window.gerarHtmlListaPerguntas(f);
        }
    }
}

window.fecharModalPerguntas = function() {
    const el = document.getElementById('suporteModalPerguntasOverlay');
    if(el) el.remove();
}

window.abrirModalPerguntas = function(id) {
    const f = suporteDashboardData.funil.find(x => x.id === id) || suporteDashboardData.canais.find(x => x.id === id);
    if(!f) return;
    f.perguntas = f.perguntas || [];
    
    let html = `
    <div id="suporteModalPerguntasOverlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:9999; display:flex; justify-content:center; align-items:center; opacity: 0; animation: fadeInModal 0.2s forwards;">
        <div style="background: var(--surface, #1e1e24); border: 1px solid var(--border-color, rgba(255,255,255,0.1)); padding: 30px; border-radius: 16px; width: 550px; max-width: 90vw; max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h2 style="margin: 0; color: var(--text-color, #f0f0f5); font-size: 18px; display:flex; align-items:center; gap:8px;"><span>💬</span> Perguntas Frequentes</h2>
                <button onclick="window.fecharModalPerguntas()" style="background: rgba(239,68,68,0.1); border: none; color: #ef4444; width: 32px; height: 32px; border-radius: 8px; font-weight: bold; font-size: 16px; cursor: pointer;">&times;</button>
            </div>
            <p style="color: var(--text-muted, #a1a1aa); font-size: 13px; margin-top: 0; margin-bottom: 20px;">Categoria: <strong>${f.name}</strong></p>
            
            <div style="display:flex; gap: 10px; margin-bottom: 20px;">
                <input type="text" id="novaPerguntaInput" placeholder="Digite a nova pergunta..." style="flex:1; padding: 12px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); color: white; outline: none; font-size: 14px;">
                <button onclick="window.salvarNovaPergunta('${f.id}')" style="background: var(--primary, #6366f1); color: white; border: none; padding: 0 20px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: background 0.2s;">Adicionar</button>
            </div>

            <div id="listaPerguntasContainer" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 4px;">
                ${window.gerarHtmlListaPerguntas(f)}
            </div>
        </div>
        <style>@keyframes fadeInModal { to { opacity: 1; } }</style>
    </div>
    `;
    
    const exist = document.getElementById('suporteModalPerguntasOverlay');
    if(exist) exist.remove();
    
    document.body.insertAdjacentHTML('beforeend', html);
    
    setTimeout(() => {
        const inp = document.getElementById('novaPerguntaInput');
        if(inp) {
            inp.focus();
            inp.addEventListener('keypress', function(e) {
                if(e.key === 'Enter') window.salvarNovaPergunta(f.id);
            });
        }
    }, 50);
}

async function renderSuporteDashboard(fetchFull = true) {
    if (fetchFull) await loadSuporteDashboard();
    const boardTable = document.getElementById('boardTable');
    if (!boardTable) return;
    
    document.getElementById('pageTitle').textContent = 'Departamento Suporte';

    // Gerar opções do Select de Usuários
    let userOptions = `<option value="geral" ${window.currentSuporteUser === 'geral' ? 'selected' : ''}>🌍 Visão Geral (Todos)</option>`;
    if (typeof DEPT_USERS !== 'undefined' && DEPT_USERS['Suporte']) {
        DEPT_USERS['Suporte'].forEach(uid => {
            const u = USERS[uid];
            if (u) {
                userOptions += `<option value="${uid}" ${window.currentSuporteUser === uid ? 'selected' : ''}>👤 ${u.nome}</option>`;
            }
        });
    }

    let isGeral = window.currentSuporteUser === 'geral';
    
    let totalCanais = 0;
    let canaisHtml = suporteDashboardData.canais.map(c => {
        let val = getSuporteVal(c);
        totalCanais += val;
        return `
        <div style="background: var(--surface-light, rgba(255,255,255,0.03)); padding: 20px; border-radius: 16px; border: 1px solid var(--border-color, rgba(255,255,255,0.1)); text-align: center; flex: 1; min-width: 150px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
            <button onclick="removerCanalAtendimento('${c.id}')" title="Remover" style="position: absolute; top: 10px; right: 8px; background: rgba(239,68,68,0.1); border:none; color: #ef4444; width: 26px; height: 26px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; display: flex; align-items:center; justify-content:center; transition: background 0.2s;">×</button>
            <div onclick="renomearCanalAtendimento('${c.id}')" title="Clique para renomear" style="font-weight: 700; font-size: 13px; margin-bottom: 20px; color: var(--text-color, #f0f0f5); margin-top: 10px; cursor: pointer; border-bottom: 1px dashed rgba(255,255,255,0.3); padding-bottom: 2px;">${c.name || c.nome || c.id || 'Sem Nome'}</div>
            ${isGeral ? 
                `<div style="font-size: 42px; font-weight: 900; color: var(--primary, #6366f1); margin-bottom: 15px; padding: 0 10px;">${val}</div>` : 
                `<div onclick="setValorManualmenteSuporte('canal', '${c.id}', ${val})" title="Clique para editar" style="font-size: 42px; font-weight: 900; color: var(--primary, #6366f1); margin-bottom: 15px; cursor: pointer; padding: 0 10px; border-radius: 8px; transition: background 0.2s;" onmouseover="this.style.background='rgba(99,102,241,0.1)'" onmouseout="this.style.background='transparent'">${val}</div>
                 <div style="display: flex; gap: 8px;">
                     <button onclick="atualizarValorSuporte('canal', '${c.id}', -1)" style="width: 40px; height: 40px; border-radius: 8px; border: none; background: rgba(239, 68, 68, 0.1); color: #ef4444; font-weight: bold; font-size: 18px; cursor: pointer; transition: all 0.2s;">-</button>
                     <button onclick="atualizarValorSuporte('canal', '${c.id}', 1)" style="width: 40px; height: 40px; border-radius: 8px; border: none; background: rgba(34, 197, 94, 0.1); color: #22c55e; font-weight: bold; font-size: 18px; cursor: pointer; transition: all 0.2s;">+</button>
                 </div>`
            }
        </div>
        `;
    }).join('');

    let totalFunil = 0;
    let funilHtml = suporteDashboardData.funil.map(f => {
        let val = getSuporteVal(f);
        totalFunil += val;
        return `
        <div style="background: var(--surface-light, rgba(255,255,255,0.03)); padding: 20px; border-radius: 16px; border: 1px solid var(--border-color, rgba(255,255,255,0.1)); display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; transition: transform 0.2s ease;">
            <div style="display:flex; align-items:center; gap: 14px;">
                <button onclick="removerCategoriaFunil('${f.id}')" title="Remover" style="background: rgba(239,68,68,0.1); border:none; color: #ef4444; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 14px; display: flex; align-items:center; justify-content:center;">×</button>
                <div onclick="window.abrirModalPerguntas('${f.id}')" title="Perguntas Frequentes" style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                    <span style="font-weight: 600; font-size: 16px; color: var(--text-color, #f0f0f5); border-bottom: 1px dashed rgba(255,255,255,0.3); padding-bottom: 2px;">${f.name || f.nome || f.id || 'Sem Nome'}</span>
                    <span style="font-size: 16px;">💬</span>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 20px;">
                ${isGeral ? 
                    `<span style="font-size: 26px; font-weight: 800; color: var(--primary, #6366f1); min-width: 50px; text-align: center; padding: 4px 10px;">${val}</span>` :
                    `<span onclick="setValorManualmenteSuporte('funil', '${f.id}', ${val})" title="Clique para editar" style="font-size: 26px; font-weight: 800; color: var(--primary, #6366f1); min-width: 50px; text-align: center; cursor: pointer; padding: 4px 10px; border-radius: 8px; transition: background 0.2s;" onmouseover="this.style.background='rgba(99,102,241,0.1)'" onmouseout="this.style.background='transparent'">${val}</span>
                     <div style="display: flex; gap: 6px;">
                         <button onclick="atualizarValorSuporte('funil', '${f.id}', -1)" style="width: 36px; height: 36px; border-radius: 8px; border: none; background: rgba(239, 68, 68, 0.1); color: #ef4444; font-weight: bold; font-size: 18px; cursor: pointer; transition: all 0.2s;">-</button>
                         <button onclick="atualizarValorSuporte('funil', '${f.id}', 1)" style="width: 36px; height: 36px; border-radius: 8px; border: none; background: rgba(34, 197, 94, 0.1); color: #22c55e; font-weight: bold; font-size: 18px; cursor: pointer; transition: all 0.2s;">+</button>
                     </div>`
                }
            </div>
        </div>
        `;
    }).join('');

    boardTable.innerHTML = `
        <div style="padding: 24px; animation: fadeInSuporte 0.4s ease-out; width: 100%;">
            
            <!-- TOOLBAR PERSONALIZADA DO SUPORTE -->
            <div style="background: var(--surface-light, rgba(255,255,255,0.03)); border: 1px solid var(--border-color, rgba(255,255,255,0.1)); padding: 18px 24px; border-radius: 16px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; box-shadow: 0 8px 30px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center; gap: 16px;">
                    <span style="font-size: 24px;">📊</span>
                    <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: var(--text-color, #f0f0f5);">Dashboard Dinâmico</h2>
                </div>
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    ${window.currentSuporteDate && window.currentSuporteDate !== window.getSuporteDateKey() ? `
                    <div style="background: rgba(234,179,8,0.15); border: 1px solid rgba(234,179,8,0.4); color: #facc15; padding: 8px 14px; border-radius: 8px; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                        ⚠️ Editando: ${window.currentSuporteDate.split('-').reverse().join('/')}
                    </div>` : ''}
                    <label style="font-weight: 600; color: var(--text-muted, #a1a1aa); font-size: 14px;">Data:</label>
                    <input type="date" id="suporteDateFilter" value="${window.currentSuporteDate || window.getSuporteDateKey()}" max="${window.getSuporteDateKey()}" onchange="window.mudarDataSuporte(this.value)" style="background: var(--bg-body, #13131a); color: var(--text-color, #f0f0f5); border: 1px solid var(--border-color, rgba(255,255,255,0.1)); padding: 10px 12px; border-radius: 8px; font-weight: 600; font-size: 14px; outline: none; cursor: pointer;">
                    <label style="font-weight: 600; color: var(--text-muted, #a1a1aa); font-size: 14px;">Filtrar:</label>
                    <select id="suporteUserFilter" onchange="window.mudarSuporteUser(this.value)" style="background: var(--bg-body, #13131a); color: var(--text-color, #f0f0f5); border: 1px solid var(--border-color, rgba(255,255,255,0.1)); padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 14px; outline: none; cursor: pointer; min-width: 200px;">
                        ${userOptions}
                    </select>
                    <button onclick="window.abrirPainelRelatoriosSuporte()" style="background: var(--primary, #6366f1); color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 14px; box-shadow: 0 4px 12px rgba(99,102,241,0.25); transition: all 0.2s; margin-left: 4px;">
                        📊 Gerar Relatórios
                    </button>
                </div>
            </div>

            <!-- CANAIS DE ATENDIMENTO -->
            <div style="margin-bottom: 40px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                    <div style="display:flex; align-items:center; gap:16px;">
                        <h2 style="font-size: 22px; font-weight: 800; color: var(--text-color, #f0f0f5); margin: 0; display:flex; align-items:center; gap:10px;">
                            <span style="font-size: 28px;">📞</span> Canais de Atendimento
                        </h2>
                        <div style="background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); padding: 6px 14px; border-radius: 20px; display: flex; align-items:center; gap:8px;">
                            <span style="font-size: 12px; font-weight: 700; color: var(--primary, #6366f1); text-transform: uppercase;">Total da Visão Atual</span>
                            <span style="font-size: 16px; font-weight: 900; color: var(--primary, #6366f1);">${totalCanais}</span>
                        </div>
                    </div>
                    <button onclick="adicionarCanalAtendimento()" style="background: linear-gradient(135deg, var(--primary, #6366f1), #8b5cf6); color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 13px; box-shadow: 0 4px 12px rgba(99,102,241,0.25); transition: all 0.2s;">
                        <span>+</span> Adicionar Canal
                    </button>
                </div>
                <!-- Canais Grid flex -->
                <div style="display: flex; gap: 16px; flex-wrap: wrap; justify-content: flex-start;">
                    ${canaisHtml}
                </div>
            </div>

            <!-- CATEGORIAS DO FUNIL -->
            <div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                    <div style="display:flex; align-items:center; gap:16px;">
                        <h2 style="font-size: 22px; font-weight: 800; color: var(--text-color, #f0f0f5); margin: 0; display:flex; align-items:center; gap:10px;">
                            <span style="font-size: 28px;">🎯</span> Categorias do Funil
                        </h2>
                    </div>
                    <button onclick="adicionarCategoriaFunil()" style="background: linear-gradient(135deg, var(--primary, #6366f1), #8b5cf6); color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 13px; box-shadow: 0 4px 12px rgba(99,102,241,0.25); transition: all 0.2s;">
                        <span>+</span> Adicionar Categoria
                    </button>
                </div>
                <div style="background: transparent; padding: 0; margin-bottom: 12px;">
                    ${funilHtml}
                    ${suporteDashboardData.funil.length === 0 ? '<div style="text-align:center; padding:30px; color:var(--text-muted, #a1a1aa); font-style:italic;">Nenhuma categoria configurada.</div>' : ''}
                </div>
                
                <!-- CARD TOTALIZADOR DO FUNIL -->
                <div style="background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05)); border: 1px solid rgba(99,102,241,0.2); padding: 24px; border-radius: 16px; display: flex; align-items: center; justify-content: space-between; margin-top: 20px;">
                    <div style="display:flex; align-items:center; gap: 16px;">
                        <span style="font-size: 38px;">📈</span>
                        <div>
                            <div style="font-weight: 800; font-size: 18px; color: var(--text-color, #f0f0f5); text-transform: uppercase;">Total do Funil</div>
                            <div style="font-size: 13px; color: var(--text-muted, #a1a1aa); font-weight: 600; margin-top: 4px;">Somatório completo na visão atual selecionada</div>
                        </div>
                    </div>
                    <div style="font-size: 46px; font-weight: 900; color: var(--primary, #6366f1); text-shadow: 0 0 20px rgba(99,102,241,0.2); padding: 0 20px;">
                        ${totalFunil}
                    </div>
                </div>

            </div>
            <style>
                @keyframes fadeInSuporte { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            </style>
        </div>
    `;
}


window.ChartInstances = window.ChartInstances || {};

window.abrirPainelRelatoriosSuporte = function() {
    let html = `
    <div id="suporteModalRelatoriosOverlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; display:flex; justify-content:center; align-items:center; opacity: 1;">
        <div style="background: var(--surface, #1e1e24); border: 1px solid var(--border-color, rgba(255,255,255,0.1)); padding: 40px; border-radius: 16px; width: 1000px; max-width: 95vw; height: 90vh; display: flex; flex-direction: column; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2 style="margin: 0; color: var(--text-color, #f0f0f5); font-size: 24px; display:flex; align-items:center; gap:10px;"><span>📊</span> Relatórios Gerenciais de Suporte</h2>
                <button onclick="document.getElementById('suporteModalRelatoriosOverlay').remove()" style="background: rgba(239,68,68,0.1); border: none; color: #ef4444; width: 36px; height: 36px; border-radius: 8px; font-weight: bold; font-size: 18px; cursor: pointer; transition: background 0.2s;">&times;</button>
            </div>
            
            <div style="display: flex; gap: 20px; margin-bottom: 24px; align-items: flex-end;">
                <div style="flex: 1;">
                    <label style="display:block; margin-bottom: 8px; color: var(--text-muted, #a1a1aa); font-weight: 600; font-size: 14px;">Mês Mapeado</label>
                    <input type="month" id="suporteReportMonth" style="width:100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.3); color: white; outline: none; border-color: rgba(99,102,241,0.5);" value="${new Date().toISOString().substring(0,7)}">
                </div>
                <button onclick="window.gerarRelatorioSuporte()" style="background: var(--primary, #6366f1); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 15px;">
                    Gerar Relatório
                </button>
                <button onclick="window.baixarRelatorioSuporte()" style="background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 15px;">
                    📥 Baixar PDF
                </button>
            </div>
            
            <div id="suporteReportContent" style="flex: 1; overflow-y: auto; background: var(--surface-light, rgba(255,255,255,0.03)); border-radius: 12px; border: 1px solid rgba(255,255,255,0.05); padding: 30px; display:flex; flex-direction: column; gap: 30px;">
                <div style="text-align:center; color: var(--text-muted, #a1a1aa); font-style:italic; padding-top: 100px;">
                    Carregando Relatório...
                </div>
            </div>
        </div>
    </div>
    `;
    
    const exist = document.getElementById('suporteModalRelatoriosOverlay');
    if(exist) exist.remove();
    document.body.insertAdjacentHTML('beforeend', html);
    
    setTimeout(() => {
        window.gerarRelatorioSuporte(); 
    }, 100);
}

window.baixarRelatorioSuporte = function() {
    const reportElem = document.getElementById('suporteReportContent');
    if (!reportElem || reportElem.innerHTML.includes('Carregando') || reportElem.innerHTML.includes('Sincronizando') || reportElem.innerHTML.trim() === '') {
        alert('Por favor, gere o relatório primeiro clicando no botão azul "Gerar Relatório".');
        return;
    }
    
    // Clone the element to safely modify it without affecting the UI
    const clone = reportElem.cloneNode(true);
    
    // Convert all canvases in the original to images in the clone
    const originalCanvases = reportElem.querySelectorAll('canvas');
    const clonedCanvases = clone.querySelectorAll('canvas');
    
    for (let i = 0; i < originalCanvases.length; i++) {
        const img = document.createElement('img');
        img.src = originalCanvases[i].toDataURL('image/png');
        img.style.width = '100%';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        if (clonedCanvases[i] && clonedCanvases[i].parentNode) {
            clonedCanvases[i].parentNode.replaceChild(img, clonedCanvases[i]);
        }
    }
    
    const contentHtml = clone.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Radar PNSA - Relatório de Suporte</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                body {
                    font-family: 'Inter', sans-serif;
                    background: #ffffff;
                    color: #1e293b;
                    padding: 20px 40px;
                    margin: 0;
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }
                * {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                }
                /* Tweak colors that were using CSS variables to look good on white paper */
                h2, h3 { color: #1e40af !important; }
                table { background: #ffffff !important; }
                th { background: #f1f5f9 !important; color: #475569 !important; }
                tr:nth-child(even) td { background: #f8fafc !important; }
                .progress-bar-bg { background: #e2e8f0 !important; }
                .progress-bar-fill { background: #2563eb !important; }
                
                @media print {
                    @page { margin: 1.5cm; size: A4 portrait; }
                    body { padding: 0; }
                    .page-break { page-break-before: always; }
                }
            </style>
        </head>
        <body>
            ${contentHtml}
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Pequeno delay para garantir carregamento de fontes
    setTimeout(() => {
        printWindow.print();
        // Opcional: fechar janela após print
        // printWindow.close();
    }, 800);
}

window.gerarRelatorioSuporte = async function() {
    try {
        const monthVal = document.getElementById('suporteReportMonth').value; 
        if(!monthVal) return;
        
        // Mostrar estado de carregamento
        document.getElementById('suporteReportContent').innerHTML = '<div style="color: var(--text-muted); padding: 50px; text-align: center; font-style: italic;">Sincronizando dados com o servidor... aguarde.</div>';
        
        // Forçar busca dos dados mais recentes do Firebase antes de gerar o relatório
        await loadSuporteDashboard();
        
        const parts = monthVal.split('-');
        const yearStr = parts[0];
        const monthStr = parts[1];
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10); 
        const monthNames = ['','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        const monthName = monthNames[month] || monthStr;
        
        const daysCount = new Date(year, month, 0).getDate();
        const allDaysInMonth = Array.from({length: daysCount}, (_, i) => {
            return yearStr + '-' + monthStr + '-' + String(i + 1).padStart(2, '0');
        });

        const categories = [...(suporteDashboardData.canais || [])].map(c => ({...c, name: c.name || c.nome || c.id || 'Sem Nome'}));
        
        // Coletar todos os UIDs que contribuíram no mês
        const allUserIds = new Set();
        categories.forEach(c => {
            if (!c.history) return;
            allDaysInMonth.forEach(dayStr => {
                if (c.history[dayStr]) {
                    Object.keys(c.history[dayStr]).forEach(uid => {
                        if (uid !== 'geral') allUserIds.add(uid);
                    });
                }
            });
        });

        // Calcular totais por categoria, por dia, por pessoa, por semana, por dia da semana
        const dailyTotalsByCat = {};
        const weekData = {};
        let superTotal = 0;
        let maxDayStr = '';
        let maxDayVal = -1;
        let categoryTotals = {};
        const userTotals = {};
        const userTotalsByCat = {};
        const dailyGrandTotals = [];
        const dayOfWeekTotals = [0,0,0,0,0,0,0]; // dom, seg, ter, qua, qui, sex, sab
        
        allUserIds.forEach(uid => { userTotals[uid] = 0; userTotalsByCat[uid] = {}; });
        
        categories.forEach(c => {
            categoryTotals[c.name] = 0;
            dailyTotalsByCat[c.name] = [];
            allUserIds.forEach(uid => { userTotalsByCat[uid][c.name] = 0; });
        });

        allDaysInMonth.forEach((dayStr, idx) => {
            const weekNum = Math.ceil((idx + 1) / 7);
            if (!weekData[weekNum]) {
                weekData[weekNum] = { total: 0, startDay: idx + 1, endDay: idx + 1, byCat: {}, days: [] };
                categories.forEach(c => weekData[weekNum].byCat[c.name] = 0);
            }
            weekData[weekNum].endDay = idx + 1;
            
            let dayGrandTotal = 0;
            const dateObj = new Date(year, month - 1, idx + 1);
            const dayOfWeek = dateObj.getDay();

            categories.forEach(c => {
                let daySum = 0;
                if (c.history && c.history[dayStr]) {
                    Object.entries(c.history[dayStr]).forEach(([uid, v]) => {
                        const val = parseInt(v, 10) || 0;
                        daySum += val;
                        if (uid !== 'geral' && allUserIds.has(uid)) {
                            userTotals[uid] += val;
                            userTotalsByCat[uid][c.name] += val;
                        }
                    });
                }
                
                dailyTotalsByCat[c.name].push(daySum);
                weekData[weekNum].total += daySum;
                weekData[weekNum].byCat[c.name] += daySum;
                superTotal += daySum;
                categoryTotals[c.name] += daySum;
                dayGrandTotal += daySum;
            });

            dayOfWeekTotals[dayOfWeek] += dayGrandTotal;
            dailyGrandTotals.push({ day: dayStr, total: dayGrandTotal });

            weekData[weekNum].days.push({ day: idx + 1, total: dayGrandTotal });
            
            if (dayGrandTotal > maxDayVal) {
                maxDayVal = dayGrandTotal;
                maxDayStr = dayStr;
            }
        });
        
        const totalCatList = Object.entries(categoryTotals).sort((a,b) => b[1] - a[1]);
        const topCatName = totalCatList.length ? totalCatList[0][0] : 'N/A';
        const topCatVal = totalCatList.length ? totalCatList[0][1] : 0;
        
        // Calcular dias com alguma atividade
        const diasAtivos = dailyGrandTotals.filter(d => d.total > 0).length;
        const mediaDiaria = diasAtivos > 0 ? (superTotal / diasAtivos).toFixed(1) : '0';
        
        // Nome dos dias da semana
        const diasSemana = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
        const diaMaisMovimentado = diasSemana[dayOfWeekTotals.indexOf(Math.max(...dayOfWeekTotals))];
        
        // Ranking categorias HTML
        let rankingCatHtml = '';
        totalCatList.forEach((entry, i) => {
            const pct = superTotal > 0 ? ((entry[1] / superTotal) * 100).toFixed(1) : '0';
            const barColor = i === 0 ? '#1e40af' : (i === 1 ? '#3b82f6' : '#93c5fd');
            rankingCatHtml += '<div style="margin-bottom: 10px;">' +
                '<div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:14px;">' +
                '<span style="font-weight:600;">' + (i+1) + '. ' + entry[0] + '</span>' +
                '<span><strong>' + entry[1] + '</strong> (' + pct + '%)</span>' +
                '</div>' +
                '<div style="background:#e5e7eb; border-radius:4px; height:8px; overflow:hidden;">' +
                '<div style="background:' + barColor + '; height:100%; width:' + pct + '%; border-radius:4px;"></div>' +
                '</div></div>';
        });

        // Semanas detalhadas
        let weeksHtml = '';
        Object.keys(weekData).forEach(wk => {
            const w = weekData[wk];
            if (w.total === 0 && w.days.every(d => d.total === 0)) return;
            
            const startDate = String(w.startDay).padStart(2,'0') + '/' + monthStr;
            const endDate = String(w.endDay).padStart(2,'0') + '/' + monthStr;
            const bestDay = w.days.reduce((a,b) => a.total >= b.total ? a : b, { day: 0, total: 0 });
            
            let catBreakdown = '';
            Object.entries(w.byCat).filter(e => e[1] > 0).sort((a,b) => b[1]-a[1]).forEach(e => {
                catBreakdown += '<span style="display:inline-block; background:#eef2ff; padding:3px 10px; border-radius:4px; margin:3px 4px 3px 0; font-size:12px; color:#4338ca;">' + e[0] + ': <strong>' + e[1] + '</strong></span>';
            });
            
            weeksHtml += '<div style="margin-bottom: 18px; padding: 16px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6;">' +
                '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
                '<strong style="font-size:15px; color:#1e293b;">Semana ' + wk + ' (' + startDate + ' a ' + endDate + ')</strong>' +
                '<span style="background:#1e40af; color:white; padding:4px 12px; border-radius:6px; font-weight:700; font-size:14px;">' + w.total + ' atendimentos</span>' +
                '</div>' +
                (bestDay.total > 0 ? '<p style="margin:4px 0; font-size:13px; color:#64748b;">Pico da semana: dia <strong>' + String(bestDay.day).padStart(2,'0') + '/' + monthStr + '</strong> com ' + bestDay.total + ' atendimentos.</p>' : '') +
                (catBreakdown ? '<div style="margin-top:8px;">' + catBreakdown + '</div>' : '') +
                '</div>';
        });
        if (!weeksHtml) weeksHtml = '<p style="color:#666; font-style:italic;">Nenhum atendimento registrado neste mês.</p>';

        // Tabela individual de pessoas
        let pessoasHtml = '';
        if (allUserIds.size > 0) {
            // Apenas incluir usuários que têm total > 0 (ignorar os que foram zerados/"apagados")
            const sortedUsers = Array.from(allUserIds)
                .filter(uid => (userTotals[uid] || 0) > 0)
                .sort((a,b) => (userTotals[b] || 0) - (userTotals[a] || 0));
            
            if (sortedUsers.length > 0) {
            
            // Função auxiliar para gerar uma tabela para um grupo de categorias
            function gerarTabelaPessoas(titulo, emoji, catList) {
                let catHeaders = '';
                catList.forEach(c => {
                    catHeaders += '<th style="padding:8px 6px; text-align:center; font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; border-bottom:2px solid #e2e8f0;">' + c.name + '</th>';
                });
                
                let tableRows = '';
                sortedUsers.forEach((uid, i) => {
                    const u = (typeof USERS !== 'undefined' && USERS[uid]) ? USERS[uid] : null;
                    const nome = u ? u.nome : uid;
                    let userSubTotal = 0;
                    const bgColor = i % 2 === 0 ? '#fff' : '#f8fafc';
                    
                    let catCells = '';
                    catList.forEach(c => {
                        const val = userTotalsByCat[uid][c.name] || 0;
                        userSubTotal += val;
                        catCells += '<td style="padding:8px 6px; text-align:center; border-bottom:1px solid #e2e8f0; font-size:13px;">' + val + '</td>';
                    });
                    
                    tableRows += '<tr style="background:' + bgColor + ';">' +
                        '<td style="padding:8px 10px; font-weight:600; border-bottom:1px solid #e2e8f0; font-size:13px; white-space:nowrap;">' + (i+1) + '. ' + nome + '</td>' +
                        catCells +
                        '<td style="padding:8px 10px; text-align:center; font-weight:800; color:#1e40af; border-bottom:1px solid #e2e8f0; font-size:14px;">' + userSubTotal + '</td>' +
                        '</tr>';
                });

                // Linha de totais
                let totalCells = '';
                let grandSubTotal = 0;
                catList.forEach(c => {
                    const val = categoryTotals[c.name] || 0;
                    grandSubTotal += val;
                    totalCells += '<td style="padding:8px 6px; text-align:center; border-top:2px solid #1e40af; font-weight:800; font-size:12px; color:#1e40af;">' + val + '</td>';
                });

                return '<div style="margin-bottom:30px;">' +
                    '<h3 style="color:#334155; font-size:16px; margin-bottom:12px; display:flex; align-items:center; gap:8px;">' + emoji + ' ' + titulo + '</h3>' +
                    '<div style="overflow-x:auto;">' +
                    '<table style="width:100%; border-collapse:collapse; border-radius:8px; overflow:hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">' +
                    '<thead><tr style="background:#f1f5f9;">' +
                    '<th style="padding:8px 10px; text-align:left; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; border-bottom:2px solid #e2e8f0;">Pessoa</th>' +
                    catHeaders +
                    '<th style="padding:8px 10px; text-align:center; font-size:11px; font-weight:700; color:#1e40af; text-transform:uppercase; border-bottom:2px solid #e2e8f0;">TOTAL</th>' +
                    '</tr></thead>' +
                    '<tbody>' + tableRows +
                    '<tr style="background:#eef2ff;">' +
                    '<td style="padding:8px 10px; font-weight:800; border-top:2px solid #1e40af; font-size:13px; color:#1e40af;">TOTAL</td>' +
                    totalCells +
                    '<td style="padding:8px 10px; text-align:center; font-weight:900; color:#1e40af; border-top:2px solid #1e40af; font-size:15px;">' + grandSubTotal + '</td>' +
                    '</tr>' +
                    '</tbody></table></div></div>';
            }

            // Tabela geral resumida (pessoa + total geral + %)
            let resumoRows = '';
            sortedUsers.forEach((uid, i) => {
                const u = (typeof USERS !== 'undefined' && USERS[uid]) ? USERS[uid] : null;
                const nome = u ? u.nome : uid;
                const pct = superTotal > 0 ? ((userTotals[uid] / superTotal) * 100).toFixed(1) : '0';
                const bgColor = i % 2 === 0 ? '#fff' : '#f8fafc';
                resumoRows += '<tr style="background:' + bgColor + ';">' +
                    '<td style="padding:10px 12px; font-weight:600; border-bottom:1px solid #e2e8f0; font-size:14px;">' + (i+1) + '. ' + nome + '</td>' +
                    '<td style="padding:10px 12px; text-align:center; font-weight:800; color:#1e40af; border-bottom:1px solid #e2e8f0; font-size:16px;">' + userTotals[uid] + '</td>' +
                    '<td style="padding:10px 12px; text-align:center; border-bottom:1px solid #e2e8f0; font-size:14px; color:#64748b;">' + pct + '%</td>' +
                    '</tr>';
            });

            pessoasHtml = '<div style="margin-top:40px;">' +
                '<h2 style="color:#1e40af; font-size:20px; border-bottom:2px solid #5b71ba; padding-bottom:8px; margin-bottom:20px;">👥 Atendimentos Individuais por Pessoa</h2>' +
                
                // Resumo geral
                '<div style="margin-bottom:30px;">' +
                '<h3 style="color:#334155; font-size:16px; margin-bottom:12px;">📊 Resumo Geral</h3>' +
                '<div style="overflow-x:auto;">' +
                '<table style="width:100%; max-width:500px; border-collapse:collapse; border-radius:8px; overflow:hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">' +
                '<thead><tr style="background:#f1f5f9;">' +
                '<th style="padding:10px 12px; text-align:left; font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase; border-bottom:2px solid #e2e8f0;">Pessoa</th>' +
                '<th style="padding:10px 12px; text-align:center; font-size:12px; font-weight:700; color:#1e40af; text-transform:uppercase; border-bottom:2px solid #e2e8f0;">Total</th>' +
                '<th style="padding:10px 12px; text-align:center; font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase; border-bottom:2px solid #e2e8f0;">%</th>' +
                '</tr></thead>' +
                '<tbody>' + resumoRows +
                '<tr style="background:#eef2ff;">' +
                '<td style="padding:10px 12px; font-weight:800; border-top:2px solid #1e40af; font-size:14px; color:#1e40af;">TOTAL GERAL</td>' +
                '<td style="padding:10px 12px; text-align:center; font-weight:900; color:#1e40af; border-top:2px solid #1e40af; font-size:16px;">' + superTotal + '</td>' +
                '<td style="padding:10px 12px; text-align:center; font-weight:800; border-top:2px solid #1e40af; font-size:13px; color:#1e40af;">100%</td>' +
                '</tr></tbody></table></div></div>' +
                
                // Tabela por Canais
                gerarTabelaPessoas('Por Canal de Atendimento', '📞', suporteDashboardData.canais || []) +
                
                '</div>';
            }
        }
        // Gráficos datasets
        const canaisNames = (suporteDashboardData.canais || []).map(x => x.name);
        const datasetsCanais = canaisNames.map((name, i) => {
            const colors = ['#f59e0b', '#0ea5e9', '#10b981', '#ec4899', '#8b5cf6'];
            return { label: name, data: dailyTotalsByCat[name] || [], borderColor: colors[i % colors.length], backgroundColor: colors[i % colors.length], tension: 0.1, fill: false }
        });
        const labels = allDaysInMonth.map(d => d.split('-')[2] + '/' + d.split('-')[1]);
        
        const content = `
        <div style="background: white; padding: 40px; border-radius: 8px; color: #333; font-family: Arial, sans-serif; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <h1 style="color: #1e40af; font-size: 26px; border-bottom: 2px solid #5b71ba; padding-bottom: 10px; margin-bottom: 6px;">
                Análise de Atendimento Virtual - ${monthName} ${yearStr}
            </h1>
            <p style="color:#94a3b8; font-size:13px; margin-bottom:30px;">Relatório gerado automaticamente pelo Radar PNSA em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}.</p>

            <!-- RESUMO EXECUTIVO -->
            <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:16px; margin-bottom:30px;">
                <div style="background:#eef2ff; padding:20px; border-radius:12px; text-align:center;">
                    <div style="font-size:32px; font-weight:900; color:#1e40af;">${superTotal}</div>
                    <div style="font-size:12px; color:#64748b; font-weight:600; text-transform:uppercase; margin-top:4px;">Total do Mês</div>
                </div>
                <div style="background:#f0fdf4; padding:20px; border-radius:12px; text-align:center;">
                    <div style="font-size:32px; font-weight:900; color:#15803d;">${mediaDiaria}</div>
                    <div style="font-size:12px; color:#64748b; font-weight:600; text-transform:uppercase; margin-top:4px;">Média Diária</div>
                </div>
                <div style="background:#fef2f2; padding:20px; border-radius:12px; text-align:center;">
                    <div style="font-size:32px; font-weight:900; color:#dc2626;">${Math.max(0, maxDayVal)}</div>
                    <div style="font-size:12px; color:#64748b; font-weight:600; text-transform:uppercase; margin-top:4px;">Pico Diário</div>
                </div>
                <div style="background:#fffbeb; padding:20px; border-radius:12px; text-align:center;">
                    <div style="font-size:32px; font-weight:900; color:#d97706;">${diasAtivos}</div>
                    <div style="font-size:12px; color:#64748b; font-weight:600; text-transform:uppercase; margin-top:4px;">Dias Ativos</div>
                </div>
            </div>
            
            <!-- DESTAQUES -->
            <div style="font-size: 15px; line-height: 1.7; margin-bottom: 30px;">
                <h2 style="color:#1e40af; font-size:20px; border-bottom:2px solid #5b71ba; padding-bottom:8px; margin-bottom:16px;">📋 Destaques Gerais</h2>
                <ul style="margin-left: 20px; margin-bottom: 20px;">
                    <li>Total do mês: <strong>${superTotal}</strong> interações registradas ao longo de <strong>${diasAtivos}</strong> dias ativos.</li>
                    <li>Categoria com maior demanda: <strong>${topCatName}</strong> com ${topCatVal} atendimentos (${superTotal > 0 ? ((topCatVal / superTotal) * 100).toFixed(1) : 0}% do total).</li>
                    <li>Maior pico pontual: <strong>${maxDayStr ? maxDayStr.split('-').reverse().join('/') : 'N/A'}</strong> com ${Math.max(0, maxDayVal)} interações totais neste dia.</li>
                    <li>Média diária (dias ativos): <strong>${mediaDiaria}</strong> atendimentos/dia.</li>
                    <li>Dia da semana mais movimentado: <strong>${diaMaisMovimentado}</strong>.</li>
                    <li>Equipe atuante: <strong>${allUserIds.size}</strong> colaboradores registraram atendimentos este mês.</li>
                </ul>
            </div>

            <!-- RANKING CATEGORIAS -->
            <div style="margin-bottom:30px;">
                <h2 style="color:#1e40af; font-size:20px; border-bottom:2px solid #5b71ba; padding-bottom:8px; margin-bottom:16px;">🏆 Ranking de Categorias</h2>
                ${rankingCatHtml || '<p style="color:#666; font-style:italic;">Sem dados.</p>'}
            </div>

            <!-- FECHAMENTO SEMANAL -->
            <div style="margin-bottom:30px;">
                <h2 style="color:#1e40af; font-size:20px; border-bottom:2px solid #5b71ba; padding-bottom:8px; margin-bottom:16px;">📅 Fechamento Semanal Detalhado</h2>
                ${weeksHtml}
            </div>

            <!-- TABELA DE PESSOAS -->
            ${pessoasHtml}
            
            <!-- GRÁFICOS -->
            <div style="margin-top:40px;">
                <h2 style="color:#1e40af; font-size:20px; border-bottom:2px solid #5b71ba; padding-bottom:8px; margin-bottom:20px;">📈 Atendimentos por Dia (Canais)</h2>
                <div style="position: relative; height: 350px; width: 100%; margin-bottom: 50px;">
                    <canvas id="suporteReportChartCanais"></canvas>
                </div>
            </div>
        </div>
        `;
        
        document.getElementById('suporteReportContent').innerHTML = content;
        
        if (typeof Chart !== 'undefined') {
            if(window.ChartInstances['canais']) window.ChartInstances['canais'].destroy();
            if(window.ChartInstances['funil']) window.ChartInstances['funil'].destroy();
            
            const ctxCanais = document.getElementById('suporteReportChartCanais');
            
            window.ChartInstances['canais'] = new Chart(ctxCanais, {
                type: 'line',
                data: { labels, datasets: datasetsCanais },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
            });
        } else {
            console.error("Chart.js is not recognized.");
        }
    } catch (err) {
        console.error("Critical error in UI Builder", err);
        document.getElementById('suporteReportContent').innerHTML = '<div style="color: red; padding: 30px; text-align: center;"><h2>Erro ao gerar relatorio</h2><p>' + err.message + '</p></div>';
    }
};

// =============================================
// LÓGICA DE REPETIÇÃO DE DEMANDAS E PRAZO P80
// =============================================
window.customRecurringDates = [];

window.calculateProbabilisticDuration = function(tipoProjeto, subType) {
    if (!demandas || demandas.length === 0) return null;
    
    // Filtra demandas aprovadas concluídas do mesmo tipo e subtipo
    const completedTasks = demandas.filter(d => 
        !d.deletedAt &&
        d.tipoProjeto === tipoProjeto && 
        (!subType || d.subType === subType) && 
        d.status === 'Aprovado' &&
        (d.dataSolicitacao || d.dataCriacao) && 
        (d.lastStatusChange || d.deliveryDate)
    );
    
    if (completedTasks.length === 0) {
        return null;
    }
    
    const durations = completedTasks.map(d => {
        const start = new Date((d.dataSolicitacao || d.dataCriacao.split('T')[0]) + 'T12:00:00Z');
        const end = new Date((d.lastStatusChange || d.deliveryDate).split('T')[0] + 'T12:00:00Z');
        return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    }).filter(d => !isNaN(d));
    
    if (durations.length === 0) return null;
    
    durations.sort((a, b) => a - b);
    
    if (durations.length < 3) {
        // Média simples para poucas amostras
        const sum = durations.reduce((acc, val) => acc + val, 0);
        return Math.ceil(sum / durations.length);
    }
    
    // Percentil 80% (P80)
    const idx = Math.min(durations.length - 1, Math.ceil(0.8 * durations.length) - 1);
    const p80 = durations[idx];
    
    console.log(`P80 lead time para ${tipoProjeto} (${subType || 'geral'}): ${p80} dias (amostras: ${durations.length})`);
    return p80;
};

window.generateRecurrenceDates = function(startDateStr, config) {
    const dates = [];
    if (!startDateStr || !config || !config.frequencia) return dates;
    
    if (config.frequencia === 'personalizado') {
        return (config.datasPersonalizadas || []).filter(d => d !== startDateStr);
    }
    
    const start = new Date(startDateStr + 'T12:00:00Z');
    let current = new Date(start.getTime());
    
    // Determina o limite de dias com base no período
    let maxDays = 30;
    if (config.periodo === '2_meses') maxDays = 60;
    else if (config.periodo === '3_meses') maxDays = 90;
    else if (config.periodo === 'custom_count') maxDays = 180; // limite de busca seguro
    
    const endLimit = new Date(start.getTime());
    endLimit.setDate(endLimit.getDate() + maxDays);
    
    const maxOccurrences = config.periodo === 'custom_count' ? Math.min(35, parseInt(config.limiteOcorrencias) || 1) : 35;
    
    const targetDays = (config.diasSemana || []).map(Number);
    
    // Se semanal mas nenhum dia marcado, usa o dia da semana da data inicial
    if (config.frequencia === 'semanal' && targetDays.length === 0) {
        targetDays.push(start.getDay());
    }
    
    let daysSearched = 0;
    // Percorre dia por dia, a partir do dia seguinte ao inicial
    while (daysSearched < maxDays && dates.length < maxOccurrences) {
        current.setDate(current.getDate() + 1);
        daysSearched++;
        
        if (current > endLimit) break;
        
        const dayOfWeek = current.getDay();
        const dateStr = current.toISOString().split('T')[0];
        
        let match = false;
        if (config.frequencia === 'diaria') {
            match = true;
        } else if (config.frequencia === 'semanal') {
            match = targetDays.includes(dayOfWeek);
        } else if (config.frequencia === 'dias_uteis') {
            match = (dayOfWeek !== 0 && dayOfWeek !== 6);
        }
        
        // Restrição a dias úteis
        if (match && config.restringirDiasUteis) {
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                match = false;
            }
        }
        
        if (match) {
            dates.push(dateStr);
        }
    }
    
    return dates;
};

window.updateRecurrencePreview = function() {
    const frequencia = document.getElementById('cFrequencia')?.value;
    const previewContainer = document.getElementById('recurrencePreviewContainer');
    const previewList = document.getElementById('recurrencePreviewList');
    const previewCount = document.getElementById('recurrencePreviewCount');
    const cardProb = document.getElementById('probabilisticDeadlineCard');
    const textProb = document.getElementById('probabilisticDeadlineText');
    const cUsarProb = document.getElementById('cUsarPrazoProbabilistico');
    
    if (!frequencia) {
        if (previewContainer) previewContainer.style.display = 'none';
        if (cardProb) cardProb.style.display = 'none';
        // Garantir que todos os outros campos de recorrência sejam ocultados
        const groupPeriodo = document.getElementById('groupPeriodo');
        if (groupPeriodo) groupPeriodo.style.display = 'none';
        const groupLimiteOcorrencias = document.getElementById('groupLimiteOcorrencias');
        if (groupLimiteOcorrencias) groupLimiteOcorrencias.style.display = 'none';
        const groupDiasSemana = document.getElementById('groupDiasSemana');
        if (groupDiasSemana) groupDiasSemana.style.display = 'none';
        const groupRestringirDiasUteis = document.getElementById('groupRestringirDiasUteis');
        if (groupRestringirDiasUteis) groupRestringirDiasUteis.style.display = 'none';
        const groupDatasPersonalizadas = document.getElementById('groupDatasPersonalizadas');
        if (groupDatasPersonalizadas) groupDatasPersonalizadas.style.display = 'none';
        return;
    }
    
    // 1. Mostrar/Ocultar campos da UI de acordo com a frequência
    document.getElementById('groupPeriodo').style.display = 'block';
    document.getElementById('groupLimiteOcorrencias').style.display = (document.getElementById('cPeriodo')?.value === 'custom_count') ? 'block' : 'none';
    document.getElementById('groupDiasSemana').style.display = (frequencia === 'semanal') ? 'block' : 'none';
    document.getElementById('groupRestringirDiasUteis').style.display = (frequencia === 'diaria' || frequencia === 'semanal') ? 'block' : 'none';
    document.getElementById('groupDatasPersonalizadas').style.display = (frequencia === 'personalizado') ? 'block' : 'none';
    
    // 2. Calcular P80 Estimado
    const tipoProjeto = document.getElementById('cTipoProjeto')?.value || '';
    let subType = '';
    if (tipoProjeto === 'Design Gráfico') subType = document.getElementById('cTipoDesign')?.value || '';
    else if (tipoProjeto === 'Videomaker') subType = document.getElementById('cTipoVideo')?.value || '';
    else if (tipoProjeto === 'Social Media') subType = document.getElementById('cTipoSocial')?.value || '';
    else if (tipoProjeto === 'TI') subType = document.getElementById('cTipoTI')?.value || '';
    
    // Exibe o card P80 apenas se um tipo de projeto foi selecionado
    if (cardProb) {
        cardProb.style.display = tipoProjeto ? 'flex' : 'none';
    }
    
    const p80 = window.calculateProbabilisticDuration(tipoProjeto, subType);
    let durationDays = 0;
    
    const refDate = document.getElementById('cDataConclusao')?.value;
    const refStartVal = document.getElementById('cDataSolicitacao')?.value;
    
    if (refStartVal && refDate) {
        const dSol = new Date(refStartVal + 'T12:00:00Z');
        const dCon = new Date(refDate + 'T12:00:00Z');
        durationDays = Math.max(0, Math.round((dCon - dSol) / (1000 * 60 * 60 * 24)));
    }
    
    if (p80 !== null) {
        if (textProb) {
            textProb.innerHTML = `O lead time sugerido (P80) para <strong>${tipoProjeto}${subType ? ` (${subType})` : ''}</strong> é de <strong>${p80} dia(s)</strong> de antecedência.<br><span style="color:var(--text-muted); font-size:11px;">Calculado a partir de demandas concluídas no histórico da equipe.</span>`;
        }
        if (cUsarProb && cUsarProb.checked) {
            durationDays = p80;
        }
    } else {
        if (textProb) {
            if (!tipoProjeto) {
                textProb.innerHTML = `Selecione um tipo de projeto acima para estimar o tempo histórico de produção.`;
            } else {
                textProb.innerHTML = `Sem histórico de entrega suficiente para <strong>${tipoProjeto}</strong>. Usando prazo de antecedência atual do formulário: <strong>${durationDays} dia(s)</strong>.`;
            }
        }
    }
    
    // 3. Gerar Datas Futuras
    if (!refDate) {
        if (previewList) previewList.innerHTML = '<div style="color:#ef4444; font-size:13px; font-weight:500;">⚠️ Por favor, defina a data de entrega da primeira demanda acima para gerar as recorrências.</div>';
        if (previewContainer) previewContainer.style.display = 'block';
        if (previewCount) previewCount.textContent = '0';
        return;
    }
    
    const checkedDays = Array.from(document.querySelectorAll('input[name="cDiaSemanaCheckbox"]:checked')).map(cb => parseInt(cb.value));
    
    const config = {
        frequencia: frequencia,
        diasSemana: checkedDays,
        restringirDiasUteis: document.getElementById('cRestringirDiasUteis')?.checked || false,
        periodo: document.getElementById('cPeriodo')?.value || '1_mes',
        limiteOcorrencias: parseInt(document.getElementById('cLimiteOcorrencias')?.value) || 5,
        datasPersonalizadas: window.customRecurringDates
    };
    
    const dates = window.generateRecurrenceDates(refDate, config);
    
    if (previewCount) previewCount.textContent = dates.length;
    
    if (dates.length === 0) {
        if (previewList) previewList.innerHTML = '<div style="color:var(--text-muted); font-size:13px;">Nenhuma data futura projetada. Selecione dias ou configure o período.</div>';
    } else {
        const daysNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        
        const html = dates.map((d, i) => {
            const deliveryDate = new Date(d + 'T12:00:00Z');
            const deliveryDayName = daysNames[deliveryDate.getDay()];
            
            const startDate = new Date(deliveryDate.getTime());
            startDate.setDate(startDate.getDate() - durationDays);
            const startDayName = daysNames[startDate.getDay()];
            
            const fmtStart = startDate.toISOString().split('T')[0].split('-').reverse().join('/');
            const fmtEnd = d.split('-').reverse().join('/');
            
            return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:8px; font-size:12px;">
                    <div>
                        <span style="color:var(--text-muted);">#${i + 1}</span>
                        <strong style="color:var(--text-color); margin-left:6px;">Demanda ${i + 2}</strong>
                    </div>
                    <div style="display:flex; gap:12px; align-items:center;">
                        <span style="padding:2px 6px; background:rgba(99, 102, 241, 0.1); border:1px solid rgba(99, 102, 241, 0.2); border-radius:4px; font-size:11px; color:#8b5cf6;" title="Início da Produção">
                            🎬 Prod: ${startDayName}, ${fmtStart}
                        </span>
                        <span style="font-size:14px; color:var(--text-muted);">➔</span>
                        <span style="padding:2px 6px; background:rgba(16, 185, 129, 0.15); border:1px solid rgba(16, 185, 129, 0.25); border-radius:4px; font-size:11px; color:#10b981; font-weight:600;" title="Prazo de Entrega">
                            📅 Entrega: ${deliveryDayName}, ${fmtEnd}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
        
        if (previewList) previewList.innerHTML = html;
    }
    
    if (previewContainer) previewContainer.style.display = 'block';
};

window.onFrequenciaChange = function() {
    window.updateRecurrencePreview();
};

window.addRecurringDate = function() {
    const dateInput = document.getElementById('cDataPersonalizada');
    if (!dateInput || !dateInput.value) return;
    const dateStr = dateInput.value;
    if (window.customRecurringDates.includes(dateStr)) {
        toast('Data já adicionada!', 'error');
        return;
    }
    window.customRecurringDates.push(dateStr);
    window.customRecurringDates.sort();
    renderRecurringDates();
    dateInput.value = '';
    window.updateRecurrencePreview();
};

window.removeRecurringDate = function(index) {
    window.customRecurringDates.splice(index, 1);
    renderRecurringDates();
    window.updateRecurrencePreview();
};

function renderRecurringDates() {
    const list = document.getElementById('recurringDatesList');
    if (!list) return;
    list.innerHTML = window.customRecurringDates.map((d, i) => `
        <span style="display:inline-flex; align-items:center; gap:6px; padding:6px 10px; background:var(--primary); color:white; border-radius:6px; font-size:13px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
            📅 ${d.split('-').reverse().join('/')}
            <span style="cursor:pointer; font-weight:bold; opacity:0.8;" onclick="removeRecurringDate(${i})" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">×</span>
        </span>
    `).join('');
}

// -----------------------------------------------------
// INOVAÇÃO/TI - KANBAN & MODAL NOVO CHAMADO
// -----------------------------------------------------

function renderTIKanban(kpiFilter = null) {
    const allTiTasks = demandas.filter(d => !d.deletedAt && d.pipeline && d.pipeline.some(s => s.dept === 'Inovação/TI'));
    
    // KPI Stats Dashboard (always based on allTiTasks)
    if (document.getElementById('tiKpiPendentes')) {
        const pendentes = allTiTasks.filter(t => t.status === 'A fazer' || t.status === 'Fazendo').length;
        document.getElementById('tiKpiPendentes').textContent = pendentes;
        
        const concluidos = allTiTasks.filter(t => t.status === 'Aprovado').length;
        document.getElementById('tiKpiConcluidos').textContent = concluidos;
        
        const urgentes = allTiTasks.filter(t => t.status !== 'Aprovado' && (t.prioridade === 'Urgente' || Math.ceil((parseDateLocal(t.dataConclusao) - new Date()) / (1000 * 60 * 60 * 24)) < 0)).length;
        document.getElementById('tiKpiUrgentes').textContent = urgentes;
    }

    let tasks = [...allTiTasks];
    
    const search = document.getElementById('boardSearch')?.value?.toLowerCase() || '';
    const statusFilter = document.getElementById('filterBoard')?.value || '';

    if (search) tasks = tasks.filter(t => t.nome.toLowerCase().includes(search) || t.descricaoCartao?.toLowerCase().includes(search));
    if (statusFilter) tasks = tasks.filter(t => t.status === statusFilter);

    // KPI Specific filters
    if (kpiFilter === 'pendentes') {
        tasks = tasks.filter(t => t.status === 'A fazer' || t.status === 'Fazendo');
    } else if (kpiFilter === 'concluidos') {
        tasks = tasks.filter(t => t.status === 'Aprovado');
    } else if (kpiFilter === 'urgentes') {
        tasks = tasks.filter(t => t.status !== 'Aprovado' && (t.prioridade === 'Urgente' || Math.ceil((parseDateLocal(t.dataConclusao) - new Date()) / (1000 * 60 * 60 * 24)) < 0));
    }

    const statuses = ['A fazer', 'Fazendo', 'Para aprovação', 'Alteração', 'Aprovado'];
    
    statuses.forEach(status => {
        const container = document.getElementById(`cards-ti-${status.replace(/\s+/g, '')}`);
        const countEl = document.getElementById(`count-ti-${status.replace(/\s+/g, '')}`);
        if(!container || !countEl) return;
        
        const statusTasks = tasks.filter(t => t.status === status);
        countEl.textContent = statusTasks.length;
        
        if (!statusTasks.length) {
            container.innerHTML = '<div class="kanban-empty" style="color:var(--text-muted); font-size:13px; text-align:center; padding:20px;">Nenhuma demanda</div>';
            return;
        }
        
        container.innerHTML = statusTasks.map(t => {
            const currentStage = t.pipeline[t.currentStage];
            const avatars = t.pipeline.map(s => USERS[s.userId]).filter(Boolean);
            const deadline = parseDateLocal(t.dataConclusao);
            const today = new Date();
            const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
            let dateClass = '';
            if (daysUntil < 0) dateClass = 'overdue';
            else if (daysUntil <= 3) dateClass = 'soon';
            
            const isUrgente = (t.prioridade === 'Urgente' || daysUntil < 0) && t.status !== 'Aprovado';
            const extraClasses = isUrgente ? 'urgent-glow' : '';

            const timerState = currentStage.timerState || { running: false, accumulated: 0, lastStart: null };
            let currentSession = 0;
            if (timerState.running && timerState.lastStart) {
                const start = new Date(timerState.lastStart);
                if (!isNaN(start.getTime())) currentSession = new Date() - start;
            }
            const safeAccumulated = (timerState.accumulated && !isNaN(timerState.accumulated)) ? parseInt(timerState.accumulated) : 0;
            const totalMs = safeAccumulated + currentSession;
            const formattedTime = formatTimer(totalMs);
            const isOwner = currentUser.id === currentStage.userId;

            const sp = getSubtaskProgress(t);
            let progressHtml = '';
            if (sp && sp.total > 0) {
                progressHtml = `<div class="kanban-card-progress" style="margin-top:8px; margin-bottom:4px; font-size:0.75rem; color:var(--text-muted); display:flex; align-items:center; gap:6px;">
                    <div style="flex:1; height:4px; background:rgba(0,0,0,0.1); border-radius:2px; overflow:hidden;">
                        <div style="height:100%; width:${sp.percent}%; background:var(--brand-primary); border-radius:2px; transition:width 0.3s ease;"></div>
                    </div>
                    <span style="font-weight:600;">${sp.percent}%</span>
                </div>`;
            }

            const totalAttachments = (t.attachments?.length || 0) + (t.entregasUrl?.length || (t.entregaUrl ? 1 : 0));
            const attachmentBadge = totalAttachments > 0 ? `<span class="card-attachment-badge" title="Possui ${totalAttachments} anexo(s)">📎 ${totalAttachments}</span>` : '';

            return `
                <div class="kanban-card ${t.prioridade.toLowerCase()} ${extraClasses}" draggable="true" data-id="${t.id}" onclick="openDetail('${t.id}')">
                    <div class="kanban-card-header">
                         <span class="kanban-card-title">${t.nome} ${attachmentBadge}</span>
                    </div>
                    <div class="kanban-card-meta">
                        <span class="kanban-card-type">${t.tipoProjeto}</span>
                        <span class="kanban-card-dept">${currentStage?.dept || '-'}</span>
                    </div>
                    
                    ${progressHtml}

                    ${isOwner ? `
                    <div class="timer-controls" onclick="event.stopPropagation()">
                            <button class="btn-timer" onclick="toggleTimer('${t.id}')" title="${timerState.running ? 'Pausar' : 'Iniciar'}">
                                ${timerState.running ? '⏸️' : '▶️'}
                            </button>
                            <span class="timer-display ${timerState.running ? 'running' : ''}" id="timer-${t.id}">
                                ${timerState.running ? '<span class="timer-badge-active"></span>' : ''}${formattedTime}
                            </span>
                    </div>` : `
                    <div class="timer-controls" style="background:none; padding-left:0;">
                            <span class="timer-display ${timerState.running ? 'running' : ''}" id="timer-${t.id}" style="font-size:0.8rem; ${timerState.running ? '' : 'color:var(--text-dim)'}">
                                ${timerState.running ? '<span class="timer-badge-active"></span>' : '⏱️ '}${formattedTime}
                            </span>
                    </div>`}

                    <div class="kanban-card-footer">
                        <span class="kanban-card-date ${dateClass}">📅 ${formatDate(t.dataConclusao)}</span>
                        <div class="kanban-card-avatars">
                            ${avatars.slice(0, 3).map(u => `${window.renderAvatar(u, 'kanban-card-avatar')}`).join('')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    });

    if(typeof initKanbanDragDrop === 'function') initKanbanDragDrop();
}

function openChamadoTIModal() {
    const sel = document.getElementById('tiSolicitante');
    sel.innerHTML = '<option value="">Selecione quem está solicitando...</option>';
    Object.values(USERS).forEach(u => {
        sel.innerHTML += `<option value="${u.id}">${u.nome} (${u.dept})</option>`;
    });
    sel.value = currentUser.id;

    document.getElementById('tiDescricao').value = '';
    document.getElementById('tiAnexos').value = '';
    document.getElementById('tiAnexosCount').textContent = '';
    document.getElementById('tiLink').value = '';
    document.getElementById('tiResponsavel').value = '';
    document.getElementById('tiPrazo').value = new Date().toISOString().split('T')[0];

    document.getElementById('modalChamadoTI').classList.add('active');
}

async function toggleGlobalIncident() {
    const incidentDoc = demandas.find(d => d.id === 'GLOBAL_ALERT_TI');
    const isAtivo = incidentDoc && incidentDoc.status === 'ACTIVO';
    
    if (isAtivo) {
        // Desativar alerta
        try {
            let doc = demandas.find(d => d.id === 'GLOBAL_ALERT_TI');
            if (doc) {
                doc.status = 'RESOLVIDO';
                doc.dataConclusao = new Date().toISOString();
                await saveData(doc);
            }
            toast('Alerta Global desativado com sucesso.', 'success');
            refresh();
        } catch(e) {
            console.error(e);
            toast('Erro ao desativar alerta.', 'error');
        }
    } else {
        // Ativar alerta
        let msg = prompt("Digite a situação central (Ex: O Wi-Fi do 5º andar está instável):");
        if (!msg) return; // Cancelou
        
        // Adiciona a assinatura padrão para passar segurança aos usuários
        const sufixoPadrao = " 🚧 A equipe de Inovação/TI já está ciente desta ocorrência e estamos atuando com prioridade máxima para restaurar a normalidade o mais breve possível.";
        msg = msg.trim() + sufixoPadrao;
        
        try {
            let doc = demandas.find(d => d.id === 'GLOBAL_ALERT_TI');
            if (!doc) {
                doc = {
                    id: 'GLOBAL_ALERT_TI',
                    nome: 'Incidente Global TI',
                    tipoProjeto: 'Alerta',
                    prioridade: 'Crítico',
                    status: 'ACTIVO',
                    dataCriacao: new Date().toISOString(),
                    deletedAt: null
                };
                demandas.push(doc);
            }
            doc.descricaoCartao = msg;
            doc.status = 'ACTIVO';
            doc.dataConclusao = null;
            await saveData(doc);
            toast('Alerta Global disparado para toda a empresa!', 'success');
        } catch(e) {
            console.error(e);
            toast('Erro ao disparar alerta.', 'error');
        }
    }
    if (typeof refresh === 'function') refresh();
}
window.toggleGlobalIncident = toggleGlobalIncident;

function closeChamadoTIModal() {
    document.getElementById('modalChamadoTI').classList.remove('active');
}

async function handleCreateChamadoTI(e) {
    e.preventDefault();
    
    const solicitanteId = document.getElementById('tiSolicitante').value;
    const responsavelId = document.getElementById('tiResponsavel').value;
    const desc = document.getElementById('tiDescricao').value;
    const link = document.getElementById('tiLink').value;
    const categoria = document.getElementById('tiCategoria').value;
    const prazo = document.getElementById('tiPrazo').value;
    const fileInput = document.getElementById('tiAnexos');
    
    if (!solicitanteId || !responsavelId || !desc || !categoria) {
        toast('Preencha os campos obrigatórios.', 'error');
        return;
    }

    const titleMsg = desc.substring(0, 30) + (desc.length > 30 ? '...' : '');

    const btnSubmit = e.target.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

    const attachments = [];
    if (fileInput && fileInput.files.length > 0) {
        const baseUploadId = `TI-${Date.now()}`;
        for (let idx = 0; idx < fileInput.files.length; idx++) {
            const f = fileInput.files[idx];
            let type = 'doc';
            if (f.type.startsWith('image/')) type = 'image';
            else if (f.type === 'application/pdf') type = 'pdf';
            else if (f.type.startsWith('video/')) type = 'video';
            try {
                if (window.firebaseStorage) {
                    const storageRef = window.ref(window.firebaseStorage, `arquivos_demandas/${baseUploadId}/${Date.now()}_${f.name}`);
                    await window.uploadBytes(storageRef, f);
                    const docUrl = await window.getDownloadURL(storageRef);
                    attachments.push({
                        name: f.name,
                        type: type,
                        size: (f.size / 1024).toFixed(1) + ' KB',
                        date: new Date().toISOString(),
                        uploadedBy: USERS[currentUser.id]?.nome || 'Gestor',
                        url: docUrl
                    });
                } else {
                    console.warn("Storage não inicializado");
                }
            } catch (err) {
                console.error("Erro anexando file", err);
            }
        }
    }

    const newTask = {
        id: generateId(),
        nome: `TI: ${titleMsg}`,
        tipoProjeto: categoria || 'TI',
        prioridade: 'Média', 
        isPinned: false,
        descricaoCartao: desc + (link ? `\n\nLink de referência: ${link}` : ''),
        solicitanteId: solicitanteId,
        dataCriacao: new Date().toISOString(),
        dataConclusao: prazo || new Date().toISOString(), 
        status: 'A fazer',
        pipeline: [{
            dept: 'Inovação/TI',
            role: 'executor',
            userId: responsavelId,
            timerState: { running: false, accumulated: 0, lastStart: null }
        }],
        currentStage: 0,
        activityLog: [],
        comments: [],
        subtasks: [],
        attachments: attachments
    };

    newTask.activityLog.push({ text: `Chamado TI criado por ${USERS[currentUser.id]?.nome || 'Usuário'}`, date: new Date().toISOString() });

    try {
        demandas.push(newTask);
        await saveData(newTask);
        toast('Chamado TI criado com sucesso!', 'success');
        closeChamadoTIModal();
        if(currentDept === 'Inovação/TI') renderTIKanban();
    } catch (error) {
        toast('Erro ao criar o chamado.', 'error');
        console.error(error);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Enviar Chamado';
    }
}

// Intercept btnCreate
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const oldBtn = document.getElementById('btnCreate');
        if(oldBtn) {
            const newBtn = oldBtn.cloneNode(true);
            oldBtn.parentNode.replaceChild(newBtn, oldBtn);
            newBtn.addEventListener('click', (e) => {
                if (currentDept === 'Inovação/TI') {
                     openChamadoTIModal();
                } else {
                     if(typeof openCreateModal === 'function') openCreateModal();
                }
            });
        }
    }, 1000); // 1s wait to ensure everything originated from app.js is bound, we just clone and replace to strip native listeners
});

let allGalleryItems = [];

function renderGallery() {
    allGalleryItems = [];
    
    // Reset inputs
    const searchInput = document.getElementById('gallerySearch');
    const typeSelect = document.getElementById('galleryFilterType');
    const deptSelect = document.getElementById('galleryFilterDept');
    
    if (searchInput) searchInput.value = '';
    if (typeSelect) typeSelect.value = '';
    if (deptSelect) deptSelect.value = '';

    demandas.forEach(d => {
        // Only include approved demands
        if (d.status !== 'Aprovado') return;


        // Final Deliverables (Entregas)
        const entregas = d.entregasUrl || (d.entregaUrl ? [d.entregaUrl] : []);
        if (entregas && Array.isArray(entregas)) {
            // Determine the executor(s) of the demand
            let executorId = d.responsavelId;
            let executorNome = '';

            if (!executorId && d.pipeline && d.pipeline.length > 0) {
                // Find first stage with a userId or userIds
                const execStage = d.pipeline.find(s => s.userId || (s.userIds && s.userIds.length > 0));
                if (execStage) {
                    if (execStage.userId) {
                        executorId = execStage.userId;
                    } else if (execStage.userIds && execStage.userIds.length > 0) {
                        executorId = execStage.userIds[0];
                    }
                }
            }

            if (executorId) {
                executorNome = USERS[executorId]?.nome || 'Desconhecido';
            } else if (d.pipeline && d.pipeline.length > 0) {
                const uids = [];
                d.pipeline.forEach(s => {
                    if (s.userId) uids.push(s.userId);
                    if (s.userIds) uids.push(...s.userIds);
                });
                const uniqueUids = [...new Set(uids)].filter(uid => uid);
                if (uniqueUids.length > 0) {
                    executorId = uniqueUids[0];
                    executorNome = uniqueUids.map(uid => USERS[uid]?.nome).filter(Boolean).join(', ');
                }
            }

            if (!executorId) {
                // Fallback to requester only if absolutely no executors exist
                executorId = d.solicitanteId;
                executorNome = USERS[d.solicitanteId]?.nome || 'Desconhecido';
            }

            entregas.forEach((url, index) => {
                if (url) {
                    const isVideo = d.entregaTipo === 'video';
                    let fileType = 'imagem';
                    if (isVideo) {
                        fileType = 'video';
                    } else {
                        const detected = identifyFileType(url, '');
                        if (detected === 'documento') {
                            fileType = 'documento';
                        } else if (detected === 'video') {
                            if (url.includes('drive.google.com')) {
                                fileType = 'documento';
                            } else {
                                fileType = 'video';
                            }
                        }
                    }

                    const fileName = fileType === 'video' ? `Entrega Vídeo (${d.nome})` : (fileType === 'documento' ? `Entrega Documento - ${index + 1} (${d.nome})` : `Entrega Arte - ${index + 1} (${d.nome})`);

                    allGalleryItems.push({
                        url: url,
                        nome: fileName,
                        tipo: fileType,
                        categoria: 'Entrega Final',
                        size: '-',
                        demandaId: d.id,
                        demandaTitulo: d.nome || d.titulo || 'Demanda sem título',
                        data: d.dataConclusao || d.lastStatusChange || d.dataCriacao || '',
                        departamento: d.tipoProjeto || 'Outros',
                        criadorId: executorId,
                        criadorNome: executorNome
                    });
                }
            });
        }
    });

    // Ordenar itens da galeria por data decrescente (mais recentes primeiro)
    allGalleryItems.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));

    // Renderizar itens filtrados (inicialmente tudo)
    filterGallery();
}

function identifyFileType(name, type) {
    if (type === 'image' || /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(name)) {
        return 'imagem';
    }
    if (type === 'video' || /\.(mp4|mov|avi|mkv|wmv|webm)(\?|$)/i.test(name) || name.includes('youtube.com') || name.includes('youtu.be') || name.includes('drive.google.com') || name.includes('vimeo.com')) {
        return 'video';
    }
    return 'documento';
}

function filterGallery() {
    const searchVal = document.getElementById('gallerySearch')?.value?.toLowerCase() || '';
    const typeVal = document.getElementById('galleryFilterType')?.value || '';
    const deptVal = document.getElementById('galleryFilterDept')?.value || '';

    const filtered = allGalleryItems.filter(item => {
        const matchesSearch = item.nome.toLowerCase().includes(searchVal) || item.demandaTitulo.toLowerCase().includes(searchVal);
        const matchesType = !typeVal || item.tipo === typeVal;
        const matchesDept = !deptVal || item.departamento === deptVal;
        return matchesSearch && matchesType && matchesDept;
    });

    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; color: var(--text-muted); font-style: italic; background: rgba(255,255,255,0.02); border: 1px dashed var(--border-color); border-radius: 12px; text-align: center; width: 100%;">
                <span style="font-size: 44px; margin-bottom: 12px;">📂</span>
                <span>Nenhuma mídia encontrada com os filtros selecionados</span>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(item => {
        let previewHtml = '';
        if (item.tipo === 'imagem') {
            previewHtml = `<img src="${item.url}" alt="${item.nome}" style="width: 100%; height: 140px; object-fit: cover; border-radius: 8px;">`;
        } else if (item.tipo === 'video') {
            previewHtml = `
                <div style="width: 100%; height: 140px; display: flex; align-items: center; justify-content: center; background: rgba(239, 68, 68, 0.08); border-radius: 8px; color: #ef4444; font-size: 38px;">
                    🎥
                </div>
            `;
        } else {
            // Documento / Outros
            const ext = item.nome.split('.').pop().toUpperCase();
            const icon = ext === 'PDF' ? '📄' : ext === 'ZIP' || ext === 'RAR' ? '📦' : '📎';
            previewHtml = `
                <div style="width: 100%; height: 140px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255,255,255,0.04); border-radius: 8px; color: var(--text-muted); gap: 8px;">
                    <span style="font-size: 38px;">${icon}</span>
                    <span style="font-size: 11px; font-weight: 700; background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px;">${ext}</span>
                </div>
            `;
        }

        const clickHandler = `onclick="event.stopPropagation(); window.open('${item.url.replace(/'/g, "\\'")}', '_blank')"`;
        const openTaskHandler = `onclick="event.stopPropagation(); openDetail('${item.demandaId}')"`;

        return `
            <div class="panel" style="padding: 12px; border-radius: 14px; display: flex; flex-direction: column; gap: 10px; position: relative; overflow: hidden; transition: all 0.25s; cursor: pointer; border: 1px solid var(--border-color); background: var(--surface-light);" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border-color)'">
                <div ${clickHandler} style="position: relative; overflow: hidden; border-radius: 8px; background: rgba(0,0,0,0.15);">
                    ${previewHtml}
                    <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; border-radius: 8px;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0'">
                        <button class="btn-primary" style="padding: 6px 14px; font-size: 11.5px; border-radius: 6px; font-weight: 700; box-shadow: 0 4px 10px rgba(99,102,241,0.3);">📥 Abrir / Baixar</button>
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
                    <div style="font-weight: 600; font-size: 13px; color: var(--text-color); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-all;" title="${item.nome}">${item.nome}</div>
                    
                    <div style="font-size: 11px; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                        <span style="background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">${item.categoria}</span>
                        <span>${item.size && item.size !== '-' ? item.size : ''}</span>
                    </div>

                    <div style="border-top: 1px solid var(--border-subtle); margin-top: 8px; padding-top: 8px; display: flex; flex-direction: column; gap: 4px;">
                        <div ${openTaskHandler} style="font-size: 11px; color: var(--primary); font-weight: 700; cursor: pointer; text-decoration: underline; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="Ver Demanda: ${item.demandaTitulo}">
                            🔗 ${item.demandaTitulo}
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: var(--text-muted); margin-top: 2px;">
                            <span>👤 ${item.criadorNome.split(' ')[0]}</span>
                            <span>📅 ${formatDate(item.data)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// =========================================================================
// BRAND HUB & GUIA DE ESTILO
// =========================================================================

function hasBrandHubPermission() {
    if (!currentUser) return false;
    const depts = typeof getUserDepts === 'function' ? getUserDepts(currentUser) : (Array.isArray(currentUser.dept) ? currentUser.dept : (typeof currentUser.dept === 'string' ? currentUser.dept.split(',').map(d => d.trim()) : [currentUser.dept]));
    const isSocialMedia = currentUser.role === 'social_media' || depts.includes('Social Media');
    const isCoord = isGlobalCoordinator();
    return isCoord && !isSocialMedia;
}

function checkBrandHubPermission() {
    if (!hasBrandHubPermission()) {
        toast('Acesso negado: Somente coordenadores (exceto Social Media) podem fazer alterações no Brand Hub.', 'error');
        return false;
    }
    return true;
}

function renderBrandHub() {
    const isCoord = hasBrandHubPermission();
    const btnEdit = document.getElementById('btnEditBrandHub');
    if (btnEdit) {
        btnEdit.style.display = isCoord ? 'flex' : 'none';
    }

    // Render colors
    const colorsGrid = document.getElementById('bhColorsGrid');
    if (colorsGrid) {
        if (!brandHubConfig.colors || brandHubConfig.colors.length === 0) {
            colorsGrid.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; grid-column: 1/-1;">Nenhuma cor cadastrada.</p>`;
        } else {
            colorsGrid.innerHTML = brandHubConfig.colors.map((c, index) => {
                return `
                <div class="color-swatch-card" style="background: var(--surface-light); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px; align-items: center; cursor: pointer; transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;" onclick="window.copyColorHex('${c.hex}', ${index})">
                    <div style="background: ${c.hex}; width: 100%; height: 70px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);"></div>
                    <span style="font-size: 12px; font-weight: 700; color: var(--text-color); text-align: center; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; width: 100%;" title="${c.name || 'Sem nome'}">${c.name || 'Sem nome'}</span>
                    <button class="btn-copy-hex" id="btnCopyHex-${index}" style="background: rgba(255,255,255,0.05); border: none; border-radius: 6px; padding: 6px 8px; color: var(--text-muted); font-size: 11px; width: 100%; cursor: pointer; font-family: monospace; font-weight: 600;">
                        ${c.hex}
                    </button>
                </div>
                `;
            }).join('');
        }
    }

    // Render links
    const linksList = document.getElementById('bhLinksList');
    if (linksList) {
        if (!brandHubConfig.links || brandHubConfig.links.length === 0) {
            linksList.innerHTML = `<p style="color: var(--text-muted); font-size: 13px;">Nenhum link útil cadastrado.</p>`;
        } else {
            linksList.innerHTML = brandHubConfig.links.map(l => {
                return `
                <a href="${l.url}" target="_blank" class="bh-link-card" style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 10px; color: var(--text-color); text-decoration: none; font-weight: 500; font-size: 13.5px; transition: background 0.2s, transform 0.2s;">
                    <span style="font-size: 18px;">🔗</span>
                    <span style="flex: 1; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;" title="${l.label || 'Link sem título'}">${l.label || 'Link sem título'}</span>
                    <span style="color: var(--text-muted); font-size: 12px;">Abrir ↗</span>
                </a>
                `;
            }).join('');
        }
    }

    // Render Assets (Logos & Vetores)
    const assetsGrid = document.getElementById('bhAssetsGrid');
    if (assetsGrid) {
        // Garantir que assets existe e tratar retrocompatibilidade
        if (!brandHubConfig.assets) {
            brandHubConfig.assets = [];
            if (brandHubConfig.driveKitLink) {
                brandHubConfig.assets.push({
                    label: brandHubConfig.driveKitLabel || 'Kit Completo (Vetor/AI/SVG)',
                    url: brandHubConfig.driveKitLink
                });
            }
        }

        // Criar lista de ativos a renderizar
        const allAssets = [];
        
        // 1. Adicionar logotipo principal como primeiro item apenas se estiver configurado
        if (brandHubConfig.logoPngUrl && brandHubConfig.logoPngUrl.trim() !== '') {
            const mainLogoLabel = brandHubConfig.logoPngLabel || 'Logo Principal (Sistema)';
            allAssets.push({ label: mainLogoLabel, url: brandHubConfig.logoPngUrl, isMain: true });
        }

        // 2. Adicionar os demais ativos
        brandHubConfig.assets.forEach(asset => {
            if (asset && asset.url) {
                allAssets.push({ label: asset.label, url: asset.url, isMain: false });
            }
        });

        assetsGrid.innerHTML = allAssets.map((asset, index) => {
            const isImg = asset.url && identifyFileType(asset.url) === 'imagem';
            const previewHtml = isImg 
                ? `<img src="${asset.url}" style="height: 48px; max-width: 100%; object-fit: contain; border-radius: 4px;">`
                : `<span style="font-size: 24px;">📦</span>`;
            
            // Se for imagem do firebase ou local, tenta usar atributo download
            const isExternal = asset.url && (asset.url.startsWith('http') && !asset.url.includes('firebasestorage'));
            const downloadAttr = isExternal ? `target="_blank"` : `download="${asset.label.replace(/\s+/g, '_')}"`;

            return `
            <div style="padding: 12px; background: rgba(0,0,0,0.15); border: 1px solid var(--border-subtle); border-radius: 8px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; justify-content: center; min-height: 140px; position: relative;">
                ${asset.isMain ? `<span style="position: absolute; top: 4px; right: 4px; font-size: 9px; background: var(--primary); color: white; padding: 2px 5px; border-radius: 4px; font-weight: 700;">Principal</span>` : ''}
                <div style="height: 48px; display: flex; align-items: center; justify-content: center; width: 100%;">
                    ${previewHtml}
                </div>
                <span style="font-weight: 600; font-size: 11px; color: var(--text-color); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 32px; align-items: center; display: flex; justify-content: center; width: 100%; text-align: center;" title="${asset.label || ''}">
                    ${asset.label || 'Sem título'}
                </span>
                <a href="${asset.url || '#'}" ${downloadAttr} class="btn-primary" style="padding: 6px 12px; font-size: 10px; border-radius: 6px; text-decoration: none; width: 100%; display: block; font-weight: 600; box-sizing: border-box;">📥 Baixar</a>
            </div>
            `;
        }).join('');
    }

    // Renderizar cores do QR Code
    if (typeof renderQrCodeColors === 'function') {
        renderQrCodeColors();
    }

    // Update paróquia logo globally across views
    if (typeof updateAppLogo === 'function') {
        updateAppLogo(brandHubConfig.logoPngUrl);
    }
}

function renderQrCodeColors() {
    const container = document.getElementById('bhQrColors');
    if (!container) return;
    
    const colors = brandHubConfig.colors || [];
    // Combinar cores oficiais com preto padrão
    const options = [
        ...colors,
        { name: 'Preto Padrão', hex: '#000000' }
    ];

    container.innerHTML = options.map((c, index) => {
        return `
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-color); font-size: 13px;">
            <input type="radio" name="qrColor" value="${c.hex}" ${index === 0 ? 'checked' : ''} style="accent-color: var(--primary); cursor: pointer;">
            <span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background: ${c.hex}; border: 1px solid rgba(255,255,255,0.2);"></span>
            ${c.name || 'Cor'}
        </label>
        `;
    }).join('');
}

function generateQrCode() {
    const urlInput = document.getElementById('bhQrUrlInput');
    const url = urlInput ? urlInput.value.trim() : '';
    
    if (!url) {
        toast('Por favor, insira um link ou URL válido.', 'error');
        return;
    }

    const colorRadio = document.querySelector('input[name="qrColor"]:checked');
    const colorHex = colorRadio ? colorRadio.value : '#000000';
    
    const previewContainer = document.getElementById('bhQrCodePreview');
    const outputContainer = document.getElementById('bhQrOutputContainer');
    
    if (!previewContainer || !outputContainer) return;
    
    // Limpar QR Code anterior
    previewContainer.innerHTML = '';
    
    try {
        if (typeof QRCode === 'undefined') {
            throw new Error("A biblioteca de QR Code não foi carregada. Verifique a conexão com a internet.");
        }
        
        new QRCode(previewContainer, {
            text: url,
            width: 160,
            height: 160,
            colorDark: colorHex,
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        
        outputContainer.style.display = 'flex';
        toast('QR Code gerado com sucesso!', 'success');
    } catch (e) {
        console.error('Erro ao gerar QR Code:', e);
        toast('Erro ao gerar QR Code: ' + e.message, 'error');
    }
}

function downloadGeneratedQrCode() {
    const previewContainer = document.getElementById('bhQrCodePreview');
    if (!previewContainer) return;
    
    const canvas = previewContainer.querySelector('canvas');
    const img = previewContainer.querySelector('img');
    let dataUrl = '';
    
    if (canvas) {
        dataUrl = canvas.toDataURL('image/png');
    } else if (img && img.src) {
        dataUrl = img.src;
    }
    
    if (!dataUrl) {
        toast('Nenhum QR Code gerado para download.', 'error');
        return;
    }
    
    const colorRadio = document.querySelector('input[name="qrColor"]:checked');
    const colorHex = colorRadio ? colorRadio.value : 'custom';
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `qrcode_pnsa_${colorHex.replace('#', '')}.png`;
    link.click();
    toast('Download do QR Code iniciado!', 'success');
}

function copyColorHex(hex, index) {
    navigator.clipboard.writeText(hex).then(() => {
        const btn = document.getElementById(`btnCopyHex-${index}`);
        if (btn) {
            btn.textContent = 'Copiado!';
            btn.style.color = '#10B981';
            btn.style.background = 'rgba(16, 185, 129, 0.1)';
            setTimeout(() => {
                btn.textContent = hex;
                btn.style.color = 'var(--text-muted)';
                btn.style.background = 'rgba(255,255,255,0.05)';
            }, 1500);
        }
        toast(`HEX ${hex} copiado!`, 'success');
    }).catch(err => {
        console.error('Erro ao copiar HEX: ', err);
        toast('Erro ao copiar HEX.', 'error');
    });
}

function openBrandHubEditModal() {
    if (!checkBrandHubPermission()) return;
    document.getElementById('bhEditLogoPngUrl').value = brandHubConfig.logoPngUrl || '';
    document.getElementById('bhEditLogoPngLabel').value = brandHubConfig.logoPngLabel || '';
    
    // Inicializar lista de ativos caso não exista (retrocompatibilidade)
    if (!brandHubConfig.assets) {
        brandHubConfig.assets = [];
        if (brandHubConfig.driveKitLink) {
            brandHubConfig.assets.push({
                label: brandHubConfig.driveKitLabel || 'Kit Completo (Vetor/AI/SVG)',
                url: brandHubConfig.driveKitLink
            });
        }
    }

    renderEditAssetsList();
    renderEditColorsList();
    renderEditLinksList();
    openModal('modalBrandHubEdit');
}

function renderEditAssetsList() {
    const list = document.getElementById('bhEditAssetsList');
    if (!list) return;
    
    const assets = brandHubConfig.assets || [];
    list.innerHTML = assets.map((asset, index) => {
        return `
        <div class="form-row bh-asset-row" style="display: flex; gap: 12px; align-items: center; margin-bottom: 8px;">
            <div style="flex: 1.5;">
                <input type="text" class="bh-asset-label" data-index="${index}" value="${asset.label || ''}" placeholder="Nome (ex: Selo Branco)" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-light); color: var(--text-color); outline: none;">
            </div>
            <div style="flex: 2.5; display: flex; gap: 8px; align-items: center;">
                <input type="text" class="bh-asset-url" data-index="${index}" id="bhAssetUrl-${index}" value="${asset.url || ''}" placeholder="https://..." style="flex: 1; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-light); color: var(--text-color); outline: none;">
                <input type="file" id="bhAssetFileInput-${index}" style="display: none;" onchange="window.handleDynamicAssetUpload(${index}, this)">
                <button type="button" class="btn-primary" onclick="document.getElementById('bhAssetFileInput-${index}').click()" id="btnUploadAsset-${index}" style="padding: 10px 12px; border-radius: 8px; white-space: nowrap; font-weight: 600; display: flex; align-items: center; gap: 4px; border: none; cursor: pointer; background: var(--primary); color: white;">
                    📤 Upload
                </button>
            </div>
            <button class="btn-danger" onclick="window.removeBrandHubAsset(${index})" style="padding: 10px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border: none; background: #ef4444; color: white;">🗑️</button>
        </div>
        `;
    }).join('');
}

function addNewBrandHubAsset() {
    if (!checkBrandHubPermission()) return;
    syncBrandHubDraft();
    if (!brandHubConfig.assets) brandHubConfig.assets = [];
    brandHubConfig.assets.push({ label: '', url: '' });
    renderEditAssetsList();
}

function removeBrandHubAsset(index) {
    if (!checkBrandHubPermission()) return;
    syncBrandHubDraft();
    brandHubConfig.assets.splice(index, 1);
    renderEditAssetsList();
}

async function handleDynamicAssetUpload(index, input) {
    if (!checkBrandHubPermission()) {
        input.value = '';
        return;
    }
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    
    const btn = document.getElementById(`btnUploadAsset-${index}`);
    const inputUrl = document.getElementById(`bhAssetUrl-${index}`);
    let originalHtml = '';
    if (btn) {
        originalHtml = btn.innerHTML;
        btn.innerHTML = '⌛...';
        btn.disabled = true;
    }

    try {
        if (!window.firebaseStorage) {
            throw new Error("Firebase Storage não está inicializado.");
        }
        const storageRef = window.ref(window.firebaseStorage, `arquivos_demandas/brand_assets/asset_${Date.now()}_${file.name}`);
        await window.uploadBytes(storageRef, file);
        const docUrl = await window.getDownloadURL(storageRef);
        
        if (inputUrl) {
            inputUrl.value = docUrl;
        }
        toast('Arquivo enviado com sucesso!', 'success');
    } catch (e) {
        console.error('Erro ao fazer upload do ativo:', e);
        toast('Erro ao enviar o arquivo: ' + e.message, 'error');
    } finally {
        if (btn) {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
        input.value = ''; // Reset file input
    }
}

function renderEditColorsList() {
    const list = document.getElementById('bhEditColorsList');
    if (!list) return;
    
    const colors = brandHubConfig.colors || [];
    list.innerHTML = colors.map((c, index) => {
        return `
        <div class="form-row" style="display: flex; gap: 12px; align-items: center; margin-bottom: 8px;">
            <div style="flex: 2;">
                <input type="text" class="bh-color-name" data-index="${index}" value="${c.name || ''}" placeholder="Nome da Cor (ex: Azul Secundário)" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-light); color: var(--text-color); outline: none;">
            </div>
            <div style="flex: 1.5; display: flex; gap: 8px; align-items: center;">
                <input type="color" class="bh-color-picker" data-index="${index}" value="${c.hex}" oninput="window.updateHexFromPicker(${index}, this.value)" style="width: 40px; height: 40px; border: none; border-radius: 6px; padding: 0; background: none; cursor: pointer;">
                <input type="text" class="bh-color-hex" data-index="${index}" id="bhColorHex-${index}" value="${c.hex}" placeholder="#ffffff" oninput="window.updatePickerFromHex(${index}, this.value)" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-light); color: var(--text-color); outline: none; font-family: monospace;">
            </div>
            <button class="btn-danger" onclick="window.removeBrandHubColor(${index})" style="padding: 10px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border: none; background: #ef4444; color: white;">🗑️</button>
        </div>
        `;
    }).join('');
}

function renderEditLinksList() {
    const list = document.getElementById('bhEditLinksList');
    if (!list) return;

    const links = brandHubConfig.links || [];
    list.innerHTML = links.map((l, index) => {
        return `
        <div class="form-row" style="display: flex; gap: 12px; align-items: center; margin-bottom: 8px;">
            <div style="flex: 1.5;">
                <input type="text" class="bh-link-label" data-index="${index}" value="${l.label || ''}" placeholder="Título (ex: Canva)" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-light); color: var(--text-color); outline: none;">
            </div>
            <div style="flex: 2.5;">
                <input type="text" class="bh-link-url" data-index="${index}" value="${l.url || ''}" placeholder="https://..." style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--surface-light); color: var(--text-color); outline: none;">
            </div>
            <button class="btn-danger" onclick="window.removeBrandHubLink(${index})" style="padding: 10px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border: none; background: #ef4444; color: white;">🗑️</button>
        </div>
        `;
    }).join('');
}

function updateHexFromPicker(index, val) {
    const input = document.getElementById(`bhColorHex-${index}`);
    if (input) input.value = val.toUpperCase();
}

function updatePickerFromHex(index, val) {
    const picker = document.querySelector(`.bh-color-picker[data-index="${index}"]`);
    if (picker && val.match(/^#[0-9A-Fa-f]{6}$/)) {
        picker.value = val;
    }
}

function addNewBrandHubColor() {
    if (!checkBrandHubPermission()) return;
    syncBrandHubDraft();
    if (!brandHubConfig.colors) brandHubConfig.colors = [];
    brandHubConfig.colors.push({ name: '', hex: '#000000' });
    renderEditColorsList();
}

function removeBrandHubColor(index) {
    if (!checkBrandHubPermission()) return;
    syncBrandHubDraft();
    brandHubConfig.colors.splice(index, 1);
    renderEditColorsList();
}

function addNewBrandHubLink() {
    if (!checkBrandHubPermission()) return;
    syncBrandHubDraft();
    if (!brandHubConfig.links) brandHubConfig.links = [];
    brandHubConfig.links.push({ label: '', url: '' });
    renderEditLinksList();
}

function removeBrandHubLink(index) {
    if (!checkBrandHubPermission()) return;
    syncBrandHubDraft();
    brandHubConfig.links.splice(index, 1);
    renderEditLinksList();
}

function syncBrandHubDraft() {
    const names = document.querySelectorAll('.bh-color-name');
    const hexs = document.querySelectorAll('.bh-color-hex');
    brandHubConfig.colors = Array.from(names).map((el, i) => {
        return {
            name: el.value,
            hex: hexs[i] ? hexs[i].value : '#000000'
        };
    });

    const labels = document.querySelectorAll('.bh-link-label');
    const urls = document.querySelectorAll('.bh-link-url');
    brandHubConfig.links = Array.from(labels).map((el, i) => {
        return {
            label: el.value,
            url: urls[i] ? urls[i].value : ''
        };
    });

    const assetLabels = document.querySelectorAll('.bh-asset-label');
    const assetUrls = document.querySelectorAll('.bh-asset-url');
    brandHubConfig.assets = Array.from(assetLabels).map((el, i) => {
        return {
            label: el.value,
            url: assetUrls[i] ? assetUrls[i].value : ''
        };
    });

    const logoUrlInput = document.getElementById('bhEditLogoPngUrl');
    const logoLabelInput = document.getElementById('bhEditLogoPngLabel');
    if (logoUrlInput) brandHubConfig.logoPngUrl = logoUrlInput.value;
    if (logoLabelInput) brandHubConfig.logoPngLabel = logoLabelInput.value;
}

async function saveBrandHubConfig() {
    if (!checkBrandHubPermission()) return;
    syncBrandHubDraft();

    const btnSave = document.querySelector('#modalBrandHubEdit .btn-success');
    let originalHtml = '';
    if (btnSave) {
        originalHtml = btnSave.innerHTML;
        btnSave.innerHTML = '⌛ Salvando...';
        btnSave.disabled = true;
    }

    try {
        await window.setDoc(window.doc(window.firebaseDb, "config", "brandHub"), brandHubConfig);
        localStorage.setItem('sgta-brandhub', JSON.stringify(brandHubConfig));
        toast('Configurações do Brand Hub salvas com sucesso!', 'success');
        closeModal('modalBrandHubEdit');
        renderBrandHub();
    } catch (e) {
        console.error('Erro ao salvar config do Brand Hub no Firestore:', e);
        toast('Erro ao salvar configurações do Brand Hub.', 'error');
    } finally {
        if (btnSave) {
            btnSave.innerHTML = originalHtml;
            btnSave.disabled = false;
        }
    }
}

// Bind to window to avoid scope issues in HTML inline onclick events
window.renderBrandHub = renderBrandHub;
window.copyColorHex = copyColorHex;
window.openBrandHubEditModal = openBrandHubEditModal;
window.renderEditColorsList = renderEditColorsList;
window.renderEditLinksList = renderEditLinksList;
window.updateHexFromPicker = updateHexFromPicker;
window.updatePickerFromHex = updatePickerFromHex;
window.addNewBrandHubColor = addNewBrandHubColor;
window.removeBrandHubColor = removeBrandHubColor;
window.addNewBrandHubLink = addNewBrandHubLink;
window.removeBrandHubLink = removeBrandHubLink;
window.saveBrandHubConfig = saveBrandHubConfig;

async function handleBrandHubLogoUpload(input) {
    if (!checkBrandHubPermission()) {
        input.value = '';
        return;
    }
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    
    const btn = document.getElementById('btnUploadLogoBrandHub');
    const inputUrl = document.getElementById('bhEditLogoPngUrl');
    let originalHtml = '';
    if (btn) {
        originalHtml = btn.innerHTML;
        btn.innerHTML = '⌛ Enviando...';
        btn.disabled = true;
    }

    try {
        if (!window.firebaseStorage) {
            throw new Error("Firebase Storage não está inicializado.");
        }
        const storageRef = window.ref(window.firebaseStorage, `arquivos_demandas/brand_assets/logo_${Date.now()}_${file.name}`);
        await window.uploadBytes(storageRef, file);
        const docUrl = await window.getDownloadURL(storageRef);
        
        if (inputUrl) {
            inputUrl.value = docUrl;
        }
        toast('Logo enviada com sucesso!', 'success');
    } catch (e) {
        console.error('Erro ao fazer upload da logo:', e);
        toast('Erro ao enviar o arquivo: ' + e.message, 'error');
    } finally {
        if (btn) {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
        input.value = ''; // Reset file input
    }
}

async function handleBrandHubKitUpload(input) {
    if (!checkBrandHubPermission()) {
        input.value = '';
        return;
    }
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    
    const btn = document.getElementById('btnUploadKitBrandHub');
    const inputUrl = document.getElementById('bhEditDriveKitLink');
    let originalHtml = '';
    if (btn) {
        originalHtml = btn.innerHTML;
        btn.innerHTML = '⌛ Enviando...';
        btn.disabled = true;
    }

    try {
        if (!window.firebaseStorage) {
            throw new Error("Firebase Storage não está inicializado.");
        }
        const storageRef = window.ref(window.firebaseStorage, `arquivos_demandas/brand_assets/kit_${Date.now()}_${file.name}`);
        await window.uploadBytes(storageRef, file);
        const docUrl = await window.getDownloadURL(storageRef);
        
        if (inputUrl) {
            inputUrl.value = docUrl;
        }
        toast('Kit de vetores enviado com sucesso!', 'success');
    } catch (e) {
        console.error('Erro ao fazer upload do kit:', e);
        toast('Erro ao enviar o arquivo: ' + e.message, 'error');
    } finally {
        if (btn) {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
        input.value = ''; // Reset file input
    }
}

function updateAppLogo(url) {
    const logoUrl = url || 'logo-pnsa.png';
    const loginLogo = document.getElementById('appLoginLogo');
    const sidebarLogo = document.getElementById('appSidebarLogo');
    const modalLogo = document.getElementById('appModalLogo');
    
    if (loginLogo) loginLogo.src = logoUrl;
    if (sidebarLogo) sidebarLogo.src = logoUrl;
    if (modalLogo) modalLogo.src = logoUrl;
}

window.handleBrandHubLogoUpload = handleBrandHubLogoUpload;
window.handleBrandHubKitUpload = handleBrandHubKitUpload;
window.updateAppLogo = updateAppLogo;
window.renderEditAssetsList = renderEditAssetsList;
window.addNewBrandHubAsset = addNewBrandHubAsset;
window.removeBrandHubAsset = removeBrandHubAsset;
window.handleDynamicAssetUpload = handleDynamicAssetUpload;
window.renderQrCodeColors = renderQrCodeColors;
window.generateQrCode = generateQrCode;
window.downloadGeneratedQrCode = downloadGeneratedQrCode;



