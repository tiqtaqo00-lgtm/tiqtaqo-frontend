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
            'Accept': 'application/vnd.github.v3.raw'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
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
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch file info: ${response.statusText}`);
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
      // الحصول على معلومات الملف الحالي (للحصول على SHA)
      const fileInfo = await this.getFileInfo(path);
      
      // تحويل المحتوى إلى Base64
      const encodedContent = btoa(unescape(encodeURIComponent(content)));

      const response = await fetch(
        `${this.baseURL}/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: message,
            content: encodedContent,
            sha: fileInfo.sha,
            branch: this.branch
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update file: ${response.statusText}`);
      }

      return await response.json();
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
      const encodedContent = btoa(unescape(encodeURIComponent(content)));

      const response = await fetch(
        `${this.baseURL}/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: message,
            content: encodedContent,
            branch: this.branch
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create file: ${response.statusText}`);
      }

      return await response.json();
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
      const fileInfo = await this.getFileInfo(path);

      const response = await fetch(
        `${this.baseURL}/repos/${this.owner}/${this.repo}/contents/${path}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: message,
            sha: fileInfo.sha,
            branch: this.branch
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete file: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
}
