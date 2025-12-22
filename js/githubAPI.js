/**
 * GitHub API Helper - FIXED VERSION
 * للتعامل مع ملفات GitHub
 * يسمح بقراءة وتعديل وحذف الملفات مباشرة من GitHub
 * 
 * ✅ FIXES:
 * - معالجة صحيحة للملفات الجديدة (404)
 * - معالجة أفضل للأخطاء
 * - logging تفصيلي
 * - retry mechanism
 */

class GitHubAPI {
  constructor(token, owner, repo, branch = 'main') {
    this.token = token;
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
    this.baseURL = 'https://api.github.com';
    this.maxRetries = 3;
    this.retryDelay = 1000; // ms
  }

  /**
   * الحصول على محتوى ملف من GitHub
   */
  async getFile(path) {
    try {
      console.log(`📖 Fetching file: ${path}`);
      
      const response = await fetch(
        `${this.baseURL}/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}`,
        {
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3.raw',
            'User-Agent': 'TiqtaQo-Admin'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`❌ GitHub API Error: ${response.status}`, errorData);
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      const content = await response.text();
      console.log(`✅ File fetched successfully, size: ${content.length} bytes`);
      return content;
    } catch (error) {
      console.error('❌ Error fetching file:', error);
      throw error;
    }
  }

  /**
   * الحصول على معلومات الملف (SHA وغيرها)
   * ✅ معالجة صحيحة للملفات غير الموجودة
   */
  async getFileInfo(path) {
    try {
      console.log(`📋 Fetching file info: ${path}`);
      
      const response = await fetch(
        `${this.baseURL}/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}`,
        {
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'TiqtaQo-Admin'
          }
        }
      );

      // ✅ معالجة الملفات غير الموجودة
      if (response.status === 404) {
        console.log(`📄 File does not exist (404): ${path}`);
        return {
          exists: false,
          sha: null,
          size: 0
        };
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ GitHub API Error: ${response.status}`, errorData);
        throw new Error(`Failed to fetch file info: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const fileInfo = await response.json();
      console.log(`✅ File info retrieved, SHA: ${fileInfo.sha.substring(0, 7)}...`);
      
      return {
        exists: true,
        sha: fileInfo.sha,
        size: fileInfo.size,
        ...fileInfo
      };
    } catch (error) {
      console.error('❌ Error fetching file info:', error);
      throw error;
    }
  }

  /**
   * تحديث ملف على GitHub
   * ✅ معالجة صحيحة للملفات الجديدة والموجودة
   */
  async updateFile(path, content, message, retryCount = 0) {
    try {
      console.log(`📝 Starting file update: ${path} (attempt ${retryCount + 1}/${this.maxRetries})`);
      
      // الحصول على معلومات الملف الحالي
      const fileInfo = await this.getFileInfo(path);
      
      // تحويل المحتوى إلى Base64
      const encodedContent = btoa(unescape(encodeURIComponent(content)));
      console.log(`🔐 Content encoded, length: ${encodedContent.length} bytes`);

      // ✅ بناء طلب التحديث
      const requestBody = {
        message: message,
        content: encodedContent,
        branch: this.branch
      };

      // ✅ إضافة SHA فقط إذا كان الملف موجوداً
      if (fileInfo.exists && fileInfo.sha) {
        requestBody.sha = fileInfo.sha;
        console.log(`🔄 Updating existing file with SHA: ${fileInfo.sha.substring(0, 7)}...`);
      } else {
        console.log(`✨ Creating new file (no SHA needed)`);
      }

      console.log(`📤 Sending update request...`);
      
      const response = await fetch(
        `${this.baseURL}/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'TiqtaQo-Admin'
          },
          body: JSON.stringify(requestBody)
        }
      );

      console.log(`📊 Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ GitHub API Error Response:`, errorData);
        
        // ✅ Retry mechanism
        if (retryCount < this.maxRetries - 1) {
          console.warn(`⚠️ Update failed, retrying... (${retryCount + 1}/${this.maxRetries - 1})`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          return this.updateFile(path, content, message, retryCount + 1);
        }
        
        throw new Error(`Failed to update file: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ File updated successfully, commit: ${result.commit.sha.substring(0, 7)}...`);
      return result;
    } catch (error) {
      console.error('❌ Error updating file:', error);
      
      // ✅ Retry on network errors
      if (retryCount < this.maxRetries - 1 && error.message.includes('Failed to fetch')) {
        console.warn(`⚠️ Network error, retrying... (${retryCount + 1}/${this.maxRetries - 1})`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.updateFile(path, content, message, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * إنشاء ملف جديد على GitHub
   */
  async createFile(path, content, message) {
    try {
      console.log(`✨ Starting file creation: ${path}`);
      
      const encodedContent = btoa(unescape(encodeURIComponent(content)));

      const response = await fetch(
        `${this.baseURL}/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'TiqtaQo-Admin'
          },
          body: JSON.stringify({
            message: message,
            content: encodedContent,
            branch: this.branch
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ GitHub API Error Response:', errorData);
        throw new Error(`Failed to create file: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ File created successfully: ${result.commit.sha.substring(0, 7)}...`);
      return result;
    } catch (error) {
      console.error('❌ Error creating file:', error);
      throw error;
    }
  }

  /**
   * حذف ملف من GitHub
   */
  async deleteFile(path, message) {
    try {
      console.log(`🗑️ Starting file deletion: ${path}`);
      
      const fileInfo = await this.getFileInfo(path);
      
      if (!fileInfo.exists) {
        throw new Error(`File does not exist: ${path}`);
      }

      const response = await fetch(
        `${this.baseURL}/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'TiqtaQo-Admin'
          },
          body: JSON.stringify({
            message: message,
            sha: fileInfo.sha,
            branch: this.branch
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ GitHub API Error Response:', errorData);
        throw new Error(`Failed to delete file: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ File deleted successfully: ${result.commit.sha.substring(0, 7)}...`);
      return result;
    } catch (error) {
      console.error('❌ Error deleting file:', error);
      throw error;
    }
  }

  /**
   * اختبار الاتصال
   */
  async testConnection() {
    try {
      console.log('🧪 Testing GitHub connection...');
      
      const response = await fetch(
        `${this.baseURL}/user`,
        {
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'TiqtaQo-Admin'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Connection failed: ${response.status}`);
      }

      const user = await response.json();
      console.log(`✅ Connected as: ${user.login}`);
      
      return {
        success: true,
        user: user.login,
        message: 'GitHub connection successful'
      };
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

// تصدير الكلاس
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GitHubAPI;
}