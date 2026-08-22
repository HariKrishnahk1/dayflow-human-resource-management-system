// ══════════════════════════════════════════════
//  DATA STORE
// ══════════════════════════════════════════════
const DB = {
  users:[
    {id:1,name:'Alex Reynolds',email:'admin@payrollpro.com',password:'admin123',role:'admin',empId:null},
    {id:2,name:'Sarah Mitchell',email:'hr@payrollpro.com',password:'hr123',role:'hr',empId:2},
    {id:3,name:'John Carter',email:'john@payrollpro.com',password:'emp123',role:'employee',empId:3},
    {id:4,name:'Priya Sharma',email:'priya@payrollpro.com',password:'emp123',role:'employee',empId:4},
    {id:5,name:'David Kim',email:'david@payrollpro.com',password:'emp123',role:'employee',empId:5},
  ],
  departments:[
    {id:1,name:'Engineering',manager:'Sarah Mitchell'},
    {id:2,name:'Human Resources',manager:'Sarah Mitchell'},
    {id:3,name:'Finance',manager:'Alex Reynolds'},
    {id:4,name:'Marketing',manager:'David Kim'},
    {id:5,name:'Operations',manager:'Priya Sharma'},
  ],
  employees:[
    {id:1,empCode:'EMP001',name:'Alex Reynolds',email:'admin@payrollpro.com',phone:'+1-555-0101',deptId:3,designation:'CEO',joinDate:'2020-01-15',status:'active',bank:'Chase Bank — ****4521'},
    {id:2,empCode:'EMP002',name:'Sarah Mitchell',email:'hr@payrollpro.com',phone:'+1-555-0102',deptId:2,designation:'HR Manager',joinDate:'2020-03-10',status:'active',bank:'Bank of America — ****7832'},
    {id:3,empCode:'EMP003',name:'John Carter',email:'john@payrollpro.com',phone:'+1-555-0103',deptId:1,designation:'Senior Engineer',joinDate:'2021-06-01',status:'active',bank:'Wells Fargo — ****2214'},
    {id:4,empCode:'EMP004',name:'Priya Sharma',email:'priya@payrollpro.com',phone:'+1-555-0104',deptId:5,designation:'Operations Lead',joinDate:'2021-09-15',status:'active',bank:'Citi Bank — ****9943'},
    {id:5,empCode:'EMP005',name:'David Kim',email:'david@payrollpro.com',phone:'+1-555-0105',deptId:4,designation:'Marketing Manager',joinDate:'2022-01-20',status:'active',bank:'Chase Bank — ****1187'},
    {id:6,empCode:'EMP006',name:'Lisa Torres',email:'lisa@payrollpro.com',phone:'+1-555-0106',deptId:1,designation:'Frontend Developer',joinDate:'2022-05-10',status:'active',bank:'Wells Fargo — ****5530'},
    {id:7,empCode:'EMP007',name:'Marcus Johnson',email:'marcus@payrollpro.com',phone:'+1-555-0107',deptId:1,designation:'Backend Developer',joinDate:'2023-02-14',status:'inactive',bank:'Chase Bank — ****6671'},
  ],
  salaryStructures:[
    {empId:1,basic:8000,hra:3200,da:1600,ta:500,pfDeduction:960,esiDeduction:200,taxDeduction:1200},
    {empId:2,basic:5500,hra:2200,da:1100,ta:400,pfDeduction:660,esiDeduction:138,taxDeduction:600},
    {empId:3,basic:6000,hra:2400,da:1200,ta:450,pfDeduction:720,esiDeduction:150,taxDeduction:700},
    {empId:4,basic:5200,hra:2080,da:1040,ta:380,pfDeduction:624,esiDeduction:130,taxDeduction:520},
    {empId:5,basic:5800,hra:2320,da:1160,ta:420,pfDeduction:696,esiDeduction:145,taxDeduction:650},
    {empId:6,basic:5000,hra:2000,da:1000,ta:350,pfDeduction:600,esiDeduction:125,taxDeduction:450},
    {empId:7,basic:5500,hra:2200,da:1100,ta:400,pfDeduction:660,esiDeduction:138,taxDeduction:580},
  ],
  payrollHistory:[
    {id:1,empId:3,month:'May',year:2025,gross:10100,deductions:1570,net:8530,status:'paid',processedDate:'2025-05-31'},
    {id:2,empId:4,month:'May',year:2025,gross:8700,deductions:1274,net:7426,status:'paid',processedDate:'2025-05-31'},
    {id:3,empId:5,month:'May',year:2025,gross:9700,deductions:1491,net:8209,status:'paid',processedDate:'2025-05-31'},
    {id:4,empId:6,month:'May',year:2025,gross:8350,deductions:1175,net:7175,status:'paid',processedDate:'2025-05-31'},
    {id:5,empId:3,month:'April',year:2025,gross:10100,deductions:1570,net:8530,status:'paid',processedDate:'2025-04-30'},
    {id:6,empId:4,month:'April',year:2025,gross:8700,deductions:1274,net:7426,status:'paid',processedDate:'2025-04-30'},
  ],
  leaves:[
    {id:1,empId:3,type:'Casual',from:'2025-06-10',to:'2025-06-11',days:2,reason:'Family event',status:'pending'},
    {id:2,empId:4,type:'Sick',from:'2025-06-05',to:'2025-06-05',days:1,reason:'Not feeling well',status:'approved'},
    {id:3,empId:5,type:'Earned',from:'2025-06-20',to:'2025-06-25',days:6,reason:'Vacation',status:'pending'},
    {id:4,empId:6,type:'Casual',from:'2025-05-28',to:'2025-05-28',days:1,reason:'Personal work',status:'rejected'},
  ],
  leaveBalance:{
    3:{casual:8,sick:10,earned:15},
    4:{casual:9,sick:10,earned:12},
    5:{casual:7,sick:10,earned:18},
    6:{casual:10,sick:10,earned:14},
  }
};

let currentUser = null;

// ══════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════
function fmt(n){return '$'+Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
function getEmp(id){return DB.employees.find(e=>e.id===id)}
function getDept(id){return DB.departments.find(d=>d.id===id)}
function getSalary(empId){return DB.salaryStructures.find(s=>s.empId===empId)}
function calcGross(s){return s.basic+s.hra+s.da+s.ta}
function calcDeductions(s){return s.pfDeduction+s.esiDeduction+s.taxDeduction}
function calcNet(s){return calcGross(s)-calcDeductions(s)}
function avatarColor(name){const colors=['#4f8ef7','#a855f7','#22c55e','#f59e0b','#ef4444','#14b8a6','#f97316'];const i=name.charCodeAt(0)%colors.length;return colors[i]}
function initials(name){return name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
function avatar(name,size=34){const c=avatarColor(name);return `<div class="avatar" style="width:${size}px;height:${size}px;background:${c}22;color:${c};font-size:${size<40?12:16}px">${initials(name)}</div>`}
function badge(text,type){return `<span class="badge badge-${type}">${text}</span>`}
function statusBadge(s){const m={active:'green',inactive:'red',paid:'green',pending:'yellow',approved:'green',rejected:'red',processed:'blue'};return badge(s,m[s]||'blue')}
function toast(msg,type='success'){
  const t=document.getElementById('toastContainer');
  const d=document.createElement('div');
  d.className=`toast ${type}`;
  d.innerHTML=`<span>${type==='success'?'✅':'❌'}</span><span>${msg}</span>`;
  t.appendChild(d);setTimeout(()=>d.remove(),3000);
}
function showModal(title,body,footer=''){
  document.getElementById('modalTitle').textContent=title;
  document.getElementById('modalBody').innerHTML=body;
  document.getElementById('modalFooter').innerHTML=footer;
  document.getElementById('modalOverlay').classList.add('open');
}
function closeModal(){document.getElementById('modalOverlay').classList.remove('open')}

// ══════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════
function fillLogin(email,pass,role){
  document.getElementById('loginEmail').value=email;
  document.getElementById('loginPassword').value=pass;
}
function doLogin(){
  const email=document.getElementById('loginEmail').value.trim();
  const pass=document.getElementById('loginPassword').value.trim();
  const user=DB.users.find(u=>u.email===email&&u.password===pass);
  if(!user){document.getElementById('loginError').style.display='block';return;}
  document.getElementById('loginError').style.display='none';
  currentUser=user;
  initApp();
}
function logout(){
  currentUser=null;
  document.getElementById('app').style.display='none';
  document.getElementById('loginScreen').style.display='flex';
  document.getElementById('loginEmail').value='';
  document.getElementById('loginPassword').value='';
}
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&document.getElementById('loginScreen').style.display!=='none')doLogin()});

// ══════════════════════════════════════════════
//  NAVIGATION CONFIG
// ══════════════════════════════════════════════
const NAV_ADMIN=[
  {label:'OVERVIEW',items:[{icon:'📊',text:'Dashboard',page:'dashboard'},{icon:'📈',text:'Analytics',page:'analytics'}]},
  {label:'MANAGEMENT',items:[{icon:'👥',text:'Employees',page:'employees'},{icon:'🏢',text:'Departments',page:'departments'},{icon:'💰',text:'Salary Setup',page:'salary'}]},
  {label:'OPERATIONS',items:[{icon:'🧾',text:'Payroll',page:'payroll'},{icon:'🏖️',text:'Leave Requests',page:'leaves'},{icon:'📄',text:'Payslips',page:'payslips'}]},
  {label:'SYSTEM',items:[{icon:'⚙️',text:'Settings',page:'settings'}]},
];
const NAV_HR=[
  {label:'OVERVIEW',items:[{icon:'📊',text:'Dashboard',page:'dashboard'}]},
  {label:'MANAGEMENT',items:[{icon:'👥',text:'Employees',page:'employees'},{icon:'💰',text:'Salary Setup',page:'salary'}]},
  {label:'OPERATIONS',items:[{icon:'🧾',text:'Payroll',page:'payroll'},{icon:'🏖️',text:'Leave Requests',page:'leaves'},{icon:'📄',text:'Payslips',page:'payslips'}]},
];
const NAV_EMP=[
  {label:'MY PORTAL',items:[{icon:'📊',text:'Dashboard',page:'dashboard'},{icon:'👤',text:'My Profile',page:'profile'},{icon:'📄',text:'My Payslips',page:'payslips'},{icon:'🏖️',text:'My Leaves',page:'myleaves'}]},
];

function initApp(){
  document.getElementById('loginScreen').style.display='none';
  document.getElementById('app').style.display='flex';
  // sidebar user info
  document.getElementById('sidebarName').textContent=currentUser.name;
  document.getElementById('sidebarEmail').textContent=currentUser.email;
  const badge=document.getElementById('sidebarBadge');
  const roleMap={admin:'🛡️ Admin',hr:'👔 HR Manager',employee:'🧑‍💼 Employee'};
  const roleClass={admin:'role-admin',hr:'role-hr',employee:'role-employee'};
  badge.textContent=roleMap[currentUser.role];
  badge.className='sidebar-role-badge '+roleClass[currentUser.role];
  // date
  document.getElementById('topbarDate').textContent=new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'});
  // nav
  const nav=currentUser.role==='admin'?NAV_ADMIN:currentUser.role==='hr'?NAV_HR:NAV_EMP;
  buildNav(nav);
  navigateTo('dashboard');
}

function buildNav(nav){
  const el=document.getElementById('sidebarNav');
  el.innerHTML='';
  nav.forEach(section=>{
    el.innerHTML+=`<div class="nav-section-label">${section.label}</div>`;
    section.items.forEach(item=>{
      el.innerHTML+=`<div class="nav-item" data-page="${item.page}" onclick="navigateTo('${item.page}')"><span class="nav-icon">${item.icon}</span><span>${item.text}</span></div>`;
    });
  });
}

function navigateTo(page){
  document.querySelectorAll('.nav-item').forEach(i=>i.classList.remove('active'));
  const el=document.querySelector(`.nav-item[data-page="${page}"]`);
  if(el)el.classList.add('active');
  const titles={dashboard:'Dashboard',employees:'Employee Management',departments:'Departments',salary:'Salary Structure',payroll:'Payroll Processing',leaves:'Leave Management',payslips:'Payslips',analytics:'Analytics',profile:'My Profile',myleaves:'My Leaves',settings:'Settings'};
  document.getElementById('topbarTitle').textContent=titles[page]||page;
  const content=document.getElementById('mainContent');
  const pages={dashboard:renderDashboard,employees:renderEmployees,departments:renderDepartments,salary:renderSalary,payroll:renderPayroll,leaves:renderLeaves,payslips:renderPayslips,analytics:renderAnalytics,profile:renderProfile,myleaves:renderMyLeaves,settings:renderSettings};
  if(pages[page])content.innerHTML=pages[page]();
  else content.innerHTML=`<div class="empty-state"><div class="empty-icon">🚧</div><div>Page coming soon</div></div>`;
}

// ══════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════
function renderDashboard(){
  const activeEmps=DB.employees.filter(e=>e.status==='active').length;
  const totalPayroll=DB.payrollHistory.filter(p=>p.month==='May'&&p.year===2025).reduce((s,p)=>s+p.net,0);
  const pendingLeaves=DB.leaves.filter(l=>l.status==='pending').length;
  const depts=DB.departments.length;

  if(currentUser.role==='employee'){
    const emp=getEmp(currentUser.empId);
    const sal=getSalary(currentUser.empId);
    const bal=DB.leaveBalance[currentUser.empId]||{casual:10,sick:10,earned:15};
    const myLeaves=DB.leaves.filter(l=>l.empId===currentUser.empId);
    return `
    <div class="stats-grid">
      <div class="stat-card" style="--stat-color:var(--accent)"><div class="stat-icon">💰</div><div class="stat-label">Net Salary</div><div class="stat-value">${fmt(calcNet(sal))}</div><div class="stat-sub">This month</div></div>
      <div class="stat-card" style="--stat-color:var(--green)"><div class="stat-icon">🌴</div><div class="stat-label">Casual Leave</div><div class="stat-value">${bal.casual}</div><div class="stat-sub">Days remaining</div></div>
      <div class="stat-card" style="--stat-color:var(--yellow)"><div class="stat-icon">🏥</div><div class="stat-label">Sick Leave</div><div class="stat-value">${bal.sick}</div><div class="stat-sub">Days remaining</div></div>
      <div class="stat-card" style="--stat-color:var(--purple)"><div class="stat-icon">🏖️</div><div class="stat-label">Earned Leave</div><div class="stat-value">${bal.earned}</div><div class="stat-sub">Days remaining</div></div>
    </div>
    <div class="two-col">
      <div class="card">
        <div class="card-header"><div class="card-title">Salary Breakdown</div></div>
        <div class="card-body">
          <div class="bar-chart">
            ${barRow('Basic Pay',sal.basic,calcGross(sal),'var(--accent)')}
            ${barRow('HRA',sal.hra,calcGross(sal),'var(--purple)')}
            ${barRow('DA',sal.da,calcGross(sal),'var(--green)')}
            ${barRow('TA',sal.ta,calcGross(sal),'var(--yellow)')}
          </div>
          <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);display:flex;justify-content:space-between;font-size:13px">
            <span style="color:var(--muted)">Gross Salary</span><span style="font-weight:700;color:var(--green)">${fmt(calcGross(sal))}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-top:6px">
            <span style="color:var(--muted)">Total Deductions</span><span style="font-weight:700;color:var(--red)">- ${fmt(calcDeductions(sal))}</span>
          </div>
          <div style="margin-top:8px;padding:12px 16px;background:var(--accent-glow);border:1px solid rgba(79,142,247,0.2);border-radius:var(--radius-sm);display:flex;justify-content:space-between">
            <span style="font-weight:600">Net Salary</span><span style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--accent)">${fmt(calcNet(sal))}</span>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Recent Leave Requests</div><button class="btn btn-secondary btn-sm" onclick="navigateTo('myleaves')">View All</button></div>
        <div class="card-body" style="padding:0">
          ${myLeaves.length===0?'<div class="empty-state"><div class="empty-icon">🏖️</div><div>No leave requests</div></div>':myLeaves.map(l=>`
            <div style="padding:14px 22px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
              <div><div style="font-size:13px;font-weight:600">${l.type} Leave</div><div style="font-size:12px;color:var(--muted)">${l.from} → ${l.to} · ${l.days} day(s)</div></div>
              ${statusBadge(l.status)}
            </div>`).join('')}
        </div>
      </div>
    </div>`;
  }

  return `
  <div class="stats-grid">
    <div class="stat-card" style="--stat-color:var(--accent)"><div class="stat-icon">👥</div><div class="stat-label">Active Employees</div><div class="stat-value">${activeEmps}</div><div class="stat-sub">${DB.employees.length} total</div></div>
    <div class="stat-card" style="--stat-color:var(--green)"><div class="stat-icon">💰</div><div class="stat-label">May Payroll</div><div class="stat-value">${fmt(totalPayroll)}</div><div class="stat-sub">Net disbursed</div></div>
    <div class="stat-card" style="--stat-color:var(--yellow)"><div class="stat-icon">🏖️</div><div class="stat-label">Pending Leaves</div><div class="stat-value">${pendingLeaves}</div><div class="stat-sub">Awaiting approval</div></div>
    <div class="stat-card" style="--stat-color:var(--purple)"><div class="stat-icon">🏢</div><div class="stat-label">Departments</div><div class="stat-value">${depts}</div><div class="stat-sub">Active units</div></div>
  </div>
  <div class="two-col">
    <div class="card">
      <div class="card-header"><div class="card-title">Department Payroll</div></div>
      <div class="card-body">
        <div class="bar-chart">
          ${deptBarRows()}
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">Recent Employees</div><button class="btn btn-secondary btn-sm" onclick="navigateTo('employees')">View All</button></div>
      <div class="card-body" style="padding:0">
        ${DB.employees.slice(0,5).map(e=>`
          <div style="padding:12px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px">
            ${avatar(e.name)}
            <div style="flex:1"><div style="font-size:13px;font-weight:600">${e.name}</div><div style="font-size:11px;color:var(--muted)">${e.designation}</div></div>
            ${statusBadge(e.status)}
          </div>`).join('')}
      </div>
    </div>
  </div>
  <div style="margin-top:20px" class="card">
    <div class="card-header"><div class="card-title">Pending Leave Requests</div><button class="btn btn-secondary btn-sm" onclick="navigateTo('leaves')">Manage All</button></div>
    <div class="card-body" style="padding:0">
      ${DB.leaves.filter(l=>l.status==='pending').map(l=>{
        const emp=getEmp(l.empId);
        return `<div style="padding:14px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:14px">
          ${avatar(emp.name)}
          <div style="flex:1"><div style="font-weight:600;font-size:13px">${emp.name}</div><div style="font-size:12px;color:var(--muted)">${l.type} · ${l.from} to ${l.to} · ${l.days} day(s)</div></div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-success btn-sm" onclick="approveLeave(${l.id})">Approve</button>
            <button class="btn btn-danger btn-sm" onclick="rejectLeave(${l.id})">Reject</button>
          </div>
        </div>`;
      }).join('')||'<div class="empty-state"><div class="empty-icon">✅</div><div>No pending leaves</div></div>'}
    </div>
  </div>`;
}

function barRow(label,val,total,color){
  const pct=Math.round((val/total)*100);
  return `<div class="bar-row"><div class="bar-label">${label}</div><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div><div class="bar-val">${fmt(val)}</div></div>`;
}
function deptBarRows(){
  const deptTotals={};
  DB.salaryStructures.forEach(s=>{
    const emp=getEmp(s.empId);if(!emp||emp.status!=='active')return;
    const dept=getDept(emp.deptId);if(!dept)return;
    deptTotals[dept.name]=(deptTotals[dept.name]||0)+calcNet(s);
  });
  const max=Math.max(...Object.values(deptTotals));
  const colors=['var(--accent)','var(--purple)','var(--green)','var(--yellow)','var(--red)'];
  return Object.entries(deptTotals).map(([k,v],i)=>barRow(k,v,max,colors[i%colors.length])).join('');
}

// ══════════════════════════════════════════════
//  EMPLOYEES
// ══════════════════════════════════════════════
function renderEmployees(){
  const emps=DB.employees;
  return `
  <div class="page-header">
    <div><div class="page-title">Employees</div><div class="page-sub">${emps.length} total · ${emps.filter(e=>e.status==='active').length} active</div></div>
    <div style="display:flex;gap:10px;align-items:center">
      <div class="search-bar"><span>🔍</span><input id="empSearch" placeholder="Search employees..." oninput="filterEmployees()"/></div>
      ${currentUser.role!=='employee'?`<button class="btn btn-primary" onclick="openAddEmployee()">+ Add Employee</button>`:''}
    </div>
  </div>
  <div class="card">
    <div class="table-wrap">
      <table id="empTable">
        <thead><tr><th>Employee</th><th>Code</th><th>Department</th><th>Designation</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody id="empTbody">${renderEmpRows(emps)}</tbody>
      </table>
    </div>
  </div>`;
}
function renderEmpRows(emps){
  return emps.map(e=>{
    const dept=getDept(e.deptId);
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:10px">${avatar(e.name)}<div><div class="td-name">${e.name}</div><div style="font-size:11px;color:var(--muted)">${e.email}</div></div></div></td>
      <td><span class="td-mono">${e.empCode}</span></td>
      <td>${dept?dept.name:'—'}</td>
      <td>${e.designation}</td>
      <td><span class="td-mono">${e.joinDate}</span></td>
      <td>${statusBadge(e.status)}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-secondary btn-sm btn-icon" onclick="viewEmployee(${e.id})" title="View">👁️</button>
          ${currentUser.role!=='employee'?`<button class="btn btn-secondary btn-sm btn-icon" onclick="openEditEmployee(${e.id})" title="Edit">✏️</button>
          <button class="btn btn-danger btn-sm btn-icon" onclick="toggleEmpStatus(${e.id})" title="Toggle Status">${e.status==='active'?'🔴':'🟢'}</button>`:''}
        </div>
      </td>
    </tr>`;
  }).join('');
}
function filterEmployees(){
  const q=document.getElementById('empSearch').value.toLowerCase();
  const filtered=DB.employees.filter(e=>e.name.toLowerCase().includes(q)||e.email.toLowerCase().includes(q)||e.empCode.toLowerCase().includes(q)||e.designation.toLowerCase().includes(q));
  document.getElementById('empTbody').innerHTML=renderEmpRows(filtered);
}
function viewEmployee(id){
  const e=getEmp(id);const dept=getDept(e.deptId);const sal=getSalary(id);
  showModal('Employee Details',`
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
      ${avatar(e.name,60)}
      <div><div style="font-family:var(--font-display);font-size:20px;font-weight:700">${e.name}</div><div style="color:var(--muted);font-size:13px">${e.designation} · ${dept?dept.name:'—'}</div>${statusBadge(e.status)}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px">
      ${infoItem('📧 Email',e.email)}${infoItem('📱 Phone',e.phone)}
      ${infoItem('🆔 Emp Code',e.empCode)}${infoItem('📅 Joined',e.joinDate)}
      ${infoItem('🏢 Department',dept?dept.name:'—')}${infoItem('🏦 Bank',e.bank)}
    </div>
    ${sal?`<div style="background:var(--surface2);border-radius:var(--radius-sm);padding:16px">
      <div style="font-size:12px;color:var(--muted);margin-bottom:12px;font-family:var(--font-mono);letter-spacing:1px">SALARY OVERVIEW</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;text-align:center">
        <div><div style="font-size:11px;color:var(--muted)">Gross</div><div style="font-weight:700;color:var(--green)">${fmt(calcGross(sal))}</div></div>
        <div><div style="font-size:11px;color:var(--muted)">Deductions</div><div style="font-weight:700;color:var(--red)">-${fmt(calcDeductions(sal))}</div></div>
        <div><div style="font-size:11px;color:var(--muted)">Net</div><div style="font-weight:700;color:var(--accent)">${fmt(calcNet(sal))}</div></div>
      </div>
    </div>`:''}
  `,'<button class="btn btn-secondary" onclick="closeModal()">Close</button>');
}
function infoItem(label,val){
  return `<div style="background:var(--surface2);border-radius:var(--radius-sm);padding:10px 14px"><div style="font-size:11px;color:var(--muted);margin-bottom:3px">${label}</div><div style="font-size:13px;font-weight:500">${val||'—'}</div></div>`;
}
function openAddEmployee(){
  showModal('Add New Employee',empForm(),'<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveNewEmployee()">Add Employee</button>');
}
function empForm(e={}){
  const deptOptions=DB.departments.map(d=>`<option value="${d.id}" ${e.deptId===d.id?'selected':''}>${d.name}</option>`).join('');
  return `
  <div class="form-row">
    <div class="form-group"><label class="form-label">Full Name</label><input class="form-input" id="ef_name" value="${e.name||''}"/></div>
    <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="ef_email" type="email" value="${e.email||''}"/></div>
  </div>
  <div class="form-row">
    <div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="ef_phone" value="${e.phone||''}"/></div>
    <div class="form-group"><label class="form-label">Designation</label><input class="form-input" id="ef_designation" value="${e.designation||''}"/></div>
  </div>
  <div class="form-row">
    <div class="form-group"><label class="form-label">Department</label><select class="form-input form-select" id="ef_dept">${deptOptions}</select></div>
    <div class="form-group"><label class="form-label">Join Date</label><input class="form-input" id="ef_joinDate" type="date" value="${e.joinDate||''}"/></div>
  </div>
  <div class="form-group"><label class="form-label">Bank Details</label><input class="form-input" id="ef_bank" value="${e.bank||''}"/></div>`;
}
function saveNewEmployee(){
  const name=document.getElementById('ef_name').value.trim();
  if(!name){toast('Name is required','error');return;}
  const newId=Math.max(...DB.employees.map(e=>e.id))+1;
  const newCode='EMP'+String(newId).padStart(3,'0');
  DB.employees.push({
    id:newId,empCode:newCode,
    name,email:document.getElementById('ef_email').value,
    phone:document.getElementById('ef_phone').value,
    deptId:+document.getElementById('ef_dept').value,
    designation:document.getElementById('ef_designation').value,
    joinDate:document.getElementById('ef_joinDate').value,
    status:'active',bank:document.getElementById('ef_bank').value
  });
  DB.salaryStructures.push({empId:newId,basic:4000,hra:1600,da:800,ta:300,pfDeduction:480,esiDeduction:100,taxDeduction:350});
  closeModal();toast(`${name} added successfully`);
  navigateTo('employees');
}
function openEditEmployee(id){
  const e=getEmp(id);
  showModal('Edit Employee',empForm(e),`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveEditEmployee(${id})">Save Changes</button>`);
}
function saveEditEmployee(id){
  const e=getEmp(id);
  e.name=document.getElementById('ef_name').value;
  e.email=document.getElementById('ef_email').value;
  e.phone=document.getElementById('ef_phone').value;
  e.deptId=+document.getElementById('ef_dept').value;
  e.designation=document.getElementById('ef_designation').value;
  e.joinDate=document.getElementById('ef_joinDate').value;
  e.bank=document.getElementById('ef_bank').value;
  closeModal();toast('Employee updated');navigateTo('employees');
}
function toggleEmpStatus(id){
  const e=getEmp(id);
  e.status=e.status==='active'?'inactive':'active';
  toast(`${e.name} marked as ${e.status}`);navigateTo('employees');
}

// ══════════════════════════════════════════════
//  DEPARTMENTS
// ══════════════════════════════════════════════
function renderDepartments(){
  return `
  <div class="page-header">
    <div><div class="page-title">Departments</div><div class="page-sub">${DB.departments.length} departments</div></div>
    <button class="btn btn-primary" onclick="openAddDept()">+ Add Department</button>
  </div>
  <div class="three-col">
    ${DB.departments.map(d=>{
      const count=DB.employees.filter(e=>e.deptId===d.id&&e.status==='active').length;
      const totalSal=DB.employees.filter(e=>e.deptId===d.id&&e.status==='active').reduce((s,e)=>{const sal=getSalary(e.id);return s+(sal?calcNet(sal):0);},0);
      return `<div class="card" style="padding:0">
        <div style="padding:20px;border-bottom:1px solid var(--border)">
          <div style="font-family:var(--font-display);font-size:16px;font-weight:700;margin-bottom:4px">${d.name}</div>
          <div style="font-size:12px;color:var(--muted)">Manager: ${d.manager}</div>
        </div>
        <div style="padding:16px 20px;display:flex;justify-content:space-between;align-items:center">
          <div><div style="font-size:11px;color:var(--muted)">Employees</div><div style="font-weight:700;font-size:18px">${count}</div></div>
          <div style="text-align:right"><div style="font-size:11px;color:var(--muted)">Monthly Cost</div><div style="font-weight:700;color:var(--accent);font-size:15px">${fmt(totalSal)}</div></div>
        </div>
        <div style="padding:0 20px 16px;display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" onclick="editDept(${d.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteDept(${d.id})">Delete</button>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}
function openAddDept(){
  showModal('Add Department',`
    <div class="form-group"><label class="form-label">Department Name</label><input class="form-input" id="dept_name"/></div>
    <div class="form-group"><label class="form-label">Manager</label><input class="form-input" id="dept_mgr"/></div>
  `,'<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveDept()">Add</button>');
}
function saveDept(){
  const name=document.getElementById('dept_name').value.trim();
  if(!name){toast('Name required','error');return;}
  DB.departments.push({id:Math.max(...DB.departments.map(d=>d.id))+1,name,manager:document.getElementById('dept_mgr').value});
  closeModal();toast('Department added');navigateTo('departments');
}
function editDept(id){
  const d=DB.departments.find(x=>x.id===id);
  showModal('Edit Department',`
    <div class="form-group"><label class="form-label">Name</label><input class="form-input" id="dept_name" value="${d.name}"/></div>
    <div class="form-group"><label class="form-label">Manager</label><input class="form-input" id="dept_mgr" value="${d.manager}"/></div>
  `,`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="updateDept(${id})">Save</button>`);
}
function updateDept(id){
  const d=DB.departments.find(x=>x.id===id);
  d.name=document.getElementById('dept_name').value;
  d.manager=document.getElementById('dept_mgr').value;
  closeModal();toast('Department updated');navigateTo('departments');
}
function deleteDept(id){
  if(!confirm('Delete this department?'))return;
  const i=DB.departments.findIndex(d=>d.id===id);
  DB.departments.splice(i,1);toast('Department deleted','error');navigateTo('departments');
}

// ══════════════════════════════════════════════
//  SALARY STRUCTURE
// ══════════════════════════════════════════════
function renderSalary(){
  return `
  <div class="page-header"><div><div class="page-title">Salary Structure</div><div class="page-sub">Manage components for each employee</div></div></div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Employee</th><th>Basic</th><th>HRA</th><th>DA</th><th>TA</th><th>Gross</th><th>PF</th><th>ESI</th><th>Tax</th><th>Net Salary</th><th>Action</th></tr></thead>
        <tbody>
          ${DB.salaryStructures.map(s=>{
            const e=getEmp(s.empId);if(!e)return'';
            return `<tr>
              <td><div style="display:flex;align-items:center;gap:8px">${avatar(e.name)}<div><div class="td-name">${e.name}</div><div style="font-size:11px;color:var(--muted)">${e.designation}</div></div></div></td>
              <td class="td-mono">${fmt(s.basic)}</td>
              <td class="td-mono">${fmt(s.hra)}</td>
              <td class="td-mono">${fmt(s.da)}</td>
              <td class="td-mono">${fmt(s.ta)}</td>
              <td><span style="color:var(--green);font-weight:700;font-family:var(--font-mono)">${fmt(calcGross(s))}</span></td>
              <td class="td-mono" style="color:var(--red)">-${fmt(s.pfDeduction)}</td>
              <td class="td-mono" style="color:var(--red)">-${fmt(s.esiDeduction)}</td>
              <td class="td-mono" style="color:var(--red)">-${fmt(s.taxDeduction)}</td>
              <td><span style="color:var(--accent);font-weight:700;font-family:var(--font-display);font-size:15px">${fmt(calcNet(s))}</span></td>
              <td><button class="btn btn-secondary btn-sm" onclick="editSalary(${s.empId})">Edit</button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}
function editSalary(empId){
  const s=getSalary(empId);const e=getEmp(empId);
  showModal(`Salary — ${e.name}`,`
    <div style="background:var(--accent-glow);border:1px solid rgba(79,142,247,0.2);border-radius:var(--radius-sm);padding:12px 14px;margin-bottom:20px;font-size:12px;color:var(--accent)">💡 Net = (Basic + HRA + DA + TA) − (PF + ESI + Tax)</div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Basic</label><input class="form-input" id="sal_basic" type="number" value="${s.basic}"/></div>
      <div class="form-group"><label class="form-label">HRA</label><input class="form-input" id="sal_hra" type="number" value="${s.hra}"/></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">DA</label><input class="form-input" id="sal_da" type="number" value="${s.da}"/></div>
      <div class="form-group"><label class="form-label">TA</label><input class="form-input" id="sal_ta" type="number" value="${s.ta}"/></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">PF Deduction</label><input class="form-input" id="sal_pf" type="number" value="${s.pfDeduction}"/></div>
      <div class="form-group"><label class="form-label">ESI Deduction</label><input class="form-input" id="sal_esi" type="number" value="${s.esiDeduction}"/></div>
    </div>
    <div class="form-group"><label class="form-label">Tax Deduction</label><input class="form-input" id="sal_tax" type="number" value="${s.taxDeduction}"/></div>
  `,`<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveSalary(${empId})">Save</button>`);
}
function saveSalary(empId){
  const s=getSalary(empId);
  s.basic=+document.getElementById('sal_basic').value;
  s.hra=+document.getElementById('sal_hra').value;
  s.da=+document.getElementById('sal_da').value;
  s.ta=+document.getElementById('sal_ta').value;
  s.pfDeduction=+document.getElementById('sal_pf').value;
  s.esiDeduction=+document.getElementById('sal_esi').value;
  s.taxDeduction=+document.getElementById('sal_tax').value;
  closeModal();toast('Salary structure updated');navigateTo('salary');
}

// ══════════════════════════════════════════════
//  PAYROLL
// ══════════════════════════════════════════════
function renderPayroll(){
  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const currentMonth=months[new Date().getMonth()];
  const activeEmps=DB.employees.filter(e=>e.status==='active');
  const mayPayroll=DB.payrollHistory.filter(p=>p.month==='May'&&p.year===2025);
  const totalNet=mayPayroll.reduce((s,p)=>s+p.net,0);
  const totalGross=mayPayroll.reduce((s,p)=>s+p.gross,0);

  return `
  <div class="page-header">
    <div><div class="page-title">Payroll Processing</div><div class="page-sub">Run and manage monthly payroll</div></div>
    <button class="btn btn-primary" onclick="runPayroll()">▶ Run June 2025 Payroll</button>
  </div>
  <div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">
    <div class="stat-card" style="--stat-color:var(--accent)"><div class="stat-label">May Total Gross</div><div class="stat-value">${fmt(totalGross)}</div><div class="stat-sub">${mayPayroll.length} employees</div></div>
    <div class="stat-card" style="--stat-color:var(--red)"><div class="stat-label">May Deductions</div><div class="stat-value">${fmt(totalGross-totalNet)}</div><div class="stat-sub">PF + ESI + Tax</div></div>
    <div class="stat-card" style="--stat-color:var(--green)"><div class="stat-label">May Net Paid</div><div class="stat-value">${fmt(totalNet)}</div><div class="stat-sub">Disbursed</div></div>
  </div>
  <div class="card">
    <div class="card-header"><div class="card-title">May 2025 Payroll</div><span class="badge badge-green">Processed</span></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Employee</th><th>Gross Salary</th><th>PF</th><th>ESI</th><th>Tax</th><th>Total Deductions</th><th>Net Salary</th><th>Status</th><th>Payslip</th></tr></thead>
        <tbody>
          ${activeEmps.map(e=>{
            const s=getSalary(e.id);if(!s)return'';
            const hist=DB.payrollHistory.find(p=>p.empId===e.id&&p.month==='May');
            return `<tr>
              <td><div style="display:flex;align-items:center;gap:8px">${avatar(e.name)}<span class="td-name">${e.name}</span></div></td>
              <td class="td-mono" style="color:var(--green)">${fmt(calcGross(s))}</td>
              <td class="td-mono">${fmt(s.pfDeduction)}</td>
              <td class="td-mono">${fmt(s.esiDeduction)}</td>
              <td class="td-mono">${fmt(s.taxDeduction)}</td>
              <td class="td-mono" style="color:var(--red)">-${fmt(calcDeductions(s))}</td>
              <td><span style="font-family:var(--font-display);font-size:15px;font-weight:700;color:var(--accent)">${fmt(calcNet(s))}</span></td>
              <td>${hist?statusBadge('paid'):badge('pending','yellow')}</td>
              <td><button class="btn btn-secondary btn-sm" onclick="viewPayslip(${e.id},'May',2025)">📄 View</button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}
function runPayroll(){
  const month='June';const year=2025;
  const existing=DB.payrollHistory.filter(p=>p.month===month&&p.year===year);
  const active=DB.employees.filter(e=>e.status==='active');
  let added=0;
  active.forEach(e=>{
    if(existing.find(p=>p.empId===e.id))return;
    const s=getSalary(e.id);if(!s)return;
    DB.payrollHistory.push({id:DB.payrollHistory.length+1,empId:e.id,month,year,gross:calcGross(s),deductions:calcDeductions(s),net:calcNet(s),status:'paid',processedDate:new Date().toISOString().split('T')[0]});
    added++;
  });
  if(added>0){toast(`June 2025 payroll processed for ${added} employees ✅`);navigateTo('payroll');}
  else toast('June payroll already processed','error');
}

// ══════════════════════════════════════════════
//  PAYSLIPS
// ══════════════════════════════════════════════
function renderPayslips(){
  const months=['January','February','March','April','May','June'];
  let empsToShow=currentUser.role==='employee'?DB.employees.filter(e=>e.id===currentUser.empId):DB.employees.filter(e=>e.status==='active');
  return `
  <div class="page-header"><div><div class="page-title">Payslips</div><div class="page-sub">View and download employee payslips</div></div></div>
  <div class="card">
    <div class="table-wrap">
      <table>
        <thead><tr><th>Employee</th><th>Month</th><th>Year</th><th>Gross</th><th>Deductions</th><th>Net Salary</th><th>Action</th></tr></thead>
        <tbody>
          ${DB.payrollHistory.filter(p=>empsToShow.find(e=>e.id===p.empId)).map(p=>{
            const e=getEmp(p.empId);
            return `<tr>
              <td><div style="display:flex;align-items:center;gap:8px">${avatar(e.name)}<span class="td-name">${e.name}</span></div></td>
              <td>${p.month}</td>
              <td>${p.year}</td>
              <td class="td-mono" style="color:var(--green)">${fmt(p.gross)}</td>
              <td class="td-mono" style="color:var(--red)">-${fmt(p.deductions)}</td>
              <td><span style="font-family:var(--font-display);font-size:15px;font-weight:700;color:var(--accent)">${fmt(p.net)}</span></td>
              <td><button class="btn btn-primary btn-sm" onclick="viewPayslip(${p.empId},'${p.month}',${p.year})">📄 Payslip</button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}
function viewPayslip(empId,month,year){
  const e=getEmp(empId);const s=getSalary(empId);const dept=getDept(e.deptId);
  if(!s)return toast('No salary data','error');
  const payslipHtml=`
  <div class="payslip">
    <div class="payslip-header">
      <div><div class="payslip-company">Payroll<span>Pro</span> Inc.</div><div style="font-size:12px;color:#6b7592;margin-top:4px">HR & Payroll Solutions · San Francisco, CA</div></div>
      <div style="text-align:right"><div class="payslip-label">Pay Slip For</div><div class="payslip-period">${month} ${year}</div></div>
    </div>
    <div class="payslip-emp-info">
      <div class="payslip-info-item"><label>Employee Name</label><span>${e.name}</span></div>
      <div class="payslip-info-item"><label>Employee Code</label><span>${e.empCode}</span></div>
      <div class="payslip-info-item"><label>Designation</label><span>${e.designation}</span></div>
      <div class="payslip-info-item"><label>Department</label><span>${dept?dept.name:'—'}</span></div>
      <div class="payslip-info-item"><label>Date of Joining</label><span>${e.joinDate}</span></div>
      <div class="payslip-info-item"><label>Bank Account</label><span>${e.bank}</span></div>
    </div>
    <table class="payslip-table">
      <thead><tr><th style="text-align:left">Earnings</th><th style="text-align:right">Amount</th><th style="text-align:left">Deductions</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>
        <tr><td>Basic Pay</td><td style="text-align:right">$${s.basic.toLocaleString()}</td><td>Provident Fund (PF)</td><td style="text-align:right;color:#ef4444">$${s.pfDeduction.toLocaleString()}</td></tr>
        <tr><td>House Rent Allowance (HRA)</td><td style="text-align:right">$${s.hra.toLocaleString()}</td><td>ESI Contribution</td><td style="text-align:right;color:#ef4444">$${s.esiDeduction.toLocaleString()}</td></tr>
        <tr><td>Dearness Allowance (DA)</td><td style="text-align:right">$${s.da.toLocaleString()}</td><td>Income Tax (TDS)</td><td style="text-align:right;color:#ef4444">$${s.taxDeduction.toLocaleString()}</td></tr>
        <tr><td>Travel Allowance (TA)</td><td style="text-align:right">$${s.ta.toLocaleString()}</td><td>—</td><td style="text-align:right">—</td></tr>
      </tbody>
      <tfoot>
        <tr><td>Total Earnings</td><td style="text-align:right;color:#059669">$${calcGross(s).toLocaleString()}</td><td>Total Deductions</td><td style="text-align:right;color:#ef4444">$${calcDeductions(s).toLocaleString()}</td></tr>
      </tfoot>
    </table>
    <div class="payslip-net">
      <div><div class="payslip-net-label">Net Take-Home Salary</div><div style="font-size:12px;opacity:0.7;margin-top:2px">${month} ${year} · Credited to ${e.bank}</div></div>
      <div class="payslip-net-amount">$${calcNet(s).toLocaleString()}</div>
    </div>
    <div style="margin-top:20px;font-size:11px;color:#6b7592;text-align:center;border-top:1px solid #e8ecf4;padding-top:14px">This is a computer-generated payslip and does not require a signature. · PayrollPro Inc. © ${year}</div>
  </div>`;
  showModal(`Payslip — ${e.name}`,payslipHtml,`<button class="btn btn-secondary" onclick="closeModal()">Close</button><button class="btn btn-primary" onclick="printPayslip()">🖨️ Print</button>`);
}
function printPayslip(){
  const content=document.querySelector('.payslip').outerHTML;
  const win=window.open('','_blank');
  win.document.write(`<html><head><title>Payslip</title><link href="https://fonts.googleapis.com/css2?family=Satoshi:wght@400;600;700&display=swap" rel="stylesheet"><style>body{font-family:'Satoshi',sans-serif;padding:40px;max-width:700px;margin:0 auto}.payslip-header{display:flex;justify-content:space-between;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #1a1f2b}.payslip-company{font-size:22px;font-weight:700}.payslip-emp-info{display:grid;grid-template-columns:1fr 1fr;gap:8px;background:#f8f9fc;border-radius:8px;padding:14px;margin-bottom:18px}.payslip-info-item label{font-size:10px;text-transform:uppercase;color:#6b7592;display:block}.payslip-info-item span{font-size:13px;font-weight:600}.payslip-table{width:100%;border-collapse:collapse;margin-bottom:18px}.payslip-table th{background:#1a1f2b;color:#fff;padding:9px 12px;font-size:11px;text-transform:uppercase}.payslip-table td{padding:9px 12px;font-size:13px;border-bottom:1px solid #e8ecf4}.payslip-table tfoot td{font-weight:700;background:#f0f4ff;border-top:2px solid #1a1f2b}.payslip-net{background:#4f8ef7;color:#fff;border-radius:8px;padding:14px 18px;display:flex;justify-content:space-between}.payslip-net-amount{font-size:24px;font-weight:700}</style></head><body>${content}</body></html>`);
  win.document.close();win.focus();win.print();
}

// ══════════════════════════════════════════════
//  LEAVES
// ══════════════════════════════════════════════
function renderLeaves(){
  const pending=DB.leaves.filter(l=>l.status==='pending');
  const approved=DB.leaves.filter(l=>l.status==='approved');
  return `
  <div class="page-header"><div><div class="page-title">Leave Management</div><div class="page-sub">${pending.length} pending approval</div></div></div>
  <div class="tabs" id="leaveTabs">
    <div class="tab active" onclick="switchLeaveTab('pending',this)">Pending (${pending.length})</div>
    <div class="tab" onclick="switchLeaveTab('approved',this)">Approved (${approved.length})</div>
    <div class="tab" onclick="switchLeaveTab('all',this)">All Requests</div>
  </div>
  <div id="leaveContent">${renderLeaveList('pending')}</div>`;
}
function switchLeaveTab(status,el){
  document.querySelectorAll('#leaveTabs .tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('leaveContent').innerHTML=renderLeaveList(status);
}
function renderLeaveList(status){
  const leaves=status==='all'?DB.leaves:DB.leaves.filter(l=>l.status===status);
  if(!leaves.length)return`<div class="empty-state"><div class="empty-icon">🏖️</div><div>No ${status} leave requests</div></div>`;
  return leaves.map(l=>{
    const e=getEmp(l.empId);
    return `<div class="leave-card">
      <div style="display:flex;align-items:center;gap:12px;flex:1">
        ${avatar(e.name,40)}
        <div class="lcard-info">
          <div class="lcard-name">${e.name}</div>
          <div class="lcard-detail">${l.type} Leave · ${l.from} → ${l.to} · <strong>${l.days} day(s)</strong></div>
          <div class="lcard-detail" style="margin-top:3px">Reason: ${l.reason}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        ${statusBadge(l.status)}
        ${l.status==='pending'?`<button class="btn btn-success btn-sm" onclick="approveLeave(${l.id})">✓ Approve</button><button class="btn btn-danger btn-sm" onclick="rejectLeave(${l.id})">✕ Reject</button>`:''}
      </div>
    </div>`;
  }).join('');
}
function approveLeave(id){
  const l=DB.leaves.find(x=>x.id===id);l.status='approved';
  toast('Leave approved ✅');
  const page=document.getElementById('leaveContent');
  if(page)page.innerHTML=renderLeaveList('pending');
  else navigateTo(currentUser.role==='employee'?'myleaves':'leaves');
  navigateTo(currentUser.role==='employee'?'myleaves':'leaves');
}
function rejectLeave(id){
  const l=DB.leaves.find(x=>x.id===id);l.status='rejected';
  toast('Leave rejected','error');
  navigateTo(currentUser.role==='employee'?'myleaves':'leaves');
}

// ══════════════════════════════════════════════
//  MY LEAVES (employee)
// ══════════════════════════════════════════════
function renderMyLeaves(){
  const myLeaves=DB.leaves.filter(l=>l.empId===currentUser.empId);
  const bal=DB.leaveBalance[currentUser.empId]||{casual:10,sick:10,earned:15};
  return `
  <div class="page-header">
    <div><div class="page-title">My Leaves</div></div>
    <button class="btn btn-primary" onclick="applyLeave()">+ Apply Leave</button>
  </div>
  <div class="three-col" style="margin-bottom:24px">
    ${leaveBalCard('Casual Leave',bal.casual,10,'var(--accent)')}
    ${leaveBalCard('Sick Leave',bal.sick,10,'var(--yellow)')}
    ${leaveBalCard('Earned Leave',bal.earned,20,'var(--green)')}
  </div>
  <div class="card">
    <div class="card-header"><div class="card-title">Leave History</div></div>
    <div class="card-body" style="padding:0">
      ${myLeaves.length===0?'<div class="empty-state"><div class="empty-icon">🏖️</div><div>No leave requests yet</div></div>':
      myLeaves.map(l=>`
        <div style="padding:16px 22px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:600;font-size:13px">${l.type} Leave · ${l.days} day(s)</div>
            <div style="font-size:12px;color:var(--muted);margin-top:3px">${l.from} → ${l.to}</div>
            <div style="font-size:12px;color:var(--muted)">${l.reason}</div>
          </div>
          ${statusBadge(l.status)}
        </div>`).join('')}
    </div>
  </div>`;
}
function leaveBalCard(label,used,total,color){
  const pct=Math.round((used/total)*100);
  return `<div class="card"><div style="padding:18px 20px">
    <div style="font-size:12px;color:var(--muted);margin-bottom:8px">${label}</div>
    <div style="font-family:var(--font-display);font-size:28px;font-weight:700;color:${color}">${used}<span style="font-size:14px;color:var(--muted);font-family:var(--font-body);font-weight:400"> / ${total}</span></div>
    <div style="height:4px;background:var(--surface2);border-radius:2px;margin-top:10px;overflow:hidden">
      <div style="height:100%;width:${pct}%;background:${color};border-radius:2px;transition:width 1s"></div>
    </div>
    <div style="font-size:11px;color:var(--muted);margin-top:6px">${total-used} days remaining</div>
  </div></div>`;
}
function applyLeave(){
  showModal('Apply for Leave',`
    <div class="form-group"><label class="form-label">Leave Type</label>
      <select class="form-input form-select" id="lv_type">
        <option>Casual</option><option>Sick</option><option>Earned</option>
      </select>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">From Date</label><input class="form-input" id="lv_from" type="date"/></div>
      <div class="form-group"><label class="form-label">To Date</label><input class="form-input" id="lv_to" type="date"/></div>
    </div>
    <div class="form-group"><label class="form-label">Reason</label><textarea class="form-input" id="lv_reason" rows="3" style="resize:vertical"></textarea></div>
  `,'<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitLeave()">Submit Request</button>');
}
function submitLeave(){
  const from=document.getElementById('lv_from').value;
  const to=document.getElementById('lv_to').value;
  if(!from||!to){toast('Please select dates','error');return;}
  const days=Math.max(1,Math.ceil((new Date(to)-new Date(from))/(1000*60*60*24))+1);
  DB.leaves.push({id:DB.leaves.length+1,empId:currentUser.empId,type:document.getElementById('lv_type').value,from,to,days,reason:document.getElementById('lv_reason').value,status:'pending'});
  closeModal();toast('Leave request submitted');navigateTo('myleaves');
}

// ══════════════════════════════════════════════
//  ANALYTICS
// ══════════════════════════════════════════════
function renderAnalytics(){
  const totalPayroll=DB.payrollHistory.reduce((s,p)=>s+p.net,0);
  const avgSalary=Math.round(DB.salaryStructures.reduce((s,x)=>s+calcNet(x),0)/DB.salaryStructures.length);
  return `
  <div class="page-header"><div><div class="page-title">Analytics</div><div class="page-sub">Payroll insights and reports</div></div></div>
  <div class="stats-grid">
    <div class="stat-card" style="--stat-color:var(--accent)"><div class="stat-label">Total Disbursed</div><div class="stat-value">${fmt(totalPayroll)}</div><div class="stat-sub">All time</div></div>
    <div class="stat-card" style="--stat-color:var(--green)"><div class="stat-label">Avg Net Salary</div><div class="stat-value">${fmt(avgSalary)}</div><div class="stat-sub">Per employee/month</div></div>
    <div class="stat-card" style="--stat-color:var(--yellow)"><div class="stat-label">Leave Requests</div><div class="stat-value">${DB.leaves.length}</div><div class="stat-sub">${DB.leaves.filter(l=>l.status==='approved').length} approved</div></div>
    <div class="stat-card" style="--stat-color:var(--purple)"><div class="stat-label">Active Employees</div><div class="stat-value">${DB.employees.filter(e=>e.status==='active').length}</div><div class="stat-sub">Across ${DB.departments.length} depts</div></div>
  </div>
  <div class="two-col">
    <div class="card">
      <div class="card-header"><div class="card-title">Salary Distribution by Department</div></div>
      <div class="card-body"><div class="bar-chart">${deptBarRows()}</div></div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">Salary Component Breakdown</div></div>
      <div class="card-body">
        ${componentDonut()}
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:20px">
    <div class="card-header"><div class="card-title">Top Earners</div></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Rank</th><th>Employee</th><th>Department</th><th>Gross</th><th>Net Salary</th></tr></thead>
        <tbody>
          ${DB.salaryStructures.sort((a,b)=>calcNet(b)-calcNet(a)).slice(0,5).map((s,i)=>{
            const e=getEmp(s.empId);const dept=getDept(e.deptId);
            const medals=['🥇','🥈','🥉','4️⃣','5️⃣'];
            return `<tr><td style="font-size:20px">${medals[i]}</td>
              <td><div style="display:flex;align-items:center;gap:8px">${avatar(e.name)}<div><div class="td-name">${e.name}</div><div style="font-size:11px;color:var(--muted)">${e.designation}</div></div></div></td>
              <td>${dept?dept.name:'—'}</td>
              <td class="td-mono" style="color:var(--green)">${fmt(calcGross(s))}</td>
              <td><span style="font-family:var(--font-display);font-size:16px;font-weight:700;color:var(--accent)">${fmt(calcNet(s))}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}
function componentDonut(){
  const totals=DB.salaryStructures.reduce((acc,s)=>{acc.basic+=s.basic;acc.hra+=s.hra;acc.da+=s.da;acc.ta+=s.ta;acc.pf+=s.pfDeduction;acc.esi+=s.esiDeduction;acc.tax+=s.taxDeduction;return acc;},{basic:0,hra:0,da:0,ta:0,pf:0,esi:0,tax:0});
  const total=totals.basic+totals.hra+totals.da+totals.ta;
  const items=[['Basic',totals.basic,'var(--accent)'],[' HRA',totals.hra,'var(--purple)'],['DA',totals.da,'var(--green)'],['TA',totals.ta,'var(--yellow)']];
  return `<div class="bar-chart">${items.map(([l,v,c])=>barRow(l,v,total,c)).join('')}</div>
    <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border)">
      <div style="font-size:12px;color:var(--muted);margin-bottom:8px">Deductions Overview</div>
      <div style="display:flex;gap:16px">
        ${[['PF',totals.pf,'var(--red)'],['ESI',totals.esi,'var(--yellow)'],['Tax',totals.tax,'var(--purple)']].map(([l,v,c])=>`<div style="text-align:center"><div style="font-size:11px;color:var(--muted)">${l}</div><div style="font-weight:700;color:${c};font-family:var(--font-mono)">${fmt(v)}</div></div>`).join('')}
      </div>
    </div>`;
}

// ══════════════════════════════════════════════
//  PROFILE
// ══════════════════════════════════════════════
function renderProfile(){
  const e=getEmp(currentUser.empId);if(!e)return'<div class="empty-state"><div>No profile data</div></div>';
  const s=getSalary(e.id);const dept=getDept(e.deptId);
  return `
  <div class="profile-header">
    <div class="profile-avatar" style="background:${avatarColor(e.name)}22;color:${avatarColor(e.name)}">${initials(e.name)}</div>
    <div>
      <div class="profile-name">${e.name}</div>
      <div class="profile-meta">${e.designation} · ${dept?dept.name:'—'} · Joined ${e.joinDate}</div>
      <div style="margin-top:6px">${statusBadge(e.status)}</div>
    </div>
  </div>
  <div class="two-col">
    <div class="card">
      <div class="card-header"><div class="card-title">Personal Information</div></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:10px">
        ${infoItem('📧 Email',e.email)}${infoItem('📱 Phone',e.phone)}
        ${infoItem('🆔 Employee Code',e.empCode)}${infoItem('🏦 Bank Account',e.bank)}
      </div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">Salary Details</div></div>
      <div class="card-body">
        ${s?`
        <div style="display:flex;flex-direction:column;gap:8px">
          ${[['Basic Pay',s.basic,'var(--text)'],['HRA',s.hra,'var(--text)'],['DA',s.da,'var(--text)'],['TA',s.ta,'var(--text)'],['Gross Salary',calcGross(s),'var(--green)'],['PF Deduction',-s.pfDeduction,'var(--red)'],['ESI Deduction',-s.esiDeduction,'var(--red)'],['Tax Deduction',-s.taxDeduction,'var(--red)']].map(([l,v,c])=>`
            <div style="display:flex;justify-content:space-between;font-size:13px;padding:6px 0;border-bottom:1px solid var(--border)">
              <span style="color:var(--muted)">${l}</span>
              <span style="font-family:var(--font-mono);font-weight:600;color:${c}">${v<0?'-':''}${fmt(Math.abs(v))}</span>
            </div>`).join('')}
          <div style="display:flex;justify-content:space-between;padding:10px 14px;background:var(--accent-glow);border:1px solid rgba(79,142,247,0.2);border-radius:8px;margin-top:4px">
            <span style="font-weight:700">Net Take-Home</span>
            <span style="font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--accent)">${fmt(calcNet(s))}</span>
          </div>
        </div>`:'No salary data'}
      </div>
    </div>
  </div>`;
}

// ══════════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════════
function renderSettings(){
  return `
  <div class="page-header"><div><div class="page-title">Settings</div></div></div>
  <div class="two-col">
    <div class="card">
      <div class="card-header"><div class="card-title">Company Information</div></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:14px">
        <div class="form-group"><label class="form-label">Company Name</label><input class="form-input" value="PayrollPro Inc."/></div>
        <div class="form-group"><label class="form-label">Address</label><input class="form-input" value="123 Market St, San Francisco, CA 94105"/></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-input" value="hr@payrollpro.com"/></div>
        <button class="btn btn-primary" onclick="toast('Company info saved ✅')">Save Changes</button>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">Payroll Settings</div></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:14px">
        <div class="form-group"><label class="form-label">Payroll Run Day</label>
          <select class="form-input form-select"><option>Last Day of Month</option><option>25th of Month</option><option>1st of Next Month</option></select>
        </div>
        <div class="form-group"><label class="form-label">Currency</label>
          <select class="form-input form-select"><option>USD ($)</option><option>INR (₹)</option><option>EUR (€)</option></select>
        </div>
        <div class="form-group"><label class="form-label">PF Rate (%)</label><input class="form-input" value="12"/></div>
        <div class="form-group"><label class="form-label">ESI Rate (%)</label><input class="form-input" value="0.75"/></div>
        <button class="btn btn-primary" onclick="toast('Payroll settings saved ✅')">Save Settings</button>
      </div>
    </div>
  </div>`;
}

// INIT date
document.getElementById('topbarDate').textContent=new Date().toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'});
