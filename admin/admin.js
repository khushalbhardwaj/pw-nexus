document.addEventListener('DOMContentLoaded', async () => {
    // Authentication Logic
    const ADMIN_EMAIL_KEY = 'gf_admin_email';
    const ADMIN_PASS_KEY = 'gf_admin_pass';
    const ADMIN_AUTH_SESSION = 'gf_admin_auth';

    // Set default credentials if none exist
    if (!localStorage.getItem(ADMIN_EMAIL_KEY)) {
        localStorage.setItem(ADMIN_EMAIL_KEY, 'khushal@pwnexus.com');
        localStorage.setItem(ADMIN_PASS_KEY, '123ho123');
    }

    const loginScreen = document.getElementById('admin-login-screen');
    const mainLayout = document.getElementById('admin-main-layout');
    
    // Check session
    if (sessionStorage.getItem(ADMIN_AUTH_SESSION) === 'true') {
        loginScreen.style.display = 'none';
        mainLayout.style.display = 'flex';
        initAdminDashboard();
    } else {
        loginScreen.style.display = 'flex';
        mainLayout.style.display = 'none';
    }

    // Login Form Submit
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;
        
        const storedEmail = localStorage.getItem(ADMIN_EMAIL_KEY);
        const storedPass = localStorage.getItem(ADMIN_PASS_KEY);
        
        if (email === storedEmail && pass === storedPass) {
            sessionStorage.setItem(ADMIN_AUTH_SESSION, 'true');
            loginScreen.style.display = 'none';
            mainLayout.style.display = 'flex';
            initAdminDashboard();
        } else {
            document.getElementById('login-error').style.display = 'block';
        }
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', () => {
        sessionStorage.removeItem(ADMIN_AUTH_SESSION);
        window.location.reload();
    });

    // Update Credentials Form
    document.getElementById('settings-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const newEmail = document.getElementById('update-email').value;
        const newPass = document.getElementById('update-password').value;
        
        localStorage.setItem(ADMIN_EMAIL_KEY, newEmail);
        localStorage.setItem(ADMIN_PASS_KEY, newPass);
        
        document.getElementById('update-success').style.display = 'block';
        setTimeout(() => {
            document.getElementById('update-success').style.display = 'none';
            document.getElementById('update-email').value = '';
            document.getElementById('update-password').value = '';
        }, 3000);
    });

    // Team Content Management
    const TEAM_DATA_KEY = 'gf_team_data';
    
    // Default Team Data (matching StudyBee screenshot style)
    const defaultTeamData = {
        quote: `"We just love building cool stuff. Our goal is to make a platform that we would actually want to use ourselves."`,
        t1: {
            name: "Manish",
            role: "FOUNDER & ARCHITECT",
            image: "https://decicqog4ulhy.cloudfront.net/128/admin_v1/sample/55314990_instagram.png", // placeholder
            desc: "I started PW Nexus to make learning both accessible and visually amazing. I handle the UI/UX design and the core architecture basically making sure everything feels premium and works without a hitch.",
            edu: "Class 12th (Commerce)",
            batch: "Batch: 2026-2027",
            loc: "Delhi, India",
            remote: "REMOTE AVAILABLE",
            bday: "19 Nov 2008",
            age: "Age: 17 Years",
            proj: "PW NEXUS",
            projRole: "Creator & Architect"
        },
        t2: {
            name: "Prince",
            role: "LEAD DEVELOPER",
            image: "https://decicqog4ulhy.cloudfront.net/128/admin_v1/sample/55314990_instagram.png", // placeholder
            desc: "I handle the core logic and backend systems. I love writing clean, efficient code and fixing complex bugs to ensure the platform runs fast and smooth for everyone.",
            edu: "Class 10th",
            batch: "Batch: 2026-2027",
            loc: "Bangalore, KA",
            remote: "REMOTE AVAILABLE",
            bday: "15 Nov 2009",
            age: "Age: 16 Years",
            proj: "PW NEXUS",
            projRole: "Lead Developer"
        }
    };

    // Wrapping existing logic in an init function so it only runs if logged in
    async function initAdminDashboard() {
    // Tab Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            // Remove active from all panes
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active to clicked nav item
            item.classList.add('active');
            
            // Show target pane
            const target = item.getAttribute('data-tab');
            document.getElementById(`tab-${target}`).classList.add('active');
        });
    });

    // Mobile menu toggle logic
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.admin-sidebar');
    if (mobileBtn && sidebar) {
        mobileBtn.addEventListener('click', () => {
            if (sidebar.style.display === 'flex' || sidebar.style.display === 'block') {
                sidebar.style.display = 'none';
            } else {
                sidebar.style.display = 'flex';
                // ensure it has high z-index and absolute positioning for mobile over the content
                sidebar.style.position = 'absolute';
                sidebar.style.height = '100vh';
                sidebar.style.zIndex = '50';
            }
        });
        
        // Hide sidebar if clicked outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && sidebar.style.display === 'flex') {
                if (!sidebar.contains(e.target) && !mobileBtn.contains(e.target)) {
                    sidebar.style.display = 'none';
                }
            }
        });
    }

    // Load Batches from API
    const tableBody = document.getElementById('batches-table-body');
    const metricBatches = document.getElementById('metric-batches');

    try {
        // Fetch batches via the existing api.js
        const batches = await window.api.getBatches(1);
        
        // Update metric
        metricBatches.innerText = batches.length;

        // Render table
        if (batches.length > 0) {
            tableBody.innerHTML = ''; // clear loading text
            
            batches.forEach(batch => {
                const tr = document.createElement('tr');
                
                tr.innerHTML = `
                    <td>#${batch.id}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <img src="${batch.image}" alt="${batch.name}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover; border: 1px solid #333;">
                            <strong>${batch.name}</strong>
                        </div>
                    </td>
                    <td><span class="status-badge">Active</span></td>
                    <td>&#8377;${batch.price}</td>
                `;
                
                tableBody.appendChild(tr);
            });
        } else {
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center">No batches found from API.</td></tr>`;
        }
            } catch (err) {
            console.error(err);
            metricBatches.innerText = "ERROR";
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger" style="color: #EF4444;">Failed to sync with API. Check console for details.</td></tr>`;
        }

        // Initialize Team Data Form
        // Initialize Team Data Form
        let teamData = null;
        try {
            const res = await fetch('/api/db');
            if (res.ok) {
                teamData = await res.json();
            }
        } catch (err) {
            console.error("Failed to load from DB", err);
        }

        if (!teamData || !teamData.t1) {
            teamData = {
                quote: `"We just love building cool stuff. Our goal is to make a platform that we would actually want to use ourselves."`,
                t1: {
                    name: "Manish",
                    role: "FOUNDER & ARCHITECT",
                    image: "https://i.ibb.co/nsWgY8tV/manish.jpg",
                    desc: "I started PW Nexus to make learning both accessible and visually amazing. I handle the UI/UX design and the core architecture basically making sure everything feels premium and works without a hitch.",
                    edu: "Class 12th (Commerce)",
                    batch: "Batch: 2026-2027",
                    loc: "Delhi, India",
                    remote: "REMOTE AVAILABLE",
                    bday: "19 Nov 2008",
                    age: "Age: 17 Years",
                    proj: "PW NEXUS",
                    projRole: "Creator & Architect"
                },
                t2: {
                    name: "Prince",
                    role: "LEAD DEVELOPER",
                    image: "https://i.ibb.co/v6FKvTf4/prince.jpg",
                    desc: "I handle the core logic and backend systems. I love writing clean, efficient code and fixing complex bugs to ensure the platform runs fast and smooth for everyone.",
                    edu: "Class 10th",
                    batch: "Batch: 2026-2027",
                    loc: "Bangalore, KA",
                    remote: "REMOTE AVAILABLE",
                    bday: "15 Nov 2009",
                    age: "Age: 16 Years",
                    proj: "PW NEXUS",
                    projRole: "Lead Developer"
                }
            };
        }

        // Populate Form
        document.getElementById('team-quote').value = teamData.quote || '';
        ['t1', 't2'].forEach(t => {
            if (teamData[t]) {
                document.getElementById(`${t}-name`).value = teamData[t].name || '';
                document.getElementById(`${t}-role`).value = teamData[t].role || '';
                document.getElementById(`${t}-image`).value = teamData[t].image || '';
                document.getElementById(`${t}-desc`).value = teamData[t].desc || '';
                document.getElementById(`${t}-edu`).value = teamData[t].edu || '';
                document.getElementById(`${t}-batch`).value = teamData[t].batch || '';
                document.getElementById(`${t}-loc`).value = teamData[t].loc || '';
                document.getElementById(`${t}-remote`).value = teamData[t].remote || '';
                document.getElementById(`${t}-bday`).value = teamData[t].bday || '';
                document.getElementById(`${t}-age`).value = teamData[t].age || '';
                document.getElementById(`${t}-proj`).value = teamData[t].proj || '';
                document.getElementById(`${t}-proj-role`).value = teamData[t].projRole || '';
            }
        });

        // Handle Team Form Submit
        document.getElementById('team-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newTeamData = {
                quote: document.getElementById('team-quote').value,
                t1: {},
                t2: {}
            };

            ['t1', 't2'].forEach(t => {
                newTeamData[t] = {
                    name: document.getElementById(`${t}-name`).value,
                    role: document.getElementById(`${t}-role`).value,
                    image: document.getElementById(`${t}-image`).value,
                    desc: document.getElementById(`${t}-desc`).value,
                    edu: document.getElementById(`${t}-edu`).value,
                    batch: document.getElementById(`${t}-batch`).value,
                    loc: document.getElementById(`${t}-loc`).value,
                    remote: document.getElementById(`${t}-remote`).value,
                    bday: document.getElementById(`${t}-bday`).value,
                    age: document.getElementById(`${t}-age`).value,
                    proj: document.getElementById(`${t}-proj`).value,
                    projRole: document.getElementById(`${t}-proj-role`).value
                };
            });

            try {
                const res = await fetch('/api/db', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newTeamData)
                });
                
                if (res.ok) {
                    document.getElementById('team-success').style.display = 'block';
                    setTimeout(() => {
                        document.getElementById('team-success').style.display = 'none';
                    }, 3000);
                } else {
                    const error = await res.json();
                    alert("Failed to save to database: " + error.error);
                }
            } catch (err) {
                alert("Failed to connect to database");
                console.error(err);
            }
        });

    } // End initAdminDashboard
});
