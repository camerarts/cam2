
// ==========================================
// 配置区域 / Configuration
// ==========================================
// 1. 请填入您的 Cloudflare Worker 地址 (例如 "https://lumina-upload.yourname.workers.dev")
//    注意：请确保 Worker 代码已更新以支持 auth-setup 接口
export const CLOUD_API_URL: string = "luminaphotos.10125800.xyz"; 

// 2. 密钥 (需与 Worker 代码一致)
export const CLOUD_API_KEY = "lumina_upload_key_123"; 
// ==========================================

export const isCloudConfigured = () => !!CLOUD_API_URL && CLOUD_API_URL.length > 0;

// Helper to ensure URL doesn't end with slash
const getApiUrl = () => CLOUD_API_URL.replace(/\/$/, "");

/**
 * Check if the admin password has already been set in the cloud
 */
export const checkAuthSetup = async (): Promise<boolean> => {
  if (!isCloudConfigured()) return false;
  try {
    const res = await fetch(`${getApiUrl()}?action=auth-check`);
    const data = await res.json();
    return data.isSetup;
  } catch (e) {
    console.error("Cloud Auth Check Failed", e);
    return false;
  }
};

/**
 * Set the admin password in the cloud (First time setup)
 */
export const setupPassword = async (password: string): Promise<boolean> => {
  if (!isCloudConfigured()) return false;
  try {
    const res = await fetch(`${getApiUrl()}?action=auth-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!res.ok) throw new Error(`Server Error: ${res.status}`);
    const data = await res.json();
    return data.success;
  } catch (e) {
    console.error("Cloud Auth Setup Failed", e);
    return false;
  }
};

/**
 * Verify login password against the cloud
 */
export const verifyPassword = async (password: string): Promise<boolean> => {
  if (!isCloudConfigured()) return false;
  try {
    const res = await fetch(`${getApiUrl()}?action=auth-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (!res.ok) throw new Error(`Server Error: ${res.status}`);
    const data = await res.json();
    return data.success;
  } catch (e) {
    console.error("Cloud Auth Verify Failed", e);
    return false;
  }
};

/**
 * Upload image to R2 via Worker
 */
export const uploadImageToCloud = async (base64Data: string): Promise<string> => {
  if (!isCloudConfigured()) return base64Data;

  // Helper: Base64 to Blob
  const base64ToBlob = (base64: string): Blob => {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const blob = base64ToBlob(base64Data);
  
  const response = await fetch(getApiUrl(), {
    method: 'PUT',
    headers: {
      'X-Secret-Key': CLOUD_API_KEY,
      'Content-Type': blob.type
    },
    body: blob
  });

  if (!response.ok) throw new Error('Upload failed');
  
  const data = await response.json();
  return data.url;
};
