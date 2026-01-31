import api from './api';

class FileService {
  async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.data;
  }

  async deleteFile(fileName: string): Promise<void> {
    await api.delete(`/files/${fileName}`);
  }

  getFileUrl(fileName: string): string {
    return `${api.defaults.baseURL}/files/${fileName}`;
  }
}

export default new FileService();

