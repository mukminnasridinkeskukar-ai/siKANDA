// ==================== SIKANDA - GitHub Pages Demo Version ====================
// This version works without Google Apps Script backend
// Uses local JSON data for demonstration purposes

// ==================== CONFIGURATION ====================
const CONFIG = {
  API_URL: '', // Not needed for local demo
  ITEMS_PER_PAGE: 10,
  CACHE_DURATION: 5 * 60 * 1000
};

// Application State
let state = {
  user: null,
  role: null,
  allData: [],
  filteredData: [],
  currentPage: 1,
  charts: {},
  dashboardCache: null,
  filterOptions: {},
  mockData: null
};

// ==================== UTILITY FUNCTIONS ====================

function showLoader() {
  document.getElementById('loader').classList.add('active');
}

function hideLoader() {
  document.getElementById('loader').classList.remove('active');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    warning: 'fa-exclamation-circle',
    info: 'fa-info-circle'
  };
  
  toast.innerHTML = `<i class="fas ${icons[type]}"></i> ${message}`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  let current = 0;
  const increment = target / 30;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      el.textContent = target;
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(current);
    }
  }, 30);
}

// ==================== DARK MODE ====================

function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  document.getElementById('darkToggle').classList.toggle('active');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
  document.getElementById('darkToggle').classList.add('active');
}

// ==================== MOCK API (Local JSON) ====================

/**
 * Simulate API call using local JSON data
 * @param {string} func - Function name
 * @param {Object} data - Data to send
 * @returns {Promise<Object>} Simulated API response
 */
async function apiCall(func, data = {}) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (!state.mockData) {
    // Load mock data from JSON file
    try {
      const response = await fetch('sdm-data.json');
      state.mockData = await response.json();
    } catch (e) {
      console.error('Failed to load mock data:', e);
      return { success: false, error: 'Failed to load data' };
    }
  }
  
  const mock = state.mockData;
  
  switch (func) {
    case 'test':
      return { success: true, message: 'API works!' };
      
    case 'loginAdmin':
      const user = mock.users.find(u => 
        u.Username === data.username && u.Password === data.password
      );
      if (user) {
        return { 
          success: true, 
          user: { username: user.Username, role: user.Role, unit_kerja: user['Unit Kerja'] },
          message: 'Login successful'
        };
      }
      return { success: false, error: 'Username atau password salah' };
      
    case 'getDashboardData':
      return getDashboardData();
      
    case 'getPublicData':
      return getPublicData(data);
      
    case 'getByNIK':
      const record = mock.data.find(d => d.NIK === data.nik);
      if (record) {
        return { success: true, data: record };
      }
      return { success: false, error: 'Data tidak ditemukan' };
      
    case 'checkNik':
      const exists = mock.data.some(d => d.NIK === data.nik);
      return { success: true, exists };
      
    case 'submitBiodata':
      // Add new record (in memory only)
      mock.data.push({
        ...data,
        'Status_Data': 'pending'
      });
      return { success: true, message: 'Data berhasil disubmit, menunggu verifikasi' };
      
    case 'getAllDataAdmin':
      return { success: true, data: mock.data };
      
    case 'getUsers':
      return { success: true, data: mock.users };
      
    case 'addData':
      mock.data.push({ ...data, 'Status_Data': 'aktif' });
      return { success: true, message: 'Data ditambahkan' };
      
    case 'updateData':
      const idx = mock.data.findIndex(d => d.NIK === data.nik);
      if (idx >= 0) {
        mock.data[idx] = { ...mock.data[idx], ...data };
      }
      return { success: true, message: 'Data diperbarui' };
      
    case 'deleteData':
      mock.data = mock.data.filter(d => d.NIK !== data.nik);
      return { success: true, message: 'Data dihapus' };
      
    case 'getFilterOptions':
      return { 
        success: true, 
        unitKerja: mock.filterOptions.unitKerja,
        kecamatan: mock.filterOptions.kecamatan
      };
      
    default:
      return { success: false, error: 'Unknown action' };
  }
}

// Helper functions for mock data processing
function getDashboardData() {
  const data = state.mockData.data;
  
  // Calculate statistics
  const totalSDM = data.length;
  const activeSDM = data.filter(d => d.Status_Data === 'aktif').length;
  const pns = data.filter(d => d.Status === 'PNS').length;
  const pppk = data.filter(d => d.Status === 'PPPK').length;
  const kontrak = data.filter(d => d.Status === 'Kontrak').length;
  const honor = data.filter(d => d.Status === 'Honorer').length;
  
  // Unit Kerja distribution
  const unitKerja = {};
  data.forEach(d => {
    const unit = d['Unit Kerja'] || 'Unknown';
    unitKerja[unit] = (unitKerja[unit] || 0) + 1;
  });
  
  // Jenis Kelamin distribution
  const laki = data.filter(d => d['Jenis Kelamin'] === 'Laki-laki').length;
  const perempuan = data.filter(d => d['Jenis Kelamin'] === 'Perempuan').length;
  
  // Status distribution
  const status = {};
  data.forEach(d => {
    const s = d.Status || 'Unknown';
    status[s] = (status[s] || 0) + 1;
  });
  
  // Kecamatan distribution
  const kecamatan = {};
  data.forEach(d => {
    const k = d.Kecamatan || 'Unknown';
    kecamatan[k] = (kecamatan[k] || 0) + 1;
  });
  
  return {
    success: true,
    totalSDM,
    activeSDM,
    pns,
    pppk,
    kontrak,
    laki,
    perempuan,
    unitKerja,
    status,
    kecamatan,
    kecamatanList: Object.keys(kecamatan),
    recentData: data.slice(0, 5)
  };
}

function getPublicData(params) {
  let filtered = [...state.mockData.data];
  
  if (params.search) {
    const search = params.search.toLowerCase();
    filtered = filtered.filter(d => 
      (d.Nama && d.Nama.toLowerCase().includes(search)) ||
      (d.Jabatan && d.Jabatan.toLowerCase().includes(search))
    );
  }
  
  if (params.unitkerja) {
    filtered = filtered.filter(d => d['Unit Kerja'] === params.unitkerja);
  }
  
  if (params.kecamatan) {
    filtered = filtered.filter(d => d.Kecamatan === params.kecamatan);
  }
  
  return { success: true, data: filtered };
}

// ==================== AUTH FUNCTIONS ====================

function setSession(user, role) {
  state.user = user;
  state.role = role;
  localStorage.setItem('sdm_user', JSON.stringify(user));
  localStorage.setItem('sdm_role', role);
}

function getSession() {
  const user = localStorage.getItem('sdm_user');
  const role = localStorage.getItem('sdm_role');
  
  if (user && role) {
    state.user = JSON.parse(user);
    state.role = role;
    return true;
  }
  return false;
}

function clearSession() {
  state.user = null;
  state.role = null;
  localStorage.removeItem('sdm_user');
  localStorage.removeItem('sdm_role');
}

// ==================== PAGE NAVIGATION ====================

function showPage(id) {
  document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  
  const titles = {
    dashboard: 'Dashboard',
    'data-sdm-list': 'Data SDM',
    profil: 'Profil',
    'form-biodata': 'Form Biodata',
    laporan: 'Laporan',
    pengaturan: 'Pengaturan',
    'admin-panel': 'Admin Panel'
  };
  document.getElementById('pageTitle').textContent = titles[id] || 'SIKANDA';
  
  document.querySelectorAll('.menu-item,.submenu-item').forEach(i => i.classList.remove('active'));
  document.querySelector(`[data-page="${id}"]`)?.classList.add('active');
  
  if (id === 'dashboard') loadDashboard();
  if (id === 'data-sdm-list') loadPublicData();
  if (id === 'admin-panel' && state.role !== 'Administrator') {
    showToast('Akses ditolak', 'error');
    showPage('dashboard');
    return;
  }
  if (id === 'admin-panel') loadAdminData();
  if (id === 'laporan') loadReportData();
}

function updateUserUI() {
  if (state.user) {
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('logoutItem').style.display = 'flex';
    document.getElementById('adminMenuItem').style.display = state.role === 'Administrator' ? 'flex' : 'none';
    document.getElementById('userName').textContent = state.user.username;
    document.getElementById('userRole').textContent = state.role;
    document.getElementById('userAvatar').textContent = state.user.username.charAt(0).toUpperCase();
  } else {
    document.getElementById('loginBtn').style.display = 'block';
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('logoutItem').style.display = 'none';
    document.getElementById('adminMenuItem').style.display = 'none';
  }
}

function showLogin() {
  document.getElementById('loginPage').classList.add('active');
  document.getElementById('appContainer').classList.remove('active');
}

function showApp() {
  document.getElementById('loginPage').classList.remove('active');
  document.getElementById('appContainer').classList.add('active');
  updateUserUI();
  loadFilterOptions();
  showPage('dashboard');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
}

function openLightbox(src) {
  if (src) {
    document.getElementById('lightboxImg').src = src;
    document.getElementById('lightbox').classList.add('active');
  }
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
}

function openModal(title, content, footer) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = content;
  document.getElementById('modalFooter').innerHTML = footer;
  document.getElementById('modalOverlay').classList.add('active');
}

// ==================== MENU EVENTS ====================

document.querySelectorAll('.menu-item[data-page]').forEach(item => {
  item.addEventListener('click', () => showPage(item.dataset.page));
});

document.querySelectorAll('.submenu-item').forEach(item => {
  item.addEventListener('click', () => {
    showPage(item.dataset.page);
    document.getElementById('submenu-data-sdm').classList.add('show');
  });
});

document.querySelector('[data-toggle="submenu"]')?.addEventListener('click', () => {
  document.getElementById('submenu-data-sdm').classList.toggle('show');
});

document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('active');
});

document.getElementById('sidebarOverlay').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('active');
});

document.querySelector('[data-action="logout"]')?.addEventListener('click', () => {
  clearSession();
  updateUserUI();
  showToast('Logout berhasil', 'success');
  showPage('dashboard');
});

// ==================== LOGIN ====================

document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  showLoader();
  
  const username = document.getElementById('adminUsername').value;
  const password = document.getElementById('adminPassword').value;
  
  const response = await apiCall('loginAdmin', { username, password });
  
  if (response.success) {
    setSession(response.user, response.user.role);
    showApp();
    showToast('Login berhasil (Demo Mode)', 'success');
  } else {
    showToast(response.error, 'error');
  }
  
  hideLoader();
});

// ==================== FILTER OPTIONS ====================

async function loadFilterOptions() {
  const response = await apiCall('getFilterOptions');
  
  if (response.success) {
    state.filterOptions = response;
    
    let options = '<option value="">Semua</option>';
    response.unitKerja?.forEach(u => {
      options += `<option value="${u}">${u}</option>`;
    });
    
    ['filterUnit', 'filterKec', 'formUnit', 'reportUnit'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = options;
    });
    
    options = '<option value="">Semua</option>';
    response.kecamatan?.forEach(k => {
      options += `<option value="${k}">${k}</option>`;
    });
    
    ['filterKec', 'formKec', 'reportKec'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = options;
    });
  }
}

// ==================== DASHBOARD ====================

async function loadDashboard(forceRefresh = false) {
  showLoader();
  
  if (!forceRefresh && state.dashboardCache && (Date.now() - state.dashboardCache.timestamp < CONFIG.CACHE_DURATION)) {
    renderDashboard(state.dashboardCache.data);
    hideLoader();
    return;
  }
  
  const response = await apiCall('getDashboardData', { force: forceRefresh ? 1 : 0 });
  
  if (response.success) {
    state.dashboardCache = { data: response, timestamp: Date.now() };
    renderDashboard(response);
  } else {
    document.getElementById('dashboardError').innerHTML = `
      <div class="error-banner">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Koneksi bermasalah, menampilkan data terakhir</p>
        <button class="btn btn-sm btn-secondary" onclick="loadDashboard(true)">Coba Lagi</button>
      </div>`;
    if (state.dashboardCache) renderDashboard(state.dashboardCache.data);
  }
  
  hideLoader();
}

function renderDashboard(data) {
  animateCounter('totalSdm', data.totalSDM);
  animateCounter('activeSdm', data.activeSDM);
  animateCounter('pnsSdm', data.pns);
  animateCounter('pppkSdm', data.pppk);
  animateCounter('kontrakSdm', data.kontrak);
  animateCounter('kecSdm', data.kecamatanList?.length || 0);
  
  const recentDataHtml = (data.recentData || []).map(d => `
    <tr>
      <td>${d.Nama || '-'}</td>
      <td>${d['Unit Kerja'] || '-'}</td>
      <td>${d.Jabatan || '-'}</td>
      <td><span class="status-badge ${(d.Status || '').toLowerCase()}">${d.Status || '-'}</span></td>
      <td>${d.Kecamatan || '-'}</td>
    </tr>
  `).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--gray-500)">Belum ada data</td></tr>';
  
  document.getElementById('recentTableBody').innerHTML = recentDataHtml;
  createCharts(data);
}

function createCharts(data) {
  const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
  
  Object.values(state.charts || {}).forEach(c => c.destroy());
  
  const ctx1 = document.getElementById('unitChart').getContext('2d');
  state.charts.unit = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: Object.keys(data.unitKerja || {}),
      datasets: [{
        label: 'SDM',
        data: Object.values(data.unitKerja || {}),
        backgroundColor: colors.slice(0, 6),
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      animation: { duration: 1000 },
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
  
  const ctx2 = document.getElementById('jkChart').getContext('2d');
  state.charts.jk = new Chart(ctx2, {
    type: 'doughnut',
    data: {
      labels: ['Laki-laki', 'Perempuan'],
      datasets: [{
        data: [data.laki || 0, data.perempuan || 0],
        backgroundColor: ['#2563eb', '#ec4899']
      }]
    },
    options: {
      responsive: true,
      animation: { duration: 1000 },
      plugins: { legend: { position: 'bottom' } }
    }
  });
  
  const ctx3 = document.getElementById('statusChart').getContext('2d');
  state.charts.status = new Chart(ctx3, {
    type: 'pie',
    data: {
      labels: Object.keys(data.status || {}),
      datasets: [{
        data: Object.values(data.status || {}),
        backgroundColor: colors
      }]
    },
    options: {
      responsive: true,
      animation: { duration: 1000 },
      plugins: { legend: { position: 'bottom' } }
    }
  });
  
  const ctx4 = document.getElementById('kecChart').getContext('2d');
  state.charts.kec = new Chart(ctx4, {
    type: 'bar',
    data: {
      labels: Object.keys(data.kecamatan || {}).slice(0, 10),
      datasets: [{
        label: 'SDM',
        data: Object.values(data.kecamatan || {}).slice(0, 10),
        backgroundColor: '#10b981',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      animation: { duration: 1000 },
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// ==================== PUBLIC DATA ====================

async function loadPublicData() {
  showLoader();
  
  const params = {
    search: document.getElementById('searchInput').value,
    unitkerja: document.getElementById('filterUnit').value,
    kecamatan: document.getElementById('filterKec').value
  };
  
  const response = await apiCall('getPublicData', params);
  
  if (response.success) {
    state.filteredData = response.data;
    state.currentPage = 1;
    renderPublicTable();
  }
  
  hideLoader();
}

function renderPublicTable() {
  const tbody = document.getElementById('sdmTableBody');
  
  if (!state.filteredData.length) {
    tbody.innerHTML = '';
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('pagination').style.display = 'none';
    return;
  }
  
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('pagination').style.display = 'flex';
  
  const start = (state.currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
  const end = start + CONFIG.ITEMS_PER_PAGE;
  const pageData = state.filteredData.slice(start, end);
  
  tbody.innerHTML = pageData.map(d => `
    <tr>
      <td>${d.Nama || '-'}</td>
      <td>${d['Unit Kerja'] || '-'}</td>
      <td>${d['Jenis Kelamin'] || '-'}</td>
      <td>${d.Jabatan || '-'}</td>
      <td><span class="status-badge ${(d.Status || '').toLowerCase()}">${d.Status || '-'}</span></td>
      <td>${d.Kecamatan || '-'}</td>
    </tr>
  `).join('');
  
  document.getElementById('paginationInfo').textContent =
    `Menampilkan ${start + 1}-${Math.min(end, state.filteredData.length)} dari ${state.filteredData.length}`;
  
  const totalPages = Math.ceil(state.filteredData.length / CONFIG.ITEMS_PER_PAGE);
  let buttons = '';
  for (let i = 1; i <= Math.min(totalPages, 5); i++) {
    buttons += `<button class="page-btn ${i === state.currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }
  document.getElementById('paginationBtns').innerHTML = buttons;
}

function goPage(page) {
  state.currentPage = page;
  renderPublicTable();
}

document.getElementById('searchInput').addEventListener('input', debounce(loadPublicData, 500));
document.getElementById('filterUnit').addEventListener('change', loadPublicData);
document.getElementById('filterKec').addEventListener('change', loadPublicData);

// ==================== PROFIL ====================

document.getElementById('profilSearchForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  showLoader();
  
  const nik = document.getElementById('profilNik').value;
  const response = await apiCall('getByNIK', { nik });
  
  if (response.success) {
    document.getElementById('profilSearch').style.display = 'none';
    document.getElementById('profilContent').style.display = 'block';
    
    const d = response.data;
    document.getElementById('profileNama').textContent = d.Nama || '-';
    document.getElementById('profileJabatan').textContent = d.Jabatan || '-';
    document.getElementById('profileNik').textContent = d.NIK || '-';
    document.getElementById('profileJk').textContent = d['Jenis Kelamin'] || '-';
    document.getElementById('profileAgama').textContent = d.Agama || '-';
    document.getElementById('profileUnit').textContent = d['Unit Kerja'] || '-';
    document.getElementById('profileDesa').textContent = d.Desa || '-';
    document.getElementById('profileKec').textContent = d.Kecamatan || '-';
    
    const avatar = document.getElementById('profileAvatar');
    if (d.Foto) {
      avatar.innerHTML = `<img src="${d.Foto}">`;
      avatar.onclick = () => openLightbox(d.Foto);
    } else {
      avatar.innerHTML = '<i class="fas fa-user"></i>';
    }
    
    showToast('Profil ditemukan (Demo)', 'success');
  } else {
    showToast(response.error || 'Data tidak ditemukan', 'error');
  }
  
  hideLoader();
});

// ==================== FORM BIODATA ====================

document.getElementById('biodataForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  showLoader();
  
  const nik = document.getElementById('formNik').value;
  
  const checkResponse = await apiCall('checkNik', { nik });
  if (checkResponse.exists) {
    showToast('NIK sudah terdaftar', 'warning');
    hideLoader();
    return;
  }
  
  const formData = {
    nik: document.getElementById('formNik').value,
    nip: document.getElementById('formNip').value,
    nama: document.getElementById('formNama').value,
    jk: document.getElementById('formJk').value,
    agama: document.getElementById('formAgama').value,
    unit_kerja: document.getElementById('formUnit').value,
    jabatan: document.getElementById('formJabatan').value,
    status: document.getElementById('formStatus').value,
    desa: document.getElementById('formDesa').value,
    kecamatan: document.getElementById('formKec').value,
    foto: document.getElementById('formFoto').value
  };
  
  const response = await apiCall('submitBiodata', formData);
  
  if (response.success) {
    showToast(response.message, 'success');
    document.getElementById('biodataForm').reset();
  } else {
    showToast(response.error, 'error');
  }
  
  hideLoader();
});

// ==================== ADMIN ====================

async function loadAdminData() {
  if (state.role !== 'Administrator') return;
  
  showLoader();
  
  const response = await apiCall('getAllDataAdmin', {});
  
  if (response.success) {
    state.allData = response.data;
    renderAdminTable();
  }
  
  const usersResponse = await apiCall('getUsers');
  if (usersResponse.success) {
    renderUsersTable(usersResponse.data);
  }
  
  hideLoader();
}

function renderAdminTable() {
  const tbody = document.getElementById('adminTableBody');
  
  tbody.innerHTML = state.allData.map(d => `
    <tr>
      <td>${d.NIK || '-'}</td>
      <td>${d.Nama || '-'}</td>
      <td>${d['Unit Kerja'] || '-'}</td>
      <td>${d.Jabatan || '-'}</td>
      <td><span class="status-badge ${(d.Status || '').toLowerCase()}">${d.Status || '-'}</span></td>
      <td><span class="status-badge ${d.Status_Data}">${d.Status_Data || 'aktif'}</span></td>
      <td>
        <div class="action-btns">
          <button class="action-btn edit" onclick="editData('${d.NIK}')"><i class="fas fa-edit"></i></button>
          <button class="action-btn delete" onclick="deleteData('${d.NIK}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderUsersTable(users) {
  const tbody = document.getElementById('usersTableBody');
  
  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${u.Username}</td>
      <td>${u.Role}</td>
      <td>
        <button class="action-btn delete" onclick="deleteUser('${u.Username}')">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function editData(nik) {
  const d = state.allData.find(x => x.NIK === nik);
  if (!d) return;
  
  let unitOptions = state.filterOptions.unitKerja?.map(u =>
    `<option value="${u}" ${u === d['Unit Kerja'] ? 'selected' : ''}>${u}</option>`
  ).join('') || '';
  
  let kecOptions = state.filterOptions.kecamatan?.map(k =>
    `<option value="${k}" ${k === d.Kecamatan ? 'selected' : ''}>${k}</option>`
  ).join('') || '';
  
  const content = `
    <form id="editForm">
      <input type="hidden" value="${nik}">
      <div class="form-group">
        <label>Nama</label>
        <input id="eNama" value="${d.Nama || ''}">
      </div>
      <div class="form-group">
        <label>Unit Kerja</label>
        <select id="eUnit">${unitOptions}</select>
      </div>
      <div class="form-group">
        <label>Jabatan</label>
        <input id="eJabatan" value="${d.Jabatan || ''}">
      </div>
      <div class="form-group">
        <label>Status Data</label>
        <select id="eStatusData">
          <option value="aktif" ${d.Status_Data === 'aktif' ? 'selected' : ''}>Aktif</option>
          <option value="pending" ${d.Status_Data === 'pending' ? 'selected' : ''}>Pending</option>
        </select>
      </div>
    </form>
  `;
  
  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn-success" onclick="saveEdit('${nik}')">Simpan</button>
  `;
  
  openModal('Edit Data', content, footer);
}

async function saveEdit(nik) {
  showLoader();
  
  const data = {
    nik: nik,
    nama: document.getElementById('eNama').value,
    unit_kerja: document.getElementById('eUnit').value,
    jabatan: document.getElementById('eJabatan').value,
    status_data: document.getElementById('eStatusData').value
  };
  
  const response = await apiCall('updateData', data);
  
  if (response.success) {
    showToast('Data diperbarui', 'success');
    closeModal();
    loadAdminData();
    state.dashboardCache = null;
  } else {
    showToast(response.error, 'error');
  }
  
  hideLoader();
}

async function deleteData(nik) {
  if (!confirm('Hapus data ini?')) return;
  
  showLoader();
  
  const response = await apiCall('deleteData', { nik });
  
  if (response.success) {
    showToast('Dihapus', 'success');
    loadAdminData();
    state.dashboardCache = null;
  } else {
    showToast(response.error, 'error');
  }
  
  hideLoader();
}

async function deleteUser(username) {
  if (!confirm(`Hapus user ${username}?`)) return;
  showToast('User tidak dapat dihapus (Demo)', 'warning');
}

document.getElementById('addDataBtn').addEventListener('click', () => {
  let unitOptions = state.filterOptions.unitKerja?.map(u =>
    `<option value="${u}">${u}</option>`
  ).join('') || '';
  
  let kecOptions = state.filterOptions.kecamatan?.map(k =>
    `<option value="${k}">${k}</option>`
  ).join('') || '';
  
  const content = `
    <form id="addForm">
      <div class="form-group">
        <label>NIK</label>
        <input id="aNik" required>
      </div>
      <div class="form-group">
        <label>Nama</label>
        <input id="aNama" required>
      </div>
      <div class="form-group">
        <label>Unit Kerja</label>
        <select id="aUnit" required>${unitOptions}</select>
      </div>
      <div class="form-group">
        <label>Jabatan</label>
        <input id="aJabatan" required>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select id="aStatus">
          <option>PNS</option>
          <option>PPPK</option>
          <option>Kontrak</option>
          <option>Honorer</option>
        </select>
      </div>
      <div class="form-group">
        <label>Kecamatan</label>
        <select id="aKec">${kecOptions}</select>
      </div>
    </form>
  `;
  
  const footer = `
    <button class="btn btn-secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn-success" onclick="saveAdd()">Simpan</button>
  `;
  
  openModal('Tambah Data', content, footer);
});

async function saveAdd() {
  showLoader();
  
  const data = {
    nik: document.getElementById('aNik').value,
    nama: document.getElementById('aNama').value,
    unit_kerja: document.getElementById('aUnit').value,
    jabatan: document.getElementById('aJabatan').value,
    status: document.getElementById('aStatus').value,
    kecamatan: document.getElementById('aKec').value,
    status_data: 'aktif'
  };
  
  const response = await apiCall('addData', data);
  
  if (response.success) {
    showToast('Ditambahkan', 'success');
    closeModal();
    loadAdminData();
    state.dashboardCache = null;
  } else {
    showToast(response.error, 'error');
  }
  
  hideLoader();
}

// ==================== LAPORAN ====================

async function loadReportData() {
  showLoader();
  
  const params = {
    unitkerja: document.getElementById('reportUnit').value,
    kecamatan: document.getElementById('reportKec').value
  };
  
  const response = await apiCall('getPublicData', params);
  
  if (response.success) {
    const html = response.data.map(record => `
      <tr>
        <td>${record.Nama || '-'}</td>
        <td>${record['Unit Kerja'] || '-'}</td>
        <td>${record.Jabatan || '-'}</td>
        <td>${record['Jenis Kelamin'] || '-'}</td>
        <td>${record.Status || '-'}</td>
        <td>${record.Kecamatan || '-'}</td>
      </tr>
    `).join('');
    
    document.getElementById('reportTableBody').innerHTML = html;
  }
  
  hideLoader();
}

function exportData(type) {
  let csv = 'Nama,Unit Kerja,Jabatan,Jenis Kelamin,Status,Kecamatan\n';
  
  document.querySelectorAll('#reportTableBody tr').forEach(tr => {
    csv += Array.from(tr.querySelectorAll('td')).map(td => `"${td.textContent}"`).join(',') + '\n';
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'laporan_sdm.csv';
  link.click();
  showToast('Data diexport ke CSV', 'success');
}

// ==================== PENGATURAN ====================

function saveSettings() {
  const name = document.getElementById('instansiName').value;
  localStorage.setItem('instansiName', name);
  showToast('Pengaturan disimpan', 'success');
}

if (localStorage.getItem('instansiName')) {
  document.getElementById('instansiName').value = localStorage.getItem('instansiName');
}

// ==================== INIT ====================

// Check if we're using GitHub demo mode
const isGitHubDemo = true; // Set to false to use Google Apps Script backend

if (getSession()) {
  showApp();
}

// Show demo notice
console.log('%c SIKANDA GitHub Demo Mode ', 'background: #2563eb; color: white; padding: 5px 10px; border-radius: 3px;');
console.log('%cGunakan: admin / admin123 untuk login', 'color: #10b981;');
