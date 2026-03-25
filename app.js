// ==================== SIKANDA - Sistem Informasi Kepegawaian dan Data SDM Kesehatan ====================
// JavaScript Application File

// ==================== CONFIGURATION ====================
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbxxmqgIYexXSbprKPswlSIKpZguaDbqXitFFmL1oirZ8IwunsL2C3Vlu2L1bm36YHdd/exec',
  ITEMS_PER_PAGE: 10,
  CACHE_DURATION: 5 * 60 * 1000 // 5 minutes
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
  filterOptions: {}
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Show loading spinner
 */
function showLoader() {
  document.getElementById('loader').classList.add('active');
}

/**
 * Hide loading spinner
 */
function hideLoader() {
  document.getElementById('loader').classList.remove('active');
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast: 'success', 'error', 'warning', 'info'
 */
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

/**
 * Debounce function for search input
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Animate counter from 0 to target value
 * @param {string} id - Element ID
 * @param {number} target - Target number
 */
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

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  document.getElementById('darkToggle').classList.toggle('active');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// Load dark mode preference on init
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
  document.getElementById('darkToggle').classList.add('active');
}

// ==================== API FUNCTIONS ====================

/**
 * Make API call to Google Apps Script backend
 * @param {string} func - Function name to call
 * @param {Object} data - Data to send
 * @returns {Promise<Object>} API response
 */
async function apiCall(func, data = {}) {
  try {
    let qs = `action=${encodeURIComponent(func)}`;
    if (Object.keys(data).length) {
      qs += `&data=${encodeURIComponent(JSON.stringify(data))}`;
    }
    
    const response = await fetch(`${CONFIG.API_URL}?${qs}`);
    const text = await response.text();
    
    if (text.startsWith('<')) {
      throw new Error('Server error');
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, error: error.message };
  }
}

// ==================== AUTH FUNCTIONS ====================

/**
 * Set user session
 * @param {Object} user - User object
 * @param {string} role - User role
 */
function setSession(user, role) {
  state.user = user;
  state.role = role;
  localStorage.setItem('sdm_user', JSON.stringify(user));
  localStorage.setItem('sdm_role', role);
}

/**
 * Get user session
 * @returns {boolean} Has valid session
 */
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

/**
 * Clear user session
 */
function clearSession() {
  state.user = null;
  state.role = null;
  localStorage.removeItem('sdm_user');
  localStorage.removeItem('sdm_role');
}

// ==================== PAGE NAVIGATION ====================

/**
 * Show specific page
 * @param {string} id - Page ID
 */
function showPage(id) {
  // Hide all pages
  document.querySelectorAll('.page-section').forEach(page => page.classList.remove('active'));
  
  // Show target page
  document.getElementById(id).classList.add('active');
  
  // Update page title
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
  
  // Update menu active state
  document.querySelectorAll('.menu-item,.submenu-item').forEach(item => item.classList.remove('active'));
  document.querySelector(`[data-page="${id}"]`)?.classList.add('active');
  
  // Load page-specific data
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

/**
 * Update user interface based on login status
 */
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

/**
 * Show login page
 */
function showLogin() {
  document.getElementById('loginPage').classList.add('active');
  document.getElementById('appContainer').classList.remove('active');
}

/**
 * Show main application
 */
function showApp() {
  document.getElementById('loginPage').classList.remove('active');
  document.getElementById('appContainer').classList.add('active');
  updateUserUI();
  loadFilterOptions();
  showPage('dashboard');
}

/**
 * Close modal
 */
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
}

/**
 * Open lightbox with image
 * @param {string} src - Image source URL
 */
function openLightbox(src) {
  if (src) {
    document.getElementById('lightboxImg').src = src;
    document.getElementById('lightbox').classList.add('active');
  }
}

/**
 * Close lightbox
 */
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
}

/**
 * Open modal with custom content
 * @param {string} title - Modal title
 * @param {string} content - Modal body content
 * @param {string} footer - Modal footer content
 */
function openModal(title, content, footer) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = content;
  document.getElementById('modalFooter').innerHTML = footer;
  document.getElementById('modalOverlay').classList.add('active');
}

// ==================== MENU EVENT HANDLERS ====================

// Menu item clicks
document.querySelectorAll('.menu-item[data-page]').forEach(item => {
  item.addEventListener('click', () => showPage(item.dataset.page));
});

// Submenu item clicks
document.querySelectorAll('.submenu-item').forEach(item => {
  item.addEventListener('click', () => {
    showPage(item.dataset.page);
    document.getElementById('submenu-data-sdm').classList.add('show');
  });
});

// Submenu toggle
document.querySelector('[data-toggle="submenu"]')?.addEventListener('click', () => {
  document.getElementById('submenu-data-sdm').classList.toggle('show');
});

// Mobile menu toggle
document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('active');
});

// Sidebar overlay click (close mobile menu)
document.getElementById('sidebarOverlay').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('active');
});

// Logout handler
document.querySelector('[data-action="logout"]')?.addEventListener('click', () => {
  clearSession();
  updateUserUI();
  showToast('Logout berhasil', 'success');
  showPage('dashboard');
});

// ==================== LOGIN HANDLER ====================

document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  showLoader();
  
  const username = document.getElementById('adminUsername').value;
  const password = document.getElementById('adminPassword').value;
  
  const response = await apiCall('loginAdmin', { username, password });
  
  if (response.success) {
    setSession(response.user, response.user.role);
    showApp();
    showToast('Login berhasil', 'success');
  } else {
    showToast(response.error, 'error');
  }
  
  hideLoader();
});

// ==================== FILTER OPTIONS ====================

/**
 * Load filter options (unit kerja, kecamatan)
 */
async function loadFilterOptions() {
  const response = await apiCall('getFilterOptions');
  
  if (response.success) {
    state.filterOptions = response;
    
    // Build unit kerja options
    let options = '<option value="">Semua</option>';
    response.unitKerja?.forEach(unit => {
      options += `<option value="${unit}">${unit}</option>`;
    });
    
    // Apply to all unit select elements
    ['filterUnit', 'filterKec', 'formUnit', 'reportUnit'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = options;
    });
    
    // Build kecamatan options
    options = '<option value="">Semua</option>';
    response.kecamatan?.forEach(kec => {
      options += `<option value="${kec}">${kec}</option>`;
    });
    
    // Apply to all kecamatan select elements
    ['filterKec', 'formKec', 'reportKec'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = options;
    });
  }
}

// ==================== DASHBOARD ====================

/**
 * Load dashboard data
 * @param {boolean} forceRefresh - Force refresh from API
 */
async function loadDashboard(forceRefresh = false) {
  showLoader();
  
  // Check cache first
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
    // Show error with last cached data
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

/**
 * Render dashboard data
 * @param {Object} data - Dashboard data
 */
function renderDashboard(data) {
  // Animated counters
  animateCounter('totalSdm', data.totalSDM);
  animateCounter('activeSdm', data.activeSDM);
  animateCounter('pnsSdm', data.pns);
  animateCounter('pppkSdm', data.pppk);
  animateCounter('kontrakSdm', data.kontrak);
  animateCounter('kecSdm', data.kecamatanList?.length || 0);
  
  // Recent data table
  const recentDataHtml = (data.recentData || []).map(record => `
    <tr>
      <td>${record.Nama || '-'}</td>
      <td>${record['Unit Kerja'] || '-'}</td>
      <td>${record.Jabatan || '-'}</td>
      <td><span class="status-badge ${(record.Status || '').toLowerCase()}">${record.Status || '-'}</span></td>
      <td>${record.Kecamatan || '-'}</td>
    </tr>
  `).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--gray-500)">Belum ada data</td></tr>';
  
  document.getElementById('recentTableBody').innerHTML = recentDataHtml;
  
  // Create charts
  createCharts(data);
}

/**
 * Create Chart.js charts
 * @param {Object} data - Dashboard data
 */
function createCharts(data) {
  const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
  
  // Destroy existing charts
  Object.values(state.charts || {}).forEach(chart => chart.destroy());
  
  // Unit Kerja Chart (Bar)
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
  
  // Jenis Kelamin Chart (Doughnut)
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
  
  // Status Chart (Pie)
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
  
  // Kecamatan Chart (Bar)
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

// ==================== PUBLIC DATA (SDM LIST) ====================

/**
 * Load public SDM data
 */
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

/**
 * Render public data table with pagination
 */
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
  
  // Calculate pagination
  const start = (state.currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
  const end = start + CONFIG.ITEMS_PER_PAGE;
  const pageData = state.filteredData.slice(start, end);
  
  // Render table rows
  tbody.innerHTML = pageData.map(record => `
    <tr>
      <td>${record.Nama || '-'}</td>
      <td>${record['Unit Kerja'] || '-'}</td>
      <td>${record['Jenis Kelamin'] || '-'}</td>
      <td>${record.Jabatan || '-'}</td>
      <td><span class="status-badge ${(record.Status || '').toLowerCase()}">${record.Status || '-'}</span></td>
      <td>${record.Kecamatan || '-'}</td>
    </tr>
  `).join('');
  
  // Pagination info
  document.getElementById('paginationInfo').textContent =
    `Menampilkan ${start + 1}-${Math.min(end, state.filteredData.length)} dari ${state.filteredData.length}`;
  
  // Pagination buttons
  const totalPages = Math.ceil(state.filteredData.length / CONFIG.ITEMS_PER_PAGE);
  let buttons = '';
  for (let i = 1; i <= Math.min(totalPages, 5); i++) {
    buttons += `<button class="page-btn ${i === state.currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }
  document.getElementById('paginationBtns').innerHTML = buttons;
}

/**
 * Go to specific page
 * @param {number} page - Page number
 */
function goPage(page) {
  state.currentPage = page;
  renderPublicTable();
}

// Public data filters
document.getElementById('searchInput').addEventListener('input', debounce(loadPublicData, 500));
document.getElementById('filterUnit').addEventListener('change', loadPublicData);
document.getElementById('filterKec').addEventListener('change', loadPublicData);

// ==================== PROFILE (SEARCH BY NIK) ====================

document.getElementById('profilSearchForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  showLoader();
  
  const nik = document.getElementById('profilNik').value;
  const response = await apiCall('getByNIK', { nik });
  
  if (response.success) {
    document.getElementById('profilSearch').style.display = 'none';
    document.getElementById('profilContent').style.display = 'block';
    
    const data = response.data;
    
    // Update profile info
    document.getElementById('profileNama').textContent = data.Nama || '-';
    document.getElementById('profileJabatan').textContent = data.Jabatan || '-';
    document.getElementById('profileNik').textContent = data.NIK || '-';
    document.getElementById('profileJk').textContent = data['Jenis Kelamin'] || '-';
    document.getElementById('profileAgama').textContent = data.Agama || '-';
    document.getElementById('profileUnit').textContent = data['Unit Kerja'] || '-';
    document.getElementById('profileDesa').textContent = data.Desa || '-';
    document.getElementById('profileKec').textContent = data.Kecamatan || '-';
    
    // Update avatar
    const avatar = document.getElementById('profileAvatar');
    if (data.Foto) {
      avatar.innerHTML = `<img src="${data.Foto}">`;
      avatar.onclick = () => openLightbox(data.Foto);
    } else {
      avatar.innerHTML = '<i class="fas fa-user"></i>';
    }
    
    showToast('Profil ditemukan', 'success');
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
  
  // Check if NIK already exists
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

// ==================== ADMIN FUNCTIONS ====================

/**
 * Load admin data
 */
async function loadAdminData() {
  if (state.role !== 'Administrator') return;
  
  showLoader();
  
  const response = await apiCall('getAllDataAdmin', {
    role: state.role,
    unit_kerja: state.user?.unit_kerja
  });
  
  if (response.success) {
    state.allData = response.data;
    renderAdminTable();
  }
  
  // Load users
  const usersResponse = await apiCall('getUsers');
  if (usersResponse.success) {
    renderUsersTable(usersResponse.data);
  }
  
  hideLoader();
}

/**
 * Render admin data table
 */
function renderAdminTable() {
  const tbody = document.getElementById('adminTableBody');
  
  tbody.innerHTML = state.allData.map(record => `
    <tr>
      <td>${record.NIK || '-'}</td>
      <td>${record.Nama || '-'}</td>
      <td>${record['Unit Kerja'] || '-'}</td>
      <td>${record.Jabatan || '-'}</td>
      <td><span class="status-badge ${(record.Status || '').toLowerCase()}">${record.Status || '-'}</span></td>
      <td><span class="status-badge ${record.Status_Data}">${record.Status_Data || 'aktif'}</span></td>
      <td>
        <div class="action-btns">
          <button class="action-btn edit" onclick="editData('${record.NIK}')"><i class="fas fa-edit"></i></button>
          <button class="action-btn delete" onclick="deleteData('${record.NIK}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

/**
 * Render users table
 * @param {Array} users - Users array
 */
function renderUsersTable(users) {
  const tbody = document.getElementById('usersTableBody');
  
  tbody.innerHTML = users.map(user => `
    <tr>
      <td>${user.Username}</td>
      <td>${user.Role}</td>
      <td>
        <button class="action-btn delete" onclick="deleteUser('${user.Username}')">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

/**
 * Edit data modal
 * @param {string} nik - NIK of record to edit
 */
function editData(nik) {
  const record = state.allData.find(x => x.NIK === nik);
  if (!record) return;
  
  // Build options
  let unitOptions = state.filterOptions.unitKerja?.map(u =>
    `<option value="${u}" ${u === record['Unit Kerja'] ? 'selected' : ''}>${u}</option>`
  ).join('') || '';
  
  let kecOptions = state.filterOptions.kecamatan?.map(k =>
    `<option value="${k}" ${k === record.Kecamatan ? 'selected' : ''}>${k}</option>`
  ).join('') || '';
  
  const content = `
    <form id="editForm">
      <input type="hidden" value="${nik}">
      <div class="form-group">
        <label>Nama</label>
        <input id="eNama" value="${record.Nama || ''}">
      </div>
      <div class="form-group">
        <label>Unit Kerja</label>
        <select id="eUnit">${unitOptions}</select>
      </div>
      <div class="form-group">
        <label>Jabatan</label>
        <input id="eJabatan" value="${record.Jabatan || ''}">
      </div>
      <div class="form-group">
        <label>Status Data</label>
        <select id="eStatusData">
          <option value="aktif" ${record.Status_Data === 'aktif' ? 'selected' : ''}>Aktif</option>
          <option value="pending" ${record.Status_Data === 'pending' ? 'selected' : ''}>Pending</option>
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

/**
 * Save edited data
 * @param {string} nik - NIK of record
 */
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

/**
 * Delete data
 * @param {string} nik - NIK of record to delete
 */
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

/**
 * Delete user
 * @param {string} username - Username to delete
 */
async function deleteUser(username) {
  if (!confirm(`Hapus user ${username}?`)) return;
  
  showLoader();
  
  const response = await apiCall('deleteUser', { username });
  
  if (response.success) {
    showToast('User dihapus', 'success');
    loadAdminData();
  } else {
    showToast(response.error, 'error');
  }
  
  hideLoader();
}

// Add data button
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

/**
 * Save new data
 */
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

// ==================== LAPORAN / REPORT ====================

/**
 * Load report data
 */
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

/**
 * Export data to CSV
 * @param {string} type - Export type
 */
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
}

// ==================== PENGATURAN / SETTINGS ====================

/**
 * Save application settings
 */
function saveSettings() {
  const name = document.getElementById('instansiName').value;
  localStorage.setItem('instansiName', name);
  showToast('Pengaturan disimpan', 'success');
}

// Load settings on init
if (localStorage.getItem('instansiName')) {
  document.getElementById('instansiName').value = localStorage.getItem('instansiName');
}

// ==================== INITIALIZATION ====================

// Initialize app
if (getSession()) {
  showApp();
}
