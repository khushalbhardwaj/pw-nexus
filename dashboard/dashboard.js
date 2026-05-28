// dashboard.js - Redesigned UI logic

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const batchId = params.get('batchId');
    const portal = params.get('portal') || 'nexttopper';

    if (!batchId) {
        document.getElementById('batch-title').innerText = "No batch selected.";
        return;
    }

    // 1. Setup Tabs
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            tabLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            link.classList.add('active');
            const targetId = link.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // 2. Load Batch Metadata (Title & Thumbnail)
    try {
        const batches = await api.getBatches(portal);
        const currentBatch = batches.find(b => b.id.toString() === batchId);
        if (currentBatch) {
            document.getElementById('batch-title').innerText = currentBatch.name;
            document.getElementById('batch-thumbnail').style.backgroundImage = `url('${currentBatch.image}')`;
            
            // Populate Overview Tab
            const overviewTab = document.getElementById('overview-tab');
            
            // Format dates
            const formatDate = (unixStamp) => {
                if (!unixStamp) return "TBD";
                return new Date(unixStamp * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            };

            let priceHtml = '';
            if (currentBatch.price === "Free") {
                priceHtml = `<div class="overview-price"><span class="price-free">Free</span></div>`;
            } else {
                priceHtml = `<div class="overview-price">
                    <span class="price-current">&#8377;${currentBatch.price}</span>
                    ${currentBatch.originalPrice ? `<span class="price-original">&#8377;${currentBatch.originalPrice}</span>` : ''}
                </div>`;
            }

            overviewTab.innerHTML = `
                <div class="overview-container">
                    <div class="overview-header">
                        <h2>About this Batch</h2>
                        ${priceHtml}
                    </div>
                    
                    <div class="overview-meta">
                        <div class="meta-item">
                            <span class="meta-label">Start Date:</span>
                            <span class="meta-value">${formatDate(currentBatch.startDate)}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">End Date:</span>
                            <span class="meta-value">${formatDate(currentBatch.endDate)}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Validity:</span>
                            <span class="meta-value">${currentBatch.validTo ? formatDate(currentBatch.validTo) : "Till Exams"}</span>
                        </div>
                    </div>
                    
                    <div class="overview-description">
                        ${currentBatch.description || '<p>No detailed description available for this batch.</p>'}
                    </div>
                </div>
            `;
        } else {
            document.getElementById('batch-title').innerText = `Batch ${batchId}`;
        }
    } catch (err) {
        console.error("Failed to load batch info:", err);
        document.getElementById('batch-title').innerText = `Batch ${batchId}`;
    }

    // 3. Navigation State
    let currentFolderId = null;
    let folderHistory = []; // To support deep navigation if needed

    const contentGrid = document.getElementById('content-grid');
    const breadcrumbContainer = document.getElementById('breadcrumb-container');

    function updateBreadcrumbs() {
        if (!currentFolderId) {
            breadcrumbContainer.innerHTML = `<span>All Folders</span>`;
        } else {
            breadcrumbContainer.innerHTML = `
                <button class="breadcrumb-btn" id="back-to-root">&larr; Back to Folders</button>
            `;
            document.getElementById('back-to-root').addEventListener('click', () => {
                loadRootFolders();
            });
        }
    }

    // 4. Render Root Folders (Subjects)
    async function loadRootFolders() {
        currentFolderId = null;
        updateBreadcrumbs();
        contentGrid.innerHTML = '<p class="loading-text">Loading folders...</p>';

        try {
            const subjects = await api.getSubjects(batchId, portal);
            contentGrid.innerHTML = '';

            if (subjects.length === 0) {
                contentGrid.innerHTML = '<p class="loading-text">No folders available.</p>';
                return;
            }

            subjects.forEach(subject => {
                const card = document.createElement('div');
                card.className = 'folder-card';
                card.onclick = () => loadFolderContent(subject.id);
                
                card.innerHTML = `
                    <div class="folder-icon">
                        <!-- Yellow Folder SVG -->
                        <svg viewBox="0 0 24 24" fill="none" stroke="#F3A912" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </div>
                    <h3>${subject.name}</h3>
                `;
                contentGrid.appendChild(card);
            });
        } catch (err) {
            console.error(err);
            contentGrid.innerHTML = '<p class="loading-text" style="color:red;">Failed to load folders.</p>';
        }
    }

    // 5. Render Folder Content (Videos, PDFs, nested folders)
    async function loadFolderContent(folderId) {
        currentFolderId = folderId;
        updateBreadcrumbs();
        contentGrid.innerHTML = '<p class="loading-text">Loading content...</p>';

        try {
            const items = await api.getFolderContent(batchId, folderId, portal);
            contentGrid.innerHTML = '';

            if (items.length === 0) {
                contentGrid.innerHTML = '<p class="loading-text">This folder is empty.</p>';
                return;
            }

            items.forEach(item => {
                if (item.type === 'folder') {
                    // Nested Folder
                    const card = document.createElement('div');
                    card.className = 'folder-card';
                    card.onclick = () => loadFolderContent(item.id);
                    card.innerHTML = `
                        <div class="folder-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="#F3A912" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </div>
                        <h3>${item.title}</h3>
                    `;
                    contentGrid.appendChild(card);
                } else if (item.type === 'video' || item.type === 'live') {
                    // Video Item
                    const card = document.createElement('div');
                    card.className = 'video-card';
                    // Pass the full downloadUrls array instead of just fileUrl
                    card.onclick = () => openVideo(item.id, item.title, item.fileUrl, item.downloadUrls);
                    
                    const durationStr = item.duration ? `<span>🕒 ${item.duration}</span>` : '';
                    const dateStr = item.date ? `<span>📅 ${item.date}</span>` : '';
                    const thumbStyle = item.thumbnail ? `style="background-image: url('${item.thumbnail}'); background-size: cover; background-position: center;"` : '';
                    
                    card.innerHTML = `
                        <div class="video-card-header">
                            <div class="video-thumb" ${thumbStyle}>
                                <div class="video-icon">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                </div>
                            </div>
                            <h3>${item.title}</h3>
                        </div>
                        <div class="video-meta">
                            ${durationStr}
                            ${dateStr}
                        </div>
                    `;
                    contentGrid.appendChild(card);
                } else if (item.type === 'pdf') {
                    // PDF Item
                    const card = document.createElement('div');
                    card.className = 'video-card'; // Reuse style
                    card.onclick = () => openPdf(item.id, item.title, item.fileUrl);
                    
                    const sizeStr = item.size ? `<span>📄 ${item.size}</span>` : '';
                    
                    card.innerHTML = `
                        <div class="video-card-header">
                            <div class="video-icon" style="color: #E74C3C; background: rgba(231, 76, 60, 0.1);">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            </div>
                            <h3>${item.title}</h3>
                        </div>
                        <div class="video-meta">
                            ${sizeStr}
                        </div>
                    `;
                    contentGrid.appendChild(card);
                }
            });
        } catch (err) {
            console.error(err);
            contentGrid.innerHTML = '<p class="loading-text" style="color:red;">Failed to load content.</p>';
        }
    }

    // Custom Video Player Logic
    const playerView = document.getElementById('custom-player-view');
    const closePlayerBtn = document.getElementById('close-player-btn');
    const videoPlayer = document.getElementById('custom-video-player');
    
    // UI Elements
    const playerBatchBadge = document.getElementById('player-batch-badge');
    const playerVideoTitle = document.getElementById('player-video-title');

    let hlsInstance = null;
    let plyrInstance = null;

    closePlayerBtn.addEventListener('click', closeVideoPlayer);

    function closeVideoPlayer() {
        playerView.classList.remove('active');
        if (plyrInstance) {
            plyrInstance.destroy();
            plyrInstance = null;
        }
        if (hlsInstance) {
            hlsInstance.destroy();
            hlsInstance = null;
        }
        videoPlayer.src = '';
    }

    async function openVideo(contentId, title, directUrl, downloadUrls) {
        playerVideoTitle.innerText = title;
        playerBatchBadge.innerText = document.getElementById('batch-title').innerText;
        playerView.classList.add('active');
        
        try {
            // Try fetching the unlocked URL from the API
            let fileUrl = await api.getLectureDetails(batchId, contentId);
            
            // Fall back to direct URL if unlock API fails
            if (!fileUrl) {
                fileUrl = directUrl;
            }

            if (!fileUrl) {
                alert("Could not load video URL.");
                closeVideoPlayer();
                return;
            }

            playVideoStream(fileUrl);
            
        } catch (err) {
            console.error(err);
            // Fall back to direct URL on error
            if (directUrl) {
                playVideoStream(directUrl);
            } else {
                alert("Error playing video.");
                closeVideoPlayer();
            }
        }
    }

    function playVideoStream(fileUrl) {
        if (hlsInstance) {
            hlsInstance.destroy();
            hlsInstance = null;
        }
        if (plyrInstance) {
            plyrInstance.destroy();
            plyrInstance = null;
        }

        // Default Plyr config for standard files
        const defaultOptions = {
            controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'],
            settings: ['quality', 'speed', 'loop']
        };
        
        if (fileUrl.includes('.m3u8')) {
            if (Hls.isSupported()) {
                hlsInstance = new Hls();
                hlsInstance.loadSource(fileUrl);
                hlsInstance.attachMedia(videoPlayer);
                
                // Map HLS qualities into Plyr settings
                hlsInstance.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
                    const availableQualities = hlsInstance.levels.map(l => l.height);
                    availableQualities.unshift(0); // 0 = Auto
                    
                    const options = {
                        ...defaultOptions,
                        quality: {
                            default: 0,
                            options: availableQualities,
                            forced: true,
                            onChange: (newQuality) => updateQuality(newQuality)
                        }
                    };
                    
                    plyrInstance = new Plyr(videoPlayer, options);
                    
                    // Hook into Plyr quality changes
                    plyrInstance.on('languagechange', () => {
                        // Custom event if needed
                    });
                    
                    videoPlayer.play().catch(e => console.error(e));
                });
            } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
                videoPlayer.src = fileUrl;
                plyrInstance = new Plyr(videoPlayer, defaultOptions);
                videoPlayer.addEventListener('loadedmetadata', function () {
                    videoPlayer.play().catch(e => console.error(e));
                });
            }
        } else {
            // Fallback for direct MP4
            videoPlayer.innerHTML = `<source src="${fileUrl}" type="video/mp4">`;
            plyrInstance = new Plyr(videoPlayer, defaultOptions);
            videoPlayer.play().catch(e => {
                console.error("Auto-play prevented or format not supported directly:", e);
            });
        }
    }

    function updateQuality(newQuality) {
        if (newQuality === 0) {
            hlsInstance.currentLevel = -1; // Auto
        } else {
            hlsInstance.levels.forEach((level, levelIndex) => {
                if (level.height === newQuality) {
                    hlsInstance.currentLevel = levelIndex;
                }
            });
        }
    }

    // PDF Logic
    async function openPdf(contentId, title, directUrl) {
        // Show loading state temporarily
        const oldTitle = playerVideoTitle.innerText;
        playerVideoTitle.innerText = "Loading PDF...";
        
        try {
            // Force fetch unlocked URL from wasmer API
            const fileUrl = await api.getLectureDetails(batchId, contentId);
            
            if (fileUrl) {
                // Open the unlocked PDF in a new tab
                window.open(fileUrl, '_blank');
            } else if (directUrl) {
                // Fallback to direct URL if available
                window.open(directUrl, '_blank');
            } else {
                alert("Could not load PDF URL.");
            }
        } catch (err) {
            console.error(err);
            alert("Error loading PDF.");
        } finally {
            playerVideoTitle.innerText = oldTitle;
        }
    }

    // Initialize Page
    loadRootFolders();
});
