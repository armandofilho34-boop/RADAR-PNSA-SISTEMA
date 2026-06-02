// Radar PNSA - SISTEMA DE GESTÃO DE DEMANDAS ASSUNÇÃO
// Versão 2.2 - Correções de Timer e Checkbox

const USERS = {
    'armando-coord': { id: 'armando-coord', nome: 'Armando', iniciais: 'AR', dept: 'Coordenação', role: 'coordinator' },
    'julia-sm': { id: 'julia-sm', nome: 'Julia Mendes', iniciais: 'JM', dept: 'Social Media', role: 'social_media' },
    'carlos-sm': { id: 'carlos-sm', nome: 'Carlos Santos', iniciais: 'CS', dept: 'Social Media', role: 'coordinator' },
    'ana-dg': { id: 'ana-dg', nome: 'Ana Costa', iniciais: 'AC', dept: 'Designer', role: 'executor' },
    'lucas-dg': { id: 'lucas-dg', nome: 'Lucas Oliveira', iniciais: 'LO', dept: 'Designer', role: 'executor' },
    'pedro-vm': { id: 'pedro-vm', nome: 'Pedro Lima', iniciais: 'PL', dept: 'Videomaker', role: 'executor' },
    'maria-vm': { id: 'maria-vm', nome: 'Maria Silva', iniciais: 'MS', dept: 'Videomaker', role: 'executor' },
    'roberto-sp': { id: 'roberto-sp', nome: 'Roberto Souza', iniciais: 'RS', dept: 'Suporte', role: 'executor' },
    'fernanda-ti': { id: 'fernanda-ti', nome: 'Fernanda Tech', iniciais: 'FT', dept: 'Inovação/TI', role: 'executor' }
};

const DEPT_USERS = { 'Designer': ['ana-dg', 'lucas-dg'], 'Videomaker': ['pedro-vm', 'maria-vm'], 'Suporte': ['roberto-sp'], 'Inovação/TI': ['fernanda-ti'] };
const DEPT_COLORS = { 'Coordenação': '#6366f1', 'Social Media': '#ec4899', 'Designer': '#a855f7', 'Videomaker': '#3b82f6', 'Suporte': '#22c55e', 'Inovação/TI': '#f59e0b' };
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function isGlobalCoordinator() {
    if (!currentUser) return false;
    let depts = typeof getUserDepts === 'function' ? getUserDepts(currentUser) : (Array.isArray(currentUser.dept) ? currentUser.dept : (typeof currentUser.dept === 'string' ? currentUser.dept.split(',').map(d => d.trim()) : [currentUser.dept]));
    return depts.includes('Gestão');
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

let currentUser = null, demandas = [], nextId = 1, currentDept = null, currentTaskId = null;
let currentView = 'minha-area';
let agendaDate = new Date(), tvInterval = null;

// Função para abrir modais
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

// Função de login
function doLogin() {
    console.log('Radar PNSA: Tentando login...');
    const selectUser = document.getElementById('selectUser');
    if (!selectUser) {
        console.error('Radar PNSA: Elemento selectUser não encontrado');
        return;
    }
    const id = selectUser.value;
    console.log('Radar PNSA: Usuário selecionado:', id);
    if (!id) {
        toast('Selecione um colaborador', 'error');
        return;
    }
    if (!USERS[id]) {
        console.error('Radar PNSA: Usuário não encontrado:', id);
        toast('Usuário não encontrado', 'error');
        return;
    }
    currentUser = USERS[id];
    localStorage.setItem('workflowUser', id);
    toast('Bem-vindo, ' + currentUser.nome + '!', 'success');
    showApp();
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('Radar PNSA: Iniciando...');
    try {
        loadData();
        console.log('Radar PNSA: Dados carregados');
        initEvents();
        console.log('Radar PNSA: Eventos inicializados');
        checkAuth();
        console.log('Radar PNSA: Autenticação verificada');
    } catch (e) {
        console.error('Radar PNSA: Erro na inicialização', e);
    }
});

function loadData() {
    const s = localStorage.getItem('workflowPNSA');
    if (s) {
        demandas = JSON.parse(s);
        nextId = demandas.length > 0 ? Math.max(...demandas.map(d => parseInt(d.id.split('-')[1]))) + 1 : 1;
        demandas.forEach(d => {
            if (STATUS_MIGRATION[d.status]) d.status = STATUS_MIGRATION[d.status];
            if (d.pipeline) d.pipeline.forEach(p => { if (STATUS_MIGRATION[p.status]) p.status = STATUS_MIGRATION[p.status]; });
            if (!d.quadro && d.pipeline && d.pipeline.length > 0) d.quadro = d.pipeline[0].dept === 'Designer' ? 'Designer' : d.pipeline[0].dept === 'Videomaker' ? 'Videomaker' : 'Designer';
            if (!d.aba) d.aba = d.quadro === 'Designer' ? 'Criativos (arte)' : 'Criativos (vídeo)';
            if (d.quadro === 'Designer' && d.artePronta === undefined) d.artePronta = false;
            if (d.tempoAcumulado === undefined) d.tempoAcumulado = 0;

            // SAFETY: Force stop timer if not in 'Fazendo' (Retroactive Fix)
            if (d.status !== 'Fazendo') {
                d.pipeline.forEach(stage => {
                    if (stage.timerState && stage.timerState.running) {
                        const endTime = d.lastStatusChange ? new Date(d.lastStatusChange) : new Date();
                        const startTime = new Date(stage.timerState.lastStart);
                        // Only accumulate if valid range
                        if (endTime > startTime) {
                            stage.timerState.accumulated = (stage.timerState.accumulated || 0) + (endTime - startTime);
                        }
                        stage.timerState.running = false;
                        stage.timerState.lastStart = null;

                        // Update readable string
                        const ms = stage.timerState.accumulated;
                        const hours = Math.floor(ms / (1000 * 60 * 60));
                        const mins = Math.floor((ms / (1000 * 60)) % 60);
                        stage.timeSpent = `${hours}h ${mins}m`;
                    }
                });
            }
        });
        saveData();
    }
}


function saveData() { localStorage.setItem('workflowPNSA', JSON.stringify(demandas)); }
function checkAuth() {
    const u = localStorage.getItem('workflowUser');
    if (u && USERS[u]) {
        currentUser = USERS[u];
        // Show login screen first so Remotion animation plays
        showLogin();
        const autoBtn = document.getElementById('autoLoginMsg');
        if (autoBtn) {
            const originalBtn = document.getElementById('googleLogin');
            if (originalBtn) originalBtn.style.display = 'none';

            autoBtn.style.display = 'flex';
            let timeLeft = 10;
            const ring = document.getElementById('loginTimerRing');
            const text = document.getElementById('loginTimerText');
            text.textContent = timeLeft;
            ring.style.strokeDashoffset = '0';

            window._autoLoginInt = setInterval(() => {
                timeLeft--;
                if (timeLeft >= 0) {
                    text.textContent = timeLeft;
                    const maxOffset = 150.79;
                    const offset = maxOffset - (maxOffset * timeLeft / 10);
                    ring.style.strokeDashoffset = offset;
                }
            }, 1000);

            window._autoLoginTm = setTimeout(() => {
                if (window._autoLoginInt) clearInterval(window._autoLoginInt);
                showApp();
            }, 10000);
        } else {
            setTimeout(function () { showApp(); }, 10000);
        }
    } else {
        showLogin();
    }
}
function showLogin() { document.getElementById('loginScreen').style.display = 'flex'; document.getElementById('app').style.display = 'none'; }
function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    updateUserUI();
    setupRoleUI();
    startNotificationsListener(); // Escuta tempo real as notifications do usuário atual
    generateSampleData();
    checkStaleDemands();

    // Restore last view
    const lastView = localStorage.getItem('sgta-last-view');
    const lastDept = localStorage.getItem('sgta-last-dept');

    if (lastView === 'board' && lastDept) {
        openBoard(lastDept);
    } else if (lastView) {
        navigateTo(lastView);
    } else {
        navigateTo('minha-area');
    }
}

function updateUserUI() {
    document.getElementById('userAvatar').textContent = currentUser.iniciais;
    document.getElementById('userName').textContent = currentUser.nome;
    document.getElementById('userDept').textContent = currentUser.dept;
    document.getElementById('welcomeName').textContent = currentUser.nome.split(' ')[0];
    document.getElementById('cSolicitante').innerHTML = `<option value="${currentUser.id}" selected>${currentUser.nome}</option>`;
}

function setupRoleUI() {
    const isCoordOrSocialMedia = currentUser.role === 'coordinator' || currentUser.role === 'social_media' || currentUser.role === 'gestor_equipe';
    document.getElementById('navCoordinator').style.display = isCoordOrSocialMedia ? 'block' : 'none';
    document.getElementById('navExecutor').style.display = isCoordOrSocialMedia ? 'none' : 'block';
    document.getElementById('headerActions').style.display = isCoordOrSocialMedia ? 'flex' : 'none';
    document.querySelector('.btn-create-alt').style.display = isCoordOrSocialMedia ? 'flex' : 'none';
    document.getElementById('welcomeDesc').textContent = isCoordOrSocialMedia ? 'Acompanhe suas demandas e crie novas' : 'Veja as tarefas atribuídas a você';
    document.getElementById('navWorkload').style.display = isCoordOrSocialMedia ? 'flex' : 'none';
    document.getElementById('navTemplates').style.display = isCoordOrSocialMedia ? 'flex' : 'none';
    const navLixeira = document.getElementById('navLixeira');
    if (navLixeira) navLixeira.style.display = isCoordOrSocialMedia ? 'flex' : 'none';
    const navTV = document.getElementById('navTV');
    if (navTV) navTV.style.display = isCoordOrSocialMedia ? 'block' : 'none';
    buildDeptNav();
}

function buildDeptNav() {
    const c = document.getElementById('navDepts');
    const isCoordOrSocialMedia = currentUser.role === 'coordinator' || currentUser.role === 'social_media' || currentUser.role === 'gestor_equipe';

    if (!isCoordOrSocialMedia) {
        if (c) c.style.display = 'none';
        return;
    } else {
        if (c) c.style.display = 'block';
    }

    let depts = [];
    if (isCoordOrSocialMedia) {
        depts = ['Designer', 'Videomaker', 'Transmissão', 'Suporte', 'Inovação/TI'];
    } else {
        depts = Array.isArray(currentUser.dept) ? currentUser.dept : (typeof currentUser.dept === 'string' ? currentUser.dept.split(',').map(d => d.trim()) : [currentUser.dept]);
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
    const btnEnter = document.getElementById('btnEnter');
    if (btnEnter) {
        btnEnter.addEventListener('click', doLogin);
        console.log('Radar PNSA: Evento de login configurado');
    } else {
        console.error('Radar PNSA: Botão btnEnter não encontrado!');
    }

    const googleLogin = document.getElementById('googleLogin');
    if (googleLogin) googleLogin.addEventListener('click', function () { toast('Integração Google em desenvolvimento', 'info'); });

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) btnLogout.addEventListener('click', function () { localStorage.removeItem('workflowUser'); if (tvInterval) clearInterval(tvInterval); showLogin(); });

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
    document.getElementById('btnAgendaPrev')?.addEventListener('click', () => { agendaDate.setMonth(agendaDate.getMonth() - 1); renderAgenda(); });
    document.getElementById('btnAgendaNext')?.addEventListener('click', () => { agendaDate.setMonth(agendaDate.getMonth() + 1); renderAgenda(); });
    document.getElementById('btnAgendaToday')?.addEventListener('click', () => { agendaDate = new Date(); renderAgenda(); });
    document.getElementById('btnOpenTV')?.addEventListener('click', () => { window.open('tv-dashboard.html', '_blank'); });
}

function onTipoProjetoChange() {
    console.log('DEBUG: Change Event Fired');
    const t = document.getElementById('cTipoProjeto').value;
    // Reset all sub-sections
    document.getElementById('sectionSubType').style.display = 'none';
    ['groupDesign', 'groupVideo', 'groupSocial', 'groupTI'].forEach(id => document.getElementById(id).style.display = 'none');
    ['cTipoDesign', 'cTipoVideo', 'cTipoSocial', 'cTipoTI'].forEach(id => document.getElementById(id).required = false);

    // Show appropriate sub-section
    const isTI = t === 'TI';

    // Toggle standard vs TI fields
    if (document.getElementById('groupStandardFields')) {
        document.getElementById('groupStandardFields').style.display = isTI ? 'none' : 'block';
    }
    if (document.getElementById('groupTIFields')) {
        document.getElementById('groupTIFields').style.display = isTI ? 'block' : 'none';
    }

    // Toggle Dates and Title for TI
    const datesGroup = document.getElementById('groupDatesTitle');
    if (datesGroup) {
        datesGroup.style.display = isTI ? 'none' : 'block';
        document.getElementById('cDataSolicitacao').required = !isTI;
        document.getElementById('cDataConclusao').required = !isTI;
    }

    // Toggle Pinned Option
    const pinnedGroup = document.getElementById('groupPinned');
    if (pinnedGroup) pinnedGroup.style.display = isTI ? 'none' : 'flex';

    // Hide/Show "Formatos" and standard descriptions based on type
    const formatsGroup = document.getElementById('groupFormats');
    if (formatsGroup) formatsGroup.style.display = isTI ? 'none' : 'block';

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
    const titles = { 'minha-area': 'Minha Área', 'minha-agenda': 'Minha Agenda', kanban: 'Kanban Board', 'quadro-geral': 'Quadro Geral', requests: 'Minhas Demandas', review: 'Para Revisar', tasks: 'Para Executar', timeline: 'Timeline', analytics: 'Analytics', workload: 'Carga de Trabalho', templates: 'Templates', mural: 'Mural de Avisos', lixeira: 'Lixeira / Arquivo Morto' };
    document.getElementById('pageTitle').textContent = titles[view] || 'Radar PNSA';
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
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-board').classList.add('active');
    document.getElementById('pageTitle').textContent = dept;
    renderBoard();
    document.getElementById('sidebar').classList.remove('open');
}

// MINHA AGENDA (Personal Calendar)
function renderAgenda() {
    const yr = agendaDate.getFullYear(), mo = agendaDate.getMonth();
    document.getElementById('agendaTitle').textContent = `${MONTHS[mo]} ${yr}`;
    document.getElementById('agendaAvatar').textContent = currentUser.iniciais;
    document.getElementById('agendaUserName').textContent = `Agenda de ${currentUser.nome.split(' ')[0]}`;
    document.getElementById('agendaUserDept').textContent = `${currentUser.dept} • ${isGlobalCoordinator() ? 'Todas as demandas' : 'Minhas demandas do mês'}`;

    const activeDemandas = demandas.filter(d => !d.deletedAt);
    let tasks;
    if (isGlobalCoordinator()) {
        tasks = activeDemandas;
    } else {
        tasks = activeDemandas.filter(d =>
            d.solicitanteId === currentUser.id ||
            (d.pipeline && d.pipeline.some(s => s.userId === currentUser.id))
        );
    }

    const monthTasks = tasks.filter(t => { const dt = parseDateLocal(t.dataConclusao); return dt.getFullYear() === yr && dt.getMonth() === mo; });

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
        html += `<div class="calendar-day ${isToday ? 'today' : ''}"><span class="calendar-day-num">${day}</span>
            ${dayTasks.slice(0, 3).map(t => `<div class="calendar-event ${t.prioridade.toLowerCase()}" onclick="openDetail('${t.id}')">${t.nome}</div>`).join('')}
            ${dayTasks.length > 3 ? `<div class="calendar-event" style="background:var(--bg-hover);color:var(--text-muted);">+${dayTasks.length - 3} mais</div>` : ''}
        </div>`;
    }

    const remaining = 42 - (startDay + totalDays);
    for (let d = 1; d <= remaining; d++) html += `<div class="calendar-day other-month"><span class="calendar-day-num">${d}</span></div>`;
    document.getElementById('agendaDays').innerHTML = html;
}

// MINHA ãREA - Personal Dashboard
function updateMinhaArea() {
    let tasks = isGlobalCoordinator() ? demandas : demandas.filter(d =>
        d.solicitanteId === currentUser.id ||
        (d.pipeline && d.pipeline.some(s => s.userId === currentUser.id))
    );
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
    let tasks = isGlobalCoordinator() ? demandas.filter(d => !d.deletedAt) : demandas.filter(d =>
        !d.deletedAt && (d.solicitanteId === currentUser.id ||
        (d.pipeline && d.pipeline.some(s => s.userId === currentUser.id)))
    );

    const labels = {
        'all': '📋 Todas as Demandas',
        'Fazendo': '⏳ Demandas Em Andamento',
        'Para aprovação': '👁️ Demandas Para Revisar',
        'Aprovado': '✅ Demandas Concluídas'
    };

    if (statusFilter !== 'all') {
        tasks = tasks.filter(d => d.status === statusFilter);
    }

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
                const resp = currentStage ? USERS[currentStage.userId] : null;

                return `<div onclick="openDetail('${t.id}')" style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:var(--surface-light); border-radius:10px; border:1px solid var(--border-subtle); cursor:pointer; transition:all 0.2s ease;" onmouseenter="this.style.transform='translateX(4px)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'" onmouseleave="this.style.transform='none'; this.style.boxShadow='none'">
                    <div style="flex:1; min-width:0;">
                        <div style="font-weight:600; font-size:0.95em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.nome}</div>
                        <div style="font-size:0.8em; color:var(--text-muted); margin-top:2px;">
                            ${t.tipoProjeto} • ${resp?.nome || '-'} • <span style="${dateClass}">📅 ${formatDate(t.dataConclusao)}</span>
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
        { name: 'TI', cls: 'ti', aliases: ['TI'] }
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
    c.innerHTML = tasks.map(t => `<div class="activity-item" onclick="openDetail('${t.id}')"><div class="activity-prio ${t.prioridade.toLowerCase()}"></div><div class="activity-info"><div class="activity-title">${t.nome}</div><div class="activity-meta">${t.tipoProjeto} • Etapa ${t.currentStage + 1}/${t.pipeline.length}</div></div><span class="status-tag ${getStatusClass(t.status)}">${t.status}</span></div>`).join('');
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
    if (isGlobalCoordinator()) {
        document.getElementById('badgeRequests').textContent = demandas.filter(d => d.status !== 'Aprovado').length;
        document.getElementById('badgeReview').textContent = demandas.filter(d => d.status === 'Para aprovação').length;
    } else if (currentUser.role === 'coordinator' || currentUser.role === 'social_media' || currentUser.role === 'gestor_equipe') {
        document.getElementById('badgeRequests').textContent = demandas.filter(d => d.solicitanteId === currentUser.id && d.status !== 'Aprovado').length;
        document.getElementById('badgeReview').textContent = demandas.filter(d => d.solicitanteId === currentUser.id && d.status === 'Para aprovação').length;
    } else {
        const executorTasks = demandas.filter(d => d.pipeline.some(s => s.userId === currentUser.id) && d.pipeline[d.currentStage].userId === currentUser.id && d.status !== 'Aprovado');
        const badgeTasks = document.getElementById('badgeTasks');
        if (badgeTasks) badgeTasks.textContent = executorTasks.length;
    }
}

// KANBAN BOARD with Drag & Drop
function renderKanban() {
    const prioFilter = document.getElementById('filterKanbanPrio')?.value || '';
    const deptFilter = document.getElementById('filterKanbanDept')?.value || '';
    const searchTerm = document.getElementById('kanbanSearch')?.value?.toLowerCase() || '';

    let tasks;
    if (isGlobalCoordinator()) {
        tasks = demandas.filter(d => !d.deletedAt);
    } else if (currentUser.role === 'coordinator' || currentUser.role === 'social_media' || currentUser.role === 'gestor_equipe') {
        tasks = demandas.filter(d => !d.deletedAt && d.solicitanteId === currentUser.id);
    } else {
        tasks = demandas.filter(d => !d.deletedAt && d.pipeline.some(s => s.userId === currentUser.id));
    }

    // Apply filters
    if (prioFilter) tasks = tasks.filter(t => t.prioridade === prioFilter);
    if (deptFilter) tasks = tasks.filter(t => t.pipeline.some(s => s.dept === deptFilter));
    if (searchTerm) tasks = tasks.filter(t => t.nome.toLowerCase().includes(searchTerm));

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
                currentSession = new Date() - new Date(timerState.lastStart);
            }
            const totalMs = (timerState.accumulated || 0) + currentSession;
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

            return `
                <div class="kanban-card ${t.prioridade.toLowerCase()}" draggable="true" data-id="${t.id}" onclick="openDetail('${t.id}')">
                    <div class="kanban-card-header">
                         <span class="kanban-card-title">${t.nome}</span>
                         ${t.stale ? `<span class="stale-badge" title="Parada há ${staleDays} dias">⚠️ ${staleDays}d</span>` : ''}
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
                        <span class="timer-display ${timerState.running ? 'running' : ''}" id="timer-${t.id}" data-start="${timerState.lastStart}" data-accumulated="${timerState.accumulated || 0}">
                            ${timerState.running ? '<span class="timer-badge-active"></span>' : ''}${formattedTime}
                        </span>
                    </div>` : `
                    <div class="timer-controls" style="background:none; padding-left:0;">
                        <span class="timer-display ${timerState.running ? 'running' : ''}" id="timer-${t.id}" data-start="${timerState.lastStart}" data-accumulated="${timerState.accumulated || 0}" style="font-size:0.8rem; ${timerState.running ? '' : 'color:var(--text-dim)'}">
                            ${timerState.running ? '<span class="timer-badge-active"></span>' : '⏱️ '}${formattedTime}
                        </span>
                    </div>`}

                    <div class="kanban-card-footer">
                        <span class="kanban-card-date ${dateClass}">📅 ${formatDate(t.dataConclusao)}</span>
                        <div class="kanban-card-avatars">
                            ${avatars.slice(0, 3).map(u => `<span class="kanban-card-avatar">${u.iniciais}</span>`).join('')}
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
let _kanbanColumnsInitialized = false;

function initKanbanDragDrop() {
    // Cards are recreated by innerHTML each render, so we always re-attach
    const cards = document.querySelectorAll('.kanban-card[draggable="true"]');
    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            card.classList.add('dragging');
            e.dataTransfer.setData('text/plain', card.dataset.id);
        });
        card.addEventListener('dragend', () => card.classList.remove('dragging'));
    });

    // Columns persist in the DOM — only attach listeners ONCE
    if (!_kanbanColumnsInitialized) {
        const columns = document.querySelectorAll('.kanban-cards');
        columns.forEach(col => {
            col.addEventListener('dragover', (e) => {
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
        _kanbanColumnsInitialized = true;
    }
}

function changeTaskStatus(taskId, newStatus) {
    const task = demandas.find(d => d.id === taskId);
    if (!task) return;

    // 1. ALWAYS STOP TIMER first (Close current session)
    const currentStage = task.pipeline[task.currentStage];

    if (currentStage.timerState && currentStage.timerState.running) {
        const now = new Date();
        const start = new Date(currentStage.timerState.lastStart);

        // Validate date
        if (!isNaN(start.getTime())) {
            currentStage.timerState.accumulated = (currentStage.timerState.accumulated || 0) + (now - start);
        }

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
        task.status = newStatus;
        task.lastStatusChange = new Date().toISOString();
        toast(`Status alterado para "${newStatus}"`, 'success');
    }

    // 3. Auto-start timer if moving TO 'Fazendo'
    if (newStatus === 'Fazendo') {
        if (!currentStage.timerState) {
            currentStage.timerState = { running: false, accumulated: 0, lastStart: null };
        }
        if (!currentStage.timerState.running) {
            currentStage.timerState.running = true;
            currentStage.timerState.lastStart = new Date().toISOString();
            toast('Timer iniciado automaticamente! 🔴', 'success');
        }
    }

    saveData(task);
    if (typeof refresh === 'function') refresh();
    else renderKanban();
}

// QUADRO GERAL - All demands view for coordinators
// QUADRO GERAL - All demands view for coordinators
function renderQuadroGeral() {
    const statusFilter = document.getElementById('filterQuadroStatus')?.value || '';
    const deptFilter = document.getElementById('filterQuadroDept')?.value || '';
    const prioFilter = document.getElementById('filterQuadroPrio')?.value || '';
    const searchTerm = document.getElementById('quadroSearch')?.value?.toLowerCase() || '';

    // Get all demands for coordinator OR where user is participant
    let tasks = [];
    if (isGlobalCoordinator()) {
        tasks = demandas;
    } else {
        // User sees tasks they requested OR where they are active OR were part of the pipeline (for history)
        tasks = demandas.filter(d =>
            d.solicitanteId === currentUser.id ||
            (d.pipeline && d.pipeline.some(s => s.userId === currentUser.id))
        );
    }


    // Apply filters
    if (statusFilter) tasks = tasks.filter(t => t.status === statusFilter);
    if (deptFilter) tasks = tasks.filter(t => t.pipeline.some(s => s.dept === deptFilter));
    if (prioFilter) tasks = tasks.filter(t => t.prioridade === prioFilter);
    if (searchTerm) tasks = tasks.filter(t => t.nome.toLowerCase().includes(searchTerm) || t.id.toLowerCase().includes(searchTerm));

    // Render stats - Update stats logic too
    let allTasks = [];
    if (isGlobalCoordinator()) {
        allTasks = demandas;
    } else {
        // User sees tasks they requested OR where they are active OR were part of the pipeline (for history)
        allTasks = demandas.filter(d =>
            d.solicitanteId === currentUser.id ||
            (d.pipeline && d.pipeline.some(s => s.userId === currentUser.id))
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
        const stage = t.pipeline[t.currentStage];
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
    const c = document.getElementById('requestsTable');
    let t = isGlobalCoordinator() ? demandas.filter(d => !d.deletedAt) : demandas.filter(d => !d.deletedAt && d.solicitanteId === currentUser.id);

    // Always show tabs, even if empty
    c.innerHTML = renderRequestsTabs(t);
}

function renderRequestsTabs(tasks) {
    const groups = {};
    tasks.forEach(t => {
        if (!groups[t.status]) groups[t.status] = [];
        groups[t.status].push(t);
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
        html += `<button class="execution-tab ${activeClass}" onclick="switchRequestTab('${status.key}')" id="tab-btn-req-${status.key.replace(/\s+/g, '-')}">
                    ${status.label} <span class="execution-tab-count">${count}</span>
                 </button>`;
    });
    html += `</div>`;

    // 2. Render Content Areas
    html += `<div class="execution-body">`;
    statusOrder.forEach((status, index) => {
        const items = groups[status.key] || [];
        const activeClass = index === 0 ? 'active' : '';

        html += `<div id="tab-content-req-${status.key.replace(/\s+/g, '-')}" class="execution-tab-content ${activeClass}">`;

        if (items.length === 0) {
            html += '<div class="empty-message">Nenhuma demanda neste status</div>';
        } else {
            html += `<div class="execution-grid">
                ${items.map(t => {
                const deadline = parseDateLocal(t.dataConclusao);
                const today = new Date();
                const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                let dateClass = '';
                if (daysUntil < 0) dateClass = 'overdue';
                else if (daysUntil <= 3) dateClass = 'soon';

                const currentStage = t.pipeline[t.currentStage];
                const responsavel = USERS[currentStage?.userId];

                return `
                        <div class="execution-card ${t.prioridade.toLowerCase()}" onclick="openDetail('${t.id}')">
                            <div class="execution-card-header">
                                <span class="execution-date ${dateClass}">📅 ${formatDate(t.dataConclusao)}</span>
                            </div>
                            <div class="execution-card-body">
                                <h4 class="execution-title">${t.nome}</h4>
                                <div class="execution-meta">
                                    <span class="meta-display">📁 ${t.tipoProjeto}</span>
                                    <span class="meta-display">🏢 ${currentStage?.dept || '-'}</span>
                                </div>
                            </div>
                            <div class="execution-card-footer">
                                <span class="execution-prio-badge ${t.prioridade.toLowerCase()}">${t.prioridade}</span>
                                <div class="execution-avatars">
                                    ${responsavel ? `<div class="avatar">${responsavel.iniciais}</div>` : ''}
                                </div>
                            </div>
                        </div>`;
            }).join('')}
            </div>`;
        }
        html += `</div>`;
    });
    html += `</div>`;

    return html;
}

function switchRequestTab(key) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.execution-tab').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.execution-tab-content').forEach(el => el.classList.remove('active'));

    // Add active class to selected
    const safeKey = key.replace(/\s+/g, '-');
    document.getElementById(`tab-btn-req-${safeKey}`)?.classList.add('active');
    document.getElementById(`tab-content-req-${safeKey}`)?.classList.add('active');
}

function renderReview() {
    const c = document.getElementById('reviewTable'), t = isGlobalCoordinator() ? demandas.filter(d => !d.deletedAt && d.status === 'Para aprovação') : demandas.filter(d => !d.deletedAt && d.solicitanteId === currentUser.id && d.status === 'Para aprovação');
    if (!t.length) { c.innerHTML = '<div class="empty-message">Nenhuma demanda para revisar</div>'; return; }
    c.innerHTML = `<div class="table-head">
        <div class="table-th">Demanda</div>
        <div class="table-th">Etapa</div>
        <div class="table-th">Prioridade</div>
        <div class="table-th">Prazo</div>
        <div class="table-th">Responsável</div>
    </div>
    ${t.map(t => {
        const s = t.pipeline[t.currentStage], u = USERS[s.userId];
        return `<div class="table-row" onclick="openReviewModal('${t.id}')">
            <div class="table-td"><span class="td-title">${t.nome}</span></div>
            <div class="table-td">${s.dept}</div>
            <div class="table-td"><span class="priority-badge ${t.prioridade.toLowerCase()}">${t.prioridade}</span></div>
            <div class="table-td">${formatDate(t.dataConclusao)}</div>
            <div class="table-td"><span class="td-avatar">${u?.iniciais || '?'}</span></div>
        </div>`;
    }).join('')}`;
}

function renderTasks() {
    const c = document.getElementById('tasksTable'), f = document.getElementById('filterTasks').value;
    let t = demandas.filter(d => !d.deletedAt && d.pipeline.some(s => s.userId === currentUser.id));
    if (f) t = t.filter(d => d.status.includes(f));
    // Always show tabs, even if empty
    c.innerHTML = renderExecutionTasks(t);
}

function renderBoard() {
    if (!currentDept) return;
    const c = document.getElementById('boardTable'), f = document.getElementById('filterBoard').value, s = document.getElementById('boardSearch').value.toLowerCase();
    let t = demandas.filter(d => !d.deletedAt && d.pipeline.some(st => st.dept === currentDept));
    if (!isGlobalCoordinator()) {
        t = t.filter(d => d.solicitanteId === currentUser.id || (d.pipeline && d.pipeline.some(st => st.userId === currentUser.id)));
    }
    if (f) t = t.filter(d => d.status.includes(f)); if (s) t = t.filter(d => d.nome.toLowerCase().includes(s));
    if (!t.length) { c.innerHTML = '<div class="empty-message">Nenhuma demanda encontrada</div>'; return; }
    c.innerHTML = renderGroupedTable(t); initCollapse();
}

function renderGroupedTable(tasks) {
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
            const avatars = t.pipeline.map(s => USERS[s.userId]).filter(Boolean);
            return `<div class="table-row" onclick="openDetail('${t.id}')">
                        <div class="table-td"><span class="td-title">${t.nome}</span></div>
                        <div class="table-td">Etapa ${t.currentStage + 1}/${t.pipeline.length}</div>
                        <div class="table-td"><span class="priority-badge ${t.prioridade.toLowerCase()}">${t.prioridade}</span></div>
                        <div class="table-td">${formatDate(t.dataConclusao)}</div>
                        <div class="table-td"><div class="td-avatars">${avatars.slice(0, 3).map(u => `<span class="td-avatar">${u.iniciais}</span>`).join('')}</div></div>
                    </div>`;
        }).join('')}
            </div>
        </div>`;
    }).join('');
}

function renderExecutionTasks(tasks) {
    const groups = {};
    tasks.forEach(t => {
        if (!groups[t.status]) groups[t.status] = [];
        groups[t.status].push(t);
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
        html += `<button class="execution-tab ${activeClass}" onclick="switchExecutionTab('${status.key}')" id="tab-btn-${status.key.replace(/\s+/g, '-')}">
                    ${status.label} <span class="execution-tab-count">${count}</span>
                 </button>`;
    });
    html += `</div>`;

    // 2. Render Content Areas
    html += `<div class="execution-body">`;
    statusOrder.forEach((status, index) => {
        const items = groups[status.key] || [];
        const activeClass = index === 0 ? 'active' : '';
        const displayStyle = index === 0 ? 'display:block' : 'display:none';

        html += `<div id="tab-content-${status.key.replace(/\s+/g, '-')}" class="execution-tab-content ${activeClass}">`;

        if (items.length === 0) {
            html += '<div class="empty-message">Nenhuma demanda neste status</div>';
        } else {
            html += `<div class="execution-grid">
                ${items.map(t => {
                const deadline = parseDateLocal(t.dataConclusao);
                const today = new Date();
                const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                let dateClass = '';
                if (daysUntil < 0) dateClass = 'overdue';
                else if (daysUntil <= 3) dateClass = 'soon';

                const avatars = t.pipeline.map(s => USERS[s.userId]).filter(Boolean);
                const currentStage = t.pipeline[t.currentStage];

                return `
                        <div class="execution-card ${t.prioridade.toLowerCase()}" onclick="openDetail('${t.id}')">
                            <div class="execution-card-header">
                                <span class="execution-date ${dateClass}">📅 ${formatDate(t.dataConclusao)}</span>
                            </div>
                            <div class="execution-card-body">
                                <h4 class="execution-title">${t.nome}</h4>
                                <div class="execution-meta">
                                    <span class="meta-display">📁 ${t.tipoProjeto}</span>
                                    <span class="meta-display">🏢 ${currentStage?.dept || '-'}</span>
                                </div>
                            </div>
                            <div class="execution-card-footer">
                                <span class="execution-prio-badge ${t.prioridade.toLowerCase()}">${t.prioridade}</span>
                                <div class="execution-avatars">
                                    ${avatars.slice(0, 3).map(u => `<div class="avatar">${u.iniciais}</div>`).join('')}
                                    ${avatars.length > 3 ? `<div class="avatar">+${avatars.length - 3}</div>` : ''}
                                </div>
                            </div>
                        </div>`;
            }).join('')}
            </div>`;
        }
        html += `</div>`;
    });
    html += `</div>`;

    return html;
}

function switchExecutionTab(key) {
    // Remove active class from all tabs and contents
    document.querySelectorAll('.execution-tab').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.execution-tab-content').forEach(el => el.classList.remove('active'));

    // Add active class to selected
    const safeKey = key.replace(/\s+/g, '-');
    document.getElementById(`tab-btn-${safeKey}`)?.classList.add('active');
    document.getElementById(`tab-content-${safeKey}`)?.classList.add('active');
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
        // Suporte para usuários com múltiplos departamentos (arrays) 
        // ou strings separadas por vírgula no Firestore
        let userDepts = [];
        if (Array.isArray(u.dept)) {
            userDepts = u.dept;
        } else if (typeof u.dept === 'string') {
            userDepts = u.dept.split(',').map(d => d.trim());
        } else {
            userDepts = [u.dept];
        }

        userDepts.forEach(d => {
            if (!d) return;
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
    document.getElementById('modalCreate').classList.add('active');
    document.getElementById('formCreate').reset();

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
        const dependsOnDesigner = document.getElementById('cDependeDesigner').checked;

        for (const respId of selectedResponsaveis) {
            let pipeline = [];
            
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
                pipeline.push({
                    dept: 'Designer',
                    userId: respId,
                    status: 'A fazer'
                });

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
                else if (tipoProjeto === 'Design + Vídeo') {
                    targetDept = 'Designer'; // Starts with design
                }

                pipeline.push({
                    dept: targetDept,
                    userId: respId,
                    status: 'A fazer'
                });

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
                nome,
                solicitanteId,
                responsavelId: respId,
                tipoProjeto: (dependsOnDesigner) ? 'Design + Vídeo' : tipoProjeto, // Override type if sequential
                subType,
                prioridade,
                dataSolicitacao,
                dataConclusao,
                titulo: titulo || nome,
                detalhes: descricao, // Use 'descricao' here
                briefing,
                orientacoes,
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

            demandas.push(task);
            if (task.pipeline[0]?.userId) {
                notifyUser(task.pipeline[0].userId, '🚀', `Nova demanda: ${task.nome}`);
            }
        } // FIM DO LOOP

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
        const u = USERS[s.userId], isCurr = i === t.currentStage && t.status !== 'Aprovado', isDone = i < t.currentStage || t.status === 'Aprovado';
        const timeInfo = s.timeSpent ? `<span class="pipeline-time">⏱️ ${s.timeSpent}</span> ` : (s.startedAt && isCurr ? ` <span class="pipeline-time running">⏳ Em andamento...</span> ` : '');
        return `<div class="pipeline-stage ${isCurr ? 'current' : isDone ? 'completed' : ''}"><span class="pipeline-stage-num">${i + 1}</span><div class="pipeline-stage-info"><span class="pipeline-stage-dept">${s.dept}</span> <span class="pipeline-stage-user">${u?.nome || '?'}</span>${timeInfo}</div><span class="pipeline-stage-status">${isDone ? ' ✓ Concluída' : isCurr ? s.status : 'A fazer'}</span></div> `;
    }).join('');

    // Comments HTML
    const comments = t.comments || [];
    const commentsHtml = comments.length ? comments.map(c => {
        const u = USERS[c.userId] || { iniciais: '?', nome: 'Desconhecido' };
        return `<div class="comment-item"><div class="comment-avatar">${u.iniciais}</div><div class="comment-body"><div class="comment-header"><span class="comment-author">${u.nome}</span><span class="comment-date">${formatDateFull(c.date)}</span></div><p class="comment-text">${c.text}</p></div></div> `;
    }).join('') : '<div class="empty-comments">Nenhum comentário ainda</div>';

    // Attachments HTML
    const attachments = t.attachments || [];
    const attachmentsHtml = attachments.length ? attachments.map((a, i) => {
        const icon = a.type === 'image' ? '🖼️' : a.type === 'pdf' ? '📄' : '📎';
        return `<div class="attachment-item" onclick="event.stopPropagation()"><div class="attachment-icon">${icon}</div><div class="attachment-name">${a.name}</div></div> `;
    }).join('') : '<div style="display: flex; justify-content: center; align-items: center; width: 100%; padding: 20px; text-align: center; color: var(--text-muted); font-style: italic;">Nenhum anexo ainda</div>';

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
        <div class="detail-section"><h4>🔄 Pipeline</h4><div class="pipeline-display">${pipeHtml}</div></div>

        ${t.status === 'Alteração' && t.feedback && t.feedback.length > 0 ? `
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
            <button class="detail-tab" onclick="switchDetailTab('attachments')">📎 Anexos (${attachments.length})</button>
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
    const isExecutorOnTask = t.pipeline.some(s => s.userId === currentUser.id) && t.pipeline[t.currentStage]?.userId === currentUser.id;

    // Execution buttons only for the actual executor on the pipeline (or coordinator testing)
    if ((currentUser.role === 'executor' && isExecutorOnTask) || (currentUser.role === 'coordinator')) {
        if (status !== 'Aprovado') {
            const deleteBtn = canDelete ? `<button class="btn-delete" onclick="deleteTask('${id}')">Excluir</button>` : '';
            if (status === 'A fazer') footer = `${deleteBtn}<button class="btn-cancel" onclick="closeModal('modalDetail')">Fechar</button> <button class="btn-primary" onclick="startExecution('${id}')">Iniciar Demanda</button>`;
            else if (status === 'Fazendo') footer = `${deleteBtn}<button class="btn-cancel" onclick="closeModal('modalDetail')">Fechar</button> <button class="btn-success" onclick="submitForReview('${id}')">Encerrar Demanda</button>`;
            else if (status === 'Alteração') footer = `${deleteBtn}<button class="btn-cancel" onclick="closeModal('modalDetail')">Fechar</button> <button class="btn-secondary" onclick="startExecution('${id}')">Reiniciar Demanda</button> <button class="btn-success" onclick="submitCorrection('${id}')">Reenviar para Aprovação</button>`;
            else if (status === 'Para aprovação') footer = `${deleteBtn}<button class="btn-cancel" onclick="closeModal('modalDetail')">Aguardando aprovação...</button>`;
            else footer = `${deleteBtn}<button class="btn-cancel" onclick="closeModal('modalDetail')">Fechar</button>`;
        } else {
            footer = canDelete ? `<button class="btn-delete" onclick="deleteTask('${id}')">Excluir</button><button class="btn-cancel" onclick="closeModal('modalDetail')">Fechar</button>` : `<button class="btn-cancel" onclick="closeModal('modalDetail')">Fechar</button>`;
        }
    } else if (canDelete) {
        // Social Media can delete and edit tasks
        const editBtn = `<button class="btn-edit" onclick="openEditModal('${id}')">✏️ Editar</button>`;
        footer = `${editBtn}<button class="btn-delete" onclick="deleteTask('${id}')">Excluir</button><button class="btn-cancel" onclick="closeModal('modalDetail')">Fechar</button>`;
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
function handleFileUpload(taskId, input) {
    event?.stopPropagation();
    const task = demandas.find(d => d.id === taskId);
    if (!task) return;
    if (!task.attachments) task.attachments = [];

    const files = input.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Determine file type
        let type = 'doc';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type === 'application/pdf') type = 'pdf';
        else if (file.type.startsWith('video/')) type = 'video';

        task.attachments.push({
            name: file.name,
            type: type,
            size: (file.size / 1024).toFixed(1) + ' KB',
            date: new Date().toISOString(),
            uploadedBy: currentUser.nome
        });
    }

    saveData();
    input.value = ''; // Reset input
    openDetail(taskId);
    toast(`${files.length} arquivo(s) anexado(s)`, 'success');
}

function startExecution(id) {
    const t = demandas.find(d => d.id === id);
    if (!t) return;
    const stage = t.pipeline[t.currentStage];

    // Only set startedAt if not already set (to continue timer from previous session)
    if (!stage.startedAt) {
        stage.startedAt = new Date().toISOString();
    }

    // Auto-start Timer
    if (!stage.timerState) stage.timerState = { running: false, accumulated: 0, lastStart: null };
    if (!stage.timerState.running) {
        stage.timerState.running = true;
        stage.timerState.lastStart = new Date().toISOString();
    }

    stage.status = 'Fazendo';
    t.status = 'Fazendo';
    t.lastStatusChange = new Date().toISOString();
    addHistory(id, 'execution', 'Iniciou execução da etapa ' + stage.dept);

    // Notify the solicitante that execution started
    const executor = currentUser;
    notifySolicitante(t, '▶️', `${executor.nome} iniciou: ${t.nome}`);

    saveData();
    closeModal('modalDetail');
    toast('Execução iniciada! Timer ativado.', 'success');
    refresh();
}

function submitForReview(id) {
    const t = demandas.find(d => d.id === id);
    if (!t) return;

    // Calculate time spent
    const stage = t.pipeline[t.currentStage];
    if (stage.startedAt) {
        const startTime = new Date(stage.startedAt);
        const endTime = new Date();
        const diffMs = endTime - startTime;
        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        stage.timeSpent = `${hours}h ${mins} m`;
        stage.endedAt = endTime.toISOString();
        addHistory(id, 'timer', `Tempo de execução: ${stage.timeSpent} `);
    }

    stage.status = 'Para aprovação';
    t.status = 'Para aprovação';

    // Notify the solicitante that the task is ready for review
    notifySolicitante(t, '👀', `Pronto para revisão: ${t.nome} - ${currentUser.nome} finalizou`);

    saveData();
    closeModal('modalDetail');
    toast('Enviado para revisão! Tempo registrado.', 'success');
    refresh();
}

function submitCorrection(id) {
    const t = demandas.find(d => d.id === id);
    if (!t) return;

    t.pipeline[t.currentStage].status = 'Para aprovação';
    t.status = 'Para aprovação';
    t.lastStatusChange = new Date().toISOString();

    addHistory(id, 'action', 'Correção enviada para revisão');

    // Notify the solicitante that task is corrected
    notifySolicitante(t, '👀', `Correção enviada: ${t.nome} - ${currentUser.nome}`);

    saveData();
    closeModal('modalDetail');
    toast('Correção enviada!', 'success');
    refresh();
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
function deleteTask(id) { if (!confirm('Excluir?')) return; demandas = demandas.filter(d => d.id !== id); saveData(); closeModal('modalDetail'); toast('Demanda excluída', 'info'); refresh(); }

function openReviewModal(id) {
    event?.stopPropagation();
    const t = demandas.find(d => d.id === id); if (!t) return;
    currentTaskId = id;
    const s = t.pipeline[t.currentStage], u = USERS[s.userId];
    document.getElementById('reviewInfo').innerHTML = `<div class="detail-item full" style="margin-bottom:16px;"><label>Demanda</label><span><strong>${t.id}</strong> - ${t.nome}</span></div> <div class="detail-grid"><div class="detail-item"><label>Etapa</label><span>${s.dept}</span></div><div class="detail-item"><label>Responsável</label><span>${u?.nome || '?'}</span></div></div>`;
    document.getElementById('reviewFeedback').value = '';
    document.getElementById('modalReview').classList.add('active');
}

// Open edit modal for Social Media
function openEditModal(id) {
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
            stage.userId = select.value;
            if (oldUserId !== select.value) {
                addHistory(id, 'reassign', `${stage.dept}: ${USERS[oldUserId]?.nome || '?'} → ${USERS[select.value]?.nome || '?'} (por ${currentUser.nome})`);
            }
        }
    });

    addHistory(id, 'edit', `Demanda editada por ${currentUser.nome}`);

    saveData();
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

    // Update status — retorna automaticamente para 'Fazendo' quando alteracao e solicitada
    t.pipeline[t.currentStage].status = 'Fazendo';
    t.pipeline[t.currentStage].startedAt = new Date().toISOString(); // Reinicia timer da etapa
    t.status = 'Fazendo';
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
function formatDate(d) {
    if (!d) return '-'; const dt = new Date(d); return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;
}
function formatDateFull(d) { if (!d) return '-'; const dt = new Date(d); return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`; }
function toast(msg, type = 'info') { const a = document.getElementById('toastArea'), icons = { success: '✓', error: '✗', info: 'ℹ' }, t = document.createElement('div'); t.className = `toast ${type}`; t.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`; a.appendChild(t); setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3500); }
function refresh() {
    updateMinhaArea(); // Always update dashboard stats
    updateBadges(); // Always update sidebar badges

    // Intelligent refresh based on current view
    if (currentView === 'board' && currentDept) renderBoard();
    else if (currentView === 'minha-agenda') renderAgenda();
    else if (currentView === 'kanban') renderKanban();
    else if (currentView === 'quadro-geral') renderQuadroGeral();
    else if (currentView === 'timeline') renderTimeline();
    else if (currentView === 'analytics') renderAnalytics();
    else if (currentView === 'requests') renderRequests();
    else if (currentView === 'review') renderReview();
    else if (currentView === 'tasks') renderTasks();
}

function generateSampleData() {
    const initialized = localStorage.getItem('sgta-data-initialized');
    if (initialized) return; // Never regenerate if already initialized once
    localStorage.setItem('sgta-data-initialized', 'true');
    if (demandas.length > 0) return;
    const samples = [
        { nome: '[Evento] Bazar de Páscoa 2026', tipoProjeto: 'Design + Vídeo', prioridade: 'Alta', pipeline: [{ dept: 'Designer', userId: 'ana-dg', status: 'Aprovado' }, { dept: 'Videomaker', userId: 'pedro-vm', status: 'Fazendo' }], currentStage: 1, status: 'Fazendo', solicitanteId: 'julia-sm', briefing: 'Materiais para divulgação do Bazar.' },
        { nome: '[Missa] Desatadora dos Nós', tipoProjeto: 'Design', prioridade: 'Urgente', pipeline: [{ dept: 'Designer', userId: 'lucas-dg', status: 'Para aprovação' }], currentStage: 0, status: 'Para aprovação', solicitanteId: 'julia-sm', briefing: 'Arte para missa especial.' },
        { nome: '[Produto] Livro de Orações', tipoProjeto: 'Design', prioridade: 'Normal', pipeline: [{ dept: 'Designer', userId: 'ana-dg', status: 'A fazer' }], currentStage: 0, status: 'A fazer', solicitanteId: 'julia-sm', briefing: 'Divulgação do livro.' },
        { nome: '[Campanha] Dízimo Mensal', tipoProjeto: 'Vídeo', prioridade: 'Normal', pipeline: [{ dept: 'Videomaker', userId: 'maria-vm', status: 'Aprovado' }], currentStage: 0, status: 'Aprovado', solicitanteId: 'julia-sm', briefing: 'Vídeo incentivando dízimo.' },
        { nome: '[Evento] Retiro de Carnaval', tipoProjeto: 'Design', prioridade: 'Alta', pipeline: [{ dept: 'Designer', userId: 'lucas-dg', status: 'A fazer' }], currentStage: 0, status: 'A fazer', solicitanteId: 'julia-sm', briefing: 'Artes para retiro.' },
        { nome: '[Missa] Cinzas', tipoProjeto: 'Design + Vídeo', prioridade: 'Urgente', pipeline: [{ dept: 'Designer', userId: 'ana-dg', status: 'Fazendo' }, { dept: 'Videomaker', userId: 'pedro-vm', status: 'A fazer' }], currentStage: 0, status: 'Fazendo', solicitanteId: 'carlos-sm', briefing: 'Materiais Quarta de Cinzas.' }
    ];
    samples.forEach((s, i) => { const ds = new Date(); ds.setDate(ds.getDate() - i * 2); const dc = new Date(); dc.setDate(dc.getDate() + (i + 1) * 3); demandas.push({ id: `WF-${String(nextId++).padStart(4, '0')}`, ...s, titulo: s.nome, dataSolicitacao: ds.toISOString().split('T')[0], dataConclusao: dc.toISOString().split('T')[0], dataCriacao: ds.toISOString(), orientacoes: '', referencias: '', textos: '', feedback: [], subtasks: [], history: [] }); });
    saveData();
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
// TIMER
// =============================================
let timerInterval = null;
let timerSeconds = 0;
let timerTaskId = null;

function toggleTimer() {
    if (timerInterval) {
        stopTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    if (timerInterval) return;
    timerTaskId = currentTaskId;
    document.getElementById('headerTimer').classList.add('running');
    timerInterval = setInterval(() => {
        timerSeconds++;
        updateTimerDisplay();
    }, 1000);
    toast('Cronômetro iniciado', 'info');
}

function stopTimer() {
    if (!timerInterval) return;
    clearInterval(timerInterval);
    timerInterval = null;
    document.getElementById('headerTimer').classList.remove('running');

    const sessionHours = Math.floor(timerSeconds / 3600);
    const sessionMinutes = Math.floor((timerSeconds % 3600) / 60);
    const sessionSecs = timerSeconds % 60;
    const timeStr = `${sessionHours}h ${sessionMinutes}m ${sessionSecs}s`;

    toast(`Tempo registrado: ${timeStr}`, 'success');

    // Update structured data
    if (timerTaskId) {
        const task = demandas.find(d => d.id === timerTaskId);
        if (task) {
            const stage = task.pipeline[task.currentStage];

            // Calculate total seconds (existing + new)
            let existingSeconds = 0;
            if (stage.timeSpent) {
                const match = stage.timeSpent.match(/(\d+)h\s*(\d+)\s*m/);
                if (match) {
                    existingSeconds = (parseInt(match[1]) * 3600) + (parseInt(match[2]) * 60);
                }
            }

            const totalSeconds = existingSeconds + timerSeconds;
            const newHours = Math.floor(totalSeconds / 3600);
            const newMins = Math.floor((totalSeconds % 3600) / 60);

            // Save back in valid format
            stage.timeSpent = `${newHours}h ${newMins}m`;

            addHistory(timerTaskId, 'timer', `Tempo registrado: ${timeStr} (Total: ${newHours}h ${newMins}m)`);
            saveData();
        }
    }

    timerSeconds = 0;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const hours = String(Math.floor(timerSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((timerSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(timerSeconds % 60).padStart(2, '0');
    document.getElementById('timerDisplay').textContent = `${hours}:${minutes}:${secs}`;
}

// =============================================
// NOTIFICATIONS
// =============================================
let notifications = [];

function startNotificationsListener() {
    if (!currentUser?.id) return;

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
            <span class="notif-icon">${n.icon}</span>
            <div class="notif-content">
                <span class="notif-text">${n.text}</span>
                <span class="notif-time">${formatDateFull(n.date)}</span>
            </div>
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
        usuarioDestinatarioId: finalTarget
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
                    <div class="history-avatar">${u.iniciais}</div>
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
    const activeDemandas = demandas.filter(d => !d.deletedAt);
    if (currentUser.role === 'coordinator' || currentUser.role === 'social_media' || currentUser.role === 'gestor_equipe') {
        tasksToRender = activeDemandas;
    } else {
        tasksToRender = activeDemandas.filter(d => d.pipeline.some(s => s.userId === currentUser.id));
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
    const period = document.getElementById('analyticsPeriod')?.value || 'month';
    const now = new Date();
    let filterDate;

    switch (period) {
        case 'week': filterDate = new Date(now - 7 * 24 * 60 * 60 * 1000); break;
        case 'month': filterDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case 'quarter': filterDate = new Date(now.getFullYear(), now.getMonth() - 3, 1); break;
        case 'year': filterDate = new Date(now.getFullYear(), 0, 1); break;
        default: filterDate = new Date(0);
    }

    // STRICT FILTER: Analytics only shows own performance (excluding deleted)
    const activeDemandas = demandas.filter(d => !d.deletedAt);

    // Analytics: Participação Ativa, Criação ou Conclusão de Etapas
    let baseTasks = activeDemandas.filter(d =>
        d.solicitanteId === currentUser.id || // Demandas criadas pelo usuário
        (d.pipeline[d.currentStage]?.userId === currentUser.id && d.status !== 'Aprovado') || // Executor ativo da Etapa atual
        d.pipeline.some(s => s.userId === currentUser.id && s.status === 'Aprovado') // Já concluiu etapas nessa demanda
    );

    const filteredTasks = baseTasks.filter(d => new Date(d.dataCriacao) >= filterDate);
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

    // User productivity chart
    const userChart = document.getElementById('chartByUser');
    if (userChart) {
        const userStats = {};
        filteredTasks.forEach(t => {
            t.pipeline?.forEach(s => {
                if (s.userId && s.status === 'Aprovado') {
                    userStats[s.userId] = (userStats[s.userId] || 0) + 1;
                }
            });
        });
        const maxUser = Math.max(...Object.values(userStats), 1);
        userChart.innerHTML = Object.entries(userStats).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([uid, count]) => {
            const user = USERS[uid];
            const pct = (count / maxUser) * 100;
            return `<div class="analytics-bar"><span>${user?.nome || uid}</span><div class="bar-track"><div class="bar-fill user" style="width:${pct}%"></div></div><span>${count}</span></div>`;
        }).join('') || '<div class="empty-message">Sem dados</div>';
    }

    // Time by stage chart
    const timeChart = document.getElementById('chartTimeByStage');
    if (timeChart) {
        const stageTime = { 'Designer': 0, 'Videomaker': 0, 'Suporte': 0, 'Inovação/TI': 0 };
        const stageCount = { 'Designer': 0, 'Videomaker': 0, 'Suporte': 0, 'Inovação/TI': 0 };
        filteredTasks.forEach(t => {
            t.pipeline?.forEach(s => {
                if (s.timeSpent && s.dept) {
                    const match = s.timeSpent.match(/(\d+)h\s*(\d+)\s*m/);
                    if (match) {
                        stageTime[s.dept] = (stageTime[s.dept] || 0) + parseInt(match[1]) * 60 + parseInt(match[2]);
                        stageCount[s.dept] = (stageCount[s.dept] || 0) + 1;
                    }
                }
            });
        });
        const maxTime = Math.max(...Object.values(stageTime), 1);
        timeChart.innerHTML = Object.entries(stageTime).filter(([_, v]) => v > 0).map(([dept, mins]) => {
            const avg = stageCount[dept] ? Math.round(mins / stageCount[dept]) : 0;
            const pct = (mins / maxTime) * 100;
            return `<div class="analytics-bar"><span>${dept}</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%; background:${DEPT_COLORS[dept]}"></div></div><span>${Math.floor(avg / 60)}h ${avg % 60}m</span></div>`;
        }).join('') || '<div class="empty-message">Sem dados de tempo</div>';
    }

    // Trend chart (simple)
    const trendChart = document.getElementById('chartTrend');
    if (trendChart) {
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthTasks = demandas.filter(t => {
                const created = new Date(t.dataCriacao);
                return created.getMonth() === d.getMonth() && created.getFullYear() === d.getFullYear();
            });
            last6Months.push({ month: MONTHS[d.getMonth()].substring(0, 3), count: monthTasks.length });
        }
        const maxMonth = Math.max(...last6Months.map(m => m.count), 1);
        trendChart.innerHTML = `<div class="trend-chart">${last6Months.map(m => `
            <div class="trend-bar">
                <div class="trend-fill" style="height:${(m.count / maxMonth) * 100}%"></div>
                <span class="trend-label">${m.month}</span>
                <span class="trend-value">${m.count}</span>
            </div>
        `).join('')}</div>`;
    }
}

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
    const savedTheme = localStorage.getItem('sgta-theme') || 'monday';
    setTheme(savedTheme);
}

function setTheme(mode) {
    // 1. Set the data-theme attribute on HTML (root) so CSS :root modifiers work
    document.documentElement.setAttribute('data-theme', mode);

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
                // Also notify the current stage executor
                const currentExecutor = t.pipeline[t.currentStage]?.userId;
                if (currentExecutor && currentExecutor !== t.solicitanteId) {
                    addNotification('⚠️', `Sua demanda está parada há ${days} dias: ${t.nome}`, currentExecutor);
                }
                staleCount++;
            }
        } else {
            t.stale = false;
        }
    });

    if (staleCount > 0) {
        saveData();
    }
}

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
    const activeDemandas = demandas.filter(d => !d.deletedAt && d.status !== 'Aprovado');
    const MAX_CAPACITY = 5; // Max reasonable tasks per person

    const userWorkloads = {};

    // Initialize only executor users (exclude coordinators)
    Object.values(USERS).filter(u => u.role === 'executor').forEach(u => {
        userWorkloads[u.id] = {
            user: u,
            tasks: [],
            count: 0
        };
    });

    // Assign tasks to their current executor
    activeDemandas.forEach(t => {
        const currentStage = t.pipeline[t.currentStage];
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

    // Render user cards
    gridEl.innerHTML = workloadEntries.map(w => {
        const deptColor = DEPT_COLORS[w.user.dept] || '#6161ff';
        const fillPct = Math.min((w.count / MAX_CAPACITY) * 100, 100);
        const prioColors = { 'Crítico': '#ef4444', 'Alta': '#f59e0b', 'Normal': '#3b82f6', 'Baixa': '#94a3b8' };

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
                    <div class="workload-avatar" style="background: ${deptColor}">${w.user.iniciais}</div>
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
}

// =============================================
// MURAL DE AVISOS (Announcements)
// =============================================
let avisos = JSON.parse(localStorage.getItem('sgta-avisos')) || [
    { id: 1700000000001, titulo: 'Bem-vindo ao Novo Mural!', texto: 'Este é o canal oficial de comunicados da coordenação.', autorId: 'armando-coord', data: new Date().toISOString(), prioridade: 'normal' }
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
                        <div class="mural-avatar">${author.iniciais}</div>
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
    if (!ms) return '00:00';
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function toggleTimer(taskId) {
    const t = demandas.find(d => d.id === taskId);
    if (!t) return;

    // Ensure structure exists
    if (!t.pipeline[t.currentStage].timerState) {
        t.pipeline[t.currentStage].timerState = { running: false, accumulated: 0, lastStart: null };
    }

    const state = t.pipeline[t.currentStage].timerState;
    const now = new Date().toISOString();

    if (state.running) {
        // STOP
        const session = new Date() - new Date(state.lastStart);
        state.accumulated = (state.accumulated || 0) + session;
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

        // Auto-change status to "Fazendo" if "A fazer"
        if (t.status === 'A fazer') {
            t.status = 'Fazendo';
            t.pipeline[t.currentStage].status = 'Fazendo';
        }

        toast('Timer iniciado! 🔴', 'success');
    }

    saveData(t);
    renderKanban();
}

// Global Timer Update Loop
setInterval(() => {
    document.querySelectorAll('.timer-display.running').forEach(el => {
        const start = el.dataset.start;
        const accumulated = parseInt(el.dataset.accumulated || '0');

        if (start) {
            const now = new Date();
            const lastStart = new Date(start);
            const currentSession = now - lastStart;
            const totalMs = accumulated + currentSession;

            // Format HH:mm:ss
            const hours = Math.floor(totalMs / (1000 * 60 * 60));
            const mins = Math.floor((totalMs / (1000 * 60)) % 60);
            const secs = Math.floor((totalMs / 1000) % 60);
            const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

            // Update only if text changed nicely, preserving the badge
            el.innerHTML = `<span class="timer-badge-active"></span>${timeStr}`;
        }
    });
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
