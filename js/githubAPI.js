/**
 * GitHub API Helper - للتعامل مع ملفات GitHub
 * يسمح بقراءة وتعديل وحذف الملفات مباشرة من GitHub
 */

class GitHubAPI {
  constructor(token, owner, repo, branch = 'main') {
    this.token = token;
    this.owner = owner;
    this.repo = repo;
    this.branch = branch;
    this.baseURL = 'https://api.github.com';
  }

  /**
   * الحصول على محتوى ملف من GitHub
   */
  async getFile(path) {
    try {
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
        console.error('GitHub API Error:', response.status, errorData);
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.error('Error fetching file:', error);
      throw error;
    }
  }

  /**
   * الحصول على معلومات الملف (SHA وغيرها)
   */
  async getFileInfo(path) {
    try {
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

      if (!response.ok) {
        const errorData = await response.json();
        console.error('GitHub API Error:', response.status, errorData);
        throw new Error(`Failed to fetch file info: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching file info:', error);
      throw error;
    }
  }

  /**
   * تحديث ملف على GitHub
   */
  async updateFile(path, content, message) {
    try {
      console.log('Starting file update:', path);
      
      // الحصول على معلومات الملف الحالي (للحصول على SHA)
      const fileInfo = await this.getFileInfo(path);
      console.log('File info retrieved, SHA:', fileInfo.sha);
      
      // تحويل المحتوى إلى Base64
      const encodedContent = btoa(unescape(encodeURIComponent(content)));
      console.log('Content encoded, length:', encodedContent.length);

      const requestBody = {
        message: message,
        content: encodedContent,
        sha: fileInfo.sha,
        branch: this.branch
      };

      console.log('Sending update request...');
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

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('GitHub API Error Response:', errorData);
        throw new Error(`Failed to update file: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('File updated successfully:', result.commit.sha);
      return result;
    } catch (error) {
      console.error('Error updating file:', error);
      throw error;
    }
  }

  /**
   * إنشاء ملف جديد على GitHub
   */
  async createFile(path, content, message) {
    try {
      console.log('Starting file creation:', path);
      
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
        console.error('GitHub API Error Response:', errorData);
        throw new Error(`Failed to create file: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('File created successfully:', result.commit.sha);
      return result;
    } catch (error) {
      console.error('Error creating file:', error);
      throw error;
    }
  }

  /**
   * حذف ملف من GitHub
   */
  async deleteFile(path, message) {
    try {
      console.log('Starting file deletion:', path);
      
      const fileInfo = await this.getFileInfo(path);

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
        console.error('GitHub API Error Response:', errorData);
        throw new Error(`Failed to delete file: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      console.log('File deleted successfully:', result.commit.sha);
      return result;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
}