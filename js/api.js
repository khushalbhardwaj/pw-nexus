/**
 * Mock API integration for XAMPP backend
 * 
 * Replace the BASE_URL with your actual XAMPP API URL once ready (e.g., http://localhost/pwnexus-api)
 * Ensure that you pass your API keys in the headers or query params as required by your backend.
 */

const BASE_URL = 'http://localhost/api';
const API_KEY = 'dev_key_12345';

const PROXY_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000/api/proxy'
    : '/api/proxy';


window.api = {
    getBatches: async (portal) => {
        try {
            // Fetch ALL courses via all-course endpoint (includes Class 11, CUET, etc.)
            const response = await fetch(`${PROXY_BASE}?endpoint=/course/all-course`, {
                method: 'POST',
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
                    'content-type': 'application/json',
                    'app_id': '1770981347',
                    'platform': '3',
                    'user_id': '0',
                    'Version': '1'
                },
                body: JSON.stringify({
                    view_type: "0",
                    cat_id: "0",
                    cat_parent_id: "0",
                    page: "1",
                    keyword: "",
                    limit: "200",
                    is_free: "0",
                    is_trending: "0"
                })
            });
            const data = await response.json();
            
            if (data.success && data.data && data.data.length > 0) {
                const coursesLayout = data.data.find(layout =>
                    layout.layout_type === 'course_list_layout' &&
                    layout.list && layout.list.length > 0
                );

                if (coursesLayout) {
                    return coursesLayout.list.map(batch => {
                        const price = batch.offer_price;
                        const isFree = price === "0.00" || price === "0" || price === 0;
                        return {
                            id: batch.id,
                            name: batch.title,
                            price: isFree ? "Free" : price,
                            originalPrice: (!isFree && batch.mrp && parseFloat(batch.mrp) > parseFloat(price)) ? batch.mrp : "",
                            rawMrp: batch.mrp,
                            description: batch.description,
                            startDate: batch.start_date,
                            endDate: batch.end_date,
                            validTo: batch.valid_to,
                            class: batch.is_trending || "New",
                            image: batch.thumbnail
                        };
                    });
                }
            }
            return [];
        } catch (err) {
            console.error("Failed to fetch batches from network:", err);
            return [];
        }
    },
    
    getSubjects: async (batchId) => {
        try {
            const response = await fetch(`${PROXY_BASE}?endpoint=/course/all-content`, {
                method: 'POST',
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
                    'content-type': 'application/json',
                    'app_id': '1770981347',
                    'platform': '3',
                    'user_id': '0',
                    'Version': '1'
                },
                body: JSON.stringify({
                    course_id: batchId.toString(),
                    folder_id: "0",
                    parent_course_id: batchId.toString(),
                    page: "1"
                })
            });
            const data = await response.json();
            if (!data.success) {
                throw new Error("Subjects API returned success: false");
            }
            if (data.success && data.data) {
                return data.data.map(item => {
                    return {
                        id: item.entity_id,
                        name: item.title,
                        icon: '📚',
                        progress: 0
                    };
                });
            }
            return [];
        } catch (err) {
            console.error("Failed to fetch subjects from network:", err);
            return [];
        }
    },

    getFolderContent: async (batchId, folderId, ecosystem) => {
        try {
            const response = await fetch(`${PROXY_BASE}?endpoint=/course/all-content`, {
                method: 'POST',
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
                    'content-type': 'application/json',
                    'app_id': '1770981347',
                    'platform': '3',
                    'user_id': '0',
                    'Version': '1'
                },
                body: JSON.stringify({
                    course_id: batchId.toString(),
                    folder_id: folderId.toString(),
                    parent_course_id: batchId.toString(),
                    page: "1"
                })
            });
            const data = await response.json();
            
            if (data.success && data.data) {
                return data.data.map(item => {
                    // Next Toppers API returns "file" for everything, so we check content_type (1 = PDF, 2 = Video)
                    let determinedType = item.type;
                    if (item.type === 'file') {
                        determinedType = item.data?.content_type === 1 ? 'pdf' : (item.data?.is_live ? 'live' : 'video');
                    }
                    
                    let fileUrl = null;
                    let downloadUrls = [];
                    if (item.data?.download_urls) {
                        try {
                            const urls = typeof item.data.download_urls === 'string' ? JSON.parse(item.data.download_urls) : item.data.download_urls;
                            if (Array.isArray(urls) && urls.length > 0) {
                                downloadUrls = urls;
                                fileUrl = urls[urls.length - 1].url; // Default to highest quality
                            }
                        } catch(e) {}
                    }
                    if (!fileUrl && item.data?.file_url) {
                        fileUrl = item.data.file_url;
                    }

                    return {
                        id: item.entity_id,
                        title: item.title,
                        type: determinedType, 
                        duration: item.data?.duration ? Math.floor(item.data.duration / 60) + ' mins' : null,
                        date: item.data?.created_at ? new Date(item.data.created_at * 1000).toLocaleDateString() : null,
                        size: item.data?.size ? (item.data.size / 1024 / 1024).toFixed(1) + ' MB' : null,
                        thumbnail: item.data?.thumbnail || null,
                        fileUrl: fileUrl,
                        downloadUrls: downloadUrls
                    };
                });
            }
            return [];
        } catch (err) {
            console.error("Failed to fetch folder content:", err);
            return [];
        }
    },

    fetchWithAuth: async (endpoint, options = {}) => {
        try {
            const response = await fetch(`https://eduvibe-nt-api.wasmer.app/${endpoint}`, options);
            return await response.json();
        } catch (err) {
            console.error("Fetch with auth error:", err);
            return null;
        }
    },

    getLectureDetails: async (batchId, contentId) => {
        try {
            const response = await fetch(
                `https://eduvibe-nt-api.wasmer.app/content-details?content_id=${contentId}&course_id=${batchId}`
            );
            const data = await response.json();
            if (data.success && data.data) {
                return data.data.file_url || null;
            }
            return null;
        } catch (err) {
            console.error("Failed to fetch lecture details:", err);
            return null;
        }
    },
};
