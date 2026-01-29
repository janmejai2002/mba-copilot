
const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3/files';

import { GoogleUser } from '../types';

export const googleDrive = {
    async getAppDataFile(accessToken: string, fileName: string) {
        try {
            const listUrl = `${DRIVE_API_URL}/files?q=name='${fileName}' and parents in 'appDataFolder'&spaces=appDataFolder&fields=files(id, name)`;
            const response = await fetch(listUrl, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            const data = await response.json();

            if (data.files && data.files.length > 0) {
                const fileId = data.files[0].id;
                const contentResponse = await fetch(`${DRIVE_API_URL}/files/${fileId}?alt=media`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                return { id: fileId, content: await contentResponse.json() };
            }
            return null;
        } catch (error) {
            console.error('Error fetching from Google Drive:', error);
            return null;
        }
    },

    async saveToAppData(accessToken: string, fileName: string, content: any, existingFileId?: string) {
        try {
            const metadata = {
                name: fileName,
                parents: ['appDataFolder']
            };

            const file = new Blob([JSON.stringify(content)], { type: 'application/json' });
            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
            formData.append('file', file);

            const url = existingFileId
                ? `${UPLOAD_API_URL}/${existingFileId}?uploadType=multipart`
                : `${UPLOAD_API_URL}?uploadType=multipart`;

            const method = existingFileId ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { Authorization: `Bearer ${accessToken}` },
                body: formData
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('UNAUTHORIZED_DRIVE_ACCESS');
                }
                const errorData = await response.json();
                if ((response.status === 403 || response.status === 404) && existingFileId) {
                    console.warn(`File ${existingFileId} inaccessible (status ${response.status}). Retrying as new file...`);
                    return this.saveToAppData(accessToken, fileName, content);
                }
                throw new Error(errorData.error?.message || 'Drive API Error');
            }

            return await response.json();
        } catch (error) {
            console.error('Error saving to Google Drive:', error);
            return null;
        }
    }
};
